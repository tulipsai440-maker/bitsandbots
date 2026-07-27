#!/bin/bash
# Deploy to Cloudflare using a token file (avoids wrangler login / OAuth).
set -euo pipefail
cd "$(dirname "$0")/.."

TOKEN_FILE="cloudflare-token.txt"
if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "Create cloudflare-token.txt in the project root and paste your Cloudflare API token."
  exit 1
fi

TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")
if [[ -z "$TOKEN" || "$TOKEN" == PASTE_YOUR_CLOUDFLARE_API_TOKEN_HERE* ]]; then
  echo "Edit cloudflare-token.txt and paste your real Cloudflare API token."
  exit 1
fi

export CLOUDFLARE_API_TOKEN="$TOKEN"
npm run build
cd .output && npx wrangler deploy --keep-vars
cd ..
echo "Deploy complete."
