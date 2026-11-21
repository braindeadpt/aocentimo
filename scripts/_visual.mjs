// Capturas de tela da home e do /estilo, nos dois builds, para se ver
// a diferença com os olhos.
//   node scripts/_visual.mjs <out-antes> <out-depois> <destino>
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { servirEstatico, urlBase } from "./_estatico.mjs";

const raizA = process.argv[2];
const raizB = process.argv[3];
const destino = process.argv[4] || "/tmp/visual-fontes";
await mkdir(destino, { recursive: true });

const srvs = await Promise.all([servirEstatico(raizA), servirEstatico(raizB)]);

const browser = await chromium.launch();
const alvos = [
  ["/", "home"],
  ["/estilo", "estilo"],
];
for (const [rota, nome] of alvos) {
  for (const [w, h, etiqueta] of [[1440, 900, "1440"], [390, 844, "390"]]) {
    for (const [i, tag] of [[0, "antes"], [1, "depois"]]) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        deviceScaleFactor: 2,
        reducedMotion: "reduce",
      });
      const page = await ctx.newPage();
      await page.goto(`${urlBase(srvs[i])}${rota}`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(700);
      const ficheiro = join(destino, `${nome}-${etiqueta}-${tag}.png`);
      await page.screenshot({ path: ficheiro, fullPage: true });
      console.log(ficheiro);
      await ctx.close();
    }
  }
}
await browser.close();
srvs.forEach((s) => s.close());