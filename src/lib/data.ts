import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

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

const fonteMetaSchema = z.object({
  id: z.string(),
  fonte: z.string(),
  url: z.string(),
  recolhidoEm: z.string(),
  serieAte: z.string(),
  frequencia: z.string(),
});

export type Serie = z.infer<typeof serieSchema>;
export type FonteMeta = z.infer<typeof fonteMetaSchema>;

const DATA = path.join(process.cwd(), "data");
const cache = new Map<string, Serie | null>();

export function loadSerie(coicop: string): Serie | null {
  const id = `hicp-pt-${coicop.toLowerCase()}`;
  if (cache.has(id)) return cache.get(id) ?? null;
  const file = path.join(DATA, "sources", "eurostat", `${id}.json`);
  if (!existsSync(file)) {
    cache.set(id, null);
    return null;
  }
  const parsed = serieSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  cache.set(id, parsed);
  return parsed;
}

export function loadFontes(): FonteMeta[] {
  const file = path.join(DATA, "meta", "sources.json");
  if (!existsSync(file)) return [];
  return z.array(fonteMetaSchema).parse(JSON.parse(readFileSync(file, "utf8")));
}

export function listSeries(): string[] {
  const dir = path.join(DATA, "sources", "eurostat");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace("hicp-pt-", "").replace(".json", "").toUpperCase());
}

/** Variação % entre os últimos n pontos (mensal: n=1, homóloga: n=12). */
export function variacao(serie: Serie, n: number): number | null {
  const s = serie.series;
  if (s.length <= n) return null;
  const a = s[s.length - 1].v;
  const b = s[s.length - 1 - n].v;
  return b === 0 ? null : (a - b) / b;
}

/** Variação acumulada desde o primeiro ponto. */
export function variacaoDesdeInicio(serie: Serie): number | null {
  const s = serie.series;
  if (s.length < 2) return null;
  const b = s[0].v;
  return b === 0 ? null : (s[s.length - 1].v - b) / b;
}

/** Índice interpolado: quanto vale hoje X € de um dado mês/ano. */
export function poderDeCompra(serie: Serie, valor: number, desde: string): number | null {
  const ponto = serie.series.find((p) => p.t === desde) ?? serie.series[0];
  const ultimo = serie.series[serie.series.length - 1];
  if (!ponto || ponto.v === 0) return null;
  return valor * (ultimo.v / ponto.v);
}
