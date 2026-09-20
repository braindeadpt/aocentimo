import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

/**
 * Watchdog de frescura — regra nº1 aplicada ao pipeline.
 *
 * Para cada fonte em data/meta/sources.json calcula se a série está em dia.
 * O SLA é por frequência, em períodos próprios (tabela §1 do
 * PACK-OBSERVATORIO): uma série mensal está atrasada quando o último
 * período com dados é anterior ao último período cujo prazo de publicação
 * (fim do período + N períodos) já decorreu. Assim, uma série só falha
 * quando os dados *deviam* existir — nunca por atraso da própria fonte.
 *
 * `serieAte` aceita os formatos das fontes: "2026-08" (mensal), "2026-09-17"
 * (diário), "2026-03-31" (fim de trimestre/semestre ISO) ou "2026" (anual);
 * `esperadoAte` sai sempre como data ISO do fim do período esperado
 * ("YYYY" para anual — é o que a /metodologia consome).
 *
 * Escreve data/meta/freshness.json e sai com código 1 se alguma série
 * estiver atrasada — gate de CI.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const META = path.join(ROOT, "data", "meta");

type Granularidade = "dia" | "semana" | "mes" | "trimestre" | "semestre" | "ano";

/** SLA em períodos próprios — espelha a tabela §1 do pack. */
const SLA: Record<string, { periodos: number; gran: Granularidade }> = {
  diaria: { periodos: 3, gran: "dia" },
  semanal: { periodos: 1, gran: "semana" },
  mensal: { periodos: 2, gran: "mes" },
  trimestral: { periodos: 2, gran: "trimestre" },
  semestral: { periodos: 2, gran: "semestre" },
  anual: { periodos: 1, gran: "ano" },
};

interface FonteMeta {
  id: string;
  fonte: string;
  url: string;
  recolhidoEm: string;
  serieAte: string;
  frequencia: string;
}

export interface SerieFrescura {
  id: string;
  fonte: string;
  serieAte: string;
  esperadoAte: string;
  frequencia: string;
  estado: "em-dia" | "atrasada" | "sem-sla";
  atrasoPeriodos: number;
}

export interface RelatorioFrescura {
  verificadoEm: string;
  estado: "ok" | "atrasado";
  series: SerieFrescura[];
}

const DIA = 86_400_000;

/** "2026" | "2026-08" | "2026-08-15" → {y, m, d} com omissões a 1. */
function parseData(p: string): { y: number; m: number; d: number } {
  const [y, m, d] = p.split("-").map(Number);
  return { y, m: m || 1, d: d || 1 };
}

function fimDoPeriodo(p: string, gran: Granularidade): Date {
  const { y, m, d } = parseData(p);
  switch (gran) {
    case "dia":
      return new Date(Date.UTC(y, m - 1, d));
    case "semana": {
      const fim = new Date(Date.UTC(y, m - 1, d));
      fim.setUTCDate(fim.getUTCDate() + 6);
      return fim;
    }
    case "mes":
      return new Date(Date.UTC(y, m, 0)); // último dia do mês m
    case "trimestre":
      // m pode ser o 1.º mês do trimestre ("2026-01") ou uma data dentro dele
      return new Date(Date.UTC(y, Math.floor((m - 1) / 3) * 3 + 3, 0));
    case "semestre":
      return new Date(Date.UTC(y, Math.floor((m - 1) / 6) * 6 + 6, 0));
    case "ano":
      return new Date(Date.UTC(y, 11, 31));
  }
}

function inicioDoPeriodo(data: Date, gran: Granularidade): Date {
  const d = new Date(data);
  switch (gran) {
    case "dia":
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    case "semana": {
      const ini = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      ini.setUTCDate(ini.getUTCDate() - 6);
      return ini;
    }
    case "mes":
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    case "trimestre":
      return new Date(
        Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) * 3, 1)
      );
    case "semestre":
      return new Date(
        Date.UTC(d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 6) * 6, 1)
      );
    case "ano":
      return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  }
}

/** Rótulo canónico do período: 1.º mês do período em "YYYY-MM". */
function periodoDe(data: Date, gran: Granularidade): string {
  const y = data.getUTCFullYear();
  const m = data.getUTCMonth() + 1;
  switch (gran) {
    case "dia":
    case "semana":
      return data.toISOString().slice(0, 10);
    case "mes":
      return `${y}-${String(m).padStart(2, "0")}`;
    case "trimestre":
      return `${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, "0")}`;
    case "semestre":
      return `${y}-${String(Math.floor((m - 1) / 6) * 6 + 1).padStart(2, "0")}`;
    case "ano":
      return `${y}`;
  }
}

