import {
  createUserBrand,
  type BrandWithApiKey,
} from "@/lib/auth-session";
import { resolveBrandName } from "@/lib/brand/resolve-name";
import { normalizeWebsiteUrl } from "@/lib/brand/url";
import { scrapeUrlStructured } from "@/lib/memory/firecrawl";
import { queueDocumentIngest } from "@/lib/mcp/ingest";

export type CreateBrandFromUrlResult = {
  brand: Omit<BrandWithApiKey, "apiKey">;
  apiKey: BrandWithApiKey["apiKey"];
  documentId: string;
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
 * Scrape a website with Firecrawl, create a brand from the resolved name,
 * and queue homepage ingest using the already-scraped content (no second scrape).
 */
export async function createBrandFromUrl(
  userId: string,
  input: { url: string; name?: string },
): Promise<CreateBrandFromUrlResult> {
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
        detail: "Set FIRECRAWL_API_KEY to create a brand from a URL",
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

  const queued = await queueDocumentIngest(userId, brand.brandTag, {
    content: scrape.rawText,
    url: sourceUrl,
    kind: "url",
    customId: "homepage",
    metadata: {
      source: "onboarding",
      category: "identity",
    },
    taskType: "memory",
    dreaming: "dynamic",
  });

  return {
    brand,
    apiKey,
    documentId: queued.id,
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
