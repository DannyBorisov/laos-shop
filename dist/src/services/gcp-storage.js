"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVideo = exports.getSignedUrl = exports.uploadVideo = void 0;
const storage_1 = require("@google-cloud/storage");
// For Vercel: use GCP_CREDENTIALS (JSON string)
// For local: use GCP_CREDENTIALS_PATH (file path)
const credentials = process.env.GCP_CREDENTIALS
    ? JSON.parse(process.env.GCP_CREDENTIALS)
    : undefined;
const storage = new storage_1.Storage(credentials
    ? { credentials }
    : { keyFilename: process.env.GCP_CREDENTIALS_PATH });
const bucket = storage.bucket(process.env.GCP_BUCKET_NAME || "");
const uploadVideo = async (buffer, filename, contentType) => {
    const file = bucket.file(filename);
    await file.save(buffer, { contentType });
    return filename;
};
exports.uploadVideo = uploadVideo;
const getSignedUrl = async (filename) => {
    const [url] = await bucket.file(filename).getSignedUrl({
        action: "read",
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    return url;
};
exports.getSignedUrl = getSignedUrl;
const deleteVideo = async (filename) => {
    await bucket.file(filename).delete();
};
exports.deleteVideo = deleteVideo;
