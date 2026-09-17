const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const eur0 = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const num = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 2 });

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const FALHOU = "—";
const finito = (v: number) => Number.isFinite(v);

export const fmtEUR = (v: number) => (finito(v) ? eur.format(v) : FALHOU);
export const fmtEUR0 = (v: number) => (finito(v) ? eur0.format(v) : FALHOU);
export const fmtNum = (v: number) => (finito(v) ? num.format(v) : FALHOU);

export const fmtPct = (v: number, casas = 1) =>
  finito(v) ? `${(v * 100).toFixed(casas).replace(".", ",")} %` : FALHOU;

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
