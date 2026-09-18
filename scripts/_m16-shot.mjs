import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = ".screenshots/m16";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const vp of [{ width: 1440, height: 900, n: "1440" }, { width: 375, height: 667, n: "375" }]) {
  const p = await (await browser.newContext({ viewport: { width: vp.width, height: vp.height } })).newPage();
  await p.goto("http://localhost:3100/irs", { waitUntil: "networkidle" });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: `${OUT}/irs-topo-${vp.n}.png` });
  // os escalões a encher — fig. 1
  await p.evaluate(() => document.querySelectorAll("figure")[0]?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/irs-escaloes-${vp.n}.png` });
  // sobe o rendimento para 90k — enche tudo + solidariedade
  await p.fill("#esc-rc", "90000");
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/irs-escaloes-90k-${vp.n}.png` });
  // a nota de liquidação — fig. 3
  await p.evaluate(() => document.querySelectorAll("figure")[2]?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/irs-nota-${vp.n}.png` });
  // IRS Jovem — a sequência — fig. 4
  await p.evaluate(() => document.querySelectorAll("figure")[3]?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${OUT}/irs-jovem-${vp.n}.png` });
  await p.close();
}
await browser.close();
console.log("ok");
