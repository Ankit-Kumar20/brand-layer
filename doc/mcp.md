# Desin MCP — Build Plan

How to ship an MCP server for brand-layer the way Supermemory does: a **thin protocol shell** over the existing `/v3` API. MCP handles session + tool UX; brand-layer owns ingest, dream, search, profile, and answer.

## Architecture

```text
Cursor / Claude / ChatGPT
        │  MCP (tools + resources)
        ▼
desin MCP server                 ← new (protocol + auth + formatting)
        │  Bearer sm_… → POST /v3/*
        ▼
brand-layer Next API             ← exists today
  documents · search · profile · answer
        │
        ▼
Trigger.dev ingest + dream      ← must run for fresh facts
```

```text
┌─────────────────┐  API key (v1) / OAuth (v2)  ┌──────────────────┐
│   MCP Client    │◄───────────────────────────►│  brand-layer API │
│ (Claude, Cursor)│                             │  (/v3/*)         │
└────────┬────────┘                             └────────▲─────────┘
         │ MCP Protocol                                  │
         ▼                                               │ Auth + CRUD
┌────────────────────────────────────────────────────────┴────────┐
│                     Desin MCP Server                            │
│  • Validate Bearer → session props (brandId, containerTag)      │
│  • Map tools → /v3/documents, /search, /profile, /answer        │
│  • Format answers for agent context windows                     │
└─────────────────────────────────────────────────────────────────┘
```

**Rule:** do not put dreaming or embedding inside MCP. MCP is glue.

## What exists vs gaps

| Needed for MCP | Status |
| --- | --- |
| `POST /v3/documents` | Done |
| `GET /v3/documents/:id` | Done |
| `POST /v3/search` | Done |
| `POST /v3/profile` (+ static/dynamic cards) | Done |
| `POST /v3/answer` | Done (brand advantage vs Supermemory) |
| Brand-scoped API keys (`sm_…` + forced `containerTag`) | Done |
| `GET /v3/session` (key → user / brand / tag) | **Missing** |
| Public forget API | **Missing** (dream-internal forget only) |
| List documents/memories for agents | **Missing** (optional for v1) |
| OAuth authorization server for MCP clients | **Missing** (API key enough for v1) |
| Landing Connect UI (`McpSetup`) | Planned in `desin.md` |

## Auth model

### v1 — API key (ship this first)

```json
{
  "mcpServers": {
    "desin": {
      "url": "https://mcp.desin.ai/mcp",
      "headers": {
        "Authorization": "Bearer sm_…"
      }
    }
  }
}
```

- Prefer **brand-scoped keys** so `containerTag` is forced (same idea as Supermemory `x-sm-project`).
- Never allow public/playground auth on remote MCP.
- Tag MCP writes: `metadata.source: "mcp"` (or `desin_source: "mcp"`).

### v2 — OAuth (later)

- brand-layer Better Auth = **authorization server**
- MCP = **resource server** with `/.well-known/oauth-protected-resource`
- Mirror Supermemory: clients discover auth via metadata; MCP validates tokens against the main API

## Tool surface (brand-native)

Do **not** clone Supermemory’s personal `memory` / `recall` names as the default. Agents need brand truth: voice, assets, claims, restrictions.

| Supermemory | Desin MCP | Core call |
| --- | --- | --- |
| `recall` | **`brandContext`** | `POST /v3/answer` (+ optional profile slice) |
| `memory` save | **`ingest`** | `POST /v3/documents` |
| `memory` forget | **`forget`** (after API) | `POST /v3/memories/forget` |
| profile resource | **`brand://profile`** | `POST /v3/profile` |
| `listMemories` | **`listBrandFacts`** (later) | list docs / memories |
| `memory-graph` | Skip for v1 | nice-to-have |

### v1 tools (keep small)

1. **`brandContext`** (read) — query + optional filters (`category`, `assetType`, `market`, `product`, `isStatic`). Returns a short answer + citations. Primary tool for design/writing agents.
2. **`getBrandProfile`** (read) — static card (identity / assets / claims / restrictions) + dynamic (products / campaigns).
3. **`ingest`** (write) — `content` or `url`, optional `customId`, `kind`, metadata. Returns document id + status.
4. **`search`** (read, optional) — raw memories / hybrid when the agent wants facts, not prose.
5. **`whoAmI`** — brand id, containerTag, key scope (debugging).

