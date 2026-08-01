import {
  createLoader,
  debounce,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const workspaceViews = [
  "create",
  "library",
  "kit",
  "connect",
  "settings",
  "add-brand",
] as const;

export const workspaceTeams = [
  "personal",
  "studio",
  "agency",
  "desin-hq",
] as const;

export const workspaceBrands = [
  "claude",
  "cursor",
  "chatgpt",
  "codex",
  "openclaw",
  "hermes",
] as const;

export const settingsSections = [
  "account",
  "brands",
  "api-keys",
  "connect",
  "team",
  "byok",
  "billing",
] as const;

export const mcpClients = ["cursor", "claude"] as const;

export const workspaceSearchParams = {
  view: parseAsStringLiteral(workspaceViews).withDefault("create"),
  team: parseAsStringLiteral(workspaceTeams).withDefault("personal"),
  brand: parseAsStringLiteral(workspaceBrands).withDefault(workspaceBrands[0]),
  q: parseAsString.withDefault("").withOptions({
    limitUrlUpdates: debounce(300),
  }),
  settings: parseAsStringLiteral(settingsSections).withDefault("account"),
  settingsBrand: parseAsString.withDefault(""),
  mcp: parseAsStringLiteral(mcpClients).withDefault("cursor"),
};

export const loadWorkspaceSearchParams = createLoader(workspaceSearchParams);

export type WorkspaceView = (typeof workspaceViews)[number];
export type WorkspaceTeamId = (typeof workspaceTeams)[number];
export type SettingsSectionId = (typeof settingsSections)[number];
export type McpClientId = (typeof mcpClients)[number];
