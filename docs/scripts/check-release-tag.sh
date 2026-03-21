#!/bin/bash

# Vercel Ignored Build Step script
# Exit 0 = Skip build
# Exit 1 = Proceed with build

# Always build preview deployments
if [ "$VERCEL_ENV" != "production" ]; then
  echo "Preview deployment - proceeding with build"
  exit 1
fi

# For production: only build if the commit is tagged with a release
echo "Production deployment - checking for release tag..."

# Fetch tags from remote (Vercel does shallow clones)
git fetch --tags --quiet 2>/dev/null || true

# Check if current commit has a version tag (e.g., v1.0.0, 1.0.0)
TAGS=$(git tag --points-at HEAD 2>/dev/null)

if [ -z "$TAGS" ]; then
  echo "No tags found on this commit - skipping production build"
  echo "Production deployments only occur on tagged releases"
  exit 0
fi

# Check if any tag matches a version pattern
for TAG in $TAGS; do
  if echo "$TAG" | grep -qE '^v?[0-9]+\.[0-9]+\.[0-9]+'; then
    echo "Found release tag: $TAG - proceeding with production build"
    exit 1
  fi
done

echo "No release tags found (tags: $TAGS) - skipping production build"
exit 0
