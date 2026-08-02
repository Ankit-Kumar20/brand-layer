import {
  createUserBrand,
  type BrandWithApiKey,
} from "@/lib/auth-session";
import { resolveBrandName } from "@/lib/brand/resolve-name";
import { normalizeWebsiteUrl } from "@/lib/brand/url";
import { parseBrandKitFromScrape } from "@/lib/brand-kit/parse";
import { upsertBrandKit } from "@/lib/brand-kit/store";
import { syncBrandKitToMemory } from "@/lib/brand-kit/sync-memory";
import type { BrandKitRecord } from "@/lib/brand-kit/schemas";
import { scrapeUrlStructured } from "@/lib/memory/firecrawl";
import { queueDocumentIngest } from "@/lib/mcp/ingest";

export type CreateBrandKitFromUrlResult = {
  brand: Omit<BrandWithApiKey, "apiKey">;
  apiKey: BrandWithApiKey["apiKey"];
  kit: BrandKitRecord;
  documentId: string;
  brandKitDocumentId: string;
  resolvedName: string;
  sourceUrl: string;
  metadata: {
    title?: string;
    ogTitle?: string;
    ogSiteName?: string;
    description?: string;
  };
};

/**
 * Scrape URL → create brand → structured brand kit → memory ingest (homepage + kit).
 */
export async function createBrandKitFromUrl(
  userId: string,
  input: { url: string; name?: string },
): Promise<CreateBrandKitFromUrlResult> {
  const sourceUrl = normalizeWebsiteUrl(input.url);
  if (!sourceUrl) {
    throw Response.json({ error: "Invalid website URL" }, { status: 400 });
  }

  let scrape;
  try {
    scrape = await scrapeUrlStructured(sourceUrl);
  } catch (err) {
    throw Response.json(
      {
        error: "Failed to scrape website",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  if (!scrape) {
    throw Response.json(
      {
        error: "Firecrawl is not configured",
        detail: "Set FIRECRAWL_API_KEY to create a brand kit from a URL",
      },
      { status: 503 },
    );
  }

  const resolvedName =
    input.name?.trim() ||
    resolveBrandName(
      {
        ogSiteName: scrape.metadata.ogSiteName,
        ogTitle: scrape.metadata.ogTitle,
        title: scrape.metadata.title,
        sourceUrl: scrape.metadata.sourceURL ?? sourceUrl,
      },
      sourceUrl,
    );

  const { apiKey, ...brand } = await createUserBrand(userId, {
    name: resolvedName,
  });

  const parsed = await parseBrandKitFromScrape({
    scrape,
    sourceUrl,
    brandName: resolvedName,
  });

  const kit = await upsertBrandKit({
    brandId: brand.id,
    userId,
    brandTag: brand.brandTag,
    sourceUrl,
    status: "ready",
    identity: parsed.identity,
    designLanguage: parsed.designLanguage,
    rawFirecrawl: scrape.branding
      ? (scrape.branding as unknown as Record<string, unknown>)
      : null,
  });

  const homepageDoc = await queueDocumentIngest(userId, brand.brandTag, {
    content: scrape.rawText,
    url: sourceUrl,
    kind: "url",
    customId: "homepage",
    metadata: {
      source: "brand_kit_onboarding",
      category: "identity",
    },
    taskType: "memory",
    dreaming: "dynamic",
  });

  const kitDoc = await syncBrandKitToMemory({
    userId,
    brandTag: brand.brandTag,
    identity: kit.identity,
    designLanguage: kit.designLanguage,
    sourceUrl,
  });

  return {
    brand,
    apiKey,
    kit,
    documentId: homepageDoc.id,
    brandKitDocumentId: kitDoc.id,
    resolvedName,
    sourceUrl,
    metadata: {
      title: scrape.metadata.title,
      ogTitle: scrape.metadata.ogTitle,
      ogSiteName: scrape.metadata.ogSiteName,
      description: scrape.metadata.description,
    },
  };
}
