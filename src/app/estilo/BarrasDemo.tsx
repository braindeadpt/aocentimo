"use client";

/**
 * Barras com interruptor de ordenação — para a reordenação FLIP se ver
 * no /estilo. Dados reais do painel (variação homóloga em %).
 */
import { useState } from "react";
import { Barras } from "@/components/instrumentos/Barras";

const ORDENS = ["valor", "rotulo"] as const;

/* os itens chegam por props do servidor — importar painel.json aqui
   metia os 38 KB do ficheiro no chunk do cliente */
export function BarrasDemo({
  itens,
}: {
  itens: { id: string; rotulo: string; valor: number; t: string }[];
}) {
  const [ordem, setOrdem] = useState<(typeof ORDENS)[number]>("valor");
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
