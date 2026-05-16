CREATE TABLE IF NOT EXISTS "audio_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"language" text NOT NULL,
	"file_url" text NOT NULL,
	"status" text DEFAULT 'pending',
	"file_name" text,
	"mime_type" text,
	"size" integer,
	"created_at" timestamp DEFAULT now()
);
