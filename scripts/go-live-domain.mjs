#!/usr/bin/env node
/**
 * Attach a team's own domain to an existing tenant and (when Cloudflare is ready)
 * point it at the bitsandbots Worker.
 *
 * Does NOT re-provision the tenant. Do not use provision-team.mjs for go-live —
 * that script rewrites demo copy and deletes site_images.
 *
 * Usage:
 *   node scripts/go-live-domain.mjs --slug bots4life --domain bots4life.org
 *
 * Steps this script can do:
 *   1. Insert tenant_domains for apex + www, set tenant status=live, update site_url
 *   2. Create (or find) the Cloudflare zone and print nameservers for Namecheap
 *   3. If the zone is already Active, attach Worker custom domains
 *
 * You still must paste the Cloudflare nameservers into Namecheap. After they go
 * Active (can take minutes to 48h), re-run this script to attach the Worker.
 */
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const ACCOUNT_ID = "11b79f1638b26b90bab543f70c41bf8a";
const WORKER_NAME = "bitsandbots";

function loadEnvFile(file) {
  const map = new Map();
  if (!existsSync(file)) return map;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    map.set(line.slice(0, i).trim(), v);
  }
  return map;
}

function loadEnv() {
  const env = {};
  for (const file of [".env", ".env.local"]) {
    for (const [k, v] of loadEnvFile(file)) env[k] = v;
  }
  return env;
}

function wranglerConfigPath() {
  if (process.platform === "win32") {
    return join(
      process.env.APPDATA || join(homedir(), "AppData", "Roaming"),
      "xdg.config",
      ".wrangler",
      "config",
      "default.toml",
    );
  }
  return join(homedir(), ".config", "wrangler", "config", "default.toml");
}

function collectCfTokens() {
  const tokens = [];
  const push = (token, src) => {
    const t = String(token || "").trim();
    if (t && !tokens.some((x) => x.token === t)) tokens.push({ token: t, src });
  };
  const env = loadEnv();
  for (const key of ["CLOUDFLARE_DNS_API_TOKEN", "CLOUDFLARE_API_TOKEN", "CF_API_TOKEN"]) {
    if (env[key]) push(env[key], `.env:${key}`);
  }
  if (existsSync("cloudflare-token.txt")) {
    const raw = readFileSync("cloudflare-token.txt", "utf8").trim().split(/\r?\n/)[0];
    if (raw && !raw.includes("=")) push(raw, "cloudflare-token.txt");
  }
  try {
    const config = readFileSync(wranglerConfigPath(), "utf8");
    push(config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1], "wrangler-oauth");
  } catch {
    /* optional */
  }
  return tokens;
}

function parseArgs(argv) {
  const out = { slug: "", domain: "", skipCloudflare: false, skipSupabase: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slug") out.slug = argv[++i] ?? "";
    else if (a === "--domain") out.domain = argv[++i] ?? "";
    else if (a === "--skip-cloudflare") out.skipCloudflare = true;
    else if (a === "--skip-supabase") out.skipSupabase = true;
  }
  return out;
}

function normalizeApex(input) {
  let d = String(input || "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (d.startsWith("www.")) d = d.slice(4);
  if (!d || d.includes(" ") || !d.includes(".")) {
    throw new Error("Invalid domain");
  }
  return d;
}

async function cf(method, path, token, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const msg = JSON.stringify(json.errors ?? json);
    const err = new Error(msg);
    err.cf = json.errors;
    throw err;
  }
  return json.result;
}

