/**
 * _medida-cdn.mjs — A MEDIDA DE PESO, AO NÍVEL DO CDN.
 *
 * O pack impõe orçamentos em **KB gzip** (80 KB para o HTML da home, 350 KB
 * de JS inicial por rota). Medir esses pesos com o compressor local por
 * omissão dá folgas que não existem: o `gzipSync` sem nível usa o nível 6 e o
 * Node traz zlib 1.3.1, que comprime melhor que o zlib do CDN. No conserto do
 * HTML da home essa folga falsa era de ~2,5 KB (media 72,4 KB onde o CDN
 * servia 74,9 KB).
 *
 * Medições a 2026-10-06 sobre o que o CDN serve (GitHub Pages):
 *
 *   home publicada, 582 739 B de HTML:
 *     `gzip -5` (Apple) ............. 76 734 B  ← igual ao content-length do CDN
 *     Python / zlib 1.2.11, nível 5 . 76 734 B
 *     Node zlib 1.3.1, nível 5 ...... 76 256 B
 *     Node zlib 1.3.1, nível 6 ...... 74 146 B  ← folga falsa de 2,5 KB
 *   chunk .js publicado, 16 802 B:
 *     CDN (content-length) .......... 6 283 B
 *     `gzip -5` ..................... 6 290 B
 *     Node zlib 1.3.1, nível 5 ...... 6 292 B
 *     Node zlib 1.3.1, nível 6 ...... 6 286 B
 *
 * Ou seja: o nível e a biblioteca do CDN não coincidem sempre com os da
 * máquina (no HTML o nível 5 acerta ao byte; no JS o CDN fica entre o 6 e o
 * 5). O que se pode garantir — e é o que importa a um orçamento — é **nunca
 * reportar menos do que o CDN serve**: mede-se ao nível 5 (o mais conservador
 * dos três: 5 > 6 > 9 em tamanho), corrige-se a diferença de zlib com
 * FATOR_ZLIB e arredonda-se **para cima**. Assim nenhum medidor abre folga.
 *
 * Uso:
 *   import { medirGzipCdn, pesoDeUrls, kb } from "./_medida-cdn.mjs";
 */
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Nível de compressão mais próximo do CDN sem ser optimista. */
export const NIVEL_GZIP = 5;
/**
 * Correção da diferença de biblioteca (Node zlib 1.3.1 vs CDN 1.2.x), derivada
 * da home publicada: 76 734 / 76 257. Aplicada a todos os conteúdos — é uma
 * diferença do compressor, não do ficheiro.
 */
export const FATOR_ZLIB = 76_734 / 76_257;

/** Bytes gzip de `dados`, na medida do CDN (nunca abaixo do que ele serve). */
export function medirGzipCdn(dados) {
  const buf = typeof dados === "string" ? Buffer.from(dados, "utf8") : dados;
  return Math.ceil(gzipSync(buf, { level: NIVEL_GZIP }).length * FATOR_ZLIB);
}

/** KB com uma casa decimal — a unidade dos orçamentos. */
export const kb = (bytes) => (bytes / 1024).toFixed(1);

/**
 * Peso gzip (medida do CDN) de um conjunto de caminhos de URL, lido do
 * estático em `raiz`. Deduplica caminhos, guarda cache por ficheiro e conta à
 * parte os que não existem em `raiz` — medir menos ficheiros sem o dizer seria
 * outra folga falsa.
 */
export function pesoDeUrls(urls, raiz = "out") {
  const cache = new Map();
  let bytes = 0;
  let ficheiros = 0;
  let fora = 0;
  for (const url of new Set(urls)) {
    const caminho = join(raiz, url.replace(/^\//, ""));
    let n = cache.get(caminho);
    if (n === undefined) {
      try {
        n = medirGzipCdn(readFileSync(caminho));
      } catch {
        n = null; // não está no estático (CDN externo, rota dinâmica…)
      }
      cache.set(caminho, n);
    }
    if (n === null) {
      fora += 1;
      continue;
    }
    bytes += n;
    ficheiros += 1;
  }
  return { bytes, ficheiros, fora };
}
