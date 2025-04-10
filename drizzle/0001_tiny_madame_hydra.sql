ALTER TABLE "urls" RENAME COLUMN "short_url" TO "short_Code";--> statement-breakpoint
ALTER TABLE "urls" DROP CONSTRAINT "urls_short_url_unique";--> statement-breakpoint
ALTER TABLE "urls" ADD CONSTRAINT "urls_short_Code_unique" UNIQUE("short_Code");