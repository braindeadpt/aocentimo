"use client";

/**
 * Exemplo vivo do <CampoCentimos> em /estilo: o euro de custo do
 * trabalho (cenário canónico, calculado no servidor) — moeda → grelha →
 * montes, com a coreografia de revelação aprovada. Os dados chegam por
 * props; o componente é puro.
 */
import { useState } from "react";
import {
  CampoCentimos,
  type ParteCentimos,
  type TextosCentimos,
} from "@/components/CampoCentimos";
import type { NomeLayout } from "@/lib/pontos/layouts";

const PASSOS: { nome: NomeLayout; rotulo: string }[] = [
  { nome: "moeda", rotulo: "Moeda" },
  { nome: "grelha", rotulo: "Grelha" },
  { nome: "montes", rotulo: "Montes" },
];

export function CampoCentimosDemo({
  partes,
  textos,
  equivalente,
}: {
  partes: ParteCentimos[];
  textos: TextosCentimos;
  equivalente: string;
}) {
  const [layout, setLayout] = useState<NomeLayout>("moeda");
  return (
    <div>
      <CampoCentimos
        partes={partes}
        layout={layout}
        textos={textos}
        equivalente={equivalente}
      />
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Layout do campo">
        {PASSOS.map((p) => (
          <button
            key={p.nome}
            type="button"
            className={`btn${layout === p.nome ? " btn-primary" : ""}`}
            aria-pressed={layout === p.nome}
            onClick={() => setLayout(p.nome)}
          >
            {p.rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}
