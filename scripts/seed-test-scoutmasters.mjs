/**
 * Seeds 6 test scoutmasters via the same Supabase flow as the admin form.
 * Usage: node scripts/seed-test-scoutmasters.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      const key = l.slice(0, i).trim();
      const val = l.slice(i + 1).trim().replace(/^"|"$/g, "");
      return [key, val];
    }),
);

const BASE = env.SUPABASE_URL;
const KEY = env.SUPABASE_PUBLISHABLE_KEY;
const email = process.env.ADMIN_EMAIL || "tulipsai440@gmail.com";
const password = process.env.ADMIN_PASSWORD || "Troop2001Admin!2025";
const BUCKET = "scoutmaster-photos";

const TEST_SCOUTMASTERS = [
  {
    name: "Marcus Whitfield",
    years: "2018–2024",
    bio: "Former Eagle Scout who returned to lead the troop after his son bridged. Specializes in backpacking and Leave No Trace.",
  },
  {
    name: "Elena Rodriguez",
    years: "2015–2022",
    bio: "Outdoor ethics instructor and summer camp coordinator. Led three consecutive Camp Woodruff treks.",
  },
  {
    name: "James Okafor",
    years: "2020–Present",
    bio: "PLC advisor and merit badge counselor for Camping and First Aid. Known for the legendary Dutch oven cobbler.",
  },
  {
    name: "Patricia Nguyen",
    years: "2012–2019",
    bio: "Chartered the troop's first female leadership program and organized annual Sun-N-Fun family days.",
  },
  {
    name: "Robert Chen",
    years: "2008–2015",
    bio: "Twenty-year Scouting veteran who mentored over forty Eagle Scouts during his tenure.",
  },
  {
    name: "Diana Holloway",
    years: "2022–Present",
    bio: "Committee liaison and advancement coordinator. Keeps Courts of Honor running like clockwork.",
  },
];

async function signIn() {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Auth failed: ${data.error_description || data.msg || res.status}`);
  return data.access_token;
}

async function fetchPortrait(seed) {
  const res = await fetch(`https://i.pravatar.cc/600?img=${seed}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Portrait fetch failed (${res.status})`);
  return Buffer.from(await res.arrayBuffer());
}

async function insertScoutmaster(token, row) {
  const res = await fetch(`${BASE}/rest/v1/scoutmasters`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      name: row.name,
      title: row.years,
      bio: row.bio,
      status: "approved",
      photo_url: null,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || JSON.stringify(data));
  return Array.isArray(data) ? data[0] : data;
}

async function uploadPhoto(token, scoutmasterId, bytes, index) {
  const path = `${scoutmasterId}/${Date.now()}-test-${index}.jpg`;
  const res = await fetch(`${BASE}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
      "x-upsert": "false",
    },
    body: bytes,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Upload failed (${res.status})`);
  }
  return `${BASE}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function updatePhotoUrl(token, id, photoUrl) {
  const res = await fetch(`${BASE}/rest/v1/scoutmasters?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ photo_url: photoUrl }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Update failed (${res.status})`);
  }
}

async function listApproved() {
  const res = await fetch(
    `${BASE}/rest/v1/scoutmasters?select=id,name,years,bio,photo_url,status&status=eq.approved&order=years.desc`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  );
  return res.json();
}

async function main() {
  const token = await signIn();
  console.log("Signed in as", email);

  let created = 0;
  for (let i = 0; i < TEST_SCOUTMASTERS.length; i++) {
    const sm = TEST_SCOUTMASTERS[i];
    try {
      const row = await insertScoutmaster(token, sm);
      const bytes = await fetchPortrait(10 + i);
      const photoUrl = await uploadPhoto(token, row.id, bytes, i);
      await updatePhotoUrl(token, row.id, photoUrl);
      console.log(`✓ ${sm.name}`);
      created++;
    } catch (err) {
      console.error(`✗ ${sm.name}:`, err.message);
    }
  }

  const list = await listApproved();
  console.log("\n--- Approved scoutmasters ---");
  if (Array.isArray(list)) {
    for (const row of list) {
      const years = row.years ?? row.title ?? "—";
      console.log(`• ${row.name} (${years})${row.photo_url ? " [photo]" : ""}`);
    }
  } else {
    console.log(list);
  }
  console.log(`\nView: http://localhost:8080/about`);
  console.log(`Admin: http://localhost:8080/admin/content`);
  console.log(`Added ${created} entries this run.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
