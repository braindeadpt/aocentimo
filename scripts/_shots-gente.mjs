import { chromium } from "@playwright/test";

// capturas da gente do bairro (P1) — saem para /tmp, NUNCA para o repo
const browser = await chromium.launch();
const BASE = process.env.BASE ?? "http://localhost:3104";

async function tiro(nome, w, h, hora) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: w < 500 ? 2 : 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForSelector(".b-mundo .pessoa[data-pessoa]", { timeout: 20000 });
  if (hora) await page.getByRole("button", { name: hora, exact: true }).click();
  await page.getByRole("button", { name: "Ver o bairro todo" }).click();
  await page.waitForTimeout(1400); // a câmara vai suave
  await page.screenshot({ path: `/tmp/gente-p1/${nome}.png` });
  await page.close();
  console.log("ok", nome);
}

// detalhe: a avenida (elenco de cima) e a ponte (miúdos) de perto
async function pormenor(nome, w, h, alvo) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForSelector(".b-mundo .pessoa[data-pessoa]", { timeout: 20000 });
  const r = await page.locator(alvo).first().boundingBox();
  if (r) {
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    for (let k = 0; k < 4; k++) {
      await page.mouse.wheel(0, -240); // aproximar
      await page.waitForTimeout(150);
    }
  }
  await page.waitForTimeout(800);
  await page.screenshot({ path: `/tmp/gente-p1/${nome}.png` });
  await page.close();
  console.log("ok", nome);
}

await tiro("dia-1440", 1440, 900, "Dia");
await tiro("noite-1440", 1440, 900, "Noite");
await tiro("dia-375", 375, 760, "Dia");
await tiro("noite-375", 375, 760, "Noite");
await pormenor("avenida-1440", 1440, 900, '.pessoa[data-pessoa="ines"]');
await pormenor("ponte-1440", 1440, 900, ".b-mundo .miudo");
await browser.close();
