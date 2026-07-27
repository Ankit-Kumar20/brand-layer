export const BRAND_CATEGORIES = [
  "identity",
  "assets",
  "products",
  "campaigns",
  "claims",
  "restrictions",
] as const;

export type BrandCategory = (typeof BRAND_CATEGORIES)[number];

export const INGEST_KINDS = [
  "markdown",
  "pdf",
  "json",
  "url",
  "svg_asset",
] as const;

export type IngestKind = (typeof INGEST_KINDS)[number];

export type BrandStaticCard = {
  identity: string[];
  assets: string[];
  claims: string[];
  restrictions: string[];
};

export type BrandDynamicCard = {
  products: string[];
  campaigns: string[];
};

export type BrandProfile = {
  static: string[];
  dynamic: string[];
  staticCard: BrandStaticCard;
  dynamicCard: BrandDynamicCard;
};

export function emptyStaticCard(): BrandStaticCard {
  return { identity: [], assets: [], claims: [], restrictions: [] };
}

export function emptyDynamicCard(): BrandDynamicCard {
  return { products: [], campaigns: [] };
}
