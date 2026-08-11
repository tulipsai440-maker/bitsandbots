# Platform ops — Cloudflare, Git, Supabase



## URLs



| | Demo | Production | Go live |

|--|------|------------|---------|

| **Pattern** | `{slug}.demo.com` | `fllbots.com` | Team domain |

| **Example** | `bots4life.demo.com` | Bits & Bots | `wildcatsrobotics.org` |

| **Has fllbots?** | No | Yes | No |



## Provision demo



```bash

npm run provision:team -- --slug bots4life --name "Bots4Life"

```



## Cloudflare



- **Production**: `fllbots.com`, `www.fllbots.com` → Worker `bitsandbots`

- **Demos**: add zone **`demo.com`**, wildcard `*.demo.com/*` → same Worker

- Set `PLATFORM_DEMO_APEX=demo.com` in `wrangler.toml` (already default)



## Local dev



`npm run dev:demo` + `VITE_TENANT_SLUG=bots4life` — hostname optional locally.



See **`docs/MULTI-TENANT.md`**.

