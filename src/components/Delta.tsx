import { fmtPct } from "@/lib/format";

/**
 * Variação com semântica de cor + símbolo (nunca só cor).
 * `bom` indica se a variação positiva é boa (poupança) ou má (preços).
 */
export function Delta({
  value,
  goodWhenUp = false,
  casas = 1,
}: {
  value: number | null;
  goodWhenUp?: boolean;
  casas?: number;
}) {
  if (value === null) {
    return <span className="num text-muted">—</span>;
  }
  const up = value >= 0;
  const good = up === goodWhenUp;
  return (
    <span className={`num ${good ? "text-down" : "text-up"}`}>
      {up ? "▲" : "▼"} {fmtPct(Math.abs(value), casas)}
    </span>
  );
}
