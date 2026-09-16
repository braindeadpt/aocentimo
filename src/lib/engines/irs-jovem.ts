import irsJovem from "@data/fiscal/irs-jovem.json";
import { REGRAS_IRS, impostoPorEscaloes, abatimentoMinimoExistencia } from "./irs";
import { TSU_TRABALHADOR } from "./seg-social";

/**
 * IRS Jovem (art. 12.º-B CIRS): isenção parcial dos rendimentos de
 * trabalho (cat. A/B) até aos 35 anos, nos 10 primeiros anos de rendimentos.
 *
 * Mecânica implementada: o rendimento isento (pct × bruto, limitado a
 * 55×IAS) sai do coletável, mas engloba para fixar a taxa — tributa-se a
 * parte não isenta à taxa média do coletável total (art. 22.º n.º 4).
 */

export interface RegrasIrsJovem {
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  idadeMax: number;
  anosMax: number;
  limiteIsencaoIas: number;
  isencaoPorAno: number[]; // índice 0 = 1.º ano de gozo
}

export const REGRAS_IRS_JOVEM = irsJovem as RegrasIrsJovem;

export function pctIsencao(anoGozo: number): number {
  if (anoGozo < 1 || anoGozo > REGRAS_IRS_JOVEM.anosMax) return 0;
  return REGRAS_IRS_JOVEM.isencaoPorAno[anoGozo - 1];
}

export interface ResultadoIrsJovem {
  anoGozo: number;
  pctIsencao: number;
  rendimentoIsento: number;
  coletavelTributado: number;
  irsSemJovem: number;
  irsComJovem: number;
  poupancaAnual: number;
}

/**
 * IRS anual de um titular não casado com IRS Jovem no ano de gozo indicado
 * (1–10). Aproximação documentada: um titular, sem dependentes, dedução
 * específica fixa, deduções à coleta de despesas gerais.
 */
export function simularIrsJovem(
  brutoAnual: number,
  anoGozo: number,
  ano = 2026
): ResultadoIrsJovem {
  const regras = REGRAS_IRS[ano];
  const pct = pctIsencao(anoGozo);
  const limite = REGRAS_IRS_JOVEM.limiteIsencaoIas * regras.ias;

  const isento = Math.min(pct * brutoAnual, limite);

  // coletável total (como se não houvesse isenção) — fixa a taxa média
  const contrib = brutoAnual * TSU_TRABALHADOR;
  const de = Math.max(regras.deducaoEspecificaFixa, contrib);
  const abat =
    brutoAnual <= regras.minimoExistencia.naoAplicaAcimaPorTitular
      ? abatimentoMinimoExistencia(brutoAnual, de, regras)
      : 0;
  const coletavelTotal = Math.max(0, brutoAnual - de - abat);

  const irsSem = Math.max(
    0,
    impostoPorEscaloes(coletavelTotal, regras) - regras.despesasGeraisPorTitular
  );

  const coletavelTrib = Math.max(0, coletavelTotal - isento);
  const taxaMedia =
    coletavelTotal > 0 ? impostoPorEscaloes(coletavelTotal, regras) / coletavelTotal : 0;
  const irsCom = Math.max(
    0,
    taxaMedia * coletavelTrib - regras.despesasGeraisPorTitular
  );

  return {
    anoGozo,
    pctIsencao: pct,
    rendimentoIsento: isento,
    coletavelTributado: coletavelTrib,
    irsSemJovem: irsSem,
    irsComJovem: irsCom,
    poupancaAnual: irsSem - irsCom,
  };
}
