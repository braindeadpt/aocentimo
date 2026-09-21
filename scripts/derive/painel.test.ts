import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { runPainel } from "./painel";
import type { RelatorioFrescura } from "./freshness";

/**
 * Fixtures mínimas: o painel nunca inventa valores — só transforma
 * o que as fontes trazem (variação honesta, referência, homóloga).
 */

const ARRED = (v: number, casas = 4) => Math.round(v * 10 ** casas) / 10 ** casas;

function escreveSerie(
  dataDir: string,
  pasta: string,
  id: string,
  pontos: { t: string; v: number }[],
  meta: Record<string, string> = {}
) {
  const dir = path.join(dataDir, "sources", pasta);
  if (pasta === "derived") {
    /* derived vive fora de sources */
  }
  const destino =
    pasta === "derived" ? path.join(dataDir, "derived") : dir;
  mkdirSync(destino, { recursive: true });
  writeFileSync(
    path.join(destino, `${id}.json`),
    JSON.stringify({
      meta: { fonte: meta.fonte ?? "Teste", url: "", serieAte: pontos.at(-1)!.t, ...meta },
      series: pontos,
    })
  );
}

const mensais = (n: number, fn: (i: number) => number, fimAno = 2026, fimMes = 8) => {
  const pts: { t: string; v: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const total = fimAno * 12 + (fimMes - 1) - i;
    const a = Math.floor(total / 12);
    const m = (total % 12) + 1;
    pts.push({ t: `${a}-${String(m).padStart(2, "0")}`, v: fn(n - 1 - i) });
  }
  return pts;
};

const frescuraDe = (estados: Record<string, "em-dia" | "atrasada" | "sem-sla">): RelatorioFrescura => ({
  verificadoEm: "2026-09-21T00:00:00Z",
  estado: "ok",
  series: Object.entries(estados).map(([id, estado]) => ({
    id,
    fonte: "teste",
    serieAte: "2026-08",
    esperadoAte: "2026-08",
    frequencia: "mensal",
    estado,
    atrasoPeriodos: 0,
  })),
});

function correCom(fixtures: (dataDir: string) => void, frescura: RelatorioFrescura | null) {
  const raiz = mkdtempSync(path.join(tmpdir(), "painel-"));
  const dataDir = path.join(raiz, "data");
  fixtures(dataDir);
  const doc = runPainel(dataDir, frescura, raiz); // raiz sem messages → rotulo = id
  return doc;
}

