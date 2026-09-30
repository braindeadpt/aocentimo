// Monta o protótipo do Bairro com os números reais do repositório.
const fs = require("fs"), path = require("path");
const R = path.resolve(__dirname, "../../..").split(path.sep).join("/") + "/"; // raiz do repo
const L = (p) => JSON.parse(fs.readFileSync(R + p, "utf8"));
const ult = (p) => { const j = L(p); return { v: j.series.at(-1).v, t: j.series.at(-1).t, meta: j.meta }; };
const at = (s, t) => s.find((p) => p.t === t).v;
const MES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const mes = (t) => MES[+t.slice(5, 7) - 1] + " de " + t.slice(0, 4);
const dia = (t) => `${+t.slice(8, 10)} ${MES[+t.slice(5, 7) - 1].slice(0, 3)} ${t.slice(0, 4)}`;

const gas = ult("data/sources/dgeg/pmd-gasoleo-diario.json"), g95 = ult("data/sources/dgeg/pmd-gasolina95-diario.json");
const eur12 = ult("data/sources/bpstat/euribor-12m-mensal.json");
const une = ult("data/sources/eurostat/une-pt-total.json");
const cp00 = L("data/sources/eurostat/hicp-pt-cp00.json").series, cp01 = L("data/sources/eurostat/hicp-pt-cp01.json").series, cp11 = L("data/sources/eurostat/hicp-pt-cp11.json").series;
const T1 = cp00.at(-1).t, T0 = "2020-08", Tano = (+T1.slice(0, 4) - 1) + T1.slice(4);
const ca = L("data/derived/ca-base.json").meta;
const cen = L("data/derived/cenarios-salario.json"); const l = cen.linhas.find((x) => x.bruto === cen.meta.brutoRef);

// moedas proporcionais ao custo total (maior resto, somam sempre 20)
const partes = { ss: l.tsu + l.ss, irs: l.irs, casa: l.liquido }, tot = 20, soma = partes.ss + partes.irs + partes.casa;
const bruto = Object.fromEntries(Object.entries(partes).map(([k, v]) => [k, v / soma * tot]));
const moedas = Object.fromEntries(Object.entries(bruto).map(([k, v]) => [k, Math.floor(v)]));
let falta = tot - Object.values(moedas).reduce((a, b) => a + b, 0);
Object.entries(bruto).sort((a, b) => (b[1] % 1) - (a[1] % 1)).forEach(([k]) => { if (falta-- > 0) moedas[k]++; });
moedas.total = tot;

const DADOS = {
  gasoleo: gas.v, gasolina: g95.v, dataComb: dia(gas.t),
  euribor12: eur12.v, ca: ca.oficialPct, desemprego: une.v, inflacao: +((at(cp00, T1) / at(cp00, Tano) - 1) * 100).toFixed(1),
  cabaz10: +(10 * at(cp01, T1) / at(cp01, T0)).toFixed(2), cabazPct: Math.round((at(cp01, T1) / at(cp01, T0) - 1) * 100), cafesPct: Math.round((at(cp11, T1) / at(cp11, T0) - 1) * 100),
  euriborSerie: L("data/sources/bpstat/euribor-12m-mensal.json").series.filter((p) => p.t >= "2019-01").map((p) => ({ t: p.t, v: p.v })),
  irs: (() => { const r = L("data/fiscal/irs-2026.json"), ss = L("data/fiscal/ss.json"); return { ano: r.ano, escaloes: r.escaloes.map((e) => ({ ate: e.ate, taxa: e.taxa })), dedEsp: r.deducaoEspecificaFixa, despesasGerais: r.despesasGeraisPorTitular, ssTaxa: ss.trabalhador.taxa, fonte: r.fonte, motorIrsAnual: l.ano14.irsAnual }; })(),
  sal: { bruto: l.bruto, custo: l.custo, tsu: l.tsu, ss: l.ss, irs: l.irs, liq: l.liquido, fica: l.pontos.fica, moedas },
  fontes: {
    financas: `IRS — escalões de 2026 (art. 68.º do CIRS, Orçamento do Estado para 2026) · solteiro, sem dependentes, rendimentos de trabalho por conta de outrem`,
    bancoCena: `Banco de Portugal (BPstat) · Euribor a 12 meses, média mensal, jan 2019 → ${mes(eur12.t)} · prestação pelo método francês (motor do AO CÊNTIMO)`,
    fabrica: `Motores AO CÊNTIMO · regras ${cen.meta.ano} · ${cen.meta.perfil}`,
    mercearia: `Eurostat · IHPC Portugal, alimentação e bebidas não alcoólicas · ${mes(T0)} → ${mes(T1)}`,
    bomba: `DGEG · preço médio de venda ao público · ${dia(gas.t)}`,
    banco: `Banco de Portugal (BPstat) · Euribor a 12 meses, média de ${mes(eur12.t)}`,
    correios: `IGCP · Certificados de Aforro série F, taxa base em vigor desde ${ca.vigenciaOficial}`,
    quiosque: `Eurostat · inflação homóloga de ${mes(T1)}; desemprego de ${mes(une.t)}`,
  },
};
DADOS.notas = [
  `combustíveis — DGEG, ${dia(gas.t)}`, `Euribor 12M — BPstat, ${mes(eur12.t)}`, `Certificados de Aforro — IGCP, taxa base ${String(ca.oficialPct).replace(".", ",")} %`,
  `inflação e cabaz — Eurostat IHPC, ${mes(T1)}`, `desemprego — Eurostat, ${mes(une.t)}`, `salário — motores AO CÊNTIMO, ${cen.meta.brutoRef} € brutos, regras ${cen.meta.ano}`,
].join(" · ") + ". Os preços do bairro atualizam-se sozinhos todos os dias no site.";

// o logótipo vive em referencias/ (fora do git); sem ele, fica o nome em texto
const logoSvg = fs.existsSync(R + "referencias/V4/logo/aocentimo-claro.svg") ? fs.readFileSync(R + "referencias/V4/logo/aocentimo-claro.svg", "utf8") : `<svg viewBox="0 0 190 28"><text x="0" y="22" font-family="Archivo" font-weight="900" font-size="24">AO CÊNTIMO</text></svg>`;
const logo = logoSvg.replace("<svg ", '<svg class="logo" ').replace(/fill="#1f6b4d"/, 'fill="#0c8f5c"');
let h = fs.readFileSync(path.join(__dirname, "mapa.tpl.html"), "utf8");
h = h.replace("__DADOS__", () => JSON.stringify(DADOS)).replace("__LOGO__", () => logo)
  .replace("__ISO__", () => fs.readFileSync(path.join(__dirname, "iso.js"), "utf8"))
  .replace("__MAPA__", () => fs.readFileSync(path.join(__dirname, "mapa.js"), "utf8"))
  .replace("__FINANCAS__", () => fs.readFileSync(path.join(__dirname, "cena-financas.js"), "utf8"))
  .replace("__BANCO__", () => fs.readFileSync(path.join(__dirname, "cena-banco.js"), "utf8"))
  .replace("__PERSONAGENS__", () => fs.readFileSync(path.join(__dirname, "personagens.js"), "utf8"));
const resto = h.match(/__[A-Z]+__/g); if (resto) throw new Error("por substituir: " + resto);
fs.writeFileSync(path.join(__dirname, "mapa.html"), h);
console.log("mapa.html", (h.length / 1024).toFixed(1), "KB · moedas", JSON.stringify(moedas), "· inflação", DADOS.inflacao, "cabaz", DADOS.cabaz10);
