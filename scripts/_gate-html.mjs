/**
 * _gate-html.mjs — O ORÇAMENTO DO HTML DA HOME, como gate.
 *
 * O pack impõe um tecto ao HTML da home (§4) — o valor vive em
 * `_orcamentos.mjs`, não aqui. Chegámos lá no conserto do flight
 * (PR v5/p4-flight): o mapa deixou de viajar duas vezes (DOM + payload
 * RSC) e passa a viajar uma só — no DOM.
 *
 * Verifica também a PROMESSA ARQUITECTURAL que tornou isso possível: o
 * payload RSC (`self.__next_f`) não contém o SVG do mapa — o mapa é
 * HTML renderizado, não carga de hidratação. Se alguém voltar a passar
 * o mapa por prop, este gate aponta-lhe o dedo.
 *
 * Uso: node scripts/_gate-html.mjs [out/index.html]
 * Saída: ok em silêncio (o CI imprime a linha de medida); falha com a
 * diferença se o tecto for ultrapassado.
 */
import { readFileSync } from "node:fs";
// A medida é a do CDN, num sítio só: scripts/_medida-cdn.mjs (nível 5 + o
// fator de zlib, arredondado para cima). Sem isso o gzipSync por omissão
// (nível 6) media 72,4 KB onde o CDN servia 74,9 KB — folga falsa de 2,5 KB.
import { kb, medirGzipCdn } from "./_medida-cdn.mjs";
// O tecto da home vive num sítio só — scripts/_orcamentos.mjs (com a fonte do
// pack ao lado). Aqui não se repete o número.
import { ORCAMENTOS } from "./_orcamentos.mjs";

const ficheiro = process.argv[2] ?? "out/index.html";
const LIMITE = ORCAMENTOS.htmlHomeGzipBytes;

const html = readFileSync(ficheiro, "utf8");
const gz = medirGzipCdn(html);

console.log(
  `home: ${kb(gz)} KB gzip (limite ${(LIMITE / 1024).toFixed(0)} KB · medida igual à do CDN)`
);

// — a promessa: o mapa no DOM, não no flight —
const noDom = html.includes("b-camada");
const rscs = [];
{
  const re = /<script>self\.__next_f\.push\(/g;
  let m;
  while ((m = re.exec(html))) {
    const ini = html.lastIndexOf("<script", m.index);
    const fim = html.indexOf("</script>", m.index) + "</script>".length;
    rscs.push(html.slice(ini, fim));
  }
}
const flight = rscs.join("\n");
const noFlight = flight.includes("b-camada");

if (noFlight) {
  console.error(
    `FALHA: o payload RSC contém o SVG do mapa (b-camada em self.__next_f).\n` +
      `O mapa tem de ser HTML renderizado, não carga de hidratação.\n` +
      `Quem o meteu lá? Um prop com o html do mapa a atravessar a fronteira servidor→cliente.`
  );
  process.exit(1);
}
if (!noDom) {
  console.error("FALHA: o HTML renderizado não tem o mapa (b-camada ausente).");
  process.exit(1);
}
if (gz > LIMITE) {
  console.error(
    `FALHA: o HTML da home pesa ${kb(gz)} KB gzip — ` +
      ` ${(gz - LIMITE > 0 ? "+" : "")}${kb(gz - LIMITE)} KB acima do limite de ${(LIMITE / 1024).toFixed(0)} KB (scripts/_orcamentos.mjs).`
  );
  process.exit(1);
}
console.log("ok: mapa no DOM, flight limpo, dentro do orçamento.");
