/**
 * Os dados das cenas P2b (PACK V5 PRODUÇÃO) — Correios, Bomba e
 * Segurança Social — a porta das montagens `DADOS.aforro`,
 * `DADOS.comb` e `DADOS.mais.ss`/`DADOS.sal` do `montar.cjs`.
 *
 * REGRA Nº1, como em `dados.ts`: nenhum número sai daqui sem vir de
 * `data/` ou de um motor de `src/lib/engines/`. Ficheiro separado de
 * propósito — a P2c trabalha ao mesmo tempo e ninguém deve rebater
 * conflitos por causa de uma cena que não é sua.
 *
 * O que cada cena recebe já PRONTO:
 *
 *   - Correios: a razão IHPC medida (T1 ÷ T0, o mesmo T0 da Mercearia),
 *     a inflação homóloga e os parâmetros dos Certificados de Aforro —
 *     as trajectórias futuras, essas sim, são hipóteses calculadas no
 *     cliente por `trajetoriaCA`/`trajetoriaColchao` (motores puros);
 *   - Bomba: o preço médio de hoje (DGEG), o ISP e o carbono da portaria
 *     em vigor, a decomposição JÁ FEITA por `decomporCombustivel` e as
 *     séries diárias amostradas à semana (compactas: o cliente repõe os
 *     dias com `pontosDeDias` de `utils.ts`);
 *   - Segurança Social: a MESMA linha de salário de referência que a
 *     Fábrica lê de `cenarios-salario.json` (165,00 + 356,25 = 521,25 €)
 *     e o Pedro calculado por `simularIndependente` — a cena nunca
 *     reconta.
 *
 * Este módulo corre SÓ no servidor. Nenhum cliente o importa — AGENTS.md.
 */
import { loadFonte, loadSerie } from "@/lib/data";
import { decomporCombustivel, IVA_NORMAL } from "@/lib/engines/impostos";
import type { DecomposicaoCombustivel } from "@/lib/engines/impostos";
import { simularIndependente } from "@/lib/engines/independente";
import { fmtPct, fmtData } from "@/lib/format";
import caJson from "@data/fiscal/ca.json";
import capitaisJson from "@data/fiscal/capitais.json";
import ispJson from "@data/fiscal/isp.json";
import ssJson from "@data/fiscal/ss.json";
import catbJson from "@data/fiscal/catb.json";
import irsJson from "@data/fiscal/irs-2026.json";
import cenariosJson from "@data/derived/cenarios-salario.json";
import { T0_MERC } from "./dados";

/* ————— Correios · a poupança e o poder de compra ————— */

/** Um prémio de permanência dos CA (o `de`/`ate` em anos de vida). */
export interface PremioCA {
  de: number;
  ate: number;
  /** Pontos percentuais a somar à taxa base (0,25 = +0,25 p.p.). */
  pp: number;
}

export interface DadosCorreios {
  /** O montante do exemplo da Dona Arminda — é EXEMPLO, a cena diz-o. */
  cap0: number;
  /** O mês «então» (o T0 da Mercearia — a mesma data, a mesma história). */
  mesT0: string;
  /** O mês «hoje» — o último ponto real do IHPC, ou null. */
  mesT1: string | null;
  /** IHPC(T1) ÷ IHPC(T0) — a subida MEDIDA dos preços, ou null. */
  razaoTotal: number | null;
  /** A inflação homóloga (últimos 12 meses), como fracção, ou null. */
  inflacaoAnual: number | null;
  /** Os parâmetros dos Certificados de Aforro série F, ou null. */
  ca: {
    taxa: number;
    premios: PremioCA[];
    /** Retenção liberatória sobre os juros (0,28). */
    imposto: number;
    vigencia: string;
    garantia: string;
  } | null;
  fonte: string;
}

