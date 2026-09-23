import desemprego from "@data/fiscal/desemprego.json";
import smn from "@data/fiscal/smn.json";
import { retencaoNaFonte, SituacaoRetencao } from "./retencao";
import { REGRAS_IRS } from "./irs";
import { TSU_TRABALHADOR } from "./seg-social";

/**
 * Subsídio de desemprego (DL 220/2006 + Guia Prático Seg. Social).
 * Regras versionadas em data/fiscal/desemprego.json.
 */

interface LinhaDuracao {
  idadeAte: number | null;
  duracao: number[]; // [<15m, 15–24m, ≥24m]
  acrescimoPorCincoAnos: number;
}

interface RegrasDesemprego {
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  prazoGarantia: { dias: number; meses: number };
  montante: { percentagemRR: number };
  limites: {
    maximoIas: number;
    maximoRRliquida: number;
    minimoIas: number;
    minimoSeSalarioMinimoIas: number;
  };
  reducaoApos180Dias: number;
  majoracao: { taxa: number };
  duracao: { linhas: LinhaDuracao[] };
}

export const REGRAS_DESEMPREGO = desemprego as RegrasDesemprego;

export interface ResultadoDesemprego {
  remReferencia: number; // RR ilíquida
  remReferenciaLiquida: number;
  mensal: number;
  apos180Dias: number; // −10 %
  duracaoDias: number;
  elegivel: boolean;
  nota?: string;
}

/** Dias de subsídio por idade e anos de descontos nos últimos 20 anos. */
export function duracaoSubsidio(idade: number, anosDescontos: number): number {
  const linha = REGRAS_DESEMPREGO.duracao.linhas.find(
    (l) => l.idadeAte === null || idade <= l.idadeAte
  );
  if (!linha) return 0;
  const meses = anosDescontos * 12;
  const idx = meses < 15 ? 0 : meses < 24 ? 1 : 2;
  return (
    linha.duracao[idx] +
    Math.floor(anosDescontos / 5) * linha.acrescimoPorCincoAnos
  );
}

/**
 * RR = bruto × 14/12 (salário estável, com subsídios de férias e Natal).
 * RR líquida = RR − SS 11 % − retenção de IRS. Montante = 65 % RR, entre
 * os limites do IAS; majoração de 10 % para casal desempregado com filhos
 * ou agregado monoparental.
 */
export function simularDesemprego(
  brutoMensal: number,
  idade: number,
  anosDescontos: number,
  opts: { situacao?: SituacaoRetencao; majoracao?: boolean; ano?: number } = {}
): ResultadoDesemprego {
  const { situacao = "naoCasado", majoracao = false, ano = 2026 } = opts;
  const r = REGRAS_DESEMPREGO;
  const ias = REGRAS_IRS[ano].ias;
  const salarioMinimo = smn.regioes.continente;

  const elegivel = anosDescontos * 12 >= r.prazoGarantia.dias / 30;

  const rr = (brutoMensal * 14) / 12;
  const ret = retencaoNaFonte(rr, situacao, 0, ano);
  const rrLiquida = rr - rr * TSU_TRABALHADOR - ret.retencao;

  let mensal = r.montante.percentagemRR * rr;
  mensal = Math.min(mensal, r.limites.maximoIas * ias, r.limites.maximoRRliquida * rrLiquida);

  const minimo =
    brutoMensal >= salarioMinimo
      ? r.limites.minimoSeSalarioMinimoIas * ias
      : r.limites.minimoIas * ias;
  mensal = Math.max(mensal, Math.min(minimo, rrLiquida));

  if (majoracao) mensal *= 1 + r.majoracao.taxa;

  return {
    remReferencia: rr,
    remReferenciaLiquida: rrLiquida,
    mensal,
    apos180Dias: mensal * (1 - r.reducaoApos180Dias),
    duracaoDias: duracaoSubsidio(idade, anosDescontos),
    elegivel,
    nota: elegivel
      ? undefined
      : "Sem 360 dias de descontos nos últimos 24 meses — verifica o Subsídio Social de Desemprego",
  };
}
