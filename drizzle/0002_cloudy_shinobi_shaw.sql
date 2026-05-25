DROP TABLE "task_languages";--> statement-breakpoint
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_language_id_languages_id_fk";
--> statement-breakpoint
ALTER TABLE "submissions" ADD COLUMN "language_code" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "submissions" ADD CONSTRAINT "submissions_language_code_languages_code_fk" FOREIGN KEY ("language_code") REFERENCES "public"."languages"("code") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "languages" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "submissions" DROP COLUMN IF EXISTS "language_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "languages" ADD CONSTRAINT "languages_code_unique" UNIQUE("code");