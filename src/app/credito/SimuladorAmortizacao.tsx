"use client";

import { useMemo, useState } from "react";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import { Valor } from "@/components/Valor";
import { simularAmortizacaoAntecipada } from "@/lib/engines/prestacao";
import {
  MENOS,
  comUnidade,
  fmtEUR,
  fmtEUR0,
  fmtNum,
  fmtPct,
} from "@/lib/format";
import { useCredito } from "./CreditoSim";

/* PROPOSTA (revisão do dono) */
export function SimuladorAmortizacao() {
  const { capital, anos, sim, regimeTaxa, regrasCredito } = useCredito();

  const [montanteExtra, setMontanteExtra] = useState(10000);
  const [anoAmortizacao, setAnoAmortizacao] = useState(3);
  const [regimeComissaoManual, setRegimeComissaoManual] = useState<
    "auto" | "variavel" | "fixa"
  >("auto");

  const maxAno = Math.max(1, anos - 1);
  const anoEfetivo = Math.min(Math.max(1, anoAmortizacao), maxAno);
  const maxExtra = Math.max(5000, Math.min(capital, 100000));
  const extraEfetivo = Math.min(Math.max(1000, montanteExtra), maxExtra);

  // Se estiver em "auto", deduz se no ano da amortização o contrato está em período fixo ou variável
  const regimeEfetivo: "variavel" | "fixa" =
    regimeComissaoManual !== "auto"
      ? regimeComissaoManual
      : regimeTaxa === "fixa" ||
          (regimeTaxa === "mista" &&
            sim &&
            anoEfetivo * 12 <= sim.mesesFixos)
        ? "fixa"
        : "variavel";

  const tanRef = sim ? sim.tan : 0.035;

  const resultado = useMemo(() => {
    return simularAmortizacaoAntecipada({
      capital,
      prazoMeses: Math.max(24, anos * 12),
      tan: tanRef,
      anoAmortizacao: anoEfetivo,
      montanteExtra: extraEfetivo,
      regimeTaxa: regimeEfetivo,
      taxasComissao: {
        variavel: regrasCredito.reembolsoAntecipado.comissaoMaximaVariavel,
        fixa: regrasCredito.reembolsoAntecipado.comissaoMaximaFixa,
      },
    });
  }, [
    capital,
    anos,
    tanRef,
    anoEfetivo,
    extraEfetivo,
    regimeEfetivo,
    regrasCredito,
  ]);

  const anosInteirosAbatidos = Math.floor(
    resultado.reduzirPrazo.mesesPoupados / 12
  );
  const mesesRestoAbatidos = resultado.reduzirPrazo.mesesPoupados % 12;
  const textoTempoAbatido =
    anosInteirosAbatidos > 0
      ? mesesRestoAbatidos > 0
        ? `${comUnidade(fmtNum(anosInteirosAbatidos, 0), anosInteirosAbatidos === 1 ? "ano" : "anos")} e ${comUnidade(fmtNum(mesesRestoAbatidos, 0), mesesRestoAbatidos === 1 ? "mês" : "meses")}`
        : comUnidade(
            fmtNum(anosInteirosAbatidos, 0),
            anosInteirosAbatidos === 1 ? "ano" : "anos"
          )
      : comUnidade(
          fmtNum(resultado.reduzirPrazo.mesesPoupados, 0),
          resultado.reduzirPrazo.mesesPoupados === 1 ? "mês" : "meses"
        );

  const diferencaPrazoVsPrestacao = Math.max(
    0,
    resultado.reduzirPrazo.poupancaLiquida -
      resultado.reduzirPrestacao.poupancaLiquida
  );

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <p className="text-corpo-sm text-ink2">
          {/* PROPOSTA (revisão do dono) */}
          Quando entregas capital extraordinário ao banco para abater à dívida,
          deixas de pagar juros sobre esse dinheiro em todos os anos que faltam.
          Podes escolher entre baixar a prestação mensal (mantendo o prazo final)
          ou manter a prestação actual para terminar o empréstimo mais cedo.
        </p>

        <Regua
          id="amort-extra"
          rotulo="Montante extraordinário a amortizar"
          valor={extraEfetivo}
          onChange={setMontanteExtra}
          min={1000}
          max={maxExtra}
          passo={1000}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />

        <Regua
          id="amort-ano"
          rotulo="Ano do contrato em que fazes a amortização"
          valor={anoEfetivo}
          onChange={(v) => setAnoAmortizacao(Math.round(v))}
          min={1}
          max={maxAno}
          passo={1}
          unidade="ano"
          formato={(v) => fmtNum(v, 0)}
          descricao={`Dívida antes de amortizar: ${fmtEUR0(resultado.dividaAntes)} · passam a ${fmtEUR0(resultado.novaDivida)}`}
        />

        <div>
          <label className="kicker block mb-1.5">
            Comissão de reembolso antecipado (DL 74-A/2017)
          </label>
          <Segmentado
            rotulo="Comissão de reembolso antecipado (DL 74-A/2017)"
            valor={regimeEfetivo}
            onChange={(id) =>
              setRegimeComissaoManual(id as "variavel" | "fixa")
            }
            opcoes={[
              {
                id: "variavel",
                rotulo: `Taxa variável (${fmtPct(regrasCredito.reembolsoAntecipado.comissaoMaximaVariavel, 1)})`,
              },
              {
                id: "fixa",
                rotulo: `Taxa fixa (${fmtPct(regrasCredito.reembolsoAntecipado.comissaoMaximaFixa, 1)})`,
              },
            ]}
          />
        </div>

        <div className="border border-line bg-panel p-4 text-corpo-sm text-ink2 space-y-1.5">
          <p className="font-medium text-ink">
            {/* PROPOSTA (revisão do dono) */}
            Comissão máxima legal: {fmtEUR(resultado.comissao)} (
            {fmtPct(resultado.taxaComissao, 1)})
          </p>
          <p>
            {/* PROPOSTA (revisão do dono) */}
            {regrasCredito.reembolsoAntecipado.nota}
          </p>
        </div>
      </div>

      {/* Painel comparativo lado a lado */}
      <div
        className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6"
        aria-live="polite"
      >
        <div className="border-b border-line px-5 py-3 flex items-baseline justify-between gap-3">
          <span className="kicker">
            Amortizar {fmtEUR0(resultado.montanteAmortizado)} no ano{" "}
            {fmtNum(anoEfetivo, 0)}
          </span>
          <span className="kicker-sm text-keep">
            TAN {fmtPct(tanRef, 2)}
          </span>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Opção A: Baixar a prestação */}
            <div className="border border-line bg-panel p-4 space-y-2">
              <span className="kicker-sm block text-ink2">
                Opção A · Baixar a prestação
              </span>
              <p className="font-display text-2xl font-bold text-keep tabular-nums">
                <Valor
                  numero={fmtNum(resultado.reduzirPrestacao.poupancaLiquida, 0)}
                  unidade="€"
                />
              </p>
              <span className="text-rotulo text-ink2 block">
                juros poupados (líquidos de comissão)
              </span>
              <dl className="text-corpo-sm pt-2 border-t border-line/60 space-y-1">
                <div className="flex justify-between">
                  <dt className="text-ink2">Nova prestação</dt>
                  <dd className="num font-medium">
                    {fmtEUR(resultado.reduzirPrestacao.novaPrestacao)}/mês
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink2">Alívio mensal</dt>
                  <dd className="num text-keep">
                    {MENOS}
                    {fmtEUR(resultado.reduzirPrestacao.reducaoMensal)}/mês
                  </dd>
                </div>
              </dl>
            </div>

            {/* Opção B: Encurtar o prazo */}
            <div className="border-2 border-ink bg-panel p-4 space-y-2">
              <span className="kicker-sm block text-keep">
                Opção B · Encurtar o prazo
              </span>
              <p className="font-display text-2xl font-bold text-keep tabular-nums">
                <Valor
                  numero={fmtNum(resultado.reduzirPrazo.poupancaLiquida, 0)}
                  unidade="€"
                />
              </p>
              <span className="text-rotulo text-ink2 block">
                juros poupados (líquidos de comissão)
              </span>
              <dl className="text-corpo-sm pt-2 border-t border-line/60 space-y-1">
                <div className="flex justify-between">
                  <dt className="text-ink2">Prestação mantida</dt>
                  <dd className="num font-medium">
                    {fmtEUR(resultado.reduzirPrazo.prestacaoMantida)}/mês
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink2">Tempo abatido</dt>
                  <dd className="num font-semibold text-keep">
                    {MENOS}
                    {textoTempoAbatido}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <p className="footnote border-t border-line/60 pt-3">
            {/* PROPOSTA (revisão do dono) */}
            Manter a prestação de {fmtEUR(resultado.prestacaoAtual)}/mês e
            encurtar o contrato em <strong>{textoTempoAbatido}</strong> poupa
            mais{" "}
            <strong>{fmtEUR0(diferencaPrazoVsPrestacao)}</strong> em juros do
            que apenas reduzir a mensalidade (depois de descontar{" "}
            {fmtEUR(resultado.comissao)} de comissão máxima de reembolso).
          </p>
        </div>
      </div>
    </div>
  );
}
