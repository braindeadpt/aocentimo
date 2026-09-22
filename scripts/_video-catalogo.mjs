// _video-catalogo — grava as entradas das codificações novas de S1-05
// em /estilo: o haltere a desenhar os traços «antes → agora», a barra
// de traços a varrer esq→dir, o anel a assentar os pontos no sentido
// dos ponteiros e o isométrico a convergir as camadas.
//   node scripts/_video-catalogo.mjs [base]  (default http://localhost:3100)
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
await p.waitForSelector(".hal");
await p.waitForTimeout(400);

// cada codificação arma ao entrar no viewport — o scrollIntoView faz
// a sequência uma a uma (as de cima já estão armadas quando a de baixo
// chega — é o comportamento real da dobra)
for (const sel of [".hal", ".bt", ".ap", ".iso-card"]) {
  await p.locator(sel).last().evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollBy({ top: r.top - 160, behavior: "smooth" });
  });
  await p.waitForTimeout(2400);
}

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "catalogo-sheet.png");
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
