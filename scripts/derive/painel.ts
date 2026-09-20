import path from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import type { RelatorioFrescura } from "./freshness";

/**
 * data/derived/painel.json — a home lê só este ficheiro.
 * Por série: último valor, variação honesta (p.p. quando a unidade é %,
 * % quando é nível), spark com os últimos 24 pontos, selo de frescura
 * do watchdog e fonte clicável. Séries em falta ficam de fora — nunca
 * se inventa um valor.
 */

interface DocSerie {
  meta: {
    fonte?: string;
    url?: string;
    serieAte?: string;
    rotuloAte?: string;
    recolhidoEm?: string;
  };
  series: { t: string; v: number }[];
}

interface PainelSpec {
  id: string;
  /** pasta em data/sources, ou "derived" para data/derived */
  origem: "eurostat" | "bpstat" | "dgeg" | "derived";
  /** unidade curta para o painel (meta.unidade é um código de pipeline) */
  unidade: string;
  /** quantos pontos atrás compara a variação (12=homóloga mensal, 4=tri, 2=sem, 30=dias) */
  varPontos: number;
  /** derivados: ids das séries de entrada — estado = o pior deles */
  inputs?: string[];
  /** referência do mostrador: mediana dos últimos 10 anos da própria
      série, ou o último valor da UE27 (só desemprego PT) */
  ref?: "mediana10" | "ue27";
}

const PAINEL: PainelSpec[] = [
  { id: "hicp-pt-cp00", origem: "eurostat", unidade: "Índice 2025=100", varPontos: 12 },
  { id: "euribor-3m-mensal", origem: "bpstat", unidade: "%", varPontos: 12, ref: "mediana10" },
  { id: "euribor-12m-mensal", origem: "bpstat", unidade: "%", varPontos: 12, ref: "mediana10" },
  { id: "pmd-gasoleo-diario", origem: "dgeg", unidade: "€/L", varPontos: 30 },
  { id: "pmd-gasolina95-diario", origem: "dgeg", unidade: "€/L", varPontos: 30 },
  {
    id: "ca-base", origem: "derived", unidade: "%", varPontos: 12,
    inputs: ["euribor-3m-mensal", "fiscal-ca"],
  },
  // a UE27 vem antes da PT — o desemprego PT refere-se ao último dela
  { id: "une-ue27-total", origem: "eurostat", unidade: "%", varPontos: 12 },
  { id: "une-pt-total", origem: "eurostat", unidade: "%", varPontos: 12, ref: "ue27" },
  { id: "une-pt-jovem", origem: "eurostat", unidade: "%", varPontos: 12 },
  {
    id: "desemprego-gap", origem: "derived", unidade: "p.p.", varPontos: 12,
    inputs: ["une-pt-total", "une-ue27-total"],
  },
  { id: "hpi-pt", origem: "eurostat", unidade: "Índice 2015=100", varPontos: 4 },
  {
    id: "casa-em-salarios", origem: "derived", unidade: "Índice 2015=100", varPontos: 4,
    inputs: ["hpi-pt", "lci-pt-homologo"],
  },
  { id: "pib-pt-homologo", origem: "eurostat", unidade: "% homóloga", varPontos: 1, ref: "mediana10" },
  { id: "lci-pt-homologo", origem: "eurostat", unidade: "% homóloga", varPontos: 1 },
  { id: "confianca-pt", origem: "eurostat", unidade: "saldo", varPontos: 12 },
  { id: "elec-pt-domestico", origem: "eurostat", unidade: "€/kWh", varPontos: 2 },
];

const arred = (v: number, casas = 4) => {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
};

type Estado = "em-dia" | "atrasada" | "sem-sla";

/** mediana simples de uma lista de valores */
const mediana = (vs: number[]) => {
  const o = [...vs].sort((a, b) => a - b);
  const meio = Math.floor(o.length / 2);
  return o.length % 2 ? o[meio] : (o[meio - 1] + o[meio]) / 2;
};

/** pontos dos últimos 10 anos — o ano vem do prefixo "YYYY" do rótulo
    do período (funciona para mensal, trimestral e semestral) */
const ultimos10Anos = (s: { t: string; v: number }[]) => {
  const anoFim = Number(s[s.length - 1].t.slice(0, 4));
  return s.filter((p) => Number(p.t.slice(0, 4)) >= anoFim - 10);
};

const REF_MEDIANA = "mediana 10 anos";

