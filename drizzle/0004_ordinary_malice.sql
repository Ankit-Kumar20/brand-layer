-- Drop brand→org FK and indexes before dropping org tables.
ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "brands_organization_id_organizations_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "brands_org_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "brands_slug_uidx";
--> statement-breakpoint
DROP INDEX IF EXISTS "brands_container_tag_uidx";
--> statement-breakpoint
DROP TABLE IF EXISTS "organization_members" CASCADE;
--> statement-breakpoint
DROP TABLE IF EXISTS "organizations" CASCADE;
--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN IF NOT EXISTS "user_id" text;
--> statement-breakpoint
-- Empty / unowned rows: delete so NOT NULL can be applied.
DELETE FROM "brands" WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "brands" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "brands" DROP CONSTRAINT IF EXISTS "brands_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brands_user_idx" ON "brands" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brands_user_slug_uidx" ON "brands" USING btree ("user_id","slug");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "brands_user_container_uidx" ON "brands" USING btree ("user_id","container_tag");
--> statement-breakpoint
ALTER TABLE "brands" DROP COLUMN IF EXISTS "organization_id";
