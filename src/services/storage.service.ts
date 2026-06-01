import { env } from "../config/env";
import { supabaseAdmin } from "../config/supabase";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export async function generateUploadUrl(
  storagePath: string
): Promise<{ signedUrl: string; path: string }> {
  const { data, error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new AppError(
      500,
      `Failed to generate upload URL for ${storagePath}: ${error?.message ?? "no data returned"}`
    );
  }

  return { signedUrl: data.signedUrl, path: storagePath };
}

export async function verifyFileExists(storagePath: string): Promise<boolean> {
  const lastSlash = storagePath.lastIndexOf("/");
  const folder = storagePath.substring(0, lastSlash);
  const filename = storagePath.substring(lastSlash + 1);

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .list(folder);

    if (error || !data) {
      logger.warn(`verifyFileExists: could not list folder "${folder}": ${error?.message}`);
      return false;
    }

    return data.some((file) => file.name === filename);
  } catch (err) {
    logger.warn(`verifyFileExists: unexpected error for "${storagePath}": ${(err as Error).message}`);
    return false;
  }
}

export function getPublicUrl(storagePath: string): string {
  const { data } = supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function deleteFile(storagePath: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .remove([storagePath]);

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not found") || msg.includes("does not exist")) {
      return;
    }
    throw new AppError(500, `Failed to delete file at ${storagePath}: ${error.message}`);
  }
}
