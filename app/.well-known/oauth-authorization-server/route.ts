import { oAuthDiscoveryMetadata } from "better-auth/plugins";
import { metadataCorsOptionsRequestHandler } from "mcp-handler";
import { auth } from "@/lib/auth";

export const GET = oAuthDiscoveryMetadata(auth);
export const OPTIONS = metadataCorsOptionsRequestHandler();
