import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  jsonb,
  uniqueIndex,
  customType,
  vector,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

/** Better Auth MCP / OIDC dynamic clients (ChatGPT, Claude, etc.). */
export const oauthApplication = pgTable(
  "oauth_application",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon"),
    metadata: text("metadata"),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret"),
    redirectUrls: text("redirect_urls").notNull(),
    type: text("type").notNull(),
    disabled: boolean("disabled").default(false),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    authenticationScheme: text("authentication_scheme"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("oauth_application_userId_idx").on(table.userId)],
);

export const oauthAccessToken = pgTable(
  "oauth_access_token",
  {
    id: text("id").primaryKey(),
    accessToken: text("access_token").notNull().unique(),
    refreshToken: text("refresh_token").notNull().unique(),
    accessTokenExpiresAt: timestamp("access_token_expires_at").notNull(),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthApplication.clientId, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    scopes: text("scopes").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("oauth_access_token_clientId_idx").on(table.clientId),
    index("oauth_access_token_userId_idx").on(table.userId),
  ],
);

export const oauthConsent = pgTable(
  "oauth_consent",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthApplication.clientId, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    scopes: text("scopes").notNull(),
    consentGiven: boolean("consent_given").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("oauth_consent_clientId_idx").on(table.clientId),
    index("oauth_consent_userId_idx").on(table.userId),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    brandTag: text("brand_tag").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("brands_user_idx").on(table.userId),
    uniqueIndex("brands_user_slug_uidx").on(table.userId, table.slug),
    uniqueIndex("brands_user_brand_tag_uidx").on(
      table.userId,
      table.brandTag,
    ),
  ],
);

/**
 * Brand chosen during MCP OAuth consent (ChatGPT / Claude connectors).
 * Keyed by user + OAuth client so reconnects keep the same brand.
 */
