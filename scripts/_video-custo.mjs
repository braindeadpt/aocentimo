// _video-custo — grava o CustoExplodido de /salario (R-05): a entrada
// (as placas convergem para o stack, as chamadas desenham-se depois),
// a régua do bruto a mudar a explosão (teclado no input — a câmara
// fica no cartão e os valores contam) e o hover que inverte para
// papel + acende a peça. No fim, folha de contacto 4×4 e os três
// shots de verificação em .shots/custo-{1440-dark,375,hover}.png.
//   node scripts/_video-custo.mjs [base]   (default http://localhost:3100)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? `http://localhost:${process.env.PORTA ?? 3100}`;
const OUT_V = ".videos";
const OUT_S = ".shots";
mkdirSync(OUT_V, { recursive: true });
mkdirSync(OUT_S, { recursive: true });
// limpa webms antigos para a folha ser do vídeo certo
for (const f of readdirSync(OUT_V).filter((f) => f.endsWith(".webm")))
  unlinkSync(join(OUT_V, f));

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT_V, size: { width: 1280, height: 800 } },
  reducedMotion: "no-preference",
});
const p = await ctx.newPage();
await p.goto(`${BASE}/salario`, { waitUntil: "domcontentloaded" });
const cartao = p.locator(".iso-card").first();
await cartao.waitFor();
await p.waitForTimeout(400);

// 1 — entrada: o cartão nasce abaixo da dobra; o scrollIntoView arma a
//     montagem (peças convergem → chamadas traçam → rótulos assentam)
await cartao.evaluate((el) =>
  el.scrollIntoView({ behavior: "smooth", block: "center" })
);
await p.waitForTimeout(2600);
console.log(
  `explosão armada por scroll: ${await cartao.evaluate((el) =>
    el.classList.contains("iso-on")
  )}`
);

// 2 — a régua muda a explosão: o foco fica no input (a página volta a
//     mostrar o cartão sem o perder) e as setas sobem o bruto — os
//     valores das placas contam --dur-curta
await p.locator("#bruto").focus();
await cartao.evaluate((el) =>
  el.scrollIntoView({ behavior: "instant", block: "center" })
);
await p.waitForTimeout(500);
for (let i = 0; i < 14; i++) {
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(110);
}
await p.keyboard.press("PageUp"); // +100 de uma vez — salto visível
await p.waitForTimeout(700);
for (let i = 0; i < 6; i++) {
  await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(110);
}
await p.waitForTimeout(700);

// 3 — hover na lista-equivalente: a peça acende e o cartão inverte
await p.locator("[data-custo-lista] > li").nth(1).hover();
await p.waitForTimeout(1500);
await p.locator("[data-custo-lista] > li").nth(4).hover();
await p.waitForTimeout(1500);

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT_V)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT_V, f))
  .at(-1);
if (webm) {
  const folha = join(OUT_V, "custo-sheet.png");
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

// ————— shots de verificação — reduced-motion = estado final —————
const b2 = await chromium.launch();
async function shot(nome, largura, tema, antes) {
  const c = await b2.newContext({
    viewport: { width: largura, height: 800 },
    reducedMotion: "reduce",
  });
  const pg = await c.newPage();
  await pg.goto(`${BASE}/salario`, { waitUntil: "domcontentloaded" });
  if (tema === "dark")
    await pg.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  const alvo = pg.locator(".iso-card").first();
  await alvo.scrollIntoViewIfNeeded();
  if (antes) await antes(pg, alvo);
  await pg.waitForTimeout(350);
  await alvo.screenshot({ path: join(OUT_S, `${nome}.png`) });
  await c.close();
  console.log(`shot: ${join(OUT_S, nome + ".png")}`);
}
await shot("custo-1440-dark", 1440, "dark");
await shot("custo-375", 375, null);
await shot("custo-hover", 1440, null, (_pg, alvo) =>
  alvo.hover({ position: { x: 60, y: 60 } })
);
await b2.close();
