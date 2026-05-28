import { Request, Response } from "express";
import { z } from "zod";
import fs from "fs/promises";
import { uploadAudioService } from "../services/audio.service.js";

// Define the Schema inside the controller file
const uploadAudioSchema = z.object({
  language: z.string({ required_error: "Language is required" }).min(2),
});



export const uploadAudio = async (req: Request, res: Response) => {
  try {
    // 1. File Presence Check
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Audio file required" });
    }

    // 2. Auth Check (Ensures middleware worked)
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User context not found" });
    }

    // 3. Zod Validation for Body Fields
    const validatedBody = uploadAudioSchema.parse(req.body);

    // 4. Call Service
    // We combine the validated body with the userId from the token
    const result = await uploadAudioService({
      file: req.file,
      body: { 
        userId, 
        language: validatedBody.language 
      }
    });

    return res.status(201).json({ 
      success: true, 
      data: result 
    });

  } catch (error: any) {
    // Handle Zod Validation Errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.errors.map(e => ({ field: e.path[0], message: e.message }))
      });
    }

    console.error("Controller Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Upload failed" });

  } finally {
    // 5. Atomic Cleanup (Race-condition safe)
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
        console.log("Cleanup successful");
      } catch (err) {
        console.error("Cleanup Error:", err);
      }
    }
  }
};