/* Regra de dinheiro do site (V4, S1-02): os milhares agrupam-se SEMPRE a
   partir de 1 000 — o CLDR pt-PT só agrupa a partir de 5 dígitos, o que
   punha «1 500 €» (copy) e «1167 €» (formatador) no mesmo cartão.
   useGrouping:"always" em TODOS os formatadores numéricos.

   Lettering (1B-02): entre número e unidade vai sempre o espaço fino
   inseparável (FINO, U+202F) — nunca espaço normal nem NBSP largo —
   e o sinal de menos é o verdadeiro (MENOS, U+2212), nunca hífen.
   `tipo()` aplica os dois à saída do Intl; `comUnidade` é a única
   maneira de colar unidade a um número («1 856 €», «63,2 c», «3,6 %»). */
const GRUPO = { useGrouping: "always" } as const;

/** espaço fino inseparável — U+202F; serve de separador de milhares e
    de ponte número↔unidade, para nunca se cortar uma linha a meio */
export const FINO = "\u202F";
/** sinal de menos verdadeiro — U+2212; o hífen (-) é para hifenizar
    palavras, nunca para valores negativos ou deltas */
export const MENOS = "\u2212";

/** «1 856» + «€» → «1 856 €» — a ponte é sempre o FINO;
    sem unidade devolve o número tal qual (nunca um fino órfão) */
export const comUnidade = (numero: string, unidade: string) =>
  unidade ? `${numero}${FINO}${unidade}` : numero;

/** saída do Intl com a tipografia da casa: o hífen de sinal torna-se
    menos verdadeiro e os espaços do agrupamento/unidade tornam-se
    finos inseparáveis (o Intl emite NBSP U+00A0 — largo, não fino) */
const tipo = (s: string) =>
  s.replace(/[  ]/g, FINO).replace(/-/g, MENOS);

const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
  ...GRUPO,
});

const eur0 = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
  ...GRUPO,
});

const num = new Intl.NumberFormat("pt-PT", {
  maximumFractionDigits: 2,
  ...GRUPO,
});
const numFixos = new Map<number, Intl.NumberFormat>();
function numFixo(casas: number): Intl.NumberFormat {
  let f = numFixos.get(casas);
  if (!f) {
    f = new Intl.NumberFormat("pt-PT", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
      ...GRUPO,
    });
    numFixos.set(casas, f);
  }
  return f;
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const FALHOU = "—";
const finito = (v: number) => Number.isFinite(v);

export const fmtEUR = (v: number) => (finito(v) ? tipo(eur.format(v)) : FALHOU);
export const fmtEUR0 = (v: number) => (finito(v) ? tipo(eur0.format(v)) : FALHOU);
/**
 * Número em pt-PT. Sem `casas`, corta no máximo em 2 decimais;
 * com `casas`, fixa as decimais — usa-a em colunas/tabelas para o
 * tabular-nums alinhar (ex.: "0,90" ao lado de "2,16").
 */
export const fmtNum = (v: number, casas?: number) =>
  finito(v)
    ? tipo((casas === undefined ? num : numFixo(casas)).format(v))
    : FALHOU;

/** €/litro — a DGEG publica os PMD com 3 casas decimais. */
export const fmtLitro = (v: number) =>
  finito(v)
    ? comUnidade(v.toFixed(3).replace(".", ",").replace(/-/g, MENOS), "€/L")
    : FALHOU;

export const fmtPct = (v: number, casas = 1) =>
  finito(v)
    ? comUnidade((v * 100).toFixed(casas).replace(".", ",").replace(/-/g, MENOS), "%")
    : FALHOU;

/** "2026-09-20T19:43:30Z" → "20 set 2026 · 21:43" (hora de Lisboa);
 *  aceita também datas simples → devolve só a data. */
export function fmtDataHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return FALHOU;
  if (!iso.includes("T")) return fmtData(iso);
  const data = new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Lisbon",
  }).format(d);
  const hora = new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Lisbon",
  }).format(d);
  return `${data} · ${hora}`;
}

/** Período de série oficial → PT curto:
 *  "2026-Q1" → "1.º trim. 2026"; "2025-S2" → "2.º sem. 2025";
 *  datas e meses delegam em fmtData ("2026-08" → "ago 2026",
 *  "2026-09-17" → "17 set 2026", "2026" → "2026"). */
export function fmtPeriodo(t: string): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(t.trim());
  if (q) return `${q[2]}.º trim. ${q[1]}`;
  const s = /^(\d{4})-S([12])$/.exec(t.trim());
  if (s) return `${s[2]}.º sem. ${s[1]}`;
  return fmtData(t);
}

/** "2026-08" → "ago 2026"; "2026-08-15" → "15 ago 2026"; malformado → "—". */
export function fmtData(iso: string): string {
  const partes = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/.exec(iso.trim());
  if (!partes) return FALHOU;
  const [, y, m, d] = partes;
  const mes = m === undefined ? null : Number(m);
  const dia = d === undefined ? null : Number(d);
  if (mes !== null && (mes < 1 || mes > 12)) return FALHOU;
  if (dia !== null && (dia < 1 || dia > 31)) return FALHOU;
  if (mes === null) return y;
  return dia !== null ? `${dia} ${MESES[mes - 1]} ${y}` : `${MESES[mes - 1]} ${y}`;
}
