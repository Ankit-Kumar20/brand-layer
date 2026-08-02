import { createBrandKitFromUrl } from "@/lib/brand-kit/from-url";
import type { BrandWithApiKey } from "@/lib/auth-session";

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
 * Scrape a website with Firecrawl, create a brand + structured brand kit,
 * and queue memory ingest (homepage + kit snapshot).
 */
export async function createBrandFromUrl(
  userId: string,
  input: { url: string; name?: string },
): Promise<CreateBrandFromUrlResult> {
  const result = await createBrandKitFromUrl(userId, input);
  return {
    brand: result.brand,
    apiKey: result.apiKey,
    documentId: result.documentId,
    resolvedName: result.resolvedName,
    sourceUrl: result.sourceUrl,
    metadata: result.metadata,
  };
}
