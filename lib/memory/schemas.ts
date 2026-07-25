import { z } from "zod";

export const MetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

export const DocumentAddSchema = z
  .object({
    content: z.string().optional(),
    url: z.string().url().optional(),
    containerTag: z.string().min(1),
    customId: z.string().min(1).optional(),
    metadata: MetadataSchema.optional(),
    taskType: z.enum(["memory", "superrag"]).default("memory"),
    dreaming: z.enum(["dynamic", "instant"]).default("dynamic"),
  })
  .refine((v) => Boolean(v.content?.trim()) || Boolean(v.url), {
    message: "Either content or url is required",
  });

export const SearchSchema = z.object({
  q: z.string().min(1),
  containerTag: z.string().min(1),
  searchMode: z.enum(["memories", "documents", "hybrid"]).default("hybrid"),
  limit: z.number().int().min(1).max(50).default(10),
  threshold: z.number().min(0).max(1).default(0.3),
  includeRelated: z.boolean().default(false),
});

export const ProfileSchema = z.object({
  containerTag: z.string().min(1),
  q: z.string().optional(),
  includeSearch: z.boolean().default(false),
});

export const DreamOpSchema = z.object({
  op: z.enum(["new", "update", "extend", "derive", "forget", "ignore"]),
  memory: z.string().optional(),
  isStatic: z.boolean().optional(),
  targetMemoryId: z.string().optional(),
  reason: z.string().optional(),
});

export const DreamOpsResponseSchema = z.object({
  ops: z.array(DreamOpSchema),
});

export type DocumentAddInput = z.infer<typeof DocumentAddSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type DreamOp = z.infer<typeof DreamOpSchema>;
