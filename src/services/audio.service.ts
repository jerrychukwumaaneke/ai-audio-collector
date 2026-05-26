import fs from "fs";
import { supabaseAdmin } from "../config/supabase.js";
import { db } from "../db/index.js";
import { audioSamples } from "../db/schema/audio_samples.js";
import { audioQueue } from "../config/queue.js";

interface UploadAudioParams {
  file: Express.Multer.File;
  body: {
    userId: string;
    language: string;
  };
}

export const uploadAudioService = async ({ file, body }: UploadAudioParams) => {
  // 1. Read file into buffer
  const fileBuffer = fs.readFileSync(file.path);

  // 2. Create unique path for Supabase Storage
  const fileName = `${body.userId}/${Date.now()}-${file.originalname}`;

  // 3. Upload original audio to Supabase Storage
  const { error: storageError } = await supabaseAdmin
    .storage
    .from("audio-files")
    .upload(fileName, fileBuffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (storageError) throw new Error(`Storage Error: ${storageError.message}`);

  // 4. Get the public URL
  const { data: publicUrlData } = supabaseAdmin
    .storage
    .from("audio-files")
    .getPublicUrl(fileName);

  const fileUrl = publicUrlData.publicUrl;

  // 5. Save metadata to DB — status starts as "pending"
  const [newRecord] = await db
    .insert(audioSamples)
    .values({
      userId: body.userId,
      language: body.language,
      fileUrl,
      status: "pending",
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    })
    .returning();

  // 6. Push job to Redis queue for Python worker to pick up
  await audioQueue.add("transcribe", {
    recordId: newRecord.id,
    fileUrl,
    language: body.language,
    userId: body.userId,
    fileName: file.originalname,
  });

  console.log(`Job queued for record: ${newRecord.id}`);

  return newRecord;
};