import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().min(1, "PORT is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.errors
    .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
    .join("\n");
  throw new Error(`Missing or invalid environment variables:\n${missing}`);
}

export const env = parsed.data;
