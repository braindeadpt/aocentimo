// screenshots Fase C-03 — home, painel expandido e o storytelling
// «o teu euro» (cena pinned a 50 % e lista estática a 375)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync(".screenshots/c2", { recursive: true });
const b = await chromium.launch();

const dark = (p) =>
  p.evaluate(() => (document.documentElement.dataset.theme = "dark"));

// home topo — 1440 e 375, escuro
for (const w of [1440, 375]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `.screenshots/c2/home-${w}-dark.png` });
  await p.close();
}

// painel com a Euribor expandida — 1440
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.getByRole("button", { name: /Euribor 12M/ }).click();
  await p.waitForTimeout(900); // deixa o Flip assentar
  await p.screenshot({ path: ".screenshots/c2/expandido-1440.png" });
  await p.close();
}

// storytelling a 50 % do scroll — 1440
{
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.waitForTimeout(1200); // ScrollTrigger + refresh
  const meio = await p.evaluate(() => {
    const sec = document.querySelector(
      'section[aria-labelledby="euro-titulo"] .h-\\[400vh\\]'
    );
    if (!sec) return -1;
    const r = sec.getBoundingClientRect();
    return window.scrollY + r.top + r.height * 0.5 - window.innerHeight / 2;
  });
  await p.evaluate((y) => window.scrollTo(0, y), meio);
  await p.waitForTimeout(1200); // scrub 0.6 assenta
  await p.screenshot({ path: ".screenshots/c2/euro-1440.png" });
  await p.close();
}

// lista estática — 375 (a cena não existe nesta largura)
{
  const p = await b.newPage({ viewport: { width: 375, height: 720 } });
  await p.goto("http://localhost:3100/", { waitUntil: "networkidle" });
  await dark(p);
  await p.waitForTimeout(600);
  const lista = p.locator("[data-euro-lista]");
  await lista.scrollIntoViewIfNeeded();
  await p.waitForTimeout(900); // odómetros assentam
  await p.screenshot({ path: ".screenshots/c2/euro-375.png" });
  await p.close();
}

await b.close();
console.log("ok");
