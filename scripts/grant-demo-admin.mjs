#!/usr/bin/env node
/**
 * Grant platform admin to a demo recipient who already signed up at /auth.
 *
 * Usage:
 *   node scripts/grant-demo-admin.mjs --email coach@example.com
 *   npm run grant:demo-admin -- --email coach@example.com
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { readFileSync } from "fs";

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
  let email = "";
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--email") email = argv[++i] ?? "";
  }
  return { email: email.trim().toLowerCase() };
}

const env = { ...loadEnv(), ...process.env };
const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const { email } = parseArgs(process.argv);

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!email || !email.includes("@")) {
  console.error("Usage: node scripts/grant-demo-admin.mjs --email recipient@example.com");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
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

async function grantAdmin(userId) {
  const res = await fetch(`${url}/rest/v1/user_roles`, {
    method: "POST",
    headers,
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

async function listAdmins() {
  const res = await fetch(
    `${url}/rest/v1/user_roles?role=eq.admin&select=user_id,role`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  if (!res.ok) return [];
  return res.json();
}

const user = await findUserByEmail(email);
if (!user) {
  console.error(`No account found for ${email}.`);
  console.error("Have them sign up at https://bots4life-demo.fllbots.com/auth first, then confirm email.");
  process.exit(1);
}

if (!user.email_confirmed_at) {
  console.warn(`WARN: ${email} has not confirmed email yet (email_confirmed_at is null).`);
  console.warn("Grant will still work once they confirm and sign in.");
}

const result = await grantAdmin(user.id);

if (result.alreadyAdmin) {
  console.log(`Already admin: ${email} (${user.id})`);
} else {
  console.log(`Granted admin: ${email} (${user.id})`);
}

console.log("\nTell the recipient:");
console.log("  1. Sign in at https://bots4life-demo.fllbots.com/auth");
console.log("  2. Open https://bots4life-demo.fllbots.com/admin");
console.log("  3. Use the coach bar (bottom) to edit pages and manage the team");

const admins = await listAdmins();
console.log(`\nTotal admin accounts: ${admins.length}`);
