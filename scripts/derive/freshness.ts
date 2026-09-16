import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

/**
 * Watchdog de frescura — regra nº1 aplicada ao pipeline.
 *
 * Para cada fonte em data/meta/sources.json calcula se a série está em dia:
 * uma série mensal está atrasada quando o seu último período é anterior ao
 * período mais recente cujo prazo de publicação (fim do período + SLA) já
 * decorreu. Assim, uma série só falha quando os dados *deviam* existir —
 * nunca por atraso de publicação da própria fonte.
 *
 * Escreve data/meta/freshness.json (consumido por /metodologia) e sai com
 * código 1 se alguma série estiver atrasada — gate de CI.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const META = path.join(ROOT, "data", "meta");

type Granularidade = "dia" | "semana" | "mes" | "trimestre" | "ano";

/** SLA em dias após o fim do período — espelha §9 do plano. */
const SLA: Record<string, { dias: number; gran: Granularidade }> = {
  diaria: { dias: 3, gran: "dia" },
  semanal: { dias: 10, gran: "semana" },
  mensal: { dias: 45, gran: "mes" },
  trimestral: { dias: 100, gran: "trimestre" },
  anual: { dias: 400, gran: "ano" },
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

function fimDoPeriodo(p: string, gran: Granularidade): Date {
  const [y, m, d] = p.split("-").map(Number);
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
      return new Date(Date.UTC(y, m + 2, 0)); // m = 1.º mês do trimestre
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
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 2, 1));
    case "ano":
      return new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  }
}

function periodoDe(data: Date, gran: Granularidade): string {
  const y = data.getUTCFullYear();
  const m = data.getUTCMonth() + 1;
  switch (gran) {
    case "dia":
      return data.toISOString().slice(0, 10);
    case "semana":
      return data.toISOString().slice(0, 10);
    case "mes":
      return `${y}-${String(m).padStart(2, "0")}`;
    case "trimestre":
      return `${y}-${String(Math.floor((m - 1) / 3) * 3 + 1).padStart(2, "0")}`;
    case "ano":
      return `${y}`;
  }
}

function periodosEntre(a: string, b: string, gran: Granularidade): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  switch (gran) {
    case "dia":
      return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / DIA);
    case "semana":
      return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / (7 * DIA));
    case "mes":
      return (by - ay) * 12 + (bm - am);
    case "trimestre":
      return Math.round(((by - ay) * 12 + (bm - am)) / 3);
    case "ano":
      return by - ay;
  }
}

/**
 * Último período cuja publicação já devia ter acontecido:
 * o mais recente P tal que fim(P) + sla <= agora.
 */
export function periodoEsperado(gran: Granularidade, slaDias: number, agora: Date): string {
  let candidato = inicioDoPeriodo(agora, gran);
  // recua até o prazo de publicação do período já ter passado
  for (let i = 0; i < 40; i++) {
    const fim = fimDoPeriodo(periodoDe(candidato, gran), gran);
    if (fim.getTime() + slaDias * DIA <= agora.getTime()) {
      return periodoDe(candidato, gran);
    }
    candidato = new Date(candidato.getTime() - DIA);
    candidato = inicioDoPeriodo(candidato, gran);
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
    const esperado = periodoEsperado(sla.gran, sla.dias, agora);
    const atraso = periodosEntre(f.serieAte, esperado, sla.gran);
    return {
      id: f.id, fonte: f.fonte, serieAte: f.serieAte, esperadoAte: esperado,
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
