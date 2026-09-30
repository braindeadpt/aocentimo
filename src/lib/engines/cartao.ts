/**
 * Cartão de crédito — quanto custa ficar com a dívida.
 *
 * O que este motor responde: com um saldo, uma TAEG e uma prestação
 * mínima (percentagem do saldo em dívida), em quantos meses a dívida
 * fica liquidada e quanto se paga de juros no caminho.
 *
 * A prestação mínima entra como **argumento**, não como constante. É o
 * que a lei obriga: em Portugal a prestação mínima do cartão é uma
 * condição acordada entre o cliente e a instituição, não um valor fixado
 * na lei (ver data/fiscal/cartoes.json). O que a lei proíbe é gravar
 * uma percentagem «legal» que não existe.
 *
 * Convenções, iguais às dos restantes motores:
 *   - funções puras, sem UI e sem I/O;
 *   - juros como percentagem anual efectiva (a TAEG tal como a publica
 *     o BdP), convertida a mensal uma vez por chamada;
 *   - arredondamento a centimos, porque é em euros que as pessoas pagam;
 *   - a última prestação apaga o resto, e a dívida tem de ficar a zero.
 *
 * O que este motor NÃO é: um cálculo de TAEG (isso é o motor taeg.ts), nem
 * uma previsão — a TAEG pode mudar todos os meses, e as prestações de um
 * cartão novo costumam ter free-float (ver cartoes.json).
 */

export interface ParametrosCartao {
  /** Saldo em dívida em euros. */
  saldo: number;
  /** TAEG anual em percentagem — a mesma que o BdP publica (ver usura-2026.json). */
  taegAnualPct: number;
  /**
   * Prestação mínima como percentagem do saldo em dívida (4 = 4 %).
   * Condição do contrato, não da lei. Tem de ser > 0 e ≤ 100.
   */
  prestacaoMinimaPct: number;
  /**
   * Prestação mínima em euros, se o contrato tiver um tecto mínimo
   * (muitos cartões cobram um valor mínimo e a percentagem acima). O que
   * for maior entre os dois conta. Opcional.
   */
  prestacaoMinimaEuros?: number;
  /** Tecto de segurança: quantos meses simular antes de declarar que não liquida. */
  maxMeses?: number;
}

export interface LinhaCartao {
  /** Mês, a contar de 1. */
  mes: number;
  /** Dívida no início do mês. */
  dividaInicio: number;
  /** Juros do mês sobre a dívida do início do mês. */
  juros: number;
  /** Prestação efectivamente paga — pode ser maior que o mínimo no último mês. */
  prestacao: number;
  /** Parte da prestação que reduz a dívida. */
  amortizacao: number;
  /** Dívida no fim do mês. */
  dividaFim: number;
}

export interface ResultadoCartao {
  linhas: LinhaCartao[];
  /** Meses até a dívida estar liquidada. */
  meses: number;
  /** Juros pagos no total, em euros. */
  jurosTotais: number;
  /** Soma das prestações, em euros. */
  totalPago: number;
  /** true se a dívida ficou a zero dentro do tecto de meses. */
  liquidado: boolean;
  /** true se o tecto de meses foi atingido com dívida por saldar. */
  esgotouMeses: boolean;
}

const arredCentimos = (v: number) => Math.round(v * 100) / 100;

const MESES_PADRAO = 600;

/**
 * Simula o reembolso mês a mês até a dívida ficar a zero.
 *
 * Erra alto em vez de devolver um número falso: se a prestação mínima não
 * cobrir os juros, a dívida cresce e a simulação devolve `liquidado: false`
 * com `esgotouMeses: true`, em vez de um prazo inventado.
 */
export function simularCartao(p: ParametrosCartao): ResultadoCartao {
  const { saldo, taegAnualPct, prestacaoMinimaPct, prestacaoMinimaEuros, maxMeses } = p;
  const teto = maxMeses ?? MESES_PADRAO;

  if (!Number.isFinite(saldo) || saldo <= 0) {
    throw new Error("simularCartao: o saldo tem de ser maior que zero");
  }
  if (!Number.isFinite(taegAnualPct) || taegAnualPct < 0) {
    throw new Error("simularCartao: a TAEG tem de ser um número não negativo");
  }
  if (
    !Number.isFinite(prestacaoMinimaPct) ||
    prestacaoMinimaPct <= 0 ||
    prestacaoMinimaPct > 100
  ) {
    throw new Error(
      "simularCartao: a prestação mínima tem de ser uma percentagem de (0, 100]"
    );
  }
  if (
    prestacaoMinimaEuros !== undefined &&
    (!Number.isFinite(prestacaoMinimaEuros) || prestacaoMinimaEuros <= 0)
  ) {
    throw new Error("simularCartao: a prestação mínima em euros tem de ser maior que zero");
  }

  // TAEG anual efectiva → taxa mensal equivalente
  const iMensal = Math.pow(1 + taegAnualPct / 100, 1 / 12) - 1;

  const linhas: LinhaCartao[] = [];
  let divida = arredCentimos(saldo);
  let jurosTotais = 0;
  let totalPago = 0;

  for (let mes = 1; mes <= teto && divida > 0; mes++) {
    const dividaInicio = divida;
    const juros = arredCentimos(dividaInicio * iMensal);
    jurosTotais = arredCentimos(jurosTotais + juros);

    // O mínimo contratual: a maior das duas condições
    const minimo = arredCentimos(
      Math.max(dividaInicio * (prestacaoMinimaPct / 100), prestacaoMinimaEuros ?? 0)
    );

    // Nunca se paga mais do que a dívida com os juros já gerados
    let prestacao = arredCentimos(Math.min(minimo, dividaInicio + juros));
    // Com a dívida quase extinta, a percentagem mínima arredonda a zero
    // cêntimos e a dívida ficava presa num resíduo para sempre. Sem isto,
    // mil euros a 15 % e 4 % ao mês nunca-liquidavam, o que é falso:
    // liquida-se o que resta nesse mês.
    if (prestacao <= 0) prestacao = arredCentimos(dividaInicio + juros);
    const amortizacao = arredCentimos(prestacao - juros);
    const dividaFim = arredCentimos(Math.max(0, dividaInicio - amortizacao));

    linhas.push({ mes, dividaInicio, juros, prestacao, amortizacao, dividaFim });
    totalPago = arredCentimos(totalPago + prestacao);

    divida = dividaFim;
    if (divida === 0) break;
  }

  const liquidado = divida === 0;
  return {
    linhas,
    meses: linhas.length,
    jurosTotais,
    totalPago,
    liquidado,
    esgotouMeses: !liquidado,
  };
}

/**
 * Meses que um saldo custa a saldar a uma dada prestação mínima, e os juros
 * totais. atalho de leitura para a UI: mesma simulação, menos o plano.
 */
export function custoDoSaldar(
  saldo: number,
  taegAnualPct: number,
  prestacaoMinimaPct: number,
  prestacaoMinimaEuros?: number
): { meses: number; jurosTotais: number; totalPago: number; liquidado: boolean } {
  const r = simularCartao({
    saldo,
    taegAnualPct,
    prestacaoMinimaPct,
    prestacaoMinimaEuros,
  });
  return {
    meses: r.meses,
    jurosTotais: r.jurosTotais,
    totalPago: r.totalPago,
    liquidado: r.liquidado,
  };
}