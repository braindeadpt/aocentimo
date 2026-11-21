// Que caracteres o site PINTA de facto? Pergunta-se ao browser, depois de
// percorrer as rotas e o texto dinamico: os numeros dos simuladores e os
// nomes dos instrumentos vem de data/, nao de messages/, e um subconjunto
// construido so a partir das fontes de texto perderia o euro ou o menos.
//   node scripts/_glifos-usados.mjs > /tmp/glifos-usados.txt
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { servirEstatico, urlBase } from "./_estatico.mjs";

const raiz = "out";
const srv = await servirEstatico(raiz);
const base = urlBase(srv);

const sitemap = await readFile(join(raiz, "sitemap.xml"), "utf8");
const doSitemap = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+\/([^<]*)<\/loc>/g)].map(
  (m) => "/" + m[1]
);
const aVisitar = [...new Set([...doSitemap, "/", "/aprender/taeg"])].filter(
  (r) => r !== "" && !/\.(xml|txt|ico|png)$/.test(r)
);

const browser = await chromium.launch();
const chars = new Set();
for (const rota of aVisitar) {
  for (const vw of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
    const page = await ctx.newPage();
    try {
      await page.goto(base + rota, { waitUntil: "networkidle" });
    } catch {
      await ctx.close();
      continue;
    }
    const t = await page.evaluate(() => {
      const partes = [document.body.innerText];
      for (const el of document.querySelectorAll(
        "[title],[aria-label],[alt],[placeholder],[aria-valuetext]"
      )) {
        for (const a of el.attributes) if (a.value) partes.push(a.value);
      }
      for (const el of document.querySelectorAll("body *")) {
        const c =
          getComputedStyle(el, "::before").content + getComputedStyle(el, "::after").content;
        if (c && c !== "none" && c !== "normal" && !/^"|"$/.test(c)) partes.push(c);
      }
      return partes.join("\n");
    });
    for (const c of t) chars.add(c);
    await ctx.close();
  }
}
await browser.close();
srv.close();

const vis = [...chars]
  .filter((c) => {
    const p = c.codePointAt(0);
    return p > 0x1f;
  })
  .sort();
console.error(`rotas: ${aVisitar.length} · caracteres pintados: ${vis.length}`);
console.log(vis.join(""));