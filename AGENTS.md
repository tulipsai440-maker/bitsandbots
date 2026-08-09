# Bits & Bots — Agent notes

Local dev: `npm run dev` → http://localhost:8080

Supabase setup: see `supabase/SUPABASE-SETUP.txt`

Admin access is NOT a password issue. Password only signs the user in.
Admin requires `public.user_roles.role = 'admin'` for that user's `auth.users.id`.
Grant: `supabase/grant-admin.sql` or `supabase/grant-admin-trivarn440.sql`.

## Deploy (Git → Cloudflare)

- Live: https://fllbots.com (also https://www.fllbots.com; workers.dev: https://bitsandbots.sravanthi440.workers.dev)
- Manual: `npm run deploy` (= build + `wrangler deploy --config .output/server/wrangler.json --keep-vars`)
- Auto: GitHub Action on push to `main` — see `.github/DEPLOY.md` and `.github/workflows/deploy.yml`
- Production `SITE_ORIGIN`: `https://fllbots.com` (in `wrangler.toml` `[vars]`; confirm in Cloudflare dashboard)
- Never commit `.env`, `cloudflare-token.txt`, or service-role / Resend / WhatsApp tokens
- WhatsApp Cloud API broadcast: `supabase/WHATSAPP-SETUP.txt` (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`)
