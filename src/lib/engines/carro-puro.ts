/**
 * Núcleo puro de ISV, IUC e custo fiscal anual do automóvel — sem imports
 * de @data/fiscal/*.json para poder ser importado em componentes "use client"
 * sem arrastar JSONs fiscais para o bundle do cliente (regra AGENTS.md).
 */

/** Norma de medição das emissões, tal como vem no certificado de conformidade. */
export type NormaTeste = "NEDC" | "WLTP";
export type Combustivel = "gasolina" | "gasoleo";
export type PropulsaoCarro = "gasolina" | "gasoleo" | "phev" | "eletrico";

/** Ano da matrícula, para escolher a coluna da tabela do IUC. */
export type FaixaMatricula = "posteriorA1995" | "de1990a1995" | "de1981a1989";

export interface EscalaoValor {
  de: number | null;
  ate: number | null;
  valorFixo?: number;
  taxa: number;
  parcelaAbater: number;
}

export interface EscalaoTaxa {
  de: number | null;
  ate: number | null;
  taxa: number;
}

export interface RegrasIsv {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  tabelaA: {
    cilindrada: EscalaoValor[];
    ambiental: {
      gasolina: Record<NormaTeste, EscalaoValor[]>;
      gasoleo: Record<NormaTeste, EscalaoValor[]>;
    };
  };
  tabelaB: { cilindrada: EscalaoValor[] };
  agravamentoGasoleo: {
    valor: number;
    limiteParticulas: number;
    nota: string;
  };
  minimo: number;
  taxasIntermedias: { regra: { percentagem: number; designacao: string }[] };
  veiculosUsadosImportadosUE: {
    tabelaD: { de: number; ate: number | null; reducao: number }[];
  };
}

export interface RegrasIuc {
  ano: number;
  vigencia: string;
  fonte: string;
  fonteUrl: string;
  categoriaA: {
    gasolina: {
      de: number | null;
      ate: number | null;
      posteriorA1995: number;
      de1990a1995: number;
      de1981a1989: number;
    }[];
    outrosProdutos: {
      de: number | null;
      ate: number | null;
      posteriorA1995: number;
      de1990a1995: number;
      de1981a1989: number;
    }[];
  };
  categoriaB: {
    cilindrada: EscalaoTaxa[];
    co2: {
      deNedc: number | null;
      ateNedc: number | null;
      deWltp: number | null;
      ateWltp: number | null;
      taxa: number;
    }[];
    adicionalCo2: {
      condicao: string;
      escaloes: {
        deNedc: number;
        ateNedc: number | null;
        deWltp: number;
        ateWltp: number | null;
        taxa: number;
      }[];
    };
    coeficientes: {
      tabela: { de: number; ate: number | null; coeficiente: number }[];
    };
  };
}

/** Arredonda a cêntimos, evitando o `-0` que às vezes aparece em subtrações. */
function arred(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100 + 0;
}

function escalaoValor(
  tabela: EscalaoValor[],
  v: number
): EscalaoValor | undefined {
  return tabela.find(
    (e) => (e.de === null || v >= e.de) && (e.ate === null || v <= e.ate)
  );
}

function escalaoCo2(
  tabela: RegrasIuc["categoriaB"]["co2"],
  co2: number,
  norma: NormaTeste
) {
  return tabela.find((e) => {
    const de = norma === "NEDC" ? e.deNedc : e.deWltp;
    const ate = norma === "NEDC" ? e.ateNedc : e.ateWltp;
    return (de === null || co2 >= de) && (ate === null || co2 <= ate);
  });
}

// ────────────────────────────── ISV ──────────────────────────────

export interface EntradaIsv {
  /** Cilindrada em cm³, tal como consta da homologação. */
  cilindrada: number;
  /** Emissões de CO2 em g/km. Não se converte entre normas. */
  co2?: number;
  norma?: NormaTeste;
  combustivel?: Combustivel;
  /** Partículas em g/km. Sem este valor, o agravamento do gasóleo aplica-se. */
  particulas?: number;
  /**
   * Anos de uso desde a primeira matrícula. Só tem efeito em veículos
   * importados de outro Estado-Membro da UE (tabela D do art. 11.º).
   */
  anosDeUso?: number;
  /** Veículo com matrícula definitiva atribuída por outro Estado-Membro da UE. */
  matriculaUE?: boolean;
  /**
   * Percentagem de taxa intermédia a aplicar à totalidade (art. 8.º):
   * 60 para híbrido não plug-in elegível, 25 para plug-in, 40 para gás natural.
   */
  taxaIntermedia?: number;
  ano?: number;
}

