# desin homepage design

Design system extracted from the marketing homepage. Visual language is inspired by [Devouring Details](https://devouringdetails.com): gray chrome, white sheet, orange signal, dashed construction lines, and a tight type scale.

Source of truth for tokens: `app/globals.css`. Source of truth for composition: `app/page.tsx` + `components/landing/*`.

---

## North star

- **Brand-first hero** — the wordmark `desin` is the H1; the tagline sits under it, never above.
- **Infrastructure, not studio** — calm technical layout; no generation UI, no credit meters, no promo stickers.
- **One job per section** — label + title + one supporting sentence, then content.
- **Sheet on chrome** — page content lives on a centered white sheet against a gray page chrome.
- **Construction lines** — dashed primary-orange hairlines mark sheet edges and section boundaries (blueprint / measurement feel).
- **Light only** — `color-scheme: light`. No dark mode.

---

## Page chrome

| Token | Value | Role |
| --- | --- | --- |
| `--chrome` | `#ededed` | Full-bleed page background (`html` / `body`) |
| `--sheet` | `#ffffff` | Centered content surface |
| `--sheet-max` | `1200px` | Max sheet width |
| `--sheet-pad` | `1rem` → `2rem` at `md` | Horizontal inset inside the sheet |
| `--header-height` | `56px` → `64px` at `md` | Sticky top bar |

**Sheet utility** (`.sheet`): `mx-auto w-full bg-sheet`, capped at `--sheet-max`.

**Sheet edges** (`SheetEdges`): full-height vertical dashed borders in `border-primary` on the left and right of the sheet.

**Section rules** (`SectionRule`): absolute horizontal dashed hairlines in `border-primary` at section top/bottom. Optional `animate-rule` draws left → right on enter.

Scrollbars are hidden on `html` / `body`. Selection uses primary fill + white text.

---

## Color

### Brand / signal

| Token | Hex | Notes |
| --- | --- | --- |
| `--primary` / `--brand` / `--signal` / `--ring` | `#ff5800` | CTAs, labels, rules, checks, focus rings |
| `--primary-foreground` / `--brand-foreground` | `#ffffff` | Text on primary |
| `--signal-soft` / `--accent` | `color-mix(#ff5800 6%, white)` | Soft tint washes |
| Display P3 | `color(display-p3 0.99 0.4 0.02)` | Same orange where P3 is supported |

### Neutrals

| Token | Hex |
| --- | --- |
| `--foreground` | `#171717` |
| `--background` | `#fcfcfc` |
| `--background-50` | `#f8f8f8` |
| `--background-100` | `#f3f3f3` |
| `--background-200` | `#ededed` |
| `--background-300` | `#e8e8e8` |
| `--background-400` | `#e2e2e2` |
| `--background-500` | `#c7c7c7` |
| `--background-600` | `#8f8f8f` |
| `--background-700` | `#6f6f6f` |
| `--muted-foreground` | `#6f6f6f` |
| `--border` / `--input` | `#e2e2e2` |

### Status

| Token | Hex |
| --- | --- |
| `--status-ok` | `#30a46c` |
| `--status-warn` | `#ffb224` |
| `--status-error` / `--destructive` | `#e5484d` |

### Usage rules

- Section **eyebrows / step numbers** → `text-label text-primary`
- Body supporting copy → `text-muted-foreground`
- Dividers and frames → `border-border` (solid), construction guides → `border-primary` (dashed)
- Avoid purple gradients, cream/serif editorial looks, glow effects, and heavy multi-layer shadows

---

## Typography

### Fonts

| Role | Family | Source |
| --- | --- | --- |
| Sans / display | Geist | `next/font/google` → `--font-geist-sans` |
| Mono / labels | Geist Mono | `--font-geist-mono` |

Body uses `font-sans`. Display titles use the same Geist face with tighter tracking (`.font-display` / `text-title`).

### Type scale (DD-inspired)

| Utility | Size | Line height | Weight / tracking | Use |
| --- | --- | --- | --- | --- |
| `text-label` | `13px` | `1.5` | Mono, uppercase, `0.02em` | Eyebrows, step IDs, footer links, meta |
| `text-body` | `16px` | `24px` | Regular `400` | Nav, paragraphs, FAQ questions |
| `text-prose` | `24px` | `40px` | Medium `500` | Taglines, feature/step titles, hero preview |
| `text-title` | `32px` | `36px` | Regular `400`, `-0.4px` | Section H2s, brand H1 |

**Copy helpers:** prefer `text-pretty` / `text-balance` on multi-line marketing text. Antialiased rendering; `font-synthesis-weight: none`.

---

## Shape & controls

| Token | Value |
| --- | --- |
| `--radius` | `4px` |
| Button default radius | `rounded` (maps to theme radius) |
| Focus ring | `3px` ring at `ring/50`, border `ring` |

**Buttons** (`components/ui/button.tsx`) — two CTA types only:

| Variant | Look | Example |
| --- | --- | --- |
| `default` | Solid primary (`#ff5800`), white text; hover `primary/85` | Connect your brand |
| `secondary` | `background-100` fill, foreground text; hover `background-300` | Connect MCP |

`ghost` is reserved for icon-only chrome (e.g. dialog close), not marketing CTAs.

Hero CTAs override to `h-12 px-7 text-body font-medium`. Section CTAs typically `h-11` full-width or min-width on larger breakpoints.

**Tabs** (MCP Connect): selected = `bg-foreground text-sheet`; idle = muted with `hover:bg-background-100`. Same 300ms `--ease-swift` transitions as nav.

**Cards:** avoided for marketing content. Borders appear only where they frame interaction or structure (step illustration frames, FAQ dividers, connector URL field). No hero cards, no soft elevated card stacks.

---

## Motion

| Token / name | Value / behavior |
| --- | --- |
| `--ease-swift` | `cubic-bezier(0.23, 0.88, 0.26, 0.92)` |
| `animate-fade-up` | Opacity + `8px` rise, `0.5s` — hero enter |
| `animate-rule` | Dashed rule `scaleX(0→1)`, `0.7s`, origin left |
| Color / opacity hovers | `duration-300` + `--ease-swift` |

**Hero / step illustration motion** (CSS classes in `globals.css`): flow lines, pulses, scan lines, plug slide, socket flash, isometric reveal (`iso-rise` / `iso-drop` / `iso-fade`), stack-open for Layers plates.

**Reduced motion:** all looping hero/step animations and iso reveals disable under `prefers-reduced-motion: reduce`; reveals snap to final visible state.

---

## Layout patterns

### Page stack

1. Sticky `TopBar`
2. `Hero` (brand + CTAs + integrations + illustration)
3. `HeroPreview` (short prose band between rules)
4. `HowItWorks`
5. `McpSetup` (`#connect`)
6. `Faq`
7. `GetStarted`
8. `Footer`
9. Dev-only `HeroIllustrationGallery` below the sheet (illustration QA)

### Section header (shared)

Two-column header on `md+`:

- Left: `text-label text-primary` eyebrow → `text-title` heading
- Right: `text-body text-muted-foreground` supporting sentence, `self-end`

Vertical rhythm: `py-16 md:py-24` (Get Started slightly shorter: `md:py-20`). Header → content gaps ≈ `mb-12` / `md:mb-14–16`.

### Hero composition

- Min height `min(70vh, 40rem)`, vertically centered
- `lg:grid-cols-2` — copy left, illustration right
- Brand name as `text-title font-medium`
- Tagline as `text-prose text-foreground/80`
- Primary + secondary CTA row; “Works with” icon row underneath
- Fade-up on load

### Content grids

| Section | Structure |
| --- | --- |
| How it works | 3 columns (`sm+`); bordered illustration frame + numbered label + prose title |
| Connect | 3 numbered steps + bordered URL copy strip with client marks — no tabs, no chat mock |
| FAQ | Sticky left intro (`md:sticky md:top-28`) + accordion list with `divide-y` |
| Get started | 2-col end-aligned CTA block |
| Footer | 2-col; wordmark + blurb \| mono uppercase links |

---

## Illustrations

### Hero

Active variant is set in `components/landing/hero-illustration/variants.ts` → `HERO_ILLUSTRATION` (currently **`layers`**).

| ID | Idea |
| --- | --- |
| `layers` | Isometric stack: Sources → Tokens → Context → Agents (fan-open on reveal) |
| `flow` | Sources → brand system → named tools |
| `simple` | Brand → desin → Agents |
| `radial` | Live signal dial |
| `manifest` | Token payload agents read |
| `spectrum` | Specimen matrix + scan line |
| `signal` | Instrument readout |
| `blueprint` | Wordmark under dimension lines |

Illustration language: technical SVG diagrams, hairlines, mono captions, orange accents — not photographic or decorative gradients.

### How-it-works steps

Pinned isometric SVGs (`STEP_ILLUSTRATIONS`):

| Step | Motif |
| --- | --- |
| `01` | Kit |
| `02` | Plug into socket (looping plug slide + socket flash) |
| `03` | Grid |

Shared iso math: true 30° projection (`iso.tsx`). Scroll-triggered reveal via `IsoReveal` (`is-shown` + staggered `--iso-delay`).

### Integrations

Icon-only marks (Claude, Cursor, ChatGPT, Codex, OpenClaw). Names live in surrounding copy / `sr-only`, not as pill chips.

---

## Top bar

- Sticky, `bg-sheet/90 backdrop-blur-md`, height `h-14` / `md:h-16`
- Wordmark left (`text-body font-medium tracking-tight`)
- Center nav (Platform / Connect / FAQ) — hidden below `md`
- Sign in / Dashboard right (`Button` `size="sm"`)
- Bottom animated `SectionRule`

---

## Do / don’t (homepage)

**Do**

- Keep the brand name as the strongest hero signal
- Use dashed primary rules and sheet edges for structure
- Prefer open typography grids over card grids
- Keep motion purposeful (enter, draw, reveal) and respect reduced motion
- Stay light, gray + white + `#ff5800`

**Don’t**

- Overlay badges, floating chips, or promo stickers on the hero
- Put stats strips, schedules, or secondary marketing in the first viewport
- Introduce purple/indigo themes, cream+serif editorial defaults, or glow-heavy dark UI
- Soften everything into rounded-full pills and multi-shadow cards
- Hide scrollbars inconsistently — the page intentionally hides them globally
