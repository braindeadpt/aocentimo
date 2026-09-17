"use client";

import { useMemo, useState } from "react";
import { fmtEUR } from "@/lib/format";

interface Props {
  /** pontos [{t, v}] do índice geral (CP00) */
  serie: { t: string; v: number }[];
}

/** "1000 € em 2015 valem quanto hoje?" — deflaciona pelo IHPC total. */
export function PoderDeCompra({ serie }: Props) {
  const anos = useMemo(
    () => [...new Set(serie.map((p) => p.t.slice(0, 4)))],
    [serie]
  );
  const [ano, setAno] = useState(anos[Math.min(5, anos.length - 1)] ?? "2020");
  const [valor, setValor] = useState(1000);

  const resultado = useMemo(() => {
    const ponto = serie.find((p) => p.t.startsWith(ano));
    const ultimo = serie[serie.length - 1];
    if (!ponto || !ultimo) return null;
    return valor * (ultimo.v / ponto.v);
  }, [serie, ano, valor]);

  return (
    <div className="bg-surface border border-line px-5 py-5" aria-live="polite">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kicker block mb-1.5" htmlFor="pd-valor">Valor</label>
          <input
            id="pd-valor"
            type="number"
            min={0}
            step={50}
            value={valor}
            onChange={(e) => setValor(Number(e.target.value) || 0)}
            className="field"
          />
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="pd-ano">Em janeiro de</label>
          <select
            id="pd-ano"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="field"
          >
            {anos.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="mt-5 text-ink2 text-sm">
        {resultado !== null ? (
          <>
            {fmtEUR(valor)} em janeiro de {ano} compram hoje o equivalente a{" "}
            <span className="num text-xl text-ink font-medium">{fmtEUR(resultado)}</span>
            <span className="block footnote mt-1">
              Ou seja: para manteres o mesmo poder de compra, precisavas desse
              valor agora. Diferença: {fmtEUR(resultado - valor)}.
            </span>
          </>
        ) : (
          "Sem dados suficientes."
        )}
      </p>
    </div>
  );
}
