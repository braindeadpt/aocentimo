"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  simularPrestacao,
  type ResultadoPrestacao,
} from "@/lib/engines/prestacao";

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
  /** o choque de +1 p.p. — um interruptor, não uma nota de rodapé */
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
}

const Ctx = createContext<EstadoCredito | null>(null);

export function CreditoProvider({
  euriborInicial,
  children,
}: {
  /** último valor da Euribor 3M do BPstat — null = fonte em falha */
  euriborInicial: number | null;
  children: ReactNode;
}) {
  const [capital, setCapital] = useState(200000);
  const [anos, setAnos] = useState(30);
  const [euribor, setEuribor] = useState<number | null>(
    euriborInicial !== null ? Math.round(euriborInicial * 100) / 100 : null
  );
  const [spread, setSpread] = useState(1.0);
  const [choque, setChoque] = useState(false);

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
      choque,
      eurEf,
      sim,
      base,
      setCapital,
      setAnos,
      setEuribor,
      setSpread,
      setChoque,
    }),
    [capital, anos, euribor, spread, choque, eurEf, sim, base]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCredito(): EstadoCredito {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCredito fora do CreditoProvider");
  return c;
}
