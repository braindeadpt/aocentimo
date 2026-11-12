"use client";

import { useMemo, useState } from "react";
import { Cartao, type EstadoCartao } from "@/components/Cartao";
import { Interruptor } from "@/components/Interruptor";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import { ZeroInformativo } from "@/components/ZeroInformativo";
import {
  imi,
  type RegrasImi,
} from "@/lib/engines/imi-puro";
import { comUnidade, fmtEUR, fmtEUR0, fmtNum, fmtPct, MENOS } from "@/lib/format";
import { useCasa } from "./CasaSim";

const NOMES_MESES: Record<number, string> = {
  5: "Maio",
  8: "Agosto",
  11: "Novembro",
};

export function SimuladorImi({
  regras,
  estado,
  estadoRotulo,
  rotuloFonte,
  fonteCimi,
  fontePorto,
}: {
  regras: RegrasImi;
  estado: EstadoCartao;
  estadoRotulo: string;
  rotuloFonte: string;
  fonteCimi: { nome: string; url?: string };
  fontePorto: { nome: string; url?: string };
}) {
  const { tipo } = useCasa();
  const [vpt, setVpt] = useState(120000);
  const [taxaPct, setTaxaPct] = useState(regras.porto.taxa * 100);
  const [dependentes, setDependentes] = useState(0);
  // No Porto (taxa inicial 0,324 %), o IMI Familiar não está activo em 2026
  const [imiFamiliarAtivo, setImiFamiliarAtivo] = useState(false);

  const taxa = Math.round(taxaPct * 10000) / 1000000;
  const noPorto = Math.abs(taxa - regras.porto.taxa) < 1e-6;
  const hpp = tipo === "hpp";

  const mudaTaxa = (novaPct: number) => {
    setTaxaPct(novaPct);
    const novaTaxa = Math.round(novaPct * 10000) / 1000000;
    if (Math.abs(novaTaxa - regras.porto.taxa) < 1e-6) {
      // No Porto, respeita por omissão que não há deliberação activa para 2026
      setImiFamiliarAtivo(false);
    } else if (!imiFamiliarAtivo && dependentes > 0) {
      setImiFamiliarAtivo(true);
    }
  };

  const resultado = useMemo(
    () =>
      imi(
        {
          vpt,
          taxa,
          dependentes,
          imiFamiliar: imiFamiliarAtivo,
          habitacaoPropriaPermanente: hpp,
        },
        regras
      ),
    [vpt, taxa, dependentes, imiFamiliarAtivo, hpp, regras]
  );

  const minUrb = useMemo(
    () => imi({ vpt, taxa: regras.taxasLegais.urbanos.min }, regras).aPagar,
    [vpt, regras]
  );
  const maxUrb = useMemo(
    () => imi({ vpt, taxa: regras.taxasLegais.urbanos.max }, regras).aPagar,
    [vpt, regras]
  );

  const resumoMeses =
    resultado.prestacoes.length === 1
      ? "1 prestação em maio"
      : resultado.prestacoes.length === 2
        ? "2 prestações (maio e novembro)"
        : "3 prestações (maio, agosto e novembro)";

  return (
    /* PROPOSTA (revisão do dono) */
    <Cartao
      icone="casa"
      breadcrumb={`O BANCO / COMPRAR CASA · IMI ${regras.ano}`}
      meta={[
        noPorto
          ? `Porto ${fmtPct(regras.porto.taxa, 3)}`
          : `taxa ${fmtPct(taxa, 3)}`,
        resumoMeses,
      ]}
      estado={estado}
      estadoRotulo={estadoRotulo}
      fonte={{
        rotulo: rotuloFonte,
        itens: [fonteCimi, fontePorto],
      }}
    >
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-5">
          {/* PROPOSTA (revisão do dono) */}
          <Regua
            id="imi-vpt"
            rotulo="Valor patrimonial tributário (VPT)"
            valor={vpt}
            onChange={setVpt}
            min={20000}
            max={500000}
            passo={5000}
            unidade="€"
            formato={(v) => fmtNum(v, 0)}
            presets={[
              { rotulo: fmtEUR0(80000), valor: 80000 },
              { rotulo: fmtEUR0(120000), valor: 120000 },
              { rotulo: fmtEUR0(200000), valor: 200000 },
              { rotulo: fmtEUR0(300000), valor: 300000 },
            ]}
            descricao="O VPT não é o preço de mercado nem o da escritura: é o valor fiscal que as Finanças calculam pela área, idade e localização na caderneta predial."
          />

          {/* PROPOSTA (revisão do dono) */}
          <Regua
            id="imi-taxa"
            rotulo="Taxa municipal (prédios urbanos)"
            valor={taxaPct}
            onChange={mudaTaxa}
            min={regras.taxasLegais.urbanos.min * 100}
            max={regras.taxasLegais.urbanos.max * 100}
            passo={0.001}
            unidade="%"
            formato={(v) => fmtNum(v, 3)}
            marcadorAgora={{
              valor: regras.porto.taxa * 100,
              rotulo: "Porto",
            }}
            presets={[
              {
                rotulo: `Mínima (${fmtPct(regras.taxasLegais.urbanos.min, 2)})`,
                valor: regras.taxasLegais.urbanos.min * 100,
              },
              {
                rotulo: `Porto (${fmtPct(regras.porto.taxa, 3)})`,
                valor: regras.porto.taxa * 100,
              },
              {
                rotulo: `Máxima (${fmtPct(regras.taxasLegais.urbanos.max, 2)})`,
                valor: regras.taxasLegais.urbanos.max * 100,
              },
            ]}
            descricao={`Cada câmara municipal fixa a sua taxa entre ${fmtPct(regras.taxasLegais.urbanos.min, 2)} e ${fmtPct(regras.taxasLegais.urbanos.max, 2)} (art. 112.º do CIMI).`}
          />

          {/* PROPOSTA (revisão do dono) */}
          <Segmentado
            rotulo="Dependentes a cargo (IMI Familiar)"
            valor={String(dependentes)}
            onChange={(id) => {
              const n = Number(id);
              setDependentes(n);
              if (n > 0 && !noPorto) {
                setImiFamiliarAtivo(true);
              }
            }}
            opcoes={[
              { id: "0", rotulo: "0" },
              { id: "1", rotulo: `1 (${MENOS}${fmtEUR0(regras.imiFamiliar.deducoes[0].valor)})` },
              { id: "2", rotulo: `2 (${MENOS}${fmtEUR0(regras.imiFamiliar.deducoes[1].valor)})` },
              { id: "3", rotulo: `3+ (${MENOS}${fmtEUR0(regras.imiFamiliar.deducoes[2].valor)})` },
            ]}
          />

          {/* PROPOSTA (revisão do dono) */}
          <Interruptor
            ligado={imiFamiliarAtivo}
            onChange={setImiFamiliarAtivo}
            desativado={!hpp}
            razao="o IMI Familiar só se aplica a habitação própria e permanente"
            rotulo="Município aderente ao IMI Familiar (art. 112.º-A)"
            nota={
              noPorto && !imiFamiliarAtivo
                ? "no Porto não há dedução activa na liquidação de 2026 (a recomendação de abril de 2026 só pode vigorar a partir de 2027)"
                : "dedução fixa em euros deliberada pela assembleia municipal"
            }
            className="text-corpo-sm"
          />
        </div>

        {/* Resultado anual e calendário de prestações */}
        <div className="space-y-6 self-start md:sticky md:top-6" aria-live="polite">
          <div className="border border-line bg-raised shadow-raised">
            <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
              {/* PROPOSTA (revisão do dono) */}
              <span className="kicker">Depois da escritura, todos os anos</span>
              <span className="num text-rotulo text-muted">
                taxa efetiva {fmtPct(resultado.taxaEfetiva, 3)}
              </span>
            </div>
            <div className="px-5 py-5">
              <NumHero
                valor={fmtEUR(resultado.aPagar)}
                sufixo="/ano"
                animar={resultado.aPagar}
              />
              <dl className="mt-4 space-y-2 text-corpo-sm">
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  {/* PROPOSTA (revisão do dono) */}
                  <dt className="text-ink2">
                    Coleta bruta ({fmtEUR0(vpt)} × {fmtPct(taxa, 3)})
                  </dt>
                  <dd className="num">{fmtEUR(resultado.coleta)}</dd>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  {/* PROPOSTA (revisão do dono) */}
                  <dt className="text-ink2">Dedução IMI Familiar</dt>
                  <dd className="num">
                    {resultado.reducaoFamiliar > 0 ? (
                      <span className="text-keep">
                        {MENOS}
                        {fmtEUR0(resultado.reducaoFamiliar)}
                      </span>
                    ) : dependentes > 0 && !imiFamiliarAtivo ? (
                      <ZeroInformativo
                        valor="0"
                        unidade="€"
                        nota={noPorto ? "Porto sem dedução em 2026" : "sem deliberação"}
                      />
                    ) : !hpp && dependentes > 0 ? (
                      <ZeroInformativo
                        valor="0"
                        unidade="€"
                        nota="só em habitação própria"
                      />
                    ) : (
                      <ZeroInformativo valor="0" unidade="€" nota="sem dependentes" />
                    )}
                  </dd>
                </div>
                <div className="flex justify-between pb-1.5">
                  {/* PROPOSTA (revisão do dono) */}
                  <dt className="text-ink2">
                    Intervalo legal para este VPT ({fmtPct(regras.taxasLegais.urbanos.min, 2)} a {fmtPct(regras.taxasLegais.urbanos.max, 2)})
                  </dt>
                  <dd className="num text-ink2">
                    {fmtEUR0(minUrb)} a {fmtEUR0(maxUrb)}
                  </dd>
                </div>
              </dl>

              {/* Calendário das prestações (art. 120.º CIMI) */}
              <div className="mt-5 border-t border-line pt-4">
                {/* PROPOSTA (revisão do dono) */}
                <p className="kicker mb-2.5">
                  Quando se paga ({resumoMeses})
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 11].map((mes) => {
                    const p = resultado.prestacoes.find((x) => x.mes === mes);
                    return (
                      <div
                        key={mes}
                        className={`border px-3 py-2.5 ${
                          p
                            ? "border-ink bg-panel text-ink"
                            : "border-line/60 bg-floor/40 text-muted"
                        }`}
                      >
                        <span className="kicker block">{NOMES_MESES[mes]}</span>
                        <span className="num mt-1 block font-medium">
                          {p ? fmtEUR(p.valor) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* PROPOSTA (revisão do dono) */}
                <p className="footnote mt-2.5">
                  Até {fmtEUR0(100)} paga-se numa prestação única em maio; de{" "}
                  {fmtEUR(100.01)} a {fmtEUR0(500)} divide-se em maio e novembro;
                  acima de {fmtEUR0(500)} divide-se em{" "}
                  {comUnidade("3", "prestações")} (maio, agosto e novembro, art.
                  120.º do CIMI).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Cartao>
  );
}