describe("runPainel — variação, referência, homóloga", () => {
  it("variação: p.p./abs contra o ponto varPontos atrás; pct=null com base ≤ 0", () => {
    const doc = correCom(
      (d) => {
        escreveSerie(d, "bpstat", "euribor-3m-mensal", mensais(24, (i) => 1 + i * 0.1));
        // saldo negativo: base ≤ 0 → pct tem de ser null, nunca inventado
        escreveSerie(d, "eurostat", "confianca-pt", mensais(24, (i) => -20 + i * 0.5));
      },
      frescuraDe({ "euribor-3m-mensal": "em-dia", "confianca-pt": "em-dia" })
    );
    const eur = doc.series.find((s) => s.id === "euribor-3m-mensal")!;
    // último = 1 + 23*0.1 = 3.3; base = 12 atrás = 1 + 11*0.1 = 2.1
    expect(eur.valor).toBeCloseTo(3.3);
    expect(eur.variacao.abs).toBeCloseTo(1.2);
    expect(eur.variacao.pct).toBeCloseTo(ARRED(1.2 / 2.1));
    expect(eur.variacao.periodo).toBe("2025-08");

    const conf = doc.series.find((s) => s.id === "confianca-pt")!;
    expect(conf.valor).toBeCloseTo(-8.5);
    expect(conf.variacao.abs).toBeCloseTo(6);
    expect(conf.variacao.pct).toBeNull(); // base −14.5 ≤ 0 → sem %
  });

  it("referência: mediana dos últimos 10 anos; desemprego PT refere UE27", () => {
    const doc = correCom(
      (d) => {
        // 13 anos de valores 1…156 (mensal) — mediana da janela 10 a
        escreveSerie(d, "bpstat", "euribor-12m-mensal", mensais(156, (i) => i + 1));
        escreveSerie(d, "eurostat", "une-ue27-total", mensais(24, () => 6.1));
        escreveSerie(d, "eurostat", "une-pt-total", mensais(24, (i) => 10 - i * 0.1));
      },
      frescuraDe({})
    );
    const eur = doc.series.find((s) => s.id === "euribor-12m-mensal")!;
    const janela = mensais(156, (i) => i + 1).filter(
      (p) => Number(p.t.slice(0, 4)) >= 2016
    );
    const med = [...janela.map((p) => p.v)].sort((a, b) => a - b);
    const esperado = med.length % 2
      ? med[Math.floor(med.length / 2)]
      : (med[med.length / 2 - 1] + med[med.length / 2]) / 2;
    expect(eur.referencia).toEqual({
      valor: ARRED(esperado, 2),
      rotulo: "mediana 10 anos",
    });

    const pt = doc.series.find((s) => s.id === "une-pt-total")!;
    expect(pt.referencia).toEqual({ valor: 6.1, rotulo: "UE27" });
  });

  it("inflacao-homologa: entra depois do índice, com a taxa calculada", () => {
    const doc = correCom(
      (d) => {
        escreveSerie(d, "eurostat", "hicp-pt-cp00", mensais(40, (i) => 100 + i));
      },
      frescuraDe({ "hicp-pt-cp00": "em-dia" })
    );
    const idxHicp = doc.series.findIndex((s) => s.id === "hicp-pt-cp00");
    const hom = doc.series[idxHicp + 1];
    expect(hom.id).toBe("inflacao-homologa");
    // último índice = 139 (mês 2026-08); 12 meses antes = 127
    expect(hom.valor).toBeCloseTo(ARRED((139 / 127 - 1) * 100, 2));
    expect(hom.unidade).toBe("%");
    expect(hom.spark).toHaveLength(24);
  });

  it("série em falta fica de fora — nunca se inventa um valor", () => {
    const doc = correCom(
      (d) => escreveSerie(d, "dgeg", "pmd-gasoleo-diario", mensais(24, () => 1.5)),
      frescuraDe({ "pmd-gasoleo-diario": "em-dia" })
    );
    const ids = doc.series.map((s) => s.id);
    expect(ids).toContain("pmd-gasoleo-diario");
    expect(ids).not.toContain("euribor-12m-mensal");
    expect(ids).not.toContain("inflacao-homologa");
  });

  it("derivado herda o pior estado dos inputs", () => {
    const doc = correCom(
      (d) => {
        escreveSerie(d, "derived", "ca-base", mensais(24, (i) => 2 + i * 0.01));
        escreveSerie(d, "bpstat", "euribor-3m-mensal", mensais(24, () => 2));
      },
      frescuraDe({
        "euribor-3m-mensal": "em-dia",
        "fiscal-ca": "atrasada",
      })
    );
    const ca = doc.series.find((s) => s.id === "ca-base")!;
    expect(ca.estado).toBe("atrasada");
  });

  it("grava painel.json no disco com o selo global de recolha", () => {
    const raiz = mkdtempSync(path.join(tmpdir(), "painel-"));
    const dataDir = path.join(raiz, "data");
    escreveSerie(dataDir, "bpstat", "euribor-3m-mensal", mensais(24, () => 3), {
      recolhidoEm: "2026-09-20",
    });
    escreveSerie(dataDir, "dgeg", "pmd-gasoleo-diario", mensais(24, () => 1.5), {
      recolhidoEm: "2026-09-21",
    });
    runPainel(dataDir, frescuraDe({}), raiz);
    const gravado = JSON.parse(
      readFileSync(path.join(dataDir, "derived", "painel.json"), "utf8")
    );
    expect(gravado.recolhidoEm).toBe("2026-09-21");
    expect(gravado.series.length).toBeGreaterThan(0);
  });
});
