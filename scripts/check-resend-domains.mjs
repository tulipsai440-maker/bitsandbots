import { readFileSync } from "fs";

const env = Object.fromEntries(
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

const key = env.RESEND_API_KEY?.trim();
if (!key) {
  console.log("NO_KEY");
  process.exit(0);
}

const r = await fetch("https://api.resend.com/domains", {
  headers: { Authorization: `Bearer ${key}` },
});
const j = await r.json();
if (!r.ok) {
  console.log("ERR", r.status, JSON.stringify(j));
  process.exit(1);
}
for (const d of j.data ?? []) {
  console.log(`${d.name}\t${d.status}\t${d.id}`);
}
if (!j.data?.length) console.log("NO_DOMAINS");
