export interface LinhaAmortizacao {
  mes: number;
  prestacao: number;
  juro: number;
  capital: number;
  divida: number;
}

export interface ResultadoPrestacao {
  prestacao: number;
  jurosTotais: number;
  custoTotal: number;
  tan: number;
  linhas: LinhaAmortizacao[];
}

export type RegimeTaxaCredito = "variavel" | "mista" | "fixa";

export type FaixaEtariaMutuario = "ate30" | "31a35" | "mais35";

export interface RegrasCreditoHabitacao {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  reembolsoAntecipado: {
    comissaoMaximaVariavel: number;
    comissaoMaximaFixa: number;
    baseLegal: string;
    nota: string;
  };
  recomendacaoMacroprudencialBdP: {
    baseLegal: string;
    ltv: {
      hpp: number;
      outrosFins: number;
      imoveisInstituicao: number;
      nota: string;
    };
    maturidadeMaxima: {
      ate30Anos: number;
      mais30Ate35Anos: number;
      mais35Anos: number;
      nota: string;
    };
    dsti: {
      limiteGeral: number;
      margemAte60Pct: number;
      margemExcecaoTotal: number;
      choqueTaxaJuroPrazosLongos: number;
      nota: string;
    };
  };
  garantiaPublicaJovem: {
    baseLegal: string;
    idadeMin: number;
    idadeMax: number;
    precoMax: number;
    garantiaMaxPct: number;
    financiamentoMaxPct: number;
    limiteEscalaoIrs: number;
    condicoes: string[];
  };
}

export interface ResultadoPrestacaoMista extends ResultadoPrestacao {
  prestacaoFixa: number;
  prestacaoVariavel: number;
  mesesFixos: number;
  mesesVariaveis: number;
  capitalAposFixo: number;
  tanFixa: number;
  tanVariavel: number;
}

export interface OpcaoReduzirPrestacao {
  novaPrestacao: number;
  reducaoMensal: number;
  jurosRestantes: number;
  jurosPoupadosBrutos: number;
  poupancaLiquida: number;
}

export interface OpcaoReduzirPrazo {
  prestacaoMantida: number;
  mesesRestantesNovos: number;
  mesesPoupados: number;
  anosPoupados: number;
  jurosRestantes: number;
  jurosPoupadosBrutos: number;
  poupancaLiquida: number;
}

export interface ResultadoAmortizacaoAntecipada {
  mesAmortizacao: number;
  anoAmortizacao: number;
  dividaAntes: number;
  montanteAmortizado: number;
  novaDivida: number;
  taxaComissao: number;
  comissao: number;
  desembolsoTotal: number;
  prestacaoAtual: number;
  mesesRestantesAntes: number;
  jurosRestantesSemAmortizar: number;
  reduzirPrestacao: OpcaoReduzirPrestacao;
  reduzirPrazo: OpcaoReduzirPrazo;
}

export interface AvaliacaoMacroprudencial {
  prazoAnos: number;
  prazoMaximoRecomendado: number;
  excedeMaturidade: boolean;
  prestacaoAtual: number;
  dstiAtual: number;
  choqueAplicado: number;
  prestacaoChoqueBdP: number;
  dstiChoqueBdP: number;
  limiteDsti: number;
  excedeDstiAtual: boolean;
  excedeDstiChoque: boolean;
}

function prestacaoFrancesa(capital: number, meses: number, taxaMensal: number): number {
  if (meses <= 0 || capital <= 0) return 0;
  if (taxaMensal === 0) return capital / meses;
  return (capital * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -meses));
}

/**
 * Sistema de amortização francês (prestação constante).
 * P = C · i / (1 − (1+i)^−n), i = taxa anual nominal / 12.
 */
export function simularPrestacao(
  capital: number,
  prazoMeses: number,
  euribor: number,
  spread: number
): ResultadoPrestacao {
  const tan = euribor + spread;
  const i = tan / 12;
  const n = Math.round(prazoMeses);

  const prestacao = prestacaoFrancesa(capital, n, i);

  let divida = capital;
  let jurosTotais = 0;
  const linhas: LinhaAmortizacao[] = [];

  for (let mes = 1; mes <= n; mes++) {
    const juro = divida * i;
    const amortizado = prestacao - juro;
    divida = Math.max(0, divida - amortizado);
    jurosTotais += juro;
    linhas.push({ mes, prestacao, juro, capital: amortizado, divida });
  }

  return {
    prestacao,
    jurosTotais,
    custoTotal: capital + jurosTotais,
    tan,
    linhas,
  };
}

/**
 * Simulação de crédito à habitação com taxa mista (ou fixa pura / variável pura):
 * - Nos primeiros `mesesFixos = min(prazoMeses, anosFixos * 12)` aplica `tanFixa`
 *   calculando a prestação sobre o prazo total (`prazoMeses`);
 * - Ao terminar o período fixo, recalcula a prestação pelo sistema francês sobre o
 *   capital em dívida remanescente (`capitalAposFixo`) e os meses restantes à taxa
 *   `euriborDepois + spreadDepois`.
 */
