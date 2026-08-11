# Demo platform plan (branch: `demo/platform-v1`)

> **Superseded for architecture** — use [`MULTI-TENANT.md`](./MULTI-TENANT.md) and [`PLATFORM-OPS.md`](./PLATFORM-OPS.md).
> Demo teams now share **one Supabase project** and **one Worker** (after merge), not a separate Supabase or required `fll-team-demo` Worker.
> `npm run dev:demo` + `VITE_TENANT_SLUG` is the supported local preview path.

**Production `fllbots.com` is untouched** — demo uses build mode + tenant slug, not production hostname.

## What we built tonight

1. **Demo build mode** — `VITE_DEMO_MODE=true` via `vite build --mode demo` (see `.env.demo.example`)
2. **Generic team branding** — "Demo Robotics Team" copy; no Bits & Bots references in demo defaults
3. **22 AI placeholder images** in `public/photos/demo/` (hero, logo, coaches, members, outreach, gallery, sponsors, OG)
4. **Demo banner** — yellow bar: "Demo site — edits carry over when you go live"
5. **Filled fallbacks** — coaches, team, sponsors, gallery never show empty placeholders in demo mode
6. **Separate deploy** — Worker `fll-team-demo` → `demo.fllbots.com` (not `fllbots.com`)

## Test locally (first step tomorrow)

```bash
cp .env.demo.example .env.demo
# Fill VITE_SUPABASE_* from a NEW Supabase project (not production)
npm run dev:demo
# → http://localhost:8081
```

Run all `supabase/setup-*.sql` on the demo Supabase project, then `supabase/seed-demo-site.sql`.

Grant yourself admin: `supabase/grant-admin.sql`

## Deploy demo (after DNS)

1. Cloudflare DNS: `demo` CNAME → same as apex or Workers route
2. Set Worker secrets on **fll-team-demo** (service role, Resend optional) — copy from production dashboard but use **demo Supabase**
3. ```bash
   npm run deploy:demo
   ```
4. Open https://demo.fllbots.com

## Scaling to 10 demo sites (next phase)

Your model: **demo URL = future live URL** (same data, no redo).

| Step | Action |
|------|--------|
| 1 | Provision tenant row: `slug`, `demo_host`, `status=demo` |
| 2 | Hostname routing: `wildcats.play.yourdomain.com` → tenant |
| 3 | Clone seed SQL per tenant (or multi-tenant `tenant_id` on all tables) |
| 4 | Coach plays on subdomain; go-live = custom domain + `status=live` |

**For 10 teams quickly (before full multi-tenant):**

- 10 Supabase projects OR 1 DB with `tenant_id` (prefer latter by team 6+)
- 10 Workers **or** 1 Worker with host-based tenant (prefer 1 Worker by team 6+)
- Wildcard DNS: `*.play.yourdomain.com`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev:demo` | Local demo on port 8081 |
| `npm run build:demo` | Production build with demo assets/defaults |
| `npm run deploy:demo` | Deploy to `fll-team-demo` Worker |

## Files added

- `src/lib/demo/*` — mode detection, assets, defaults, fallbacks
- `src/components/site/DemoBanner.tsx`
- `public/photos/demo/*` — placeholder images
- `wrangler.demo.toml` — reference config (routes documented)
- `supabase/seed-demo-site.sql`
- `.env.demo.example`

## When you have team names

Set per-tenant env at build or (better) store in `site_settings.site_name` after provisioning:

```bash
VITE_DEMO_SITE_NAME="Wildcats Robotics" npm run build:demo
```

Long-term: admin edits team name in Site content — no rebuild needed.

## Do NOT merge to `main` until demo is tested

This branch keeps production deploys on `main` safe. Merge demo mode behind `VITE_DEMO_MODE` only after you confirm demo Supabase + deploy work.
