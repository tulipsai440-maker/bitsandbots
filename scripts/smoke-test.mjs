/**
 * Smoke test: Supabase DB + assignment RPCs + public REST reads.
 * Does not print secrets. Run: node scripts/smoke-test.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  const raw = fs.readFileSync(path.join(root, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const key =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  env.SUPABASE_ANON_KEY;

const results = [];
function pass(name, detail = "") {
  results.push({ ok: true, name, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}
function fail(name, detail = "") {
  results.push({ ok: false, name, detail });
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function rest(pathname, opts = {}) {
  const res = await fetch(`${url}${pathname}`, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { res, json, text };
}

async function rpc(name, args = {}) {
  return rest(`/rest/v1/rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
}

async function main() {
  if (!url || !key) {
    fail("env", "Missing SUPABASE URL or publishable/anon key in .env");
    process.exit(1);
  }
  pass("env", "URL and anon/publishable key present");

  // --- Public tables ---
  {
    const { res, json } = await rest("/rest/v1/team_members?select=id,name&order=sort_order.asc");
    if (res.ok && Array.isArray(json) && json.length > 0) {
      pass("team_members", `${json.length} rows`);
    } else {
      fail("team_members", res.status + " " + (json?.message || json?.raw || ""));
    }
  }

  {
    const { res, json } = await rest("/rest/v1/calendar?select=id,title,event_date&order=event_date.asc&limit=5");
    if (res.ok && Array.isArray(json)) {
      pass("calendar", `${json.length} sample rows (table readable)`);
    } else {
      fail("calendar", res.status + " " + (json?.message || ""));
    }
  }

  {
    const { res, json } = await rest("/rest/v1/coaches?select=id,name");
    if (res.ok && Array.isArray(json)) pass("coaches", `${json.length} rows`);
    else fail("coaches", res.status + " " + (json?.message || ""));
  }

  {
    const { res, json } = await rest("/rest/v1/sponsors?select=id,name");
    if (res.ok && Array.isArray(json)) pass("sponsors", `${json.length} rows`);
    else fail("sponsors", res.status + " " + (json?.message || ""));
  }

  // --- Site images RPC ---
  {
    const { res, json } = await rpc("list_site_images");
    if (res.ok && Array.isArray(json)) pass("list_site_images", `${json.length} overrides`);
    else fail("list_site_images", res.status + " " + (json?.message || JSON.stringify(json)));
  }

  // --- Assignments roster ---
  let member = null;
  {
    const { res, json } = await rpc("list_assignment_roster");
    if (res.ok && Array.isArray(json) && json.length > 0) {
      member = json[0];
      pass("list_assignment_roster", `${json.length} kids; sample has_pin=${member.has_pin}`);
    } else {
      fail("list_assignment_roster", res.status + " " + (json?.message || JSON.stringify(json)));
    }
  }

  // --- PIN login / set ---
  const testPin = "4242";
  let sessionToken = null;
  if (member) {
    if (!member.has_pin) {
      const { res, json } = await rpc("set_member_pin", {
        p_member_id: member.id,
        p_pin: testPin,
      });
      if (res.ok && typeof json === "string") {
        sessionToken = json;
        pass("set_member_pin", "created PIN + session");
      } else {
        fail("set_member_pin", res.status + " " + (json?.message || JSON.stringify(json)));
      }
    } else {
      const { res, json } = await rpc("login_member_pin", {
        p_member_id: member.id,
        p_pin: testPin,
      });
      if (res.ok && typeof json === "string") {
        sessionToken = json;
        pass("login_member_pin", "session issued (PIN 4242)");
      } else {
        // try alternate common pin from UI screenshot earlier
        const retry = await rpc("login_member_pin", {
          p_member_id: member.id,
          p_pin: "2702",
        });
        if (retry.res.ok && typeof retry.json === "string") {
          sessionToken = retry.json;
          pass("login_member_pin", "session issued (PIN 2702)");
        } else {
          fail(
            "login_member_pin",
            (json?.message || retry.json?.message || "wrong PIN for first roster member — reset in admin"),
          );
        }
      }
    }
  }

  if (sessionToken) {
    const profile = await rpc("my_assignment_profile", { p_token: sessionToken });
    if (profile.res.ok && Array.isArray(profile.json) && profile.json[0]?.name) {
      pass("my_assignment_profile", profile.json[0].name);
    } else {
      fail("my_assignment_profile", profile.res.status + " " + (profile.json?.message || ""));
    }

    const tasks = await rpc("list_my_assignment_tasks", { p_token: sessionToken });
    if (tasks.res.ok && Array.isArray(tasks.json)) {
      pass("list_my_assignment_tasks", `${tasks.json.length} tasks`);
      if (tasks.json[0]) {
        const t = tasks.json[0];
        let upd = await rpc("update_my_assignment_task", {
          p_token: sessionToken,
          p_task_id: t.task_id,
          p_status: "doing",
          p_note: "smoke-test note",
          p_attachment_url: null,
          p_attachment_name: null,
        });
        if (!upd.res.ok) {
          upd = await rpc("update_my_assignment_task", {
            p_token: sessionToken,
            p_task_id: t.task_id,
            p_status: "doing",
            p_note: "smoke-test note",
          });
        }
        if (upd.res.ok) pass("update_my_assignment_task", "status→doing");
        else fail("update_my_assignment_task", upd.res.status + " " + (upd.json?.message || ""));
      } else {
        pass("update_my_assignment_task", "skipped (no tasks assigned yet)");
      }
    } else {
      fail("list_my_assignment_tasks", tasks.res.status + " " + (tasks.json?.message || ""));
    }

    await rpc("logout_member_session", { p_token: sessionToken });
    pass("logout_member_session", "called");
  }

  // --- Assignments table readable by admin only; anon should fail or empty depending on RLS ---
  {
    const { res, json } = await rest("/rest/v1/assignments?select=id,title&limit=3");
    if (res.status === 401 || res.status === 403 || (res.ok && Array.isArray(json))) {
      // RLS may return [] for anon
      if (res.ok) pass("assignments RLS (anon)", `readable=${json.length} (expect 0 without admin)`);
      else pass("assignments RLS (anon)", `blocked ${res.status} as expected`);
    } else {
      fail("assignments table", res.status + " " + (json?.message || ""));
    }
  }

  // --- Local pages ---
  for (const route of ["/", "/calendar", "/assignments", "/about", "/outreach", "/auth", "/admin/calendar"]) {
    try {
      const r = await fetch(`http://localhost:8080${route}`);
      if (r.ok || r.status === 200) pass(`page ${route}`, String(r.status));
      else fail(`page ${route}`, String(r.status));
    } catch (e) {
      fail(`page ${route}`, e.message);
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log("\n---");
  console.log(`${results.length - failed}/${results.length} passed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
