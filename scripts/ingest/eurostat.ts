import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fetchJson, type ResultadoFonte } from "./_http";

/**
 * Ingest Eurostat — IHPC (prc_hicp_minr, ECOICOP 2018), JSON-stat 2.0.
 * O dataset prc_hicp_midx foi descontinuado pelo Eurostat (última atualização
 * 2026-02); o substituto é prc_hicp_minr, com dimensão "coicop18", índice
 * re-referenciado a 2025=100 (unit=I25) e o agregado total renomeado
 * de CP00 para TOTAL. Gratuito, sem chave. Escreve
 * data/sources/eurostat/hicp-{coicop}.json e atualiza data/meta/sources.json.
 */

const BASE =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

const DATASET = "prc_hicp_minr";
const UNIDADE = "Índice 2025=100";

/** Código usado no pedido à API — CP00 chama-se TOTAL no ECOICOP 2018. */
function apiCoicop(coicop: Coicop): string {
  return coicop === "CP00" ? "TOTAL" : coicop;
}

/**
 * Séries novas do observatório (§1 do PACK-OBSERVATORIO) — filtros
 * verificados ao vivo em 2026-09-20. `sinceTimePeriod=2000` dá histórico
 * completo. Frequência entra no meta para o watchdog de frescura aplicar
 * o SLA certo (mensal 2 meses, trimestral 2 trimestres, semestral 2 semestres).
 */
export interface SerieExtra {
  id: string;
  dataset: string;
  filtros: string;
  unidade: string;
  frequencia: "mensal" | "trimestral" | "semestral";
  /** Dimensões extra que o dataset devolve sempre fixadas a 1 categoria
   *  (além de "freq"). Se vierem com >1 categoria, o parser falha na mesma. */
  dimsFixas?: string[];
}

export const SERIES_EXTRA: SerieExtra[] = [
  {
    id: "une-pt-total",
    dataset: "une_rt_m",
    filtros: "geo=PT&s_adj=SA&age=TOTAL&unit=PC_ACT&sex=T",
    unidade: "percentagem_populacao_activa",
    frequencia: "mensal",
  },
  {
    id: "une-pt-jovem",
    dataset: "une_rt_m",
    filtros: "geo=PT&s_adj=SA&age=Y_LT25&unit=PC_ACT&sex=T",
    unidade: "percentagem_populacao_activa",
    frequencia: "mensal",
  },
  {
    id: "une-ue27-total",
    dataset: "une_rt_m",
    filtros: "geo=EU27_2020&s_adj=SA&age=TOTAL&unit=PC_ACT&sex=T",
    unidade: "percentagem_populacao_activa",
    frequencia: "mensal",
  },
  {
    id: "hpi-pt",
    dataset: "prc_hpi_q",
    filtros: "geo=PT&purchase=TOTAL&unit=I15_Q",
    unidade: "indice_2015_100",
    frequencia: "trimestral",
  },
  {
    id: "pib-pt-homologo",
    dataset: "namq_10_gdp",
    filtros: "geo=PT&na_item=B1GQ&unit=CLV_PCH_SM&s_adj=SCA",
    unidade: "percentagem_variacao_homologa",
    frequencia: "trimestral",
  },
  {
    id: "confianca-pt",
    dataset: "ei_bsco_m",
    filtros: "geo=PT&indic=BS-CSMCI&s_adj=SA&unit=BAL",
    unidade: "saldo_respostas",
    frequencia: "mensal",
  },
  {
    id: "lci-pt-homologo",
    dataset: "ei_lmlc_q",
    filtros: "geo=PT&indic=LM-LCI-TOT&nace_r2=B-S&s_adj=SCA&unit=PCH_SM&p_adj=NV",
    unidade: "percentagem_variacao_homologa",
    frequencia: "trimestral",
  },
  {
    id: "elec-pt-domestico",
    dataset: "nrg_pc_204",
    filtros: "geo=PT&nrg_cons=KWH2500-4999&tax=I_TAX&currency=EUR&unit=KWH",
    unidade: "eur_kwh",
    frequencia: "semestral",
    // verificado 2026-09-20: o dataset devolve siec={"E7000"} (electricidade),
    // sempre uma única categoria — é o único produto de nrg_pc_204.
    dimsFixas: ["siec"],
  },
];

/** "2026-Q1" → "2026-03-31"; "2025-S2" → "2025-12-31"; resto fica igual. */
export function rotuloParaSerieAte(t: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(t);
  if (q) {
    const y = Number(q[1]);
    const mesFim = Number(q[2]) * 3;
    return new Date(Date.UTC(y, mesFim, 0)).toISOString().slice(0, 10);
  }
  const s = /^(\d{4})-S([12])$/.exec(t);
  if (s) {
    const y = Number(s[1]);
    const mesFim = Number(s[2]) * 6;
    return new Date(Date.UTC(y, mesFim, 0)).toISOString().slice(0, 10);
  }
  return t;
}

export const COICOPS = [
  "CP00", // total
  "CP01", "CP0111", "CP0112", "CP0113", "CP0114", "CP0115", "CP0116", "CP0117", "CP0118",
  "CP02", "CP03", "CP04", "CP045", "CP05", "CP06", "CP07", "CP0722",
  "CP08", "CP09", "CP10", "CP11", "CP12",
  "NRG", "FOOD", "TOT_X_NRG_FOOD",
] as const;

export type Coicop = (typeof COICOPS)[number];