export interface ResultadoIsv {
  componenteCilindrada: number;
  componenteAmbiental: number;
  agravamentoGasoleo: number;
  reducaoUsadoUE: number;
  total: number;
}

/**
 * ISV de um ligeiro de passageiros pela tabela A.
 */
export function isv(e: EntradaIsv, regras: RegrasIsv): ResultadoIsv {
  const linha = escalaoValor(regras.tabelaA.cilindrada, e.cilindrada);
  if (!linha)
    throw new Error(`isv: cilindrada ${e.cilindrada} cm³ fora de tabela`);
  const componenteCilindrada = arred(
    e.cilindrada * linha.taxa - linha.parcelaAbater
  );

  // Componente ambiental: só existe se houver CO2 e norma declarados.
  let componenteAmbiental = 0;
  if (e.co2 !== undefined && e.norma !== undefined) {
    const combustivel = e.combustivel ?? "gasolina";
    const tabela = regras.tabelaA.ambiental[combustivel][e.norma];
    const linhaAmb = escalaoValor(tabela, e.co2);
    if (!linhaAmb)
      throw new Error(
        `isv: CO2 ${e.co2} g/km fora de tabela (${combustivel} ${e.norma})`
      );
    componenteAmbiental = arred(
      e.co2 * linhaAmb.taxa - linhaAmb.parcelaAbater
    );
  }

  const base = componenteCilindrada + componenteAmbiental;

  // Agravamento do gasóleo: 500 €, salvo partículas declaradas abaixo do limite.
  let agravamentoGasoleo = 0;
  if (e.combustivel === "gasoleo") {
    const isencao =
      e.particulas !== undefined &&
      e.particulas < regras.agravamentoGasoleo.limiteParticulas;
    if (!isencao) agravamentoGasoleo = regras.agravamentoGasoleo.valor;
  }

  let total = Math.max(regras.minimo, base) + agravamentoGasoleo;

  // Redução por tempo de uso — só veículos importados de outro Estado-Membro.
  let reducaoUsadoUE = 0;
  if (e.matriculaUE && e.anosDeUso !== undefined) {
    const linhaD = regras.veiculosUsadosImportadosUE.tabelaD.find(
      (d) => e.anosDeUso! >= d.de && (d.ate === null || e.anosDeUso! < d.ate)
    );
    if (linhaD) {
      reducaoUsadoUE = arred(total * (linhaD.reducao / 100));
      total = arred(total - reducaoUsadoUE);
    }
  }

  // Taxa intermédia do art. 8.º — sobre a totalidade.
  if (e.taxaIntermedia) total = arred(total * (e.taxaIntermedia / 100));

  return {
    componenteCilindrada,
    componenteAmbiental,
    agravamentoGasoleo,
    reducaoUsadoUE,
    total: arred(total),
  };
}

// ────────────────────────────── IUC ──────────────────────────────

export interface EntradaIuc {
  cilindrada: number;
  /** Ano da primeira matrícula — escolhe o escalão e o coeficiente. */
  anoMatricula: number;
  combustivel?: Combustivel;
  /** CO2 em g/km, só para a categoria B. */
  co2?: number;
  norma?: NormaTeste;
  ano?: number;
}

export interface ResultadoIuc {
  categoria: "A" | "B";
  componenteCilindrada: number;
  componenteCo2: number;
  adicionalCo2: number;
  coeficiente: number;
  total: number;
}

function faixaMatricula(ano: number): FaixaMatricula {
  if (ano > 1995) return "posteriorA1995";
  if (ano >= 1990) return "de1990a1995";
  if (ano >= 1981) return "de1981a1989";
  throw new Error(
    `iuc: ano de matrícula ${ano} anterior a 1981 não tem tabela`
  );
}

/**
 * IUC anual de um ligeiro.
 */
