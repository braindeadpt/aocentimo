/**
 * Eixos — B-01. Marcas e rótulos PT-PT para as escalas de viz/escalas.
 * Rótulos curtos escolhidos pela amplitude do domínio:
 * «jan 24» (meses), «T1 24» (trimestres), «S1 25» (semestres), «2024».
 */
import { fmtNum } from "@/lib/format";
import type { EscalaTempo, EscalaValor } from "./escalas";

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** espaço fino inseparável antes de % e € */
const FINA = "\u202F";

export interface TickTempo {
  x: number;
  rotulo: string;
}

export interface TickValor {
  y: number;
  rotulo: string;
}

type PassoTempo = "mes" | "trimestre" | "semestre" | "ano";

const MES_POR_PASSO: [PassoTempo, number][] = [
  ["mes", 1],
  ["trimestre", 3],
  ["semestre", 6],
  ["ano", 12],
  ["ano", 24],
  ["ano", 60],
  ["ano", 120],
];

/** Primeiro início de período (múltiplo de `passoMeses`) >= d. */
function proximoInicio(d: Date, passoMeses: number): number {
  const idx = d.getUTCFullYear() * 12 + d.getUTCMonth();
  const eLimite =
    d.getTime() === Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) &&
    idx % passoMeses === 0;
  const prox = eLimite
    ? idx
    : (Math.floor(idx / passoMeses) + 1) * passoMeses;
  return Date.UTC(Math.floor(prox / 12), prox % 12, 1);
}

function rotuloTempo(d: Date, passo: PassoTempo): string {
  const m = d.getUTCMonth();
  const aa = String(d.getUTCFullYear()).slice(2);
  switch (passo) {
    case "mes":
      return `${MESES[m]} ${aa}`;
    case "trimestre":
      return `T${m / 3 + 1} ${aa}`;
    case "semestre":
      return `S${m / 6 + 1} ${aa}`;
    case "ano":
      return `${d.getUTCFullYear()}`;
  }
}

/**
 * Marcas do eixo do tempo: o passo mais próximo de `n` marcas, alinhado
 * ao início dos períodos (1 de jan, inícios de trimestre/semestre).
 */
export function ticksTempo(escala: EscalaTempo, n = 5): TickTempo[] {
  const [d0, d1] = escala.domain();
  const meses =
    (d1.getTime() - d0.getTime()) / (30.44 * 86_400_000);
  let [passo, passoMeses] = MES_POR_PASSO[0];
  for (const c of MES_POR_PASSO) {
    if (Math.abs(meses / c[1] - n) <= Math.abs(meses / passoMeses - n)) {
      [passo, passoMeses] = c;
    }
  }
  const ticks: TickTempo[] = [];
  let t = proximoInicio(d0, passoMeses);
  for (let i = 0; i < 500 && t <= d1.getTime(); i++) {
    const d = new Date(t);
    ticks.push({ x: escala(d), rotulo: rotuloTempo(d, passo) });
    const idx = d.getUTCFullYear() * 12 + d.getUTCMonth() + passoMeses;
    t = Date.UTC(Math.floor(idx / 12), idx % 12, 1);
  }
  return ticks;
}

/** Rótulo de valor por unidade — vírgula decimal, espaço fino antes de %/€. */
export function rotuloValor(v: number, unidade: string): string {
  if (unidade === "%") return `${fmtNum(v)}${FINA}%`;
  if (unidade === "EUR" || unidade === "€") return `${fmtNum(v)}${FINA}€`;
  if (unidade.startsWith("€")) return `${fmtNum(v)}${FINA}${unidade}`;
  if (unidade === "p.p.") return `${fmtNum(v)}${FINA}p.p.`;
  return fmtNum(v);
}

/** Marcas do eixo de valores — nice numbers do d3 + rótulo por unidade. */
export function ticksValor(
  escala: EscalaValor,
  n = 4,
  unidade = ""
): TickValor[] {
  return escala
    .ticks(n)
    .map((v) => ({ y: escala(v), rotulo: rotuloValor(v, unidade) }));
}
