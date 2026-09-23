import { reciboMensal } from "@/lib/engines/recibo";

/**
 * O cenário canónico do site (S1-02, defeito 6) — a história do euro
 * conta-se UMA vez e num só sítio: começa no CUSTO TOTAL para a
 * empresa (bruto + TSU patronal, o facto revelador — a empresa paga
 * mais do que o salário que o trabalhador vê) e desce pelos cortes até
 * ao líquido do mês com a retenção real na fonte.
 *
 * O «líquido» do site é sempre este: o recibo mensal × 12. A média a
 * 14 meses (duodécimos) e a estimativa anual de IRS são leituras
 * diferentes, explicadas na própria página de /salario — nunca se
 * misturam na história canónica.
 *
 * Caso-base: solteiro(a), sem dependentes, continente, sem subsídio de
 * alimentação — o mesmo pressuposto da régua inicial de /salario.
 * Função pura — segura no servidor e no cliente; quem mostra números
 * desta história (home, /salario) consome daqui, nunca recalcula.
 */

/** o bruto de referência da história — régua inicial de /salario,
    «o teu euro» e a adivinha da home partem daqui */
export const BRUTO_CANONICO = 1500;

export interface CenarioCanonico {
  ano: number;
  /** salário bruto mensal */
  brutoMes: number;
  /** custo mensal para a empresa — bruto + TSU patronal (o início da história) */
  custoEmpresaMes: number;
  /** TSU da entidade patronal — o corte que não aparece no recibo */
  tsuEntidadeMes: number;
  /** Seg. Social do trabalhador (11 %) */
  ssMes: number;
  /** retenção na fonte de IRS — a tabela real do mês */
  irsRetidoMes: number;
  /** o que chega à conta no fim do mês */
  liquidoMes: number;
  /** líquido × 12 — o «líquido anual» da história canónica */
  liquidoAno12: number;
  /** custo × 12 — o denominador do ano canónico */
  custoAno12: number;
  /** cêntimos de cada euro de custo que chegam ao trabalhador */
  centimosPorEuroCusto: number;
  /** taxa efetiva de retenção na fonte */
  taxaEfetivaRetencao: number;
}

export function cenarioCanonico(
  bruto: number = BRUTO_CANONICO,
  ano = 2026
): CenarioCanonico {
  const r = reciboMensal({
    bruto,
    situacao: "naoCasado",
    dependentes: 0,
    saPorDia: 0,
    anoIrsJovem: 0,
    ano,
  });
  return {
    ano,
    brutoMes: r.bruto,
    custoEmpresaMes: r.custoEmpresa,
    tsuEntidadeMes: r.tsuEntidade,
    ssMes: r.ss,
    irsRetidoMes: r.retencao,
    liquidoMes: r.liquido,
    liquidoAno12: r.liquido * 12,
    custoAno12: r.custoEmpresa * 12,
    centimosPorEuroCusto:
      r.custoEmpresa > 0 ? (r.liquido / r.custoEmpresa) * 100 : 0,
    taxaEfetivaRetencao: r.taxaEfetiva,
  };
}
