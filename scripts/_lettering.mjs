#!/usr/bin/env node
/**
 * _lettering.mjs — auditoria de lettering (1B-02) sobre o HTML
 * exportado em `out/` (corre depois de `npm run build`).
 *
 * Varre o TEXTO visível de todas as rotas e falha se encontrar:
 *   (a) hífen antes de algarismo em contexto numérico — o menos
 *       verdadeiro é U+2212, nunca «-»;
 *   (b) espaço normal (ou NBSP largo) entre número e unidade —
 *       a ponte é o fino inseparável U+202F («1 856 €», «3,6 %»,
 *       «63,2 c», «1,2 p.p.»);
 *   (c) aspas retas "…" ou curvas “…” em texto PT-PT — a casa usa «…»;
 *   (d) reticências «...» — a forma certa é o carácter único «…».
 *
 * Não-inspecionado: <script>, <style>, <code>, <pre>, comentários e
 * ATRIBUTOS de tags — dados de geometria SVG (viewBox, points, d) e
 * amostras de código (ex.: a /estilo cita a forma errada de propósito)
 * não são copy.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = fileURLToPath(new URL("../out/", import.meta.url));
const FALHOS = [];

if (!existsSync(OUT)) {
  console.error("[lettering] out/ não existe — corre `npm run build` primeiro.");
  process.exit(1);
}

function* htmls(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* htmls(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

/** tira o texto visível do html — sem scripts/estilos/código/atributos */
function textoVisivel(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<code[\s\S]*?<\/code>/gi, " ")
    .replace(/<pre[\s\S]*?<\/pre>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&ldquo;|&rdquo;|&quot;|&#34;/gi, '"')
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&#8239;|&#x202f;/gi, " ")
    .replace(/&#8722;|&#x2212;|&minus;/gi, "−")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;|&gt;/gi, " ")
    .replace(/&#39;|&apos;/gi, "'");
}

const REGRAS = [
  {
    id: "menos",
    // hífen colado a algarismo sem letra/dígito antes — contexto
    // numérico («-1 234», «-5,2»); «2026-09» tem dígito antes, palavras
    // hifenizadas têm letra antes — nenhum é menos
    re: /(?<![\p{L}\p{N}])-\d/gu,
    msg: "hífen em vez do menos verdadeiro (U+2212)",
  },
  {
    id: "unidade",
    // dígito + espaço normal/NBSP + unidade-símbolo (€, %, c solto,
    // p.p.) — «cêntimos» e palavras não são símbolo
    re: /\d[  ](?=€|%|p\.p\.|c(?![\p{L}]))/gu,
    msg: "espaço normal/NBSP entre número e unidade — usar U+202F",
  },
  {
    id: "aspas",
    // aspa reta ou curva encostada a letra — início/fim de citação em
    // texto PT-PT; a casa usa «»
    re: /["“”][\p{L}«]|[\p{L}.…,;:!?»]["“”]/gu,
    msg: "aspas retas/curvas em texto PT-PT — usar «»",
  },
  {
    id: "reticencias",
    // três pontos seguidos — a reticência é o carácter único U+2026;
    // «…» sozinho e elipses em «a.»/«n.º» não apanham
    re: /\.\.\.|\. \. /gu,
    msg: "reticências em pontos separados — usar «…» (U+2026)",
  },
];

for (const f of htmls(OUT)) {
  const txt = textoVisivel(readFileSync(f, "utf8"));
  const rel = relative(OUT, f).replace(/\\/g, "/");
  for (const { id, re, msg } of REGRAS) {
    re.lastIndex = 0;
    for (const m of txt.matchAll(re)) {
      const ini = Math.max(0, m.index - 34);
      const ctx = txt
        .slice(ini, m.index + m[0].length + 20)
        .replace(/\s+/g, " ")
        .trim();
      FALHOS.push({ f: rel, id, msg, ctx });
    }
  }
}

if (FALHOS.length) {
  console.error(`[lettering] ${FALHOS.length} falha(s) de lettering:`);
  for (const x of FALHOS.slice(0, 60))
    console.error(`  ${x.f}  [${x.id}] ${x.msg}\n    …${x.ctx}…`);
  if (FALHOS.length > 60) console.error(`  …e mais ${FALHOS.length - 60}`);
  process.exit(1);
}
console.log(
  "[lettering] ok — fino inseparável, menos verdadeiro, «» e «…» em todas as rotas."
);
