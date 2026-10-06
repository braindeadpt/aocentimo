// Compara a largura de TODOS os elementos de texto entre dois builds.
// É o teste que diz se a redução de fontes mudou o aspecto: a largura
// renderizada de cada nó de texto tem de bater ao milésimo.
//   node scripts/_comparar-larguras.mjs <out-antes> <out-depois> <rotas>
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const raizA = process.argv[2];
const raizB = process.argv[3];
const rotas = (process.argv[4] || "/,/estilo,/salario,/casa,/credito,/metodologia,/trabalho").split(",");

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain",
};
function servidor(raiz) {
  return createServer(async (req, res) => {
    const p = decodeURIComponent(req.url.split("?")[0]);
    let f = join(raiz, p);
    const cands = extname(f) ? [f] : [`${f}.html`, join(f, "index.html"), f];
    for (const c of cands) {
      try {
        if ((await stat(c)).isFile()) {
          f = c;
          break;
        }
      } catch {
        /* segue */
      }
    }
    try {
      const b = await readFile(f);
      res.writeHead(200, {
        "content-type": tipos[extname(f)] || "application/octet-stream",
      });
      res.end(b);
    } catch {
      res.writeHead(404).end("x");
    }
  });
}

const srvs = [servidor(raizA), servidor(raizB)];
await Promise.all(srvs.map((s) => new Promise((r) => s.listen(0, r))));
const bases = srvs.map((s) => `http://localhost:${s.address().port}`);

// Percorre os nós de texto (não os elementos) e mede o rectângulo de
// cada um: é a largura que o leitor vê, glifo a glifo.
const MEDIR = () => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.textContent.trim();
    if (!t) continue;
    const rg = document.createRange();
    rg.selectNodeContents(n);
    const r = rg.getBoundingClientRect();
    if (!r.width) continue;
    const cs = getComputedStyle(n.parentElement);
    out.push({
      txt: t.slice(0, 60),
      w: Math.round(r.width * 1000) / 1000,
      h: Math.round(r.height * 1000) / 1000,
      fam: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
      peso: cs.fontWeight,
    });
  }
  return out;
};

const browser = await chromium.launch();
let mudancas = 0;
let comparados = 0;
const detalhes = [];

for (const rota of rotas) {
  for (const vw of [1440, 390]) {
    const medir = async (base) => {
      const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(base + rota, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const r = await page.evaluate(MEDIR);
      await ctx.close();
      return r;
    };
    const a = await medir(bases[0]);
    const b = await medir(bases[1]);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i];
      const y = b[i];
      comparados++;
      if (!x || !y) {
        mudancas++;
        detalhes.push({ rota, vw, txt: (x || y).txt, nota: "nó não existe de um dos lados" });
        continue;
      }
      const dw = Math.abs(x.w - y.w);
      // 0,5 px num elemento pode ser sub-pixel arredondado; acima disso
      // é uma largura a mudar a sério.
      if (dw > 0.5) {
        mudancas++;
        detalhes.push({
          rota,
          vw,
          txt: x.txt,
          antes: x.w,
          depois: y.w,
          delta: +(y.w - x.w).toFixed(2),
          fam: `${x.fam}/${y.fam}`,
          peso: `${x.peso}/${y.peso}`,
        });
      }
    }
  }
}
await browser.close();
srvs.forEach((s) => s.close());

console.log(`nós de texto comparados: ${comparados}`);
console.log(`larguras que mudaram >0,5px: ${mudancas}`);
for (const d of detalhes.slice(0, 25)) console.log("  ", JSON.stringify(d));
if (detalhes.length > 25) console.log(`  ... e mais ${detalhes.length - 25}`);