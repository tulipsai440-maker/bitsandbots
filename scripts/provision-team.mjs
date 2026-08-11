#!/usr/bin/env node
/**
 * Provision a new FLL team tenant on the platform demo subdomain.
 *
 * Demo URL (default): {slug}.demo.com  — no fllbots in the demo hostname.
 * Go live (later):     --add-domain wildcatsrobotics.org --status live
 *
 * Usage:
 *   node scripts/provision-team.mjs --slug wildcats --name "Wildcats Robotics"
 *   node scripts/provision-team.mjs --slug wildcats --demo-host wildcats.demo.fllbots.com
 *   node scripts/provision-team.mjs --slug wildcats --add-domain wildcatsrobotics.org --status live
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { readFileSync } from "fs";

const PLATFORM_DEMO_APEX = (process.env.PLATFORM_DEMO_APEX || "demo.com")
  .trim()
  .replace(/^\./, "")
  .toLowerCase();
const PLATFORM_DEMO_SUFFIX = `.${PLATFORM_DEMO_APEX}`;

function loadEnv() {
  const files = [".env", ".env.local"];
  const env = {};
  for (const file of files) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (!line || line.startsWith("#")) continue;
        const i = line.indexOf("=");
        if (i < 1) continue;
        let v = line.slice(i + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        env[line.slice(0, i).trim()] = v;
      }
    } catch {
      /* ignore missing file */
    }
  }
  return env;
}

function normalizeHostname(input) {
  let h = input.trim().toLowerCase();
  h = h.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return h;
}

function normalizeTeamDomain(input) {
  let d = normalizeHostname(input);
  if (d.startsWith("www.")) d = d.slice(4);
  return d;
}

function platformDemoHostname(slug) {
  const s = slug.trim().toLowerCase();
  if (!s || s.includes(".") || s.includes(" ")) {
    throw new Error("Invalid slug");
  }
  return `${s}${PLATFORM_DEMO_SUFFIX}`;
}

function resolveDemoHostname({ slug, demoHost, playDomain }) {
  if (demoHost?.trim()) return normalizeHostname(demoHost);
  if (playDomain?.trim()) {
    console.warn("WARN: --play-domain is legacy. Default is {slug}.demo.fllbots.com");
    return normalizeHostname(playDomain);
  }
  if (slug?.trim()) return platformDemoHostname(slug);
  return null;
}

function parseArgs(argv) {
  const out = {
    slug: "",
    name: "",
    addDomain: "",
    status: "",
    demoHost: "",
    playDomain: "",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") out.slug = argv[++i] ?? "";
    else if (a === "--name") out.name = argv[++i] ?? "";
    else if (a === "--add-domain") out.addDomain = argv[++i] ?? "";
    else if (a === "--status") out.status = argv[++i] ?? "";
    else if (a === "--demo-host") out.demoHost = argv[++i] ?? "";
    else if (a === "--play-domain") out.playDomain = argv[++i] ?? "";
    else if (a === "--team-domain" || a === "--demo-domain") {
      console.warn(`WARN: ${a} is for go-live custom domains. Demo uses {slug}.demo.fllbots.com by default.`);
      argv[++i];
    }
  }
  return out;
}

