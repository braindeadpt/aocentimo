import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

/**
 * Ingest Eurostat — IHPC (prc_hicp_*), JSON-stat 2.0.
 * Gratuito, sem chave. Escreve data/sources/eurostat/hicp-{coicop}.json
 * e atualiza data/meta/sources.json.
 */

const BASE =
  "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data";

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

interface JsonStat {
  id?: string[];
  size?: number[];
  dimension: { time?: { category: { index: Record<string, number> } } };
  value: number[] | Record<string, number>;
}

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
  const url = `${BASE}/prc_hicp_midx?format=JSON&geo=PT&coicop=${coicop}&unit=I15`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Eurostat ${coicop}: HTTP ${res.status}`);

  const json = (await res.json()) as JsonStat;
  const series = parseJsonStat(json);
  if (series.length === 0) throw new Error(`Eurostat ${coicop}: série vazia`);

  const doc: SerieGuardada = {
    meta: {
      id: `hicp-pt-${coicop.toLowerCase()}`,
      fonte: "Eurostat",
      dataset: "prc_hicp_midx",
      url,
      unidade: "Índice 2015=100",
      recolhidoEm: new Date().toISOString(),
      serieAte: series[series.length - 1].t,
    },
    series,
  };
  return seriesSchema.parse(doc);
}

export async function runEurostat(outDir: string): Promise<SerieGuardada[]> {
  mkdirSync(outDir, { recursive: true });
  const docs: SerieGuardada[] = [];
  for (const coicop of COICOPS) {
    const doc = await fetchCoicop(coicop);
    writeFileSync(
      path.join(outDir, `hicp-pt-${coicop.toLowerCase()}.json`),
      JSON.stringify(doc, null, 2)
    );
    docs.push(doc);
    console.log(`✓ ${coicop}: ${doc.series.length} pontos até ${doc.meta.serieAte}`);
  }
  return docs;
}
