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

export const fmtEUR = (v: number) => eur.format(v);
export const fmtEUR0 = (v: number) => eur0.format(v);
export const fmtNum = (v: number) => num.format(v);

export const fmtPct = (v: number, casas = 1) =>
  `${(v * 100).toFixed(casas).replace(".", ",")} %`;

/** "2026-08" → "ago 2026"; "2026-08-15" → "15 ago 2026". */
export function fmtData(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const mes = MESES[(m ?? 1) - 1];
  return d ? `${d} ${mes} ${y}` : `${mes} ${y}`;
}