function printCloudflareSteps(demoHostname) {
  console.log("\n--- Cloudflare (when ready to expose demo publicly) ---");
  console.log(`Demo URL:  https://${demoHostname}`);
  console.log("No team-owned domain needed until go-live.");
  console.log("");
  console.log(`Demo apex:  *.${PLATFORM_DEMO_APEX}  (set PLATFORM_DEMO_APEX in .env to change)`);
  console.log("");
  console.log("1. Add zone to Cloudflare (e.g. demo.com) + wildcard Worker route:");
  console.log("     [[routes]]");
  console.log(`     pattern = "*.${PLATFORM_DEMO_APEX}/*"`);
  console.log(`     zone_name = "${PLATFORM_DEMO_APEX}"`);
  console.log("");
  console.log("Go live later (their real domain, same data):");
  console.log("  npm run provision:team -- --slug SLUG --add-domain theirteam.org --status live");
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const args = parseArgs(process.argv);

if (!args.slug && !args.addDomain) {
  console.error(`Usage:
  node scripts/provision-team.mjs --slug wildcats --name "Wildcats Robotics"
  node scripts/provision-team.mjs --slug wildcats --add-domain wildcatsrobotics.org --status live`);
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function rest(method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

const BITSANDBOTS_TENANT_ID = "a1111111-1111-1111-1111-111111111111";

async function getJson(method, path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Prefer: "return=representation" },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function provisionTenantRest(slug, displayName, demoHostname) {
  const normalizedSlug = slug.toLowerCase().trim();
  const hostname = demoHostname.toLowerCase();

  let tenants = await getJson("GET", `tenants?slug=eq.${encodeURIComponent(normalizedSlug)}&select=*`);
  let tenant = tenants?.[0];

  if (!tenant) {
    const created = await rest("POST", "tenants", {
      slug: normalizedSlug,
      display_name: displayName.trim() || normalizedSlug,
      status: "demo",
    });
    tenant = created?.[0] ?? created;
  } else {
    await rest("PATCH", `tenants?id=eq.${tenant.id}`, {
      display_name: displayName.trim() || tenant.display_name,
    });
  }

  const tenantId = tenant.id;

  await rest("POST", "tenant_domains", [
    {
      tenant_id: tenantId,
      hostname,
      is_primary: true,
    },
  ]).catch(async (err) => {
    if (!String(err.message).includes("23505")) throw err;
    await rest("PATCH", `tenant_domains?hostname=eq.${encodeURIComponent(hostname)}`, {
      tenant_id: tenantId,
      is_primary: true,
    });
  });

  const existingSettings = await getJson(
    "GET",
    `site_settings?tenant_id=eq.${tenantId}&select=id&limit=1`,
  );
  if (!existingSettings?.length) {
    const templateRows = await getJson(
      "GET",
      `site_settings?tenant_id=eq.${BITSANDBOTS_TENANT_ID}&select=*&limit=1`,
    );
    const template = templateRows?.[0];
    if (!template) {
      throw new Error("Bits & Bots site_settings template row not found");
    }

    const maxIdRows = await getJson(
      "GET",
      "site_settings?select=id&order=id.desc&limit=1",
    );
    const nextId = (maxIdRows?.[0]?.id ?? 0) + 1;

    const { id: _id, tenant_id: _tid, updated_at: _ua, ...restRow } = template;
    const row = {
      ...restRow,
      id: nextId,
      tenant_id: tenantId,
      site_name: displayName.trim() || normalizedSlug,
      site_tagline: "FIRST LEGO League · Demo site",
      site_url: `https://${hostname}`,
      about_blurb: "Demo team site — customize names, photos, and copy in Admin.",
      about_hero_description: `${displayName.trim() || normalizedSlug} is a FIRST LEGO League team site.`,
      hero_subtext: "Explore the site and customize every page in Admin.",
    };
    await rest("POST", "site_settings", row);
  } else {
    await rest("PATCH", `site_settings?tenant_id=eq.${tenantId}`, {
      site_url: `https://${hostname}`,
    }).catch(() => {});
  }

  return {
    tenant_id: tenantId,
    slug: normalizedSlug,
    hostname,
    url: `https://${hostname}`,
  };
}

async function main() {
  if (args.slug) {
    const demoHostname = resolveDemoHostname(args);
    if (!demoHostname) {
      console.error("Provide --slug for a new demo team.");
      process.exit(1);
    }

    const result = await provisionTenantRest(
      args.slug,
      args.name || args.slug,
      demoHostname,
    );
    console.log("Provisioned tenant:");
    console.log(JSON.stringify(result, null, 2));

    const tenantId = result.tenant_id;
    const demoPhotos = "/photos/demo";

    const existingCoaches = await getJson(
      "GET",
      `coaches?tenant_id=eq.${tenantId}&select=id&limit=1`,
    );
    if (!existingCoaches?.length) {
      await rest("POST", "coaches", [
        {
          tenant_id: tenantId,
          name: "Alex Morgan",
          description: "Guides Robot Design, Innovation Project, and Core Values.",
          photo_url: `${demoPhotos}/coach-alex-morgan.png`,
          sort_order: 0,
        },
        {
          tenant_id: tenantId,
          name: "Jordan Lee",
          description: "Guides Robot Design, Innovation Project, and Core Values.",
          photo_url: `${demoPhotos}/coach-jordan-lee.png`,
          sort_order: 1,
        },
      ]);
      await rest("POST", "team_members", [
        ["Sam Chen", "member-sam.png", 0],
        ["Riley Patel", "member-riley.png", 1],
        ["Casey Nguyen", "member-casey.png", 2],
        ["Morgan Brooks", "member-morgan.png", 3],
        ["Jordan Kim", "member-jordan.png", 4],
        ["Taylor Wright", "member-taylor.png", 5],
      ].map(([name, photo, sort_order]) => ({
        tenant_id: tenantId,
        name,
        description: "Builds, codes, and contributes ideas during practice.",
        photo_url: `${demoPhotos}/${photo}`,
        sort_order,
      })));
      await rest("POST", "sponsors", [
        {
          tenant_id: tenantId,
          name: "Community Bank",
          description: "Supporting youth STEM programs.",
          logo_url: `${demoPhotos}/sponsor-community-bank.png`,
          sort_order: 0,
        },
        {
          tenant_id: tenantId,
          name: "Tech Partners LLC",
          description: "Local technology mentors.",
          logo_url: `${demoPhotos}/sponsor-tech-partners.png`,
          sort_order: 1,
        },
      ]);
    }

    console.log(`\nDemo URL: ${result.url}`);
    printCloudflareSteps(result.hostname);
  }

  if (args.addDomain) {
    if (!args.slug) {
      console.error("--add-domain requires --slug");
      process.exit(1);
    }
    const tenants = await rest(
      "GET",
      `tenants?slug=eq.${encodeURIComponent(args.slug)}&select=id,slug`,
    );
    const tenant = tenants?.[0];
    if (!tenant) {
      console.error(`Tenant not found: ${args.slug}`);
      process.exit(1);
    }
    const liveHost = normalizeTeamDomain(args.addDomain);
    await rest("POST", "tenant_domains", [
      {
        tenant_id: tenant.id,
        hostname: liveHost,
        is_primary: true,
      },
    ]).catch(async (err) => {
      if (!String(err.message).includes("23505")) throw err;
    });
    if (args.status === "live") {
      await rest("PATCH", `tenants?id=eq.${tenant.id}`, { status: "live" });
      await rest("PATCH", `site_settings?tenant_id=eq.${tenant.id}`, {
        site_url: `https://${liveHost}`,
      }).catch(() => {});
    }
    console.log(`Added live domain https://${liveHost} → ${args.slug}`);
    console.log("Add Worker route + DNS for their domain when they are ready.");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
