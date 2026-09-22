// _video-pag — grava a entrada de um cartão «Leitura» numa página
// temática: chegada suave à secção (arma + desenha a linha, hachura e
// anotação por ordem) e o hover que inverte para papel. Depois os
// shots de verificação das páginas em 1440-dark e 375 (.shots/), em
// reduced-motion = estado final.
//   node scripts/_video-pag.mjs [base] [rota] [rotas-shots]
//   default: :3100 /dados credito,casa,dados
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const ROTA = process.argv[3] ?? "/dados";
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
await p.goto(`${BASE}${ROTA}`, { waitUntil: "domcontentloaded" });
await p.waitForSelector(".leitura");
await p.waitForTimeout(400);

// 1 — chegada suave ao instrumento: se nasceu acima da dobra está já
// impresso (M-09); se está abaixo, o scrollIntoView arma a entrada
const primeiro = p.locator(".leitura").first();
await primeiro.evaluate((el) =>
  el.scrollIntoView({ behavior: "smooth", block: "center" })
);
await p.waitForTimeout(2600);

// a entrada é legítima só se o cartão nasceu abaixo da dobra — aqui
// verificamos que .leitura-on chegou (ou que nasceu impresso)
const armado = await primeiro.evaluate((el) =>
  el.classList.contains("leitura-on")
);
console.log(`primeiro .leitura armado por scroll: ${armado}`);

// 2 — descer até um cartão da grelha (a segunda leitura): arma ao entrar
const segundo = p.locator(".leitura").nth(1);
if ((await segundo.count()) > 0) {
  await segundo.evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollBy({ top: r.top - 300, behavior: "smooth" });
  });
  await p.waitForTimeout(2000);
  console.log(
    `segundo .leitura armado: ${await segundo.evaluate((el) =>
      el.classList.contains("leitura-on")
    )}`
  );

  // 3 — hover nesse cartão — a inversão para papel
  await segundo.hover({ position: { x: 60, y: 60 } });
  await p.waitForTimeout(2400);
}

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT_V)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT_V, f))
  .at(-1);
if (webm) {
  const folha = join(OUT_V, "leitura-pag-sheet.png");
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

// ————— shots de verificação: páginas em 1440-dark e 375,
//   reduced-motion = estado final impresso —————
const ROTAS = (process.argv[4] ?? "credito,casa,dados").split(",");
const b2 = await chromium.launch();
async function shot(nome, rota, largura, tema) {
  const c = await b2.newContext({
    viewport: { width: largura, height: 800 },
    reducedMotion: "reduce",
  });
  const pg = await c.newPage();
  await pg.goto(`${BASE}/${rota}`, { waitUntil: "domcontentloaded" });
  if (tema === "dark")
    await pg.evaluate(() => (document.documentElement.dataset.theme = "dark"));
  await pg.waitForTimeout(300);
  await pg.screenshot({
    path: join(OUT_S, `${nome}.png`),
    fullPage: true,
  });
  await c.close();
  console.log(`shot: ${join(OUT_S, nome + ".png")}`);
}
for (const r of ROTAS) {
  await shot(`${r}-1440-dark`, r, 1440, "dark");
  await shot(`${r}-375`, r, 375, null);
}
await b2.close();
