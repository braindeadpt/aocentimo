"use client";

import { useMemo, useState } from "react";
import { CampoCentimos, type ParteCentimos } from "@/components/CampoCentimos";
import { Cartao, type EstadoCartao } from "@/components/Cartao";
import { Interruptor } from "@/components/Interruptor";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import { ZeroInformativo } from "@/components/ZeroInformativo";
import {
  custoFiscalAnualCarro,
  type LitroDecomposto,
  type PropulsaoCarro,
  type RegrasIsv,
  type RegrasIuc,
} from "@/lib/engines/carro-puro";
import { comUnidade, fmtEUR, fmtEUR0, fmtLitro, fmtNum, fmtPct, MENOS } from "@/lib/format";

export function SimuladorCarro({
  regrasIsv,
  regrasIuc,
  litroGasolina,
  litroGasoleo,
  estado,
  estadoRotulo,
  rotuloFonte,
  fontes,
}: {
  regrasIsv: RegrasIsv;
  regrasIuc: RegrasIuc;
  litroGasolina: LitroDecomposto | null;
  litroGasoleo: LitroDecomposto | null;
  estado: EstadoCartao;
  estadoRotulo: string;
  rotuloFonte: string;
  fontes: { nome: string; url?: string }[];
}) {
  const [propulsao, setPropulsao] = useState<PropulsaoCarro>("gasolina");
  const [cilindrada, setCilindrada] = useState(1400);
  const [co2, setCo2] = useState(135);
  const [anoMatricula, setAnoMatricula] = useState(2022);
  const [kmAno, setKmAno] = useState(15000);
  const [importadoUE, setImportadoUE] = useState(false);

  const consumoLitros100 =
    propulsao === "phev" ? 3.5 : propulsao === "gasoleo" ? 5.5 : 6.5;

  const mudaPropulsao = (nova: PropulsaoCarro) => {
    setPropulsao(nova);
    if (nova === "phev" && co2 > 80) {
      setCo2(45);
    } else if ((nova === "gasolina" || nova === "gasoleo") && co2 < 80) {
      setCo2(135);
    }
  };

  const anosDeUso = Math.max(0.5, regrasIsv.ano - anoMatricula);

  const res = useMemo(
    () =>
      custoFiscalAnualCarro(
        {
          propulsao,
          cilindrada,
          co2,
          anoMatricula,
          kmAno,
          consumoLitros100,
          norma: "WLTP",
          matriculaUE: importadoUE,
          anosDeUso: importadoUE ? anosDeUso : undefined,
          litroGasolina,
          litroGasoleo,
        },
        regrasIsv,
        regrasIuc
      ),
    [
      propulsao,
      cilindrada,
      co2,
      anoMatricula,
      kmAno,
      consumoLitros100,
      importadoUE,
      anosDeUso,
      litroGasolina,
      litroGasoleo,
      regrasIsv,
      regrasIuc,
    ]
  );

  const litroAtivo =
    propulsao === "gasoleo" ? litroGasoleo : litroGasolina;

  const porEuro = res.custoTotalAnual > 0 ? 100 / res.custoTotalAnual : 0;
  const partesCentimos: ParteCentimos[] = [
    {
      id: "iuc",
      rotulo: "IUC anual",
      rotuloCurto: "IUC",
      valor: res.iuc.total * porEuro,
      tom: "sai",
      detalhe: `${fmtEUR(res.iuc.total)}/ano`,
    },
    {
      id: "isp-carb",
      rotulo: "ISP + carbono",
      rotuloCurto: "ISP+carb.",
      valor: (res.ispAno + res.carbonoAno) * porEuro,
      tom: "sai",
      detalhe: `${fmtEUR0(res.ispAno + res.carbonoAno)}/ano`,
    },
    {
      id: "iva-comb",
      rotulo: "IVA do combustível",
      rotuloCurto: "IVA",
      valor: res.ivaCombustivelAno * porEuro,
      tom: "sai",
      detalhe: `${fmtEUR0(res.ivaCombustivelAno)}/ano`,
    },
    {
      id: "produto-comb",
      rotulo: "Combustível sem imposto",
      rotuloCurto: "Produto",
      valor: res.combustivelSemImpostoAno * porEuro,
      tom: "neutro",
      detalhe: `${fmtEUR0(res.combustivelSemImpostoAno)}/ano`,
    },
  ];

  return (
    /* PROPOSTA (revisão do dono) */
    <Cartao
      breadcrumb={`IMPOSTOS / O AUTOMÓVEL · ISV + IUC + COMBUSTÍVEL (${regrasIsv.ano})`}
      icone="impostos"
      meta={[
        res.isento
          ? "100 % elétrico · isento de ISV e IUC"
          : `ISV ${fmtEUR0(res.isv.total)} · IUC ${fmtEUR(res.iuc.total)}/ano`,
      ]}
      estado={estado}
      estadoRotulo={estadoRotulo}
      fonte={{
        rotulo: rotuloFonte,
        itens: fontes,
      }}
    >
      <div className="space-y-8">
        <div>
          {/* PROPOSTA (revisão do dono) */}
          <p className="font-display text-grande text-ink mb-2">
            Quanto de um carro e de andar nele é imposto (ISV, IUC e combustível)
          </p>
          {/* PROPOSTA (revisão do dono) */}
          <p className="body-copy text-ink2">
            Na compra pagas uma vez o <strong>ISV</strong> (calculado pela
            cilindrada e pelo CO₂, não pelo preço do carro). Todos os anos pagas
            o <strong>IUC</strong> no mês da matrícula e, a cada quilómetro,
            ISP, taxa de carbono e IVA em cascata na bomba.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-5">
            {/* PROPOSTA (revisão do dono) */}
            <div>
              <span className="kicker mb-1.5 block">Motorização</span>
              <Segmentado
                rotulo="Motorização do automóvel"
                valor={propulsao}
                onChange={(id) => mudaPropulsao(id as PropulsaoCarro)}
                opcoes={[
                  { id: "gasolina", rotulo: "Gasolina" },
                  { id: "gasoleo", rotulo: "Gasóleo" },
                  { id: "phev", rotulo: "Híbrido plug-in" },
                  { id: "eletrico", rotulo: "Elétrico" },
                ]}
              />
            </div>

            {propulsao === "eletrico" ? (
              /* PROPOSTA (revisão do dono) */
              <div className="border border-line bg-panel px-5 py-4 space-y-2 text-corpo-sm text-ink2">
                <p>
                  Os veículos exclusivamente elétricos estão fora da incidência
                  do ISV na matrícula (art. 2.º n.º 2 al. b) do CISV) e isentos
                  de IUC todos os anos (art. 5.º do CIUC).
                </p>
                <p className="footnote">
                  Apenas pagam o IVA da eletricidade ao carregar (e das
                  componentes de acesso à rede na fatura doméstica ou no posto
                  público).
                </p>
              </div>
            ) : (
              <>
                {/* PROPOSTA (revisão do dono) */}
                <Regua
                  id="carro-cil"
                  rotulo="Cilindrada do motor"
                  valor={cilindrada}
                  onChange={setCilindrada}
                  min={800}
                  max={3000}
                  passo={50}
                  unidade="cm³"
                  formato={(v) => fmtNum(v, 0)}
                  presets={[
                    { rotulo: comUnidade(fmtNum(1000, 0), "cm³"), valor: 1000 },
                    { rotulo: comUnidade(fmtNum(1400, 0), "cm³"), valor: 1400 },
                    { rotulo: comUnidade(fmtNum(2000, 0), "cm³"), valor: 2000 },
                  ]}
                />

                {/* PROPOSTA (revisão do dono) */}
                <Regua
                  id="carro-co2"
                  rotulo="Emissões de CO₂ (norma WLTP)"
                  valor={co2}
                  onChange={setCo2}
                  min={20}
                  max={250}
                  passo={5}
                  unidade="g/km"
                  formato={(v) => fmtNum(v, 0)}
                  presets={[
                    { rotulo: comUnidade("45", "g/km"), valor: 45 },
                    { rotulo: comUnidade("120", "g/km"), valor: 120 },
                    { rotulo: comUnidade("140", "g/km"), valor: 140 },
                    { rotulo: comUnidade("190", "g/km"), valor: 190 },
                  ]}
                  descricao={
                    propulsao === "phev"
                      ? "Híbrido plug-in elegível (autonomia elétrica ≥ 50 km e até 50 g/km, ou 80 g/km em Euro 6e-bis) paga 25 % do ISV da tabela A (art. 8.º CISV)."
                      : undefined
                  }
                />

                {/* PROPOSTA (revisão do dono) */}
                <Regua
                  id="carro-ano"
                  rotulo="Ano da 1.ª matrícula"
                  valor={anoMatricula}
                  onChange={(v) => setAnoMatricula(Math.round(v))}
                  min={2007}
                  max={2026}
                  passo={1}
                  formato={(v) => String(Math.round(v))}
                  presets={[
                    { rotulo: "2015", valor: 2015 },
                    { rotulo: "2018", valor: 2018 },
                    { rotulo: "2022", valor: 2022 },
                    { rotulo: "2026", valor: 2026 },
                  ]}
                />

                {/* PROPOSTA (revisão do dono) */}
                <Regua
                  id="carro-km"
                  rotulo="Quilómetros percorridos por ano"
                  valor={kmAno}
                  onChange={setKmAno}
                  min={2000}
                  max={40000}
                  passo={1000}
                  unidade="km"
                  formato={(v) => fmtNum(v, 0)}
                  presets={[
                    { rotulo: comUnidade(fmtNum(10000, 0), "km"), valor: 10000 },
                    { rotulo: comUnidade(fmtNum(15000, 0), "km"), valor: 15000 },
                    { rotulo: comUnidade(fmtNum(25000, 0), "km"), valor: 25000 },
                  ]}
                  descricao={`Consumo médio indicativo de ${comUnidade(fmtNum(consumoLitros100, 1), "L/100 km")} (${comUnidade(fmtNum(res.litrosAno, 0), "L")}/ano)${litroAtivo ? ` ao PMD DGEG actual de ${fmtLitro(litroAtivo.precoLitro)}` : ""}.`}
                />

                {/* PROPOSTA (revisão do dono) */}
                <Interruptor
                  ligado={importadoUE}
                  onChange={setImportadoUE}
                  rotulo="Usado importado da União Europeia (tabela D do ISV)"
                  nota={
                    importadoUE
                      ? `redução por tempo de uso sobre o ISV (${fmtNum(anosDeUso, 1)} anos desde a 1.ª matrícula)`
                      : "veículo matriculado novo em Portugal"
                  }
                  className="text-corpo-sm"
                />
              </>
            )}
          </div>

          {/* Coluna de resultados */}
          <div className="space-y-6 self-start md:sticky md:top-6" aria-live="polite">
            {res.isento ? (
              /* PROPOSTA (revisão do dono) */
              <div className="border border-line bg-raised shadow-raised">
                <div className="border-b border-line px-5 py-3">
                  <span className="kicker">
                    Veículo 100 % elétrico — exclusão e isenção legal
                  </span>
                </div>
                <div className="px-5 py-5 space-y-4">
                  <div>
                    <span className="kicker block mb-1">
                      Na matrícula (ISV — art. 2.º n.º 2 CISV)
                    </span>
                    <ZeroInformativo
                      valor="0"
                      unidade="€"
                      nota="isento (exclusão de incidência)"
                    />
                  </div>
                  <div className="border-t border-line pt-4">
                    <span className="kicker block mb-1">
                      Todos os anos (IUC — art. 5.º CIUC)
                    </span>
                    <ZeroInformativo
                      valor="0"
                      unidade="€"
                      nota="isento todos os anos"
                    />
                  </div>
                  <p className="footnote pt-2">
                    Ao contrário dos carros a combustão ou híbridos, um
                    automóvel exclusivamente elétrico paga {fmtEUR0(0)} de ISV e{" "}
                    {fmtEUR0(0)} de IUC.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* 1 · ISV na compra */}
                <div className="border border-line bg-raised shadow-raised">
                  <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
                    {/* PROPOSTA (revisão do dono) */}
                    <span className="kicker">1 · Uma vez, na matrícula (ISV)</span>
                    <span className="num text-rotulo text-muted">
                      tabela A · WLTP
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <NumHero
                      compacto
                      valor={fmtEUR(res.isv.total)}
                      animar={res.isv.total}
                      className="text-up"
                    />
                    <dl className="mt-3 space-y-1.5 text-corpo-sm">
                      <div className="flex justify-between border-b border-line/60 pb-1">
                        <dt className="text-ink2">Componente cilindrada</dt>
                        <dd className="num">{fmtEUR(res.isv.componenteCilindrada)}</dd>
                      </div>
                      <div className="flex justify-between border-b border-line/60 pb-1">
                        <dt className="text-ink2">Componente ambiental (CO₂)</dt>
                        <dd className="num">{fmtEUR(res.isv.componenteAmbiental)}</dd>
                      </div>
                      {res.isv.agravamentoGasoleo > 0 && (
                        <div className="flex justify-between border-b border-line/60 pb-1">
                          <dt className="text-ink2">Agravamento gasóleo (partículas)</dt>
                          <dd className="num text-up">
                            +{fmtEUR0(res.isv.agravamentoGasoleo)}
                          </dd>
                        </div>
                      )}
                      {res.isv.reducaoUsadoUE > 0 && (
                        <div className="flex justify-between border-b border-line/60 pb-1">
                          <dt className="text-ink2">Redução usado importado UE</dt>
                          <dd className="num text-keep">
                            {MENOS}
                            {fmtEUR(res.isv.reducaoUsadoUE)}
                          </dd>
                        </div>
                      )}
                      {propulsao === "phev" && (
                        <div className="flex justify-between pb-1">
                          <dt className="text-ink2">Taxa intermédia PHEV (art. 8.º)</dt>
                          <dd className="num text-keep">paga {fmtPct(0.25, 0)} da tabela</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                {/* 2 · Custo fiscal anual (IUC + combustível) */}
                <div className="border border-line bg-raised shadow-raised">
                  <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
                    {/* PROPOSTA (revisão do dono) */}
                    <span className="kicker">
                      2 · Todos os anos a circular (IUC + bomba)
                    </span>
                    <span className="num text-rotulo text-muted">
                      {fmtPct(res.pesoImpostosAnual, 1)} é imposto
                    </span>
                  </div>
                  <div className="px-5 py-4">
                    <NumHero
                      valor={fmtEUR0(res.impostosAnuais)}
                      sufixo="/ano"
                      animar={res.impostosAnuais}
                      casas={0}
                      className="text-up"
                    />
                    <dl className="mt-3 space-y-1.5 text-corpo-sm">
                      <div className="flex justify-between border-b border-line/60 pb-1">
                        <dt className="text-ink2">
                          IUC anual (cat. {res.iuc.categoria}, no mês da matrícula)
                        </dt>
                        <dd className="num text-up">{fmtEUR(res.iuc.total)}</dd>
                      </div>
                      <div className="flex justify-between border-b border-line/60 pb-1">
                        <dt className="text-ink2">
                          ISP + carbono em {comUnidade(fmtNum(res.litrosAno, 0), "L")}
                        </dt>
                        <dd className="num text-up">
                          {fmtEUR0(res.ispAno + res.carbonoAno)}
                        </dd>
                      </div>
                      <div className="flex justify-between border-b border-line/60 pb-1">
                        <dt className="text-ink2">
                          IVA sobre combustível ({fmtPct(0.23, 0)})
                        </dt>
                        <dd className="num text-up">{fmtEUR0(res.ivaCombustivelAno)}</dd>
                      </div>
                      <div className="flex justify-between border-b border-line/60 pb-1">
                        <dt className="text-ink2">Combustível sem imposto</dt>
                        <dd className="num">{fmtEUR0(res.combustivelSemImpostoAno)}</dd>
                      </div>
                      <div className="flex justify-between pt-1 font-medium">
                        <dt className="text-ink">Despesa anual (IUC + combustível)</dt>
                        <dd className="num">{fmtEUR0(res.custoTotalAnual)}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {!res.isento && res.custoTotalAnual > 0 && (
          <CampoCentimos
            partes={partesCentimos}
            layout="montes"
            textos={{
              pronto: (
                <>
                  De cada euro anual entre IUC e combustível,{" "}
                  <b>
                    {comUnidade(
                      fmtNum(res.pesoImpostosAnual * 100, 1),
                      "c"
                    )}
                  </b>{" "}
                  são impostos.
                </>
              ),
            }}
            equivalente={`De cada euro gasto por ano em IUC e combustível (${fmtEUR0(res.custoTotalAnual)}/ano): ${fmtNum(partesCentimos[0].valor, 1)} cêntimos são IUC, ${fmtNum(partesCentimos[1].valor, 1)} cêntimos são ISP e carbono, ${fmtNum(partesCentimos[2].valor, 1)} cêntimos são IVA e ${fmtNum(partesCentimos[3].valor, 1)} cêntimos são o combustível sem imposto.`}
          />
        )}
      </div>
    </Cartao>
  );
}
