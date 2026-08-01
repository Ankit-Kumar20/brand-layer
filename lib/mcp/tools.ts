import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { z } from "zod";
import { BRAND_CATEGORIES } from "@/lib/brand/types";
import { answerBrandQuestion } from "@/lib/memory/answer";
import { getProfile } from "@/lib/memory/profile";
import { searchMemoriesAndDocuments } from "@/lib/memory/search";
import {
  requireBrandTag,
  type McpSession,
} from "@/lib/mcp/auth";
import {
  formatAnswer,
  formatProfile,
  formatSearch,
} from "@/lib/mcp/format";
import { queueDocumentIngest } from "@/lib/mcp/ingest";

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const;

function textResult(text: string, isError = false) {
  return {
    content: [{ type: "text" as const, text }],
    ...(isError ? { isError: true } : {}),
  };
}

function sessionFromExtra(extra: { authInfo?: AuthInfo }): McpSession {
  const session = extra.authInfo?.extra?.session as McpSession | undefined;
  if (!session?.userId) {
    throw new Error("Not authenticated");
  }
  return session;
}

const brandTagField = {
  brandTag: z
    .string()
    .min(1)
    .max(128)
    .describe(
      "Brand tag. Prefer a brand-scoped API key so this is set automatically.",
    )
    .optional(),
};

/**
 * Register desin brand tools / resource / prompt on an MCP server.
 */
