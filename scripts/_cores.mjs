// M-04 — rácios AA + simulação de daltonismo para os tokens novos
const L = (hex) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [l1, l2] = [L(a), L(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
// Machado 2009 — matrizes de simulação (severidade 1.0)
const machado = (hex, tipo) => {
  const M = {
    deuteranopia: [
      [0.367, 0.861, -0.228],
      [0.280, 0.673, 0.047],
      [-0.012, 0.043, 0.969],
    ],
    protanopia: [
      [0.152, 1.053, -0.205],
      [0.115, 0.786, 0.099],
      [-0.004, -0.048, 1.052],
    ],
  }[tipo];
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lin = rgb.map((v) => Math.pow(v / 255, 2.2));
  const out = M.map((r) => r[0] * lin[0] + r[1] * lin[1] + r[2] * lin[2]);
  return (
    "#" +
    out
      .map((v) =>
        Math.round(Math.pow(Math.max(v, 0), 1 / 2.2) * 255)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
};

// Lê os tokens directamente do globals.css — os números reflectem o ficheiro
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const tok = (blocoCss, nome) =>
  blocoCss.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`))[1];

const claroCss = css.match(/:root \{[\s\S]*?\n\}/)[0];
const escuroCss = css.match(/:root\[data-theme="dark"\] \{[\s\S]*?\n\}/)[0];

const papel = tok(claroCss, "talao-paper");
const floorC = tok(claroCss, "floor");
const floorE = tok(escuroCss, "floor");
const panelC = tok(claroCss, "panel");
const panelE = tok(escuroCss, "panel");

const PAPEIS = {
  "papel-sai": tok(claroCss, "papel-sai"),
  "papel-sai-tinta": tok(claroCss, "papel-sai-tinta"),
  "papel-fica": tok(claroCss, "papel-fica"),
  "papel-fica-tinta": tok(claroCss, "papel-fica-tinta"),
  "talao-ink": tok(claroCss, "talao-ink"),
};
const RAMPAS = {
  "seq-A claro": [1, 2, 3, 4].map((i) => tok(claroCss, `seq-${i}`)),
  "seq-A escuro": [1, 2, 3, 4].map((i) => tok(escuroCss, `seq-${i}`)),
  "seq-B claro": [1, 2, 3, 4].map((i) => tok(claroCss, `seqb-${i}`)),
  "seq-B escuro": [1, 2, 3, 4].map((i) => tok(escuroCss, `seqb-${i}`)),
};

console.log("== tinta sobre papel (AA texto, >=4.5) ==");
for (const [tinta, fundo] of [
  ["talao-ink", papel],
  ["papel-sai-tinta", PAPEIS["papel-sai"]],
  ["papel-fica-tinta", PAPEIS["papel-fica"]],
]) {
  console.log(`  ${tinta}: ${ratio(PAPEIS[tinta], fundo).toFixed(2)}:1`);
}

console.log("== papel vs floor (limite do objecto, >=3 ideal) ==");
for (const p of ["papel-sai", "papel-fica"]) {
  console.log(
    `  ${p}: claro ${ratio(PAPEIS[p], floorC).toFixed(2)} | escuro ${ratio(PAPEIS[p], floorE).toFixed(2)}`
  );
}

console.log("== rampas vs panel (linha grafica, >=3 ideal) ==");
for (const [nome, bg] of [
  ["seq-A claro", panelC],
  ["seq-A escuro", panelE],
  ["seq-B claro", panelC],
  ["seq-B escuro", panelE],
]) {
  console.log(`  ${nome}: ${RAMPAS[nome].map((c) => ratio(c, bg).toFixed(2)).join(" | ")}`);
}

console.log("== ordenacao por luminancia sob daltonismo ==");
for (const nome of Object.keys(RAMPAS)) {
  const claro = nome.includes("claro");
  for (const tipo of ["deuteranopia", "protanopia"]) {
    const sim = RAMPAS[nome].map((c) => L(machado(c, tipo)));
    const ord = sim.every((v, i) =>
      i === 0 ? true : claro ? v >= sim[i - 1] - 1e-4 : v <= sim[i - 1] + 1e-4
    );
    console.log(
      `  ${nome} ${tipo}: L=[${sim.map((v) => v.toFixed(3)).join(", ")}] ordenada=${ord}`
    );
  }
}
