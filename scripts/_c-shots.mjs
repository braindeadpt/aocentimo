// screenshots Fase C-01 — home (painel) e detalhe do mostrador,
// nos DOIS temas (escuro e claro), a 1440/768/375
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync(".screenshots/c", { recursive: true });
const b = await chromium.launch();

for (const tema of ["dark", "light"]) {
  for (const w of [1440, 768, 375]) {
    const p = await b.newPage({
      viewport: { width: w, height: w === 375 ? 720 : 900 },
    });
    await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
    await p.evaluate((t) => (document.documentElement.dataset.theme = t), tema);
    await p.waitForTimeout(600); // deixa o tema assentar; nada anima ao carregar
    await p.screenshot({
      path: `.screenshots/c/home-${w}-${tema}.png`,
      fullPage: false,
    });
    // detalhe do mostrador — só uma vez por tema, no viewport largo
    if (w === 1440) {
      // a célula da inflação é o primeiro filho da grelha do painel
      const mostrador = p
        .locator('section[aria-labelledby="painel-titulo"] > div.grid > div')
        .first();
      await mostrador.screenshot({
        path: `.screenshots/c/mostrador-detalhe-${tema}.png`,
      });
    }
    await p.close();
  }
}
await b.close();
console.log("ok");
