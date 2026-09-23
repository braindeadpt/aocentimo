"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  repartePorEscaloes,
  escalaoMarginal,
  REGRAS_IRS,
  type FatiaEscalao,
} from "@/lib/engines/irs";

/**
 * O estado do nível 1 de /irs num contexto (sessão 3A): a régua do
 * rendimento coletável, os recipientes que enchem e a frase simples
 * vivem em sítios diferentes do <Pagina> — o provedor partilha o
 * `rc` e as contas derivadas entre eles. Os níveis 2 e 3 têm estado
 * próprio (o acerto e o IRS Jovem são simuladores independentes).
 *
 * O ponto de partida é o coletável do cenário canónico — o mesmo
 * bruto de 1 500 € que abre /salario chega aqui já líquido de
 * dedução específica e mínimo de existência: a faixa conta a mesma
 * história nas três páginas.
 */

export interface ReguaColetavel {
  min: number;
  max: number;
  passo: number;
  rotulo: string;
  marcador: { valor: number; rotulo: string } | null;
  descricao?: string;
  limites?: { min?: string; max?: string };
}

export interface IrsEstado {
  ano: number;
  regua: ReguaColetavel;
  /** rendimento coletável anual — o número sobre o qual os
      escalões trabalham */
  rc: number;
  setRc: (v: number) => void;
  fatias: FatiaEscalao[];
  marginal: ReturnType<typeof escalaoMarginal>;
  /** a coleta real, fatia a fatia */
  coleta: number;
  taxaMedia: number;
  /** o que o mito cobraria — tudo à taxa do último escalão tocado */
  mito: number;
  /** taxa de solidariedade — para a nota de pé dos recipientes */
  solidariedade: { de: number; taxa: number }[];
}

const Ctx = createContext<IrsEstado | null>(null);

export function ProvedorIrs({
  ano,
  regua,
  rcInicial,
  children,
}: {
  ano: number;
  regua: ReguaColetavel;
  /** o coletável do cenário canónico, calculado no servidor pelo
      motor — a régua abre no mesmo salário que abre /salario */
  rcInicial: number;
  children: ReactNode;
}) {
  const regras = REGRAS_IRS[ano];
  const [rc, setRc] = useState(rcInicial);

  const fatias = useMemo(() => repartePorEscaloes(rc, regras), [rc, regras]);
  const marginal = escalaoMarginal(rc, regras);
  const coleta = fatias.reduce((a, f) => a + f.imposto, 0);
  const taxaMedia = rc > 0 ? coleta / rc : 0;
  const mito = rc * marginal.taxa;

  const valor: IrsEstado = {
    ano,
    regua,
    rc,
    setRc,
    fatias,
    marginal,
    coleta,
    taxaMedia,
    mito,
    solidariedade: regras.solidariedade,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useIrs(): IrsEstado {
  const c = useContext(Ctx);
  if (!c) throw new Error("useIrs fora do ProvedorIrs");
  return c;
}
