import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import path from "path";
import { z } from "zod";

/**
 * Derivados do IHPC — resume cada série Eurostat em data/derived/hicp-resumo.json.
 * Calculado a partir dos brutos em data/sources/ — nunca inventado:
 * se uma série falta, simplesmente não aparece no resumo.
 */

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

export interface ResumoSerie {
  id: string;
  serieAte: string;
  ultimo: number;
  varMensal: number | null;
  varHomologa: number | null;
  varDesdeInicio: number | null;
  desde: string;
  pontos: number;
}

export interface ResumoHicp {
  derivadoEm: string;
  unidade: string;
  series: ResumoSerie[];
}

function variacao(series: { t: string; v: number }[], n: number): number | null {
  if (series.length <= n) return null;
  const a = series[series.length - 1].v;
  const b = series[series.length - 1 - n].v;
  return b === 0 ? null : (a - b) / b;
}

export function runHicp(dataDir: string): ResumoHicp {
  const src = path.join(dataDir, "sources", "eurostat");
  const ficheiros = existsSync(src)
    ? readdirSync(src).filter((f) => f.endsWith(".json"))
    : [];

  const series: ResumoSerie[] = ficheiros.map((f) => {
    const doc = serieSchema.parse(JSON.parse(readFileSync(path.join(src, f), "utf8")));
    const s = doc.series;
    return {
      id: doc.meta.id,
      serieAte: doc.meta.serieAte,
      ultimo: s[s.length - 1].v,
      varMensal: variacao(s, 1),
      varHomologa: variacao(s, 12),
      varDesdeInicio: variacao(s, s.length - 1),
      desde: s[0].t,
      pontos: s.length,
    };
  });

  const resumo: ResumoHicp = {
    derivadoEm: new Date().toISOString(),
    unidade: "Índice 2025=100",
    series: series.sort((a, b) => a.id.localeCompare(b.id)),
  };

  const outDir = path.join(dataDir, "derived");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "hicp-resumo.json"), JSON.stringify(resumo, null, 2));
  return resumo;
}