/** Qualquer data/rótulo → rótulo canónico do período que a contém. */
function periodoDeData(p: string, gran: Granularidade): string {
  const { y, m, d } = parseData(p);
  switch (gran) {
    case "dia":
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    case "semana": {
      // a semana conta-se do rótulo (início) — a fonte grava o 1.º dia
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    case "mes":
      return `${y}-${String(m).padStart(2, "0")}`;
    case "trimestre":
      return `${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, "0")}`;
    case "semestre":
      return `${y}-${String(Math.floor((m - 1) / 6) * 6 + 1).padStart(2, "0")}`;
    case "ano":
      return `${y}`;
  }
}

function avancarPeriodo(p: string, n: number, gran: Granularidade): string {
  const { y, m, d } = parseData(p);
  switch (gran) {
    case "dia": {
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() + n);
      return dt.toISOString().slice(0, 10);
    }
    case "semana": {
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() + 7 * n);
      return dt.toISOString().slice(0, 10);
    }
    case "mes": {
      const total = y * 12 + (m - 1) + n;
      return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
    }
    case "trimestre": {
      const total = y * 4 + Math.floor((m - 1) / 3) + n;
      return `${Math.floor(total / 4)}-${String((total % 4) * 3 + 1).padStart(2, "0")}`;
    }
    case "semestre": {
      const total = y * 2 + Math.floor((m - 1) / 6) + n;
      return `${Math.floor(total / 2)}-${String((total % 2) * 6 + 1).padStart(2, "0")}`;
    }
    case "ano":
      return `${y + n}`;
  }
}

function periodosEntre(a: string, b: string, gran: Granularidade): number {
  const pa = periodoDeData(a, gran);
  const pb = periodoDeData(b, gran);
  const aa = parseData(pa);
  const bb = parseData(pb);
  switch (gran) {
    case "dia":
      return Math.round(
        (Date.UTC(bb.y, bb.m - 1, bb.d) - Date.UTC(aa.y, aa.m - 1, aa.d)) / DIA
      );
    case "semana":
      return Math.round(
        (Date.UTC(bb.y, bb.m - 1, bb.d) - Date.UTC(aa.y, aa.m - 1, aa.d)) / (7 * DIA)
      );
    case "mes":
      return (bb.y - aa.y) * 12 + (bb.m - aa.m);
    case "trimestre":
      return Math.round(((bb.y - aa.y) * 12 + (bb.m - aa.m)) / 3);
    case "semestre":
      return Math.round(((bb.y - aa.y) * 12 + (bb.m - aa.m)) / 6);
    case "ano":
      return bb.y - aa.y;
  }
}

/** esperadoAte: fim do período em ISO ("YYYY" para anual). */
function rotuloEsperado(p: string, gran: Granularidade): string {
  if (gran === "ano") return p;
  return fimDoPeriodo(p, gran).toISOString().slice(0, 10);
}

/**
 * Último período cuja publicação já devia ter acontecido:
 * o mais recente P tal que fim(P) + SLA-períodos <= agora.
 * «+ N períodos» = fim do período N posições à frente — prazo generoso
 * e simétrico para trimestres/semestres.
 */
export function periodoEsperado(
  gran: Granularidade,
  slaPeriodos: number,
  agora: Date
): string {
  let candidato = inicioDoPeriodo(agora, gran);
  for (let i = 0; i < 40; i++) {
    const p = periodoDe(candidato, gran);
    const prazo = fimDoPeriodo(avancarPeriodo(p, slaPeriodos, gran), gran);
    if (prazo.getTime() <= agora.getTime()) return p;
    candidato = inicioDoPeriodo(new Date(candidato.getTime() - DIA), gran);
  }
  return periodoDe(candidato, gran);
}

export function avaliar(fontes: FonteMeta[], agora = new Date()): RelatorioFrescura {
  const series: SerieFrescura[] = fontes.map((f) => {
    const sla = SLA[f.frequencia];
    if (!sla) {
      return {
        id: f.id, fonte: f.fonte, serieAte: f.serieAte, esperadoAte: "—",
        frequencia: f.frequencia, estado: "sem-sla", atrasoPeriodos: 0,
      };
    }
    const esperado = periodoEsperado(sla.gran, sla.periodos, agora);
    const atraso = periodosEntre(f.serieAte, esperado, sla.gran);
    return {
      id: f.id, fonte: f.fonte, serieAte: f.serieAte, esperadoAte: rotuloEsperado(esperado, sla.gran),
      frequencia: f.frequencia,
      estado: atraso > 0 ? "atrasada" : "em-dia",
      atrasoPeriodos: Math.max(0, atraso),
    };
  });
  return {
    verificadoEm: agora.toISOString(),
    estado: series.some((s) => s.estado === "atrasada") ? "atrasado" : "ok",
    series,
  };
}

export function runFreshness(metaDir = META, agora = new Date()): RelatorioFrescura {
  const fontesPath = path.join(metaDir, "sources.json");
  const fontes: FonteMeta[] = existsSync(fontesPath)
    ? JSON.parse(readFileSync(fontesPath, "utf8"))
    : [];
  const relatorio = avaliar(fontes, agora);
  mkdirSync(metaDir, { recursive: true });
  writeFileSync(path.join(metaDir, "freshness.json"), JSON.stringify(relatorio, null, 2));
  return relatorio;
}

/* execução direta: tsx scripts/derive/freshness.ts */
if (require.main === module) {
  const r = runFreshness();
  for (const s of r.series) {
    const marca = s.estado === "em-dia" ? "✓" : s.estado === "sem-sla" ? "·" : "✗";
    const extra =
      s.estado === "atrasada" ? ` — atrasada ${s.atrasoPeriodos} período(s), esperado ${s.esperadoAte}` : "";
    console.log(`${marca} ${s.id}: até ${s.serieAte}${extra}`);
  }
  if (r.estado === "atrasado") {
    console.error("\nFALHA: há séries atrasadas — ver data/meta/freshness.json");
    process.exit(1);
  }
  console.log(`\nfreshness.json escrito (${r.series.length} séries em dia)`);
}
