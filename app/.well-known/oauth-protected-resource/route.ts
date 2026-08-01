import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { metadataCorsOptionsRequestHandler } from "mcp-handler";
import { auth } from "@/lib/auth";

export const GET = oAuthProtectedResourceMetadata(auth);
export const OPTIONS = metadataCorsOptionsRequestHandler();
