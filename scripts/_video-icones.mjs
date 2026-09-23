// _video-icones — grava o desenho do traço dos ícones (1B-01):
// hover num botão de acção (o traço desenha-se uma vez, --dur-micro,
// com passo por traço) e hover num cartão com IconeEmblema no
// cabeçalho (desenha junto com a inversão para papel).
// No fim o ffmpeg espalha o webm numa folha de contacto 4×4.
//   node scripts/_video-icones.mjs [base]   (default http://localhost:3100)
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
await p.goto(`${BASE}/estilo`, { waitUntil: "domcontentloaded" });
await p.waitForSelector("#icones svg.icone");

// 1 — repouso na folha de ícones
await p.locator("#icones").scrollIntoViewIfNeeded();
await p.waitForTimeout(700);

// 2 — hover no botão «Repor valores»: o traço desenha-se (micro, uma vez)
const repor = p.locator('#icones button[aria-label="Repor valores"]');
await repor.hover();
await p.waitForTimeout(1200);
// sai e volta — segunda passagem redesenha
await p.locator('#icones [data-icone="menu"]').hover();
await p.waitForTimeout(500);
await repor.hover();
await p.waitForTimeout(1200);

// 3 — hover numa célula da folha (gatilho de demonstração)
await p.locator('#icones [data-icone="poupanca"]').hover();
await p.waitForTimeout(1200);

// 4 — o emblema no cabeçalho do Cartao desenha com a inversão para papel
const cartao = p.locator(".leitura:has(.icone-emblema)").first();
await cartao.scrollIntoViewIfNeeded();
await cartao.hover({ position: { x: 80, y: 40 } });
await p.waitForTimeout(1600);

await p.close();
await ctx.close();
await b.close();

// o webm só fica completo depois de fechar o contexto
const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "icones-sheet.png");
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
