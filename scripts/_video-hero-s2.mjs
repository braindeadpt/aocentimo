// _video-hero-s2 — grava a sequência do herói da home (S2-01):
// repouso (moeda a oscilar) → palpite na régua → revelar (moeda →
// montes + veredicto depois de assentarem) → mudar bruto para o
// mínimo (IRS «não te toca») → voltar à moeda. Duas larguras:
// 1440 e 375. No fim o ffmpeg espalha cada webm numa folha 4×4.
//   node scripts/_video-hero-s2.mjs [base]  (default :${PORTA ?? 3100})
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";

const BASE = process.argv[2] ?? `http://localhost:${process.env.PORTA ?? 3100}`;
const OUT = ".videos";
mkdirSync(OUT, { recursive: true });

async function grava(largura, altura, tag) {
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: largura, height: altura },
    recordVideo: { dir: OUT, size: { width: largura, height: altura } },
    reducedMotion: "no-preference",
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector(".hm-inst .cc-palco");
  // centrar o instrumento — a moeda oscila em repouso
  await p.locator(".hm-inst").evaluate((el) =>
    el.scrollIntoView({ behavior: "instant", block: "center" })
  );
  await p.waitForTimeout(2400);

  // palpite: 80 c por teclado (a régua é um slider real)
  const palpite = p.locator("#hm-palpite");
  await palpite.focus();
  for (let i = 0; i < 30; i++) await palpite.press("ArrowRight");
  await p.waitForTimeout(600);

  // revelar — a coreografia completa + o veredicto no fim
  await p.getByRole("button", { name: /revelar/i }).click();
  await p.waitForTimeout(7500);

  // mudar bruto para o salário mínimo — preset «mínimo»
  await p
    .locator(".hm-inst")
    .getByRole("button", { name: /mínimo/i })
    .click();
  await p.waitForTimeout(3200);

  // voltar à moeda
  await p.getByRole("button", { name: /voltar à moeda/i }).click();
  await p.waitForTimeout(2600);

  await p.close();
  await ctx.close();
  await b.close();

  // o webm só fica completo depois de fechar o contexto
  const webm = readdirSync(OUT)
    .filter((f) => f.endsWith(".webm") && !f.startsWith("hero-"))
    .map((f) => join(OUT, f))
    .at(-1);
  if (webm) {
    const destino = join(OUT, `hero-${tag}.webm`);
    renameSync(webm, destino);
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-i", destino,
      "-vf", "fps=2,scale=480:-1,tile=4x4:padding=4:color=black",
      "-frames:v", "1", join(OUT, `contact-hero-${tag}.png`),
    ]);
    console.log(`vídeo: ${destino}`);
  }
}

await grava(1440, 900, "1440");
await grava(375, 720, "375");
