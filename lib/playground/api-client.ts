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

export type DocumentAddBody = {
  content?: string;
  url?: string;
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
  relatedMemories?: Array<{ id: string; memory: string; relation: string }>;
};

export type SearchResponse = {
  results: SearchHit[];
  total: number;
};

export type ProfileResponse = {
  profile: {
    static: string[];
    dynamic: string[];
  };
  searchResults?: SearchResponse;
};

export function addDocument(body: DocumentAddBody) {
  return request<{ id: string; status: string }>("/v3/documents", { body });
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

export const SAMPLE_CONTENT =
  "My name is Alex. I prefer dark mode and work at Stripe as a PM.";
