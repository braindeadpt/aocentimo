// sweep de overflow horizontal a 768/1440 em todas as rotas
import { chromium } from "@playwright/test";
import { readdirSync } from "node:fs";
import { join } from "node:path";

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith(".html") && e.name !== "_not-found.html") yield p;
  }
}
const rotas = [...walk("out")].map((f) =>
  "/" + f.slice(4).replace(/\\/g, "/").replace(/index\.html$/, "").replace(/\.html$/, "")
);

const b = await chromium.launch();
const falhas = [];
for (const w of [768, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  for (const r of rotas) {
    try {
      await p.goto("http://localhost:3100" + r, { waitUntil: "domcontentloaded", timeout: 15000 });
      /* o ticker e outras animações contínuas podem ser apanhadas a
         meio do ciclo e dar falsos positivos de overflow — mede-se a
         página parada */
      await p.addStyleTag({
        content: "*, *::before, *::after { animation-play-state: paused !important; }",
      });
      await p.waitForTimeout(400);
      const res = await p.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
      }));
      if (res.sw > res.iw + 1) falhas.push(`${w}px ${r} scrollW=${res.sw}`);
    } catch (e) {
      falhas.push(`${w}px ${r} ERRO ${String(e).slice(0, 60)}`);
    }
  }
  await p.close();
}
await b.close();
console.log(
  falhas.length
    ? "OVERFLOW:\n" + falhas.join("\n")
    : `sem overflow horizontal a 768/1440 em ${rotas.length} rotas`
);
if (falhas.length) process.exitCode = 1;
