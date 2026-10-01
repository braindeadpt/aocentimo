/**
 * O IRS como gavetas (P2a · a cena das Finanças).
 *
 * A porta de `irsGavetas()` do protótipo (`cena-financas.js`), como
 * módulo PURO: entra o rendimento coletável, sai o que cai em cada
 * gaveta. Sem DOM, sem formatação, sem JSON — só a regra do art. 68.º:
 * o rendimento enche as gavetas de baixo para cima e a taxa de cada uma
 * só se aplica ao que está lá dentro.
 *
 * É aqui que o teste tem de bater certo com `data/derived/
 * cenarios-salario.json`: se os escalões de `irs-2026.json` e a conta das
 * gavetas divergirem do motor, alguém partiu a regra.
 */
import type { Escalao } from "./dados";

/** O que caiu numa gaveta para um dado rendimento coletável. */
export interface Gaveta {
  /** O índice do escalão (0 = o de baixo). */
  k: number;
  de: number;
  ate: number | null;
  taxa: number;
  /** Quanto do rendimento caiu nesta gaveta. */
  dentro: number;
  /** O imposto que esta gaveta cobra: `dentro × taxa`. */
  imposto: number;
}

/** As gavetas, com a parte de cada — de baixo para cima. */
export function irsGavetas(escaloes: readonly Escalao[], rendimento: number): Gaveta[] {
  let de = 0;
  return escaloes.map((e, k) => {
    const ate = e.ate ?? Infinity;
    const dentro = Math.max(0, Math.min(rendimento, ate) - de);
    const g: Gaveta = { k, de, ate: e.ate, taxa: e.taxa, dentro, imposto: dentro * e.taxa };
    de = ate;
    return g;
  });
}

/** O IRS total só pelos escalões — a soma das gavetas. */
export function irsPorEscaloes(escaloes: readonly Escalao[], rendimento: number): number {
  return irsGavetas(escaloes, rendimento).reduce((a, g) => a + g.imposto, 0);
}

/**
 * O rendimento coletável de um salário bruto mensal: 14 meses (os
 * subsídios contam) menos o que for maior entre a dedução específica e
 * 11 % (a taxa da Segurança Social sobre o rendimento). É a mesma conta
 * do protótipo e do simulador de /salario.
 */
export function coletavel(brutoMes: number, dedEsp: number, ssTaxa: number): number {
  const ano = brutoMes * 14;
  return Math.max(0, ano - Math.max(dedEsp, ano * ssTaxa));
}

/** A gaveta mais alta com dinheiro lá dentro, ou `null` se não há. */
export function gavetaMaisAlta(escaloes: readonly Escalao[], rendimento: number): Gaveta | null {
  const comDentro = irsGavetas(escaloes, rendimento).filter((g) => g.dentro > 0);
  return comDentro.length ? comDentro[comDentro.length - 1] : null;
}
