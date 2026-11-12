// Preload da instância de 116% do Archivo — só na home.
//
// Escrever o <link> no JSX não resultava: o React 19 leva os <link> do
// <body> para o <head>, e o <Link href="/"> da barra dispara o prefetch
// da home, de onde o <link> vinha junto — o browser pedia os 27,1 KB
// também em /estilo, que não tem o título. Aqui o preload é posto no
// HTML exportado, que é por rota: a home pede-o, as outras 35 não.
//
// O @font-face está em src/app/_bairro/bairro.css, que só a home
// carrega, e o ficheiro em public/fonts/.
//
//   node scripts/_preload-intro.mjs         aplica
//   node scripts/_preload-intro.mjs --check só verifica (sai 1 se divergir)

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const LINK =
  '<link rel="preload" href="/fonts/Archivo-intro.woff2" as="font" type="font/woff2" crossorigin=""/>';
const ALVO = join(process.cwd(), "out", "index.html");
const SO_VERIFICA = process.argv.includes("--check");

const html = await readFile(ALVO, "utf8");
const jaLa = html.includes(LINK);

if (SO_VERIFICA) {
  if (!jaLa) {
    console.error("FALHA: a home não tem o preload da instância de 116%");
    process.exit(1);
  }
  console.log("ok: a home tem o preload da instância de 116%");
  process.exit(0);
}

if (jaLa) {
  console.log("preload da intro: já estava no index.html");
  process.exit(0);
}

// logo a seguir ao charset no início do <head>, antes dos scripts, para
// a fonte de 116% chegar antes da primeira pintura mesmo sob carga paralela
const MARCA_CHARSET = '<meta charSet="utf-8"/>';
const ic = html.indexOf(MARCA_CHARSET);
const ih = html.indexOf("<head>");
const i =
  ic >= 0
    ? ic + MARCA_CHARSET.length
    : ih >= 0
      ? ih + "<head>".length
      : html.indexOf("</head>");
if (i < 0) {
  console.error("FALHA: o index.html não tem <head>");
  process.exit(1);
}
await writeFile(ALVO, html.slice(0, i) + LINK + html.slice(i));
console.log("preload da intro:posto no index.html");
