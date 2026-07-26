/**
 * Adds portrait URLs to seeded scoutmasters (when storage bucket isn't set up yet).
 * Usage: NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/patch-scoutmaster-photos.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env"), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);

const BASE = env.SUPABASE_URL;
const KEY = env.SUPABASE_PUBLISHABLE_KEY;

const PHOTOS = {
  "Marcus Whitfield": "/photos/scoutmasters/class-a-1.jpg",
  "Elena Rodriguez": "/photos/scoutmasters/class-a-2.jpg",
  "James Okafor": "/photos/scoutmasters/class-a-3.jpg",
  "Patricia Nguyen": "/photos/scoutmasters/class-a-4.jpg",
  "Robert Chen": "/photos/scoutmasters/class-a-5.jpg",
  "Diana Holloway": "/photos/scoutmasters/class-a-6.jpg",
};

async function signIn() {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || "tulipsai440@gmail.com",
      password: process.env.ADMIN_PASSWORD || "Troop2001Admin!2025",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Auth failed");
  return data.access_token;
}

async function main() {
  const token = await signIn();
  const res = await fetch(
    `${BASE}/rest/v1/scoutmasters?select=id,name,photo_url&status=eq.approved&order=created_at.desc`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  const rows = await res.json();

  for (const row of rows) {
    const url = PHOTOS[row.name];
    if (!url) continue;
    const patch = await fetch(`${BASE}/rest/v1/scoutmasters?id=eq.${row.id}`, {
      method: "PATCH",
      headers: {
        apikey: KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photo_url: url }),
    });
    console.log(patch.ok ? `✓ ${row.name}` : `✗ ${row.name}: ${await patch.text()}`);
  }

  // Remove generic placeholder so only the 6 test profiles show
  const del = await fetch(`${BASE}/rest/v1/scoutmasters?name=eq.Troop%20Leadership`, {
    method: "DELETE",
    headers: { apikey: KEY, Authorization: `Bearer ${token}` },
  });
  console.log(del.ok ? "Removed placeholder 'Troop Leadership'" : "Placeholder not removed");
}

main().catch(console.error);
