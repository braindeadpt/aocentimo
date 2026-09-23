// _shots-fp — capturas da home pós-R-06 nas posições da auditoria:
// hero → painel → adivinha → explosão do euro → capítulos, a 1440-dark
// e 375; close-ups dos cartões cuja anotação de extremo colidia com o
// rótulo do valor final (gasóleo, habitação) e /precos (3 col.) para a
// terceira densidade. Mede ainda a distância real entre .lq-anot-rot e
// o rótulo de fim — a verificação da anti-colisão é numérica, não à
// vista.
//   node scripts/_shots-fp.mjs [base]   (default http://localhost:3100)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? `http://localhost:${process.env.PORTA ?? 3100}`;
const OUT = ".shots";
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();

const distAnotacao = `(() => {
  const out = [];
  for (const card of document.querySelectorAll(".leitura")) {
    const anot = card.querySelector(".lq-anot-rot");
    const exts = card.querySelectorAll(".lq-ext-main");
    const fim = exts[exts.length - 1];
    if (!anot || !fim) continue;
    const a = anot.getBoundingClientRect();
    const f = fim.getBoundingClientRect();
    const dx = Math.max(0, Math.max(a.left - f.right, f.left - a.right));
    const dy = Math.max(0, Math.max(a.top - f.bottom, f.top - a.bottom));
    out.push({
      cartao: card.querySelector(".leitura-breadcrumb")?.textContent ?? "?",
      dist: Math.round(Math.hypot(dx, dy) * 10) / 10,
    });
  }
  return out;
})()`;

async function sessao(width, height, tag, rota, alvos, closeups = []) {
  const ctx = await b.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${rota}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(400);

  const shot = async (sel, nome, desloca = 70) => {
    await p.evaluate(
      ([s, off]) => {
        const el = document.querySelector(s);
        if (el)
          window.scrollTo(
            0,
            el.getBoundingClientRect().top + window.scrollY - off
          );
      },
      [sel, desloca]
    );
    await p.waitForTimeout(250);
    await p.screenshot({ path: `${OUT}/fp-fix-${tag}-${nome}.png` });
  };
  const shotEl = async (sel, nome) => {
    const el = p.locator(sel).first();
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(250);
    await el.screenshot({ path: `${OUT}/fp-fix-${tag}-${nome}.png` });
  };

  for (const [sel, nome, off] of alvos) await shot(sel, nome, off ?? 70);
  // close-ups dos cartões com anotação (a colisão era aqui)
  for (const [sel, nome] of closeups) await shotEl(sel, nome);

  const dist = await p.evaluate(distAnotacao);
  console.log(`— ${tag} ${rota}`);
  for (const d of dist)
    console.log(`   ${d.dist}px  ${d.cartao}${d.dist < 26 ? "  ← COLISÃO" : ""}`);

  await ctx.close();
}

const ALVOS_HOME = [
  ["h1", "00-hero"],
  ["#painel-leituras", "01-painel"],
  ["#instrumento", "02-adivinha"],
  ["#euro-titulo", "03-euro"],
  [".stack-cap", "04-capitulos"],
];

const CLOSEUPS_HOME = [
  [".leitura:has-text('PREÇOS / COMBUSTÍVEIS')", "gasoleo"],
  [".leitura:has-text('PAÍS / HABITAÇÃO')", "habitacao"],
  [".leitura:has-text('PAÍS / TRABALHO')", "desemprego"],
];
const CLOSEUPS_PRECOS = [
  [".leitura:has-text('GASÓLEO SIMPLES')", "precos-gasoleo"],
];

await sessao(1440, 900, "1440-dark", "/", ALVOS_HOME, CLOSEUPS_HOME);
await sessao(375, 760, "375", "/", ALVOS_HOME, CLOSEUPS_HOME);
// a terceira densidade: /precos corre 3 cartões por linha
await sessao(1440, 900, "1440-dark", "/precos", [["h1", "precos-topo", 40]], CLOSEUPS_PRECOS);
await sessao(375, 760, "375", "/precos", [["h1", "precos-topo", 40]], CLOSEUPS_PRECOS);

await b.close();
console.log("shots em .shots/fp-fix-*");
