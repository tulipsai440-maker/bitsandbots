/**
 * Publish the Bots4Life hero photo to Supabase so it also shows on the live site
 * (https://bots4life-demo.fllbots.com), which reads site_images instead of the bundled asset.
 *
 * Only touches tenant cc79c490-… (Bots4Life). Bits & Bots keeps its own hero row.
 *
 *   node scripts/set-bots4life-hero.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const text = readFileSync(".env", "utf8");
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

const env = loadEnv();
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BOTS4LIFE = "cc79c490-7c54-496d-8b5a-2c8a230d9104";
const ALT =
  "Bots4Life FIRST Tech Challenge team with their robot at a Gulf Coast Robotics competition";

const buf = readFileSync(resolve("public/photos/demo/hero-bots4life-team.webp"));
const storagePath = `hero/${Date.now()}-bots4life-team.webp`;

const { error: upErr } = await admin.storage.from("site-images").upload(storagePath, buf, {
  contentType: "image/webp",
  upsert: true,
});
if (upErr) throw upErr;

const publicUrl = admin.storage.from("site-images").getPublicUrl(storagePath).data.publicUrl;

const { data: existing } = await admin
  .from("site_images")
  .select("key, storage_path")
  .eq("tenant_id", BOTS4LIFE)
  .eq("key", "hero")
  .maybeSingle();

if (existing) {
  const { error } = await admin
    .from("site_images")
    .update({ storage_path: storagePath, public_url: publicUrl, alt: ALT })
    .eq("tenant_id", BOTS4LIFE)
    .eq("key", "hero");
  if (error) throw error;
  console.log("updated Bots4Life hero (previous object:", existing.storage_path, ")");
} else {
  const { error } = await admin.from("site_images").insert({
    key: "hero",
    tenant_id: BOTS4LIFE,
    storage_path: storagePath,
    public_url: publicUrl,
    alt: ALT,
  });
  if (error) throw error;
  console.log("inserted Bots4Life hero");
}

console.log("public_url:", publicUrl);
