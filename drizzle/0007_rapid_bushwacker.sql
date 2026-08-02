CREATE TABLE "brand_kits" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"user_id" text NOT NULL,
	"brand_tag" text NOT NULL,
	"source_url" text,
	"status" text DEFAULT 'ready' NOT NULL,
	"identity" jsonb NOT NULL,
	"design_language" jsonb NOT NULL,
	"raw_firecrawl" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_kits" ADD CONSTRAINT "brand_kits_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "brand_kits_brand_id_uidx" ON "brand_kits" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "brand_kits_user_idx" ON "brand_kits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "brand_kits_user_brand_tag_idx" ON "brand_kits" USING btree ("user_id","brand_tag");