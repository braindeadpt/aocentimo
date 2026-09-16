import sa from "@data/fiscal/subsidio-alimentacao.json";
import { retencaoNaFonte, SituacaoRetencao, TabelaId } from "./retencao";
import { TSU_TRABALHADOR, TSU_ENTIDADE } from "./seg-social";
import { pctIsencao } from "./irs-jovem";

/**
 * Recibo de vencimento mensal: bruto + subsídio de alimentação − SS −
 * retenção na fonte real (tabelas do Despacho 233-A/2026). O excedente do
 * subs. de alimentação acima do limite isento tributa como salário
 * (IRS + TSU). Com IRS Jovem, a taxa efetiva do total aplica-se só à
 * parte não isenta (orientação AT).
 */

export type FormaPagamentoSA = "dinheiro" | "cartao";

export const LIMITE_SA = sa.isentoPorDia;

export interface InputRecibo {
  bruto: number;
  situacao?: SituacaoRetencao;
  dependentes?: number;
  saPorDia?: number;
  formaSA?: FormaPagamentoSA;
  diasTrabalho?: number;
  anoIrsJovem?: number; // 0 = sem IRS Jovem; 1–10 = ano de gozo
  ano?: number;
}

export interface ResultadoRecibo {
  bruto: number;
  saTotal: number;
  saIsento: number;
  saTributavel: number;
  ss: number;
  retencao: number;
  taxaEfetiva: number;
  tabela: TabelaId;
  liquido: number;
  tsuEntidade: number;
  custoEmpresa: number;
}

export function reciboMensal(input: InputRecibo): ResultadoRecibo {
  const {
    bruto,
    situacao = "naoCasado",
    dependentes = 0,
    saPorDia = 0,
    formaSA = "cartao",
    diasTrabalho = 22,
    anoIrsJovem = 0,
    ano = 2026,
  } = input;

  const limite = LIMITE_SA[formaSA];
  const saTotal = saPorDia * diasTrabalho;
  const saIsento = Math.min(saPorDia, limite) * diasTrabalho;
  const saTributavel = saTotal - saIsento;

  // remuneração sujeita a descontos: salário + excedente do subsídio
  const base = bruto + saTributavel;
  const ss = base * TSU_TRABALHADOR;

  const ret = retencaoNaFonte(base, situacao, dependentes, ano);
  const retencao = ret.retencao * (1 - pctIsencao(anoIrsJovem));

  const liquido = bruto + saTotal - ss - retencao;
  const tsuEntidade = base * TSU_ENTIDADE;

  return {
    bruto,
    saTotal,
    saIsento,
    saTributavel,
    ss,
    retencao,
    taxaEfetiva: ret.taxaEfetiva * (1 - pctIsencao(anoIrsJovem)),
    tabela: ret.tabela,
    liquido,
    tsuEntidade,
    custoEmpresa: base + tsuEntidade,
  };
}
