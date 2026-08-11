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
const from = "Bits & Bots <updates@fllbots.com>";
const to = "sravanthi440@gmail.com";

const r = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from,
    to: [to],
    subject: "Bits & Bots broadcast test",
    text: "If you got this, fllbots.com is verified in Resend.",
  }),
});

const text = await r.text();
console.log(r.status, text.slice(0, 500));
