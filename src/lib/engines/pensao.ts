import adseJson from "@data/fiscal/adse.json";
import regioes2026 from "@data/fiscal/regioes-autonomas-2026.json";
import retencaoPensoes2026 from "@data/fiscal/retencao-pensoes-2026.json";
import {
  REGRAS_IRS,
  abatimentoMinimoExistencia,
  escalaoMarginal,
  impostoPorEscaloes,
  type RegrasIRS,
  type ResultadoSalario,
  type ResultadoTitular,
} from "./irs";
import type { LinhaRetencao, SituacaoRetencao } from "./retencao";

/**
 * Motor fiscal de Pensões (Categoria H) — Despacho n.º 233-A/2026
 * (Tabelas VIII e IX, continente, sem deficiência), dedução específica
 * do art. 53.º do CIRS (4 587,09 € = 8,54 × IAS em 2026), isenção de
 * contribuições TSU e desconto facultativo ADSE (3,5 % × 14 meses com
 * limiar de salvaguarda de 635,00 € do DL n.º 118/83 art. 47.º).
 */

export type TabelaPensaoId = "VIII" | "IX";
export type ModoDuodecimos = "14" | "50" | "100";
export type RegiaoFiscal = "continente" | "acores" | "madeira";

export interface TabelaRetencaoPensao {
  titulo: string;
  aplica: SituacaoRetencao[];
  parcelaAdicionalDependente: Partial<Record<SituacaoRetencao, number>>;
  linhas: LinhaRetencao[];
}

export interface RegrasRetencaoPensoes {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  ambito: string;
  formula: string;
  regras: {
    dependentes: Record<SituacaoRetencao, number> & { nota: string };
    dependenteDeficiencia60: {
      naoCasadoOuCasadoUnicoTitular: number;
      casadoDoisTitulares: number;
      nota: string;
    };
    deducaoEspecificaPensao: {
      valor: number;
      baseLegal: string;
      nota: string;
    };
  };
  tabelas: Record<TabelaPensaoId, TabelaRetencaoPensao>;
}

export const REGRAS_RETENCAO_PENSOES: Record<number, RegrasRetencaoPensoes> = {
  2026: retencaoPensoes2026 as unknown as RegrasRetencaoPensoes,
};

export const TAXA_ADSE = adseJson.beneficiariosTitulares.taxaDesconto;
export const LIMIAR_SALVAGUARDA_ADSE_PENSAO =
  adseJson.beneficiariosTitulares.limiarSalvaguardaPensoes;
export const DEDUCAO_ESPECIFICA_PENSAO_2026 =
  retencaoPensoes2026.regras.deducaoEspecificaPensao.valor;

/** Tabela VIII: não casado ou casado dois titulares; Tabela IX: casado único titular. */
export function tabelaPensaoAplicavel(
  situacao: SituacaoRetencao
): TabelaPensaoId {
  return situacao === "casadoUnicoTitular" ? "IX" : "VIII";
}

export interface ResultadoRetencaoPensao {
  tabela: TabelaPensaoId;
  taxaMarginal: number;
  parcelaAbater: number;
  parcelaDependente: number;
  retencao: number;
  taxaEfetiva: number;
  escalaoAte: number | null;
}

/**
 * Retenção mensal na fonte sobre pensões (Categoria H, continente, 2026).
 * Aplica as Tabelas VIII e IX do Despacho n.º 233-A/2026, incluindo as
 * fórmulas de transição `taxa × fator × (limiar − R)` entre 920 € e 1 100 €.
 */
