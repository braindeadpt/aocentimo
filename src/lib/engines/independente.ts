import catb from "@data/fiscal/catb.json";
import { REGRAS_IRS, impostoPorEscaloes, abatimentoMinimoExistencia } from "./irs";

/**
 * Trabalhador independente (recibos verdes, cat. B): regime simplificado
 * com coeficiente 0,75, abatimento por mínimo de existência (art. 70.º CIRS
 * para profissões do art. 151.º), dispensa de retenção na fonte até ao
 * limiar do art. 101.º-B CIRS e Segurança Social de 21,4 % sobre o
 * rendimento relevante (70 % do bruto, ajustável em ±25 % nos termos do
 * art. 164.º do Código Contributivo, respeitando a base mínima legal).
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
    variacaoEscalaoSS: number[];
  };
  retencaoFonte: {
    tabela151: number;
    outros: number;
    dispensaRetencaoAte: number;
  };
}

export const REGRAS_CATB = catb as RegrasCatB;

export interface OpcoesIndependente {
  primeiroAno?: boolean;
  tipoRetencao?: "tabela151" | "outros";
  /** Dispensa de retenção (CIRS art. 101.º-B); por omissão `faturacaoAnual <= dispensaRetencaoAte`. */
  dispensaRetencao?: boolean;
  /** Variação opcional da base de incidência da SS entre −0,25 e +0,25 (CRC art. 164.º). */
  ajusteSS?: number;
  ano?: number;
}

export interface ResultadoIndependente {
  faturacaoAnual: number;
  coletavel: number; // 75 % do bruto, após abatimento por mínimo de existência quando aplicável
  ss: number; // anual (0 no 1.º ano)
  ssMensal: number;
  irs: number;
  retido: number; // 23 % retido pelos clientes (0 se dispensado)
  reembolsoEstimado: number;
  liquidoAnual: number;
  liquidoMensal12: number;
  pesoTotal: number; // (SS+IRS)/bruto
}

export function simularIndependente(
  faturacaoAnual: number,
  opts: OpcoesIndependente = {}
): ResultadoIndependente {
  const {
    primeiroAno = false,
    tipoRetencao = "tabela151",
    dispensaRetencao,
    ajusteSS = 0,
    ano = 2026,
  } = opts;
  const r = REGRAS_CATB;
  const regras = REGRAS_IRS[ano];
  const ias = regras.ias;

  const vars = r.segurancaSocial.variacaoEscalaoSS;
  const minVar = Math.min(...vars);
  const maxVar = Math.max(...vars);
  const ajuste = Math.min(maxVar, Math.max(minVar, ajusteSS));

  const ss = primeiroAno
    ? 0
    : Math.max(
        faturacaoAnual *
          r.segurancaSocial.rendimentoRelevante *
          (1 + ajuste) *
          r.segurancaSocial.taxa,
        r.segurancaSocial.baseMinimaIas * ias * 12 * r.segurancaSocial.taxa
      );

  const coletavelBruto = faturacaoAnual * r.regimeSimplificado.coeficienteServicos;
  const aplicaME =
    tipoRetencao === "tabela151" &&
    faturacaoAnual <= regras.minimoExistencia.naoAplicaAcimaPorTitular;
  const abatME = aplicaME
    ? abatimentoMinimoExistencia(
        faturacaoAnual,
        faturacaoAnual - coletavelBruto,
        regras
      )
    : 0;
  const coletavel = Math.max(0, coletavelBruto - abatME);

  const irs = Math.max(
    0,
    impostoPorEscaloes(coletavel, regras) - regras.despesasGeraisPorTitular
  );
  const dispensado =
    dispensaRetencao ?? faturacaoAnual <= r.retencaoFonte.dispensaRetencaoAte;
  const retido = dispensado ? 0 : faturacaoAnual * r.retencaoFonte[tipoRetencao];

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
