import { z } from "zod";
import { BRAND_CATEGORIES, INGEST_KINDS } from "@/lib/brand/types";

export const MetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

export const BrandFiltersSchema = z
  .object({
    category: z.enum(BRAND_CATEGORIES).optional(),
    assetType: z.string().min(1).optional(),
    market: z.string().min(1).optional(),
    product: z.string().min(1).optional(),
    isStatic: z.boolean().optional(),
    source: z.string().min(1).optional(),
  })
  .optional();

export const DocumentAddSchema = z
  .object({
    content: z.string().optional(),
    url: z.string().url().optional(),
    pdfBase64: z.string().min(1).optional(),
    kind: z.enum(INGEST_KINDS).optional(),
    containerTag: z.string().min(1).optional(),
    customId: z.string().min(1).optional(),
    metadata: MetadataSchema.optional(),
    taskType: z.enum(["memory", "superrag"]).default("memory"),
    dreaming: z.enum(["dynamic", "instant"]).default("dynamic"),
  })
  .refine(
    (v) =>
      Boolean(v.content?.trim()) ||
      Boolean(v.url) ||
      Boolean(v.pdfBase64?.trim()),
    { message: "Either content, url, or pdfBase64 is required" },
  );

export const SearchSchema = z.object({
  q: z.string().min(1),
  containerTag: z.string().min(1).optional(),
  searchMode: z.enum(["memories", "documents", "hybrid"]).default("memories"),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.3),
  includeRelated: z.boolean().default(false),
  filters: BrandFiltersSchema,
});

export const ProfileSchema = z.object({
  containerTag: z.string().min(1).optional(),
  q: z.string().optional(),
  includeSearch: z.boolean().default(false),
});

export const AnswerSchema = z.object({
  q: z.string().min(1),
  containerTag: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(20).default(8),
  threshold: z.number().min(0).max(1).default(0.25),
  includeChunks: z.boolean().default(true),
  filters: BrandFiltersSchema,
});

export const DreamOpSchema = z.object({
  op: z.enum(["new", "update", "extend", "derive", "forget", "ignore"]),
  memory: z.string().optional(),
  isStatic: z.boolean().optional(),
  category: z.enum(BRAND_CATEGORIES).optional(),
  targetMemoryId: z.string().optional(),
  reason: z.string().optional(),
});

export const DreamOpsResponseSchema = z.object({
  ops: z.array(DreamOpSchema),
});

export type DocumentAddInput = z.infer<typeof DocumentAddSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type AnswerInput = z.infer<typeof AnswerSchema>;
export type DreamOp = z.infer<typeof DreamOpSchema>;
