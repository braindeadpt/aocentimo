// Que caracteres o site PINTA de facto? Pergunta-se ao browser, depois de
// percorrer as rotas e o texto dinamico: os numeros dos simuladores e os
// nomes dos instrumentos vem de data/, nao de messages/, e um subconjunto
// construido so a partir das fontes de texto perderia o euro ou o menos.
//   node scripts/_glifos-usados.mjs > /tmp/glifos-usados.txt
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const raiz = "out";
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
const srv = createServer(async (req, res) => {
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
await new Promise((r) => srv.listen(0, r));
const base = `http://localhost:${srv.address().port}`;

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