export function dadosCorreios(): DadosCorreios {
  const cp00 = loadSerie("cp00");
  const a = cp00?.series.find((p) => p.t === T0_MERC);
  const b = cp00?.series[cp00.series.length - 1];
  const n = cp00?.series.length ?? 0;
  const ca = caJson.serieF;
  const imposto = capitaisJson.retencaoLiberatoria.taxa;
  return {
    cap0: 10000,
    mesT0: T0_MERC,
    mesT1: b?.t ?? null,
    razaoTotal: a && b ? b.v / a.v : null,
    // a homóloga dos últimos 12 meses — o mesmo «Tano» do protótipo
    inflacaoAnual:
      cp00 && n > 12 ? cp00.series[n - 1].v / cp00.series[n - 13].v - 1 : null,
    ca: {
      taxa: ca.taxaBrutaNovasSubscricoes,
      premios: ca.premiosPermanencia.map((p) => ({ de: p.de, ate: p.ate, pp: p.pp })),
      imposto,
      vigencia: caJson.vigencia,
      garantia: ca.garantia,
    },
    fonte: `IGCP · Certificados de Aforro série F, taxa em vigor desde ${fmtData(caJson.vigencia)} e prémios de permanência · retenção liberatória de ${fmtPct(imposto, 0)} sobre os juros (art. 71.º do CIRS) · inflação: Eurostat, índice harmonizado de preços, Portugal · ${T0_MERC} → ${b?.t ?? "—"}`,
  };
}

/* ————— Bomba · o litro por dentro ————— */

/**
 * Uma série DIÁRIA amostrada à semana, compacta: `v[k]` é o dia
 * `inicio + 7k`, menos o último ponto, que é o dia `fim` mesmo que o
 * passo não feche a semana certa (o `k % 7 === 0 || último` do protótipo).
 * O cliente repõe os dias com `pontosDeDias` de `utils.ts`.
 */
export interface SerieDias {
  /** O primeiro dia, `AAAA-MM-DD`. */
  inicio: string;
  /** O último dia REAL da série — pode não ser inicio + 7·(n−1). */
  fim: string;
  v: number[];
}

/** A decomposição do litro, já calculada pelo motor — mais a fatia do IVA que incide sobre os outros impostos. */
export interface DecCombustivel extends DecomposicaoCombustivel {
  /** (ISP + carbono) × taxa de IVA — o «imposto sobre imposto». */
  ivaSobreImp: number;
}

export interface CombCena {
  id: "gasolina" | "gasoleo";
  nome: string;
  /** O preço médio nacional de hoje (último ponto DGEG), ou null. */
  preco: number | null;
  /** O dia desse preço, `AAAA-MM-DD`, ou null. */
  data: string | null;
  isp: number;
  carbono: number;
  /** A nota da portaria (o texto de isp.json), para a nota de rodapé. */
  notaIsp: string;
  /** A decomposição do litro — null quando falta o preço. */
  dec: DecCombustivel | null;
  serie: SerieDias | null;
}

export interface DadosBomba {
  /** O depósito do exemplo — 50 litros, dito no texto como exemplo. */
  litros: number;
  /** A taxa normal do IVA. */
  iva: number;
  /** A vigência da portaria do ISP em vigor (`AAAA-MM-DD`). */
  ispVigencia: string;
  gasolina: CombCena;
  gasoleo: CombCena;
  fonte: string;
}

/** Os pontos semanais de uma série diária (a amostragem do protótipo). */
function semanal(serie: { t: string; v: number }[]): SerieDias | null {
  if (!serie.length) return null;
  const v = serie.filter((_, k, arr) => k % 7 === 0 || k === arr.length - 1).map((p) => p.v);
  return { inicio: serie[0].t, fim: serie[serie.length - 1].t, v };
}

function combustivel(
  id: "gasolina" | "gasoleo",
  nome: string,
  ficheiro: string,
  fiscal: { ispELitro: number; carbonoELitro: number; nota: string },
  iva: number
): CombCena {
  const s = loadFonte("dgeg", ficheiro);
  const ultimo = s?.series[s.series.length - 1];
  const preco = ultimo?.v ?? null;
  const dec = preco === null ? null : { ...decomporCombustivel(preco, fiscal.ispELitro, fiscal.carbonoELitro, iva), ivaSobreImp: (fiscal.ispELitro + fiscal.carbonoELitro) * iva };
  return {
    id,
    nome,
    preco,
    data: ultimo?.t ?? null,
    isp: fiscal.ispELitro,
    carbono: fiscal.carbonoELitro,
    notaIsp: fiscal.nota,
    dec,
    serie: s ? semanal(s.series) : null,
  };
}

