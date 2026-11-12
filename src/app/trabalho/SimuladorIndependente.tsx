"use client";

import { useMemo, useState } from "react";
import { REGRAS_CATB, simularIndependente } from "@/lib/engines/independente";
import { CampoCentimos, type ParteCentimos } from "@/components/CampoCentimos";
import { Interruptor } from "@/components/Interruptor";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import { comUnidade, fmtEUR, fmtEUR0, fmtNum, fmtPct, MENOS } from "@/lib/format";

/**
 * Recibos verdes — da faturação ao bolso (3A-03). A codificação vem
 * do catálogo V4: «de cada euro faturado» é uma partilha de um todo
 * em dinheiro, logo CampoCentimos em montes — a mesma leitura do
 * custo total em /salario, e não a cascata de barras (que a sessão
 * 3A retirou por contar a mesma história pior).
 *
 * A faturação é régua (controlo físico, não input de número); o
 * primeiro ano de atividade e a retenção na fonte são interruptores;
 * a variação da base de incidência da SS (±25 %, art. 164.º CRC) é
 * segmentada. O quadro de linhas fica — é a conta por extenso que o
 * campo resume.
 */
export function SimuladorIndependente() {
  const [faturacao, setFaturacao] = useState(2000);
  const [primeiroAno, setPrimeiroAno] = useState(false);
  const [dispensaManual, setDispensaManual] = useState<boolean | null>(null);
  const [ajusteSS, setAjusteSS] = useState(0);

  const limiarDispensa = REGRAS_CATB.retencaoFonte.dispensaRetencaoAte;
  const taxaRetencao = REGRAS_CATB.retencaoFonte.tabela151;
  const opcoesSS = REGRAS_CATB.segurancaSocial.variacaoEscalaoSS;

  const anual = faturacao * 12;
  const dispensaPorLei = anual <= limiarDispensa;
  const dispensaRetencao = dispensaManual ?? dispensaPorLei;

  const mudaFaturacao = (novo: number) => {
    if ((novo * 12 <= limiarDispensa) !== (faturacao * 12 <= limiarDispensa)) {
      setDispensaManual(null);
    }
    setFaturacao(novo);
  };

  const r = useMemo(
    () =>
      simularIndependente(anual, {
        primeiroAno,
        dispensaRetencao,
        ajusteSS,
      }),
    [anual, primeiroAno, dispensaRetencao, ajusteSS]
  );

  // de cada euro faturado — os cêntimos que saem e os que ficam
  const porEuro = anual > 0 ? 100 / anual : 0;
  const anoFmt = (v: number) => `${fmtEUR0(v)}/ano`;
  const partes: ParteCentimos[] = [
    {
      id: "ss",
      rotulo: "Segurança Social",
      rotuloCurto: "Seg. Social",
      valor: r.ss * porEuro,
      tom: "sai",
      detalhe: primeiroAno ? "isento no 1.º ano" : anoFmt(r.ss),
    },
    {
      id: "irs",
      rotulo: "IRS (75 % × escalões)",
      rotuloCurto: "IRS",
      valor: r.irs * porEuro,
      tom: "sai",
      detalhe: r.irs > 0 ? anoFmt(r.irs) : undefined,
    },
    {
      id: "fica",
      rotulo: "Fica-te",
      rotuloCurto: "Fica-te",
      valor: r.liquidoAnual * porEuro,
      tom: "fica",
      detalhe: anoFmt(r.liquidoAnual),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="space-y-5">
          <Regua
            id="fat"
            rotulo="Faturação média mensal"
            valor={faturacao}
            onChange={mudaFaturacao}
            min={0}
            max={6000}
            passo={100}
            unidade="€"
            formato={(v) => fmtNum(v, 0)}
            limites={{
              max: "acima disto convém contabilidade organizada — o regime simplificado deixa de bastar",
            }}
          />
          <Interruptor
            ligado={primeiroAno}
            onChange={setPrimeiroAno}
            rotulo="Primeiro ano de atividade (isento de SS)"
            className="text-corpo-sm"
          />
          {/* PROPOSTA (revisão do dono) */}
          <Interruptor
            ligado={!dispensaRetencao}
            onChange={(reter) => setDispensaManual(!reter)}
            rotulo={`Retenção na fonte (${fmtPct(taxaRetencao, 0)})`}
            nota={
              dispensaPorLei
                ? `dispensada até ${fmtEUR0(limiarDispensa)}/ano (art. 101.º-B)`
                : "adiantamento ao Estado pelos clientes com contabilidade"
            }
            className="text-corpo-sm"
          />
          {/* PROPOSTA (revisão do dono) */}
          <div>
            <span className="kicker mb-1.5 block">
              Base de incidência da SS (art. 164.º)
            </span>
            <Segmentado
              rotulo="Base de incidência da Segurança Social"
              valor={String(ajusteSS)}
              onChange={(v) => setAjusteSS(Number(v))}
              opcoes={opcoesSS.map((v) => ({
                id: String(v),
                rotulo:
                  v === 0
                    ? "Normal"
                    : v > 0
                      ? `+${fmtPct(v, 0)}`
                      : fmtPct(v, 0),
                desativado: primeiroAno || undefined,
                razao: primeiroAno
                  ? "isento de Segurança Social no 1.º ano"
                  : undefined,
              }))}
            />
          </div>
          {/* PROPOSTA (revisão do dono) */}
          <p className="footnote">
            Regime simplificado: o IRS incide sobre 75 % do que faturas (com
            mínimo de existência até ao limiar legal). A SS é 21,4 % sobre
            70 % do bruto (ajustável em ±25 %, respeitando a base mínima de
            1,5×IAS). Até {fmtEUR0(limiarDispensa)}/ano há dispensa de
            retenção na fonte (art. 101.º-B CIRS); acima disso os clientes
            retêm {fmtPct(taxaRetencao, 0)}, que acertam na liquidação.
          </p>
        </div>

        {/* a conta por extenso — o campo de cêntimos resume-a por baixo */}
        <div className="self-start md:sticky md:top-6" aria-live="polite">
          <div className="border border-line bg-raised shadow-raised">
            <div className="border-b border-line px-5 py-3">
              <span className="kicker">
                Por ano, em {fmtEUR0(anual)} faturados
              </span>
            </div>
            <dl className="px-5 py-4 text-corpo-sm">
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">
                  Segurança Social{primeiroAno && " (isento)"}
                </dt>
                <dd className="num text-up">{fmtEUR(r.ss)} {MENOS}</dd>
              </div>
              <div className="flex justify-between border-b border-line/60 py-1.5">
                <dt className="text-ink2">IRS (75 % × escalões)</dt>
                <dd className="num text-up">{fmtEUR(r.irs)} {MENOS}</dd>
              </div>
              <div className="mt-1 flex justify-between border-t-2 border-ink py-2.5">
                <dt className="font-medium">Líquido anual</dt>
                <dd className="num-read font-medium">
                  {fmtEUR(r.liquidoAnual)}
                </dd>
              </div>
              <div className="flex justify-between py-1 text-ink2">
                <dt>Por mês (12)</dt>
                <dd className="num">{fmtEUR(r.liquidoMensal12)}</dd>
              </div>
              <div className="flex justify-between py-1 text-ink2">
                <dt>Peso total (SS + IRS)</dt>
                <dd className="num text-up">{fmtPct(r.pesoTotal)}</dd>
              </div>
              {/* PROPOSTA (revisão do dono) */}
              <div className="mt-1 flex justify-between border-t border-line/60 pt-2 pb-1 text-ink2">
                <dt>Retido na fonte ({dispensaRetencao ? "dispensado" : fmtPct(taxaRetencao, 0)})</dt>
                <dd className="num">{fmtEUR(r.retido)}</dd>
              </div>
              {/* PROPOSTA (revisão do dono) */}
              <div className="flex justify-between py-1 text-ink2">
                <dt>{r.reembolsoEstimado >= 0 ? "Reembolso estimado" : "Acerto a pagar"}</dt>
                <dd className={`num ${r.reembolsoEstimado > 0 ? "text-keep" : r.reembolsoEstimado < 0 ? "text-up" : ""}`}>
                  {r.reembolsoEstimado > 0 ? "+" : r.reembolsoEstimado < 0 ? MENOS : ""}
                  {fmtEUR(Math.abs(r.reembolsoEstimado))}
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
              De cada euro que faturas,{" "}
              <b>{comUnidade(fmtNum(partes[2].valor), "c")}</b> ficam-te.
            </>
          ),
        }}
        equivalente={`De cada euro que faturas (${fmtEUR0(anual)} por ano): ${fmtNum(partes[0].valor)} cêntimos vão para a Segurança Social, ${fmtNum(partes[1].valor)} para o IRS e ${fmtNum(partes[2].valor)} ficam contigo.`}
      />
    </div>
  );
}
