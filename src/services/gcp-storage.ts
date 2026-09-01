import { Storage } from "@google-cloud/storage";

// For Vercel: use GCP_CREDENTIALS (JSON string)
// For local: use GCP_CREDENTIALS_PATH (file path)
const credentials = process.env.GCP_CREDENTIALS
  ? JSON.parse(process.env.GCP_CREDENTIALS)
  : undefined;

const storage = new Storage(
  credentials
    ? { credentials }
    : { keyFilename: process.env.GCP_CREDENTIALS_PATH }
);

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME || "");

export const uploadMedia = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> => {
  const file = bucket.file(filename);
  await file.save(buffer, { contentType });
  return filename;
};

export const getSignedUrl = async (filename: string): Promise<string> => {
  const [url] = await bucket.file(filename).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  });
  return url;
};

export const deleteMedia = async (filename: string): Promise<void> => {
  await bucket.file(filename).delete();
};

export const fileExists = async (filename: string): Promise<boolean> => {
  const [exists] = await bucket.file(filename).exists();
  return exists;
};

// Legacy aliases for backward compatibility
export const uploadVideo = uploadMedia;
export const deleteVideo = deleteMedia;
