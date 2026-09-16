import catb from "@data/fiscal/catb.json";
import { REGRAS_IRS, impostoPorEscaloes } from "./irs";

/**
 * Trabalhador independente (recibos verdes, cat. B): regime simplificado
 * com coeficiente 0,75 + Segurança Social de 21,4 % sobre o rendimento
 * relevante (70 % do bruto). Aproximação anual — o apuramento real da SS
 * é trimestral.
 */

interface RegrasCatB {
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  regimeSimplificado: { coeficienteServicos: number; limiteAnual: number };
  segurancaSocial: {
    taxa: number;
    rendimentoRelevante: number;
    baseMinimaIas: number;
    isencaoPrimeirosMeses: number;
  };
  retencaoFonte: { tabela151: number; outros: number };
}

export const REGRAS_CATB = catb as RegrasCatB;

export interface ResultadoIndependente {
  faturacaoAnual: number;
  coletavel: number; // 75 % do bruto
  ss: number; // anual (0 no 1.º ano)
  ssMensal: number;
  irs: number;
  retido: number; // 23 % retido pelos clientes
  reembolsoEstimado: number;
  liquidoAnual: number;
  liquidoMensal12: number;
  pesoTotal: number; // (SS+IRS)/bruto
}

export function simularIndependente(
  faturacaoAnual: number,
  opts: { primeiroAno?: boolean; tipoRetencao?: "tabela151" | "outros"; ano?: number } = {}
): ResultadoIndependente {
  const { primeiroAno = false, tipoRetencao = "tabela151", ano = 2026 } = opts;
  const r = REGRAS_CATB;
  const regras = REGRAS_IRS[ano];
  const ias = regras.ias;

  const ss = primeiroAno
    ? 0
    : Math.max(
        faturacaoAnual * r.segurancaSocial.rendimentoRelevante * r.segurancaSocial.taxa,
        r.segurancaSocial.baseMinimaIas * ias * 12 * r.segurancaSocial.taxa
      );

  const coletavel = faturacaoAnual * r.regimeSimplificado.coeficienteServicos;
  const irs = Math.max(
    0,
    impostoPorEscaloes(coletavel, regras) - regras.despesasGeraisPorTitular
  );
  const retido = faturacaoAnual * r.retencaoFonte[tipoRetencao];

  return {
    faturacaoAnual,
    coletavel,
    ss,
    ssMensal: ss / 12,
    irs,
    retido,
    reembolsoEstimado: retido - irs,
    liquidoAnual: faturacaoAnual - ss - irs,
    liquidoMensal12: (faturacaoAnual - ss - irs) / 12,
    pesoTotal: faturacaoAnual > 0 ? (ss + irs) / faturacaoAnual : 0,
  };
}