export function dadosBomba(): DadosBomba {
  const iva = IVA_NORMAL;
  const gasolina = combustivel("gasolina", "Gasolina 95", "pmd-gasolina95-diario", ispJson.gasolina95, iva);
  const gasoleo = combustivel("gasoleo", "Gasóleo", "pmd-gasoleo-diario", ispJson.gasoleo, iva);
  return {
    litros: 50,
    iva,
    ispVigencia: ispJson.vigencia,
    gasolina,
    gasoleo,
    fonte: `DGEG · preço médio de venda ao público, média nacional diária (${fmtData(gasolina.data ?? "")}) · ISP e taxa de carbono: portaria em vigor desde ${fmtData(ispJson.vigencia)} (${ispJson.fonte}) · IVA: Código do IVA, taxa normal`,
  };
}

/* ————— Segurança Social · o recibo e o bolo comum ————— */

export interface DadosSegSocial {
  /** A linha do salário de referência — A MESMA que a Fábrica mostra. */
  ines: { bruto: number; ss: number; tsu: number; custo: number } | null;
  /** O Pedro a recibos verdes, por `simularIndependente` no servidor. */
  pedro: { fatura: number; ssMensal: number; por100: number } | null;
  taxas: {
    /** TSU trabalhador (11 %) e entidade (23,75 %) — ss.json. */
    trab: number;
    emp: number;
    /** Recibos verdes — catb.json: taxa, rendimento relevante, base mínima, isenção. */
    catbTaxa: number;
    catbRr: number;
    baseMinIas: number;
    ias: number;
    isencao: number;
    /** Retenção na fonte de profissionais do art. 151.º (23 %). */
    retencao: number;
  };
  fonte: string;
}

export function dadosSegSocial(): DadosSegSocial {
  const cen = cenariosJson as {
    meta: { brutoRef: number; ano: number };
    linhas: { bruto: number; custo: number; tsu: number; ss: number }[];
  };
  const l = cen.linhas.find((x) => x.bruto === cen.meta.brutoRef);
  const ines = l ? { bruto: l.bruto, ss: l.ss, tsu: l.tsu, custo: l.custo } : null;
  // o Pedro fatura o mesmo bruto mensal da Inês — «se faturar os mesmos
  // 1 500 €»; a conta vem TODA do motor, a cena só lê ssMensal
  const sim = ines ? simularIndependente(ines.bruto * 12) : null;
  const pedro =
    ines && sim
      ? { fatura: ines.bruto, ssMensal: sim.ssMensal, por100: (sim.ssMensal / ines.bruto) * 100 }
      : null;
  return {
    ines,
    pedro,
    taxas: {
      trab: ssJson.trabalhador.taxa,
      emp: ssJson.entidadePatronal.taxa,
      catbTaxa: catbJson.segurancaSocial.taxa,
      catbRr: catbJson.segurancaSocial.rendimentoRelevante,
      baseMinIas: catbJson.segurancaSocial.baseMinimaIas,
      ias: irsJson.ias,
      isencao: catbJson.segurancaSocial.isencaoPrimeirosMeses,
      retencao: catbJson.retencaoFonte.tabela151,
    },
    fonte: `Código dos Regimes Contributivos (${fmtPct(ssJson.trabalhador.taxa, 0)} e ${fmtPct(ssJson.entidadePatronal.taxa, 2)}); recibos verdes: art. 168.º do Código Contributivo (${fmtPct(catbJson.segurancaSocial.taxa, 1)} sobre ${fmtPct(catbJson.segurancaSocial.rendimentoRelevante, 0)} do faturado) · salário da Inês: motores AO CÊNTIMO, regras de ${cen.meta.ano}`,
  };
}
