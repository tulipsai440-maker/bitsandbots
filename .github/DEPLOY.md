# Deploy: GitHub → Cloudflare Worker

Live URL: https://bitsandbots.sravanthi440.workers.dev  
Worker name: `bitsandbots`  
Account ID: `11b79f1638b26b90bab543f70c41bf8a`

## How auto-deploy is wired

This repo uses a **GitHub Action** (`.github/workflows/deploy.yml`):

1. Push to `main`
2. Action runs `npm run build` (Nitro `cloudflare-module` → `.output`)
3. Action runs `wrangler deploy --keep-vars` from `.output`

Workers Builds (Cloudflare dashboard Git connect) is an optional alternative; see below.

## One-time: GitHub Actions secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Create at https://dash.cloudflare.com/profile/api-tokens — template **Edit Cloudflare Workers** (or custom: Account → Workers Scripts Edit + Account Settings Read) |
| `CLOUDFLARE_ACCOUNT_ID` | `11b79f1638b26b90bab543f70c41bf8a` |
| `VITE_SUPABASE_URL` | Same as local `.env` (`https://njhiqsbykiggxqkjrxse.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same as local `.env` (anon / publishable key) |
| `VITE_SUPABASE_PROJECT_ID` | Same as local `.env` (`njhiqsbykiggxqkjrxse`) |

Then: **Actions** → **Deploy Cloudflare Worker** → **Run workflow** (or push any commit to `main`).

## Cloudflare Worker vars / secrets (dashboard)

Worker **bitsandbots** → **Settings** → **Variables**:

- `SITE_ORIGIN` = `https://bitsandbots.sravanthi440.workers.dev` (also set in `wrangler.toml`)
- Keep secrets only in the dashboard (not in git): `BAND_ICAL_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc.
- Deploys use `--keep-vars` / `keep_vars = true` so dashboard-only values are not wiped.

## Optional: Workers Builds (dashboard Git integration)

Requires a one-time GitHub App install (cannot finish from CLI alone):

1. https://dash.cloudflare.com → **Workers & Pages** → **bitsandbots**
2. **Settings** → **Builds** → **Connect**
3. Choose **GitHub** → install/authorize **Cloudflare Workers and Pages** for `tulipsai440-maker`
4. Select repo **bitsandbots**, production branch **main**
5. Build settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `cd .output && npx wrangler deploy --keep-vars`
   - **Root directory:** `/`
6. Add build env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
7. Save → push to `main` (or **Retry deployment**)

If both GitHub Action and Workers Builds are enabled, disable one to avoid double deploys.

## Manual deploy (laptop)

```bash
npm run deploy
```
