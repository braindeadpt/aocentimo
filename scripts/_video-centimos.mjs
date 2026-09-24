// _video-centimos — grava o campo de cêntimos em /estilo: a moeda a
// oscilar em repouso, a revelação (moeda → pontos → cores → voos para
// os montes) e o regresso à moeda. No fim o ffmpeg espalha o webm
// numa folha de contacto 4×4.
//   node scripts/_video-centimos.mjs [base]  (default http://localhost:3100)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? `http://localhost:${process.env.PORTA ?? 3100}`;
const OUT = ".videos";
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  reducedMotion: "no-preference",
});
const p = await ctx.newPage();
await p.goto(`${BASE}/estilo`, { waitUntil: "domcontentloaded" });
await p.waitForSelector(".cc-palco");

// centrar o campo no ecrã — a moeda fica a oscilar em repouso
const campo = p.locator(".cc").first();
await campo.evaluate((el) =>
  el.scrollIntoView({ behavior: "instant", block: "center" })
);
await p.waitForTimeout(2600);

// moeda → montes: a coreografia completa (pára, desfaz-se, pausa,
// acende cores, voos escalonados, rótulos)
await p.getByRole("radio", { name: "Montes" }).click();
await p.waitForTimeout(7000);

// montes → moeda: fechar de novo
await p.getByRole("radio", { name: "Moeda" }).click();
await p.waitForTimeout(3200);

await p.close();
await ctx.close();
await b.close();

// o webm só fica completo depois de fechar o contexto
const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "contact-sheet-centimos.png");
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", webm,
    "-vf", "fps=2,scale=480:-1,tile=4x4:padding=4:color=black",
    "-frames:v", "1", folha,
  ]);
  console.log("vídeo:", webm, "\nfolha:", folha);
}
