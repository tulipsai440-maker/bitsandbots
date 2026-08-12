#!/usr/bin/env node
/**
 * Create (or reset) a shared demo coach admin for handover.
 *
 * Email: {slug}@demo.fllbots.com  (e.g. bots4life@demo.fllbots.com)
 * Default password: First@2026
 *
 * Usage:
 *   node scripts/provision-demo-admin.mjs --slug bots4life
 *   npm run provision:demo-admin -- --slug bots4life
 *   npm run provision:demo-admin -- --slug bots4life --password 'NewPass1!'
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { readFileSync } from "fs";

const DEFAULT_PASSWORD = "First@2026";

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

function parseArgs(argv) {
  let slug = "";
  let password = DEFAULT_PASSWORD;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--slug") slug = (argv[++i] ?? "").trim().toLowerCase();
    else if (argv[i] === "--password") password = argv[++i] ?? DEFAULT_PASSWORD;
  }
  return { slug, password };
}

function demoAdminEmail(slug) {
  return `${slug.trim().toLowerCase()}@demo.fllbots.com`;
}

const env = { ...loadEnv(), ...process.env };
const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const { slug, password } = parseArgs(process.argv);

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!slug || slug.includes("@") || slug.includes(" ")) {
  console.error("Usage: node scripts/provision-demo-admin.mjs --slug bots4life [--password 'First@2026']");
  process.exit(1);
}

const email = demoAdminEmail(slug);
const authHeaders = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function findUserByEmail(targetEmail) {
  const res = await fetch(
    `${url}/auth/v1/admin/users?filter=${encodeURIComponent(`email=eq.${targetEmail}`)}&per_page=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Auth admin lookup failed (${res.status}): ${text}`);
  }
  const data = JSON.parse(text);
  const users = data.users ?? data;
  return Array.isArray(users) ? users[0] : null;
}

async function createUser() {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { demo_shared_admin: true, demo_slug: slug },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Create user failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function updateUserPassword(userId) {
  const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ password, email_confirm: true }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Update password failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function grantAdmin(userId) {
  const res = await fetch(`${url}/rest/v1/user_roles`, {
    method: "POST",
    headers: {
      ...authHeaders,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ user_id: userId, role: "admin" }),
  });
  const text = await res.text();
  if (res.status === 409 || text.includes("23505")) {
    return { alreadyAdmin: true };
  }
  if (!res.ok) {
    throw new Error(`Grant admin failed (${res.status}): ${text}`);
  }
  return { alreadyAdmin: false };
}

let user = await findUserByEmail(email);
if (!user) {
  user = await createUser();
  console.log(`Created demo admin user: ${email}`);
} else {
  await updateUserPassword(user.id);
  console.log(`Reset password for existing demo admin: ${email}`);
}

const adminResult = await grantAdmin(user.id);
if (adminResult.alreadyAdmin) {
  console.log("Admin role already granted.");
} else {
  console.log("Granted admin role.");
}

console.log("\n--- Handover credentials (remove after they set up their own admin) ---");
console.log(`  Sign in URL: https://${slug}-demo.fllbots.com/auth`);
console.log(`  Username:    ${slug}`);
console.log(`  Email:       ${email}`);
console.log(`  Password:    ${password}`);
console.log("\nRecipient signs in at /auth with their team username and this password (share offline).");
console.log("To remove later: delete user in Supabase Auth or revoke admin in user_roles.");
