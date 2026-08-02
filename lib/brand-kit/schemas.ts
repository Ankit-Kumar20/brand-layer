import { z } from "zod";

export const BrandKitColorSchema = z.object({
  hex: z.string().min(1),
  role: z.string().min(1).optional(),
});

export const BrandKitIdentitySchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  logoUrl: z.string().optional(),
  description: z.string().optional(),
  tagline: z.string().optional(),
});

export const BrandKitDesignLanguageSchema = z.object({
  colors: z.array(BrandKitColorSchema).default([]),
  fonts: z
    .object({
      heading: z.string().optional(),
      body: z.string().optional(),
    })
    .default({}),
  tone: z.array(z.string().min(1)).default([]),
  aesthetic: z.string().optional(),
});

export const BrandKitPatchSchema = z
  .object({
    identity: BrandKitIdentitySchema.partial().optional(),
    designLanguage: BrandKitDesignLanguageSchema.partial().optional(),
    sourceUrl: z.string().url().nullable().optional(),
  })
  .refine(
    (v) =>
      Boolean(v.identity) ||
      Boolean(v.designLanguage) ||
      v.sourceUrl !== undefined,
    { message: "At least one field to update is required" },
  );

export const BrandKitFromUrlSchema = z.object({
  url: z.string().min(1),
  name: z.string().min(1).optional(),
});

export type BrandKitColor = z.infer<typeof BrandKitColorSchema>;
export type BrandKitIdentity = z.infer<typeof BrandKitIdentitySchema>;
export type BrandKitDesignLanguage = z.infer<
  typeof BrandKitDesignLanguageSchema
>;
export type BrandKitPatchInput = z.infer<typeof BrandKitPatchSchema>;
export type BrandKitFromUrlInput = z.infer<typeof BrandKitFromUrlSchema>;

export type BrandKitRecord = {
  id: string;
  brandId: string;
  userId: string;
  brandTag: string;
  sourceUrl: string | null;
  status: string;
  identity: BrandKitIdentity;
  designLanguage: BrandKitDesignLanguage;
  createdAt: Date;
  updatedAt: Date;
};
