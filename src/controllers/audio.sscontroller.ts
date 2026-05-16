// import { Request, Response } from "express";
// import { uploadAudioService } from "../services/audio.service.js";
// import fs from "fs/promises"; // Use the promises version to prevent race conditions
// import { z } from "zod";

// export const uploadAudioSchema = z.object({
//   userId: z.string({ required_error: "User ID is required" }).uuid("Invalid User ID format"),
//   language: z.string({ required_error: "Language is required" }).min(2, "Language code too short"),
// });


// export const uploadAudio = async (
//   req: Request & { file?: Express.Multer.File },
//   res: Response
// ) => {
//   try {
//     // // 1. Input Validation: Check for file
//     // if (!req.file) {
//     //   return res.status(400).json({ 
//     //     success: false, 
//     //     message: "No audio file uploaded" 
//     //   });
//     // }

//     // // 2. Input Validation: Check for required body metadata
//     // const { userId, language } = req.body;
//     // if (!userId || !language) {
//     //   return res.status(400).json({ 
//     //     success: false, 
//     //     message: "Missing metadata: userId and language are required" 
//     //   });
//     // }

//     // // 3. Call Service
//     // const result = await uploadAudioService({
//     //   file: req.file,
//     //   body: { userId, language }
//     // });

//     // // 4. Success Response
//     // return res.status(201).json({ 
//     //   success: true, 
//     //   message: "Audio uploaded and processed successfully",
//     //   data: result 
//     // });

//     if (!req.file) return res.status(400).json({ message: "File required" });

//     // 1. Get userId from the TOKEN, not the body
//     const userId = req.user?.id; 
//     if (!userId) return res.status(401).json({ message: "Unauthorized" });

//     // 2. Validate the remaining body fields (like language)
//     const { language } = uploadAudioSchema.parse(req.body);

//     const result = await uploadAudioService({
//       file: req.file,
//       body: { userId, language } // Still passed to service as before
//     });

//     return res.status(201).json({ success: true, data: result });
//   } catch (error: any) {
//     console.error("Upload Controller Error:", error);
    
//     // Return specific error message if available, otherwise generic
//     return res.status(500).json({ 
//       success: false, 
//       message: error.message || "Internal server error during upload" 
//     });

//   } finally {
//     // 5. Refined Cleanup: Always delete temp file regardless of success/fail
//     if (req.file?.path) {
//       try {
//         await fs.unlink(req.file.path);
//         console.log(`Successfully deleted temp file: ${req.file.path}`);
//       } catch (cleanupError) {
//         // We log this but don't crash the response, as the user already has their answer
//         console.error("Critical: Failed to delete temp file:", cleanupError);
//       }
//     }
//   }
// };