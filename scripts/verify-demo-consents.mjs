#!/usr/bin/env node
/** Quick check: demo tenant scoped consents must be empty (no production PII). */
import { readFileSync } from "fs";

const DEMO = "cc79c490-7c54-496d-8b5a-2c8a230d9104";
const PROD = "a1111111-1111-1111-1111-111111111111";
const MARKERS = ["Trivarn", "Aarohi", "Aarav", "Alexander", "Vihas", "Tejasri", "Harshitha"];

function loadEnv() {
  const env = {};
  for (const file of [".env", ".env.local"]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (!line || line.startsWith("#")) continue;
        const i = line.indexOf("=");
        if (i < 1) continue;
        let v = line.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
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
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function consentsForTenant(tenantId) {
  const membersRes = await fetch(
    `${url}/rest/v1/team_members?select=id&tenant_id=eq.${tenantId}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const members = await membersRes.json();
  const ids = (members ?? []).map((m) => m.id);
  if (!ids.length) return [];

  const params = new URLSearchParams({
    select: "signed_by_name,mother_email,father_email,team_members(name)",
    team_member_id: `in.(${ids.join(",")})`,
  });
  const consentsRes = await fetch(`${url}/rest/v1/parent_media_consents?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  return consentsRes.json();
}

const [demo, prod] = await Promise.all([consentsForTenant(DEMO), consentsForTenant(PROD)]);

console.log("Demo consents (tenant-scoped):", demo.length);
console.log("Prod consents (tenant-scoped):", prod.length);

const demoNames = demo.map((r) => r.team_members?.name ?? r.signed_by_name ?? "");
const leak = demoNames.some((n) =>
  MARKERS.some((m) => n.toLowerCase().includes(m.toLowerCase())),
);

if (leak) {
  console.error("FAIL: production names in demo scoped consents:", demoNames.join(", "));
  process.exit(1);
}

console.log("OK: demo tenant has no production consent data when scoped by member IDs");
