// O custo puro de mundoBairro(montarMapa(marcadores)) — os builders do
// bairro são puros (sem DOM, sem relógio, sem dados), por isso a mesma
// engine V8 de Node dá o número do browser. A regra do dono: >30 ms ⇒
// passar a requestIdleCallback. Uso: npx tsx scripts/_tempo-mundo.mjs
import { performance } from "node:perf_hooks";
import { montarMapa } from "../src/lib/bairro/planta.ts";
import { mundoBairro } from "../src/lib/bairro/mundo.ts";
import { readFileSync } from "node:fs";

// Os valores de hoje, tal como o dadosBairro os formata — extraídos do
// HTML do build para NÃO inventar números (Regra nº1). A ordem dos pins
// no HTML é a de m.pinos: [fabrica, segsocial, financas, banco, correios,
// bomba, bomba2, mercearia, pastelaria, casa, quiosque, quiosque2, escola]
// — os VALORES de 19pt em cada um, por essa ordem.
const html = readFileSync("out/index.html", "utf8");
const valores = [...html.matchAll(/<text x="0" y="-22"[^>]*font-size="19"[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);
if (valores.length < 13) {
  console.error(`esperava 13 valores no out/index.html, encontrei ${valores.length} — corre npm run build antes`);
  process.exit(1);
}
const [salario, tsu, irs, euribor, ca, gasoleoUn, gasolinaUn, cabaz, cafes, liquido, inflacao, desemprego] = valores;
const D = { salario, tsu, irs, liquido, cabaz, cafes, euribor, ca,
  gasoleo: gasoleoUn.replace(/\s*[^\d,.]+$/, ""), gasolina: gasolinaUn.replace(/\s*[^\d,.]+$/, ""),
  gasoleoUn, gasolinaUn, inflacao, desemprego };

for (let k = 0; k < 5; k++) mundoBairro(montarMapa(D)); // JIT
const N = 20;
const t0 = performance.now();
for (let k = 0; k < N; k++) mundoBairro(montarMapa(D));
const t1 = performance.now();
const media = (t1 - t0) / N;
console.log(`mundoBairro(montarMapa): ${media.toFixed(2)} ms (V8, JIT quente) · ×4 CPU ≈ ${(media * 4).toFixed(1)} ms ${media * 4 <= 30 ? "— dentro dos 30 ms, não precisa de idle" : "— ACIMA dos 30 ms: mover para requestIdleCallback"}`);
process.exit(media * 4 > 30 ? 1 : 0);
