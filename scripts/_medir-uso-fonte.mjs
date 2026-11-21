// Que combinações de peso/largura o site usa MESMO? Em vez de ler o CSS
// e adivinhar, pergunta-se ao browser por cada elemento com texto.
//   node scripts/_medir-uso-fonte.mjs <rotas>
import { chromium } from "playwright";
import { servirEstatico, urlBase } from "./_estatico.mjs";

const raiz = "out";
const rotas = (process.argv[2] || "/,/estilo,/salario,/casa,/credito,/dados,/aprender/taeg,/trabalho,/precos,/poupanca,/irs,/impostos,/inflacao,/casa,/metodologia,/sobre").split(",");

const srv = await servirEstatico(raiz);
const base = urlBase(srv);

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
