/**
 * Os dados das cenas P2c (PACK V5 PRODUÇÃO §P2c) — Casa da Inês,
 * Pastelaria, Quiosque e Escola.
 *
 * Regra nº1, como em `dados.ts`: nenhum número sai daqui sem vir de
 * `data/`. Nada se formata no servidor para estas cenas (o cliente
 * chama `format.ts`); só se escolhem pontos, se derivam os índices que
 * o protótipo derivava e se escreve a fonte com a data real.
 *
 * Série compacta (`SerieCena`) para as mensais; a razão da Casa é
 * TRIMESTRAL (`AAAA-Qn`), por isso viaja como `Ponto[]` — o cliente não
 * a reconstrói por `pontosDaSerie`.
 *
 * Este módulo corre SÓ no servidor — nenhum componente cliente o
 * importa (AGENTS.md).
 */
import { loadDerivado, loadFonte, loadSerie } from "@/lib/data";
import { termoPorSlug } from "@/content/glossario";
import { fmtPeriodo } from "@/lib/format";
import smnJson from "@data/fiscal/smn.json";
import ivaJson from "@data/fiscal/iva.json";
import type { Ponto, SerieCena } from "./dados";
import { T0_MERC } from "./dados";

const INICIO = "2019-01";

/** A série mensal compacta desde 2019-01, como em `dados.ts`. */
function serieDesde(codigo: string, inicio = INICIO): SerieCena {
  const s = loadSerie(codigo);
  return {
    inicio,
    v: (s?.series ?? []).filter((p) => p.t >= inicio).map((p) => p.v),
  };
}



/* ————— Casa da Inês: os meses de trabalho ————— */

const DESDE_CASA = "2015-Q1";

interface CasaDerivado {
  meta: { fonte: string; rotuloAte?: string; serieAte?: string };
  series: Ponto[];
}

export interface DadosCasa {
  /** hpi ÷ lci reindexado a 2015=100 — o número de «meses de trabalho». */
  razao: Ponto[];
  /** O índice de preços da habitação (2015=100), mesmo filtro. */
  hpi: Ponto[];
  /** O custo do trabalho derivado: hpi ÷ razão × 100 (a conta do protótipo). */
  lci: Ponto[];
  /** A resposta da cena — o último ponto da razão, arredondado. */
  meses: number | null;
  /** O último período («2026-Q1», a cena formata com trimestre()). */
  ate: string | null;
  fonte: string;
}

export function dadosCasaP2c(): DadosCasa {
  const der = loadDerivado<CasaDerivado>("casa-em-salarios");
  const hpi = loadFonte("eurostat", "hpi-pt");
  const razao = (der?.series ?? []).filter((p) => p.t >= DESDE_CASA);
  const h = (hpi?.series ?? []).filter((p) => p.t >= DESDE_CASA);
  // lci = hpi ÷ razão × 100 — a mesma conta que o protótipo fazia ao
  // ligar o hpi à razão por período (e não por índice do array)
  const porT = new Map(razao.map((p) => [p.t, p.v]));
  const lci = h
    .map((p) => {
      const r = porT.get(p.t);
      return r ? { t: p.t, v: (p.v * 100) / r } : null;
    })
    .filter((p): p is Ponto => p !== null);
  const ult = razao.at(-1);
  return {
    razao,
    hpi: h.filter((p) => porT.has(p.t)),
    lci,
    meses: ult ? Math.round(ult.v) : null,
    ate: der?.meta.rotuloAte ?? der?.meta.serieAte ?? ult?.t ?? null,
    fonte: `Eurostat · índice de preços da habitação ÷ custo do trabalho (B-S), 2015 = 100 · último dado ${ult ? fmtPeriodo(ult.t) : "—"}`,
  };
}

/* ————— Pastelaria: comer fora contra comer em casa ————— */

