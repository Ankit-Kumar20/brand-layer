# Brand Memory System — Design

How to evolve brand-layer from a personal-memory playground into a **brand memory OS**: store brand assets and details, keep them current as guidelines change, and let people (and agents) retrieve usable brand truth.

## Goal

Give every brand a living knowledge layer so tools and teams can answer:

- What’s our voice / tone?
- What are primary colors, logos, fonts?
- What claims are approved vs forbidden?
- Which asset variant should I use for X?

…and stay correct when guidelines, products, or campaigns change.

## Core idea

Reuse the existing pipeline (ingest → extract → chunk → embed → index → **dream** → search / profile), but redefine the unit of memory around a **brand workspace**, not a single end-user.

```text
Brand workspace (brandId)
        │
        ├─ Documents / assets (guidelines, PDFs, pages, asset metadata)
        │         ↓ ingest
        ├─ Chunks (RAG / SuperRAG grounding)
        │         ↓ dream
        ├─ Memories (atomic brand facts + graph updates)
        └─ Profile (static brand card + dynamic campaign/product state)
```

## 1. Redefine the unit of memory

| Today (playground) | Brand system |
| --- | --- |
| `containerTag` ≈ user (`user_alex`) | `containerTag` / `brandId` ≈ brand workspace |
| Personal facts (“works at Stripe”) | Brand facts (“primary color is #…”, “never claim X”) |
| One public user | Multi-tenant org → brands → API keys |

**Memory categories** (store as tags/metadata or typed memories):

| Category | Examples | Usually |
| --- | --- | --- |
| **Identity** | Name, mission, voice, values | `isStatic` |
| **Assets** | Logos, colors, fonts, usage rules | `isStatic` |
| **Products** | Features, positioning, naming | mix |
| **Campaigns** | Seasonal messaging, creative briefs | dynamic |
| **Claims** | Approved / legal messaging | static when approved |
| **Restrictions** | Don’t say / don’t use | `isStatic` |

Durable brand truth → **static**. Campaigns and temporary claims → **dynamic** (can update / forget).

## 2. Ingest paths for brand content

Support more than plain chat text:

- **Guidelines** — PDF / markdown brand books, tone docs
- **Web** — product and about pages (`url` ingest)
- **Assets** — structured metadata (type, URL/S3 key, variants, usage rights, markets)
- **Campaign packs** — briefs and approved copy with expiry

Use a stable **`customId`** per source (e.g. `guidelines_v3`, `logo_primary_svg`) so re-upload **updates** the same document identity instead of duplicating.

**Suggested document metadata:**

```json
{
  "source": "brand_guidelines",
  "assetType": "logo",
  "market": "global",
  "product": "core",
  "rights": "internal-only"
}
```

## 3. Dreaming = brand graph learning

After indexing (`status: done`), dreaming extracts atomic brand facts and maintains the graph:

| Op | Brand meaning |
| --- | --- |
| **new** | New fact (“Primary logo is wordmark on dark”) |
| **update** | Guideline changed; old fact `isLatest=false`, new version linked |
| **extend** | Add detail without invalidating the old fact |
| **derive** | Inference (review carefully; prefer human approve for legal claims) |
| **forget** | Retired claim, deprecated asset, expired campaign |

Rules of thumb:

- Prefer **approved / static** facts over one-off campaign copy when they conflict.
- Recompute **brand profile** after dream: static card (identity + assets + restrictions) + dynamic (active campaigns / products).
- Always run the **worker** in environments that enqueue dream jobs (`bun run worker`).

## 4. Search & answer for real users

Keep retrieval modes:

| Mode | Use for |
| --- | --- |
| `memories` | Current brand truth (dreamed facts) |
| `documents` | Source grounding / asset text (chunks) |
| `hybrid` | Both |

**Add an answer layer** on top of search: take top memories (+ optional chunks) and generate a short, citable answer so “what’s our brand voice?” returns usable copy, not only similar rows.

Optional filters: `assetType`, `market`, `product`, `isStatic`.

**Important:** hybrid chunk search will still return outdated source text; product UX should prefer **memories** (or the answer layer) for “what’s true now,” and chunks for citations.

## 5. Product surface

1. **Brand workspace** — org auth, multiple brands, members, roles  
2. **API keys** — scoped per brand (restore auth; drop public-only mode for production)  
3. **Console**
   - Ingest (files, URLs, asset metadata)
   - Document status pipeline
   - Brand profile (static / dynamic)
   - Search + answer playground
4. **Integrations** — REST API, SDK, MCP / agent tools (“pull brand context into design / writing agents”)

## 6. Harden the existing core

Operational and platform work already implied by the current codebase:

- [ ] Run ingest/dream **worker** in prod (dream jobs are not kicked by the API today)
- [ ] Multi-tenant **auth** and brand isolation on all `/v3/*` routes
- [ ] Object storage (e.g. S3) for binary assets; Postgres for metadata + vectors + FTS
- [ ] Rewrite `/v3/*` → `/api/v3/*` (already in `next.config`) kept as public API shape
- [ ] Eval set of brand questions; measure correctness after guideline updates
- [ ] Soft-forget + version history visible in console (audit “why did messaging change?”)

## MVP build order

1. **Brand workspace** + `brandId` isolation (auth + API keys)  
2. **Guideline / asset ingest** (text + URL + asset metadata)  
3. **Dream → brand profile** (static card + dynamic state)  
4. **Search + short generated answer** in console  
5. **Public API** for apps and agents  

## Non-goals (v1)

- Full DAM / creative versioning UI  
- Automatic legal approval of derived claims  
- Replacing design tools — this system supplies **context**, not pixels  

## Success criteria

- Re-ingest updated guidelines → old conflicting facts versioned or forgotten; profile reflects new truth  
- Query “primary logo usage” / “tone” / “forbidden claims” returns correct **latest** memories  
- Agents can fetch brand context with one API call scoped to a brand key  
