"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  simularDesemprego,
  type ResultadoDesemprego,
} from "@/lib/engines/desemprego";
import {
  construirUrl,
  lerBool,
  lerInt,
  useLeituraUrl,
} from "@/lib/url-state";

/**
 * O estado de /trabalho num contexto (sessão 3A): a régua do salário
 * vive no nível 1 (com a mensalidade e a duração como resposta) e os
 * restantes controlos no nível 2 — o provedor partilha a simulação
 * entre os três níveis do <Pagina>. O ponto de partida é o cenário
 * canónico: o mesmo bruto de 1 500 € que abre /salario e /irs.
 */

export interface ReguaTrabalho {
  min: number;
  max: number;
  passo: number;
  pontos: number[];
  inicial: number;
  rotulo: string;
  marcador: { valor: number; rotulo: string } | null;
  descricao?: string;
}

export interface TrabalhoEstado {
  regua: ReguaTrabalho;

  bruto: number;
  setBruto: (v: number) => void;
  idade: number;
  setIdade: (v: number) => void;
  anosDescontos: number;
  setAnosDescontos: (v: number) => void;
  majoracao: boolean;
  setMajoracao: (v: boolean) => void;

  /** o resultado da simulação — motor puro, sem I/O */
  r: ResultadoDesemprego;
  /** duração arredondada a meses — para a barra de traços e a frase */
  meses: number;
  /** duração ultrapassa os 180 dias — há degrau de −10 % no desenho */
  temCorte: boolean;
  /** URL limpo com o estado partilhável para o <BotaoCopiar> */
  urlPartilha: string;
}

const Ctx = createContext<TrabalhoEstado | null>(null);

export function ProvedorTrabalho({
  regua,
  children,
}: {
  regua: ReguaTrabalho;
  children: ReactNode;
}) {
  const [bruto, setBruto] = useState(regua.inicial);
  const [idade, setIdade] = useState(35);
  const [anosDescontos, setAnosDescontos] = useState(5);
  const [majoracao, setMajoracao] = useState(false);

  // Leitura segura do estado por URL (Pilar 1 — T12)
  useLeituraUrl((sp) => {
    const b = lerInt(sp.get("bruto"), regua.min, regua.max);
    if (b !== undefined) setBruto(b);
    const id = lerInt(sp.get("idade"), 16, 66);
    if (id !== undefined) setIdade(id);
    const desc = lerInt(sp.get("descontos"), 0, 40);
    if (desc !== undefined) setAnosDescontos(desc);
    if (sp.has("majoracao")) setMajoracao(lerBool(sp.get("majoracao")));
  });

  const r = useMemo(
    () => simularDesemprego(bruto, idade, anosDescontos, { majoracao }),
    [bruto, idade, anosDescontos, majoracao]
  );

  const urlPartilha = useMemo(() => {
    return construirUrl(
      "/trabalho",
      {
        bruto,
        idade,
        descontos: anosDescontos,
        majoracao,
      },
      {
        bruto: regua.inicial,
        idade: 35,
        descontos: 5,
        majoracao: false,
      }
    );
  }, [bruto, idade, anosDescontos, majoracao, regua.inicial]);

  const valor: TrabalhoEstado = {
    regua,
    bruto,
    setBruto,
    idade,
    setIdade,
    anosDescontos,
    setAnosDescontos,
    majoracao,
    setMajoracao,
    r,
    meses: Math.round(r.duracaoDias / 30),
    temCorte: r.duracaoDias > 180,
    urlPartilha,
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useTrabalho(): TrabalhoEstado {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTrabalho fora do ProvedorTrabalho");
  return c;
}
