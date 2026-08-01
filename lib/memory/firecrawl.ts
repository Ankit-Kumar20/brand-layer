import Firecrawl from "firecrawl";
import type { BrandingProfile } from "firecrawl";
import { memoryLog, memoryWarn } from "./log";

/** Cap huge data: URIs (inline SVG logos) so ingest stays tractable. */
function assetRef(value: string | null | undefined, max = 240): string | null {
  if (!value) return null;
  if (value.startsWith("data:") && value.length > max) {
    return `${value.slice(0, max)}…`;
  }
  return value;
}

function pushRecord(
  lines: string[],
  prefix: string,
  record: Record<string, unknown> | undefined,
) {
  if (!record) return;
  for (const [key, value] of Object.entries(record)) {
    if (value == null || value === "") continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      pushRecord(lines, `${prefix}.${key}`, value as Record<string, unknown>);
      continue;
    }
    const rendered = Array.isArray(value) ? value.join(", ") : String(value);
    if (!rendered.trim()) continue;
    lines.push(`${prefix}.${key}: ${rendered}`);
  }
}

/** Flatten Firecrawl branding into dream-friendly fact lines. */
export function formatBrandingProfile(branding: BrandingProfile): string {
  const lines: string[] = ["Brand identity extracted from page:"];

  if (branding.colorScheme) {
    lines.push(`colorScheme: ${branding.colorScheme}`);
  }

  const logo = assetRef(branding.logo ?? branding.images?.logo);
  if (logo) lines.push(`logo: ${logo}`);
  const favicon = assetRef(branding.images?.favicon);
  if (favicon) lines.push(`favicon: ${favicon}`);
  const ogImage = assetRef(branding.images?.ogImage);
  if (ogImage) lines.push(`ogImage: ${ogImage}`);

  if (branding.fonts?.length) {
    for (const font of branding.fonts) {
      const role =
        typeof font.role === "string" ? ` (${font.role})` : "";
      lines.push(`font: ${font.family}${role}`);
    }
  }

  pushRecord(lines, "colors", branding.colors as Record<string, unknown> | undefined);
  pushRecord(
    lines,
    "typography",
    branding.typography as Record<string, unknown> | undefined,
  );
  pushRecord(
    lines,
    "spacing",
    branding.spacing as Record<string, unknown> | undefined,
  );
  pushRecord(
    lines,
    "components",
    branding.components as Record<string, unknown> | undefined,
  );
  pushRecord(lines, "icons", branding.icons as Record<string, unknown> | undefined);
  pushRecord(lines, "layout", branding.layout as Record<string, unknown> | undefined);
  pushRecord(lines, "tone", branding.tone as Record<string, unknown> | undefined);

  if (branding.personality) {
    lines.push(`personality.tone: ${branding.personality.tone}`);
    lines.push(`personality.energy: ${branding.personality.energy}`);
    lines.push(
      `personality.targetAudience: ${branding.personality.targetAudience}`,
    );
  }

  return lines.length > 1 ? lines.join("\n") : "";
}

/**
 * Scrape a URL to clean markdown + brand identity via Firecrawl when
 * FIRECRAWL_API_KEY is set. Returns null when the key is missing (caller
 * should use the plain fetch path).
 */
export async function scrapeUrlWithFirecrawl(
  url: string,
): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) {
    memoryLog("L2", "firecrawl unavailable", {
      reason: "missing_FIRECRAWL_API_KEY",
    });
    return null;
  }

  memoryLog("L2", "firecrawl scrape start", { url });
  const app = new Firecrawl({ apiKey });
  const doc = await app.scrape(url, {
    formats: ["markdown", "branding"],
    onlyMainContent: true,
  });

  const markdown = doc.markdown?.trim() ?? "";
  const brandingText = doc.branding
    ? formatBrandingProfile(doc.branding)
    : "";

  if (!markdown && !brandingText) {
    memoryWarn("L2", "firecrawl empty markdown+branding", { url });
    throw new Error("Firecrawl returned empty markdown and branding");
  }

  const parts = [
    brandingText || null,
    markdown ? `Page content:\n${markdown}` : null,
  ].filter(Boolean) as string[];

  const rawText = parts.join("\n\n");

  memoryLog("L2", "firecrawl scrape done", {
    url,
    chars: rawText.length,
    hasMarkdown: Boolean(markdown),
    hasBranding: Boolean(brandingText),
    title: doc.metadata?.title,
  });
  return rawText;
}
