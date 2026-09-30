import path from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { rotuloParaSerieAte } from "../ingest/eurostat";

/**
 * Derivados honestos — só razões/diferenças entre séries oficiais,
 * nunca estimativas. Meta guarda as duas fontes e a fórmula em texto.
 */

interface SerieGuardada {
  meta: {
    id: string;
    fonte: string;
    url: string;
    unidade: string;
    serieAte: string;
    rotuloAte?: string;
    frequencia?: string;
    recolhidoEm?: string;
    fontes?: string[];
    formula?: string;
    nota?: string;
  };
  series: { t: string; v: number }[];
}

function carregar(dataDir: string, dir: string, nome: string): SerieGuardada | null {
  const f = path.join(dataDir, "sources", dir, `${nome}.json`);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8")) as SerieGuardada;
  } catch {
    return null;
  }
}

const arred = (v: number, casas = 2) => {
  const f = 10 ** casas;
  const r = Math.round(v * f) / f;
  // Math.round devolve -0 e o JSON serializa isso como -0: um valor que
  // aparece com sinal negativo quando é zero não é um número para mostrar
  return r === 0 ? 0 : r;
};

/**
 * casa-em-salarios: HPI (prc_hpi_q, índice 2015=100) ÷ custo do trabalho
 * (ei_lmlc_q, variação homóloga) reindexado a 2015=100.
 * O LCI vem em % homóloga — encadeamos 4 trimestres: idx(t) = idx(t−4)·(1+pch/100),
 * com semente 2015-Qn = 100 (média de 2015 = 100). Só trimestres em que
 * ambas as séries existem.
 */
function casaEmSalarios(dataDir: string) {
  const hpi = carregar(dataDir, "eurostat", "hpi-pt");
  const lci = carregar(dataDir, "eurostat", "lci-pt-homologo");
  if (!hpi || !lci) return null;

  const pch = new Map(lci.series.map((p) => [p.t, p.v]));
  const anos = lci.series.map((p) => Number(p.t.slice(0, 4)));
  const idx = new Map<string, number>();
  for (let q = 1; q <= 4; q++) {
    idx.set(`2015-Q${q}`, 100);
    for (let y = 2016; y <= Math.max(...anos); y++) {
      const t = `${y}-Q${q}`;
      const anterior = idx.get(`${y - 1}-Q${q}`);
      const v = pch.get(t);
      if (anterior !== undefined && v !== undefined) idx.set(t, anterior * (1 + v / 100));
    }
    for (let y = 2014; y >= Math.min(...anos); y--) {
      const t = `${y}-Q${q}`;
      const seguinte = idx.get(`${y + 1}-Q${q}`);
      const vSeguinte = pch.get(`${y + 1}-Q${q}`);
      if (seguinte !== undefined && vSeguinte !== undefined)
        idx.set(t, seguinte / (1 + vSeguinte / 100));
    }
  }

  const series = hpi.series
    .filter((p) => idx.has(p.t))
    .map((p) => ({ t: p.t, v: arred((p.v / idx.get(p.t)!) * 100) }));
  if (series.length === 0) return null;

  const rotuloAte = series[series.length - 1].t;
  return {
    meta: {
      id: "casa-em-salarios",
      fonte: "Eurostat — prc_hpi_q ÷ ei_lmlc_q",
      fontes: [hpi.meta.url, lci.meta.url],
      formula:
        "Índice de preços da habitação (2015=100) ÷ custo do trabalho reindexado a 2015=100 (encadeamento das variações homólogas). Razão de índices oficiais — não mede salários reais.",
      unidade: "indice_2015_100",
      url: hpi.meta.url,
      recolhidoEm: new Date().toISOString(),
      serieAte: rotuloParaSerieAte(rotuloAte),
      rotuloAte,
      frequencia: "trimestral",
    },
    series,
  };
}

