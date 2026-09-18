import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = ".screenshots/m14";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const vp of [{ width: 1440, height: 900, n: "1440" }, { width: 375, height: 667, n: "375" }]) {
  const p = await (await browser.newContext({ viewport: { width: vp.width, height: vp.height } })).newPage();
  await p.goto("http://localhost:3100/credito", { waitUntil: "networkidle" });
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${OUT}/credito-topo-${vp.n}.png` });
  // scroll até ao mapa de amortização
  await p.evaluate(() => window.scrollTo(0, 600));
  await p.waitForTimeout(1800);
  await p.screenshot({ path: `${OUT}/credito-mapa-${vp.n}.png` });
  // choque +1pp
  await p.getByText("Simular choque").first().click();
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/credito-choque-${vp.n}.png` });
  // gráfico Euribor
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${OUT}/credito-euribor-${vp.n}.png` });
  await p.close();
}
await browser.close();
console.log("ok");
