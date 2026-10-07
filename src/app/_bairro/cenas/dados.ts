/**
 * Os dados das cenas (P2a do PACK V5 PRODUÇÃO, §2.3) — a porta de
 * `montar.cjs` para o que as quatro primeiras cenas pedem.
 *
 * REGRA Nº1, a regra de `../dados.ts`: nenhum número sai daqui sem vir de
 * `data/`. A diferença para os marcadores é que as cenas precisam dos
 * NÚMEROS crus — a Inês arrasta um slider e a conta refaz-se no browser —
 * por isso aqui não se formata nada: `format.ts` corre no cliente, dentro
 * da cena.
 *
 * As séries viajam COMPACTAS (`{ inicio, v }` — só os valores, o mês
 * reconstrói-se no cliente): é a mesma razão pela que as `coordenadas`
 * da câmara viajam por tabela. Uma cena a entrar no flight com séries
 * verbosas era o peso do mapa a voltar pela janela do lado.
 *
 * Este módulo corre SÓ fora do browser: o `scripts/derive/cenas.ts`
 * chama-o e grava o resultado em `public/cenas/<id>.json` — o cliente
 * faz `fetch` desse ficheiro ao abrir a cena (P4 — antes viajava todo
 * numa prop do `<Bairro>` e a home pagava-o sem abrir nada). Os JSON
 * de `data/` nunca entram no cliente — AGENTS.md.
 */
import { loadFonte, loadSerie } from "@/lib/data";
import cenariosJson from "@data/derived/cenarios-salario.json";
import irsJson from "@data/fiscal/irs-2026.json";
import ivaJson from "@data/fiscal/iva.json";
import ssJson from "@data/fiscal/ss.json";
import { P0 } from "@/lib/bairro/iso";
import { dadosBomba, dadosCorreios, dadosSegSocial } from "./dados-p2b";
import type { DadosBomba, DadosCorreios, DadosSegSocial } from "./dados-p2b";
import {
  dadosCasaP2c,
  dadosEscolaP2c,
  dadosPastelariaP2c,
  dadosQuiosqueP2c,
  type DadosCasa,
  type DadosEscola,
  type DadosPastelaria,
  type DadosQuiosque,
} from "./dados-p2c";

/** Um ponto de uma série temporal (o `t` é `AAAA-MM`). */
export interface Ponto {
  t: string;
  v: number;
}

/**
 * Uma série compacta: `v[k]` é o valor do mês `inicio + k`. O cliente
 * reconstrói os `t` com `pontosDaSerie()` (ver `cenas/utils.ts`).
 */
export interface SerieCena {
  /** O mês do 1.º valor, `AAAA-MM`. */
  inicio: string;
  /** Os valores, um por mês. */
  v: number[];
}

const INICIO = "2019-01";

/**
 * O T0 das mercearias: o protótipo contava a história «o saco que custava
 * 10 € em agosto de 2020» — é agosto de 2020 e não é negociável, porque
 * as etiquetas das prateleiras e o palpite do saco dependem dele. O T1 é
 * o último ponto que existir.
 */
export const T0_MERC = "2020-08";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
/** «2020-08» → «agosto de 2020» (o `mes()` do montar.cjs da maquete). */
export const mesExtenso = (t: string | null | undefined): string =>
  t && /^\d{4}-\d{2}/.test(t) ? `${MESES[+t.slice(5, 7) - 1]} de ${t.slice(0, 4)}` : "—";

function serie(codigo: string): SerieCena {
  const s = loadSerie(codigo);
  return {
    inicio: INICIO,
    v: (s?.series ?? []).filter((p) => p.t >= INICIO).map((p) => p.v),
  };
}

/* ————— Finanças: o IRS em gavetas ————— */

/** Um escalão do IRS tal como a cena desenha: de, até, taxa. */
export interface Escalao {
  /** Onde o escalão começa (o `ate` do anterior). O 1.º começa em 0. */
  de: number;
  /** Onde acaba, ou `null` se não tem fim (o último). */
  ate: number | null;
  taxa: number;
}

export interface DadosFinancas {
  ano: number;
  escaloes: Escalao[];
  /** A dedução específica do ano (o que desce antes das gavetas). */
  dedEsp: number;
  /** A taxa da Segurança Social do trabalhador (11 %), para o aumento. */
  ssTaxa: number;
  /** O IRS anual completo do motor, para a nota de rodapé da cena.
      `null` quando a linha de referência falta — a nota diz «—», nunca
      0 € inventado (regra nº1). */
  motorIrsAnual: number | null;
  fonte: string;
}

