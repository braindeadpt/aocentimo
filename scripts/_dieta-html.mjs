/**
 * _dieta-html.mjs — ORÇAMENTO DO HTML DA HOME, componente a componente.
 *
 * Mede out/index.html (o estático, = deploy) por blocos: o mapa
 * (.b-mundo) e cada camada/solto/pin dentro dele, o payload RSC, o
 * <style> do bairro e o resto. Depois corre EXPERIMENTOS sobre uma
 * cópia em memória — arredondar coordenadas, tirar marcadores, tirar
 * peças soltas — e mede o gzip de cada hipótese. Nada é escrito; só
 * lê e imprime.
 *
 * Uso: node scripts/_dieta-html.mjs [out/index.html]
 */
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const ficheiro = process.argv[2] ?? "out/index.html";
const html = readFileSync(ficheiro, "utf8");
const gz = (s) => gzipSync(Buffer.from(s, "utf8")).length;
const fmt = (n) => n.toLocaleString("pt-PT", { maximumFractionDigits: 0 });

/** [início, fim) de um bloco <tag …> … </tag> a partir de `ini`. */
function alcanceTag(s, ini, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*?(/?)>|</${tag}>`, "g");
  re.lastIndex = ini;
  let d = 0, m;
  while ((m = re.exec(s))) {
    if (m[1] === "/") return [ini, re.lastIndex]; // <tag …/> auto-fechada
    d += m[0].startsWith("</") ? -1 : 1;
    if (d === 0) return [ini, re.lastIndex];
  }
  throw new Error(`bloco <${tag}> sem fecho a partir de ${ini}`);
}

/** [início, fim) do <div …> … </div> que começa em `ini`. */
function alcanceDiv(s, ini) {
  return alcanceTag(s, ini, "div");
}

// ——— cortes de topo ———
const iniMundo = html.indexOf('<div class="b-mundo"');
if (iniMundo < 0) throw new Error("sem .b-mundo no ficheiro");
const [aMundo, fMundo] = alcanceDiv(html, iniMundo);
const mundo = html.slice(aMundo, fMundo);

// payload RSC: os <script>self.__next_f.push…</script>
const pedacosRSC = [];
{
  const re = /<script>self\.__next_f\.push/g;
  let m;
  while ((m = re.exec(html))) {
    const ini = html.lastIndexOf("<script", m.index);
    const fim = html.indexOf("</script>", m.index) + "</script>".length;
    pedacosRSC.push(html.slice(ini, fim));
  }
}
const rsc = pedacosRSC.join("");

// o <style> do bairro
const iniStyle = html.indexOf("<style");
const [aStyle, fStyle] = alcanceTag(html, iniStyle, "style");
const styleBairro = html.slice(aStyle, fStyle);

const resto =
  html.slice(0, aMundo) +
  html.slice(fMundo, aStyle) +
  html.slice(fStyle).replace(rsc, "");

const total = html.length;
const linha = (nome, raw, nota = "") => {
  const L = typeof raw === "string" ? raw.length : raw;
  console.log(
    `${nome.padEnd(34)} raw ${fmt(L).padStart(9)}  gzip ${fmt(gz(String(raw))).padStart(8)}  ${(nota)}`
  );
};

console.log(`\n=== ORÇAMENTO: ${ficheiro} ===`);
console.log(`TOTAL                             raw ${fmt(total).padStart(9)}  gzip ${fmt(gz(html)).padStart(8)}`);
console.log("─".repeat(78));
linha(".b-mundo (o mapa inteiro)", mundo, `${((mundo.length / total) * 100).toFixed(1)}% do raw`);
linha("  payload RSC (3 scripts)", rsc, `${((rsc.length / total) * 100).toFixed(1)}%`);
linha("  <style> do bairro", styleBairro, `${((styleBairro.length / total) * 100).toFixed(1)}%`);
linha("  resto (hero, header, footer…)", resto, `${((resto.length / total) * 100).toFixed(1)}%`);

// ——— dentro do mapa: camada a camada ———
console.log("\n--- dentro do .b-mundo ---");
const pecas = [];
{
  const re = /<svg\b/g;
  let m;
  while ((m = re.exec(mundo))) {
    const [a, f] = alcanceTag(mundo, m.index, "svg");
    const abre = mundo.slice(m.index, mundo.indexOf(">", m.index) + 1);
    const classe = (abre.match(/class="([^"]*)"/) ?? [, "?"])[1];
    const id = (abre.match(/id="([^"]*)"/) ?? [, ""])[1];
    pecas.push({ a, f, classe, id, texto: mundo.slice(a, f) });
  }
}
const rotulo = (p) =>
  p.classe === "b-camada"
    ? `camada ${p.id}`
    : p.classe.startsWith("b-solto")
      ? `solto ${p.classe.replace("b-solto ", "")}${p.id ? " (" + p.id + ")" : ""}`
      : `nuvem? ${p.id || p.classe}`;
for (const p of pecas) linha("  " + rotulo(p), p.texto);

// os pins (dentro do cTopo)
const pins = [];
{
  const re = /<g class="pin"/g;
  let m;
  while ((m = re.exec(mundo))) {
    const [a, f] = alcanceTag(mundo, m.index, "g");
    pins.push(mundo.slice(a, f));
  }
}
const gzPins = gz(pins.join(""));
console.log(
  `  pins (${String(pins.length).padStart(2)} no total)          raw ${fmt(pins.join("").length).padStart(9)}  gzip ${fmt(gzPins).padStart(8)}  média ${fmt(pins.join("").length / pins.length)} raw`
);

// ——— EXPERIMENTOS ———
console.log("\n=== EXPERIMENTOS (medidos sobre o HTML inteiro) ===");
const base = gz(html);
console.log(`base gzip: ${fmt(base)} bytes\n`);

const aplicarNoMapa = (fn) =>
  html.slice(0, aMundo) + fn(mundo) + html.slice(fMundo);

// A. arredondar coordenadas nos d= e transform= do mapa
const arredondar = (s) =>
  s.replace(/\b(d|transform|points)="([^"]*)"/g, (m0, attr, v) => {
    if (attr === "transform" && !/^(matrix|translate|scale)/.test(v)) return m0;
    return `${attr}="${v.replace(/-?\d+\.\d+/g, (x) => String(Math.round(+x)))}"`;
  });
{
  const n = (mundo.match(/-?\d+\.\d+/g) ?? []).length;
  const substituidos = (arredondar(mundo).match(/-?\d+\.\d+/g) ?? []).length;
  const h2 = aplicarNoMapa(arredondar);
  console.log(`A · arredondar decimais do mapa (ficam ${substituidos} de ${n} com décimas)`);
  console.log(`   gzip ${fmt(base)} → ${fmt(gz(h2))}  (−${fmt(base - gz(h2))}, −${((1 - gz(h2) / base) * 100).toFixed(1)}%)`);
}

// B. sem os pins no HTML (o tecto do «marcadores servidos à parte / lazy»)
{
  const semPins = mundo.replace(/<g class="pin"[\s\S]*?<\/g>\s*(?=<g class="pin"|<\/svg>)/g, "");
  const h2 = aplicarNoMapa(() => semPins);
  console.log(`B · tirar os ${pins.length} pins do HTML (servidos à parte)`);
  console.log(`   gzip ${fmt(base)} → ${fmt(gz(h2))}  (−${fmt(base - gz(h2))}, −${((1 - gz(h2) / base) * 100).toFixed(1)}%)`);
}

// C. sem as peças soltas (metro, barcos, nuvens — entrariam por JS/CSS)
{
  const semSoltos = pecas
    .filter((p) => !p.classe.startsWith("b-camada") && p.classe !== "b-camada")
    .reduce((acc, p) => acc.replace(p.texto, ""), mundo);
  const h2 = aplicarNoMapa(() => semSoltos);
  console.log(`C · tirar soltos + nuvens (animar por JS depois do load)`);
  console.log(`   gzip ${fmt(base)} → ${fmt(gz(h2))}  (−${fmt(base - gz(h2))}, −${((1 - gz(h2) / base) * 100).toFixed(1)}%)`);
}

// A+B combinados
{
  const semPins = mundo.replace(/<g class="pin"[\s\S]*?<\/g>\s*(?=<g class="pin"|<\/svg>)/g, "");
  const h2 = aplicarNoMapa(() => arredondar(semPins));
  console.log(`A+B · arredondar + tirar pins`);
  console.log(`   gzip ${fmt(base)} → ${fmt(gz(h2))}  (−${fmt(base - gz(h2))}, −${((1 - gz(h2) / base) * 100).toFixed(1)}%)`);
}

// D · o mapa DENTRO do payload RSC: localizar a string do prop `html`
// (JSON-escapada, dois níveis), retirá-la e medir. É o tecto exacto do
// conserto arquitectural «o mapa não passa por props».
{
  const scripts = [...html.matchAll(/<script>self\.__next_f\.push\((\[1,")/g)];
  let mapaNoRSC = "", nRows = 0;
  for (const m of scripts) {
    const iniStr = m.index + m[0].length - 1; // abre a aspa da string JS
    // extrair a string JS com um varrimento que respeita escapes
    let i = iniStr + 1, out = "";
    while (i < html.length && html[i] !== '"') {
      if (html[i] === "\\") { out += html[i] + html[i + 1]; i += 2; }
      else { out += html[i]; i += 1; }
    }
    // out é o conteúdo escapado da string JS; o seu texto real é JSON-decodificável
    let row;
    try { row = JSON.parse('"' + out + '"'); } catch { continue; }
    const k = row.indexOf('"html":"');
    if (k < 0) continue;
    nRows++;
    // varrer o valor da string JSON a partir de k + 8
    let j = k + 8, val = "";
    while (j < row.length && row[j] !== '"') {
      if (row[j] === "\\") { val += row[j] + row[j + 1]; j += 2; }
      else { val += row[j]; j += 1; }
    }
    mapaNoRSC += val;
  }
  console.log(`D · o prop html DENTRO do payload RSC (${nRows} linha(s))`);
  console.log(`   raw ${fmt(mapaNoRSC.length)}  gzip ${fmt(gz(mapaNoRSC))}  — é o peso duplicado do mapa no flight`);
}

// D2 · peso do mapa no flight por SUBTRACÇÃO: gzip de todas as linhas
// do flight vs gzip sem as que contêm o mapa.
{
  const linhas = [];
  const re = /self\.__next_f\.push\((\[1,")/g;
  let m;
  while ((m = re.exec(html))) {
    const ini = m.index + m[0].length - 1;
    let i = ini + 1, out = "";
    while (i < html.length && html[i] !== '"') {
      if (html[i] === "\\") { out += html[i] + html[i + 1]; i += 2; }
      else { out += html[i]; i += 1; }
    }
    let row; try { row = JSON.parse('"' + out + '"'); } catch { continue; }
    linhas.push(row);
  }
  const temMapa = linhas.filter(l => l.includes("b-cFundo") || l.includes("b-cRio"));
  const semMapa = linhas.filter(l => !l.includes("b-cFundo") && !l.includes("b-cRio"));
  const gzDe = arr => gz(arr.join(""));
  console.log(`D2 · flight: ${linhas.length} linhas, ${temMapa.length} contêm o mapa`);
  console.log(`   flight inteiro: gzip ${fmt(gzDe(linhas))}`);
  console.log(`   flight sem linhas do mapa: gzip ${fmt(gzDe(semMapa))}  → o mapa no flight ≈ ${fmt(gzDe(linhas) - gzDe(semMapa))} gzip`);
  if (temMapa.length) {
    const maior = temMapa.reduce((a, b) => b.length > a.length ? b : a);
    console.log(`   maior linha com mapa: raw ${fmt(maior.length)} gzip ${fmt(gz(maior))}`);
  }
}
