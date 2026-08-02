import { queueDocumentIngest } from "@/lib/mcp/ingest";
import { formatBrandKitMarkdown } from "@/lib/brand-kit/format";
import type {
  BrandKitDesignLanguage,
  BrandKitIdentity,
} from "@/lib/brand-kit/schemas";

/** Push a structured kit snapshot into the memory ingest pipeline. */
export async function syncBrandKitToMemory(opts: {
  userId: string;
  brandTag: string;
  identity: BrandKitIdentity;
  designLanguage: BrandKitDesignLanguage;
  sourceUrl?: string | null;
}) {
  const content = formatBrandKitMarkdown({
    identity: opts.identity,
    designLanguage: opts.designLanguage,
    sourceUrl: opts.sourceUrl,
  });

  return queueDocumentIngest(opts.userId, opts.brandTag, {
    content,
    kind: "markdown",
    customId: "brand_kit",
    metadata: {
      source: "brand_kit",
      category: "identity",
    },
    taskType: "memory",
    dreaming: "instant",
  });
}
