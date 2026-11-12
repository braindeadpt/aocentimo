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
  simularCT,
  simularComReforco,
  type PremioPermanencia,
  type ResultadoPoupanca,
} from "@/lib/engines/poupanca";
import {
  construirUrl,
  lerFloat,
  lerInt,
  useLeituraUrl,
} from "@/lib/url-state";

/**
 * A poupança partilhada pelos três níveis de /poupanca (V4/V5): o nível 1
 * lê a taxa real do melhor e do pior produto, o nível 2 mexe nas réguas
 * e vê a divergência e a caderneta, o nível 3 confirma as regras —
 * tudo sobre o MESMO capital, reforço mensal, prazo e inflação.
 *
 * As taxas e a retenção chegam por props do servidor (data/fiscal/*.json
 * nunca entra num client component). `inflacao` nasce na variação homóloga
 * real do IHPC quando a série existe, e `taxaDeposito` nasce na média real
 * de novos depósitos a prazo até 1 ano publicada pelo BPstat.
 *
 * Os produtos acabam onde acabam: CA Série F aos 15 anos, CT Série 5 aos 10 —
 * para lá disso não há trajectória (a série para, não se inventa).
 */

/** prazo legal de cada produto — a linha para onde o produto acaba */
export const PRAZO_CA = 15;
export const PRAZO_CT = 10;

export interface ProdutoReal {
  id: "dep" | "ca" | "ct";
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
  reforcoMensal: number;
  anos: number;
  /** TANB do depósito a prazo, em % */
  taxaDeposito: number;
  /** inflação anual do cenário, em % */
  inflacao: number;
  taxaImposto: number;
  maximoEurosCA: number;
  minimoSubscricaoCA: number;
  minimoSubscricaoCT: number;
  maximoEurosCT: number;
  /** capital efetivamente subscrito em CA Série F (limitado a maximoEurosCA) */
  capitalSubscritoCA: number;
  /** excedente acima do tecto legal da Série F (50 000 €) */
  excedenteCA: number;
  dep: ResultadoPoupanca & { totalEntregas: number };
  caf: ResultadoPoupanca & { totalEntregas: number; capitalSubscritoProduto: number };
  ct: ResultadoPoupanca & { totalEntregas: number; capitalSubscritoProduto: number };
  /** os três produtos com a sua taxa real anual */
  produtos: ProdutoReal[];
  /** melhor e pior produto por taxa real — para a frase do nível 1 */
  melhor: ProdutoReal;
  pior: ProdutoReal;
  /** taxa real anual de quem não investe: 1/(1+infl)−1 */
  realColchao: number;
  setCapital: (v: number) => void;
  setReforcoMensal: (v: number) => void;
  setAnos: (v: number) => void;
  setTaxaDeposito: (v: number) => void;
  setInflacao: (v: number) => void;
  /** URL limpo com o estado partilhável para o <BotaoCopiar> */
  urlPartilha: string;
}

const Ctx = createContext<EstadoPoupanca | null>(null);

/** taxa real anual composta de um resultado — deflacionada pela inflação */
function taxaRealAnual(
  capitalBase: number,
  liquido: number,
  anosEf: number,
  inflacaoPct: number
): number {
  if (capitalBase <= 0 || anosEf <= 0) return 0;
  const anual = Math.pow(liquido / capitalBase, 1 / anosEf);
  return anual / (1 + inflacaoPct / 100) - 1;
}

