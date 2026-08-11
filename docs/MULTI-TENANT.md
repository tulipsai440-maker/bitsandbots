# Multi-tenant platform (100+ teams)



**One Cloudflare account. One Supabase project. One Worker deploy.**



Bits & Bots production stays on **`fllbots.com`**. Demo teams use a **separate apex** (default **`demo.com`**) so demo URLs do not include `fllbots`.



## URL model



| Stage | URL | Example |

|-------|-----|---------|

| **Production** | `fllbots.com` | Bits & Bots |

| **Demo** | `{slug}.demo.com` | `https://bots4life.demo.com` |

| **Go live** | Team's real domain | `https://wildcatsrobotics.org` |



No team-owned domain needed for demo. Real domain only at go-live.



## Add a demo team



```bash

npm run provision:team -- --slug bots4life --name "Bots4Life"

# → https://bots4life.demo.com

```



Override apex (if not using demo.com):



```bash

PLATFORM_DEMO_APEX=playfll.com npm run provision:team -- --slug wildcats --name "Wildcats"

# → https://wildcats.playfll.com

```



## Cloudflare



1. Register / add zone **`demo.com`** (or your `PLATFORM_DEMO_APEX`) to Cloudflare.

2. One wildcard route on the **demo zone** (not fllbots.com):



```toml

[[routes]]

pattern = "*.demo.com/*"

zone_name = "demo.com"

```



Production routes stay on `fllbots.com` / `www.fllbots.com` only.



## Go live (when team has a real domain)



```bash

npm run provision:team -- --slug wildcats --add-domain wildcatsrobotics.org --status live

```



## Local dev



| Command | Notes |

|---------|--------|

| `npm run dev` | Bits & Bots |

| `npm run dev:demo` | `VITE_TENANT_SLUG=bots4life` in `.env.demo` |



Legacy hostnames (`*.demo.fllbots.com`, `*.play.fllbots.com`) still resolve if present in `tenant_domains`.

