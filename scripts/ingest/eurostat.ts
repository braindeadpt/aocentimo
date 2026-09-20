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
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true, docs };
}