export function iuc(e: EntradaIuc, regras: RegrasIuc): ResultadoIuc {
  const faixa = faixaMatricula(e.anoMatricula);
  const combustivel = e.combustivel ?? "gasolina";

  if (combustivel === "gasolina") {
    const linha = regras.categoriaA.gasolina.find(
      (s) =>
        (s.de === null || e.cilindrada >= s.de) &&
        (s.ate === null || e.cilindrada <= s.ate)
    );
    if (!linha)
      throw new Error(`iuc: cilindrada ${e.cilindrada} cm³ fora de tabela`);
    const total = arred(linha[faixa]);
    return {
      categoria: "A",
      componenteCilindrada: total,
      componenteCo2: 0,
      adicionalCo2: 0,
      coeficiente: 1,
      total,
    };
  }

  // Categoria B: cilindrada + CO2 (+ adicional se matriculado a partir de 2017).
  const linhaCil = regras.categoriaB.cilindrada.find(
    (s) =>
      (s.de === null || e.cilindrada >= s.de) &&
      (s.ate === null || e.cilindrada <= s.ate)
  );
  if (!linhaCil)
    throw new Error(`iuc: cilindrada ${e.cilindrada} cm³ fora de tabela`);

  const norma = e.norma ?? "WLTP";
  const linhaCo2 = escalaoCo2(regras.categoriaB.co2, e.co2 ?? 0, norma);
  if (!linhaCo2)
    throw new Error(`iuc: CO2 ${e.co2} g/km fora de tabela (${norma})`);

  let adicionalCo2 = 0;
  if (e.anoMatricula >= 2017) {
    const linhaAd = regras.categoriaB.adicionalCo2.escaloes.find((a) => {
      if (norma === "NEDC")
        return e.co2! > a.deNedc && (a.ateNedc === null || e.co2! <= a.ateNedc);
      return e.co2! > a.deWltp && (a.ateWltp === null || e.co2! <= a.ateWltp);
    });
    if (linhaAd) adicionalCo2 = linhaAd.taxa;
  }

  const linhaCoef = regras.categoriaB.coeficientes.tabela.find(
    (c) =>
      e.anoMatricula >= c.de && (c.ate === null || e.anoMatricula <= c.ate)
  );
  if (!linhaCoef)
    throw new Error(`iuc: ano de matrícula ${e.anoMatricula} sem coeficiente`);

  const coleta = linhaCil.taxa + linhaCo2.taxa + adicionalCo2;
  return {
    categoria: "B",
    componenteCilindrada: linhaCil.taxa,
    componenteCo2: linhaCo2.taxa,
    adicionalCo2,
    coeficiente: linhaCoef.coeficiente,
    total: arred(coleta * linhaCoef.coeficiente),
  };
}

/**
 * Custo anual de manter um ligeiro na estrada, a partir do valor de compra.
 */
export function custoAnualCarro(
  entrada: EntradaIuc,
  precoCompra: number,
  regras: RegrasIuc
): { iuc: number; iucSobrePreco: number } {
  const r = iuc(entrada, regras);
  return {
    iuc: r.total,
    iucSobrePreco: arred((r.total / precoCompra) * 100),
  };
}

export interface LitroDecomposto {
  precoLitro: number;
  produto: number;
  isp: number;
  carbono: number;
  iva: number;
  impostos: number;
}

export interface EntradaCustoFiscalCarro {
  propulsao: PropulsaoCarro;
  cilindrada: number;
  co2: number;
  anoMatricula: number;
  kmAno: number;
  consumoLitros100: number;
  norma?: NormaTeste;
  particulas?: number;
  matriculaUE?: boolean;
  anosDeUso?: number;
  precoCompra?: number;
  litroGasolina: LitroDecomposto | null;
  litroGasoleo: LitroDecomposto | null;
}

export interface ResultadoCustoFiscalCarro {
  isento: boolean;
  isv: ResultadoIsv;
  iuc: ResultadoIuc;
  iucSobrePreco: number;
  litrosAno: number;
  combustivelTotalAno: number;
  combustivelSemImpostoAno: number;
  ispAno: number;
  carbonoAno: number;
  ivaCombustivelAno: number;
  impostosCombustivelAno: number;
  impostosAnuais: number;
  custoTotalAnual: number;
  pesoImpostosAnual: number;
}

