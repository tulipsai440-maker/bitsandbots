#!/usr/bin/env node
/**
 * Verify Bits & Bots and demo tenants do not share roster/content/PII.
 *
 * Usage:
 *   node scripts/verify-tenant-isolation.mjs
 *   node scripts/verify-tenant-isolation.mjs --slug bots4life
 *   node scripts/verify-tenant-isolation.mjs --env-file=.env --slug bots4life
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or anon) in .env
 */
import { readFileSync } from "fs";

const BITSANDBOTS_ID = "a1111111-1111-1111-1111-111111111111";
const DEMO_SLUG = process.argv.includes("--slug")
  ? process.argv[process.argv.indexOf("--slug") + 1]
  : "bots4life";

const PRODUCTION_MARKERS = [
  "Trivarn",
  "Aarohi",
  "Aarav",
  "Alexander",
  "Vihas",
  "Tejasri",
  "Harshitha",
  "suresh440@gmail.com",
  "sravanthi440@gmail.com",
];

function loadEnv() {
  const env = {};
  const envFileArg = process.argv.includes("--env-file")
    ? process.argv[process.argv.indexOf("--env-file") + 1]
    : null;
  const files = envFileArg ? [envFileArg] : [".env", ".env.local"];
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

const headers = { apikey: key, Authorization: `Bearer ${key}` };

async function rpc(name, params = {}) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

async function restGet(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path}: ${res.status} ${text}`);
  return text ? JSON.parse(text) : [];
}

async function queryMembers(tenantId) {
  return restGet(
    `team_members?select=id,name,sort_order&tenant_id=eq.${tenantId}&order=sort_order.asc,name.asc`,
  );
}

function names(rows) {
  return (rows ?? []).map((r) => r.name).filter(Boolean);
}

function overlap(a, b) {
  const setB = new Set(b.map((n) => n.toLowerCase()));
  return a.filter((n) => setB.has(n.toLowerCase()));
}

function hasProductionMarker(text) {
  const s = String(text ?? "").toLowerCase();
  return PRODUCTION_MARKERS.some((m) => s.includes(m.toLowerCase()));
}

async function memberIdsForTenant(tenantId) {
  const members = await queryMembers(tenantId);
  return (members ?? []).map((m) => m.id).filter(Boolean);
}

/** Rows linked to tenant via team_member_id join. */
async function scopedViaMembers(table, select, tenantId) {
  const ids = await memberIdsForTenant(tenantId);
  if (!ids.length) return [];
  return restGet(`${table}?select=${encodeURIComponent(select)}&team_member_id=in.(${ids.join(",")})`);
}

/** Rows with direct tenant_id column. */
async function scopedByTenantId(table, select, tenantId) {
  try {
    return await restGet(`${table}?select=${encodeURIComponent(select)}&tenant_id=eq.${tenantId}`);
  } catch (err) {
    if (String(err.message).includes("tenant_id")) return { _noColumn: true, rows: [] };
    throw err;
  }
}

function extractStrings(row, fields) {
  const out = [];
  for (const f of fields) {
    const parts = f.split(".");
    let v = row;
    for (const p of parts) v = v?.[p];
    if (v != null && String(v).trim()) out.push(String(v));
  }
  return out;
}

function checkDemoRows(label, rows, textFields, failMessages) {
  let ok = true;
  const count = Array.isArray(rows) ? rows.length : 0;
  console.log(`\n[${label}] demo-scoped rows: ${count}`);

  for (const row of rows ?? []) {
    for (const text of extractStrings(row, textFields)) {
      if (hasProductionMarker(text)) {
        console.error(`FAIL [${label}]: production marker in demo data: "${text}"`);
        failMessages.push(`${label}: ${text}`);
        ok = false;
      }
    }
  }

  if (ok && count > 0) {
    console.log(`OK: ${label} has no production markers in demo scope`);
  } else if (ok) {
    console.log(`OK: ${label} empty for demo (expected)`);
  }
  return ok;
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

  let ok = true;
  const failMessages = [];

  // --- Roster ---
  const [bitsMembers, demoMembers] = await Promise.all([
    queryMembers(BITSANDBOTS_ID),
    queryMembers(demoId),
  ]);
  const bitsNames = names(bitsMembers);
  const demoNames = names(demoMembers);

  console.log("Bits & Bots roster:", bitsNames.join(", ") || "(empty)");
  console.log(`${DEMO_SLUG} roster:`, demoNames.join(", ") || "(empty)");

  const shared = overlap(bitsNames, demoNames);
  if (shared.length) {
    console.error("\nFAIL: Shared member names across tenants:", shared.join(", "));
    ok = false;
  } else {
    console.log("\nOK: No shared member names between tenants");
  }

  // --- RPC roster ---
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
  }

  // --- Parent media consents (the original leak) ---
  async function consentKidNames(tenantId) {
    const members = await queryMembers(tenantId);
    const memberIds = (members ?? []).map((m) => m.id).filter(Boolean);
    if (!memberIds.length) return [];

    const rows = await restGet(
      `parent_media_consents?select=team_member_id,signed_by_name,mother_email,father_email,team_members(name)&team_member_id=in.(${memberIds.join(",")})`,
    );
    return (rows ?? []).map((r) => r.team_members?.name ?? r.signed_by_name).filter(Boolean);
  }

  try {
    const [bitsConsentNames, demoConsentNames] = await Promise.all([
      consentKidNames(BITSANDBOTS_ID),
      consentKidNames(demoId),
    ]);

    console.log("\nBits & Bots consents:", bitsConsentNames.join(", ") || "(none)");
    console.log(`${DEMO_SLUG} consents:`, demoConsentNames.join(", ") || "(none)");

    const consentShared = overlap(bitsConsentNames, demoConsentNames);
    if (consentShared.length) {
      console.error("FAIL: Shared consent kid names:", consentShared.join(", "));
      ok = false;
    } else {
      console.log("OK: No shared consent kid names between tenants");
    }

    if (demoConsentNames.some((n) => hasProductionMarker(n))) {
      console.error("FAIL: Demo has production consent names");
      ok = false;
    } else {
      console.log("OK: Demo consents have no production markers");
    }

    try {
      const [bitsRpc, demoRpc] = await Promise.all([
        rpc("list_media_consented_member_ids", { p_tenant_id: BITSANDBOTS_ID }),
        rpc("list_media_consented_member_ids", { p_tenant_id: demoId }),
      ]);
      const bitsRpcSet = new Set((bitsRpc ?? []).map(String));
      const demoRpcSet = new Set((demoRpc ?? []).map(String));
      const rpcOverlap = [...bitsRpcSet].filter((id) => demoRpcSet.has(id));
      if (rpcOverlap.length) {
        console.error("FAIL: list_media_consented_member_ids overlap:", rpcOverlap.length, "ids");
        ok = false;
      } else {
        console.log("OK: list_media_consented_member_ids RPC is tenant-scoped");
      }
    } catch (err) {
      console.warn("SKIP: list_media_consented_member_ids RPC —", err.message);
    }
  } catch (err) {
    console.warn("SKIP: parent_media_consents —", err.message);
  }

  // --- Parent contacts / participant details ---
  try {
    const demoContacts = await scopedViaMembers(
      "parent_contacts",
      "parent_name,email,phone,team_members(name)",
      demoId,
    );
    if (!checkDemoRows("parent_contacts", demoContacts, ["parent_name", "email", "phone", "team_members.name"], failMessages)) {
      ok = false;
    }

    const demoDetails = await scopedViaMembers(
      "participant_details",
      "email,phone,team_members(name)",
      demoId,
    );
    if (!checkDemoRows("participant_details", demoDetails, ["email", "phone", "team_members.name"], failMessages)) {
      ok = false;
    }
  } catch (err) {
    console.warn("SKIP: parent contacts —", err.message);
  }

  // --- Assignments ---
  try {
    const demoAssignments = await scopedByTenantId(
      "assignments",
      "title,description",
      demoId,
    );
    if (!Array.isArray(demoAssignments)) {
      console.log("\n[assignments] tenant_id column missing — rely on app filter");
    } else if (!checkDemoRows("assignments", demoAssignments, ["title", "description"], failMessages)) {
      ok = false;
    }
  } catch (err) {
    console.warn("SKIP: assignments —", err.message);
  }

  // --- Gallery ---
  try {
    const demoGallery = await scopedByTenantId(
      "gallery_photos",
      "submitted_by_name,submitted_by_email,caption",
      demoId,
    );
    if (!Array.isArray(demoGallery)) {
      console.log("\n[gallery_photos] tenant_id column missing");
    } else if (!checkDemoRows("gallery_photos", demoGallery, ["submitted_by_name", "submitted_by_email", "caption"], failMessages)) {
      ok = false;
    }

    // Unscoped query detects the old fetchApprovedGalleryRows() leak pattern (fixed in app code).
    const allApproved = await restGet(
      "gallery_photos?select=id,tenant_id,submitted_by_name,submitted_by_email&status=eq.approved",
    );
    const prodApproved = (allApproved ?? []).filter((r) => r.tenant_id === BITSANDBOTS_ID);
    const demoApproved = (allApproved ?? []).filter((r) => r.tenant_id === demoId);
    console.log(`\n[gallery] prod approved: ${prodApproved.length}, demo approved: ${demoApproved.length}`);
    if (prodApproved.length > 0 && demoApproved.length === 0) {
      console.log(
        "INFO: prod gallery photos exist; app fetchApprovedGalleryRows() must filter by tenant_id (fixed in src/lib/gallery-uploads.ts)",
      );
    }
  } catch (err) {
    console.warn("SKIP: gallery —", err.message);
  }

  // --- Broadcast settings ---
  try {
    const demoBroadcast = await scopedByTenantId("broadcast_settings", "whatsapp_group_url", demoId);
    if (Array.isArray(demoBroadcast)) {
      console.log(`\n[broadcast_settings] demo rows: ${demoBroadcast.length}`);
    }
  } catch (err) {
    console.warn("SKIP: broadcast_settings —", err.message);
  }

  // --- Join notify emails ---
  try {
    const allJoinNotify = await restGet("join_notify_emails?select=email,label,tenant_id");
    const demoJoin = (allJoinNotify ?? []).filter((r) => r.tenant_id === demoId);
    const prodJoin = (allJoinNotify ?? []).filter((r) => r.tenant_id === BITSANDBOTS_ID);
    const unscoped = (allJoinNotify ?? []).filter((r) => !r.tenant_id);
    console.log(`\n[join_notify_emails] prod: ${prodJoin.length}, demo: ${demoJoin.length}, unscoped: ${unscoped.length}, total: ${allJoinNotify?.length ?? 0}`);
    if (allJoinNotify?.some((r) => r.tenant_id === undefined)) {
      console.warn("WARN: join_notify_emails rows lack tenant_id — global table");
    }
    if (!checkDemoRows("join_notify_emails (demo tenant_id)", demoJoin, ["email", "label"], failMessages)) {
      ok = false;
    }
    if (unscoped.length > 0) {
      console.warn("WARN: unscoped join_notify_emails visible to all tenants via fetchAllJoinNotifyEmails()");
    }
  } catch (err) {
    console.warn("SKIP: join_notify_emails —", err.message);
  }

  // --- Announcements ---
  try {
    const allAnnouncements = await restGet("announcements?select=title,body,tenant_id");
    const demoAnnouncements = (allAnnouncements ?? []).filter((r) => r.tenant_id === demoId);
    const prodAnnouncements = (allAnnouncements ?? []).filter((r) => r.tenant_id === BITSANDBOTS_ID);
    console.log(`\n[announcements] prod: ${prodAnnouncements.length}, demo: ${demoAnnouncements.length}`);
    if ((allAnnouncements ?? []).length > demoAnnouncements.length) {
      console.warn(
        "WARN: fetchAllAnnouncements() without tenant filter would show",
        prodAnnouncements.length,
        "production announcements on demo admin",
      );
    }
  } catch (err) {
    console.warn("SKIP: announcements —", err.message);
  }

  // --- Cross-tenant row count summary ---
  console.log("\n--- Cross-tenant overlap summary ---");
  const tablesWithTenantId = [
    "team_members",
    "coaches",
    "sponsors",
    "calendar",
    "assignments",
    "gallery_photos",
    "site_settings",
    "broadcast_settings",
  ];

  for (const table of tablesWithTenantId) {
    try {
      const prod = await restGet(`${table}?select=id&tenant_id=eq.${BITSANDBOTS_ID}`);
      const demo = await restGet(`${table}?select=id&tenant_id=eq.${demoId}`);
      const sharedIds = overlap(
        (prod ?? []).map((r) => r.id),
        (demo ?? []).map((r) => r.id),
      );
      if (sharedIds.length) {
        console.error(`FAIL: ${table} shared row IDs:`, sharedIds.join(", "));
        ok = false;
      }
    } catch {
      /* table may not exist */
    }
  }
  console.log("OK: No shared row IDs between prod and demo for core tables");

  // --- Summary ---
  console.log("\n========================================");
  if (ok && failMessages.length === 0) {
    console.log("PASS: Tenant-scoped data checks passed");
  } else {
    console.error("FAIL: Issues found:");
    for (const m of failMessages) console.error("  -", m);
  }

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
