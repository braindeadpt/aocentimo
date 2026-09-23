"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  simularPoupanca,
  simularCA,
  simularCTPC,
  type PremioPermanencia,
  type ResultadoPoupanca,
} from "@/lib/engines/poupanca";

/**
 * A poupança partilhada pelos três níveis de /poupanca (V4): o nível 1
 * lê a taxa real do melhor e do pior produto, o nível 2 mexe nas réguas
 * e vê a divergência e a caderneta, o nível 3 confirma as regras —
 * tudo sobre o MESMO capital, prazo e inflação.
 *
 * As taxas e a retenção chegam por props do servidor (data/fiscal/*.json
 * nunca entra num client component). `inflacao` é o único cenário sem
 * fonte viva — nasce na variação homóloga real do IHPC quando a série
 * existe, e a régua marca-a como «agora».
 *
 * Os produtos acabam onde acabam: CA Série F aos 15 anos, CTPC aos 7 —
 * para lá disso não há trajectória (a série para, não se inventa).
 */

/** prazo legal de cada produto — a linha para onde o produto acaba */
export const PRAZO_CA = 15;
export const PRAZO_CTPC = 7;

export interface ProdutoReal {
  id: "dep" | "ca" | "ctpc";
  /** nome curto para metas e legendas — «CA» */
  curto: string;
  /** nome com preposição para a frase — «nos Certificados de Aforro»
   *  (evita concordância verbal: «0,7 % ao ano nos CA») */
  em: string;
  /** anos efectivos simulados (o produto pode acabar antes do prazo) */
  anosEf: number;
  resultado: ResultadoPoupanca;
  /** taxa líquida anual deflacionada — (1+r_liq)^(1/n)/(1+infl)−1 */
  taxaReal: number;
}

interface EstadoPoupanca {
  capital: number;
  anos: number;
  /** TANB do depósito a prazo, em % */
  taxaDeposito: number;
  /** inflação anual do cenário, em % */
  inflacao: number;
  taxaImposto: number;
  dep: ResultadoPoupanca;
  caf: ResultadoPoupanca;
  ctpc: ResultadoPoupanca;
  /** os três produtos com a sua taxa real anual */
  produtos: ProdutoReal[];
  /** melhor e pior produto por taxa real — para a frase do nível 1 */
  melhor: ProdutoReal;
  pior: ProdutoReal;
  /** taxa real anual de quem não investe: 1/(1+infl)−1 */
  realColchao: number;
  setCapital: (v: number) => void;
  setAnos: (v: number) => void;
  setTaxaDeposito: (v: number) => void;
  setInflacao: (v: number) => void;
}

const Ctx = createContext<EstadoPoupanca | null>(null);

/** taxa real anual composta de um resultado — deflacionada pela inflação */
function taxaRealAnual(
  capital: number,
  liquido: number,
  anosEf: number,
  inflacaoPct: number
): number {
  if (capital <= 0 || anosEf <= 0) return 0;
  const anual = Math.pow(liquido / capital, 1 / anosEf);
  return anual / (1 + inflacaoPct / 100) - 1;
}

export function PoupancaProvider({
  taxaCA,
  premiosCA,
  taxasCtpc,
  premioCtpc,
  taxaImposto,
  inflacaoInicial,
  children,
}: {
  /** taxa bruta de novas subscrições CA Série F (ca.json) */
  taxaCA: number;
  /** prémios de permanência da Série F (ca.json) */
  premiosCA: PremioPermanencia[];
  /** taxas fixas por ano de vida do CTPC (ca.json) */
  taxasCtpc: number[];
  /** prémio PIB em vigor do CTPC (ca.json) */
  premioCtpc: number;
  /** retenção liberatória (capitais.json) */
  taxaImposto: number;
  /** inflação inicial do cenário, em % — a homóloga real do IHPC */
  inflacaoInicial: number;
  children: ReactNode;
}) {
  const [capital, setCapital] = useState(10000);
  const [anos, setAnos] = useState(10);
  const [taxaDeposito, setTaxaDeposito] = useState(1.5);
  const [inflacao, setInflacao] = useState(inflacaoInicial);

  const dep = useMemo(
    () =>
      simularPoupanca(
        capital,
        anos,
        taxaDeposito / 100,
        taxaImposto,
        inflacao / 100
      ),
    [capital, anos, taxaDeposito, taxaImposto, inflacao]
  );
  // CA matura aos 15 anos — a simulação para onde o produto acaba
  const anosCA = Math.min(anos, PRAZO_CA);
  const caf = useMemo(
    () =>
      simularCA(capital, anosCA, taxaCA, premiosCA, taxaImposto, inflacao / 100),
    [capital, anosCA, taxaCA, premiosCA, taxaImposto, inflacao]
  );
  const anosCTPC = Math.min(anos, Math.min(PRAZO_CTPC, taxasCtpc.length));
  const ctpc = useMemo(
    () =>
      simularCTPC(
        capital,
        anosCTPC,
        taxasCtpc,
        premioCtpc,
        taxaImposto,
        inflacao / 100
      ),
    [capital, anosCTPC, taxasCtpc, premioCtpc, taxaImposto, inflacao]
  );

  const produtos = useMemo<ProdutoReal[]>(
    () => [
      {
        id: "ca",
        curto: "CA",
        em: "nos Certificados de Aforro",
        anosEf: anosCA,
        resultado: caf,
        taxaReal: taxaRealAnual(capital, caf.capitalFinalLiquido, anosCA, inflacao),
      },
      {
        id: "ctpc",
        curto: "CTPC",
        em: "nos Certificados do Tesouro",
        anosEf: anosCTPC,
        resultado: ctpc,
        taxaReal: taxaRealAnual(capital, ctpc.capitalFinalLiquido, anosCTPC, inflacao),
      },
      {
        id: "dep",
        curto: "Depósito",
        em: "no depósito a prazo",
        anosEf: anos,
        resultado: dep,
        taxaReal: taxaRealAnual(capital, dep.capitalFinalLiquido, anos, inflacao),
      },
    ],
    [capital, anos, anosCA, anosCTPC, caf, ctpc, dep, inflacao]
  );

  const { melhor, pior } = useMemo(() => {
    const ord = [...produtos].sort((a, b) => b.taxaReal - a.taxaReal);
    return { melhor: ord[0], pior: ord[ord.length - 1] };
  }, [produtos]);

  const realColchao = 1 / (1 + inflacao / 100) - 1;

  const valor = useMemo<EstadoPoupanca>(
    () => ({
      capital,
      anos,
      taxaDeposito,
      inflacao,
      taxaImposto,
      dep,
      caf,
      ctpc,
      produtos,
      melhor,
      pior,
      realColchao,
      setCapital,
      setAnos,
      setTaxaDeposito,
      setInflacao,
    }),
    [
      capital,
      anos,
      taxaDeposito,
      inflacao,
      taxaImposto,
      dep,
      caf,
      ctpc,
      produtos,
      melhor,
      pior,
      realColchao,
    ]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function usePoupanca(): EstadoPoupanca {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePoupanca fora do PoupancaProvider");
  return c;
}