/**
 * Decompõe o ISV (na matrícula) e o custo fiscal anual de circular
 * (IUC + ISP + taxa de carbono + IVA sobre combustível) a partir das
 * tabelas fiscais e do PMD DGEG decomposto no servidor.
 *
 * Para veículos 100 % elétricos (art. 2.º n.º 2 al. b) CISV e art. 5.º CIUC),
 * ISV e IUC são 0 € (`isento: true`).
 */
export function custoFiscalAnualCarro(
  e: EntradaCustoFiscalCarro,
  regrasIsv: RegrasIsv,
  regrasIuc: RegrasIuc
): ResultadoCustoFiscalCarro {
  if (e.propulsao === "eletrico") {
    return {
      isento: true,
      isv: {
        componenteCilindrada: 0,
        componenteAmbiental: 0,
        agravamentoGasoleo: 0,
        reducaoUsadoUE: 0,
        total: 0,
      },
      iuc: {
        categoria: "A",
        componenteCilindrada: 0,
        componenteCo2: 0,
        adicionalCo2: 0,
        coeficiente: 1,
        total: 0,
      },
      iucSobrePreco: 0,
      litrosAno: 0,
      combustivelTotalAno: 0,
      combustivelSemImpostoAno: 0,
      ispAno: 0,
      carbonoAno: 0,
      ivaCombustivelAno: 0,
      impostosCombustivelAno: 0,
      impostosAnuais: 0,
      custoTotalAnual: 0,
      pesoImpostosAnual: 0,
    };
  }

  const combustivelBase: Combustivel =
    e.propulsao === "gasoleo" ? "gasoleo" : "gasolina";
  const norma = e.norma ?? "WLTP";
  const taxaIntermedia = e.propulsao === "phev" ? 25 : undefined;

  const isvRes = isv(
    {
      cilindrada: e.cilindrada,
      co2: e.co2,
      norma,
      combustivel: combustivelBase,
      particulas: e.particulas,
      matriculaUE: e.matriculaUE,
      anosDeUso: e.anosDeUso,
      taxaIntermedia,
    },
    regrasIsv
  );

  const entradaIuc: EntradaIuc = {
    cilindrada: e.cilindrada,
    anoMatricula: e.anoMatricula,
    combustivel: combustivelBase,
    co2: e.co2,
    norma,
  };
  const iucRes = iuc(entradaIuc, regrasIuc);
  const { iucSobrePreco } = custoAnualCarro(
    entradaIuc,
    e.precoCompra ?? 25000,
    regrasIuc
  );

  const litro =
    combustivelBase === "gasoleo" ? e.litroGasoleo : e.litroGasolina;
  const litrosAno = arred((Math.max(0, e.kmAno) / 100) * Math.max(0, e.consumoLitros100));

  if (!litro) {
    return {
      isento: false,
      isv: isvRes,
      iuc: iucRes,
      iucSobrePreco,
      litrosAno,
      combustivelTotalAno: 0,
      combustivelSemImpostoAno: 0,
      ispAno: 0,
      carbonoAno: 0,
      ivaCombustivelAno: 0,
      impostosCombustivelAno: 0,
      impostosAnuais: iucRes.total,
      custoTotalAnual: iucRes.total,
      pesoImpostosAnual: iucRes.total > 0 ? 1 : 0,
    };
  }

  const combustivelTotalAno = arred(litrosAno * litro.precoLitro);
  const ispAno = arred(litrosAno * litro.isp);
  const carbonoAno = arred(litrosAno * litro.carbono);
  const ivaCombustivelAno = arred(litrosAno * litro.iva);
  const impostosCombustivelAno = arred(ispAno + carbonoAno + ivaCombustivelAno);
  const combustivelSemImpostoAno = Math.max(
    0,
    arred(combustivelTotalAno - impostosCombustivelAno)
  );
  const impostosAnuais = arred(iucRes.total + impostosCombustivelAno);
  const custoTotalAnual = arred(iucRes.total + combustivelTotalAno);
  const pesoImpostosAnual =
    custoTotalAnual > 0 ? impostosAnuais / custoTotalAnual : 0;

  return {
    isento: false,
    isv: isvRes,
    iuc: iucRes,
    iucSobrePreco,
    litrosAno,
    combustivelTotalAno,
    combustivelSemImpostoAno,
    ispAno,
    carbonoAno,
    ivaCombustivelAno,
    impostosCombustivelAno,
    impostosAnuais,
    custoTotalAnual,
    pesoImpostosAnual,
  };
}
