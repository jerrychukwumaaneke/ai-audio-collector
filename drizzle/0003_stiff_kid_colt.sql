ALTER TABLE "languages" DROP CONSTRAINT "languages_name_unique";--> statement-breakpoint
ALTER TABLE "languages" DROP CONSTRAINT "languages_code_unique";--> statement-breakpoint
ALTER TABLE "languages" ADD PRIMARY KEY ("code");--> statement-breakpoint
ALTER TABLE "languages" DROP COLUMN IF EXISTS "id";