const seriesSchema = z.object({
  meta: z.object({
    id: z.string(),
    fonte: z.string(),
    dataset: z.string(),
    url: z.string(),
    unidade: z.string(),
    recolhidoEm: z.string(),
    serieAte: z.string(),
    frequencia: z.string().optional(),
    rotuloAte: z.string().optional(),
  }),
  series: z.array(z.object({ t: z.string(), v: z.number() })),
});

export type SerieGuardada = z.infer<typeof seriesSchema>;

/** JSON-stat 2.0 — estrutura mínima que o parser precisa. */
const jsonStatSchema = z.object({
  id: z.array(z.string()).optional(),
  size: z.array(z.number()).optional(),
  dimension: z.object({
    time: z
      .object({ category: z.object({ index: z.record(z.string(), z.number()) }) })
      .optional(),
  }),
  value: z.union([
    z.array(z.number().nullable()),
    z.record(z.string(), z.number().nullable()),
  ]),
});

type JsonStat = z.infer<typeof jsonStatSchema>;

/** JSON-stat 2.0 (só a dimensão temporal varia) → [{t, v}] ordenado. */
export function parseJsonStat(json: JsonStat): { t: string; v: number }[] {
  const index = json.dimension?.time?.category?.index;
  if (!index) throw new Error("JSON-stat sem dimensão temporal");

  // guarda: as outras dimensões têm de estar fixadas (size 1) pelo pedido
  const timeIdx = json.id?.indexOf("time") ?? -1;
  if (json.id && json.size && timeIdx >= 0) {
    const outros = json.size.filter((_, i) => i !== timeIdx);
    if (outros.some((s) => s !== 1)) {
      throw new Error("JSON-stat multidimensional — falta filtrar dimensões no pedido");
    }
  }

  const ordered = Object.entries(index).sort((a, b) => a[1] - b[1]);
  const values = json.value;
  return ordered
    .map(([t, idx]) => {
      const v = Array.isArray(values) ? values[idx] : values[String(idx)];
      return v === null || v === undefined ? null : { t, v };
    })
    .filter((p): p is { t: string; v: number } => p !== null);
}

export async function fetchCoicop(coicop: Coicop): Promise<SerieGuardada> {
  const url = `${BASE}/${DATASET}?format=JSON&geo=PT&coicop18=${apiCoicop(coicop)}&unit=I25`;
  const json = jsonStatSchema.parse(await fetchJson(url));
  const series = parseJsonStat(json);
  if (series.length === 0) throw new Error(`Eurostat ${coicop}: série vazia`);

  const doc: SerieGuardada = {
    meta: {
      id: `hicp-pt-${coicop.toLowerCase()}`,
      fonte: "Eurostat",
      dataset: DATASET,
      url,
      unidade: UNIDADE,
      recolhidoEm: new Date().toISOString(),
      serieAte: series[series.length - 1].t,
      frequencia: "mensal",
    },
    series,
  };
  return seriesSchema.parse(doc);
}

/**
 * Série avulsa (§1): falha ruidosamente se a resposta tiver dimensões
 * inesperadas — nunca se escolhe a primeira categoria nem se adapta o filtro.
 */
export async function fetchSerie(spec: SerieExtra): Promise<SerieGuardada> {
  const url = `${BASE}/${spec.dataset}?format=JSON&${spec.filtros}&sinceTimePeriod=2000`;
  const json = jsonStatSchema.parse(await fetchJson(url));

  const esperadas = new Set([
    "time",
    "freq",
    ...(spec.dimsFixas ?? []),
    ...spec.filtros.split("&").map((f) => f.split("=")[0]),
  ]);
  const inesperadas = (json.id ?? []).filter((d) => !esperadas.has(d));
  if (inesperadas.length > 0) {
    throw new Error(
      `Eurostat ${spec.id}: dimensões inesperadas ${inesperadas.join(", ")} — rever filtros`
    );
  }

  const series = parseJsonStat(json);
  if (series.length === 0) throw new Error(`Eurostat ${spec.id}: série vazia`);

  const rotuloAte = series[series.length - 1].t;
  const doc: SerieGuardada = {
    meta: {
      id: spec.id,
      fonte: "Eurostat",
      dataset: spec.dataset,
      url,
      unidade: spec.unidade,
      recolhidoEm: new Date().toISOString(),
      serieAte: rotuloParaSerieAte(rotuloAte),
      rotuloAte,
      frequencia: spec.frequencia,
    },
    series,
  };
  return seriesSchema.parse(doc);
}

export async function runEurostat(
  outDir: string
): Promise<ResultadoFonte<SerieGuardada>> {
  mkdirSync(outDir, { recursive: true });
  const docs: SerieGuardada[] = [];
  try {
    for (const coicop of COICOPS) {
      const doc = await fetchCoicop(coicop);
      writeFileSync(
        path.join(outDir, `hicp-pt-${coicop.toLowerCase()}.json`),
        JSON.stringify(doc, null, 2)
      );
      docs.push(doc);
      console.log(`✓ ${coicop}: ${doc.series.length} pontos até ${doc.meta.serieAte}`);
    }
    for (const spec of SERIES_EXTRA) {
      const doc = await fetchSerie(spec);
      writeFileSync(
        path.join(outDir, `${spec.id}.json`),
        JSON.stringify(doc, null, 2)
      );
      docs.push(doc);
      console.log(
        `✓ ${spec.id}: ${doc.series.length} pontos até ${doc.meta.rotuloAte ?? doc.meta.serieAte}`
      );
    }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true, docs };
}
