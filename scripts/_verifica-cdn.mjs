/**
 * _verifica-cdn.mjs — O ORÇAMENTO DA HOME, VERIFICADO SOBRE O QUE O CDN SERVE.
 *
 * O gate `_gate-html.mjs` mede o HTML do build com a medida do CDN — uma
 * calibração (nível 5 + fator de zlib) que acerta ao byte no dia em que foi
 * escrita, mas continua a ser uma previsão. Este passo corre DEPOIS da
 * publicação, vai buscar a home publicada e conta os bytes que o CDN envia
 * de facto: é a única medição de ponta a ponta (build → CDN → browser) e
 * fecha a questão «o número medido é o número real?».
 *
 * Pedimos `Accept-Encoding: gzip` (o orçamento é em gzip) e contamos o corpo
 * CRU, sem descomprimir — é o que o utilizador recebe. Não se usa `fetch`
 * porque ele descomprime e esconde o tamanho codificado; o `node:https`
 * entrega os bytes tal como viajam.
 *
 * Uso: node scripts/_verifica-cdn.mjs [url]   (default https://aocentimo.pt/)
 * Sai com código ≠ 0 se o gzip servido passar do tecto da home.
 */
import { get as httpsGet } from "node:https";
import { get as httpGet } from "node:http";
import { ORCAMENTOS } from "./_orcamentos.mjs";

const LIMITE = ORCAMENTOS.htmlHomeGzipBytes;
const URL_ALVO = process.argv[2] || "https://aocentimo.pt/";
const TENTATIVAS = 5;
const ESPERA_MS = 3000;

const kb = (n) => (n / 1024).toFixed(1);

/** Um GET que devolve o corpo CRU (sem descomprimir) e conta os bytes. */
function buscar(url, saltos = 0) {
  return new Promise((resolve, reject) => {
    const cliente = url.startsWith("http://") ? httpGet : httpsGet;
    const req = cliente(
      url,
      { headers: { "Accept-Encoding": "gzip", "User-Agent": "aocentimo-verifica-cdn" } },
      (res) => {
        const { statusCode, headers } = res;
        if ([301, 302, 307, 308].includes(statusCode) && headers.location && saltos < 5) {
          res.resume();
          resolve(buscar(new URL(headers.location, url).toString(), saltos + 1));
          return;
        }
        let bytes = 0;
        res.on("data", (c) => (bytes += c.length));
        res.on("end", () =>
          resolve({ status: statusCode, encoding: headers["content-encoding"] ?? "(nenhuma)", bytes })
        );
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    req.setTimeout(15000, () => req.destroy(new Error("timeout após 15 s")));
  });
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

let r = null;
let ultimoErro = "";
for (let i = 1; i <= TENTATIVAS; i++) {
  try {
    r = await buscar(URL_ALVO);
    if (r.status === 200) break;
    ultimoErro = `HTTP ${r.status}`;
  } catch (e) {
    ultimoErro = e.message;
  }
  if (i < TENTATIVAS) {
    console.log(`tentativa ${i}/${TENTATIVAS} falhou (${ultimoErro}); nova tentativa em ${ESPERA_MS / 1000} s…`);
    await dormir(ESPERA_MS);
  }
}

if (!r || r.status !== 200) {
  console.error(`FALHA: não consegui ler a home publicada em ${URL_ALVO} (${ultimoErro}).`);
  process.exit(1);
}

console.log(`home publicada (${URL_ALVO}): HTTP ${r.status}`);
console.log(`content-encoding: ${r.encoding}`);
console.log(
  `gzip servido: ${kb(r.bytes)} KB (${r.bytes} B) — tecto ${(LIMITE / 1024).toFixed(0)} KB (scripts/_orcamentos.mjs)`
);

if (r.encoding !== "gzip") {
  console.error(
    `FALHA: o CDN não serviu gzip (serviu «${r.encoding}»). ` +
      `O orçamento é em gzip — confirme que o host comprime, ou reveja a unidade do tecto.`
  );
  process.exit(1);
}
if (r.bytes > LIMITE) {
  console.error(
    `FALHA: a home publicada pesa ${kb(r.bytes)} KB gzip — ` +
      `${kb(r.bytes - LIMITE)} KB acima do tecto de ${(LIMITE / 1024).toFixed(0)} KB.`
  );
  process.exit(1);
}
console.log("ok: a home publicada está dentro do orçamento, medido no CDN.");
