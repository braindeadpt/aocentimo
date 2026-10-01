// pós-build: o export estático do Next 16 escreve os dados de página de
// cada rota como `out/<rota>/__next.<rota>/__PAGE__.txt` (aninhado), mas
// o prefetch do cliente pede o nome PLANO `__next.<rota>.__PAGE__.txt` —
// medido: o <Link> da nav para /aprender (a única rota com filho
// dinâmico [slug]) pedia `/aprender/__next.aprender.__PAGE__.txt` e o
// ficheiro não existia → 404 na consola, em produção e nos e2e.
//
// O espelho copia cada ficheiro dentro de um directório `__next.<…>` para
// o irmão plano ao lado (as subpastas juntam-se com «.»). Bytes iguais,
// URL certa — sem isto, o 404 ia para o GitHub Pages também.

import { readdirSync, copyFileSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
let n = 0;

function varrer(dir) {
  let entradas;
  try {
    entradas = readdirSync(dir);
  } catch {
    return; // sem out/ ainda — o build é que corre este script
  }
  for (const nome of entradas) {
    const p = join(dir, nome);
    if (!statSync(p).isDirectory()) continue;
    if (nome.startsWith("__next.")) espelhar(dir, p, nome);
    else varrer(p);
  }
}

function espelhar(base, sub, prefixo) {
  for (const f of readdirSync(sub)) {
    const p = join(sub, f);
    if (statSync(p).isDirectory()) espelhar(base, p, `${prefixo}.${f}`);
    else {
      copyFileSync(p, join(base, `${prefixo}.${f}`));
      n++;
    }
  }
}

varrer(OUT);
console.log(`postbuild: ${n} ficheiros de segmento espelhados para o nome plano`);
