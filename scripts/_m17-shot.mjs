import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT = ".screenshots/m17";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const vp of [{ width: 1440, height: 900, n: "1440" }, { width: 375, height: 667, n: "375" }]) {
  const p = await (await browser.newContext({ viewport: { width: vp.width, height: vp.height } })).newPage();
  // /inflacao — máquina do tempo
  await p.goto("http://localhost:3100/inflacao", { waitUntil: "networkidle" });
  await p.waitForTimeout(1600);
  await p.evaluate(() => document.querySelectorAll("figure")[2]?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/inflacao-maquina-${vp.n}.png` });
  // ano mais antigo — o euro encolhe mais
  await p.selectOption("#pd-ano", { index: 0 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/inflacao-encolhido-${vp.n}.png` });
  // /precos — contadores da bomba
  await p.goto("http://localhost:3100/precos", { waitUntil: "networkidle" });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${OUT}/precos-contadores-${vp.n}.png` });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/precos-serie-${vp.n}.png` });
  await p.close();
}
await browser.close();
console.log("ok");
