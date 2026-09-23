// _video-euro — grava «O TEU EURO» em movimento: chegada à secção
// (as peças convergem para o stack, as chamadas desenham-se depois)
// e o hover num passo da lista que realça a peça + inverte o cartão.
//   node scripts/_video-euro.mjs [base]   (default http://localhost:3100)
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
await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await p.waitForSelector(".iso-card");
await p.waitForTimeout(400);

// 1 — chegada à secção: as peças convergem, as chamadas desenham-se
await p.evaluate(() =>
  document
    .getElementById("euro-titulo")
    ?.scrollIntoView({ behavior: "smooth", block: "start" })
);
await p.waitForTimeout(2800);

// 2 — hover num passo da lista: a peça acende, o cartão inverte
await p.locator("[data-euro-lista] > li").nth(1).hover();
await p.waitForTimeout(1600);
// 3 — hover na placa base via a lista («fica»)
await p.locator("[data-euro-lista] > li").nth(4).hover();
await p.waitForTimeout(1600);

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "euro-sheet.png");
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