/** desemprego-gap: taxa de desemprego PT − UE27, em pontos percentuais. */
function desempregoGap(dataDir: string) {
  const pt = carregar(dataDir, "eurostat", "une-pt-total");
  const ue = carregar(dataDir, "eurostat", "une-ue27-total");
  if (!pt || !ue) return null;

  const uePorMes = new Map(ue.series.map((p) => [p.t, p.v]));
  const series = pt.series
    .filter((p) => uePorMes.has(p.t))
    .map((p) => ({ t: p.t, v: arred(p.v - uePorMes.get(p.t)!) }));
  if (series.length === 0) return null;

  return {
    meta: {
      id: "desemprego-gap",
      fonte: "Eurostat — une_rt_m (PT − EU27_2020)",
      fontes: [pt.meta.url, ue.meta.url],
      formula:
        "Taxa de desemprego dessazonalizada PT menos a média UE27, em pontos percentuais.",
      unidade: "pontos_percentuais",
      url: pt.meta.url,
      recolhidoEm: new Date().toISOString(),
      serieAte: series[series.length - 1].t,
      rotuloAte: series[series.length - 1].t,
      frequencia: "mensal",
    },
    series,
  };
}

/**
 * deposito-real: taxa de juro de novos depósitos a prazo dos particulares
 * menos a inflação homóloga do mesmo mês.
 *
 * As duas séries são oficiais e anuais na mesma base (a do BPstat é uma taxa
 * acordada anualizada, TAA), por isso a subtracção é legítima: taxa real
 * aproximada = taxa nominal − variação anual do HICP. A variação homóloga sai
 * do índice hicp-pt-cp00 (2025=100): pch(t) = índice(t)/índice(t−12) − 1.
 *
 * O que este derivado NÃO é: o juro que um depósito rende no bolso de alguém.
 * Não conta com impostos (sobre a taxa, ou a retenção na fonte), nem com a
 * inflação dos bens que essa pessoa consome — o HICP é a inflação geral.
 * A nota vai escrita no meta para não se perder no caminho até à UI.
 */
export function depositoReal(
  dataDir: string,
  deposito = "ate1a"
): SerieGuardada | null {
  const dep = carregar(dataDir, "bpstat", `deposito-prazo-${deposito}-mensal`);
  const hicp = carregar(dataDir, "eurostat", "hicp-pt-cp00");
  if (!dep || !hicp) return null;

  const indice = new Map(hicp.series.map((p) => [p.t, p.v]));
  const dozeMesesAntes = (t: string): string => {
    const [y, m] = t.split("-").map(Number);
    const total = y * 12 + (m - 1) - 12;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  };

  const series = dep.series
    .map((p) => {
      const anterior = indice.get(dozeMesesAntes(p.t));
      const atual = indice.get(p.t);
      if (anterior === undefined || atual === undefined || anterior === 0) return null;
      const pch = (atual / anterior - 1) * 100;
      return { t: p.t, v: arred(p.v - pch) };
    })
    .filter((p): p is { t: string; v: number } => p !== null);

  if (series.length === 0) return null;

  const rotuloAte = series[series.length - 1].t;
  return {
    meta: {
      id: "deposito-real",
      fonte: "Banco de Portugal — BPstat · Eurostat — prc_hicp_m",
      fontes: [dep.meta.url, hicp.meta.url],
      formula:
        "Taxa de juro (TAA) de novos depósitos a prazo até 1 ano dos particulares menos a variação homóloga do HICP total de Portugal (prc_hicp_minr, I25) no mesmo mês.",
      nota: "Aproximação: não conta com impostos. É diferença entre duas séries oficiais, não o juro real de um depósito concreto.",
      unidade: "pontos_percentuais",
      url: dep.meta.url,
      recolhidoEm: new Date().toISOString(),
      serieAte: rotuloAte,
      rotuloAte,
      frequencia: "mensal",
    },
    series,
  };
}

export function runDerivados(dataDir: string) {
  const outDir = path.join(dataDir, "derived");
  mkdirSync(outDir, { recursive: true });
  const feitos: string[] = [];
  for (const doc of [
    casaEmSalarios(dataDir),
    desempregoGap(dataDir),
    depositoReal(dataDir),
  ]) {
    if (!doc) continue;
    writeFileSync(
      path.join(outDir, `${doc.meta.id}.json`),
      JSON.stringify(doc, null, 2)
    );
    feitos.push(doc.meta.id);
    console.log(
      `✓ ${doc.meta.id}: ${doc.series.length} pontos até ${doc.meta.rotuloAte ?? doc.meta.serieAte}`
    );
  }
  return feitos;
}
