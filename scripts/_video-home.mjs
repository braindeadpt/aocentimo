// _video-home — grava a sequência nova da home (R-06): painel →
// adivinha (aposta + revelar) → explosão do euro → capítulos. Sem a
// fita de papel: a decomposição conta-se uma vez, na explosão.
//   node scripts/_video-home.mjs [base]   (default http://localhost:3100)
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
await p.waitForSelector(".leitura");
await p.waitForTimeout(400);

// 1 — o painel arma ao entrar (leituras oficiais)
await p.evaluate(() =>
  document
    .getElementById("painel-leituras")
    ?.scrollIntoView({ behavior: "smooth", block: "start" })
);
await p.waitForTimeout(2400);

// 2 — a adivinha: aposta 80 c, revela a realidade
await p.evaluate(() =>
  document
    .getElementById("instrumento")
    ?.scrollIntoView({ behavior: "smooth", block: "center" })
);
await p.waitForTimeout(900);
await p.locator("input[name='aposta']").fill("80");
await p.getByRole("button", { name: /revelar/i }).click();
await p.waitForTimeout(1600);

// 3 — a resposta: o euro explode ao entrar, foco/hover num passo
await p.evaluate(() =>
  document
    .getElementById("euro-titulo")
    ?.scrollIntoView({ behavior: "smooth", block: "start" })
);
await p.waitForTimeout(2800);
await p.locator("[data-euro-lista] > li").nth(1).hover();
await p.waitForTimeout(1400);
await p.locator("[data-euro-lista] > li").nth(4).hover();
await p.waitForTimeout(1400);

// 4 — capítulos, o percurso continua
await p.evaluate(() => {
  const h = [...document.querySelectorAll("h2")].find((e) =>
    e.textContent?.includes("PERCURSO")
  );
  h?.scrollIntoView({ behavior: "smooth", block: "start" });
});
await p.waitForTimeout(1600);

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "home-sheet.png");
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