export function retencaoPensaoNaFonte(
  pensaoMensal: number,
  situacao: SituacaoRetencao,
  dependentes = 0,
  ano = 2026
): ResultadoRetencaoPensao {
  const regras = REGRAS_RETENCAO_PENSOES[ano];
  if (!regras) {
    throw new Error(`Tabelas de retenção de pensões para ${ano} não disponíveis`);
  }

  const tabelaId = tabelaPensaoAplicavel(situacao);
  const tabela = regras.tabelas[tabelaId];
  const R = Math.max(0, pensaoMensal);
  const linha = tabela.linhas.find((l) => l.ate === null || R <= l.ate);
  if (!linha) {
    throw new Error(`Pensão ${pensaoMensal} fora das tabelas`);
  }

  const taxaMarginal = linha.taxaMarginal;
  const parcelaAbater =
    linha.parcelaAbater ??
    (linha.parcelaAbaterFormula
      ? linha.parcelaAbaterFormula.taxa *
        linha.parcelaAbaterFormula.fator *
        (linha.parcelaAbaterFormula.limiar - R)
      : 0);

  const parcelaUnitDep =
    tabela.parcelaAdicionalDependente[situacao] ??
    regras.regras.dependentes[situacao] ??
    0;
  const parcelaDependente = parcelaUnitDep * Math.max(0, dependentes);

  const retencao = Math.max(
    0,
    R * taxaMarginal - parcelaAbater - parcelaDependente
  );

  return {
    tabela: tabelaId,
    taxaMarginal,
    parcelaAbater,
    parcelaDependente,
    retencao,
    taxaEfetiva: R > 0 ? retencao / R : 0,
    escalaoAte: linha.ate,
  };
}

/**
 * Desconto facultativo de ADSE (3,5 %) nas pensões, respeitando o limiar
 * de salvaguarda legal de 635,00 € (DL n.º 118/83 art. 47.º): da aplicação
 * do desconto não pode resultar pensão inferior a 635,00 €.
 */
export function descontoAdsePensao(
  pensaoMensal: number,
  comAdse = false
): number {
  if (!comAdse || pensaoMensal <= LIMIAR_SALVAGUARDA_ADSE_PENSAO) return 0;
  const brutoDesconto = pensaoMensal * TAXA_ADSE;
  return Math.max(
    0,
    Math.min(brutoDesconto, pensaoMensal - LIMIAR_SALVAGUARDA_ADSE_PENSAO)
  );
}

export interface InputReciboPensao {
  bruto: number;
  situacao?: SituacaoRetencao;
  dependentes?: number;
  adse?: boolean;
  duodecimos?: ModoDuodecimos;
  ano?: number;
}

export interface ResultadoReciboPensao {
  bruto: number;
  duodecimosMensal: number;
  brutoComDuodecimos: number;
  ss: number;
  adse: number;
  retencaoBase: number;
  retencaoDuodecimos: number;
  retencao: number;
  taxaEfetiva: number;
  tabela: TabelaPensaoId;
  liquido: number;
  liquidoSemDuodecimos: number;
}

/**
 * Recibo mensal de pensão (Cat. H). As pensões não descontam os 11 % de TSU
 * para a Segurança Social; retêm IRS pelas Tabelas VIII/IX e descontam 3,5 %
 * se o pensionista for beneficiário titular da ADSE (com salvaguarda aos 635 €).
 * Em duodécimos (art. 99.º-C CIRS), a fração dos subsídios retém autonomamente.
 */
export function reciboPensaoMensal(
  input: InputReciboPensao
): ResultadoReciboPensao {
  const {
    bruto,
    situacao = "naoCasado",
    dependentes = 0,
    adse = false,
    duodecimos = "14",
    ano = 2026,
  } = input;

  const fatorDuo = duodecimos === "100" ? 2 / 12 : duodecimos === "50" ? 1 / 12 : 0;
  const duodecimosMensal = bruto * fatorDuo;
  const brutoComDuodecimos = bruto + duodecimosMensal;

  const retBase = retencaoPensaoNaFonte(bruto, situacao, dependentes, ano);
  // Retenção autónoma sobre a fração de subsídios paga em duodécimos (art. 99.º-C CIRS)
  const retencaoDuodecimos = retBase.retencao * fatorDuo;
  const retencao = retBase.retencao + retencaoDuodecimos;

  const adseBase = descontoAdsePensao(bruto, adse);
  const adseDuo = adseBase * fatorDuo;
  const adseTotal = adseBase + adseDuo;

  const liquidoSemDuodecimos = bruto - adseBase - retBase.retencao;
  const liquido = brutoComDuodecimos - adseTotal - retencao;

  return {
    bruto,
    duodecimosMensal,
    brutoComDuodecimos,
    ss: 0,
    adse: adseTotal,
    retencaoBase: retBase.retencao,
    retencaoDuodecimos,
    retencao,
    taxaEfetiva:
      brutoComDuodecimos > 0 ? retencao / brutoComDuodecimos : 0,
    tabela: retBase.tabela,
    liquido,
    liquidoSemDuodecimos,
  };
}

