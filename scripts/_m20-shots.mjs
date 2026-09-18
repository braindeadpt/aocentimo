import { chromium } from "playwright";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 667 } });
for (const [r, f] of [
  ["/salario", "m20-salario"],
  ["/irs", "m20-irs"],
  ["/dados", "m20-dados"],
  ["/metodologia", "m20-met"],
]) {
  await p.goto("http://localhost:3100" + r, { waitUntil: "networkidle" });
  await p.waitForTimeout(700);
  await p.screenshot({ path: `tmp-m20/${f}-375.png` });
}
// papel a 400% — os rasgos lêem-se como papel?
const z = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 4 });
await z.goto("http://localhost:3100/salario", { waitUntil: "networkidle" });
await z.waitForTimeout(1400);
const el = await z.$("svg[data-papel]");
if (el) await el.screenshot({ path: "tmp-m20/m20-papel-4x.png" });
await b.close();
console.log("ok");
