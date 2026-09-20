"use client";

/**
 * Barras com interruptor de ordenação — para a reordenação FLIP se ver
 * no /estilo. Dados reais do painel (variação homóloga em %).
 */
import { useState } from "react";
import { Barras } from "@/components/instrumentos/Barras";
import painel from "@data/derived/painel.json";

const ORDENS = ["valor", "rotulo"] as const;

export function BarrasDemo() {
  const [ordem, setOrdem] = useState<(typeof ORDENS)[number]>("valor");
  const itens = painel.series
    .filter((s) => s.variacao.pct !== null)
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      rotulo: s.rotulo,
      valor: Math.round((s.variacao.pct ?? 0) * 1000) / 10,
      t: s.t,
    }));
  return (
    <div>
      <div className="mb-3 flex gap-2" role="group" aria-label="ordenar barras">
        {ORDENS.map((o) => (
          <button
            key={o}
            type="button"
            className={`btn${ordem === o ? " btn-primary" : ""}`}
            onClick={() => setOrdem(o)}
          >
            por {o === "valor" ? "valor" : "nome"}
          </button>
        ))}
      </div>
      <Barras
        itens={itens}
        unidade="%"
        ordenar={ordem}
        titulo="Variação homóloga dos instrumentos do painel"
      />
    </div>
  );
}
