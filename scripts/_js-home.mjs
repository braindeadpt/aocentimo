/**
 * _js-home.mjs — o peso do JavaScript inicial da home, lido do export.
 *
 * O `_js-por-rota.mjs` mede isto com o Playwright, que precisa do browser
 * instalado. Este aqui é a mesma medição em linha de comando: soma os
 * ficheiros `.js` que a home traz no `<script src>` do HTML exportado.
 *
 * A MEDIDA É A COMPRIMIDA. O pack (§4 P1) diz «a home não passa os
 * 350 KB de JS inicial», e o `_js-por-rota.mjs` — que é onde esse número
 * vem — mede `transferSize`, ou seja o que vai pelo fio. Medir os bytes
 * em disco daria quase o dobro e reprovaria uma home que, no browser, é
 * leve. Por isso aqui é gzip.
 *
 *   node scripts/_js-home.mjs [limite-em-KB]
 *
 * Sai com 1 se passar do limite.
 */
import { readFileSync, existsSync, readFileSync as ler } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const LIMITE_KB = Number(process.argv[2] ?? 350);
const html = readFileSync("out/index.html", "utf8");

const urls = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
let total = 0;
let contados = 0;
for (const url of urls) {
  const p = join("out", url.replace(/^\//, ""));
  if (!existsSync(p)) continue;
  total += gzipSync(ler(p), { level: 9 }).length;
  contados++;
}

const kb = total / 1024;
const ok = kb <= LIMITE_KB;
console.log(
  `${ok ? "✓" : "✗"} home: ${kb.toFixed(1)} KB de JS inicial, gzip (${contados} ficheiros) · limite ${LIMITE_KB} KB`
);
process.exit(ok ? 0 : 1);
