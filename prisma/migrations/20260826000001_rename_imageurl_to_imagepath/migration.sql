-- Rename imageUrl column to imagePath (preserving data)
ALTER TABLE "Product" RENAME COLUMN "imageUrl" TO "imagePath";
