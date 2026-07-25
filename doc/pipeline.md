# Pipeline — Layer Map for brand-layer

Implementation map of the core memory architecture as layers you can build inside `brand-layer` (Next.js + Better Auth + Drizzle + Postgres). Start as one app; split a separate `memory-core` only when jobs get heavy.

## Current baseline

Already in place:

- Next.js app
- Better Auth (`lib/auth.ts`, `app/api/auth/[...all]`)
- Drizzle + Postgres (`db/schema.ts`)

---

## L0 — Tenancy / product shell

**Build first.** Auth is mostly done; finish multi-tenant identity.

| Piece | Implement |
| --- | --- |
| Auth | Better Auth (done) |
| Org / project | `organizations`, `projects` tables |
| API keys | `api_keys` (hashed); middleware on `/v3/*` |
| Isolation key | every row has `containerTag` + `projectId` |
| Console | list docs / memories / search playground |

---

## L1 — Ingest API (write entry)

| Piece | Implement |
| --- | --- |
| Routes | `POST /v3/documents`, `GET /v3/documents/:id` |
| Input | text · URL · file upload (R2/S3 later) |
| Fields | `content`, `containerTag`, `customId`, `taskType`, `metadata`, `dreaming` |
| Table | `documents` → `id`, status, content hash, customId, taskType, timestamps |
| Behavior | accept → set `queued` → enqueue job → return id |

---

## L2 — Extract (`status: extracting`)

| Piece | Implement |
| --- | --- |
| Text | passthrough |
| URL | fetch + readability / html→text |
| PDF | `pdf-parse` / unpdf |
| Image / audio | skip v1 or call Gemini / Whisper later |
| Output | normalized `rawText` on document |

---

## L3 — Chunk (`status: chunking`)

| Piece | Implement |
| --- | --- |
| Strategy | semantic / paragraph split + overlap (start simple: ~500–800 tokens) |
| Table | `chunks` → `documentId`, `index`, `text`, `tokenCount`, `metadata` |
| SuperRAG-only | stop after L4–L5; no dreaming |

---

## L4 — Embed (`status: embedding`)

| Piece | Implement |
| --- | --- |
| Model | OpenAI `text-embedding-3-small` (or local later) |
| Store | `chunks.embedding vector(1536)` via **pgvector** |
| Also embed | memory fact text when created |

---

## L5 — Index (`status: indexing` → `done`)

| Piece | Implement |
| --- | --- |
| Vector index | HNSW / IVFFlat on embeddings |
| FTS | `tsvector` on chunk + memory text |
| Done | document searchable via `searchMode: documents` |

---

## L6 — Dreaming / learning model (hard core)

| Piece | Implement |
| --- | --- |
| Trigger | after `done`; `instant` = same job; `dynamic` = batch by container / customId |
| LLM job | extract atomic facts from text + existing memories in container |
| Prompt ops | classify each fact: **new / update / extend / derive / ignore / forget** |
| Dedup | embedding similarity + LLM resolve conflicts |
| Table | `memories` → text, `isStatic`, `isLatest`, embedding, containerTag, sourceDocumentIds |
| Edges | `memory_edges` → `fromId`, `toId`, `type` ∈ `updates \| extends \| derives` |
| Profile refresh | recompute static / dynamic lists (or cache table `profiles`) |

---

## L7 — Graph store (temporal vector-graph)

| Piece | Implement |
| --- | --- |
| Truth | query only `isLatest = true` by default |
| History | keep old memories linked by `updates` |
| Forget | soft-delete / `forgottenAt` + drop from profile |
| Expand | on search, walk 1–2 hops of edges |

---

## L8 — Retrieve (read path)

| Piece | Implement |
| --- | --- |
| `POST /v3/search` | embed query → vector ANN + FTS → merge → filter metadata → optional edge expand → rank |
| Modes | `memories` \| `documents` \| `hybrid` |
| `POST /v3/profile` | return `{ static, dynamic, buckets? }` for `containerTag` (+ optional `q` / `filters`) |
| Rank signals | score, recency, static boost, edge strength |

---

## L9 — Workers (glue)

| Piece | Implement |
| --- | --- |
| Queue | start: DB `jobs` table + poller; later: Inngest / BullMQ / CF Workflows |
| Pipeline | one worker runs L2→L5; separate worker for L6 |
| Idempotency | content hash + `customId` upsert |

---

## Suggested folder map

```text
app/api/v3/documents/     # L1
app/api/v3/search/        # L8
app/api/v3/profile/       # L8
db/schema.ts              # docs, chunks, memories, edges, jobs, api_keys
lib/memory/
  extract.ts              # L2
  chunk.ts                # L3
  embed.ts                # L4
  index.ts                # L5
  dream.ts                # L6 (LLM)
  search.ts               # L8
  profile.ts              # L8
workers/ingest.ts         # L9
```

---

## Build order

1. **L0** — keys + `containerTag`
2. **L1** — accept document + status
3. **L3–L5** — text-only RAG (chunk / embed / search documents)
4. **L8** — document search
5. **L6** — dream + memories + edges
6. **L8** — memory / hybrid search + profile
7. **L2** — multimodal extractors + connectors later

### MVP that feels like Supermemory

**L0 → L1 → L3–L5 → L6 → L8**

Skip fancy extractors and connectors until search + profile work on plain text.

---

## End-to-end flow

```text
Client
  │  API key + containerTag
  ▼
L1 Ingest ──queued──► L9 Worker
                          │
                    L2 Extract
                          │
                    L3 Chunk
                          │
                    L4 Embed (pgvector)
                          │
                    L5 Index (vector + FTS) ──► status: done
                          │
                    L6 Dream (LLM) ──► memories + edges
                          │
                    L7 Graph / profile cache
                          │
Client ◄── L8 Search / Profile
```

See also: [architecture.md](./architecture.md) for conceptual core design.
