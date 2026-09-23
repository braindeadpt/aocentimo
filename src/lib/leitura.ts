import type { Freshness } from "@/lib/data";
import { comUnidade, fmtNum, fmtPeriodo } from "@/lib/format";
import { m, t } from "@/lib/messages";
import type {
  EstadoLeitura,
  LeituraProps,
  PontoLeitura,
  RotulosLeitura,
} from "@/components/Leitura";

/**
 * Helpers partilhados para montar cartões `Leitura` nas páginas
 * temáticas (R-04a) — a lógica de série vive aqui para a home e as
 * páginas não duplicarem janela/homóloga/anotação.
 *
 * SERVIDOR-ONLY: importa `m`/`t` (messages/pt.json) e lê-se ao lado
 * de `loadFonte`/`loadDerivado` — nunca importar num client
 * component (arrastava o dicionário inteiro para o browser).
 */

export type Ponto = PontoLeitura;
export type Cartao = Omit<LeituraProps, "rotulos">;

/** janela dos últimos ~10 anos — o ano vem do prefixo do período
    (regra do derivador: mensal, trimestral e semestral servem) */
export function janela10(s: Ponto[]): Ponto[] {
  const ult = s[s.length - 1];
  if (!ult) return s;
  const fim = Number(ult.t.slice(0, 4));
  return s.filter((p) => Number(p.t.slice(0, 4)) >= fim - 10);
}

/** taxa homóloga de um índice — v / v[i-passo] − 1, em % */
export function homologa(s: Ponto[], passo: number): Ponto[] {
  return s.slice(passo).map((p, i) => ({ t: p.t, v: (p.v / s[i].v - 1) * 100 }));
}

/** mediana simples — a referência constante dos Leituras de taxa */
export function mediana(valores: number[]): number | null {
  const s = valores.filter(Number.isFinite).sort((a, b) => a - b);
  if (s.length === 0) return null;
  const meio = Math.floor(s.length / 2);
  return s.length % 2 ? s[meio] : (s[meio - 1] + s[meio]) / 2;
}

/** UM extremo real da janela — a anotação é sempre um dado, nunca
    um ponto inventado; o rótulo já sai formatado do servidor */
export function anotacaoDe(
  s: Ponto[],
  tipo: "max" | "min",
  fmt: (v: number) => string
): Cartao["anotacao"] {
  if (s.length === 0) return undefined;
  const p = s.reduce((b, q) =>
    tipo === "max" ? (q.v > b.v ? q : b) : q.v < b.v ? q : b
  );
  return {
    t: p.t,
    rotulo: t(tipo === "max" ? m.leitura.pico : m.leitura.minimo, {
      periodo: fmtPeriodo(p.t),
      valor: fmt(p.v),
    }),
  };
}

/** insight «{abs} p.p. {acima|abaixo} da mediana de 10 anos» — cai
    para «{valor} {unidade}» quando não há referência calculada */
export function insightMediana(
  valor: number,
  referencia: { valor: number } | null | undefined,
  unidade: string
): string {
  return referencia
    ? t(m.painel.insightMediana, {
        abs: fmtNum(Math.abs(valor - referencia.valor)),
        direcao: valor >= referencia.valor ? m.painel.acima : m.painel.abaixo,
      })
    : comUnidade(fmtNum(valor), unidade);
}

/** estado de frescura de uma fonte — «sem-sla» quando o watchdog
    não acompanha a série (ex.: derivados) */
export function estadoDe(fresh: Freshness | null, id: string): EstadoLeitura {
  return fresh?.series.find((s) => s.id === id)?.estado ?? "sem-sla";
}

/** os rótulos fixos do cartão — um objecto por página, vindo do `m` */
export function rotulosLeitura(): RotulosLeitura {
  return {
    leitura: m.leitura.leitura,
    fonte: m.leitura.fonte,
    pagina: m.leitura.pagina,
    json: m.leitura.json,
    jsonAria: m.leitura.jsonAria,
    estados: {
      "em-dia": m.leitura.emDia,
      atrasada: m.leitura.atrasada,
      "sem-sla": m.leitura.semSla,
    },
    aria: m.leitura.aria,
  };
}
