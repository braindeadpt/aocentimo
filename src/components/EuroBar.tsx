import { fmtEUR, fmtPct } from "@/lib/format";

export interface Segmento {
  label: string;
  valor: number;
  cor: string;
  texto?: string; // cor do texto dentro do segmento
}

/**
 * A barra do euro — a assinatura do site. Desmonta um total em fatias
 * proporcionais: quem fica com o quê. Anima uma vez, à entrada.
 */
export function EuroBar({
  segmentos,
  total,
  unidade = "€",
}: {
  segmentos: Segmento[];
  total: number;
  unidade?: string;
}) {
  return (
    <div>
      <div
        className="flex h-16 md:h-20 w-full overflow-hidden border border-ink"
        role="img"
        aria-label={segmentos.map((s) => `${s.label}: ${fmtEUR(s.valor)}`).join(", ")}
      >
        {segmentos.map((s, i) => {
          const w = total > 0 ? (s.valor / total) * 100 : 0;
          return (
            <div
              key={s.label}
              className="eurobar-seg relative h-full border-r border-paper last:border-0"
              style={{
                width: `${w}%`,
                backgroundColor: s.cor,
                animationDelay: `${i * 140}ms`,
              }}
            >
              {w >= 12 && (
                <span
                  className="num absolute inset-0 flex items-center justify-center text-xs md:text-sm"
                  style={{ color: s.texto ?? "var(--color-paper)" }}
                >
                  {fmtPct(s.valor / total, 0)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <table className="mt-3 w-full text-sm">
        <tbody>
          {segmentos.map((s) => (
            <tr key={s.label} className="border-b border-line last:border-0">
              <td className="py-1.5 text-ink2">
                <span
                  className="mr-2 inline-block h-2.5 w-2.5 align-middle"
                  style={{ backgroundColor: s.cor }}
                />
                {s.label}
              </td>
              <td className="num py-1.5 text-right">
                {fmtEUR(s.valor)} {unidade === "€" ? "" : unidade}
              </td>
              <td className="num w-16 py-1.5 text-right text-muted">
                {fmtPct(total > 0 ? s.valor / total : 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
