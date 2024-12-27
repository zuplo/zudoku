#!/bin/bash

# Set your bucket name and prefix
BUCKET_NAME="cdn.zudoku.dev"   # Replace with your bucket name
PREFIX="geist/"                    # Prefix should not start with '/'

# Define the Cache-Control header value
CACHE_CONTROL="public, max-age=31536000"

# Update all objects with the specified prefix
echo "Updating Cache-Control for all objects with prefix '${PREFIX}' in bucket '${BUCKET_NAME}'..."

# List all objects with the prefix and apply the new Cache-Control header
gsutil -m setmeta -h "Cache-Control:${CACHE_CONTROL}" "gs://${BUCKET_NAME}/${PREFIX}**"

echo "Cache-Control update complete."
