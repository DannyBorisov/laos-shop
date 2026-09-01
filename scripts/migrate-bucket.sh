#!/bin/bash

# Migration script for GCP bucket rename
# Old bucket: laos-store-instruction-videos
# New bucket: product-medias

OLD_BUCKET="gs://laos-store-instruction-videos"
NEW_BUCKET="gs://product-medias"

echo "=== GCP Bucket Migration ==="
echo "Old bucket: $OLD_BUCKET"
echo "New bucket: $NEW_BUCKET"
echo ""

# Step 1: Create new bucket (if not exists)
echo "Step 1: Creating new bucket..."
gcloud storage buckets create $NEW_BUCKET --location=us-central1 2>/dev/null || echo "Bucket already exists or created"

# Step 2: Copy all files from old to new bucket with videos/ prefix
echo ""
echo "Step 2: Copying files to new bucket with videos/ prefix..."
gcloud storage cp -r "${OLD_BUCKET}/*" "${NEW_BUCKET}/videos/"

# Step 3: List files in new bucket to verify
echo ""
echo "Step 3: Verifying files in new bucket..."
gcloud storage ls "${NEW_BUCKET}/**"

echo ""
echo "=== Bucket migration complete ==="
echo ""
echo "Next steps:"
echo "1. Run the database migration: npx prisma migrate dev --name rename-imageurl-to-imagepath"
echo "2. Run the media migration script: npx tsx src/migrate-media.ts"
echo "3. Verify everything works"
echo "4. Optionally delete old bucket: gcloud storage rm -r $OLD_BUCKET"
