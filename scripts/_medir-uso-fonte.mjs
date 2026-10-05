// Que combinações de peso/largura o site usa MESMO? Em vez de ler o CSS
// e adivinhar, pergunta-se ao browser por cada elemento com texto.
//   node scripts/_medir-uso-fonte.mjs <rotas>
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const raiz = "out";
const rotas = (process.argv[2] || "/,/estilo,/salario,/casa,/credito,/dados,/aprender/taeg,/trabalho,/precos,/poupanca,/irs,/impostos,/inflacao,/casa,/metodologia,/sobre").split(",");

const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain" };
const srv = createServer(async (req, res) => {
  const p = decodeURIComponent(req.url.split("?")[0]);
  let f = join(raiz, p);
  const cands = extname(f) ? [f] : [`${f}.html`, join(f, "index.html"), f];
  for (const c of cands) { try { if ((await stat(c)).isFile()) { f = c; break; } } catch {} }
  try { const b = await readFile(f); res.writeHead(200, { "content-type": tipos[extname(f)] || "application/octet-stream" }); res.end(b); }
  catch { res.writeHead(404).end("x"); }
});
await new Promise((r) => srv.listen(0, r));
const base = `http://localhost:${srv.address().port}`;

const browser = await chromium.launch();
const usos = new Map(); // "fam|peso|largura" -> {n, exemplo}

for (const rota of rotas) {
  for (const vw of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(base + rota, { waitUntil: "networkidle" });
    const achados = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        // só nós com texto próprio visível
        const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
        if (!txt) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        out.push({
          fam: cs.fontFamily, peso: cs.fontWeight, larg: cs.fontStretch,
          vs: cs.fontVariationSettings, txt: txt.slice(0, 40),
          cls: el.className?.toString?.().slice(0, 40) || el.tagName,
        });
      }
      return out;
    });
    for (const a of achados) {
      const fam = /Archivo/i.test(a.fam) ? "Archivo" : /Caveat/i.test(a.fam) ? "Caveat" : null;
      if (!fam) continue;
      const larg = a.vs && a.vs !== "normal" ? a.vs : a.larg;
      const k = `${fam}|${a.peso}|${larg}`;
      const cur = usos.get(k) || { n: 0, exemplo: `${a.cls} «${a.txt}»` };
      cur.n++; usos.set(k, cur);
    }
    await ctx.close();
  }
}

await browser.close(); srv.close();

const linhas = [...usos.entries()].sort();
console.log(`=== combinações realmente usadas (${rotas.length} rotas × 2 viewports) ===`);
for (const [k, v] of linhas) console.log(`  ${k}   ×${String(v.n).padStart(4)}   ${v.exemplo}`);
console.log(`\ntotal de combinações distintas: ${linhas.length}`);
