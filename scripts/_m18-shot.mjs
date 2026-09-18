import { chromium } from "playwright";

const shots = [
  ["trabalho", "/trabalho", { width: 1440, height: 900 }],
  ["trabalho-mobile", "/trabalho", { width: 375, height: 800 }],
  ["dados", "/dados", { width: 1440, height: 900 }],
  ["dados-mobile", "/dados", { width: 375, height: 800 }],
];

const b = await chromium.launch();
for (const [nome, rota, vp] of shots) {
  const page = await b.newPage({ viewport: vp });
  await page.goto(`http://localhost:3100${rota}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: `.screenshots/m18/${nome}.png`, fullPage: false });
  if (vp.width === 1440 && rota === "/trabalho") {
    // a declaração a meio — vê a linha do tempo inteira
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `.screenshots/m18/trabalho-decl.png` });
  }
  if (vp.width === 375 && rota === "/dados") {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `.screenshots/m18/dados-mobile-taeg.png` });
  }
  await page.close();
  console.log(nome, "ok");
}
await b.close();