export function dadosFinancas(): DadosFinancas {
  const r = irsJson as {
    ano: number;
    deducaoEspecificaFixa: number;
    escaloes: { ate: number | null; taxa: number }[];
  };
  const s = ssJson as { trabalhador: { taxa: number } };
  // O IRS anual COMPLETO que o site calcula para a Inês — o número vem
  // pronto de data/derived/cenarios-salario.json (gerado pelo motor
  // fiscal real, `simularSalario`). A cena escreve-o na nota de rodapé:
  // «calculado só pelos escalões; no simulador, com as deduções, é X».
  // Nenhuma reconta aqui: reescrever o motor era o que o PACK proíbe.
  const cen = cenariosJson as {
    meta: { brutoRef: number };
    linhas: { bruto: number; ano14: { irsAnual: number } }[];
  };
  const linha = cen.linhas.find((l) => l.bruto === cen.meta.brutoRef);
  return {
    ano: r.ano,
    escaloes: r.escaloes.map((e, k) => ({
      // um `ate` que falta a meio da tabela não é um 0: é NaN, e daí
      // para a frente todos os formatadores mostram «—»
      de: k === 0 ? 0 : (r.escaloes[k - 1].ate ?? NaN),
      ate: e.ate ?? null,
      taxa: e.taxa,
    })),
    dedEsp: r.deducaoEspecificaFixa,
    ssTaxa: s.trabalhador.taxa,
    motorIrsAnual: linha?.ano14.irsAnual ?? null,
    fonte: `IRS — escalões de ${r.ano} (art. 68.º do CIRS, Orçamento do Estado) · solteiro, sem dependentes, trabalho por conta de outrem`,
  };
}

/* ————— Banco: a Euribor que mexe no quadro ————— */

export interface DadosBanco {
  /** A Euribor 12M mensal desde 2019-01 — a série do quadro de letras. */
  serie: SerieCena;
  fonte: string;
}

export function dadosBanco(): DadosBanco {
  const e = loadFonte("bpstat", "euribor-12m-mensal");
  const pontos = (e?.series ?? []).filter((p) => p.t >= INICIO).map((p) => p.v);
  const ultimo = e?.series[e.series.length - 1];
  const mes = mesExtenso(ultimo?.t);
  return {
    serie: { inicio: INICIO, v: pontos },
    fonte: `Banco de Portugal (BPstat) · Euribor a 12 meses, média mensal, jan 2019 → ${mes} · prestação pelo método francês (motor do AO CÊNTIMO)`,
  };
}

/* ————— Mercearia: os índices ECOICOP e o IVA ————— */

/** Uma família ECOICOP com a sua série compacta. */
export interface ItemMerc {
  /** O código ECOICOP (0111–0118), para a fonte. */
  c: string;
  /** O id do produto desenhado (pao, carne…). */
  id: string;
  nome: string;
  /** O exemplo que desambígua a família, quando faz falta. */
  ex: string;
  serie: SerieCena;
}

export interface DadosMercearia {
  t0: string;
  itens: ItemMerc[];
  /** O total (ECOICOP 00) e a alimentação (01). */
  total: SerieCena;
  comida: SerieCena;
  iva: {
    taxas: { nome: string; taxa: number }[];
    regiao: string;
  };
  fonte: string;
  fonteIva: string;
}

const FAMILIAS: [string, string, string, string][] = [
  ["0111", "pao", "Cereais e derivados", "pão, arroz, massa"],
  ["0112", "carne", "Carne", ""],
  ["0113", "peixe", "Peixe e marisco", ""],
  ["0114", "leite", "Leite, laticínios e ovos", ""],
  ["0115", "azeite", "Óleos e gorduras", "azeite, manteiga"],
  ["0116", "fruta", "Fruta", ""],
  ["0117", "legumes", "Legumes e batatas", ""],
  ["0118", "acucar", "Açúcar e doces", ""],
];

export function dadosMercearia(): DadosMercearia {
  const iva = ivaJson as { taxas: { nome: string; taxa: number }[]; regiao: string; vigencia?: string };
  const cp00 = loadSerie("cp00");
  const t1 = cp00?.series[cp00.series.length - 1]?.t ?? "—";
  return {
    t0: T0_MERC,
    itens: FAMILIAS.map(([c, id, nome, ex]) => ({
      c,
      id,
      nome,
      ex,
      serie: serie(`cp${c}`),
    })),
    total: serie("cp00"),
    comida: serie("cp01"),
    iva: { taxas: iva.taxas, regiao: iva.regiao },
    fonte: `Eurostat · índice harmonizado de preços no consumidor, Portugal, por produto (ECOICOP 01.1.1 a 01.1.8) · ${T0_MERC} → ${t1}`,
    fonteIva: `Código do IVA — Listas I e II anexas e art. 18.º · taxas do continente em vigor`,
  };
}

/* ————— Fábrica: a corrida do salário pelo mapa ————— */

/** Um ponto da rota das moedas, JÁ EM PÍXEIS do mundo (o `P0(i, j)`). */
export interface PontoRota {
  i: number;
  j: number;
  x: number;
  y: number;
}