export interface DadosPastelaria {
  /** IHPC CP11 (restauração e alojamento) desde 2019 — «comer fora». */
  fora: SerieCena;
  /** IHPC CP01 (alimentação) desde 2019 — «comer em casa». */
  comida: SerieCena;
  /** O índice comum dos exemplos — o T0 da Mercearia (ago 2020). */
  t0: string;
  /** A subida acumulada da série fora desde T0 (último ÷ ago 2020 − 1). */
  subidaFora: number | null;
  /** IVA da restauração (intermédia) e da mercearia (reduzida), de iva.json. */
  ivaCafe: number | null;
  ivaMercearia: number | null;
  /** O último período das séries («2026-08», a cena formata). */
  ate: string | null;
  /** O exemplo marcado como exemplo — 2 € de café+pastel em T0. */
  base: number;
  fonte: string;
  fonteIva: string;
}

export function dadosPastelariaP2c(): DadosPastelaria {
  const cp11 = loadSerie("cp11");
  const cp01 = loadSerie("cp01");
  const iva = ivaJson as {
    taxas: { nome: string; taxa: number; exemplos?: string[] }[];
    regiao: string;
  };
  // a subida desde T0 (ago 2020) — o `razaoIdx(cp11)` do protótipo. Antes
  // media-se desde jan 2019 e a cena dizia «desde agosto de 2020».
  const s = cp11?.series ?? [];
  const v0 = s.find((p) => p.t === T0_MERC)?.v;
  const subida = v0 && s.length ? s.at(-1)!.v / v0 - 1 : null;
  // o café entra na taxa que diz «restauração» nos exemplos — nunca
  // numa taxa escrita à mão (regra nº1 + a regra do IVA em data/fiscal)
  const taxaDe = (re: RegExp) =>
    iva.taxas.find((t) => (t.exemplos ?? []).some((e) => re.test(e)))?.taxa ??
    null;
  return {
    fora: serieDesde("cp11"),
    comida: serieDesde("cp01"),
    t0: T0_MERC,
    subidaFora: subida,
    ivaCafe: taxaDe(/restaura/i),
    ivaMercearia: taxaDe(/^pão$|mercearia|leite/i) ?? iva.taxas.find((t) => t.nome === "Reduzida")?.taxa ?? null,
    ate: cp11?.meta.serieAte ?? cp01?.meta.serieAte ?? null,
    base: 2,
    fonte: `Eurostat · IHPC Portugal — restaurantes e alojamento (CP11) e alimentação (CP01), jan 2019 → ${cp11 ? fmtPeriodo(cp11.meta.serieAte) : "—"}`,
    fonteIva: `Código do IVA — Listas I e II anexas e art. 18.º · taxas do continente em vigor`,
  };
}

/* ————— Quiosque: o Jornal do Bairro ————— */

export interface DadosQuiosque {
  desemprego: {
    /** As três séries desde 2019 para o gráfico. */
    pt: SerieCena;
    jovens: SerieCena;
    ue: SerieCena;
    /** Os últimos pontos, com a data de cada um (podem divergir). */
    ultPt: Ponto | null;
    ultJovens: Ponto | null;
    ultUe: Ponto | null;
  };
  /** PIB homólogo — último trimestre publicado. */
  pib: Ponto | null;
  /** Confiança dos consumidores — último mês. */
  confianca: Ponto | null;
  /** O salário mínimo do continente em vigor, e o de 2015. */
  smn: number | null;
  smn0: { ano: number; valor: number } | null;
  /** A inflação homóloga (cp00 a 12 meses), com o mês. */
  inflacao: { v: number; t: string } | null;
  fonte: string;
}