export function simularPrestacaoMista(
  capital: number,
  prazoMeses: number,
  anosFixos: number,
  tanFixa: number,
  euriborDepois: number,
  spreadDepois: number
): ResultadoPrestacaoMista {
  const n = Math.max(1, Math.round(prazoMeses));
  const mesesFixos = Math.min(n, Math.max(0, Math.round(anosFixos * 12)));
  const mesesVariaveis = n - mesesFixos;
  const tanVariavel = euriborDepois + spreadDepois;

  const iFixa = tanFixa / 12;
  const iVar = tanVariavel / 12;

  let divida = capital;
  let jurosTotais = 0;
  const linhas: LinhaAmortizacao[] = [];

  const prestacaoFixa =
    mesesFixos > 0
      ? prestacaoFrancesa(capital, n, iFixa)
      : prestacaoFrancesa(capital, n, iVar);

  for (let mes = 1; mes <= mesesFixos; mes++) {
    const juro = divida * iFixa;
    const amortizado = prestacaoFixa - juro;
    divida = Math.max(0, divida - amortizado);
    jurosTotais += juro;
    linhas.push({ mes, prestacao: prestacaoFixa, juro, capital: amortizado, divida });
  }

  const capitalAposFixo = divida;

  const prestacaoVariavel =
    mesesVariaveis > 0
      ? prestacaoFrancesa(capitalAposFixo, mesesVariaveis, iVar)
      : prestacaoFixa;

  for (let mes = mesesFixos + 1; mes <= n; mes++) {
    const juro = divida * iVar;
    const amortizado = prestacaoVariavel - juro;
    divida = Math.max(0, divida - amortizado);
    jurosTotais += juro;
    linhas.push({
      mes,
      prestacao: prestacaoVariavel,
      juro,
      capital: amortizado,
      divida,
    });
  }

  const prestacaoInicial = mesesFixos > 0 ? prestacaoFixa : prestacaoVariavel;
  const tanInicial = mesesFixos > 0 ? tanFixa : tanVariavel;

  return {
    prestacao: prestacaoInicial,
    prestacaoFixa,
    prestacaoVariavel,
    mesesFixos,
    mesesVariaveis,
    capitalAposFixo,
    tanFixa,
    tanVariavel,
    tan: tanInicial,
    jurosTotais,
    custoTotal: capital + jurosTotais,
    linhas,
  };
}

/**
 * Simulador de amortização antecipada parcial:
 * No mês `anoAmortizacao * 12`, abate `montanteExtra` ao capital em dívida,
 * calcula a comissão máxima legal (DL 74-A/2017 art. 23.º: 0,5 % variável / 2,0 % fixa)
 * e compara:
 *  (a) Reduzir a prestação mensal mantendo o prazo remanescente;
 *  (b) Reduzir o prazo mantendo a prestação actual.
 */
