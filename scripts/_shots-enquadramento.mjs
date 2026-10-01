import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const lista = [];

async function tiro(url, nome, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector(".b-mundo .pin", { timeout: 20000 });
  await page.waitForTimeout(1200); // câmara re-enquadra (ResizeObserver) e fonte aplica-se
  await page.screenshot({ path: `/tmp/pr-enquadramento/${nome}.png` });
  if (w < 500) {
    const visiveis = await page.evaluate(() => {
      const j = document.querySelector(".b-janela").getBoundingClientRect();
      const dentro = (p) => { const r = p.getBoundingClientRect(); return r.top >= j.top && r.bottom <= j.bottom && r.left >= j.left && r.right <= j.right; };
      return [...document.querySelectorAll(".b-mundo .pin")].filter(dentro).map((p) => p.getAttribute("data-id"));
    });
    lista.push(`${nome}: ${JSON.stringify(visiveis)}`);
  }
  await page.close();
  console.log("ok", nome);
}

await tiro("https://aocentimo.pt/", "antes-1440", 1440, 900);
await tiro("https://aocentimo.pt/", "antes-390", 390, 844);
await tiro("http://localhost:3199/", "depois-1440", 1440, 900);
await tiro("http://localhost:3199/", "depois-390", 390, 844);
await browser.close();
console.log(lista.join("\n"));