export const mcpOauthBrand = pgTable(
  "mcp_oauth_brand",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    clientId: text("client_id").notNull(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    brandTag: text("brand_tag").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("mcp_oauth_brand_user_client_uidx").on(
      table.userId,
      table.clientId,
    ),
    index("mcp_oauth_brand_userId_idx").on(table.userId),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    brandId: text("brand_id").references(() => brands.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull().default("default"),
    keyHash: text("key_hash").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    /** AES-GCM ciphertext of the raw key (recoverable). Null for legacy rows. */
    keyCiphertext: text("key_ciphertext"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("api_keys_userId_idx").on(table.userId),
    index("api_keys_brandId_idx").on(table.brandId),
    uniqueIndex("api_keys_keyHash_uidx").on(table.keyHash),
  ],
);

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    brandTag: text("brand_tag").notNull(),
    customId: text("custom_id"),
    contentHash: text("content_hash"),
    content: text("content"),
    rawText: text("raw_text"),
    url: text("url"),
    type: text("type").notNull().default("text"),
    status: text("status").notNull().default("queued"),
    taskType: text("task_type").notNull().default("memory"),
    dreaming: text("dreaming").notNull().default("dynamic"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(),
    processingMetadata: jsonb("processing_metadata").$type<Record<string, unknown>>(),
    error: text("error"),
    chunkCount: integer("chunk_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("documents_user_brand_tag_idx").on(table.userId, table.brandTag),
    uniqueIndex("documents_custom_id_uidx")
      .on(table.userId, table.brandTag, table.customId)
      .where(sql`${table.customId} is not null`),
  ],
);

export const chunks = pgTable(
  "chunks",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    content: text("content").notNull(),
    tokenCount: integer("token_count").notNull().default(0),
    embedding: vector("embedding", { dimensions: 1536 }),
    embeddingModel: text("embedding_model"),
    fts: tsvector("fts"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chunks_documentId_idx").on(table.documentId),
    index("chunks_embedding_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);

export const memories = pgTable(
  "memories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    brandTag: text("brand_tag").notNull(),
    memory: text("memory").notNull(),
    isStatic: boolean("is_static").notNull().default(false),
    isLatest: boolean("is_latest").notNull().default(true),
    isForgotten: boolean("is_forgotten").notNull().default(false),
    isInference: boolean("is_inference").notNull().default(false),
    version: integer("version").notNull().default(1),
    parentMemoryId: text("parent_memory_id"),
    rootMemoryId: text("root_memory_id"),
    embedding: vector("embedding", { dimensions: 1536 }),
    embeddingModel: text("embedding_model"),
    fts: tsvector("fts"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("memories_user_brand_tag_idx").on(table.userId, table.brandTag),
    index("memories_latest_idx").on(
      table.userId,
      table.brandTag,
      table.isLatest,
      table.isForgotten,
    ),
    index("memories_embedding_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops")),
  ],
);

export const memoryEdges = pgTable(
  "memory_edges",
  {
    id: text("id").primaryKey(),
    fromId: text("from_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    toId: text("to_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("memory_edges_from_idx").on(table.fromId),
    index("memory_edges_to_idx").on(table.toId),
    uniqueIndex("memory_edges_unique_uidx").on(table.fromId, table.toId, table.type),
  ],
);

export const memoryDocumentSources = pgTable(
  "memory_document_sources",
  {
    id: text("id").primaryKey(),
    memoryId: text("memory_id")
      .notNull()
      .references(() => memories.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("memory_document_sources_memory_idx").on(table.memoryId),
    index("memory_document_sources_document_idx").on(table.documentId),
    uniqueIndex("memory_document_sources_uidx").on(table.memoryId, table.documentId),
  ],
);

export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    brandTag: text("brand_tag").notNull(),
    staticFacts: jsonb("static_facts").$type<string[]>().notNull().default([]),
    dynamicFacts: jsonb("dynamic_facts").$type<string[]>().notNull().default([]),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("profiles_user_brand_tag_uidx").on(table.userId, table.brandTag),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    documentId: text("document_id").references(() => documents.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    brandTag: text("brand_tag"),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    error: text("error"),
    runAfter: timestamp("run_after").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("jobs_status_run_after_idx").on(table.status, table.runAfter),
    index("jobs_documentId_idx").on(table.documentId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  apiKeys: many(apiKeys),
  documents: many(documents),
  memories: many(memories),
  brands: many(brands),
  oauthApplications: many(oauthApplication),
  oauthAccessTokens: many(oauthAccessToken),
  oauthConsents: many(oauthConsent),
  mcpOauthBrands: many(mcpOauthBrand),
}));

export const oauthApplicationRelations = relations(
  oauthApplication,
  ({ one, many }) => ({
    user: one(user, {
      fields: [oauthApplication.userId],
      references: [user.id],
    }),
    accessTokens: many(oauthAccessToken),
    consents: many(oauthConsent),
  }),
);

export const oauthAccessTokenRelations = relations(
  oauthAccessToken,
  ({ one }) => ({
    user: one(user, {
      fields: [oauthAccessToken.userId],
      references: [user.id],
    }),
    application: one(oauthApplication, {
      fields: [oauthAccessToken.clientId],
      references: [oauthApplication.clientId],
    }),
  }),
);

export const oauthConsentRelations = relations(oauthConsent, ({ one }) => ({
  user: one(user, {
    fields: [oauthConsent.userId],
    references: [user.id],
  }),
  application: one(oauthApplication, {
    fields: [oauthConsent.clientId],
    references: [oauthApplication.clientId],
  }),
}));

export const mcpOauthBrandRelations = relations(mcpOauthBrand, ({ one }) => ({
  user: one(user, {
    fields: [mcpOauthBrand.userId],
    references: [user.id],
  }),
  brand: one(brands, {
    fields: [mcpOauthBrand.brandId],
    references: [brands.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  user: one(user, {
    fields: [brands.userId],
    references: [user.id],
  }),
  apiKeys: many(apiKeys),
  mcpOauthBrands: many(mcpOauthBrand),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(user, {
    fields: [apiKeys.userId],
    references: [user.id],
  }),
  brand: one(brands, {
    fields: [apiKeys.brandId],
    references: [brands.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(user, {
    fields: [documents.userId],
    references: [user.id],
  }),
  chunks: many(chunks),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
  document: one(documents, {
    fields: [chunks.documentId],
    references: [documents.id],
  }),
}));

export const memoriesRelations = relations(memories, ({ one, many }) => ({
  user: one(user, {
    fields: [memories.userId],
    references: [user.id],
  }),
  sources: many(memoryDocumentSources),
}));
