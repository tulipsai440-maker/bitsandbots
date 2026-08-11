import { readFileSync } from "fs";

function loadEnv() {
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        let v = l.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        return [l.slice(0, i), v];
      }),
  );
}

const env = loadEnv();
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log("Missing supabase env");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
};

const rpc = await fetch(`${url}/rest/v1/rpc/list_unique_parent_emails`, {
  method: "POST",
  headers: { ...headers, "Content-Type": "application/json" },
  body: "{}",
});
console.log("RPC status", rpc.status);
const emails = await rpc.json();
console.log("Unique parent emails:", Array.isArray(emails) ? emails.length : emails);
if (Array.isArray(emails)) {
  for (const row of emails) {
    const e = typeof row === "string" ? row : row.email;
    console.log(" -", e);
  }
}

const rows = await fetch(`${url}/rest/v1/parent_contacts?select=parent_name,email&order=parent_name`, {
  headers,
});
const contacts = await rows.json();
console.log("\nAll parent_contacts rows:");
for (const c of contacts) {
  console.log(` - ${c.parent_name}: ${c.email || "(no email)"}`);
}

// Test Resend to suresh440 and one roster email
const resendKey = env.RESEND_API_KEY?.trim();
const from = env.RESEND_FROM?.trim() || "Bits & Bots <updates@fllbots.com>";
const testTargets = ["suresh440@gmail.com", "naveenkpalanichamy@gmail.com"];

for (const to of testTargets) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Delivery test to ${to}`,
      text: "If you received this, Resend delivery to this address works.",
    }),
  });
  console.log(`\nResend to ${to}:`, r.status, (await r.text()).slice(0, 200));
}
