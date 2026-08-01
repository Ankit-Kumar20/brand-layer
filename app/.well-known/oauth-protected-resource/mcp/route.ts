import { oAuthProtectedResourceMetadata } from "better-auth/plugins";
import { metadataCorsOptionsRequestHandler } from "mcp-handler";
import { auth } from "@/lib/auth";

/** Some clients (incl. ChatGPT) append `/mcp` to the well-known path. */
export const GET = oAuthProtectedResourceMetadata(auth);
export const OPTIONS = metadataCorsOptionsRequestHandler();
