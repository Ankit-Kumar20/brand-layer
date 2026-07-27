export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(
      typeof body === "object" &&
        body &&
        "error" in body &&
        typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `HTTP ${status}`,
    );
    this.name = "ApiError";
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  opts: {
    method?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(path, {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const data = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export type IngestKind =
  | "markdown"
  | "pdf"
  | "json"
  | "url"
  | "svg_asset";

export type DocumentAddBody = {
  content?: string;
  url?: string;
  pdfBase64?: string;
  kind?: IngestKind;
  containerTag: string;
  customId?: string;
  metadata?: Record<string, string | number | boolean>;
  taskType?: "memory" | "superrag";
  dreaming?: "dynamic" | "instant";
};

export type DocumentStatus = {
  id: string;
  customId: string | null;
  containerTag: string;
  status: string;
  type: string;
  taskType: string;
  dreaming: string;
  contentHash: string | null;
  chunkCount: number | null;
  metadata: Record<string, unknown> | null;
  processingMetadata: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SearchHit = {
  id: string;
  type: "memory" | "chunk";
  memory?: string;
  content?: string;
  documentId?: string;
  similarity: number;
  isStatic?: boolean;
  metadata?: Record<string, string | number | boolean> | null;
  relatedMemories?: Array<{ id: string; memory: string; relation: string }>;
};

export type SearchResponse = {
  results: SearchHit[];
  total: number;
};

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

export type ProfileResponse = {
  profile: {
    static: string[];
    dynamic: string[];
    staticCard: BrandStaticCard;
    dynamicCard: BrandDynamicCard;
  };
  searchResults?: SearchResponse;
};

export type AnswerResponse = {
  answer: string;
  memories: SearchHit[];
  citations: Array<{ id: string; content: string; documentId?: string }>;
};

export type BrandFilters = {
  category?: string;
  assetType?: string;
  market?: string;
  product?: string;
  isStatic?: boolean;
  source?: string;
};

export function addDocument(body: DocumentAddBody) {
  return request<{ id: string; status: string; containerTag?: string; type?: string }>(
    "/v3/documents",
    { body },
  );
}

export function getDocument(id: string) {
  return request<DocumentStatus>(`/v3/documents/${id}`);
}

export function search(body: {
  q: string;
  containerTag: string;
  searchMode?: "memories" | "documents" | "hybrid";
  limit?: number;
  threshold?: number;
  includeRelated?: boolean;
  filters?: BrandFilters;
}) {
  return request<SearchResponse>("/v3/search", { body });
}

export function getProfile(body: {
  containerTag: string;
  q?: string;
  includeSearch?: boolean;
}) {
  return request<ProfileResponse>("/v3/profile", { body });
}

export function answer(body: {
  q: string;
  containerTag: string;
  limit?: number;
  threshold?: number;
  includeChunks?: boolean;
  filters?: BrandFilters;
}) {
  return request<AnswerResponse>("/v3/answer", { body });
}

export const SAMPLE_MARKDOWN = `# Voice & tone

Trybloom speaks with calm confidence.
We never claim medical outcomes.
Primary voice: warm, precise, hopeful.
`;

export const SAMPLE_COLORS_JSON = `{
  "colors": {
    "primary": "#0B3D2E",
    "secondary": "#F4F7F5",
    "accent": "#E8A838"
  }
}`;

export const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" id="logo-mark" viewBox="0 0 64 64">
  <title>Trybloom mark</title>
  <circle cx="32" cy="32" r="28" fill="#0B3D2E"/>
</svg>`;

/** @deprecated use SAMPLE_MARKDOWN */
export const SAMPLE_CONTENT = SAMPLE_MARKDOWN;
