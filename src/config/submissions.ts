export const UPLOAD_WINDOWS_SECONDS = {
  READ_SPEECH: 2 * 60,       // 2 minutes
  SPONTANEOUS_SPEECH: 8 * 60, // 8 minutes
} as const;

export const CLEANUP_THRESHOLDS_SECONDS = {
  READ_SPEECH: 5 * 60,        // 5 minutes
  SPONTANEOUS_SPEECH: 15 * 60, // 15 minutes
} as const;

export const MAX_AWAITING_UPLOADS_PER_USER = 3;
