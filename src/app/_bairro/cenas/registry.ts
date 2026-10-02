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
 * segsocial → os descontos (P2b). Tudo o resto continua «em breve» (P2c).
 *
 * Os dados de cada cena chegam do servidor por props (`CenasDados`);
 * nenhum componente daqui importa `data/*.json` (AGENTS.md). O JSX da
 * cena NÃO pode importar a planta (iso/planta arrastariam o desenho) —
 * por isso os dados Fabrica chegam com os pontos das rotas já em píxeis.
 */
import dynamic from "next/dynamic";
import type { ComponentType, MutableRefObject, RefObject } from "react";
import type { DadosBanco, DadosFabrica, DadosFinancas, DadosMercearia } from "./dados";
import type { DadosBomba, DadosCorreios, DadosSegSocial } from "./dados-p2b";

import "./../bairro-cenas.css";
/**
 * A forma comum dos props de cena — cada cena recebe os SEUS dados (a
 * forma exata é verificada no `CenaViva`, com casts por cena) e o fecho.
 * `MutableRefObject`/`RefObject` da Fábrica entram aqui porque só ela
 * anima o mapa.
 */
interface PropsComuns {
  D: DadosFabrica | DadosFinancas | DadosBanco | DadosMercearia | DadosCorreios | DadosBomba | DadosSegSocial;
  mundoRef?: RefObject<HTMLDivElement | null>;
  camaraRef?: MutableRefObject<{ ir: (cx: number, cy: number, w: number, dur?: number, desvio?: number) => void } | null>;
  aoFechar: () => void;
}

const CenaFabrica = dynamic(() => import("./CenaFabrica"));
const CenaFinancas = dynamic(() => import("./CenaFinancas"));
const CenaBanco = dynamic(() => import("./CenaBanco"));
const CenaMercearia = dynamic(() => import("./CenaMercearia"));
const CenaCorreios = dynamic(() => import("./CenaCorreios"));
const CenaBomba = dynamic(() => import("./CenaBomba"));
const CenaSegSocial = dynamic(() => import("./CenaSegSocial"));

/** O edifício → o componente da cena. */
export const CENAS: Record<string, ComponentType<PropsComuns>> = {
  fabrica: CenaFabrica as ComponentType<PropsComuns>,
  financas: CenaFinancas as ComponentType<PropsComuns>,
  banco: CenaBanco as ComponentType<PropsComuns>,
  mercearia: CenaMercearia as ComponentType<PropsComuns>,
  correios: CenaCorreios as ComponentType<PropsComuns>,
  bomba: CenaBomba as ComponentType<PropsComuns>,
  segsocial: CenaSegSocial as ComponentType<PropsComuns>,
};
