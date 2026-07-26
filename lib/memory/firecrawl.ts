import Firecrawl from "firecrawl";
import { memoryLog, memoryWarn } from "./log";

/**
 * Scrape a URL to clean markdown via Firecrawl when FIRECRAWL_API_KEY is set.
 * Returns null when the key is missing (caller should use the plain fetch path).
 */
export async function scrapeUrlWithFirecrawl(
  url: string,
): Promise<string | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) return null;

  memoryLog("L2", "firecrawl scrape start", { url });
  const app = new Firecrawl({ apiKey });
  const doc = await app.scrape(url, {
    formats: ["markdown"],
    onlyMainContent: true,
  });

  const markdown = doc.markdown?.trim();
  if (!markdown) {
    memoryWarn("L2", "firecrawl empty markdown", { url });
    throw new Error("Firecrawl returned empty markdown");
  }

  memoryLog("L2", "firecrawl scrape done", {
    url,
    chars: markdown.length,
    title: doc.metadata?.title,
  });
  return markdown;
}
