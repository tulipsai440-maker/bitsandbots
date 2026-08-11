import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const configPath = join(
  process.env.APPDATA || join(homedir(), ".config"),
  "xdg.config",
  ".wrangler",
  "config",
  "default.toml",
);
const config = readFileSync(configPath, "utf8");
const token = config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
if (!token) {
  console.log("NO_CF_TOKEN");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${token}` };

const zonesRes = await fetch(
  "https://api.cloudflare.com/client/v4/zones?name=fllbots.com",
  { headers },
);
const zones = await zonesRes.json();
const zone = zones.result?.[0];
if (!zone) {
  console.log("NO_ZONE");
  process.exit(1);
}
console.log("zone", zone.id, zone.status);

const dnsRes = await fetch(
  `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records?per_page=100`,
  { headers },
);
const dns = await dnsRes.json();
console.log("dns_success", dns.success, "count", dns.result?.length ?? 0);
if (!dns.success) console.log(JSON.stringify(dns.errors));
for (const r of dns.result ?? []) {
  console.log(`${r.type}\t${r.name}\t${r.content}`);
}