export function PoupancaProvider({
  taxaCA,
  premiosCA,
  maximoEurosCA,
  minimoSubscricaoCA,
  taxasCT,
  minimoSubscricaoCT,
  maximoEurosCT,
  taxaImposto,
  taxaDepositoInicial,
  inflacaoInicial,
  children,
}: {
  /** taxa bruta de novas subscrições CA Série F (ca.json) */
  taxaCA: number;
  /** prémios de permanência da Série F (ca.json) */
  premiosCA: PremioPermanencia[];
  /** tecto legal de subscrição da Série F (50 000 €, ca.json) */
  maximoEurosCA: number;
  /** subscrição mínima da Série F (100 €, ca.json) */
  minimoSubscricaoCA: number;
  /** taxas fixas por ano de vida do CT Série 5 (ct.json) */
  taxasCT: number[];
  /** subscrição mínima do CT Série 5 (1 000 €, ct.json) */
  minimoSubscricaoCT: number;
  /** tecto por conta do CT Série 5 (1 000 000 €, ct.json) */
  maximoEurosCT: number;
  /** retenção liberatória (capitais.json) */
  taxaImposto: number;
  /** TANB média real de novos depósitos até 1 ano (BPstat) — ou null se falhar */
  taxaDepositoInicial: number | null;
  /** inflação inicial do cenário, em % — a homóloga real do IHPC */
  inflacaoInicial: number;
  children: ReactNode;
}) {
  const [capital, setCapital] = useState(10000);
  const [reforcoMensal, setReforcoMensal] = useState(0);
  const [anos, setAnos] = useState(10);
  const [taxaDeposito, setTaxaDeposito] = useState(taxaDepositoInicial ?? 1.5);
  const [inflacao, setInflacao] = useState(inflacaoInicial);

  // Leitura segura do estado por URL (Pilar 1 — T12)
  useLeituraUrl((sp) => {
    const c = lerInt(sp.get("capital"), 100, 1000000);
    if (c !== undefined) setCapital(c);
    const r = lerInt(sp.get("reforco"), 0, 5000);
    if (r !== undefined) setReforcoMensal(r);
    const a = lerInt(sp.get("anos"), 1, 15);
    if (a !== undefined) setAnos(a);
    const td = lerFloat(sp.get("tanb"), 0, 20);
    if (td !== undefined) setTaxaDeposito(td);
    const inf = lerFloat(sp.get("inflacao"), -5, 20);
    if (inf !== undefined) setInflacao(inf);
  });

  const dep = useMemo(() => {
    if (reforcoMensal === 0) {
      const r = simularPoupanca(
        capital,
        anos,
        taxaDeposito / 100,
        taxaImposto,
        inflacao / 100
      );
      return { ...r, totalEntregas: capital };
    }
    return simularComReforco({
      produto: "dep",
      capitalInicial: capital,
      reforcoMensal,
      anos,
      taxaImposto,
      inflacaoAnual: inflacao / 100,
      taxaDeposito: taxaDeposito / 100,
    });
  }, [capital, reforcoMensal, anos, taxaDeposito, taxaImposto, inflacao]);

  // CA matura aos 15 anos — e a Série F tem tecto legal de 50 000 € por titular
  const anosCA = Math.min(anos, PRAZO_CA);
  const capitalSubscritoCA = Math.min(capital, maximoEurosCA);
  const excedenteCA = Math.max(0, capital - capitalSubscritoCA);

  const caf = useMemo(() => {
    if (reforcoMensal === 0 && excedenteCA === 0) {
      const r = simularCA(
        capitalSubscritoCA,
        anosCA,
        taxaCA,
        premiosCA,
        taxaImposto,
        inflacao / 100
      );
      return {
        ...r,
        totalEntregas: capitalSubscritoCA,
        capitalSubscritoProduto: capitalSubscritoCA,
      };
    }
    if (reforcoMensal === 0) {
      // Capital inicial acima de 50 000 €: só 50 000 € vencem juros de CA Série F
      const rSub = simularCA(
        capitalSubscritoCA,
        anosCA,
        taxaCA,
        premiosCA,
        taxaImposto,
        inflacao / 100
      );
      const liquidoTotal = rSub.capitalFinalLiquido + excedenteCA;
      return {
        capitalFinalBruto: rSub.capitalFinalBruto + excedenteCA,
        jurosBrutos: rSub.jurosBrutos,
        imposto: rSub.imposto,
        capitalFinalLiquido: liquidoTotal,
        taxaLiquida: capital > 0 ? liquidoTotal / capital - 1 : 0,
        valorReal: liquidoTotal / Math.pow(1 + inflacao / 100, anosCA),
        totalEntregas: capital,
        capitalSubscritoProduto: capitalSubscritoCA,
      };
    }
    return simularComReforco({
      produto: "ca",
      capitalInicial: capital,
      reforcoMensal,
      anos: anosCA,
      taxaImposto,
      inflacaoAnual: inflacao / 100,
      taxaCA,
      premiosCA,
      minimoSubscricaoCA,
      maximoEurosCA,
    });
  }, [
    capital,
    capitalSubscritoCA,
    excedenteCA,
    reforcoMensal,
    anosCA,
    taxaCA,
    premiosCA,
    minimoSubscricaoCA,
    maximoEurosCA,
    taxaImposto,
    inflacao,
  ]);

  // CT Série 5 matura aos 10 anos e exige mínimo de 1 000 € por subscrição
  const anosCT = Math.min(anos, Math.min(PRAZO_CT, taxasCT.length));
  const ct = useMemo(() => {
    if (reforcoMensal === 0 && capital >= minimoSubscricaoCT) {
      const capCT = Math.min(capital, maximoEurosCT);
      const r = simularCT(
        capCT,
        anosCT,
        taxasCT,
        taxaImposto,
        inflacao / 100
      );
      return {
        ...r,
        totalEntregas: capital,
        capitalSubscritoProduto: capCT,
      };
    }
    return simularComReforco({
      produto: "ct",
      capitalInicial: capital,
      reforcoMensal,
      anos: anosCT,
      taxaImposto,
      inflacaoAnual: inflacao / 100,
      taxasCT,
      minimoSubscricaoCT,
      maximoEurosCT,
    });
  }, [
    capital,
    reforcoMensal,
    anosCT,
    taxasCT,
    minimoSubscricaoCT,
    maximoEurosCT,
    taxaImposto,
    inflacao,
  ]);

  const produtos = useMemo<ProdutoReal[]>(
    () => [
      {
        id: "ca",
        curto: "CA",
        em: "nos Certificados de Aforro",
        anosEf: anosCA,
        resultado: caf,
        taxaReal: taxaRealAnual(
          caf.totalEntregas,
          caf.capitalFinalLiquido,
          anosCA,
          inflacao
        ),
      },
      {
        id: "ct",
        curto: "CT",
        em: "nos Certificados do Tesouro",
        anosEf: anosCT,
        resultado: ct,
        taxaReal: taxaRealAnual(
          ct.totalEntregas,
          ct.capitalFinalLiquido,
          anosCT,
          inflacao
        ),
      },
      {
        id: "dep",
        curto: "Depósito",
        em: "no depósito a prazo",
        anosEf: anos,
        resultado: dep,
        taxaReal: taxaRealAnual(
          dep.totalEntregas,
          dep.capitalFinalLiquido,
          anos,
          inflacao
        ),
      },
    ],
    [anos, anosCA, anosCT, caf, ct, dep, inflacao]
  );

  const { melhor, pior } = useMemo(() => {
    const ord = [...produtos].sort((a, b) => b.taxaReal - a.taxaReal);
    return { melhor: ord[0], pior: ord[ord.length - 1] };
  }, [produtos]);

  const realColchao = 1 / (1 + inflacao / 100) - 1;

  const urlPartilha = useMemo(() => {
    return construirUrl(
      "/poupanca",
      {
        capital,
        reforco: reforcoMensal,
        anos,
        tanb: taxaDeposito,
        inflacao,
      },
      {
        capital: 10000,
        reforco: 0,
        anos: 10,
        tanb: taxaDepositoInicial ?? 1.5,
        inflacao: inflacaoInicial,
      }
    );
  }, [
    capital,
    reforcoMensal,
    anos,
    taxaDeposito,
    inflacao,
    taxaDepositoInicial,
    inflacaoInicial,
  ]);

  const valor = useMemo<EstadoPoupanca>(
    () => ({
      capital,
      reforcoMensal,
      anos,
      taxaDeposito,
      inflacao,
      taxaImposto,
      maximoEurosCA,
      minimoSubscricaoCA,
      minimoSubscricaoCT,
      maximoEurosCT,
      capitalSubscritoCA,
      excedenteCA,
      dep,
      caf,
      ct,
      produtos,
      melhor,
      pior,
      realColchao,
      setCapital,
      setReforcoMensal,
      setAnos,
      setTaxaDeposito,
      setInflacao,
      urlPartilha,
    }),
    [
      capital,
      reforcoMensal,
      anos,
      taxaDeposito,
      inflacao,
      taxaImposto,
      maximoEurosCA,
      minimoSubscricaoCA,
      minimoSubscricaoCT,
      maximoEurosCT,
      capitalSubscritoCA,
      excedenteCA,
      dep,
      caf,
      ct,
      produtos,
      melhor,
      pior,
      realColchao,
      urlPartilha,
    ]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function usePoupanca(): EstadoPoupanca {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePoupanca fora do PoupancaProvider");
  return c;
}

