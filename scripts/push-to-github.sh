#!/bin/bash
# One-time helper: saves your PAT to macOS Keychain, pushes, then deletes the token file.
set -euo pipefail
cd "$(dirname "$0")/.."

TOKEN_FILE=""
for candidate in github-token.txt .github-token; do
  if [[ ! -f "$candidate" ]]; then
    continue
  fi
  TOKEN=$(tr -d '[:space:]' < "$candidate")
  if [[ -n "$TOKEN" && "$TOKEN" != PASTE_YOUR_NEW_GITHUB_TOKEN_HERE* ]]; then
    TOKEN_FILE="$candidate"
    break
  fi
done

if [[ -z "$TOKEN_FILE" ]]; then
  echo "Edit github-token.txt in the project root and paste your GitHub token on one line."
  exit 1
fi

TOKEN=$(tr -d '[:space:]' < "$TOKEN_FILE")

printf 'protocol=https\nhost=github.com\nusername=tulipsai440-maker\npassword=%s\n' "$TOKEN" \
  | git credential-osxkeychain store

git push -u origin main

rm -f .github-token github-token.txt
echo "Push complete. Deleted token file for safety."
