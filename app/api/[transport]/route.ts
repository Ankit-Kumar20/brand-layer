import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { resolveMcpSession } from "@/lib/mcp/auth";
import { registerDesinMcpTools } from "@/lib/mcp/tools";
import { mcpResourceUrl } from "@/lib/mcp/urls";

export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    registerDesinMcpTools(server);
  },
  {
    serverInfo: {
      name: "desin",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== "production",
  },
);

async function verifyToken(
  req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  const session = await resolveMcpSession(bearerToken, req);
  if (!session) return undefined;

  return {
    token: session.apiKey,
    clientId: session.userId,
    scopes: ["brand:read", "brand:write"],
    extra: { session },
  };
}

const authHandler = withMcpAuth(handler, verifyToken, {
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
  resourceUrl: mcpResourceUrl(),
});

export { authHandler as GET, authHandler as POST, authHandler as DELETE };
