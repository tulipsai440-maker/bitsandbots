import fs from "fs";

const raw = fs.readFileSync(".env", "utf8");
const env = {};
for (const line of raw.split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i <= 0) continue;
  let v = line.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[line.slice(0, i).trim()] = v;
}

function chk(k, expectPrefix) {
  const v = env[k] || "";
  const ok = v.length > 0 && (!expectPrefix || v.startsWith(expectPrefix));
  console.log(
    ok ? "OK " : "NO ",
    k,
    v
      ? `len=${v.length} prefix=${v.slice(0, Math.min(4, v.length))}…`
      : "MISSING",
  );
  return ok;
}

console.log("=== ENV ===");
const okResend = chk("RESEND_API_KEY", "re_");
const okFrom = chk("RESEND_FROM");
const okSvc = chk("SUPABASE_SERVICE_ROLE_KEY");
chk("SUPABASE_URL");
chk("VITE_SUPABASE_PUBLISHABLE_KEY");

const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const svc = env.SUPABASE_SERVICE_ROLE_KEY;

async function probe(label, path, opts = {}) {
  if (!svc) {
    console.log("NO ", label, "SKIP (no service role)");
    return null;
  }
  const res = await fetch(url + path, {
    ...opts,
    headers: {
      apikey: svc,
      Authorization: `Bearer ${svc}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  const ok = res.status >= 200 && res.status < 300;
  console.log(ok ? "OK " : "NO ", label, res.status, text.slice(0, 180));
  return json;
}

console.log("\n=== DATA ===");
const parents = await probe(
  "parent_contacts",
  "/rest/v1/parent_contacts?select=parent_name,email&order=parent_name",
);
const unique = await probe(
  "list_unique_parent_emails",
  "/rest/v1/rpc/list_unique_parent_emails",
  { method: "POST", body: "{}" },
);
const broadcast = await probe(
  "broadcast_settings",
  "/rest/v1/broadcast_settings?select=*",
);

let emailCount = 0;
if (Array.isArray(parents)) {
  const emails = [
    ...new Set(
      parents
        .map((r) => String(r.email || "").trim().toLowerCase())
        .filter((e) => e.includes("@")),
    ),
  ].sort();
  emailCount = emails.length;
  console.log("OK  unique parent emails:", emailCount);
  console.log("   ", emails.join(", ") || "(none)");
  const missing = parents
    .filter((r) => !String(r.email || "").trim())
    .map((r) => r.parent_name);
  console.log(
    missing.length ? "NO  parents without email:" : "OK  all parents have email",
    missing.length ? missing.join(", ") : "",
  );
}

if (Array.isArray(unique)) {
  console.log("OK  RPC unique count:", unique.length);
}

const wa =
  Array.isArray(broadcast) && broadcast[0]?.whatsapp_group_url
    ? broadcast[0].whatsapp_group_url
    : "(default in code)";
console.log("OK  WhatsApp group:", wa);

console.log("\n=== SUMMARY ===");
const ready =
  okResend &&
  okFrom &&
  okSvc &&
  emailCount > 0;
console.log(
  ready
    ? "READY — restart npm run dev if you have not, then use Admin → Broadcast"
    : "NOT READY — fix items marked NO above",
);
if (!okResend || !okFrom) console.log("- Uncomment/set RESEND_API_KEY and RESEND_FROM in .env");
if (!okSvc) console.log("- Set SUPABASE_SERVICE_ROLE_KEY in .env");
if (okSvc && emailCount === 0) {
  console.log("- Run supabase/reseed-parent-emails.sql then check Admin → Parents");
}
