import { brandNameFromHostname, hostnameFromUrl } from "@/lib/brand/url";

const USELESS_TITLES = new Set([
  "home",
  "homepage",
  "welcome",
  "untitled",
  "index",
  "main",
  "default",
  "website",
  "official site",
  "official website",
]);

/** Strip site-name suffixes: "Stripe | Payment Infrastructure" → "Stripe". */
export function cleanPageTitle(raw: string): string | null {
  let title = raw.replace(/\s+/g, " ").trim();
  if (!title) return null;

  // Prefer left side of common separators when both sides look like titles.
  for (const sep of [" | ", " – ", " — ", " - ", " · ", " • "]) {
    if (!title.includes(sep.trim()) && !title.includes(sep)) continue;
    const parts = title.split(sep).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      // Prefer shorter left segment as brand name when right looks like a tagline.
      const left = parts[0]!;
      const right = parts.slice(1).join(sep);
      if (left.length <= 48 && (right.length >= left.length || parts.length > 2)) {
        title = left;
      } else if (right.length < left.length && right.length <= 48) {
        title = right;
      } else {
        title = left;
      }
      break;
    }
  }

  title = title.replace(/^the\s+/i, "").trim();
  if (!title || title.length > 80) return null;

  const normalized = title.toLowerCase();
  if (USELESS_TITLES.has(normalized)) return null;

  return title;
}

export type BrandNameCandidates = {
  ogSiteName?: string | null;
  ogTitle?: string | null;
  title?: string | null;
  sourceUrl?: string | null;
};

/**
 * Resolve a brand display name from Firecrawl metadata, with hostname fallback.
 */
export function resolveBrandName(
  candidates: BrandNameCandidates,
  fallbackUrl?: string,
): string {
  const fromOgSite = candidates.ogSiteName
    ? cleanPageTitle(candidates.ogSiteName)
    : null;
  if (fromOgSite) return fromOgSite;

  const fromOgTitle = candidates.ogTitle
    ? cleanPageTitle(candidates.ogTitle)
    : null;
  if (fromOgTitle) return fromOgTitle;

  const fromTitle = candidates.title ? cleanPageTitle(candidates.title) : null;
  if (fromTitle) return fromTitle;

  const url = candidates.sourceUrl || fallbackUrl || "";
  const host = hostnameFromUrl(url);
  if (host) {
    const fromHost = brandNameFromHostname(host);
    if (fromHost) return fromHost;
  }

  return "Untitled Brand";
}
