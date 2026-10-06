/**
 * _orcamentos.mjs — OS ORÇAMENTOS DE PERFORMANCE, NUM SÍTIO SÓ.
 *
 * Estes números são do pack; até aqui andavam copiados por dentro de cada
 * medidor e por vários documentos, e um orçamento com várias cópias acaba
 * sempre com a cópia errada a mandar. Quem mede lê daqui:
 *
 *   - `_gate-html.mjs` ......... HTML da home (gate do CI)
 *   - `_dieta-html.mjs` ........ o mesmo, por blocos, com a folga à vista
 *   - `_js-por-rota.mjs` ....... JS inicial por rota (veredicto por rota)
 *   - `_sweep.mjs` ............. referência do orçamento de JS
 *   - `.github/workflows/ci*.yml` imprime esta tabela antes de correr o gate
 *
 * A UNIDADE É A DA MEDIDA: **KB gzip ao nível do CDN** (ver `_medida-cdn.mjs`).
 * Um tecto em gzip não se compara com bytes raw — foi esse erro de unidade que
 * fazia o medidor de JS por rota mostrar 608 KB onde o CDN serve 189,6 KB.
 *
 * Uso: `node scripts/_orcamentos.mjs` imprime a tabela; ou
 * `import { ORCAMENTOS } from "./_orcamentos.mjs"`.
 */
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** De onde vêm os valores — para quem os quiser conferir na fonte. */
export const FONTE =
  "pack V5: docs/PACK-V5-PRODUCAO.md (§P1) e docs/PRODUTO.md (orçamento de performance)";

/** Orçamentos em bytes, na unidade da medida (gzip ao nível do CDN). */
export const ORCAMENTOS = {
  /** HTML da home — o gate do CI falha acima disto. */
  htmlHomeGzipBytes: 80 * 1024,
  /** JS inicial por rota (no arranque, até ao evento load) — na home e nas restantes. */
  jsInicialRotaGzipBytes: 350 * 1024,
};

/** Quem aplica cada orçamento — a tabela impressa e os consumidores dizem o mesmo. */
export const APLICADO_POR = {
  htmlHomeGzipBytes: "scripts/_gate-html.mjs",
  jsInicialRotaGzipBytes: "scripts/_js-por-rota.mjs",
};

/** Falta (positivo) ou folga (negativo) para o orçamento, em bytes. */
export const excedente = (bytes, limite) => bytes - limite;

function tabela() {
  const linhas = Object.entries(ORCAMENTOS).map(
    ([chave, bytes]) =>
      `  ${APLICADO_POR[chave].padEnd(24)} ${(bytes / 1024).toFixed(0).padStart(4)} KB gzip`
  );
  return [
    `orçamentos de performance (gzip ao nível do CDN, ver _medida-cdn.mjs)`,
    ...linhas,
    `  fonte: ${FONTE}`,
  ].join("\n");
}

// Invocado como script (o passo do CI que imprime a tabela).
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(tabela());
}
