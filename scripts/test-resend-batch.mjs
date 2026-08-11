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
const key = env.RESEND_API_KEY?.trim();
const from = "Bits & Bots <updates@fllbots.com>";
const testTo = "sravanthi440@gmail.com";

const batch = [
  {
    from,
    to: [testTo],
    reply_to: ["sravanthi440@gmail.com"],
    subject: "Bits & Bots batch test 1",
    text: "Batch individual send test — message 1",
  },
  {
    from,
    to: [testTo],
    reply_to: ["sravanthi440@gmail.com"],
    subject: "Bits & Bots batch test 2",
    text: "Batch individual send test — message 2",
  },
];

const r = await fetch("https://api.resend.com/emails/batch", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(batch),
});

console.log(r.status, (await r.text()).slice(0, 600));
