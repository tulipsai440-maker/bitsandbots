#!/usr/bin/env node
/**
 * Cloudflare DNS helpers for demo hosts on fllbots.com.
 *
 * Preferred (one-time): wildcard so every {slug}-demo.fllbots.com works forever
 *   node scripts/add-demo-dns.mjs --wildcard
 *
 * Per-slug (legacy / explicit):
 *   node scripts/add-demo-dns.mjs bots2thefuture
 *
 * Auth (tried in order until one can read the fllbots.com zone):
 *   CLOUDFLARE_DNS_API_TOKEN in .env  (preferred — Zone DNS Edit; does not break wrangler deploy)
 *   CLOUDFLARE_API_TOKEN / CF_API_TOKEN in .env
 *   cloudflare-token.txt (raw token)
 *   wrangler OAuth token
 *
 * Tip: keep DNS Edit in CLOUDFLARE_DNS_API_TOKEN so Workers deploy can keep using wrangler login
 * or a separate Workers token as CLOUDFLARE_API_TOKEN.
 */
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

function wranglerConfigPath() {
  if (process.platform === "win32") {
    return join(
      process.env.APPDATA || join(homedir(), "AppData", "Roaming"),
      "xdg.config",
      ".wrangler",
      "config",
      "default.toml",
    );
  }
  return join(homedir(), ".config", "wrangler", "config", "default.toml");
}

function collectTokens() {
  const tokens = [];
  const push = (token, src) => {
    const t = String(token || "").trim();
    if (t && !tokens.some((x) => x.token === t)) tokens.push({ token: t, src });
  };

  // Prefer DNS-specific token first so Workers-only CLOUDFLARE_API_TOKEN is not required.
  const preferredKeys = ["CLOUDFLARE_DNS_API_TOKEN", "CLOUDFLARE_API_TOKEN", "CF_API_TOKEN"];
  for (const file of [".env", ".env.local"]) {
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    const map = new Map();
    for (const line of lines) {
      if (!line || line.startsWith("#")) continue;
      const i = line.indexOf("=");
      if (i < 1) continue;
      const key = line.slice(0, i).trim();
      let v = line.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      map.set(key, v);
    }
    for (const key of preferredKeys) {
      if (map.get(key)) push(map.get(key), `${file}:${key}`);
    }
  }
  if (existsSync("cloudflare-token.txt")) {
    const raw = readFileSync("cloudflare-token.txt", "utf8").trim().split(/\r?\n/)[0];
    if (raw && !raw.includes("=")) push(raw, "cloudflare-token.txt");
  }
  try {
    const config = readFileSync(wranglerConfigPath(), "utf8");
    push(config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1], "wrangler-oauth");
  } catch {
    /* optional */
  }
  return tokens;
}

async function resolveWorkingToken() {
  const candidates = collectTokens();
  if (!candidates.length) return null;

  for (const c of candidates) {
    try {
      await cf("GET", "/zones?name=fllbots.com", c.token);
      return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function cf(method, path, token, body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) {
    const msg = JSON.stringify(json.errors ?? json);
    const err = new Error(msg);
    err.cf = json.errors;
    throw err;
  }
  return json.result;
}

export async function ensureDemoDns({ slug, wildcard = false } = {}) {
  const auth = await resolveWorkingToken();
  if (!auth) {
    throw new Error(
      "No working Cloudflare token. Put a Zone DNS Edit token in CLOUDFLARE_API_TOKEN (.env) or cloudflare-token.txt",
    );
  }
  const token = auth.token;

  const zones = await cf("GET", "/zones?name=fllbots.com", token);
  const zone = zones?.[0];
  if (!zone) throw new Error("fllbots.com zone not found for this Cloudflare account");

  if (wildcard) {
    const existing = await cf(
      "GET",
      `/zones/${zone.id}/dns_records?type=CNAME&name=${encodeURIComponent("*.fllbots.com")}`,
      token,
    );
    if (existing?.length) {
      return {
        created: false,
        name: existing[0].name,
        content: existing[0].content,
        note: "Wildcard already exists — all {slug}-demo.fllbots.com hosts are covered",
      };
    }
    const record = await cf("POST", `/zones/${zone.id}/dns_records`, token, {
      type: "CNAME",
      name: "*",
      content: "fllbots.com",
      proxied: true,
      ttl: 1,
      comment: "Covers all {slug}-demo.fllbots.com demo tenants",
    });
    return {
      created: true,
      name: record.name,
      content: record.content,
      note: "Wildcard created — future demos need no per-team CNAME",
    };
  }

  const s = String(slug || "").trim().toLowerCase();
  if (!s || s.includes(".") || s.includes(" ")) {
    throw new Error("Invalid slug");
  }
  const recordName = `${s}-demo`;
  const fqdn = `${recordName}.fllbots.com`;

  const existing = await cf(
    "GET",
    `/zones/${zone.id}/dns_records?name=${encodeURIComponent(fqdn)}`,
    token,
  );
  if (existing?.length) {
    return {
      created: false,
      name: existing[0].name,
      content: existing[0].content,
      url: `https://${fqdn}`,
    };
  }

  const record = await cf("POST", `/zones/${zone.id}/dns_records`, token, {
    type: "CNAME",
    name: recordName,
    content: "fllbots.com",
    proxied: true,
    ttl: 1,
  });
  return {
    created: true,
    name: record.name,
    content: record.content,
    url: `https://${fqdn}`,
  };
}

const isMain = process.argv[1] && process.argv[1].replace(/\\/g, "/").endsWith("add-demo-dns.mjs");
if (isMain) {
  const args = process.argv.slice(2);
  const wildcard = args.includes("--wildcard");
  const slug = args.find((a) => a !== "--wildcard") || "";
  try {
    const result = await ensureDemoDns({ slug, wildcard });
    console.log(JSON.stringify(result, null, 2));
    if (result.url) console.log(`Demo URL: ${result.url}`);
    if (result.note) console.log(result.note);
  } catch (err) {
    console.error(err.message || err);
    if (String(err.message || "").includes("Authentication error") || String(err.message || "").includes("9109")) {
      console.error(
        "\nYour token can deploy Workers but cannot edit DNS.\n" +
          "Create an API token at https://dash.cloudflare.com/profile/api-tokens\n" +
          "  Permissions: Zone → DNS → Edit  (zone: fllbots.com)\n" +
          "Save it as CLOUDFLARE_API_TOKEN in .env (or cloudflare-token.txt), then re-run:\n" +
          "  node scripts/add-demo-dns.mjs --wildcard",
      );
    }
    process.exit(1);
  }
}
