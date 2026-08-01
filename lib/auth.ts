import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { nextCookies } from "better-auth/next-js";
import { mcp } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { mcpResourceUrl } from "@/lib/mcp/urls";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    nextCookies(),
    mcp({
      loginPage: "/login",
      resource: mcpResourceUrl(),
      oidcConfig: {
        loginPage: "/login",
        consentPage: "/oauth/consent",
        allowDynamicClientRegistration: true,
        // ChatGPT needs refresh tokens for long-lived connectors.
        scopes: ["openid", "profile", "email", "offline_access"],
      },
    }),
  ],
});
