ALTER TABLE "brands" RENAME COLUMN "container_tag" TO "brand_tag";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "container_tag" TO "brand_tag";--> statement-breakpoint
ALTER TABLE "jobs" RENAME COLUMN "container_tag" TO "brand_tag";--> statement-breakpoint
ALTER TABLE "memories" RENAME COLUMN "container_tag" TO "brand_tag";--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "container_tag" TO "brand_tag";--> statement-breakpoint
DROP INDEX "brands_user_container_uidx";--> statement-breakpoint
DROP INDEX "documents_user_container_idx";--> statement-breakpoint
DROP INDEX "memories_user_container_idx";--> statement-breakpoint
DROP INDEX "profiles_user_container_uidx";--> statement-breakpoint
DROP INDEX "documents_custom_id_uidx";--> statement-breakpoint
DROP INDEX "memories_latest_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "brands_user_brand_tag_uidx" ON "brands" USING btree ("user_id","brand_tag");--> statement-breakpoint
CREATE INDEX "documents_user_brand_tag_idx" ON "documents" USING btree ("user_id","brand_tag");--> statement-breakpoint
CREATE INDEX "memories_user_brand_tag_idx" ON "memories" USING btree ("user_id","brand_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_brand_tag_uidx" ON "profiles" USING btree ("user_id","brand_tag");--> statement-breakpoint
CREATE UNIQUE INDEX "documents_custom_id_uidx" ON "documents" USING btree ("user_id","brand_tag","custom_id") WHERE "documents"."custom_id" is not null;--> statement-breakpoint
CREATE INDEX "memories_latest_idx" ON "memories" USING btree ("user_id","brand_tag","is_latest","is_forgotten");