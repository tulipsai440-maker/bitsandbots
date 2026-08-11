#!/usr/bin/env node
/**
 * Verify Bits & Bots and demo tenants do not share roster/content.
 *
 * Usage:
 *   node scripts/verify-tenant-isolation.mjs
 *   node scripts/verify-tenant-isolation.mjs --slug bots4life
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or anon) in .env
 */
import { readFileSync } from "fs";

const BITSANDBOTS_ID = "a1111111-1111-1111-1111-111111111111";
const DEMO_SLUG = process.argv.includes("--slug")
  ? process.argv[process.argv.indexOf("--slug") + 1]
  : "bots4life";

function loadEnv() {
  const env = {};
  for (const file of [".env", ".env.local"]) {
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
      /* optional */
    }
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key =
  env.SUPABASE_SERVICE_ROLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and key in .env");
  process.exit(1);
}

async function rpc(name, params = {}) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function query(table, tenantId) {
  const params = new URLSearchParams({
    select: "name,sort_order",
    tenant_id: `eq.${tenantId}`,
    order: "sort_order.asc,name.asc",
  });
  const res = await fetch(`${url}/rest/v1/${table}?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${table}: ${res.status} ${text}`);
  return JSON.parse(text);
}

function names(rows) {
  return (rows ?? []).map((r) => r.name).filter(Boolean);
}

function overlap(a, b) {
  const setB = new Set(b.map((n) => n.toLowerCase()));
  return a.filter((n) => setB.has(n.toLowerCase()));
}

async function main() {
  console.log("Tenant isolation check\n");

  const demoTenant = await rpc("resolve_tenant_by_slug", { p_slug: DEMO_SLUG });
  if (!demoTenant?.tenant_id) {
    console.error(`Demo tenant "${DEMO_SLUG}" not found. Run provision-team first.`);
    process.exit(1);
  }

  const demoId = demoTenant.tenant_id;
  console.log(`Bits & Bots tenant: ${BITSANDBOTS_ID}`);
  console.log(`Demo tenant (${DEMO_SLUG}): ${demoId}\n`);

  const [bitsMembers, demoMembers] = await Promise.all([
    query("team_members", BITSANDBOTS_ID),
    query("team_members", demoId),
  ]);

  const bitsNames = names(bitsMembers);
  const demoNames = names(demoMembers);

  console.log("Bits & Bots roster:", bitsNames.join(", ") || "(empty)");
  console.log(`${DEMO_SLUG} roster:`, demoNames.join(", ") || "(empty)");

  const shared = overlap(bitsNames, demoNames);
  const bitsMarkers = ["Trivarn", "Alexander", "Jaime", "Suresh"];
  const demoMarkers = ["Sam", "Riley", "Casey", "Taylor", "Bots4Life"];

  let ok = true;

  if (shared.length) {
    console.error("\nFAIL: Shared member names across tenants:", shared.join(", "));
    ok = false;
  } else {
    console.log("\nOK: No shared member names between tenants");
  }

  const bitsHasReal = bitsMarkers.some((m) =>
    bitsNames.some((n) => n.toLowerCase().includes(m.toLowerCase())),
  );
  const demoHasDemo = demoMarkers.some((m) =>
    demoNames.some((n) => n.toLowerCase().includes(m.toLowerCase())),
  );

  if (!bitsHasReal) {
    console.warn("WARN: Bits & Bots roster missing expected names (Trivarn, Alexander, …)");
  } else {
    console.log("OK: Bits & Bots has production member names");
  }

  if (!demoHasDemo) {
    console.warn(`WARN: ${DEMO_SLUG} roster missing expected demo names (Sam, Riley, …)`);
  } else {
    console.log(`OK: ${DEMO_SLUG} has demo member names`);
  }

  // RPC roster check (after patch-tenant-rpcs.sql)
  try {
    const [bitsRoster, demoRoster] = await Promise.all([
      rpc("list_assignment_roster", { p_tenant_id: BITSANDBOTS_ID }),
      rpc("list_assignment_roster", { p_tenant_id: demoId }),
    ]);
    const rpcShared = overlap(
      (bitsRoster ?? []).map((r) => r.name),
      (demoRoster ?? []).map((r) => r.name),
    );
    if (rpcShared.length) {
      console.error("FAIL: list_assignment_roster overlap:", rpcShared.join(", "));
      ok = false;
    } else {
      console.log("OK: list_assignment_roster RPC is tenant-scoped");
    }
  } catch (err) {
    console.warn("SKIP: list_assignment_roster RPC —", err.message);
    console.warn("      Run supabase/patch-tenant-rpcs.sql in SQL Editor");
  }

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
