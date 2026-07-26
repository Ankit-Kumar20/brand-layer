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
**Pricing exception:** plan price uses `font-display text-5xl` / `lg:text-6xl` with `tracking-[-1px]` — the only oversized display number on the page.
**Copy helpers:** prefer `text-pretty` / `text-balance` on multi-line marketing text. Antialiased rendering; `font-synthesis-weight: none`.
---
## Shape & controls
| Token | Value |
| --- | --- |
| `--radius` | `4px` |
| Button default radius | `rounded` (maps to theme radius) |
| Focus ring | `3px` ring at `ring/50`, border `ring` |
**Buttons** (`components/ui/button.tsx`):
| Variant | Look |
| --- | --- |
| `default` | Solid primary, white text; hover `primary/85` |
| `secondary` | `background-100` fill; hover `background-300` |
| `outline` | Border + sheet fill; hover `background-100` |
| `ghost` / `link` | Minimal |
Hero CTAs override to `h-12 px-7 text-body font-medium`. Section CTAs typically `h-11` full-width or min-width on larger breakpoints.
**Tabs** (MCP Connect): selected = `bg-foreground text-sheet`; idle = muted with `hover:bg-background-100`. Same 300ms `--ease-swift` transitions as nav.
**Cards:** avoided for marketing content. Borders appear only where they frame interaction or structure (pricing grid, step illustration frames, FAQ dividers, connector URL field). No hero cards, no soft elevated card stacks.
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
6. `Features`
7. `Pricing`
8. `Faq`
9. `GetStarted`
10. `Footer`
11. Dev-only `HeroIllustrationGallery` below the sheet (illustration QA)
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
| Features | 2 / 3 columns; hairline `border-t` above list — no cards |
| Connect | Client tabs → steps + URL copy field \| chat transcript mock |
| Pricing | 2-cell bordered grid (price / included list) — interaction container, not a soft card |