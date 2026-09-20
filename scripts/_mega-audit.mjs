// mega-audit — rasteja o out/ exportado e verifica:
// links internos/externos/âncoras, assets, SEO por rota, símbolos/mojibake,
// a11y estrutural (alts, labels, headings, ids duplicados, aria-hidden focável)
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve, sep } from "node:path";

const OUT = resolve("out");
const SITE = "https://aocentimo.pt";
const falhas = [];
const avisos = [];

// ---- recolhe todos os .html ----
async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}

// rota canónica de um ficheiro html
function rota(file) {
  const rel = file.slice(OUT.length).split(sep).join("/");
  if (rel === "/index.html") return "/";
  return rel.replace(/\/index\.html$/, "").replace(/\.html$/, "");
}

// resolve um href interno para ficheiro em out/
function resolveHref(base, href) {
  const path = href.split("#")[0].split("?")[0];
  if (!path) return { file: null, hash: href.split("#")[1] ?? null };
  let p;
  if (path.startsWith("/")) p = join(OUT, path);
  else p = resolve(dirname(base), path);
  const cand = [p, join(p, "index.html"), p + ".html"];
  for (const c of cand) if (existsSync(c)) return { file: c, hash: href.split("#")[1] ?? null };
  return { file: p, hash: href.split("#")[1] ?? null };
}

const strip = (s) =>
  s
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
const attrs = (tag) =>
  Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map((m) => [m[1], m[2]]));

const paginas = [];
for await (const f of walk(OUT)) {
  if (f.includes("_not-found")) continue;
  paginas.push({ file: f, rota: rota(f), html: await readFile(f, "utf8") });
}
const rotas = new Set(paginas.map((p) => p.rota));
console.log(`${paginas.length} páginas rastreadas`);

