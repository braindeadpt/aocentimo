// _video-controlos — grava o sistema de controlos (1B-03) em
// movimento: pressão scale(.97) dos botões, o nó do interruptor a
// deslizar, o chip a seleccionar, o segmentado a trocar a janela,
// «a carregar» com o mini-orbe, «Copiado» junto ao botão, o polegar
// da régua a encaixar com ressalto e a dica por âncora. Depois os
// shots de verificação: controlos-1440, controlos-375, controlos-foco.
//   node scripts/_video-controlos.mjs [base]   (default http://localhost:3100)
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
  permissions: ["clipboard-write", "clipboard-read"],
});
const p = await ctx.newPage();
await p.goto(`${BASE}/estilo`, { waitUntil: "domcontentloaded" });
const sec = p.locator("#controlos");
await sec.scrollIntoViewIfNeeded();
await p.waitForTimeout(600);

// 1 — o botão primário: hover + pressão scale(.97) (~1,2 s)
const primario = sec.getByRole("button", { name: "Acção principal" });
await primario.hover();
await p.waitForTimeout(500);
await primario.click({ delay: 350 });
await p.waitForTimeout(500);

// 2 — o interruptor: o nó desliza duas vezes
const sw = sec.getByRole("switch", { name: /Simular choque/ });
await sw.click();
await p.waitForTimeout(700);
await sw.click();
await p.waitForTimeout(700);

// 3 — chips: seleccionar 3M e 6M
const grupo = sec.getByRole("group", { name: "Prazo da Euribor" });
await grupo.getByRole("button", { name: "3M", exact: true }).click();
await p.waitForTimeout(500);
await grupo.getByRole("button", { name: "6M", exact: true }).click();
await p.waitForTimeout(500);

// 4 — segmentado: troca a janela; o readout muda com os dados
const seg = sec.getByRole("radiogroup", { name: "Janela temporal" });
await seg.getByRole("radio", { name: "2A", exact: true }).click();
await p.waitForTimeout(500);
await seg.getByRole("radio", { name: "Máx", exact: true }).click();
await p.waitForTimeout(500);
await seg.getByRole("radio", { name: "1A", exact: true }).click();
await p.waitForTimeout(500);

// 5 — «a carregar»: o mini-orbe no lugar do ícone
await sec.getByRole("button", { name: "Recalcular" }).click();
await p.waitForTimeout(900);
await p.waitForTimeout(900);

// 6 — «Copiado» junto ao botão
await sec.getByRole("button", { name: "Copiar ligação da página" }).click();
await p.waitForTimeout(900);

// 7 — a régua: arrasto com snap + ressalto, depois preset
const pista = sec.locator(".regua-pista");
const caixa = await pista.boundingBox();
const y = caixa.y + caixa.height / 2;
await p.mouse.move(caixa.x + caixa.width * 0.3, y);
await p.mouse.down();
for (let i = 1; i <= 16; i++) {
  await p.mouse.move(caixa.x + caixa.width * (0.3 + i * 0.02), y);
  await p.waitForTimeout(45);
}
await p.mouse.up();
await p.waitForTimeout(500);
await sec.locator(".chip").last().click();
await p.waitForTimeout(800);

// 8 — a dica por âncora
await sec.locator(".dica-mae").first().hover();
await p.waitForTimeout(800);

await p.close();
await ctx.close();
await b.close();

const webm = readdirSync(OUT)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => join(OUT, f))
  .at(-1);
if (webm) {
  const folha = join(OUT, "controlos-sheet.png");
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

// ————— shots de verificação —————
const b2 = await chromium.launch();
async function shot(nome, url, largura, alvo, antes) {
  const c = await b2.newContext({
    viewport: { width: largura, height: 800 },
    reducedMotion: "reduce",
  });
  const pg = await c.newPage();
  await pg.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
  if (antes) await antes(pg);
  await pg.locator(alvo).first().screenshot({ path: join(OUT, `${nome}.png`) });
  await c.close();
  console.log(`shot: ${join(OUT, nome + ".png")}`);
}
await shot("controlos-1440", "/estilo", 1440, "#controlos");
await shot("controlos-375", "/estilo", 375, "#controlos");
await shot("controlos-foco", "/estilo", 1280, "#controlos", (pg) =>
  pg.getByRole("button", { name: "Acção secundária" }).focus()
);
await b2.close();