export function simularAmortizacaoAntecipada(opts: {
  capital: number;
  prazoMeses: number;
  tan: number;
  anoAmortizacao: number;
  montanteExtra: number;
  regimeTaxa: "variavel" | "fixa";
  taxasComissao: { variavel: number; fixa: number };
}): ResultadoAmortizacaoAntecipada {
  const {
    capital,
    prazoMeses,
    tan,
    anoAmortizacao,
    montanteExtra,
    regimeTaxa,
    taxasComissao,
  } = opts;

  const n = Math.max(2, Math.round(prazoMeses));
  const mesAmortizacao = Math.min(
    n - 1,
    Math.max(1, Math.round(anoAmortizacao * 12))
  );
  const mesesRestantesAntes = n - mesAmortizacao;

  const base = simularPrestacao(capital, n, tan, 0);
  const linhaMomento = base.linhas[mesAmortizacao - 1];
  const dividaAntes = linhaMomento ? linhaMomento.divida : capital;

  let jurosJaPagos = 0;
  for (let m = 0; m < mesAmortizacao; m++) {
    jurosJaPagos += base.linhas[m].juro;
  }
  const jurosRestantesSemAmortizar = Math.max(0, base.jurosTotais - jurosJaPagos);

  const montanteAmortizado = Math.min(Math.max(0, montanteExtra), dividaAntes);
  const novaDivida = Math.max(0, dividaAntes - montanteAmortizado);

  const taxaComissao =
    regimeTaxa === "fixa" ? taxasComissao.fixa : taxasComissao.variavel;
  const comissao = montanteAmortizado * taxaComissao;
  const desembolsoTotal = montanteAmortizado + comissao;

  // (a) Reduzir a prestação mantendo o prazo remanescente
  const simMesmoPrazo =
    novaDivida > 0
      ? simularPrestacao(novaDivida, mesesRestantesAntes, tan, 0)
      : { prestacao: 0, jurosTotais: 0 };

  const jurosPoupadosPrestacao = Math.max(
    0,
    jurosRestantesSemAmortizar - simMesmoPrazo.jurosTotais
  );

  // (b) Reduzir o prazo mantendo a prestação actual
  const i = tan / 12;
  let dividaPrazo = novaDivida;
  let jurosRestantesPrazo = 0;
  let mesesNovos = 0;

  while (dividaPrazo > 0.005 && mesesNovos < mesesRestantesAntes) {
    const juroMes = dividaPrazo * i;
    const amortMes =
      i === 0
        ? Math.min(dividaPrazo, base.prestacao)
        : Math.min(dividaPrazo, Math.max(0, base.prestacao - juroMes));
    if (amortMes <= 0) {
      mesesNovos = mesesRestantesAntes;
      jurosRestantesPrazo = jurosRestantesSemAmortizar;
      break;
    }
    dividaPrazo = Math.max(0, dividaPrazo - amortMes);
    jurosRestantesPrazo += juroMes;
    mesesNovos++;
  }

  const mesesPoupados = Math.max(0, mesesRestantesAntes - mesesNovos);
  const jurosPoupadosPrazo = Math.max(
    0,
    jurosRestantesSemAmortizar - jurosRestantesPrazo
  );

  return {
    mesAmortizacao,
    anoAmortizacao: mesAmortizacao / 12,
    dividaAntes,
    montanteAmortizado,
    novaDivida,
    taxaComissao,
    comissao,
    desembolsoTotal,
    prestacaoAtual: base.prestacao,
    mesesRestantesAntes,
    jurosRestantesSemAmortizar,
    reduzirPrestacao: {
      novaPrestacao: simMesmoPrazo.prestacao,
      reducaoMensal: Math.max(0, base.prestacao - simMesmoPrazo.prestacao),
      jurosRestantes: simMesmoPrazo.jurosTotais,
      jurosPoupadosBrutos: jurosPoupadosPrestacao,
      poupancaLiquida: jurosPoupadosPrestacao - comissao,
    },
    reduzirPrazo: {
      prestacaoMantida: base.prestacao,
      mesesRestantesNovos: mesesNovos,
      mesesPoupados,
      anosPoupados: mesesPoupados / 12,
      jurosRestantes: jurosRestantesPrazo,
      jurosPoupadosBrutos: jurosPoupadosPrazo,
      poupancaLiquida: jurosPoupadosPrazo - comissao,
    },
  };
}

/**
 * Avalia os limites da Recomendação Macroprudencial do Banco de Portugal:
 * - Maturidade máxima por faixa etária (40 / 37 / 35 anos);
 * - Taxa de esforço (DSTI ≤ 50 %) sobre o rendimento líquido mensal do agregado,
 *   incluindo o teste de esforço com choque de +1,5 p.p. para prazos > 10 anos
 *   em taxa variável ou mista (Instrução BdP n.º 16/2023).
 */
export function avaliarLimitesMacroprudenciais(opts: {
  capital: number;
  prazoAnos: number;
  tanAtual: number;
  rendimentoLiquidoMensal: number;
  faixaEtaria: FaixaEtariaMutuario;
  regimeTaxa?: RegimeTaxaCredito;
  limites: RegrasCreditoHabitacao["recomendacaoMacroprudencialBdP"];
}): AvaliacaoMacroprudencial {
  const {
    capital,
    prazoAnos,
    tanAtual,
    rendimentoLiquidoMensal,
    faixaEtaria,
    regimeTaxa = "variavel",
    limites,
  } = opts;

  const prazoMaximoRecomendado =
    faixaEtaria === "ate30"
      ? limites.maturidadeMaxima.ate30Anos
      : faixaEtaria === "31a35"
        ? limites.maturidadeMaxima.mais30Ate35Anos
        : limites.maturidadeMaxima.mais35Anos;

  const prazoMeses = Math.max(1, Math.round(prazoAnos * 12));
  const prestacaoAtual = prestacaoFrancesa(capital, prazoMeses, tanAtual / 12);

  const choqueAplicado =
    regimeTaxa !== "fixa" && prazoAnos > 10
      ? limites.dsti.choqueTaxaJuroPrazosLongos
      : 0;

  const prestacaoChoqueBdP = prestacaoFrancesa(
    capital,
    prazoMeses,
    (tanAtual + choqueAplicado) / 12
  );

  const dstiAtual =
    rendimentoLiquidoMensal > 0 ? prestacaoAtual / rendimentoLiquidoMensal : 0;
  const dstiChoqueBdP =
    rendimentoLiquidoMensal > 0
      ? prestacaoChoqueBdP / rendimentoLiquidoMensal
      : 0;

  const limiteDsti = limites.dsti.limiteGeral;

  return {
    prazoAnos,
    prazoMaximoRecomendado,
    excedeMaturidade: prazoAnos > prazoMaximoRecomendado,
    prestacaoAtual,
    dstiAtual,
    choqueAplicado,
    prestacaoChoqueBdP,
    dstiChoqueBdP,
    limiteDsti,
    excedeDstiAtual: dstiAtual > limiteDsti,
    excedeDstiChoque: dstiChoqueBdP > limiteDsti,
  };
}
