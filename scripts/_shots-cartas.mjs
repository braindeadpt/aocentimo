import { chromium } from "@playwright/test";

// capturas das cartas do elenco (P1-4) — saem para /tmp, NUNCA para o repo
const browser = await chromium.launch();
const BASE = process.env.BASE ?? "http://localhost:3105";

async function tiro(nome, w, h, antes) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: w < 500 ? 2 : 1,
  });
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.getByRole("button", { name: "Dia", exact: true }).click();
  await page.locator(".b-elenco").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  if (antes) await antes(page);
  await page.screenshot({ path: `/tmp/cartas-p1/${nome}.png` });
  await page.close();
  console.log("ok", nome);
}

// a grelha inteira, vista da secção para baixo
await tiro("cartas-1440", 1440, 900);
await tiro("cartas-375", 375, 760);
// a carta clicada: painel «Olá!» aberto sobre o mapa
await tiro("painel-1440", 1440, 900, async (page) => {
  await page.locator('.b-carta[data-k="ines"]').click();
  await page.waitForSelector(".b-painel", { timeout: 10000 });
  await page.waitForTimeout(1500); // o scroll + a câmara chegam
});
await tiro("painel-375", 375, 760, async (page) => {
  await page.locator('.b-carta[data-k="ines"]').click();
  await page.waitForSelector(".b-painel", { timeout: 10000 });
  await page.waitForTimeout(1500);
});
await browser.close();
