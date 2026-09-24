// _video-voo — grava a coreografia 1B-04: (1) a «pergunta seguinte»
// da demo Pagina em /estilo a morfar no h1 de /salario; (2) a entrada
// escalonada dos cartões da grelha (--ei × --stagger — a linha
// desenha-se e o número conta, cartão a cartão). No fim o ffmpeg
// espalha o webm numa folha de contacto 4×4.
//   node scripts/_video-voo.mjs [base]   (default http://localhost:3100)
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const BASE =
  process.argv[2] ?? `http://localhost:${process.env.PORTA ?? 3100}`;
const OUT = ".videos";
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT).filter((f) => f.endsWith(".webm")))
  unlinkSync(join(OUT, f));

const b = await chromium.launch();
const ctx = await b.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: OUT, size: { width: 1280, height: 800 } },
  reducedMotion: "no-preference",
});
const p = await ctx.newPage();

// 1 — a assinatura: /estilo, scroll à pergunta seguinte, clique → voo
await p.goto(`${BASE}/estilo`, { waitUntil: "networkidle" });
const lnk = p.locator(".pg-seguinte-lnk").first();
await lnk.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);
await lnk.click();
await p.waitForURL("**/salario**");
await p.waitForTimeout(1600); // a aterragem completa no h1

// 2 — o escalonamento de grupo: /precos, os três cartões entram em
//     sequência (linha a desenhar-se + número a contar por cartão)
await p.goto(`${BASE}/precos`, { waitUntil: "networkidle" });
await p.evaluate(() =>
  document.querySelector(".leitura")?.scrollIntoView({ behavior: "instant" })
);
await p.evaluate(() => window.scrollBy({ top: -80, behavior: "instant" }));
await p.waitForTimeout(300);
await p.evaluate(() =>
  window.scrollBy({ top: 260, behavior: "smooth" })
);
await p.waitForTimeout(2600);

await p.close();
await ctx.close();
await b.close();

// o webm só fica completo depois de fechar o contexto
const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "voo-sheet.png");
  execFileSync("ffmpeg", [
    "-v", "error", "-y", "-i", webm,
    "-vf", "fps=2,scale=480:-1,tile=4x4:padding=4:color=black",
    "-frames:v", "1", folha,
  ]);
  console.log("vídeo:", webm);
  console.log("folha:", folha);
}
