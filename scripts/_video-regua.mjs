// _video-regua — grava a régua física (R-03 / V3 §5) em movimento:
// hover e arrasto 1:1 do polegar, clique num preset (o polegar
// transita --dur-curta), hover nas pills. Depois os três shots de
// verificação: regua-salario-1440, regua-credito-375, regua-preset-hover.
//   node scripts/_video-regua.mjs [base]   (default http://localhost:3100)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? `http://localhost:${process.env.PORTA ?? 3100}`;
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
await p.goto(`${BASE}/salario`, { waitUntil: "domcontentloaded" });
const pista = p.locator(".regua-pista").first();
await pista.waitFor();
const caixa = await pista.boundingBox();
const y = caixa.y + caixa.height / 2;

// 1 — hover no polegar e arrasto 1:1 (~1,6 s de vaivém)
await p.mouse.move(caixa.x + caixa.width * 0.155, y);
await p.waitForTimeout(700);
await p.mouse.down();
for (let i = 1; i <= 20; i++) {
  await p.mouse.move(caixa.x + caixa.width * (0.155 + i * 0.02), y);
  await p.waitForTimeout(50);
}
for (let i = 1; i <= 12; i++) {
  await p.mouse.move(caixa.x + caixa.width * (0.555 - i * 0.02), y);
  await p.waitForTimeout(50);
}
await p.mouse.up();
await p.waitForTimeout(600);

// 2 — clique num preset: o polegar e a faixa transitam
await p.locator(".regua-pill").last().click();
await p.waitForTimeout(900);

// 3 — hover na primeira pill («mínimo»)
await p.locator(".regua-pill").first().hover();
await p.waitForTimeout(700);

// 4 — teclado: foco + setas movem o polegar com transição
await p.locator("#bruto").focus();
for (let i = 0; i < 6; i++) {
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(90);
}
await p.waitForTimeout(600);

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "regua-sheet.png");
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
await shot("regua-salario-1440", "/salario", 1440, ".regua");
await shot("regua-credito-375", "/credito", 375, ".regua:has(#eur)");
await shot("regua-preset-hover", "/salario", 1280, ".regua", (pg) =>
  pg.locator(".regua-pill").last().hover()
);
await b2.close();
