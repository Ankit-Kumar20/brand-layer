# Core Architecture

Target architecture for a Supermemory-style memory and context engine. This document describes the **core** — how raw input becomes searchable knowledge and a living fact graph — not the product shell (auth, console, billing).

## Overview

The core is not a vector-database wrapper. It is two cooperating systems:

| Component | Role |
| --- | --- |
| **Learning model** | Decides what to remember, what is important, when to forget, and how facts relate |
| **Temporal vector-graph engine** | Stores learnings for search — facts with vectors, full-text search (FTS), and graph edges over time |

One write produces three outputs in the same isolation boundary (`containerTag`):

1. **Document chunks** — source text for RAG / SuperRAG grounding  
2. **Memories** — atomic facts in a living knowledge graph  
3. **Profile** — always-on static + dynamic summary of those memories  

```text
                    WRITE PATH
┌──────────────┐   queued → extract → chunk → embed → index
│  Document    │ ──────────────────────────────────────────► Document chunks (RAG)
│ (chat/PDF/…) │                    │
└──────────────┘                    ▼
                              "Dreaming"
                         (memory learning model)
                                    │
                    extract facts · merge · forget
                                    ▼
                         Temporal knowledge graph
                    (updates / extends / derives)
                                    │
                                    ▼
                              User Profile
                         (static + dynamic facts)

                    READ PATH
Query ──► hybrid search (vector + FTS + graph edges)
       ──► profile() for always-on context
```

## Documents vs memories

| | **Documents** | **Memories** |
| --- | --- | --- |
| **What** | Raw input you send | Facts the engine extracts |
| **Examples** | PDF, chat log, URL, connector file | “Alex is a PM at Stripe” |
| **Role** | Source of truth for RAG | Personal / entity state over time |
| **Lifecycle** | Add / update / delete | Graph updates, extends, derives, forgets |

Documents are books you hand the system. Memories are the insights it keeps — connected as new content arrives.

**Why this split matters:** plain RAG finds similar text but misses temporal progression. Memory tracks that “loved Adidas” → “broke” → “switching to Puma,” so retrieval returns the current truth, not the highest cosine match to an outdated fact.

## Ingest pipeline

Every document goes through a status machine:

| Stage | What happens |
| --- | --- |
| **Queued** | Accepted; waiting to run |
| **Extracting** | Text / OCR / transcription / page fetch |
| **Chunking** | Type-aware semantic splits (not fixed token windows only) |
| **Embedding** | Vectors for similarity search |
| **Indexing** | Chunks and derived structure become searchable |
| **Done** | Document path ready for search |

Supported inputs include conversation transcripts, text/markdown/HTML, PDFs, images, audio/video, code, URLs, and connector items (Drive, Notion, Gmail, etc.). Callers do not pre-chunk or pick an embedding model.

Use a stable **`customId`** when the same conversation or file will be re-ingested later (sessions, connector syncs). Re-ingest under the same identity can diff against already-seen content.

### Task types

| | `taskType: "memory"` (default) | `taskType: "superrag"` |
| --- | --- | --- |
| Chunk → embed → index | Yes | Yes |
| Fact extraction into memories | Yes | No |
| Profile updates | Yes | No |
| Graph linking | Yes | No |

Use SuperRAG for pure reference material (docs, wikis) when you only need searchable chunks, not personal facts.

## Dreaming (graph formation)

Document status **`done`** means chunks are indexed. **Memories** enter the graph in a second phase called **dreaming** — content is passed through the memory model, then merged and organized.

| Mode | Default? | Behavior | When to use |
| --- | --- | --- | --- |
| **`dynamic`** | Yes | Related documents are grouped so memories form from coherent units. Extraction may continue after `done`. | Production agents, connectors, ongoing sessions |
| **`instant`** | No | This document is dreamed alone, immediately. Memories available as soon as processing finishes. | Demos, quickstarts, “need graph now” |

Prefer **`dynamic`** for quality in real apps; use **`instant`** when the next step must reflect this document immediately.

## Graph memory model

Memories are **atomic** (one topic per fact) and **build on each other**. Edges are not hand-maintained entity–relation–entity triples; the learning model creates them.

### Relationship types

**Updates** — new fact replaces what was true; history can remain for audit.

