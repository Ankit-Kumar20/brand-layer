CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'default' NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"position" integer NOT NULL,
	"content" text NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(1536),
	"embedding_model" text,
	"fts" "tsvector",
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"container_tag" text NOT NULL,
	"custom_id" text,
	"content_hash" text,
	"content" text,
	"raw_text" text,
	"url" text,
	"type" text DEFAULT 'text' NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"task_type" text DEFAULT 'memory' NOT NULL,
	"dreaming" text DEFAULT 'dynamic' NOT NULL,
	"metadata" jsonb,
	"processing_metadata" jsonb,
	"error" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"document_id" text,
	"user_id" text,
	"container_tag" text,
	"payload" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"run_after" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"container_tag" text NOT NULL,
	"memory" text NOT NULL,
	"is_static" boolean DEFAULT false NOT NULL,
	"is_latest" boolean DEFAULT true NOT NULL,
	"is_forgotten" boolean DEFAULT false NOT NULL,
	"is_inference" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"parent_memory_id" text,
	"root_memory_id" text,
	"embedding" vector(1536),
	"embedding_model" text,
	"fts" "tsvector",
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_document_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"memory_id" text NOT NULL,
	"document_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_edges" (
	"id" text PRIMARY KEY NOT NULL,
	"from_id" text NOT NULL,
	"to_id" text NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"container_tag" text NOT NULL,
	"static_facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dynamic_facts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_document_sources" ADD CONSTRAINT "memory_document_sources_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_document_sources" ADD CONSTRAINT "memory_document_sources_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_from_id_memories_id_fk" FOREIGN KEY ("from_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_edges" ADD CONSTRAINT "memory_edges_to_id_memories_id_fk" FOREIGN KEY ("to_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_userId_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_keyHash_uidx" ON "api_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "chunks_documentId_idx" ON "chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "chunks_embedding_hnsw_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "documents_user_container_idx" ON "documents" USING btree ("user_id","container_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_custom_id_uidx" ON "documents" USING btree ("user_id","container_tag","custom_id") WHERE "documents"."custom_id" is not null;--> statement-breakpoint
CREATE INDEX "jobs_status_run_after_idx" ON "jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE INDEX "jobs_documentId_idx" ON "jobs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "memories_user_container_idx" ON "memories" USING btree ("user_id","container_tag");--> statement-breakpoint
CREATE INDEX "memories_latest_idx" ON "memories" USING btree ("user_id","container_tag","is_latest","is_forgotten");--> statement-breakpoint
CREATE INDEX "memories_embedding_hnsw_idx" ON "memories" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memory_document_sources_memory_idx" ON "memory_document_sources" USING btree ("memory_id");--> statement-breakpoint
CREATE INDEX "memory_document_sources_document_idx" ON "memory_document_sources" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_document_sources_uidx" ON "memory_document_sources" USING btree ("memory_id","document_id");--> statement-breakpoint
CREATE INDEX "memory_edges_from_idx" ON "memory_edges" USING btree ("from_id");--> statement-breakpoint
CREATE INDEX "memory_edges_to_idx" ON "memory_edges" USING btree ("to_id");--> statement-breakpoint
CREATE UNIQUE INDEX "memory_edges_unique_uidx" ON "memory_edges" USING btree ("from_id","to_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_container_uidx" ON "profiles" USING btree ("user_id","container_tag");