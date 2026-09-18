// Screenshots antes/depois — .screenshots/<tarefa>/
// uso: node scripts/_shots.mjs <tarefa> <etiqueta> <rota1> [rota2...]
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const [tarefa, etiqueta, ...rotas] = process.argv.slice(2);
const dir = `.screenshots/${tarefa}`;
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
for (const rota of rotas) {
  const nome = rota === "/" ? "home" : rota.replaceAll("/", "_").replace(/^_/, "");
  for (const tema of ["dark", "light"]) {
    for (const w of [1440, 375]) {
      const page = await browser.newPage({
        viewport: { width: w, height: 900 },
        reducedMotion: "reduce",
      });
      await page.addInitScript((t) => localStorage.setItem("theme", t), tema);
      await page.goto(`http://localhost:3100${rota}`, { waitUntil: "networkidle" });
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${dir}/${etiqueta}-${nome}-${tema}-${w}.png`, fullPage: true });
      await page.close();
    }
  }
}
await browser.close();
console.log("ok:", dir);
