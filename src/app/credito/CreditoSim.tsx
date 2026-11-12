"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  simularPrestacao,
  type ResultadoPrestacao,
} from "@/lib/engines/prestacao";

export type PrazoEuribor = "3m" | "6m" | "12m";

export interface InfoEuriborPrazo {
  valor: number | null;
  serieAte: string | null;
  mediana: number | null;
}

export type TabelaPrazosEuribor = Record<PrazoEuribor, InfoEuriborPrazo>;

/**
 * O contrato de crédito partilhado pelos três níveis de /credito (V4):
 * o nível 1 lê a resposta (a prestação e o total), o nível 2 mexe nas
 * réguas e vê o mapa juro↔capital, o nível 3 confirma linha a linha —
 * tudo sobre o MESMO capital, prazo, Euribor e spread. Sem este
 * provider a frase de cima ficaria a mentir assim que uma régua mexesse.
 *
 * Regra nº 1: `euribor` pode ser null (o BPstat falhou) — nesse caso
 * `sim`/`base` são null e as peças mostram a falha, nunca um número
 * inventado.
 */
interface EstadoCredito {
  capital: number;
  anos: number;
  /** Euribor em vigor na régua — null quando a fonte falhou */
  euribor: number | null;
  spread: number;
  /** Prazo da Euribor selecionado ("3m", "6m" ou "12m") */
  prazoEuribor: PrazoEuribor;
  /** Dados dos três prazos de Euribor (3M, 6M, 12M) */
  taxasEuribor: TabelaPrazosEuribor;
  /** o choque de +1 p.p. — um interruptor, não uma nota de rodapé */
  choque: boolean;
  /** taxa efectiva = euribor + choque */
  eurEf: number | null;
  /** a simulação com o choque aplicado */
  sim: ResultadoPrestacao | null;
  /** a simulação sem choque — o custo do choque mede-se contra ela */
  base: ResultadoPrestacao | null;
  setCapital: (v: number) => void;
  setAnos: (v: number) => void;
  setEuribor: (v: number | null) => void;
  setSpread: (v: number) => void;
  setChoque: (v: boolean) => void;
  setPrazoEuribor: (p: PrazoEuribor) => void;
}

const Ctx = createContext<EstadoCredito | null>(null);

const TABELA_PADRAO: TabelaPrazosEuribor = {
  "3m": { valor: null, serieAte: null, mediana: null },
  "6m": { valor: null, serieAte: null, mediana: null },
  "12m": { valor: null, serieAte: null, mediana: null },
};

export function CreditoProvider({
  euriborInicial = null,
  taxasEuribor = TABELA_PADRAO,
  children,
}: {
  /** último valor da Euribor do BPstat — null = fonte em falha */
  euriborInicial?: number | null;
  /** tabela com valores e metadados dos prazos 3M, 6M e 12M */
  taxasEuribor?: TabelaPrazosEuribor;
  children: ReactNode;
}) {
  const [prazoEuribor, setPrazoEuriborState] = useState<PrazoEuribor>("12m");
  const [capital, setCapital] = useState(200000);
  const [anos, setAnos] = useState(30);

  // o valor inicial segue o prazo seleccionado (12M por omissão) ou euriborInicial
  const valor12m = taxasEuribor["12m"]?.valor;
  const taxaInicial = valor12m !== null && valor12m !== undefined ? valor12m : euriborInicial;

  const [euribor, setEuribor] = useState<number | null>(
    taxaInicial !== null ? Math.round(taxaInicial * 100) / 100 : null
  );
  const [spread, setSpread] = useState(1.0);
  const [choque, setChoque] = useState(false);

  const setPrazoEuribor = useCallback((p: PrazoEuribor) => {
    setPrazoEuriborState(p);
    const novo = taxasEuribor[p]?.valor;
    if (novo !== null && novo !== undefined) {
      setEuribor(Math.round(novo * 100) / 100);
    }
  }, [taxasEuribor]);

  const eurEf = euribor === null ? null : euribor + (choque ? 1 : 0);
  const sim = useMemo(
    () =>
      eurEf === null
        ? null
        : simularPrestacao(capital, anos * 12, eurEf / 100, spread / 100),
    [capital, anos, eurEf, spread]
  );
  // a base serve para ler o custo do choque em euros
  const base = useMemo(
    () =>
      euribor === null
        ? null
        : simularPrestacao(capital, anos * 12, euribor / 100, spread / 100),
    [capital, anos, euribor, spread]
  );

  const valor = useMemo<EstadoCredito>(
    () => ({
      capital,
      anos,
      euribor,
      spread,
      prazoEuribor,
      taxasEuribor,
      choque,
      eurEf,
      sim,
      base,
      setCapital,
      setAnos,
      setEuribor,
      setSpread,
      setChoque,
      setPrazoEuribor,
    }),
    [capital, anos, euribor, spread, prazoEuribor, taxasEuribor, choque, eurEf, sim, base, setPrazoEuribor]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCredito(): EstadoCredito {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCredito fora do CreditoProvider");
  return c;
}
