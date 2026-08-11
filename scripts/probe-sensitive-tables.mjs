#!/usr/bin/env node
/** One-off probe: site_images PK / global admin read simulation */
import { readFileSync } from "fs";

function loadEnv() {
  const env = {};
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const h = { apikey: key, Authorization: `Bearer ${key}` };
const PROD = "a1111111-1111-1111-1111-111111111111";
const DEMO = "cc79c490-7c54-496d-8b5a-2c8a230d9104";

async function q(path) {
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: h });
  return r.json();
}

const [siteImages, prodContacts, allContactsUnscoped] = await Promise.all([
  q("site_images?select=key,tenant_id"),
  q(`parent_contacts?select=parent_name,email,phone,team_members(name,tenant_id)&team_members.tenant_id=eq.${PROD}`),
  q("parent_contacts?select=parent_name,email,phone,team_members(name)"),
]);

console.log("site_images rows:", siteImages.length);
console.log(JSON.stringify(siteImages, null, 2));
console.log("\nprod parent_contacts (scoped):", prodContacts.length);
console.log("ALL parent_contacts (simulates global admin RLS read):", allContactsUnscoped.length);
if (allContactsUnscoped.length > prodContacts.length) {
  console.log("WARN: global admin SELECT returns", allContactsUnscoped.length, "rows across all tenants");
}
