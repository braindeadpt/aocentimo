import { z } from "zod";
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import type { SerieGuardada } from "./eurostat";
import { fetchJson, type ResultadoFonte } from "./_http";

/**
 * Ingest DGEG — preço médio nacional diário de combustíveis (PMD).
 * Endpoint público do portal precoscombustiveis.dgeg.gov.pt (alimenta a
 * página "Preço Médio Diário"). Cobertura diária desde ~2017.
 * Escreve data/sources/dgeg/{combustivel}-diario.json; recolha incremental:
 * relê o ficheiro existente e acrescenta só os pontos novos.
 */

const BASE = "https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PMD";

/** IDs internos DGEG (GetTiposCombustiveis), combustíveis rodoviários. */
export const COMBUSTIVEIS = {
  gasoleo: { id: 2101, nome: "Gasóleo simples" },
  gasolina95: { id: 3201, nome: "Gasolina simples 95" },
  gpl: { id: 1120, nome: "GPL Auto" },
} as const;

export type Combustivel = keyof typeof COMBUSTIVEIS;

const INICIO_SERIE = "2017-01-01";

const respostaSchema = z.object({
  status: z.boolean(),
  resultado: z
    .array(z.object({ Data: z.string(), PrecoMedioC4: z.string() }))
    .nullable(),
});

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

/** "2,0221 €" → 2.0221 */
function parseEuro(s: string): number {
  return Number(s.replace("€", "").trim().replace(/\s/g, "").replace(",", "."));
}

async function fetchPmd(
  idTipo: number,
  dataIni: string,
  dataFim: string
): Promise<{ t: string; v: number }[]> {
  const url = `${BASE}?idsTiposComb=${idTipo}&dataIni=${dataIni}&dataFim=${dataFim}`;
  const body = respostaSchema.parse(await fetchJson(url));
  if (!body.status || !body.resultado) return [];

  return body.resultado
    .map((r) => ({ t: r.Data, v: parseEuro(r.PrecoMedioC4) }))
    .filter((p) => p.t && Number.isFinite(p.v));
}

export async function fetchCombustivel(
  combustivel: Combustivel,
  existente: { t: string; v: number }[] = []
): Promise<SerieGuardada> {
  const { id, nome } = COMBUSTIVEIS[combustivel];
  const hoje = new Date().toISOString().slice(0, 10);

  const ultimo = existente.length ? existente[existente.length - 1].t : null;
  const pontos: { t: string; v: number }[] = [];

  if (!ultimo) {
    // primeira recolha: backfill por ano (a API aceita intervalos longos)
    const anoInicio = Number(INICIO_SERIE.slice(0, 4));
    for (let y = anoInicio; y <= Number(hoje.slice(0, 4)); y++) {
      const fim = `${y}-12-31` < hoje ? `${y}-12-31` : hoje;
      pontos.push(...(await fetchPmd(id, `${y}-01-01`, fim)));
    }
  } else if (ultimo < hoje) {
    const dia = new Date(`${ultimo}T00:00:00Z`);
    dia.setUTCDate(dia.getUTCDate() + 1);
    pontos.push(...(await fetchPmd(id, dia.toISOString().slice(0, 10), hoje)));
  }

  const mapa = new Map(existente.map((p) => [p.t, p.v]));
  for (const p of pontos) mapa.set(p.t, p.v);
  const series = [...mapa.entries()]
    .map(([t, v]) => ({ t, v }))
    .sort((a, b) => (a.t < b.t ? -1 : 1));

  if (series.length === 0)
    throw new Error(`DGEG ${combustivel}: série vazia — fonte sem dados`);

  const doc: SerieGuardada = {
    meta: {
      id: `pmd-${combustivel}-diario`,
      fonte: "DGEG — Preços dos Combustíveis",
      dataset: `PMD ${nome} (${id})`,
      url: `${BASE}?idsTiposComb=${id}&dataIni=${INICIO_SERIE}&dataFim=${hoje}`,
      unidade: "eur_litro_media_nacional",
      recolhidoEm: new Date().toISOString(),
      serieAte: series[series.length - 1].t,
    },
    series,
  };
  return serieSchema.parse(doc);
}

export async function runDgeg(
  outDir: string
): Promise<ResultadoFonte<SerieGuardada>> {
  mkdirSync(outDir, { recursive: true });
  const docs: SerieGuardada[] = [];
  try {
    for (const combustivel of Object.keys(COMBUSTIVEIS) as Combustivel[]) {
      const file = path.join(outDir, `pmd-${combustivel}-diario.json`);
      let existente: { t: string; v: number }[] = [];
      if (existsSync(file)) {
        try {
          existente = serieSchema.parse(JSON.parse(readFileSync(file, "utf8"))).series;
        } catch {
          existente = []; // ficheiro inválido → backfill completo
        }
      }
      const doc = await fetchCombustivel(combustivel, existente);
      writeFileSync(file, JSON.stringify(doc, null, 2));
      docs.push(doc);
      console.log(
        `✓ ${COMBUSTIVEIS[combustivel].nome}: ${doc.series.length} dias até ${doc.meta.serieAte}`
      );
    }
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true, docs };
}