export interface DadosFabrica {
  /** A linha do salário de referência (números crus, o cliente formata). */
  linha: {
    bruto: number;
    custo: number;
    tsu: number;
    ss: number;
    irs: number;
    liquido: number;
    fica: number;
    ano: number;
  } | null;
  /** Quantas moedas por destino (a regra de Hamilton de `moedasDaLinha`). */
  moedas: { ss: number; irs: number; casa: number } | null;
  /** As rotas projetadas: fábrica → SS, → Finanças, → Casa, em píxeis. */
  rotas: { ss: PontoRota[]; irs: PontoRota[]; casa: PontoRota[] } | null;
  fonte: string;
}

export function dadosFabrica(): DadosFabrica {
  const cen = cenariosJson as {
    meta: { brutoRef: number; ano: number };
    linhas: {
      bruto: number;
      custo: number;
      tsu: number;
      ss: number;
      irs: number;
      liquido: number;
      centimos: { fica: number };
    }[];
  };
  const l = cen.linhas.find((x) => x.bruto === cen.meta.brutoRef);
  const fonte = `Motores AO CÊNTIMO · regras de ${cen.meta.ano} · solteiro, sem dependentes, continente`;
  if (!l) return { linha: null, moedas: null, rotas: null, fonte };
  return {
    linha: {
      bruto: l.bruto,
      custo: l.custo,
      tsu: l.tsu,
      ss: l.ss,
      irs: l.irs,
      liquido: l.liquido,
      fica: l.centimos.fica,
      ano: cen.meta.ano,
    },
    // 20 moedas proporcionais: o mesmo total do protótipo, repartido
    // pelo maior resto (a regra de Hamilton que a casa usa nos gráficos)
    moedas: moedasProporcionais({ ss: l.tsu + l.ss, irs: l.irs, casa: l.liquido }, 20),
    rotas: rotasDasMoedas(),
    fonte,
  };
}

/** O reparto de `n` moedas por partes proporcionais, maior resto primeiro. */
function moedasProporcionais(partes: Record<string, number>, total: number): { ss: number; irs: number; casa: number } {
  const soma = partes.ss + partes.irs + partes.casa;
  const exato = {
    ss: (partes.ss / soma) * total,
    irs: (partes.irs / soma) * total,
    casa: (partes.casa / soma) * total,
  };
  const base = {
    ss: Math.floor(exato.ss),
    irs: Math.floor(exato.irs),
    casa: Math.floor(exato.casa),
  };
  let falta = total - base.ss - base.irs - base.casa;
  const restos = ([
    ["ss", exato.ss % 1],
    ["irs", exato.irs % 1],
    ["casa", exato.casa % 1],
  ] as [string, number][]).sort((a, b) => b[1] - a[1]);
  const out = base as { ss: number; irs: number; casa: number };
  for (const [k] of restos) {
    if (falta-- <= 0) break;
    out[k as keyof typeof out] += 1;
  }
  return out;
}

/**
 * As rotas das moedas em píxeis do mundo: os `i, j` do protótipo
 * (`PT` + os `R` de `cenaSalario`) projetados por `P0`. Os destinos
 * são os mesmos lados de edifício que o protótipo usava — e o 4.º
 * dígito cá em baixo (a casa da Inês) vem do `PT.casa`.
 */
function rotasDasMoedas(): { ss: PontoRota[]; irs: PontoRota[]; casa: PontoRota[] } | null {
  try {
    // `P0` é puro: a projeção isométrica sem cota. Corre aqui, no
    // servidor, e congela em números — o cliente nunca o importa.
    const rota = (p: [number, number][]) =>
      p.map(([i, j]) => ({ i, j, x: P0(i, j)[0], y: P0(i, j)[1] }));
    return {
      ss: rota([
        [2.14, 3.62],
        [2.14, 4.2],
        [4.58, 4.2],
        [4.58, 3.62],
      ]),
      irs: rota([
        [2.14, 3.62],
        [2.14, 4.2],
        [5.78, 4.2],
        [5.78, 3.62],
      ]),
      casa: rota([
        [2.14, 3.62],
        [2.14, 4.2],
        [7.4, 4.2],
        [7.4, 9.35],
        [4.13, 9.35],
        [4.13, 8.62],
      ]),
    };
  } catch {
    return null;
  }
}

/** As cenas com dados, para o servidor mandar tudo numa prop. */
export interface CenasDados {
  fabrica: DadosFabrica;
  financas: DadosFinancas;
  banco: DadosBanco;
  mercearia: DadosMercearia;
  correios: DadosCorreios;
  bomba: DadosBomba;
  segsocial: DadosSegSocial;
  casa: DadosCasa;
  pastelaria: DadosPastelaria;
  quiosque: DadosQuiosque;
  escola: DadosEscola;
}

export function dadosCenas(): CenasDados {
  return {
    fabrica: dadosFabrica(),
    financas: dadosFinancas(),
    banco: dadosBanco(),
    mercearia: dadosMercearia(),
    correios: dadosCorreios(),
    bomba: dadosBomba(),
    segsocial: dadosSegSocial(),
    casa: dadosCasaP2c(),
    pastelaria: dadosPastelariaP2c(),
    quiosque: dadosQuiosqueP2c(),
    escola: dadosEscolaP2c(),
  };
}
