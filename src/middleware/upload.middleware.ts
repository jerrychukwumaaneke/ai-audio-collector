import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), process.env.UPLOAD_DIR || "uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  },
});

const allowedMimeTypes = [
  "audio/wav",
  "audio/wave",   // some browsers send this for .wav files
  "audio/mpeg",   // .mp3
  "audio/webm",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",    // .aac
  "audio/mp4",    // .m4a
];

export const uploadMiddleware = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid audio format: ${file.mimetype}. Allowed: wav, mp3, webm, ogg, aac, m4a`
        )
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
}).single("audio");