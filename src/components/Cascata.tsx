import { fmtEUR, fmtPct } from "@/lib/format";

export interface Passo {
  label: string;
  /** positivo = entra; negativo = corte */
  valor: number;
  tipo: "base" | "corte" | "total";
  nota?: string;
}

/**
 * A cascata — anatomia de um montante que vai sendo cortado.
 * Cada linha mostra a fatia que sai (acento) e o que continua (tinta),
 * proporcionais ao total inicial. Tabela semântica por baixo.
 */
export function Cascata({ passos }: { passos: Passo[] }) {
  const total = passos.find((p) => p.tipo === "base")?.valor ?? 0;

  // valor corrente após cada passo — cálculo puro, sem estado
  const linhas = passos.map((p, i) => {
    const depois =
      p.tipo === "base"
        ? p.valor
        : total +
          passos
            .slice(0, i + 1)
            .filter((q) => q.tipo === "corte")
            .reduce((a, q) => a + q.valor, 0);
    return { ...p, depois };
  });

  return (
    <div>
      <div className="space-y-1.5" role="img"
        aria-label={linhas.map((l) => `${l.label}: ${fmtEUR(Math.abs(l.valor))}`).join(", ")}>
        {linhas.map((l) => {
          const fica = total > 0 ? (l.depois / total) * 100 : 0;
          const sai = total > 0 ? (Math.abs(l.tipo === "corte" ? l.valor : 0) / total) * 100 : 0;
          return (
            <div key={l.label} className="grid grid-cols-[7.5rem_1fr_5.5rem] md:grid-cols-[10rem_1fr_7rem] items-center gap-3">
              <span className={`text-xs md:text-sm ${l.tipo === "total" ? "font-medium" : "text-ink2"}`}>
                {l.label}
              </span>
              <div className="flex h-6 md:h-7">
                {l.tipo === "corte" ? (
                  <>
                    <div className="eurobar-seg h-full" style={{ width: `${fica}%`, backgroundColor: "var(--color-keep)" }} />
                    <div className="eurobar-seg h-full" style={{ width: `${sai}%`, backgroundColor: "var(--color-accent)" }} />
                  </>
                ) : (
                  <div
                    className="eurobar-seg h-full"
                    style={{
                      width: `${fica}%`,
                      backgroundColor: l.tipo === "total" ? "var(--color-keep)" : "var(--color-ink2)",
                    }}
                  />
                )}
              </div>
              <span className={`num text-right text-xs md:text-sm ${l.tipo === "corte" ? "text-up" : l.tipo === "total" ? "font-medium" : "text-ink2"}`}>
                {l.tipo === "corte" ? "−" : ""}
                {fmtEUR(Math.abs(l.valor))}
              </span>
            </div>
          );
        })}
      </div>

      <table className="sr-only">
        <caption>Decomposição em cascata</caption>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.label}>
              <td>{l.label}</td>
              <td>{fmtEUR(l.valor)}</td>
              <td>{fmtPct(total > 0 ? l.depois / total : 0)} do total</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