export function registerDesinMcpTools(server: McpServer) {
  server.registerTool(
    "brandContext",
    {
      description:
        "PRIMARY brand read tool. Ask about voice, palette, claims, restrictions, logos, and products. Returns a short grounded answer with citations. Prefer this over search for writing and design.",
      inputSchema: {
        q: z
          .string()
          .min(1)
          .max(1000)
          .describe(
            "Question about brand voice, colors, claims, restrictions, assets, or products",
          ),
        category: z.enum(BRAND_CATEGORIES).optional(),
        assetType: z.string().min(1).optional(),
        market: z.string().min(1).optional(),
        product: z.string().min(1).optional(),
        isStatic: z.boolean().optional(),
        ...brandTagField,
      },
      annotations: READ_ONLY,
    },
    async (args, extra) => {
      try {
        const session = sessionFromExtra(extra);
        const brandTag = requireBrandTag(session, args.brandTag);
        const filters = {
          category: args.category,
          assetType: args.assetType,
          market: args.market,
          product: args.product,
          isStatic: args.isStatic,
        };
        const hasFilters = Object.values(filters).some((v) => v !== undefined);
        const result = await answerBrandQuestion(session.userId, {
          q: args.q,
          brandTag,
          limit: 8,
          threshold: 0.25,
          includeChunks: true,
          filters: hasFilters ? filters : undefined,
        });
        return textResult(formatAnswer(result));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        return textResult(`Error in brandContext: ${message}`, true);
      }
    },
  );

  server.registerTool(
    "getBrandProfile",
    {
      description:
        "Load the structured brand kit cards: identity, assets, claims, restrictions, products, and campaigns.",
      inputSchema: {
        q: z.string().min(1).optional().describe("Optional focus query"),
        includeSearch: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include raw search hits alongside the profile cards"),
        ...brandTagField,
      },
      annotations: READ_ONLY,
    },
    async (args, extra) => {
      try {
        const session = sessionFromExtra(extra);
        const brandTag = requireBrandTag(session, args.brandTag);
        const profile = await getProfile(session.userId, brandTag);
        let text = formatProfile({ profile });
        if (args.includeSearch && args.q) {
          const searchResults = await searchMemoriesAndDocuments(
            session.userId,
            {
              q: args.q,
              brandTag,
              searchMode: "memories",
              limit: 10,
              threshold: 0.3,
              includeRelated: false,
            },
          );
          text = `${text}\n\n## Search\n${formatSearch(searchResults)}`;
        }
        return textResult(text);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        return textResult(`Error in getBrandProfile: ${message}`, true);
      }
    },
  );

  server.registerTool(
    "ingest",
    {
      description:
        "Save brand guidelines, tokens, URLs, or asset notes into desin memory. Tag writes with source mcp. Use customId to upsert the same document.",
      inputSchema: {
        content: z
          .string()
          .max(200_000)
          .optional()
          .describe("Text / markdown / JSON / SVG content to ingest"),
        url: z.string().url().optional().describe("URL to scrape and ingest"),
        kind: z
          .enum(["markdown", "pdf", "json", "url", "svg_asset"])
          .optional()
          .describe("Content kind hint"),
        customId: z
          .string()
          .min(1)
          .optional()
          .describe("Stable id for upserts (e.g. guidelines_v4)"),
        metadata: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .optional(),
        dreaming: z.enum(["dynamic", "instant"]).optional().default("dynamic"),
        ...brandTagField,
      },
      annotations: WRITE,
    },
    async (args, extra) => {
      try {
        if (!args.content?.trim() && !args.url) {
          return textResult("Either content or url is required", true);
        }
        const session = sessionFromExtra(extra);
        const brandTag = requireBrandTag(session, args.brandTag);
        const result = await queueDocumentIngest(session.userId, brandTag, {
          content: args.content,
          url: args.url,
          kind: args.kind,
          customId: args.customId,
          metadata: args.metadata,
          taskType: "memory",
          dreaming: args.dreaming ?? "dynamic",
        });
        return textResult(
          JSON.stringify(
            {
              ...result,
              note: "Document queued. Wait for ingest/dream before brandContext reflects updates.",
            },
            null,
            2,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        return textResult(`Error in ingest: ${message}`, true);
      }
    },
  );

  server.registerTool(
    "search",
    {
      description:
        "Raw hybrid/memory search over brand facts. Prefer brandContext when you need prose answers for writing or design.",
      inputSchema: {
        q: z.string().min(1).max(1000).describe("Search query for brand facts"),
        searchMode: z
          .enum(["memories", "documents", "hybrid"])
          .optional()
          .default("memories"),
        limit: z.number().int().min(1).max(50).optional().default(10),
        threshold: z.number().min(0).max(1).optional().default(0.3),
        includeRelated: z.boolean().optional().default(false),
        category: z.enum(BRAND_CATEGORIES).optional(),
        assetType: z.string().min(1).optional(),
        market: z.string().min(1).optional(),
        product: z.string().min(1).optional(),
        isStatic: z.boolean().optional(),
        source: z.string().min(1).optional(),
        ...brandTagField,
      },
      annotations: READ_ONLY,
    },
    async (args, extra) => {
      try {
        const session = sessionFromExtra(extra);
        const brandTag = requireBrandTag(session, args.brandTag);
        const filters = {
          category: args.category,
          assetType: args.assetType,
          market: args.market,
          product: args.product,
          isStatic: args.isStatic,
          source: args.source,
        };
        const hasFilters = Object.values(filters).some((v) => v !== undefined);
        const result = await searchMemoriesAndDocuments(session.userId, {
          q: args.q,
          brandTag,
          searchMode: args.searchMode ?? "memories",
          limit: args.limit ?? 10,
          threshold: args.threshold ?? 0.3,
          includeRelated: args.includeRelated ?? false,
          filters: hasFilters ? filters : undefined,
        });
        return textResult(formatSearch(result));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        return textResult(`Error in search: ${message}`, true);
      }
    },
  );

  server.registerTool(
    "whoAmI",
    {
      description:
        "Show the authenticated brand session: userId, brandId, brandTag.",
      inputSchema: {},
      annotations: READ_ONLY,
    },
    async (_args, extra) => {
      try {
        const session = sessionFromExtra(extra);
        return textResult(
          JSON.stringify(
            {
              userId: session.userId,
              email: session.email,
              name: session.name,
              brandId: session.brandId,
              brandTag: session.brandTag,
              keyId: session.keyId,
            },
            null,
            2,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        return textResult(`Error in whoAmI: ${message}`, true);
      }
    },
  );

  server.registerResource(
    "Brand Profile",
    "brand://profile",
    {},
    async (_uri, extra) => {
      try {
        const session = sessionFromExtra(extra);
        const brandTag = requireBrandTag(session);
        const profile = await getProfile(session.userId, brandTag);
        return {
          contents: [
            {
              uri: "brand://profile",
              mimeType: "text/plain",
              text: formatProfile({ profile }),
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        return {
          contents: [
            {
              uri: "brand://profile",
              mimeType: "text/plain",
              text: `Error loading brand profile: ${message}`,
            },
          ],
        };
      }
    },
  );

  server.registerPrompt(
    "brand",
    {
      description:
        "Instruct the model to load live brand context (voice, colors, claims, restrictions) via brandContext before writing or designing.",
    },
    async (_args, extra) => {
      try {
        const session = sessionFromExtra(extra);
        const brandTag = requireBrandTag(session);
        const profile = await getProfile(session.userId, brandTag);
        const profileText = formatProfile({ profile });
        const text = [
          "**Important:** Before writing copy or designing UI for this brand, call `brandContext` for voice, colors, claims, and restrictions. Use `getBrandProfile` for the full kit cards. Use `ingest` when the user updates guidelines.",
          "",
          profileText,
        ].join("\n");
        return {
          messages: [
            {
              role: "user" as const,
              content: { type: "text" as const, text },
            },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unexpected error";
        return {
          messages: [
            {
              role: "user" as const,
              content: {
                type: "text" as const,
                text: [
                  "**Important:** Before writing or designing, call `brandContext` for voice, colors, claims, and restrictions.",
                  "",
                  `Brand profile unavailable: ${message}`,
                ].join("\n"),
              },
            },
          ],
        };
      }
    },
  );
}
