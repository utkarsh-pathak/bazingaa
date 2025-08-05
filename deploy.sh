#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
# Replace these with your actual S3 bucket name and CloudFront distribution ID.
S3_BUCKET_NAME="YOUR_S3_BUCKET_NAME"
CLOUDFRONT_DISTRIBUTION_ID="YOUR_CLOUDFRONT_DISTRIBUTION_ID"

# The directory containing the built frontend code.
BUILD_DIR="frontend/dist"

# --- Deployment ---

echo "Starting deployment to S3 bucket: $S3_BUCKET_NAME"

# 1. Build the React application
echo "Building the application..."
(cd frontend && npm run build)

# 2. Sync the build directory with the S3 bucket
# The --delete flag removes old files from the bucket that are no longer in the build directory.
echo "Syncing build files to S3..."
aws s3 sync "$BUILD_DIR" "s3://$S3_BUCKET_NAME" --delete

# 3. Invalidate the CloudFront cache
# This ensures that users will see the latest version of the site immediately.
echo "Invalidating CloudFront cache for distribution: $CLOUDFRONT_DISTRIBUTION_ID"
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*"

echo "-------------------------------------"
echo "✅ Deployment successful!"
echo "-------------------------------------"