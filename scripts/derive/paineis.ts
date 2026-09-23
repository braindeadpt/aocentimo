import path from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

interface SerieGuardada {
  meta: { id: string; serieAte: string };
  series: { t: string; v: number }[];
}

/**
 * Deriva a taxa base indicativa dos CA Série F a partir da Euribor 3M
 * mensal (BPstat): min(média mensal, 2,50 %). A taxa oficial é a do IGCP
 * em data/fiscal/ca.json — mostramos as duas lado a lado.
 */
export function runCaBase(dataDir: string) {
  const src = path.join(dataDir, "sources", "bpstat", "euribor-3m-mensal.json");
  const caPath = path.join(dataDir, "fiscal", "ca.json");
  if (!existsSync(src) || !existsSync(caPath)) return null;

  const e3m: SerieGuardada = JSON.parse(readFileSync(src, "utf8"));
  const ca = JSON.parse(readFileSync(caPath, "utf8"));
  const cap = 2.5;

  const indicativa = e3m.series.map((p) => ({
    t: p.t,
    v: Math.round(Math.min(Math.max(p.v, 0), cap) * 1000) / 1000,
  }));

  const doc = {
    meta: {
      id: "ca-serie-f-taxa-base",
      fonte: "IGCP (oficial) + BPstat Euribor 3M (indicativa)",
      url: ca.fonteUrl,
      nota: "Oficial = média da Euribor 3M nos 10 dias úteis, cap 2,50 %. Indicativa usa a média mensal — pode diferir dias dentro do mês.",
      oficialPct: ca.serieF.taxaBrutaNovasSubscricoes * 100,
      vigenciaOficial: ca.vigencia,
      serieAte: e3m.meta.serieAte,
      recolhidoEm: new Date().toISOString(),
    },
    series: indicativa,
  };

  const out = path.join(dataDir, "derived", "ca-base.json");
  writeFileSync(out, JSON.stringify(doc, null, 2));
  return doc;
}
