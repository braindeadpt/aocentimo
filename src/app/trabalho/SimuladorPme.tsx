"use client";

import { useMemo, useState } from "react";
import { CampoCentimos, type ParteCentimos } from "@/components/CampoCentimos";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import {
  simularPmePuro,
  type RegiaoPme,
  type RegrasPmePuro,
} from "@/lib/engines/pme-puro";
import {
  comUnidade,
  fmtEUR,
  fmtEUR0,
  fmtNum,
  fmtPct,
  MENOS,
} from "@/lib/format";

/**
 * Simulador de Pequena Empresa (PME / Sociedade por Quotas — Perfil do Sr. Manuel):
 * explica com cêntimos contáveis:
 *  (a) porque o IVA cobrado na caixa não é da empresa (IVA liquidado − IVA dedutível);
 *  (b) quanto custa remunerar o sócio-gerente (TSU 23,75 % + SS 11 % + IRS);
 *  (c) como funciona o IRC PME em 2026 (15 % nos primeiros 50 000 € e 19 % no
 *      excedente no Continente; 10,5 % / 13,3 % nos Açores e Madeira — Lei 64/2025)
 *      + derrama municipal até 1,5 % + saída de dividendos (28 % vs. englobamento a 50 %).
 */
export function SimuladorPme({ regras }: { regras: RegrasPmePuro }) {
  const [faturacaoMensal, setFaturacaoMensal] = useState(6000);
  const [custosMensais, setCustosMensais] = useState(2000);
  const [salarioGerente, setSalarioGerente] = useState(1500);
  const [regiao, setRegiao] = useState<RegiaoPme>("continente");
  const [modoDividendos, setModoDividendos] = useState<
    "liberatoria" | "englobamento"
  >("liberatoria");

  const r = useMemo(
    () =>
      simularPmePuro(
        {
          faturacaoMensalSemIva: faturacaoMensal,
          custosMensaisSemIva: Math.min(custosMensais, faturacaoMensal),
          remuneracaoGerenteMensal: salarioGerente,
          regiao,
          modoDividendos,
        },
        regras
      ),
    [faturacaoMensal, custosMensais, salarioGerente, regiao, modoDividendos, regras]
  );

  // Margem da empresa após compras de mercadorias/fornecedores (sem IVA)
  const margemAnual = Math.max(
    1,
    r.faturacaoAnualSemIva - r.custosAnuaisSemIva
  );
  const porEuro = 100 / margemAnual;
  const anoFmt = (v: number) => `${fmtEUR0(v)}/ano`;

  const impGerente =
    r.tsuEmpresaGerenteAnual + r.ssGerenteAnual + r.irsGerenteAnual;
  const impEmpresaESocio = r.ircTotal + r.impostoDividendosEscolhido;
  const ficaTotal = r.totalLiquidoSocioComDividendos;

  const partes: ParteCentimos[] = [
    {
      id: "gerente-estado",
      rotulo: "TSU + SS + IRS do gerente",
      rotuloCurto: "TSU+SS+IRS",
      valor: Math.max(0, Math.min(100, impGerente * porEuro)),
      tom: "sai",
      detalhe: anoFmt(impGerente),
    },
    {
      id: "irc-div",
      rotulo: "IRC + derrama + imposto s/ dividendos",
      rotuloCurto: "IRC + Div.",
      valor: Math.max(0, Math.min(100, impEmpresaESocio * porEuro)),
      tom: "sai",
      detalhe: anoFmt(impEmpresaESocio),
    },
    {
      id: "fica",
      rotulo: "Líquido do sócio-gerente (salário + lucro)",
      rotuloCurto: "Fica-te",
      valor: Math.max(0, Math.min(100, ficaTotal * porEuro)),
      tom: "fica",
      detalhe: anoFmt(ficaTotal),
    },
  ];

  const limitePme =
    regras.irc.pmeSmallMidCap.limiteMateriaColetavelReduzida;

  return (
    <div className="space-y-8">
      <div className="grid gap-10 md:grid-cols-2">
        {/* Controlos físicos */}
        <div className="space-y-5">
          {/* PROPOSTA (revisão do dono) */}
          <Regua
            id="pme-fat"
            rotulo="Vendas mensais (sem IVA)"
            valor={faturacaoMensal}
            onChange={(v) => {
              setFaturacaoMensal(v);
              if (custosMensais > v) setCustosMensais(v);
            }}
            min={1500}
            max={20000}
            passo={500}
            unidade="€"
            formato={(v) => fmtNum(v, 0)}
          />
          {/* PROPOSTA (revisão do dono) */}
          <Regua
            id="pme-custos"
            rotulo="Mercadorias e custos dedutíveis (sem IVA)"
            valor={Math.min(custosMensais, faturacaoMensal)}
            onChange={setCustosMensais}
            min={0}
            max={15000}
            passo={250}
            unidade="€"
            formato={(v) => fmtNum(v, 0)}
          />
          {/* PROPOSTA (revisão do dono) */}
          <Regua
            id="pme-gerente"
            rotulo="Salário bruto mensal do sócio-gerente (14 meses)"
            valor={salarioGerente}
            onChange={setSalarioGerente}
            min={920}
            max={4000}
            passo={100}
            unidade="€"
            formato={(v) => fmtNum(v, 0)}
          />
          {/* PROPOSTA (revisão do dono) */}
          <div>
            <span className="kicker mb-1.5 block">Região da PME (IRC)</span>
            <Segmentado
              rotulo="Região da PME"
              valor={regiao}
              onChange={(v) => setRegiao(v as RegiaoPme)}
              opcoes={[
                { id: "continente", rotulo: "Continente" },
                { id: "acores", rotulo: "Açores" },
                { id: "madeira", rotulo: "Madeira" },
              ]}
            />
          </div>
          {/* PROPOSTA (revisão do dono) */}
          <div>
            <span className="kicker mb-1.5 block">
              Tributação dos dividendos distribuídos
            </span>
            <Segmentado
              rotulo="Tributação dos dividendos distribuídos"
              valor={modoDividendos}
              onChange={(v) =>
                setModoDividendos(v as "liberatoria" | "englobamento")
              }
              opcoes={[
                {
                  id: "liberatoria",
                  rotulo: `Taxa ${fmtPct(regras.irc.dividendosPessoasSingulares.taxaLiberatoria * (regiao === "acores" ? 0.7 : 1), 1)}`,
                },
                {
                  id: "englobamento",
                  rotulo: `Englobar ${fmtPct(regras.irc.dividendosPessoasSingulares.opcaoEnglobamento.coeficienteEnglobamento, 0)}`,
                },
              ]}
            />
          </div>
          {/* PROPOSTA (revisão do dono) */}
          <p className="footnote">
            Em {regras.irc.ano} (Lei n.º 64/2025), as PME pagam{" "}
            <strong>{fmtPct(r.taxaIrcReduzidaAplicada, 1)}</strong> de IRC sobre
            os primeiros <strong>{fmtEUR0(limitePme)}</strong> de matéria
            coletável e <strong>{fmtPct(r.taxaIrcGeralAplicada, 1)}</strong> no
            excedente, mais derrama municipal até{" "}
            {fmtPct(regras.irc.derramaMunicipal.taxaMaximaLegal, 1)}. Se o lucro
            ficar retido para reinvestir na empresa, não paga imposto sobre
            dividendos.
          </p>
        </div>

        {/* Quadro das 3 contas da PME: (a) IVA na caixa, (b) Gerente, (c) IRC e Dividendos */}
        <div className="self-start md:sticky md:top-6" aria-live="polite">
          <div className="border border-line bg-raised shadow-raised">
            <div className="border-b border-line px-5 py-3">
              <span className="kicker">
                As 3 contas da PME · por ano ({regras.irc.ano})
              </span>
            </div>
            <dl className="px-5 py-4 text-corpo-sm">
              {/* (a) IVA */}
              <div className=" pb-1">
                <dt className="kicker text-ink">
                  1 · O IVA na caixa não é da empresa
                </dt>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5 text-ink2">
                <dt>IVA cobrado nas vendas − IVA das compras</dt>
                <dd className="num">
                  {fmtEUR0(r.ivaEntregueEstadoMensal)}/mês ·{" "}
                  <strong>{fmtEUR0(r.ivaEntregueEstadoAnual)}/ano</strong>
                </dd>
              </div>

              {/* (b) Sócio-gerente */}
              <div className="pt-3 pb-1">
                <dt className="kicker text-ink">
                  2 · Remuneração do sócio-gerente (14 meses)
                </dt>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">
                  Custo p/ a empresa (bruto + TSU{" "}
                  {fmtPct(regras.tsuEntidade, 2)})
                </dt>
                <dd className="num">
                  {fmtEUR(r.custoTotalGerenteEmpresaAnual)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">
                  TSU empresa + SS gerente ({fmtPct(regras.tsuTrabalhador, 0)}) + IRS
                </dt>
                <dd className="num text-up">
                  {fmtEUR(impGerente)} {MENOS}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">Salário líquido anual do gerente</dt>
                <dd className="num text-keep">
                  {fmtEUR(r.liquidoSalarioGerenteAnual)}
                </dd>
              </div>

              {/* (c) Lucro, IRC e Dividendos */}
              <div className="pt-3 pb-1">
                <dt className="kicker text-ink">
                  3 · Lucro da PME, IRC e saída de dividendos
                </dt>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">Matéria coletável (lucro antes de IRC)</dt>
                <dd className="num">{fmtEUR(r.materiaColetavel)}</dd>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">
                  IRC ({fmtPct(r.taxaIrcReduzidaAplicada, 1)} até{" "}
                  {fmtEUR0(limitePme)}) + derrama (1,5 %)
                </dt>
                <dd className="num text-up">
                  {fmtEUR(r.ircTotal)} {MENOS}
                </dd>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">
                  Lucro líquido na empresa (se não distribuir)
                </dt>
                <dd className="num font-medium">{fmtEUR(r.lucroLiquidoEmpresa)}</dd>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">
                  Imposto se distribuir dividendos (
                  {modoDividendos === "englobamento"
                    ? "englobado 50\u202F%"
                    : fmtPct(
                        regras.irc.dividendosPessoasSingulares.taxaLiberatoria *
                          (regiao === "acores" ? 0.7 : 1),
                        1
                      )}
                  )
                </dt>
                <dd className="num text-up">
                  {fmtEUR(r.impostoDividendosEscolhido)} {MENOS}
                </dd>
              </div>
              <div className="mt-1 flex justify-between border-t-2 border-ink py-2.5">
                <dt className="font-medium">
                  Total líquido no bolso (salário + dividendos)
                </dt>
                <dd className="num-read font-medium">
                  {fmtEUR(r.totalLiquidoSocioComDividendos)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <CampoCentimos
        partes={partes}
        layout="montes"
        textos={{
          pronto: (
            <>
              De cada euro que sobra das vendas após pagar fornecedores,{" "}
              <b>{comUnidade(fmtNum(partes[2].valor), "c")}</b> chegam ao sócio
              (salário + dividendos líquidos).
            </>
          ),
        }}
        equivalente={`De cada euro de margem anual da PME (${fmtEUR0(margemAnual)} após custos sem IVA): ${fmtNum(partes[0].valor)} cêntimos vão para TSU, Segurança Social e IRS do gerente, ${fmtNum(partes[1].valor)} para IRC, derrama e imposto sobre dividendos, e ${fmtNum(partes[2].valor)} ficam líquidos.`}
      />
    </div>
  );
}
