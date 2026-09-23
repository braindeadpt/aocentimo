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
import { Segmentado } from "@/components/Segmentado";
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
      {/* os três layouts são uma escolha mutuamente exclusiva — o
          controlo segmentado do sistema (1B-03) */}
      <Segmentado
        className="mt-4"
        rotulo="Layout do campo"
        valor={layout}
        onChange={(id) => setLayout(id as NomeLayout)}
        opcoes={PASSOS.map((p) => ({ id: p.nome, rotulo: p.rotulo }))}
      />
    </div>
  );
}
