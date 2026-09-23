// _video-estados — grava a família de estados (1B-05) em movimento:
// o vazio com a peça em falta a tracejado + orbe atrasada, o
// «a carregar» com o mini-orbe a rodar, o zero informativo com o
// ponto oco, e a régua a explicar o limite junto ao polegar — seta no
// extremo, preset «para lá do fim» e dedo para lá da pista. Depois os
// shots de verificação: estados-1440, estados-375, estados-limite.
//   node scripts/_video-estados.mjs [base]   (default http://localhost:3100)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = ".videos";
mkdirSync(OUT, { recursive: true });
// limpa webms antigos para a folha ser do vídeo certo
for (const f of readdirSync(OUT).filter((f) => f.endsWith(".webm")))
  unlinkSync(join(OUT, f));

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  reducedMotion: "no-preference",
});
const p = await ctx.newPage();
await p.goto(`${BASE}/estilo`, { waitUntil: "domcontentloaded" });
const sec = p.locator("#estados");
await sec.scrollIntoViewIfNeeded();
await p.waitForTimeout(900);

// 1 — o vazio: orbe atrasada + peça tracejada (deixa-o ler-se)
await p.waitForTimeout(1200);
await p.mouse.wheel(0, 500);
await p.waitForTimeout(900);

// 2 — «a carregar»: o mini-orbe roda; o zero ao lado lê-se
await p.waitForTimeout(1400);
await p.mouse.wheel(0, 500);
await p.waitForTimeout(700);

// 3 — a régua no mínimo: seta esquerda insiste → nota «limite — 920 €»
const slider = sec.getByRole("slider", { name: "Salário bruto mensal" });
await slider.focus();
await p.waitForTimeout(300);
await p.keyboard.press("ArrowLeft");
await p.waitForTimeout(900);
await p.keyboard.press("ArrowLeft"); // insiste — re-anuncia
await p.waitForTimeout(900);

// 4 — anda para dentro: a nota sai na próxima paragem interior
await p.keyboard.press("ArrowRight");
await p.waitForTimeout(400);
await p.keyboard.press("ArrowRight");
await p.waitForTimeout(500);

// 5 — preset «para lá do fim»: salta ao máximo e a nota explica
await sec.getByRole("button", { name: "para lá do fim" }).click();
await p.waitForTimeout(1000);
await p.keyboard.press("ArrowRight"); // insiste no extremo
await p.waitForTimeout(900);

// 6 — volta a dentro e arrasta o dedo para lá da pista (limite max)
await sec.getByRole("button", { name: "2 000 €" }).click();
await p.waitForTimeout(700);
const pista = sec.locator(".regua-pista");
const caixa = await pista.boundingBox();
const y = caixa.y + caixa.height / 2;
await p.mouse.move(caixa.x + caixa.width * 0.5, y);
await p.mouse.down();
for (let i = 1; i <= 20; i++) {
  await p.mouse.move(caixa.x + caixa.width * (0.5 + i * 0.028), y);
  await p.waitForTimeout(40);
}
await p.waitForTimeout(700); // dedo parado para lá do fim — a nota lê-se
await p.mouse.up();
await p.waitForTimeout(800);

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "estados-sheet.png");
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", webm,
    "-vf", "fps=2,scale=480:-1,tile=4x4:padding=4:color=black",
    "-frames:v", "1", folha,
  ]);
  console.log(`vídeo: ${webm}`);
  console.log(`folha: ${folha}`);
} else {
  console.log("sem vídeo gravado");
}

// ————— shots de verificação —————
const b2 = await chromium.launch();
async function shot(nome, url, largura, alvo, antes) {
  const c = await b2.newContext({
    viewport: { width: largura, height: 800 },
    reducedMotion: "reduce",
  });
  const pg = await c.newPage();
  await pg.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  if (antes) await antes(pg);
  await pg.locator(alvo).first().screenshot({ path: join(OUT, `${nome}.png`) });
  await c.close();
  console.log(`shot: ${join(OUT, nome + ".png")}`);
}
await shot("estados-1440", "/estilo", 1440, "#estados");
await shot("estados-375", "/estilo", 375, "#estados");
await shot("estados-limite", "/estilo", 1280, "#estados", async (pg) => {
  const sl = pg
    .locator("#estados")
    .getByRole("slider", { name: "Salário bruto mensal" });
  await sl.focus();
  await pg.keyboard.press("ArrowLeft");
  await pg.waitForTimeout(300);
});
await b2.close();
