import type { BrandingProfile } from "firecrawl";
import { DREAM_MODEL, getOpenAI } from "@/lib/openai";
import type { FirecrawlScrapeResult } from "@/lib/memory/firecrawl";
import { hostnameFromUrl } from "@/lib/brand/url";
import type {
  BrandKitColor,
  BrandKitDesignLanguage,
  BrandKitIdentity,
} from "@/lib/brand-kit/schemas";

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  if (trimmed.length === 4) {
    // #RGB → #RRGGBB
    const r = trimmed[1]!;
    const g = trimmed[2]!;
    const b = trimmed[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return trimmed.toUpperCase();
}

function pushColor(
  colors: BrandKitColor[],
  seen: Set<string>,
  hex: string | undefined,
  role?: string,
) {
  if (!hex) return;
  const normalized = normalizeHex(hex);
  if (!normalized || seen.has(normalized)) return;
  seen.add(normalized);
  colors.push(role ? { hex: normalized, role } : { hex: normalized });
}

function colorsFromBranding(branding: BrandingProfile | null): BrandKitColor[] {
  const colors: BrandKitColor[] = [];
  const seen = new Set<string>();
  if (!branding?.colors) return colors;

  const roleOrder = [
    "primary",
    "secondary",
    "accent",
    "background",
    "textPrimary",
    "textSecondary",
    "link",
  ] as const;

  for (const role of roleOrder) {
    pushColor(colors, seen, branding.colors[role], role);
  }

  for (const [key, value] of Object.entries(branding.colors)) {
    if (roleOrder.includes(key as (typeof roleOrder)[number])) continue;
    if (typeof value === "string") pushColor(colors, seen, value, key);
  }

  return colors.slice(0, 8);
}

function fontsFromBranding(branding: BrandingProfile | null): {
  heading?: string;
  body?: string;
} {
  if (!branding) return {};

  const heading =
    branding.typography?.fontFamilies?.heading ||
    branding.fonts?.find((f) => String(f.role ?? "").includes("heading"))
      ?.family ||
    branding.fonts?.[0]?.family ||
    branding.typography?.fontFamilies?.primary;

  const body =
    branding.typography?.fontFamilies?.primary ||
    branding.fonts?.find((f) => {
      const role = String(f.role ?? "").toLowerCase();
      return role.includes("body") || role.includes("paragraph");
    })?.family ||
    branding.fonts?.[1]?.family ||
    heading;

  return {
    ...(heading ? { heading } : {}),
    ...(body ? { body } : {}),
  };
}

function toneFromBranding(branding: BrandingProfile | null): string[] {
  const tags = new Set<string>();
  if (!branding) return [];

  if (branding.personality?.tone) {
    tags.add(
      branding.personality.tone.charAt(0).toUpperCase() +
        branding.personality.tone.slice(1),
    );
  }
  if (branding.personality?.energy === "high") tags.add("Energetic");
  if (branding.personality?.energy === "low") tags.add("Calm");
  if (branding.tone?.voice) {
    for (const part of branding.tone.voice.split(/[,/|]/)) {
      const t = part.trim();
      if (t) tags.add(t.charAt(0).toUpperCase() + t.slice(1));
    }
  }

  return [...tags].slice(0, 8);
}

function logoFromBranding(branding: BrandingProfile | null): string | undefined {
  if (!branding) return undefined;
  const logo = branding.logo ?? branding.images?.logo ?? undefined;
  if (!logo || logo.startsWith("data:")) return undefined;
  return logo;
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

type SoftFields = {
  description?: string;
  tagline?: string;
  tone: string[];
  aesthetic?: string;
};

async function enrichSoftFields(opts: {
  name: string;
  domain?: string;
  metaDescription?: string;
  markdown: string;
  branding: BrandingProfile | null;
  existingTone: string[];
}): Promise<SoftFields> {
  const fallback: SoftFields = {
    description: opts.metaDescription?.trim() || undefined,
    tone: opts.existingTone,
  };

  try {
    const openai = getOpenAI();
    const brandingHint = opts.branding
      ? JSON.stringify({
          personality: opts.branding.personality,
          tone: opts.branding.tone,
          colorScheme: opts.branding.colorScheme,
        })
      : "{}";

    const completion = await openai.chat.completions.create({
      model: DREAM_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract a concise Trybloom-style brand kit from website scrape data.
Return JSON only:
{
  "description": "1-2 sentence brand description",
  "tagline": "short tagline or empty string",
  "tone": ["3-6 short tone adjectives, Title Case"],
  "aesthetic": "1-2 sentence visual aesthetic summary"
}
Rules: do not invent product claims; ground in the page text; keep tone tags short (one word when possible).`,
        },
        {
          role: "user",
          content: `Brand name: ${opts.name}
Domain: ${opts.domain ?? ""}
Meta description: ${opts.metaDescription ?? ""}
Firecrawl branding hints: ${brandingHint}
Existing tone tags: ${opts.existingTone.join(", ") || "(none)"}

Page markdown (truncated):
${truncate(opts.markdown, 6000)}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as {
      description?: string;
      tagline?: string;
      tone?: string[];
      aesthetic?: string;
    };

    const tone = Array.isArray(parsed.tone)
      ? parsed.tone
          .map((t) => String(t).trim())
          .filter(Boolean)
          .slice(0, 8)
      : [];

    return {
      description:
        parsed.description?.trim() || fallback.description,
      tagline: parsed.tagline?.trim() || undefined,
      tone: tone.length ? tone : fallback.tone,
      aesthetic: parsed.aesthetic?.trim() || undefined,
    };
  } catch {
    return fallback;
  }
}

export type ParsedBrandKit = {
  identity: BrandKitIdentity;
  designLanguage: BrandKitDesignLanguage;
};

/**
 * Map Firecrawl scrape (+ optional LLM soft fields) into a Trybloom-shaped kit.
 */
export async function parseBrandKitFromScrape(opts: {
  scrape: FirecrawlScrapeResult;
  sourceUrl: string;
  brandName: string;
}): Promise<ParsedBrandKit> {
  const { scrape, sourceUrl, brandName } = opts;
  const host = hostnameFromUrl(sourceUrl) ?? undefined;
  const branding = scrape.branding;

  const baseTone = toneFromBranding(branding);
  const soft = await enrichSoftFields({
    name: brandName,
    domain: host,
    metaDescription: scrape.metadata.description,
    markdown: scrape.markdown,
    branding,
    existingTone: baseTone,
  });

  const logoUrl = logoFromBranding(branding);

  const identity: BrandKitIdentity = {
    name: brandName,
    ...(host ? { domain: host } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(soft.description ? { description: soft.description } : {}),
    ...(soft.tagline ? { tagline: soft.tagline } : {}),
  };

  const designLanguage: BrandKitDesignLanguage = {
    colors: colorsFromBranding(branding),
    fonts: fontsFromBranding(branding),
    tone: soft.tone,
    ...(soft.aesthetic ? { aesthetic: soft.aesthetic } : {}),
  };

  return { identity, designLanguage };
}
