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
const resendKey = env.RESEND_API_KEY?.trim();
const from = env.RESEND_FROM?.trim() || "Bits & Bots <updates@fllbots.com>";

const rpc = await fetch(`${url}/rest/v1/rpc/list_unique_parent_emails`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: "{}",
});
const emails = (await rpc.json()).map((row) =>
  typeof row === "string" ? row : row.email,
);

console.log("From:", from);
console.log("Recipients:", emails.length, emails.join(", "));

const batch = emails.map((to) => ({
  from,
  to: [to],
  reply_to: ["sravanthi440@gmail.com"],
  subject: "Bits & Bots broadcast batch all-parents test",
  text: `Test delivery to ${to} at ${new Date().toISOString()}`,
}));

const r = await fetch("https://api.resend.com/emails/batch", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${resendKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(batch),
});

console.log("Batch status:", r.status);
console.log((await r.text()).slice(0, 2000));
