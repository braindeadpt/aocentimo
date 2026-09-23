"use client";

import { useState } from "react";
import { CampoCentimos, type ParteCentimos } from "@/components/CampoCentimos";
import { Cartao, type EstadoCartao } from "@/components/Cartao";
import { Isometrico, type CamadaIsometrica } from "@/components/Isometrico";
import { NumHero } from "@/components/NumHero";
import { Segmentado } from "@/components/Segmentado";
import { comUnidade, fmtLitro, fmtNum, fmtPct } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";

/**
 * O litro de combustível em DUAS peças (3B-01, catálogo V4):
 *
 *   · ESTRUTURA — <Isometrico>: produto + margens na base, carbono e
 *     ISP por cima, e a camada do IVA assentada sobre a pilha inteira —
 *     o IVA calcula-se sobre o preço que já inclui ISP («imposto sobre
 *     imposto», o facto mais contra-intuitivo da página). A geometria
 *     é fixa: o isométrico não mede, mostra o que está dentro.
 *   · QUANTIDADE — campo de cêntimos em montes: 1 ponto = 1 cêntimo do
 *     litro ao preço real de hoje (PMD DGEG); os pontos que saem são
 *     os impostos.
 *
 * Os valores chegam pré-calculados do servidor (motor fora do cliente):
 * decomporCombustivel() sobre o último PMD DGEG e as taxas de
 * data/fiscal/isp.json vigentes. A escolha do combustível troca os
 * dois cartões de uma vez — são o mesmo litro.
 */

export interface LitroFuelItem {
  id: string;
  /** «Gasóleo simples» */
  rotulo: string;
  /** último PMD DGEG em €/L */
  precoLitro: number;
  /** «série até 20 set 2026» — já formatado no servidor */
  leituraAte: string;
  /** saída de decomporCombustivel(), calculada no servidor */
  dec: {
    produto: number;
    carbono: number;
    isp: number;
    iva: number;
    impostos: number;
    pesoImpostos: number;
  };
  estado: EstadoCartao;
  estadoRotulo: string;
}

export function LitroFuel({
  combustiveis,
  rotuloCombustivel,
  rotuloFonte,
  fonteDgeg,
  fonteIsp,
}: {
  combustiveis: LitroFuelItem[];
  /** «Combustível» — aria-label do segmentado */
  rotuloCombustivel: string;
  rotuloFonte: string;
  /** { nome, url } da série PMD DGEG */
  fonteDgeg: { nome: string; url?: string };
  /** { nome, url } da portaria ISP em vigor */
  fonteIsp: { nome: string; url?: string };
}) {
  const [id, setId] = useState(combustiveis[0]?.id ?? "");
  const c = combustiveis.find((x) => x.id === id) ?? combustiveis[0];
  const { ref, arm } = useArmado<HTMLElement>(`litro:${c.id}`);

  const d = c.dec;
  const centimosTotal = Math.max(1, Math.round(c.precoLitro * 100));

  const camadas: CamadaIsometrica[] = [
    {
      id: "litro",
      forma: "moeda",
      rotulo: "O litro",
      detalhe: "o preço na bomba, já com tudo lá dentro",
      tom: "neutro",
      textoLista: fmtLitro(c.precoLitro),
    },
    {
      id: "iva",
      forma: "placa",
      rotulo: "IVA 23 %",
      detalhe:
        "calcula-se sobre o preço já com ISP e carbono — imposto sobre imposto",
      tom: "corte",
      texto: fmtLitro(d.iva),
      textoLista: fmtLitro(d.iva),
    },
    {
      id: "isp",
      forma: "placa",
      rotulo: "ISP",
      detalhe: "imposto sobre produtos petrolíferos — fixo por portaria",
      tom: "corte",
      texto: fmtLitro(d.isp),
      textoLista: fmtLitro(d.isp),
    },
    {
      id: "carbono",
      forma: "placa",
      rotulo: "Taxa de carbono",
      detalhe: "adicional ao ISP, por litro",
      tom: "corte",
      texto: fmtLitro(d.carbono),
      textoLista: fmtLitro(d.carbono),
    },
    {
      id: "produto",
      forma: "base",
      rotulo: "Produto + margens",
      detalhe: "o que resta — crude, refinação, distribuição",
      tom: "neutro",
      textoLista: fmtLitro(d.produto),
    },
  ];

  const partes: ParteCentimos[] = [
    {
      id: "iva",
      rotulo: "IVA",
      valor: d.iva * 100,
      tom: "sai",
      detalhe: "incide sobre o ISP",
    },
    {
      id: "isp",
      rotulo: "ISP",
      valor: d.isp * 100,
      tom: "sai",
    },
    {
      id: "carbono",
      rotulo: "Taxa de carbono",
      rotuloCurto: "Carbono",
      valor: d.carbono * 100,
      tom: "sai",
    },
    {
      id: "produto",
      rotulo: "Produto + margens",
      rotuloCurto: "Produto",
      valor: d.produto * 100,
      tom: "neutro",
    },
  ];

  const fonte = {
    rotulo: rotuloFonte,
    itens: [fonteDgeg, fonteIsp].filter((f) => f.nome),
  };
  const meta = [`leitura ${c.leituraAte}`];

  return (
    <div className="stack-fig">
      <Segmentado
        rotulo={rotuloCombustivel}
        valor={c.id}
        onChange={setId}
        opcoes={combustiveis.map((x) => ({ id: x.id, rotulo: x.rotulo }))}
      />
      <div className="mt-5 grid items-start gap-5 md:grid-cols-2">
        {/* ESTRUTURA — o que é um litro, por camadas */}
        <Cartao
          ref={ref}
          className={arm("iso-on")}
          breadcrumb="IMPOSTOS / O LITRO · ESTRUTURA"
          icone="impostos"
          meta={meta}
          estado={c.estado}
          estadoRotulo={c.estadoRotulo}
          fonte={fonte}
        >
          <Isometrico
            nome="litro"
            camadas={camadas}
            numero={{
              kicker: c.rotulo,
              valor: fmtLitro(c.precoLitro),
              pequeno: `PMD · ${c.leituraAte}`,
              compacto: true,
            }}
          />
        </Cartao>

        {/* QUANTIDADE — os cêntimos do litro, contados */}
        <Cartao
          breadcrumb="IMPOSTOS / O LITRO · QUANTIDADE"
          icone="impostos"
          meta={meta}
          estado={c.estado}
          estadoRotulo={c.estadoRotulo}
          fonte={fonte}
        >
          <p className="kicker">Do preço do litro vai para o Estado</p>
          <NumHero
            compacto
            valor={fmtPct(d.pesoImpostos)}
            animar={d.pesoImpostos * 100}
            casas={1}
            className="mt-1 text-up"
          />
          <p className="footnote mt-1">
            {comUnidade(fmtNum(d.impostos * 100), "c")} de{" "}
            {comUnidade(fmtNum(c.precoLitro * 100), "c")} — 1 ponto = 1 cêntimo
          </p>
          <div className="mt-4">
            <CampoCentimos
              layout="montes"
              total={centimosTotal}
              partes={partes}
            />
          </div>
        </Cartao>
      </div>
    </div>
  );
}
