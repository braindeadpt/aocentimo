import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";
import type { SerieGuardada } from "./eurostat";

/**
 * Ingest BPstat (Banco de Portugal) — Euribor média mensal.
 * API pública, sem chave: /api/observations/?series_ids=ID devolve a série
 * completa. As séries de média mensal são as que os bancos aplicam às
 * prestações de crédito habitação. Escreve
 * data/sources/bpstat/euribor-{prazo}.json.
 */

const BASE = "https://bpstat.bportugal.pt/api/observations/";

/** IDs das séries BPstat (domínio 22 — Mercado monetário). */
export const SERIES_EURIBOR = {
  "1m": 13168439,
  "3m": 13168436,
  "6m": 13168438,
  "12m": 13168437,
} as const;

export type PrazoEuribor = keyof typeof SERIES_EURIBOR;

const observacaoSchema = z.object({
  value: z.string(),
  reference_date: z.string(),
});
const respostaSchema = z.object({ data: z.array(observacaoSchema) });

const serieSchema = z.object({
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

export async function fetchEuribor(prazo: PrazoEuribor): Promise<SerieGuardada> {
  const id = SERIES_EURIBOR[prazo];
  const url = `${BASE}?series_ids=${id}&lang=PT`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`BPstat Euribor ${prazo}: HTTP ${res.status}`);

  const { data } = respostaSchema.parse(await res.json());
  const series = data
    .map((o) => ({ t: o.reference_date.slice(0, 7), v: Number(o.value) }))
    .filter((p) => Number.isFinite(p.v));
  if (series.length === 0) throw new Error(`BPstat Euribor ${prazo}: série vazia`);

  const doc: SerieGuardada = {
    meta: {
      id: `euribor-${prazo}-mensal`,
      fonte: "Banco de Portugal — BPstat",
      dataset: `serie ${id} (Mercado monetário)`,
      url,
      unidade: "percentagem_media_mensal",
      recolhidoEm: new Date().toISOString(),
      serieAte: series[series.length - 1].t,
    },
    series,
  };
  return serieSchema.parse(doc);
}

export async function runBpstat(outDir: string): Promise<SerieGuardada[]> {
  mkdirSync(outDir, { recursive: true });
  const docs: SerieGuardada[] = [];
  for (const prazo of Object.keys(SERIES_EURIBOR) as PrazoEuribor[]) {
    const doc = await fetchEuribor(prazo);
    writeFileSync(
      path.join(outDir, `euribor-${prazo}-mensal.json`),
      JSON.stringify(doc, null, 2)
    );
    docs.push(doc);
    console.log(`✓ Euribor ${prazo}: ${doc.series.length} pontos até ${doc.meta.serieAte}`);
  }
  return docs;
}