export function runPainel(dataDir: string, frescura: RelatorioFrescura | null, raiz: string) {
  const rotulos: Record<string, { rotulo?: string }> = (() => {
    const f = path.join(raiz, "messages", "pt.json");
    if (!existsSync(f)) return {};
    const pt = JSON.parse(readFileSync(f, "utf8")) as { series?: Record<string, { rotulo?: string }> };
    return pt.series ?? {};
  })();

  const estadoPorId = new Map(frescura?.series.map((s) => [s.id, s.estado]) ?? []);
  const ordem: Estado[] = ["em-dia", "sem-sla", "atrasada"];
  const estadoDe = (spec: PainelSpec): Estado => {
    const directo = estadoPorId.get(spec.id);
    if (directo) return directo;
    if (spec.inputs?.length) {
      return spec.inputs
        .map((i) => estadoPorId.get(i) ?? "sem-sla")
        .sort((a, b) => ordem.indexOf(b) - ordem.indexOf(a))[0] as Estado;
    }
    return "sem-sla";
  };

  const docsPorId = new Map<string, DocSerie>();

  const entradaDe = (
    spec: Pick<PainelSpec, "id" | "unidade" | "varPontos">,
    doc: DocSerie,
    s: { t: string; v: number }[],
    extras: {
      estado?: Estado;
      referencia?: { valor: number; rotulo: string } | null;
    } = {}
  ) => {
    const ultimo = s[s.length - 1];
    const base =
      s.length > spec.varPontos
        ? s[s.length - 1 - spec.varPontos]
        : (s[s.length - 2] ?? ultimo);
    const abs = arred(ultimo.v - base.v);
    // % só com base positiva — sobre saldos/gaps negativos seria enganadora
    const pct = base.v <= 0 ? null : arred((ultimo.v - base.v) / base.v);
    return {
      id: spec.id,
      rotulo: rotulos[spec.id]?.rotulo ?? spec.id,
      valor: ultimo.v,
      unidade: spec.unidade,
      t: ultimo.t,
      rotuloAte: doc.meta.rotuloAte ?? ultimo.t,
      variacao: { abs, pct, periodo: base.t },
      spark: s.slice(-24),
      estado: extras.estado ?? "sem-sla",
      referencia: extras.referencia ?? null,
      fonte: doc.meta.fonte ?? "—",
      url: doc.meta.url ?? "",
      recolhidoEm: doc.meta.recolhidoEm ?? null,
    };
  };

  const series = PAINEL.flatMap((spec) => {
    const file =
      spec.origem === "derived"
        ? path.join(dataDir, "derived", `${spec.id}.json`)
        : path.join(dataDir, "sources", spec.origem, `${spec.id}.json`);
    if (!existsSync(file)) {
      console.warn(`· painel: ${spec.id} em falta — omitido`);
      return [];
    }
    const doc = JSON.parse(readFileSync(file, "utf8")) as DocSerie;
    docsPorId.set(spec.id, doc);
    const s = doc.series;
    if (s.length === 0) return [];

    let referencia: { valor: number; rotulo: string } | null = null;
    if (spec.ref === "mediana10") {
      const janela = ultimos10Anos(s);
      if (janela.length > 0)
        referencia = { valor: arred(mediana(janela.map((p) => p.v)), 2), rotulo: REF_MEDIANA };
    } else if (spec.ref === "ue27") {
      const ue = docsPorId.get("une-ue27-total")?.series;
      const ult = ue?.[ue.length - 1];
      if (ult) referencia = { valor: ult.v, rotulo: "UE27" };
    }

    return [entradaDe(spec, doc, s, { estado: estadoDe(spec), referencia })];
  });

  /* inflacao-homologa — a taxa, não o índice: variação homóloga do
     IHPC em %, spark com os últimos 24 meses DESSA taxa */
  const hicp = docsPorId.get("hicp-pt-cp00");
  if (hicp && hicp.series.length > 13) {
    const s = hicp.series;
    const homologa = s
      .slice(12)
      .map((p, i) => ({ t: p.t, v: arred((p.v / s[i].v - 1) * 100, 2) }));
    const janela = ultimos10Anos(homologa);
    const docSint: DocSerie = { meta: { ...hicp.meta }, series: homologa };
    const idx = series.findIndex((e) => e.id === "hicp-pt-cp00");
    series.splice(idx + 1, 0, {
      ...entradaDe(
        { id: "inflacao-homologa", unidade: "%", varPontos: 12 },
        docSint,
        homologa,
        {
          estado: estadoPorId.get("hicp-pt-cp00") ?? "sem-sla",
          referencia:
            janela.length > 0
              ? { valor: arred(mediana(janela.map((p) => p.v)), 2), rotulo: REF_MEDIANA }
              : null,
        }
      ),
    });
  } else {
    console.warn("· painel: hicp-pt-cp00 em falta — inflacao-homologa omitida");
  }

  /* recolhidoEm global — o máximo dos recolhidoEm das fontes lidas */
  const recolhidoEm =
    [...docsPorId.values()]
      .map((d) => d.meta.recolhidoEm)
      .filter((r): r is string => Boolean(r))
      .sort()
      .at(-1) ?? null;

  const doc = { geradoEm: new Date().toISOString(), recolhidoEm, series };
  const outDir = path.join(dataDir, "derived");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "painel.json"), JSON.stringify(doc, null, 2));
  console.log(`✓ painel.json: ${series.length} instrumentos`);
  return doc;
}
