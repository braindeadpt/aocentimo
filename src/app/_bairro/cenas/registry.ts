"use client";

/**
 * O registo das cenas (P2a) — o único sítio que conhece os componentes
 * de cena. O `<Bairro>` pede-os com `next/dynamic` **quando se entra no
 * edifício**: nenhum chunk de cena entra no bundle inicial da home
 * (PACK §2.3), e o CSS de conteúdo (`bairro-cenas.css`) viaja no chunk,
 * não na home.
 *
 * O mapa de ids é o do protótipo (`entrar()` no `mapa.tpl.html`):
 * fabrica → o salário; financas → as gavetas; banco → a Euribor;
 * mercearia → a inflação; correios → a poupança; bomba → o litro;
 * segsocial → os descontos (P2b); casa → os meses de trabalho;
 * pastelaria → o café e o IVA; quiosque → o Jornal do Bairro;
 * escola → ler gráficos (P2c). Os onze edifícios têm cena.
 *
 * Os dados de cada cena chegam por `fetch("/cenas/<id>.json")` ao abrir
 * (P4 — gerados no derive pela `dadosCenas()` do servidor); nenhum
 * componente daqui importa `data/*.json` (AGENTS.md). O JSX da
 * cena NÃO pode importar a planta (iso/planta arrastariam o desenho) —
 * por isso os dados Fabrica chegam com os pontos das rotas já em píxeis.
 */
import dynamic from "next/dynamic";
import type { ComponentType, MutableRefObject, RefObject } from "react";
import type { DadosBanco, DadosFabrica, DadosFinancas, DadosMercearia } from "./dados";
import type { DadosBomba, DadosCorreios, DadosSegSocial } from "./dados-p2b";
import type { DadosCasa, DadosEscola, DadosPastelaria, DadosQuiosque } from "./dados-p2c";

import "./../bairro-cenas.css";
/**
 * A forma comum dos props de cena — cada cena recebe os SEUS dados (a
 * forma exata é verificada no `CenaViva`, com casts por cena) e o fecho.
 * `MutableRefObject`/`RefObject` da Fábrica entram aqui porque só ela
 * anima o mapa.
 */
interface PropsComuns {
  D:
    | DadosFabrica
    | DadosFinancas
    | DadosBanco
    | DadosMercearia
    | DadosCorreios
    | DadosBomba
    | DadosSegSocial
    | DadosCasa
    | DadosPastelaria
    | DadosQuiosque
    | DadosEscola;
  mundoRef?: RefObject<HTMLDivElement | null>;
  camaraRef?: MutableRefObject<{ ir: (cx: number, cy: number, w: number, dur?: number, desvio?: number) => void } | null>;
  aoFechar: () => void;
}

/**
 * O mapa edificio → importador. É a FONTE ÚNICA: o `dynamic()` de cada
 * cena e o prefetch (`importarCena()`) chamam a MESMA função, para que o
 * prefetch e a cena acabem no mesmo chunk — duas funções `import()`
 * diferentes para o mesmo módulo é o caminho para o chunk ser pedido
 * duas vezes.
 */
/** A forma de um importador de cena: o `dynamic()` só quer o `default`. */
type ModuloCena = { default: ComponentType<PropsComuns> };
type Importador = () => Promise<ModuloCena>;
/** O mesmo `import()` nos dois lados: o do `dynamic()` e o do prefetch. */
const cena = (imp: () => Promise<unknown>) => imp as unknown as Importador;

const IMPORTADORES: Record<string, Importador> = {
  fabrica: cena(() => import("./CenaFabrica")),
  financas: cena(() => import("./CenaFinancas")),
  banco: cena(() => import("./CenaBanco")),
  mercearia: cena(() => import("./CenaMercearia")),
  correios: cena(() => import("./CenaCorreios")),
  bomba: cena(() => import("./CenaBomba")),
  segsocial: cena(() => import("./CenaSegSocial")),
  casa: cena(() => import("./CenaCasa")),
  pastelaria: cena(() => import("./CenaPastelaria")),
  quiosque: cena(() => import("./CenaQuiosque")),
  escola: cena(() => import("./CenaEscola")),
};

/** O edifício → o componente da cena. */
export const CENAS: Record<string, ComponentType<PropsComuns>> = Object.fromEntries(
  Object.entries(IMPORTADORES).map(([id, imp]) => [id, dynamic(imp)])
);

/**
 * Aquece o chunk de uma cena sem a montar. É isto que faz o prefetch do
 * CÓDIGO: o `import()` descarrega e avalia o módulo, e quando a cena
 * abrir o `dynamic()` já o tem — sem segunda ida à rede. Não guarda
 * nada: o browser é que faz cache do chunk.
 */
export function importarCena(id: string): Promise<unknown> | null {
  const imp = IMPORTADORES[id];
  if (!imp) return null;
  return imp().then(() => undefined);
}
