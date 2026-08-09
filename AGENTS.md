# Bits & Bots — Agent notes

Local dev: `npm run dev` → http://localhost:8080

Supabase setup: see `supabase/SUPABASE-SETUP.txt`

Admin access is NOT a password issue. Password only signs the user in.
Admin requires `public.user_roles.role = 'admin'` for that user's `auth.users.id`.
Grant: `supabase/grant-admin.sql` or `supabase/grant-admin-trivarn440.sql`.

## Deploy (Git → Cloudflare)

- Live: https://bitsandbots.sravanthi440.workers.dev
- Manual: `npm run deploy` (= build + `wrangler deploy --keep-vars` from `.output`)
- Auto: GitHub Action on push to `main` — see `.github/DEPLOY.md` and `.github/workflows/deploy.yml`
- Production `SITE_ORIGIN`: `https://bitsandbots.sravanthi440.workers.dev` (in `wrangler.toml` `[vars]`; confirm in Cloudflare dashboard)
- Never commit `.env`, `cloudflare-token.txt`, or service-role / Resend keys