```text
Memory 1: "Alex works at Google as a software engineer"
Memory 2: "Alex just started at Stripe as a PM"
         → Memory 2 UPDATES Memory 1  (isLatest = true)
```

**Extends** — new fact adds detail without invalidating the old one.

```text
Memory 1: "Alex works at Stripe as a PM"
Memory 2: "Alex focuses on payments and leads a team of 5"
         → Memory 2 EXTENDS Memory 1
```

**Derives** — system infers a fact never stated in one place, from patterns across memories.

```text
Memory 1: "Alex is a PM at Stripe"
Memory 2: "Alex frequently discusses payment APIs and fraud detection"
         → Derived: "Alex likely works on Stripe's core payments product"
```

```text
    [Memory A]
    /    |    \
Updates Extends Derives
   /      |      \
 [B]     [C]     [D]
```

### Static vs dynamic memories

| | Static | Dynamic |
| --- | --- | --- |
| Nature | Permanent facts | Contextual / episodic |
| Examples | Name, role, durable preferences | Recent projects, last conversation topics |
| Retrieval | High priority; always-on in profiles | Time-sensitive relevance |

### Versioning

`Updates` edges keep `isLatest` so retrieval defaults to current truth while full history remains available.

## Retrieval

### Hybrid search

1. **Embed the query**  
2. **Similarity** (e.g. cosine) against chunk / memory vectors  
3. **Threshold filter**  
4. **Relationship expansion** along updates / extends / derives  
5. **Rank** by similarity, recency, static vs dynamic priority, edge strength, metadata  

Combine with structured **metadata filters** (`AND` / `OR`) inside a container. Optional **rerank** can re-score for relevance at a small latency cost.

Search modes typically cover:

- **Memories** — fact graph  
- **Documents** — chunk RAG  
- **Hybrid** — both in one query  

### User profiles

Profiles are synthesized from memories in a `containerTag` — not a separate store you maintain by hand.

| Slice | Source | Role |
| --- | --- | --- |
| **Static** | Stable facts | Always-on identity (name, prefs, role) |
| **Dynamic** | Recent activity | Current focus / context |
| **Buckets** | Classifier over facts | Optional org of preferences, goals, etc. |

Profiles solve what search cannot: facts that should color *every* response (e.g. preferred name) even when they are not semantically similar to the current query. Profile fetch is designed to be cheap (~50ms class) and attachable to every turn without a search round trip.

Metadata filters on `profile()` narrow which memories contribute to the synthesis.

## Isolation and identity

| Concept | Role |
| --- | --- |
| **`containerTag`** | Hard isolation boundary (user, tenant, project, agent) |
| **Metadata** | Soft dimensions *inside* a tag for filtering |
| **Scoped API keys** | Credentials that cannot cross a container |
| **`customId`** | Stable document identity for re-ingest / session continuity |

```text
┌─────────────────────────────────┐
│  user_123                       │
│  ├── Memories + chunks          │
│  └── Profile                    │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│  org_acme                       │
│  ├── Memories + chunks          │
│  └── Profile                    │
└─────────────────────────────────┘
```

## API surface (conceptual)

**Write**

- `add` / documents — ingest content (memory or SuperRAG path)  
- Status polling until `done` (dreaming may continue afterward in `dynamic` mode)  

**Read**

- `search` — hybrid / memory / document search  
- `profile` — static + dynamic (+ optional buckets)  

**Memory operations**

- Forget / review / related memories — graph maintenance beyond raw CRUD  

## How this maps to brand-layer

`brand-layer` should own the **product shell**:

- Auth, orgs, API keys, console UI, billing  

The **core** (this document) should live as a separate memory service that `brand-layer` calls:

- Ingest pipeline + dreaming  
- Temporal vector-graph store  
- Search + profile APIs  

Suggested split:

```text
brand-layer (Next.js + Better Auth + Drizzle)
    │  API keys, projects, dashboard
    ▼
memory-core service
    │  ingest → extract → chunk → embed → index
    │  dream → graph → profile
    ▼
Postgres (+ vectors) / object storage / queue or workflows
```

## Summary

```text
Ingest → Index chunks (RAG) → Dream into temporal fact graph → Retrieve via hybrid search or profile
```

That dual path — **chunks for grounding** and **memories for understanding over time** — is the core architecture to build.
