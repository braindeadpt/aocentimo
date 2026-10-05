// Capturas de tela da home e do /estilo, nos dois builds, para se ver
// a diferença com os olhos.
//   node scripts/_visual.mjs <out-antes> <out-depois> <destino>
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";

const raizA = process.argv[2];
const raizB = process.argv[3];
const destino = process.argv[4] || "/tmp/visual-fontes";
await mkdir(destino, { recursive: true });

const tipos = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
};
function servidor(raiz) {
  return createServer(async (req, res) => {
    const p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(raiz, p);
    const cands = extname(f) ? [f] : [`${f}.html`, join(f, "index.html"), f];
    for (const c of cands) { try { if ((await stat(c)).isFile()) { f = c; break; } } catch {} }
    try {
      const b = await readFile(f);
      res.writeHead(200, { "content-type": tipos[extname(f)] || "application/octet-stream" });
      res.end(b);
    } catch { res.writeHead(404).end("x"); }
  });
}
const srvs = [servidor(raizA), servidor(raizB)];
await Promise.all(srvs.map((s) => new Promise((r) => s.listen(0, r))));

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
      await page.goto(`http://localhost:${srvs[i].address().port}${rota}`, {
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