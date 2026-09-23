/**
 * Formatos de valor serializáveis para as codificações V4 (S1-05).
 * Props de client components não podem ser funções — escolhe-se a
 * chave no servidor e a formatação resolve-se aqui, partilhada por
 * Haltere, BarraTracos e AnelPontos. Espelha o registo da Leitura:
 * «pct» significa que o valor JÁ vem em % (3,55 → «3,55 %»), não uma
 * fracção.
 */
import { comUnidade, fmtEUR, fmtEUR0, fmtLitro, fmtNum } from "@/lib/format";

export type FormatoViz =
  | "num"
  | "num1"
  | "eur"
  | "eur0"
  | "pct"
  | "pct1"
  | "litro"
  | "pp"
  | "kwh";

export function fmtViz(formato: FormatoViz, v: number): string {
  switch (formato) {
    case "eur":
      return fmtEUR(v);
    case "eur0":
      return fmtEUR0(v);
    case "pct":
      return comUnidade(fmtNum(v, 2), "%");
    case "pct1":
      return comUnidade(fmtNum(v, 1), "%");
    case "litro":
      return fmtLitro(v);
    case "pp":
      return comUnidade(fmtNum(v, 1), "p.p.");
    case "kwh":
      return comUnidade(fmtNum(v, 4), "€/kWh");
    case "num1":
      return fmtNum(v, 1);
    case "num":
    default:
      return fmtNum(v);
  }
}

/** casas decimais de leitura por formato — para deltas e neutros. */
export function casasViz(formato: FormatoViz): number {
  switch (formato) {
    case "pct":
      return 2;
    case "pct1":
    case "pp":
    case "num1":
      return 1;
    case "litro":
      return 3;
    case "kwh":
      return 4;
    case "eur":
    case "num":
      return 2;
    case "eur0":
    default:
      return 0;
  }
}

/** unidade da VARIAÇÃO (agora − antes): em séries de % a diferença é
    em pontos percentuais, não em % — «p.p.» é o default honesto.
    Devolve a unidade SEM espaço — a ponte ao número é o FINO, posto
    por quem compõe (comUnidade). */
export function unidadeDeltaViz(formato: FormatoViz): string {
  switch (formato) {
    case "pct":
    case "pct1":
    case "pp":
      return "p.p.";
    case "eur":
    case "eur0":
      return "€";
    case "litro":
      return "€/L";
    case "kwh":
      return "€/kWh";
    case "num":
    case "num1":
    default:
      return "";
  }
}
