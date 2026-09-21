// _video — grava o painel «Leitura» em movimento: chegada suave à
// secção (o herói desenha-se ao entrar), scroll até um cartão da
// grelha (arma + desenha), e o hover que o inverte para papel.
// No fim o ffmpeg espalha o webm numa folha de contacto 4×4.
//   node scripts/_video.mjs [base]        (default http://localhost:3100)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? "http://localhost:3100";
const OUT = ".videos";
mkdirSync(OUT, { recursive: true });

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

// 1 — chegada suave ao painel: o herói arma e desenha-se
await p.evaluate(() =>
  document
    .getElementById("painel-leituras")
    ?.scrollIntoView({ behavior: "smooth", block: "start" })
);
await p.waitForTimeout(2400);

// 2 — descer até um cartão da grelha (a habitação): arma ao entrar
await p.locator(".leitura").nth(3).evaluate((el) => {
  const r = el.getBoundingClientRect();
  window.scrollBy({ top: r.top - 200, behavior: "smooth" });
});
await p.waitForTimeout(2000);

// 3 — hover nesse cartão — a inversão para papel; a cauda longa
// garante que a folha de contacto apanha o estado impresso
const cartao = p.locator(".leitura").nth(3);
await cartao.hover({ position: { x: 60, y: 60 } });
await p.waitForTimeout(2400);

await p.close();
await ctx.close();
await b.close();

// o webm só fica completo depois de fechar o contexto
const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "contact-sheet.png");
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