// ---------- por página ----------
const titles = new Map();
for (const { file, rota: r, html } of paginas) {
  const tag = (s) => `${r}: ${s}`;

  // — SEO —
  const mTitle = html.match(/<title>([^<]*)<\/title>/);
  if (!mTitle) falhas.push(tag("sem <title>"));
  else {
    const t = mTitle[1].trim();
    if (!t) falhas.push(tag("<title> vazio"));
    if (titles.has(t)) falhas.push(tag(`title duplicado com ${titles.get(t)}: "${t}"`));
    titles.set(t, r);
  }
  if (r !== "/404") {
    const desc = html.match(/<meta name="description" content="([^"]*)"/);
    if (!desc || !desc[1].trim()) falhas.push(tag("sem meta description"));
    const can = html.match(/<link rel="canonical" href="([^"]*)"/);
    const esperado = SITE + (r === "/" ? "" : r);
    if (!can) falhas.push(tag("sem canonical"));
    else if (can[1] !== esperado) falhas.push(tag(`canonical "${can[1]}" ≠ "${esperado}"`));
    const ogT = html.match(/<meta property="og:title"/);
    if (!ogT) avisos.push(tag("sem og:title"));
    const ogI = html.match(/<meta property="og:image" content="([^"]*)"/);
    if (ogI) {
      const u = ogI[1].startsWith("http") ? ogI[1] : SITE + ogI[1];
      const local = ogI[1].startsWith("/") ? join(OUT, ogI[1]) : null;
      if (local && !existsSync(local)) falhas.push(tag(`og:image em falta: ${ogI[1]}`));
      if (!u.startsWith(SITE)) avisos.push(tag(`og:image fora do domínio: ${u}`));
    } else avisos.push(tag("sem og:image"));
  }
  const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
  if (r !== "/404" && h1s !== 1) falhas.push(tag(`${h1s} <h1> (esperado 1)`));

  // charset e viewport
  if (!/<meta charset="utf-8"/i.test(html)) falhas.push(tag("sem charset utf-8"));
  if (!/name="viewport"/.test(html)) falhas.push(tag("sem viewport"));

  // — ordem de headings —
  let prev = 0;
  for (const m of html.matchAll(/<h([1-6])[\s>]/g)) {
    const n = +m[1];
    if (prev && n > prev + 1) avisos.push(tag(`heading salta h${prev}→h${n}`));
    prev = n;
  }

  // — ids duplicados + conjunto de ids para âncoras —
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const d of new Set(dup)) falhas.push(tag(`id duplicado "${d}"`));

  // — links —
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const a = attrs(m[0]);
    const href = a.href ?? "";
    const txt = strip(html.slice(m.index, html.indexOf("</a>", m.index) + 4));
    if (!href) { falhas.push(tag(`<a> sem href "${txt.slice(0, 40)}"`)); continue; }
    if (href === "#") { falhas.push(tag(`link "#" morto "${txt.slice(0, 40)}"`)); continue; }
    if (/^javascript:/i.test(href)) { falhas.push(tag(`javascript: href`)); continue; }
    if (href.startsWith("http://") && !href.includes("localhost"))
      falhas.push(tag(`link http inseguro: ${href.slice(0, 60)}`));
    if (/^https?:\/\//.test(href)) {
      // externo
      if (a.target === "_blank") {
        const rel = a.rel ?? "";
        if (!/noopener/.test(rel)) falhas.push(tag(`_blank sem noopener: ${href.slice(0, 60)}`));
      }
      if (href.startsWith("http://aocentimo") || href.startsWith("https://aocentimo.js"))
        falhas.push(tag(`domínio errado: ${href.slice(0, 60)}`));
      continue;
    }
    if (/^(mailto|tel):/.test(href)) continue;
    // [data-futuro]: rotas temáticas planeadas (C/D) — o href já é o
    // final mas o ficheiro ainda não existe; não é um link partido
    if ("data-futuro" in a) continue;
    // interno
    const { file: alvo, hash } = resolveHref(file, href);
    if (hash !== null && hash !== "" && alvo === null && href.startsWith("#")) {
      if (!new RegExp(` id="${hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(html))
        falhas.push(tag(`âncora #${hash} sem alvo "${txt.slice(0, 30)}"`));
      continue;
    }
    if (alvo && !existsSync(alvo) && !alvo.endsWith(sep + "index.html")) {
      falhas.push(tag(`link partido → ${href} "${txt.slice(0, 30)}"`));
      continue;
    }
    if (alvo && existsSync(alvo) && hash) {
      const alvoHtml = await readFile(alvo, "utf8");
      if (!new RegExp(` id="${hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(alvoHtml))
        falhas.push(tag(`âncora ${href} sem alvo "${txt.slice(0, 30)}"`));
    }
  }

  // — assets locais (src/href de ficheiros) —
  for (const m of html.matchAll(/ (?:src|href)="(\/[^"]+)"/g)) {
    const u = m[1];
    if (u.startsWith("//") || u.startsWith("/_next/static/media")) { /* media pode estar embutida */ }
    if (/^\/(_next|.*\.(css|js|svg|png|jpg|webp|ico|woff2|xml|json|txt|webmanifest))/.test(u)) {
      const { file: alvo } = resolveHref(file, u);
      if (!alvo || !existsSync(alvo)) {
        // pode ser rota (link já coberto) — só falha se parecer asset
        if (/\.(css|js|svg|png|jpg|webp|ico|woff2|xml|json|txt|webmanifest)$/.test(u))
          falhas.push(tag(`asset em falta: ${u}`));
      }
    }
  }

  // — imgs sem alt —
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const a = attrs(m[0]);
    if (!("alt" in a)) falhas.push(tag(`<img> sem alt: ${(a.src ?? "").slice(0, 50)}`));
  }

  // — inputs sem label (id/aria, ou dentro de <label> = associação implícita) —
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const a = attrs(m[0]);
    if (a.type === "hidden" || a["aria-hidden"] === "true") continue;
    if (a.id || a["aria-label"] || a["aria-labelledby"] || a.placeholder) continue;
    // dentro de <label>? conta labels abertos vs fechados antes do input
    const antes = html.slice(Math.max(0, m.index - 3000), m.index);
    const abertos = (antes.match(/<label\b/g) ?? []).length;
    const fechados = (antes.match(/<\/label>/g) ?? []).length;
    if (abertos > fechados) continue;
    falhas.push(tag(`<${m[1]}> sem label/aria: ${JSON.stringify(a).slice(0, 80)}`));
  }

  // — aria-hidden com conteúdo focável (sub-árvore balanceada) —
  for (const m of html.matchAll(/<(\w+)[^>]*aria-hidden="true"[^>]*>/g)) {
    const nome = m[1].toLowerCase();
    if (m[0].endsWith("/>")) continue;
    // encontra o fecho correspondente por profundidade
    let depth = 1, i = m.index + m[0].length, fim = -1;
    const re = new RegExp(`<${nome}\\b|</${nome}>`, "g");
    re.lastIndex = i;
    let mm;
    while ((mm = re.exec(html)) && depth > 0 && mm.index < m.index + 20000) {
      depth += mm[0].startsWith("</") ? -1 : 1;
      if (depth === 0) fim = mm.index;
    }
    if (fim === -1) continue;
    const inner = html.slice(i, fim);
    if (/<(a|button|input|select|textarea)\b/.test(inner))
      falhas.push(tag(`focável dentro de aria-hidden <${nome}>`));
  }

  // — mojibake / texto partido —
  const texto = strip(html);
  for (const [padrao, nome] of [
    [/Ã[©¨ª³¡¢­¨]/, "mojibake UTF-8"],
    [/â€[œ™"']/, "mojibake pontuação"],
    [/ðŸ/, "mojibake emoji"],
    [/\bNaN\b/, "NaN visível"],
    [/\bundefined\b/, "undefined visível"],
    [/\bnull\b(?!')/, "null visível"],
    [/\[object Object\]/, "[object Object]"],
    [/\{\{|\}\}/, "template não resolvido"],
    [/&#x?[0-9a-f]+;?$/i, "entidade partida"],
  ]) {
    if (padrao.test(texto)) falhas.push(tag(`${nome} no texto`));
  }
}

// ---------- sitemap ↔ rotas ----------
const sitemap = await readFile(join(OUT, "sitemap.xml"), "utf8").catch(() => "");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  m[1].replace(SITE, "") || "/");
for (const l of locs)
  if (!rotas.has(l)) falhas.push(`sitemap lista rota inexistente: ${l}`);
const noSitemap = [...rotas].filter((r) => !locs.includes(r) && r !== "/404");
for (const r of noSitemap) avisos.push(`rota fora do sitemap: ${r}`);

// ---------- feed ----------
const feed = await readFile(join(OUT, "feed.xml"), "utf8").catch(() => "");
if (!feed) avisos.push("sem feed.xml");
else {
  const bad = [...feed.matchAll(/<link>([^<]+)</g)].filter((m) => !m[1].startsWith(SITE));
  for (const b of bad) falhas.push(`feed link fora do domínio: ${b[1]}`);
}

// ---------- ícones/manifest ----------
for (const u of ["/icon.svg", "/favicon.ico"])
  if (!existsSync(join(OUT, u)) && !existsSync(join(OUT, u + ".html")))
    avisos.push(`sem ${u}`);

console.log(`\n=== FALHAS (${falhas.length}) ===`);
for (const f of falhas) console.log(" ✗ " + f);
console.log(`\n=== AVISOS (${avisos.length}) ===`);
for (const a of avisos) console.log(" ~ " + a);
