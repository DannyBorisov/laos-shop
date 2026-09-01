import { Storage } from "@google-cloud/storage";
import { prisma } from "./data";

const BUCKET_NAME = process.env.GCP_BUCKET_NAME || "product-medias";

const credentials = process.env.GCP_CREDENTIALS
  ? JSON.parse(process.env.GCP_CREDENTIALS)
  : undefined;

const storage = new Storage(
  credentials
    ? { credentials }
    : { keyFilename: process.env.GCP_CREDENTIALS_PATH }
);

const bucket = storage.bucket(BUCKET_NAME);

// Extract Google Drive file ID from various URL formats
const extractDriveFileId = (url: string): string | null => {
  // Format: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([^/]+)/);
  if (match1) return match1[1];

  // Format: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([^&]+)/);
  if (match2) return match2[1];

  // Format: https://drive.google.com/uc?id=FILE_ID
  const match3 = url.match(/uc\?.*id=([^&]+)/);
  if (match3) return match3[1];

  return null;
};

// Download image from Google Drive
const downloadFromDrive = async (fileId: string): Promise<Buffer | null> => {
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  try {
    const response = await fetch(downloadUrl, { redirect: "follow" });
    if (!response.ok) {
      console.error(`Failed to download ${fileId}: ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error downloading ${fileId}:`, error);
    return null;
  }
};

// Migrate images from Google Drive URLs to GCS
const migrateImages = async () => {
  console.log("=== Migrating Images from Google Drive ===");

  const products = await prisma.product.findMany();

  console.log(`Found ${products.length} products to check`);

  for (const product of products) {
    // Skip if no imagePath or already migrated (not a URL)
    if (!product.imagePath || !product.imagePath.startsWith("http")) {
      continue;
    }

    console.log(`\nProcessing product ${product.id}: ${product.name}`);
    console.log(`  Old URL: ${product.imagePath}`);

    const fileId = extractDriveFileId(product.imagePath);
    if (!fileId) {
      console.log(`  Could not extract Drive file ID, skipping...`);
      continue;
    }

    console.log(`  Drive file ID: ${fileId}`);

    const imageBuffer = await downloadFromDrive(fileId);
    if (!imageBuffer) {
      console.log(`  Failed to download image, skipping...`);
      continue;
    }

    const filename = `images/product-${product.id}-${Date.now()}.jpg`;

    // Upload to bucket
    const file = bucket.file(filename);
    await file.save(imageBuffer, { contentType: "image/jpeg" });

    // Update database
    await prisma.product.update({
      where: { id: product.id },
      data: { imagePath: filename },
    });

    console.log(`  Uploaded to: ${filename}`);
  }
};

// Update video paths to include videos/ prefix if needed
const updateVideoPaths = async () => {
  console.log("\n=== Updating Video Paths ===");

  const products = await prisma.product.findMany({
    where: { videoPath: { not: null } },
  });

  console.log(`Found ${products.length} products with videos`);

  for (const product of products) {
    if (!product.videoPath) continue;

    // Skip if already has videos/ prefix
    if (product.videoPath.startsWith("videos/")) {
      console.log(`Product ${product.id}: Already has prefix, skipping`);
      continue;
    }

    const newPath = `videos/${product.videoPath}`;

    console.log(`Product ${product.id}: ${product.videoPath} -> ${newPath}`);

    await prisma.product.update({
      where: { id: product.id },
      data: { videoPath: newPath },
    });
  }
};

const migrate = async () => {
  console.log("Starting media migration...");
  console.log(`Bucket: ${BUCKET_NAME}\n`);

  await migrateImages();
  await updateVideoPaths();

  console.log("\n=== Migration Complete ===");
};

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
