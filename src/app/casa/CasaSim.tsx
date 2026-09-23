"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { custoCompra, type ResultadoCompra, type TipoCompra } from "@/lib/engines/imt";
import {
  simularPrestacao,
  type ResultadoPrestacao,
} from "@/lib/engines/prestacao";

/**
 * A compra partilhada pelos três níveis de /casa (V4): o nível 1 lê o
 * dinheiro do dia da escritura, o nível 2 mexe nas réguas e vê a
 * escritura imprimir-se camada a camada, o nível 3 confirma tabelas —
 * tudo sobre o MESMO preço, entrada e contrato.
 *
 * Regra nº 1: `euribor` pode ser null (o BPstat falhou) — nesse caso
 * `prest` é null e a prestação mostra a falha, nunca um número
 * inventado (antes havia um fallback de 2,5 % — era inventar).
 */
interface EstadoCasa {
  preco: number;
  tipo: TipoCompra;
  jovem: boolean;
  entrada: number;
  /** entrada grampeada ao preço — nunca se entra com mais do que a casa */
  entradaEf: number;
  anos: number;
  euribor: number | null;
  spread: number;
  credito: number;
  compra: ResultadoCompra;
  prest: ResultadoPrestacao | null;
  /** o que sai do bolso no dia da escritura: entrada + impostos + registos */
  dinheiroEntrada: number;
  /** o total da escritura: preço + todos os custos */
  realEscritura: number;
  setPreco: (v: number) => void;
  setTipo: (v: TipoCompra) => void;
  setJovem: (v: boolean) => void;
  setEntrada: (v: number) => void;
  setAnos: (v: number) => void;
  setEuribor: (v: number | null) => void;
  setSpread: (v: number) => void;
}

const Ctx = createContext<EstadoCasa | null>(null);

export function CasaProvider({
  euriborInicial,
  children,
}: {
  /** último valor da Euribor 3M do BPstat — null = fonte em falha */
  euriborInicial: number | null;
  children: ReactNode;
}) {
  const [preco, setPreco] = useState(200000);
  const [tipo, setTipo] = useState<TipoCompra>("hpp");
  const [jovem, setJovem] = useState(false);
  const [entrada, setEntrada] = useState(20000);
  const [anos, setAnos] = useState(30);
  const [euribor, setEuribor] = useState<number | null>(
    euriborInicial !== null ? Math.round(euriborInicial * 100) / 100 : null
  );
  const [spread, setSpread] = useState(1.0);

  const entradaEf = Math.min(Math.max(0, entrada), Math.max(0, preco));
  const credito = Math.max(0, preco - entradaEf);

  const compra = useMemo(
    () => custoCompra(preco, { tipo, jovem, montanteCredito: credito }),
    [preco, tipo, jovem, credito]
  );
  const prest = useMemo(
    () =>
      euribor === null
        ? null
        : simularPrestacao(credito, anos * 12, euribor / 100, spread / 100),
    [credito, anos, euribor, spread]
  );

  const valor = useMemo<EstadoCasa>(
    () => ({
      preco,
      tipo,
      jovem,
      entrada,
      entradaEf,
      anos,
      euribor,
      spread,
      credito,
      compra,
      prest,
      dinheiroEntrada: entradaEf + compra.totalCustos,
      realEscritura: preco + compra.totalCustos,
      setPreco,
      setTipo,
      setJovem,
      setEntrada,
      setAnos,
      setEuribor,
      setSpread,
    }),
    [
      preco,
      tipo,
      jovem,
      entrada,
      entradaEf,
      anos,
      euribor,
      spread,
      credito,
      compra,
      prest,
    ]
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCasa(): EstadoCasa {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCasa fora do CasaProvider");
  return c;
}
