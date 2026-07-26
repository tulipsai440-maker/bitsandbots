#!/usr/bin/env bash
# Apply pending Supabase migrations using the database password.
# Get password: Supabase Dashboard → Project Settings → Database → Database password
#
# Usage:
#   SUPABASE_DB_PASSWORD='your-password' ./scripts/apply-supabase-migrations.sh

set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT_REF="xohaeezxzbeyzpjbngkj"
PASSWORD="${SUPABASE_DB_PASSWORD:-}"

if [[ -z "$PASSWORD" ]]; then
  echo "Missing SUPABASE_DB_PASSWORD."
  echo "Get it from: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
  echo "Then run: SUPABASE_DB_PASSWORD='...' ./scripts/apply-supabase-migrations.sh"
  exit 1
fi

ENCODED_PASSWORD=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$PASSWORD")
DB_URL="postgresql://postgres.${PROJECT_REF}:${ENCODED_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

echo "Applying migrations..."
npx --yes supabase db query --db-url "$DB_URL" --file supabase/migrations/_apply_pending.sql
echo "Done."