export function dadosQuiosqueP2c(): DadosQuiosque {
  const smn = smnJson as {
    regioes: { continente: number };
    serie: { ano: number; valor: number }[];
    fonte: string;
  };
  const cp00 = loadSerie("cp00");
  const s = cp00?.series ?? [];
  const inflacao =
    s.length > 12 && s[s.length - 13].v !== 0
      ? { v: s.at(-1)!.v / s[s.length - 13].v - 1, t: s.at(-1)!.t }
      : null;
  const pib = loadFonte("eurostat", "pib-pt-homologo");
  const conf = loadFonte("eurostat", "confianca-pt");
  const une = loadFonte("eurostat", "une-pt-total");
  return {
    desemprego: {
      pt: {
        inicio: INICIO,
        v: (une?.series ?? []).filter((p) => p.t >= INICIO).map((p) => p.v),
      },
      jovens: {
        inicio: INICIO,
        v: (loadFonte("eurostat", "une-pt-jovem")?.series ?? [])
          .filter((p) => p.t >= INICIO)
          .map((p) => p.v),
      },
      ue: {
        inicio: INICIO,
        v: (loadFonte("eurostat", "une-ue27-total")?.series ?? [])
          .filter((p) => p.t >= INICIO)
          .map((p) => p.v),
      },
      ultPt: une?.series.at(-1) ?? null,
      ultJovens: loadFonte("eurostat", "une-pt-jovem")?.series.at(-1) ?? null,
      ultUe: loadFonte("eurostat", "une-ue27-total")?.series.at(-1) ?? null,
    },
    pib: pib?.series.at(-1) ?? null,
    confianca: conf?.series.at(-1) ?? null,
    smn: smn.regioes?.continente ?? null,
    smn0: smn.serie[0]
      ? { ano: smn.serie[0].ano, valor: smn.serie[0].valor }
      : null,
    inflacao,
    fonte: `Eurostat · desemprego (une_rt_m), PIB e confiança; INE/DR · salário mínimo em vigor desde ${smnJson.vigencia ? fmtPeriodo(String(smnJson.vigencia).slice(0, 7)) : "—"}`,
  };
}

/* ————— Escola: os minis e as palavras ————— */

export interface DadosEscola {
  /** Os últimos 13 meses de cp01 — os dois minis do mesmo jogo. */
  comida: SerieCena;
  /** cp00 desde 2019 — a série da segunda lição (em cadeia vs homóloga). */
  total: SerieCena;
  /** A subida dos minis (último ÷ primeiro − 1). */
  subidaComida: number | null;
  /** A variação homóloga do cp00 no último ponto. */
  varHomologa: number | null;
  /** Os termos do glossário real que a terceira lição liga às cenas. */
  gloss: { slug: string; termo: string; def: string }[];
  fonte: string;
}

export function dadosEscolaP2c(): DadosEscola {
  const cp01 = loadSerie("cp01");
  const cp00 = loadSerie("cp00");
  const ultimos13 = (cp01?.series ?? []).slice(-13);
  const subida =
    ultimos13.length >= 2 && ultimos13[0].v !== 0
      ? ultimos13.at(-1)!.v / ultimos13[0].v - 1
      : null;
  const s = cp00?.series ?? [];
  const hom =
    s.length > 12 && s[s.length - 13].v !== 0
      ? s.at(-1)!.v / s[s.length - 13].v - 1
      : null;
  // o índice dos últimos 13 meses viaja compacto: `inicio` é o t do
  // primeiro deles. Os termos são os do glossário REAL do site — a
  // Escola nunca inventa uma definição (regra nº1 aplica-se ao texto)
  const gloss = ["ipc-ihpc", "taxa-real", "escalao-irs", "spread", "tsu"]
    .map((slug) => termoPorSlug(slug))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .map((t) => ({ slug: t.slug, termo: t.termo, def: t.definicao }));
  return {
    comida: {
      inicio: ultimos13[0]?.t ?? INICIO,
      v: ultimos13.map((p) => p.v),
    },
    total: serieDesde("cp00"),
    subidaComida: subida,
    varHomologa: hom,
    gloss,
    fonte: `Eurostat · IHPC Portugal — alimentação (CP01) e total (CP00) · último dado ${cp00 ? fmtPeriodo(cp00.meta.serieAte) : "—"}`,
  };
}
