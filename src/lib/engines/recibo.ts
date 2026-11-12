import adseJson from "@data/fiscal/adse.json";
import sa from "@data/fiscal/subsidio-alimentacao.json";
import { retencaoNaFonte, SituacaoRetencao, TabelaId } from "./retencao";
import { TSU_TRABALHADOR, TSU_ENTIDADE } from "./seg-social";
import { pctIsencao } from "./irs-jovem";

/**
 * Recibo de vencimento mensal: bruto + subsídio de alimentação − SS −
 * ADSE opcional − retenção na fonte real (tabelas do Despacho 233-A/2026).
 * O excedente do subs. de alimentação acima do limite isento tributa como
 * salário (IRS + TSU). Com IRS Jovem, a taxa efetiva do total aplica-se só à
 * parte não isenta (orientação AT).
 * Em duodécimos (50 % ou 100 % dos subsídios de férias e de Natal), as
 * frações retêm autonomamente nos termos do art. 99.º-C do CIRS (não somam
 * ao salário base para subir a taxa marginal do mês).
 */

export type FormaPagamentoSA = "dinheiro" | "cartao";
export type ModoDuodecimos = "14" | "50" | "100";

export const LIMITE_SA = sa.isentoPorDia;
export const TAXA_ADSE_RECIBO = adseJson.beneficiariosTitulares.taxaDesconto;

export interface InputRecibo {
  bruto: number;
  situacao?: SituacaoRetencao;
  dependentes?: number;
  saPorDia?: number;
  formaSA?: FormaPagamentoSA;
  diasTrabalho?: number;
  anoIrsJovem?: number; // 0 = sem IRS Jovem; 1–10 = ano de gozo
  adse?: boolean; // 3,5 % × 14 meses (Função Pública — DL 118/83 art. 46.º)
  duodecimos?: ModoDuodecimos; // "14" | "50" | "100"
  ano?: number;
}

export interface ResultadoRecibo {
  bruto: number;
  duodecimosBruto?: number;
  saTotal: number;
  saIsento: number;
  saTributavel: number;
  ss: number;
  adse?: number;
  retencao: number;
  retencaoDuodecimos?: number;
  taxaEfetiva: number;
  tabela: TabelaId;
  liquido: number;
  liquidoSemDuodecimos?: number;
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
    adse = false,
    duodecimos = "14",
    ano = 2026,
  } = input;

  const limite = LIMITE_SA[formaSA];
  const saTotal = saPorDia * diasTrabalho;
  const saIsento = Math.min(saPorDia, limite) * diasTrabalho;
  const saTributavel = saTotal - saIsento;

  const fatorDuo =
    duodecimos === "100" ? 2 / 12 : duodecimos === "50" ? 1 / 12 : 0;
  const duodecimosBruto = bruto * fatorDuo;

  // remuneração sujeita a descontos regulares do mês: salário + excedente do subsídio
  const base = bruto + saTributavel;
  const baseTotal = base + duodecimosBruto;
  const ss = baseTotal * TSU_TRABALHADOR;
  const descontoAdse = adse ? (bruto + duodecimosBruto) * TAXA_ADSE_RECIBO : 0;

  const isencaoJovem = 1 - pctIsencao(anoIrsJovem);
  const ret = retencaoNaFonte(base, situacao, dependentes, ano);
  const retencaoBase = ret.retencao * isencaoJovem;

  // Art. 99.º-C CIRS: retenção autónoma sobre os subsídios de férias e de Natal
  // (e respetivos duodécimos) — incide autonomamente sobre a remuneração base mensal
  const retSub =
    fatorDuo > 0
      ? (saTributavel === 0
          ? ret.retencao
          : retencaoNaFonte(bruto, situacao, dependentes, ano).retencao) *
        isencaoJovem
      : 0;
  const retencaoDuodecimos = retSub * fatorDuo;
  const retencao = retencaoBase + retencaoDuodecimos;

  const liquidoSemDuodecimos =
    bruto +
    saTotal -
    base * TSU_TRABALHADOR -
    (adse ? bruto * TAXA_ADSE_RECIBO : 0) -
    retencaoBase;
  const liquido =
    bruto + duodecimosBruto + saTotal - ss - descontoAdse - retencao;
  const tsuEntidade = baseTotal * TSU_ENTIDADE;

  return {
    bruto,
    duodecimosBruto,
    saTotal,
    saIsento,
    saTributavel,
    ss,
    adse: descontoAdse,
    retencao,
    retencaoDuodecimos,
    taxaEfetiva:
      baseTotal > 0
        ? retencao / baseTotal
        : ret.taxaEfetiva * isencaoJovem,
    tabela: ret.tabela,
    liquido,
    liquidoSemDuodecimos,
    tsuEntidade,
    custoEmpresa: baseTotal + tsuEntidade,
  };
}
