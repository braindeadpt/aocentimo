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
  mais: (() => {
    const ss = L("data/fiscal/ss.json"), cb = L("data/fiscal/catb.json"), irs = L("data/fiscal/irs-2026.json"), smn = L("data/fiscal/smn.json"), iva = L("data/fiscal/iva.json");
    const eu = (f, desde = "2019-01") => L("data/sources/eurostat/" + f + ".json").series.filter((p) => p.t >= desde).map((p) => ({ t: p.t, v: p.v }));
    const ult = (f) => { const j = L("data/sources/eurostat/" + f + ".json"); return j.series.at(-1); };
    const cs = L("data/derived/casa-em-salarios.json"), hpi = L("data/sources/eurostat/hpi-pt.json");
    return {
      ss: { trab: ss.trabalhador.taxa, emp: ss.entidadePatronal.taxa, fonte: ss.fonte, catb: { taxa: cb.segurancaSocial.taxa, rr: cb.segurancaSocial.rendimentoRelevante, baseMinIas: cb.segurancaSocial.baseMinimaIas, isencao: cb.segurancaSocial.isencaoPrimeirosMeses, fonte: cb.fonte }, ias: irs.ias },
      casa: { razao: cs.series.filter((p) => p.t >= "2015-Q1"), hpi: hpi.series.filter((p) => p.t >= "2015-Q1").map((p) => ({ t: p.t, v: p.v })), nota: cs.meta.formula, ate: cs.meta.rotuloAte },
      past: { cp11: eu("hicp-pt-cp11"), ivaRest: iva.taxas.find((t) => t.exemplos.includes("restauração")).taxa },
      quiosque: { une: eu("une-pt-total"), jov: eu("une-pt-jovem"), ue: eu("une-ue27-total"), pib: ult("pib-pt-homologo"), conf: ult("confianca-pt"), smn: smn.regioes.continente, smnSerie: smn.serie },
    };
  })(),
  comb: (() => {
    const isp = L("data/fiscal/isp.json"), iva = L("data/fiscal/iva.json").taxas.find((t) => t.nome === "Normal").taxa;
    const semanal = (f) => L("data/sources/dgeg/" + f + ".json").series.filter((p, k, arr) => k % 7 === 0 || k === arr.length - 1).map((p) => ({ t: p.t, v: p.v }));
    return { iva, ispVigencia: isp.vigencia, ispNota: isp.nota, ispFonte: isp.fonte,
      gasolina: { nome: "Gasolina 95", preco: g95.v, data: g95.t, isp: isp.gasolina95.ispELitro, carbono: isp.gasolina95.carbonoELitro, notaIsp: isp.gasolina95.nota, serie: semanal("pmd-gasolina95-diario") },
      gasoleo: { nome: "Gasóleo", preco: gas.v, data: gas.t, isp: isp.gasoleo.ispELitro, carbono: isp.gasoleo.carbonoELitro, notaIsp: isp.gasoleo.nota, serie: semanal("pmd-gasoleo-diario") } };
  })(),
  aforro: (() => { const c = L("data/fiscal/ca.json"), k = L("data/fiscal/capitais.json"); return { taxa: c.serieF.taxaBrutaNovasSubscricoes, vigencia: c.vigencia, taxaNota: c.serieF.taxaNota, premios: c.serieF.premiosPermanencia.map((p) => ({ de: p.de, ate: p.ate, pp: p.pp })), imposto: k.retencaoLiberatoria.taxa, garantia: c.serieF.garantia }; })(),
  merc: (() => {
    const ser = (c) => L("data/sources/eurostat/hicp-pt-cp" + c + ".json").series.filter((p) => p.t >= "2019-01").map((p) => ({ t: p.t, v: p.v }));
    const itens = [["0111", "pao", "Cereais e derivados", "pão, arroz, massa"], ["0112", "carne", "Carne", ""], ["0113", "peixe", "Peixe e marisco", ""], ["0114", "leite", "Leite, laticínios e ovos", ""],
      ["0115", "azeite", "Óleos e gorduras", "azeite, manteiga"], ["0116", "fruta", "Fruta", ""], ["0117", "legumes", "Legumes e batatas", ""], ["0118", "acucar", "Açúcar e doces", ""]];
    const iva = L("data/fiscal/iva.json");
    return { T0, T1, itens: itens.map(([c, id, nome, ex]) => ({ c, id, nome, ex, serie: ser(c) })), total: ser("00"), comida: ser("01"), iva: { taxas: iva.taxas, fonte: iva.fonte, regiao: iva.regiao } };
  })(),
  euriborSerie: L("data/sources/bpstat/euribor-12m-mensal.json").series.filter((p) => p.t >= "2019-01").map((p) => ({ t: p.t, v: p.v })),
  irs: (() => { const r = L("data/fiscal/irs-2026.json"), ss = L("data/fiscal/ss.json"); return { ano: r.ano, escaloes: r.escaloes.map((e) => ({ ate: e.ate, taxa: e.taxa })), dedEsp: r.deducaoEspecificaFixa, despesasGerais: r.despesasGeraisPorTitular, ssTaxa: ss.trabalhador.taxa, fonte: r.fonte, motorIrsAnual: l.ano14.irsAnual }; })(),
  sal: { bruto: l.bruto, custo: l.custo, tsu: l.tsu, ss: l.ss, irs: l.irs, liq: l.liquido, fica: l.pontos.fica, moedas },
  fontes: {
    financas: `IRS — escalões de 2026 (art. 68.º do CIRS, Orçamento do Estado para 2026) · solteiro, sem dependentes, rendimentos de trabalho por conta de outrem`,
    bancoCena: `Banco de Portugal (BPstat) · Euribor a 12 meses, média mensal, jan 2019 → ${mes(eur12.t)} · prestação pelo método francês (motor do AO CÊNTIMO)`,
    mercCena: `Eurostat · índice harmonizado de preços no consumidor, Portugal, por produto (ECOICOP 01.1.1 a 01.1.8) · ${mes(T0)} → ${mes(T1)}`,
    ivaCena: `Código do IVA — Listas I e II anexas e art. 18.º · taxas do continente em vigor em 2026`,
    aforroCena: `IGCP · Certificados de Aforro série F, taxa em vigor desde ${ca.vigenciaOficial} e prémios de permanência · retenção de 28 % (art. 71.º do CIRS) · inflação: Eurostat, índice harmonizado de preços, Portugal`,
    combCena: `DGEG · preço médio de venda ao público, média nacional diária (${dia(gas.t)}) · ISP e taxa de carbono: data/fiscal/isp.json (portaria em vigor desde ${L("data/fiscal/isp.json").vigencia}) · IVA: Código do IVA, taxa normal`,
    ssCena: `Código dos Regimes Contributivos (11 % e 23,75 %); recibos verdes: art. 168.º do Código Contributivo (21,4 % sobre 70 % do faturado) · salário da Inês: motores AO CÊNTIMO, regras de ${cen.meta.ano}`,
    casaCena: `Eurostat · índice de preços da habitação ÷ índice de custo do trabalho, Portugal, 2015 = 100 · até ${L("data/derived/casa-em-salarios.json").meta.rotuloAte}`,
    pastCena: `Eurostat · índice harmonizado de preços, Portugal: restaurantes e alojamento (ECOICOP 11) e alimentação (01) · ${mes(T0)} → ${mes(T1)} · IVA: Código do IVA`,
    quiosqueCena: `Eurostat · desemprego (une_rt_m, dessazonalizado), PIB (variação homóloga), confiança dos consumidores · salário mínimo: DL 139/2025`,
    escolaCena: `Eurostat · índice harmonizado de preços, Portugal (total e alimentação)`,
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
  .replace("__MERC__", () => fs.readFileSync(path.join(__dirname, "cena-mercearia.js"), "utf8"))
  .replace("__CORREIOS__", () => fs.readFileSync(path.join(__dirname, "cena-correios.js"), "utf8"))
  .replace("__BOMBA__", () => fs.readFileSync(path.join(__dirname, "cena-bomba.js"), "utf8"))
  .replace("__BASE__", () => fs.readFileSync(path.join(__dirname, "cena-base.js"), "utf8"))
  .replace("__BAIRRO__", () => fs.readFileSync(path.join(__dirname, "cenas-bairro.js"), "utf8"))
  .replace("__PERSONAGENS__", () => fs.readFileSync(path.join(__dirname, "personagens.js"), "utf8"));
const resto = h.match(/__[A-Z]+__/g); if (resto) throw new Error("por substituir: " + resto);
fs.writeFileSync(path.join(__dirname, "mapa.html"), h);
console.log("mapa.html", (h.length / 1024).toFixed(1), "KB · moedas", JSON.stringify(moedas), "· inflação", DADOS.inflacao, "cabaz", DADOS.cabaz10);
