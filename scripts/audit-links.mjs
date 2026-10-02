// audit-links — a lógica partilhada do _mega-audit para resolver
// hrefs e verificar âncoras, isolada aqui para o teste unitário a
// cobrir sem rastrear o out/ inteiro.
import { statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

/** true só para ficheiros — uma pasta nunca é alvo de link nem asset */
export function ehFicheiro(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Resolve um href interno para ficheiro em `outDir`.
 *
 * Candidatas: o caminho tal e qual, `…/index.html`, `….html` — mas SÓ
 * se forem ficheiros. Sem esta guarda, «/» resolvia à pasta `out/`
 * (existsSync de uma pasta é true) e o readFile rebentava com EISDIR.
 * Quando nada resolve devolve o caminho cru — o chamador trata-o como
 * link partido.
 */
export function resolveHref(outDir, base, href) {
  const path = href.split("#")[0].split("?")[0];
  const hash = href.split("#")[1] ?? null;
  if (!path) return { file: null, hash };
  const p = path.startsWith("/") ? join(outDir, path) : resolve(dirname(base), path);
  const cand = [p, join(p, "index.html"), p + ".html"];
  for (const c of cand) if (ehFicheiro(c)) return { file: c, hash };
  return { file: p, hash };
}

/**
 * Um hash é válido se o HTML de destino tiver ` id="<h>"` — ou
 * ` data-id="<h>"`, que é como os edifícios do bairro nomeiam as suas
 * âncoras (/#financas abre a cena por JavaScript; o elemento não tem
 * id, tem data-id).
 */
export function temAlvo(html, hash) {
  const esc = hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?: id| data-id)="${esc}"`).test(html);
}
