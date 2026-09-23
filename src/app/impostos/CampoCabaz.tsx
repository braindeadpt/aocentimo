"use client";

import { useState } from "react";
import { CampoCentimos, type ParteCentimos, type TextosCentimos } from "@/components/CampoCentimos";
import { Cartao } from "@/components/Cartao";
import { Segmentado } from "@/components/Segmentado";
import type { NomeLayout } from "@/lib/pontos/layouts";

/**
 * O instrumento do nível 1 de /impostos (3B-01): o euro do cabaz de
 * exemplo desfeito em 100 cêntimos — os pontos do IVA saem (vermelhão),
 * o resto é o preço real das coisas. Nasce em «montes» — a resposta
 * está no HTML do servidor; o segmento «moeda» devolve a peça-mãe e a
 * transição moeda → montes é a coreografia da casa, corrida a pedido.
 *
 * O rótulo CABAZ DE EXEMPLO é parte do instrumento (breadcrumb e meta):
 * nunca se lê como média nacional — os preços são do talão editável
 * do nível 2, as taxas são as legais do continente (CIVA).
 */
export function CampoCabaz({
  partes,
  textos,
  equivalente,
  breadcrumb,
  meta,
  rotuloFonte,
  fonteNome,
  fonteUrl,
}: {
  partes: ParteCentimos[];
  textos: TextosCentimos;
  equivalente: string;
  breadcrumb: string;
  meta: string[];
  rotuloFonte: string;
  fonteNome: string;
  fonteUrl?: string;
}) {
  const [layout, setLayout] = useState<NomeLayout>("montes");
  return (
    <Cartao
      breadcrumb={breadcrumb}
      icone="impostos"
      meta={meta}
      fonte={{ rotulo: rotuloFonte, itens: [{ nome: fonteNome, url: fonteUrl }] }}
      controlos={
        <Segmentado
          rotulo="Ver o euro do cabaz como"
          valor={layout}
          onChange={(id) => setLayout(id as NomeLayout)}
          opcoes={[
            { id: "moeda", rotulo: "A moeda" },
            { id: "montes", rotulo: "Os cêntimos" },
          ]}
        />
      }
    >
      <CampoCentimos
        partes={partes}
        layout={layout}
        textos={textos}
        equivalente={equivalente}
      />
    </Cartao>
  );
}