function regrasIrsParaRegiao(regras: RegrasIRS, regiao: RegiaoFiscal): RegrasIRS {
  if (regiao !== "acores") return regras;
  const red = regioes2026.irs.acores.reducaoGeralEscaloesPct; // 0.30
  const fator = 1 - red;
  return {
    ...regras,
    escaloes: regras.escaloes.map((e) => ({
      ...e,
      taxa: Number((e.taxa * fator).toFixed(6)),
      taxaMedia: e.taxaMedia !== null ? Number((e.taxaMedia * fator).toFixed(6)) : null,
    })),
    solidariedade: regras.solidariedade.map((s) => ({
      ...s,
      taxa: Number((s.taxa * fator).toFixed(6)),
    })),
  };
}

export interface OpcoesPensao {
  adse?: boolean;
  regiao?: RegiaoFiscal;
}

/**
 * Liquidação anual estimada de IRS para pensões (Categoria H, art. 53.º CIRS).
 * Dedução específica de 4 587,09 € (8,54 × IAS em 2026) por titular, abatimento
 * por mínimo de existência (art. 70.º CIRS), escalões do art. 68.º (com redução
 * de 30 % nos Açores pelo DLR 15-A/2021/A) e deduções à coleta.
 */
export function simularPensao(
  pensoesMensais: number[],
  dependentes: number,
  ano = 2026,
  meses = 14,
  opts: OpcoesPensao = {}
): ResultadoSalario {
  const regrasBase = REGRAS_IRS[ano];
  if (!regrasBase) throw new Error(`Regras de IRS para ${ano} não disponíveis`);
  const regras = regrasIrsParaRegiao(regrasBase, opts.regiao ?? "continente");
  const dedEspPensao =
    REGRAS_RETENCAO_PENSOES[ano]?.regras.deducaoEspecificaPensao.valor ??
    DEDUCAO_ESPECIFICA_PENSAO_2026;

  const brutosAnuais = pensoesMensais.map((p) => p * meses);
  const rbTotal = brutosAnuais.reduce((a, b) => a + b, 0);
  const nTitulares = brutosAnuais.length;
  const me = regras.minimoExistencia;
  const aplicaME = rbTotal <= me.naoAplicaAcimaPorTitular * nTitulares;

  const titulares: ResultadoTitular[] = pensoesMensais.map((pm, idx) => {
    const rb = brutosAnuais[idx];
    // Nas pensões não há 11 % de SS; se tiver ADSE, desconta 3,5 % × 14 meses (c/ salvaguarda)
    const adseMensal = idx === 0 ? descontoAdsePensao(pm, opts.adse) : 0;
    const quotizacoes = adseMensal * meses;
    const de = Math.max(dedEspPensao, quotizacoes);
    const abat = aplicaME ? abatimentoMinimoExistencia(rb, de, regrasBase) : 0;
    const coletavel = Math.max(0, rb - de - abat);
    return {
      brutoAnual: rb,
      deducaoEspecifica: de,
      abatimentoME: abat,
      coletavel,
      ss: quotizacoes,
    };
  });

  const coletavelTotal = titulares.reduce((a, t) => a + t.coletavel, 0);
  const coletavelTributado =
    nTitulares === 2 ? coletavelTotal / 2 : coletavelTotal;

  let irsBruto = impostoPorEscaloes(coletavelTributado, regras);
  if (nTitulares === 2) irsBruto *= 2;

  const deducoesColeta =
    regras.despesasGeraisPorTitular * nTitulares +
    regras.deducaoPorDependente * dependentes;

  const irsAnual = Math.max(0, irsBruto - deducoesColeta);
  const adseAnual = titulares.reduce((a, t) => a + t.ss, 0);
  const liquidoAnual = rbTotal - adseAnual - irsAnual;

  return {
    titulares,
    brutoAnualTotal: rbTotal,
    ssAnual: adseAnual,
    coletavelTributado,
    irsBruto,
    deducoesColeta,
    irsAnual,
    liquidoAnual,
    liquidoMensal14: liquidoAnual / meses,
    liquidoMensal12: liquidoAnual / 12,
    taxaEfetiva: rbTotal > 0 ? irsAnual / rbTotal : 0,
    taxaMarginal: escalaoMarginal(coletavelTributado, regras).taxa,
    custoEmpresaAnual: rbTotal,
    pesoEstado: rbTotal > 0 ? (irsAnual + adseAnual) / rbTotal : 0,
  };
}
