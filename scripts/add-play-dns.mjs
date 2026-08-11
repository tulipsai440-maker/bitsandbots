#!/usr/bin/env node
/**
 * Add Cloudflare DNS for platform demo hostnames on fllbots.com.
 * Creates proxied CNAME: *.play.fllbots.com -> fllbots.com
 *
 * Uses wrangler OAuth token from the default config path.
 */
import { readFileSync } from "fs";
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

function loadOAuthToken() {
  const config = readFileSync(wranglerConfigPath(), "utf8");
  const token = config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
  if (!token) throw new Error("Wrangler OAuth token not found. Run: npx wrangler login");
  return token;
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
    throw new Error(JSON.stringify(json.errors ?? json));
  }
  return json.result;
}

async function main() {
  const token = loadOAuthToken();
  const zones = await cf("GET", "/zones?name=fllbots.com", token);
  const zone = zones?.[0];
  if (!zone) throw new Error("fllbots.com zone not found in Cloudflare account");

  const existing = await cf(
    "GET",
    `/zones/${zone.id}/dns_records?name=*.play.fllbots.com`,
    token,
  );
  if (existing?.length) {
    console.log("OK: *.play.fllbots.com DNS already exists");
    return;
  }

  const record = await cf("POST", `/zones/${zone.id}/dns_records`, token, {
    type: "CNAME",
    name: "*.play",
    content: "fllbots.com",
    proxied: true,
    ttl: 1,
  });
  console.log(`Created DNS: ${record.name} -> ${record.content} (proxied)`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
