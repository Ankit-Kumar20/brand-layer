/**
 * Public MCP resource URL and auth origin for OAuth discovery.
 * Override with MCP_RESOURCE_URL / BETTER_AUTH_URL in production.
 */

export function authOrigin(): string {
  const base = process.env.BETTER_AUTH_URL?.replace(/\/$/, "");
  if (base) return base;
  return "http://localhost:3000";
}

export function mcpResourceUrl(): string {
  const explicit = process.env.MCP_RESOURCE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  return `${authOrigin()}/api/mcp`;
}