### Optional prompt

`brand` — instruct the model: use `brandContext` for voice, colors, claims, and restrictions before writing or designing.

## Deploy options

| Option | When |
| --- | --- |
| **A. Separate Cloudflare Worker** (`apps/mcp`) | Production target — Durable Object sessions, same pattern as Supermemory |
| **B. Next route** (`app/api/mcp`) | Fastest local MVP |
| **C. stdio package** | Local Cursor-only |

**Recommendation:** prove tools with **B**, ship production as **A**, keep the same client URL shape.

Suggested layout (Worker / package):

```text
apps/mcp/   (or packages/mcp)
  src/index.ts      # Hono: /mcp, CORS, Bearer gate
  src/auth.ts       # validate sm_ via GET {API_URL}/v3/session
  src/client.ts     # thin fetch over /v3/* (mirror playground api-client)
  src/server.ts     # McpServer tools + resources
  src/format.ts     # answer + profile → compact agent text
```

`DesinClient` methods: `session`, `ingest`, `search`, `profile`, `answer`, `forget` — wrap brand-layer HTTP, not the Supermemory SDK.

## Build phases

### Phase 0 — Harden API

1. Add `GET /v3/session` → `{ userId, brandId, containerTag }` for key validation.
2. Require Bearer on anything MCP will call in production.
3. Prefer brand-scoped keys for Connect UX.
4. Plan `POST /v3/memories/forget` (id or content) for a later `forget` tool.
5. Ensure Trigger.dev (`bun run trigger:dev` / deployed tasks) runs in every environment that accepts MCP ingest.

### Phase 1 — MCP MVP (API key)

1. Auth gate: Bearer → `/v3/session` → props `{ apiKey, brandId, containerTag }`.
2. Implement `brandContext`, `getBrandProfile`, `ingest`, `whoAmI`.
3. Formatters that stay under agent context limits (answer first, then compact facts).
4. Local Cursor config against `bun dev` + `bun run trigger:dev`.

### Phase 2 — Product surface

1. Landing **McpSetup** (`#connect`) per `desin.md`: client tabs, URL field, create brand key CTA.
2. Docs one-pager: tools, filters, example prompts.
3. Playground parity: same answer/profile paths MCP uses.

### Phase 3 — Production Worker + polish

1. Deploy CF Worker at `https://mcp.<domain>/mcp` with `API_URL` pointing at brand-layer.
2. E2E: ingest guideline → wait dream → `brandContext` for tone / primary color / forbidden claims.
3. Add `forget` + `listBrandFacts` when APIs exist.
4. OAuth when multi-user console + consent are real.

## Success criteria

- Agent with a brand key answers tone / colors / forbidden claims from **latest memories**, not stale chunks alone.
- Re-ingest under the same `customId` → next `brandContext` reflects updates.
- Wrong or missing key → clean 401; brand key cannot see another brand’s container.
- Ingest via MCP is visible in the console with `source: mcp` (or equivalent metadata).

## Non-goals (v1)

- Memory-graph UI inside MCP
- Full OAuth (API key is enough)
- Binary DAM / multi-part file upload via MCP (text + URL ingest only)
- Dreaming or LLM inference inside the MCP process

## Example agent flows

**Read before writing**

1. `getBrandProfile` → always-on identity / restrictions
2. `brandContext` `{ "q": "What is our voice and which claims are forbidden?" }`
3. Draft copy using returned answer + citations

**Update guidelines**

1. `ingest` `{ "content": "…", "customId": "guidelines_v4", "kind": "markdown" }`
2. Poll document status (or wait for dream)
3. `brandContext` again to confirm new truth

## Related docs

- [architecture.md](./architecture.md) — core write/read path
- [brand-memory-system.md](./brand-memory-system.md) — brand workspace model; lists MCP as an integration
- [pipeline.md](./pipeline.md) — `/v3` route map
- [desin.md](./desin.md) — Connect / McpSetup UI patterns