async function rest(url, key, method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function upsertDomain(url, key, tenantId, hostname, isPrimary) {
  try {
    await rest(url, key, "POST", "tenant_domains", [
      { tenant_id: tenantId, hostname, is_primary: isPrimary },
    ]);
  } catch (err) {
    if (!String(err.message).includes("23505")) throw err;
    await rest(
      url,
      key,
      "PATCH",
      `tenant_domains?hostname=eq.${encodeURIComponent(hostname)}`,
      { tenant_id: tenantId, is_primary: isPrimary },
    );
  }
}

async function goLiveSupabase({ slug, apex }) {
  const env = loadEnv();
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");

  const tenants = await rest(
    url,
    key,
    "GET",
    `tenants?slug=eq.${encodeURIComponent(slug)}&select=id,slug,status,display_name`,
  );
  const tenant = tenants?.[0];
  if (!tenant) throw new Error(`Tenant not found: ${slug}`);

  const existing = await rest(
    url,
    key,
    "GET",
    `tenant_domains?tenant_id=eq.${tenant.id}&select=hostname,is_primary`,
  );
  for (const row of existing || []) {
    if (row.hostname !== apex && row.hostname !== `www.${apex}` && row.is_primary) {
      await rest(
        url,
        key,
        "PATCH",
        `tenant_domains?hostname=eq.${encodeURIComponent(row.hostname)}`,
        { is_primary: false },
      );
    }
  }

  await upsertDomain(url, key, tenant.id, apex, true);
  await upsertDomain(url, key, tenant.id, `www.${apex}`, false);

  await rest(url, key, "PATCH", `tenants?id=eq.${tenant.id}`, { status: "live" });
  await rest(url, key, "PATCH", `site_settings?tenant_id=eq.${tenant.id}`, {
    site_url: `https://${apex}`,
  });

  const domains = await rest(
    url,
    key,
    "GET",
    `tenant_domains?tenant_id=eq.${tenant.id}&select=hostname,is_primary&order=is_primary.desc`,
  );
  return { tenant, domains };
}

async function findWorkingToken(testPath) {
  const candidates = collectCfTokens();
  if (!candidates.length) return null;
  for (const c of candidates) {
    try {
      await cf("GET", testPath, c.token);
      return c;
    } catch {
      /* try next */
    }
  }
  // Last resort: return first token even if the test path failed, so create-zone can try.
  return candidates[0] ? { ...candidates[0], unverified: true } : null;
}

async function ensureZone(apex) {
  const auth = await findWorkingToken(`/zones?name=${encodeURIComponent(apex)}`);
  if (!auth) {
    throw new Error(
      "No Cloudflare token. Put a token with Zone:Edit in CLOUDFLARE_API_TOKEN (.env) or cloudflare-token.txt",
    );
  }
  const token = auth.token;

  let zones = [];
  try {
    zones = await cf("GET", `/zones?name=${encodeURIComponent(apex)}`, token);
  } catch (err) {
    throw new Error(`Cloudflare token cannot list zones: ${err.message}`);
  }

  let zone = zones?.[0];
  if (!zone) {
    zone = await cf("POST", "/zones", token, {
      name: apex,
      account: { id: ACCOUNT_ID },
      jump_start: false,
    });
    console.log(`Created Cloudflare zone ${apex} (${zone.id})`);
  } else {
    console.log(`Cloudflare zone already exists: ${apex} status=${zone.status}`);
  }

  const detail = await cf("GET", `/zones/${zone.id}`, token);
  return { zone: detail, token, tokenSrc: auth.src };
}

async function attachWorkerHostnames(token, zone, hostnames) {
  const attached = [];
  for (const hostname of hostnames) {
    const result = await cf("PUT", `/accounts/${ACCOUNT_ID}/workers/domains`, token, {
      hostname,
      service: WORKER_NAME,
      zone_id: zone.id,
      zone_name: zone.name,
    });
    attached.push({ hostname, id: result.id, service: result.service });
  }
  return attached;
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.slug || !args.domain) {
    console.error("Usage: node scripts/go-live-domain.mjs --slug bots4life --domain bots4life.org");
    process.exit(1);
  }
  const slug = args.slug.trim().toLowerCase();
  const apex = normalizeApex(args.domain);

  if (!args.skipSupabase) {
    const { tenant, domains } = await goLiveSupabase({ slug, apex });
    console.log("\nSupabase tenant is live:");
    console.log(`  slug     ${tenant.slug}`);
    console.log(`  status   live`);
    console.log(`  site_url https://${apex}`);
    for (const d of domains || []) {
      console.log(`  host     ${d.hostname}${d.is_primary ? "  (primary)" : ""}`);
    }
  }

  if (args.skipCloudflare) {
    console.log("\nSkipped Cloudflare. Add the zone in the dashboard, then re-run without --skip-cloudflare.");
    return;
  }

  console.log("\n--- Cloudflare ---");
  const { zone, token } = await ensureZone(apex);
  const ns = zone.name_servers || [];
  console.log(`Zone status: ${zone.status}`);
  if (ns.length) {
    console.log("\nPaste these nameservers into Namecheap (Domain List → Manage → Nameservers → Custom DNS):");
    for (const n of ns) console.log(`  ${n}`);
  }

  if (zone.status !== "active") {
    console.log(
      `\nZone is not Active yet (currently "${zone.status}"). After Namecheap nameservers propagate, re-run:`,
    );
    console.log(`  node scripts/go-live-domain.mjs --slug ${slug} --domain ${apex} --skip-supabase`);
    console.log("Until then, https://" + apex + " will still show the Namecheap parking page.");
    return;
  }

  const attached = await attachWorkerHostnames(token, zone, [apex, `www.${apex}`]);
  console.log("\nWorker custom domains attached:");
  for (const a of attached) console.log(`  https://${a.hostname} → ${a.service}`);
  console.log(`\nLive URL: https://${apex}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
