# Playground UI parameters

What each control in the brand-layer playground does, and how it affects ingest, search, answer, and profile.

The playground talks to `/v3/*`. Isolation is by **brandId / brandTag** at the top of the page — every write and read is scoped to that tag.

---

## Shared: brandId / brandTag

| | |
| --- | --- |
| **What** | Hard isolation boundary for one brand workspace |
| **Required** | Yes for all panels |
| **Effect** | Documents, chunks, memories, and profile are stored and queried only inside this tag |

Example: `brand_airbnb`. Changing the tag switches to a different brand’s memory — it does not merge.

---

## Brand ingest (`POST /v3/documents`)

Write path: accept content → extract → chunk → embed → index → (optional) dream into the fact graph.

### kind

| Value | Input | What happens |
| --- | --- | --- |
| **Markdown / text** | Paste or `.md` / `.txt` | Stored as text/markdown guidelines |
| **PDF** | PDF file | Text extracted with `unpdf` |
| **JSON tokens** | Paste or `.json` | Flattened into `key: value` lines (colors, tokens, etc.) |
| **Web URL** | URL | Firecrawl markdown if `FIRECRAWL_API_KEY` is set; otherwise plain fetch + HTML strip |
| **SVG logo** | Paste or `.svg` | Asset card (metadata + SVG markup), not a full design file store |

`kind` also seeds default **customId** and **metadata** suggestions; you can edit those.

### content / file / url

The actual payload. At least one of content, url, or PDF is required.

| Field | Use |
| --- | --- |
| **content** | Pasted markdown, JSON, or SVG |
| **file picker** | Loads file into content or `pdfBase64` |
| **url** | Only for Web URL kind |

### customId

Stable document identity **inside** the current `brandTag`.

| | Behavior |
| --- | --- |
| **Same customId** | Updates that document: replaces content/url/metadata, re-queues ingest + dream |
| **Different customId** | Creates a new document |
| **Empty** | Always creates a new document (no upsert) |

Examples: `voice`, `brand-guide`, `colors`, `logo_primary_svg`.

Does **not** turn off dreaming. It only controls whether sources stack or overwrite.

### taskType

| Value | Chunks + embed | Dream (fact graph) | Profile updates |
| --- | --- | --- | --- |
| **memory** (default) | Yes | Yes | Yes |
| **superrag** | Yes | No | No |

Use **memory** for brand truth. Use **superrag** when you only need searchable reference text (no atomic brand facts).

### dreaming

Only applies when `taskType` is `memory`.

| Value | Behavior |
| --- | --- |
| **instant** | Dream this document alone as soon as indexing finishes — facts available quickly (good for demos / playground) |
| **dynamic** | Dream job is queued for the normal/grouped path — better for production quality, may lag behind `status: done` |

Document status **done** means chunks are indexed. Memories may still be catching up under `dynamic`.

Keep `bun run trigger:dev` running (with `TRIGGER_SECRET_KEY` set) or ingest/dream tasks will not run.

### metadata JSON

Soft tags stored on the document and often copied onto dreamed memories. Used later for filters.

Common keys:

| Key | Meaning | Examples |
| --- | --- | --- |
| `source` | Where it came from | `brand_guidelines`, `brand_tokens`, `web`, `asset` |
| `category` | Brand fact bucket | `identity`, `assets`, `products`, `campaigns`, `claims`, `restrictions` |
| `assetType` | Asset subtype | `color`, `logo`, `font` |
| `variant` / `market` / `rights` / `usage` | Asset usage context | `primary`, `global`, `public` |

Invalid JSON blocks ingest in the UI.

### Document status (after submit)

| Field | Meaning |
| --- | --- |
| **status** | Pipeline stage: `queued` → `extracting` → … → `done` (or error) |
| **id** | Internal document id (use for polling) |
| **chunks** | How many chunks were indexed |
| **type** | Resolved type (`markdown`, `pdf`, `webpage`, …) |
| **task** / **dreaming** | Echo of what you submitted |

---

## Search / Answer (`POST /v3/search` or `POST /v3/answer`)

Read path over the same `brandTag`.

### Mode: Answer vs Search

| Mode | Endpoint | Returns |
| --- | --- | --- |
| **Answer** | `/v3/answer` | Short generated answer from top memories (+ optional chunk citations) |
| **Search** | `/v3/search` | Raw ranked hits (memories and/or chunks) |

Prefer **Answer** for “what’s our voice / color / claims?” Prefer **Search** when debugging what is stored.

### q

The natural-language question or search query. Required.

### searchMode (Search mode only)

| Value | Searches |
| --- | --- |
| **memories** | Dreamed brand facts (current truth) — default |
| **documents** | Source chunks (RAG grounding) |
| **hybrid** | Both |

For “what’s true now,” prefer **memories**. Chunks can still contain outdated guideline text after an update.

### category filter

Limits results to memories/chunks whose metadata `category` matches:

`identity` · `assets` · `products` · `campaigns` · `claims` · `restrictions`

`(any)` = no category filter.

### limit

Max hits to retrieve (and for Answer, how many memories feed the generator).

| | Search | Answer |
| --- | --- | --- |
| Range | 1–50 | 1–20 |
| UI default | 10 | 10 |

Higher → more context, more noise/cost. Lower → tighter, may miss facts.

### threshold

Minimum vector similarity (0–1) for embedding matches. Higher = stricter.

| | Typical |
| --- | --- |
| Search default | `0.3` |
| Answer API default | `0.25` (UI often uses the same control) |

Also: FTS (keyword) matches can still pass even when similarity is below threshold. Raising threshold cuts weak semantic neighbors; lowering brings more distant hits.

### includeRelated (Search mode only)

When on, expands along memory graph edges (updates / extends / derives) so related facts appear with the hit. Off = only direct search results.

### includeChunks (Answer)

Answer mode always requests chunk citations in the playground (`includeChunks: true`) so the response can cite source text alongside memories.

---

## Brand profile (`POST /v3/profile`)

Always-on brand card synthesized from latest, non-forgotten memories in the `brandTag`.

### includeSearch

| | |
| --- | --- |
| **Off** | Return static + dynamic profile cards only |
| **On** | Also run a hybrid search using optional **q** and nest those hits under the profile |

### q (when includeSearch is on)

Optional query paired with the profile. Empty → profile only (no useful nested search).

### What the cards mean

| Card | Categories | Role |
| --- | --- | --- |
| **Static** | identity, assets, claims, restrictions | Durable brand truth |
| **Dynamic** | products, campaigns | Current / time-sensitive context |

---

## Quick tuning guide

| Goal | Setting |
| --- | --- |
| Fast playground facts | `taskType: memory`, `dreaming: instant`, `bun run trigger:dev` running |
| Re-upload same guideline | Same `customId` (e.g. `voice`) |
| Reference PDF only, no facts | `taskType: superrag` |
| “What’s our voice?” | Answer mode, category `identity` (optional), memories |
| Debug duplicates / old text | Search mode, try `memories` then `documents` |
| Stricter retrieval | Raise **threshold**, lower **limit** |
| Broader retrieval | Lower **threshold**, raise **limit**, enable **includeRelated** |

---

## Related docs

- [architecture.md](./architecture.md) — write/read path overview  
- [pipeline.md](./pipeline.md) — layer map and API surface  
- [brand-memory-system.md](./brand-memory-system.md) — brand categories and dream ops  
- [mcp.md](./mcp.md) — Cursor agent tools (same underlying search/answer/profile)
