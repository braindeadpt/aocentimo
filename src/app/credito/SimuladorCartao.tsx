"use client";

import { useMemo, useState } from "react";
import { Regua } from "@/components/Regua";
import { Segmentado, type OpcaoSegmento } from "@/components/Segmentado";
import { Valor } from "@/components/Valor";
import { simularCartao } from "@/lib/engines/cartao";
import {
  FINO,
  comUnidade,
  fmtData,
  fmtEUR,
  fmtEUR0,
  fmtNum,
  fmtPct,
} from "@/lib/format";

/* PROPOSTA (revisão do dono) */
export interface SimuladorCartaoProps {
  /** TAEG média do crédito renovável e cartões (BPstat) — ex.: 17,6 % */
  taegMediaMercado: number | null;
  /** Período da série do BPstat (YYYY-MM) */
  taegMediaAte: string | null;
  /** Taxa máxima legal de usura para crédito renovável no trimestre (BdP) — ex.: 18,5 % */
  taegMaximaUsura: number;
  /** Rótulo do trimestre vigente da usura — ex.: «2026-T4» */
  trimestreUsura: string;
  /** URL oficial da legislação de cartões (DL 133/2009) */
  fonteCartoesUrl: string;
}

const OPCOES_MODALIDADE: readonly OpcaoSegmento[] = [
  { id: "3", rotulo: `3${FINO}%` },
  { id: "4", rotulo: `4${FINO}%` },
  { id: "5", rotulo: `5${FINO}%` },
  { id: "10", rotulo: `10${FINO}%` },
  { id: "100", rotulo: `100${FINO}% (sem juros)` },
];

/**
 * A armadilha do pagamento mínimo no cartão de crédito — Ouro Escondido #2.
 *
 * Simula em tempo real quanto custa saldar uma dívida de cartão pagando
 * apenas o montante mínimo acordado (revolving), usando o motor puro `simularCartao()`.
 * Trata explicitamente o caso em que a prestação mínima não cobre os juros
 * (`liquidado === false`), alertando com verdade sem inventar prazos.
 */
export function SimuladorCartao({
  taegMediaMercado,
  taegMediaAte,
  taegMaximaUsura,
  trimestreUsura,
  fonteCartoesUrl,
}: SimuladorCartaoProps) {
  const [saldo, setSaldo] = useState(1500);
  const [taegAnualPct, setTaegAnualPct] = useState(taegMediaMercado ?? 17.6);
  const [modalidadeId, setModalidadeId] = useState("4");
  const [minimoEuros, setMinimoEuros] = useState(25);

  const modalidadePct = Number(modalidadeId);

  // presets da TAEG do cartão
  const presetsTaeg = [
    ...(taegMediaMercado !== null
      ? [{ rotulo: "média mercado", valor: taegMediaMercado }]
      : []),
    { rotulo: `máx. usura (${trimestreUsura})`, valor: taegMaximaUsura },
  ];

  const resultado = useMemo(() => {
    if (saldo <= 0) return null;
    try {
      return simularCartao({
        saldo,
        taegAnualPct,
        prestacaoMinimaPct: modalidadePct,
        prestacaoMinimaEuros: minimoEuros > 0 ? minimoEuros : undefined,
        maxMeses: 600,
      });
    } catch {
      return null;
    }
  }, [saldo, taegAnualPct, modalidadePct, minimoEuros]);

  const meses = resultado?.meses ?? 0;
  const anosCalc = Math.floor(meses / 12);
  const mesesCalc = meses % 12;
  const tempoTexto =
    anosCalc > 0
      ? mesesCalc > 0
        ? `${comUnidade(fmtNum(anosCalc, 0), "anos")} e ${comUnidade(fmtNum(mesesCalc, 0), "meses")}`
        : `${comUnidade(fmtNum(anosCalc, 0), "anos")}`
      : `${comUnidade(fmtNum(mesesCalc, 0), "meses")}`;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <p className="text-corpo-sm text-ink2">
          {/* PROPOSTA (revisão do dono) */}
          Os cartões de crédito são onde as famílias pagam as taxas mais altas
          em Portugal ({comUnidade(fmtNum(taegMediaMercado ?? 17.6, 1), "%")} TAEG média no BPstat).
          A modalidade de pagamento mínimo (revolving) adia o capital e faz
          os juros capitalizarem mês a mês.
        </p>

        <Regua
          id="cartao-saldo"
          rotulo="Saldo em dívida no cartão"
          valor={saldo}
          onChange={setSaldo}
          min={200}
          max={10000}
          passo={100}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />

        <Regua
          id="cartao-taeg"
          rotulo="TAEG do cartão (%)"
          valor={taegAnualPct}
          onChange={setTaegAnualPct}
          min={5}
          max={25}
          passo={0.1}
          unidade="%"
          formato={(v) => fmtNum(v, 1)}
          presets={presetsTaeg}
        />

        <div>
          <label className="kicker block mb-1.5">
            Pagamento mensal (% do saldo)
          </label>
          <Segmentado
            rotulo="Pagamento mensal do cartão"
            valor={modalidadeId}
            onChange={setModalidadeId}
            opcoes={OPCOES_MODALIDADE}
          />
        </div>

        {modalidadePct < 100 && (
          <Regua
            id="cartao-min-eur"
            rotulo="Prestação mínima do contrato (€)"
            valor={minimoEuros}
            onChange={setMinimoEuros}
            min={0}
            max={100}
            passo={5}
            unidade="€"
            formato={(v) => fmtNum(v, 0)}
          />
        )}

        <p className="footnote">
          {/* PROPOSTA (revisão do dono) */}
          Em Portugal não existe percentagem mínima legal fixada por lei — a
          revisão da Directiva (UE) 2023/2225 exige apenas transparência
          (ver{" "}
          <a
            href={fonteCartoesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-line2 underline-offset-2 hover:text-ink"
          >
            DL n.º 133/2009
          </a>
          ). Cada banco estabelece no contrato o maior valor entre a
          percentagem e um piso em euros (ex.: 25{FINO}€).
        </p>
      </div>

      {/* Painel de Resultados do Cartão */}
      <div
        className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6"
        aria-live="polite"
      >
        <div className="border-b border-line px-5 py-3 flex items-baseline justify-between gap-3">
          <span className="kicker">Custo do pagamento mínimo</span>
          <span className="kicker-sm text-ink2">
            TAEG {fmtPct(taegAnualPct / 100, 1)}
          </span>
        </div>

        <div className="px-5 py-5 space-y-5">
          {modalidadePct === 100 ? (
            <div className="border border-keep/60 bg-keep/10 p-4 text-corpo-sm text-ink space-y-2">
              <p className="font-semibold text-keep">
                Pagamento a 100{FINO}%: zero juros (free-float)
              </p>
              <p>
                {/* PROPOSTA (revisão do dono) */}
                Ao saldares a totalidade do saldo na data-limite do extrato,
                beneficias do período de crédito sem juros (free-float).
                Devolves exatamente os <strong>{fmtEUR0(saldo)}</strong> que utilizaste,
                sem pagar um único cêntimo de juros ao banco.
              </p>
            </div>
          ) : !resultado?.liquidado ? (
            <div
              role="alert"
              className="border-2 border-accent bg-accent/10 p-4 text-corpo-sm text-ink space-y-2"
            >
              <p className="font-semibold text-accent flex items-center gap-1.5">
                <span aria-hidden="true">⚠️</span> A dívida nunca é liquidada!
              </p>
              <p>
                {/* PROPOSTA (revisão do dono) */}
                Com esta prestação ({modalidadePct}{FINO}% sem piso mínimo suficiente em euros),
                os juros mensais cobrem praticamente todo o pagamento. Ao fim de 600 meses
                (50 anos de simulação), ainda resta uma dívida de{" "}
                <strong>{fmtEUR(resultado?.linhas.at(-1)?.dividaFim ?? 0)}</strong>, depois
                de já teres pago <strong>{fmtEUR0(resultado?.totalPago ?? 0)}</strong>.
              </p>
              <p className="text-rotulo text-ink2">
                Para conseguir amortizar a dívida, aumenta a percentagem mensal ou fixa
                uma prestação mínima em euros mais alta (ex.: 25{FINO}€).
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 border-b border-line/60 pb-4">
                <div>
                  <span className="kicker-sm block text-muted">Tempo até saldar</span>
                  <p className="font-display text-2xl font-bold text-ink tabular-nums mt-1">
                    {tempoTexto}
                  </p>
                  <span className="text-rotulo text-ink2">
                    {resultado.meses} meses no total
                  </span>
                </div>
                <div>
                  <span className="kicker-sm block text-accent">Juros pagos</span>
                  <p className="font-display text-2xl font-bold text-accent tabular-nums mt-1">
                    <Valor numero={fmtNum(resultado.jurosTotais, 0)} unidade="€" />
                  </p>
                  <span className="text-rotulo text-ink2">
                    +{fmtPct(resultado.jurosTotais / saldo, 0)} do que pediste
                  </span>
                </div>
              </div>

              <dl className="text-corpo-sm space-y-2.5">
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  <dt className="text-ink2">Total que sai da tua carteira</dt>
                  <dd className="num font-bold text-ink">
                    {fmtEUR(resultado.totalPago)}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  <dt className="text-ink2">Primeira prestação</dt>
                  <dd className="num">{fmtEUR(resultado.linhas[0].prestacao)}</dd>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  <dt className="text-ink2">… dos quais juros no 1.º mês</dt>
                  <dd className="num text-accent">
                    {fmtEUR(resultado.linhas[0].juros)}
                  </dd>
                </div>
                <div className="flex justify-between pb-1">
                  <dt className="text-ink2">… abatem à dívida no 1.º mês</dt>
                  <dd className="num text-keep">
                    {fmtEUR(resultado.linhas[0].amortizacao)}
                  </dd>
                </div>
              </dl>

              <p className="footnote border-t border-line/60 pt-3">
                {/* PROPOSTA (revisão do dono) */}
                No primeiro mês, de uma prestação de {fmtEUR(resultado.linhas[0].prestacao)},{" "}
                <strong>{fmtEUR(resultado.linhas[0].juros)}</strong> vão diretamente
                para juros do banco e apenas <strong>{fmtEUR(resultado.linhas[0].amortizacao)}</strong> abatem
                ao capital. Por isso é que uma dívida de {fmtEUR0(saldo)} leva {tempoTexto} a saldar
                e custa mais <strong>{fmtEUR0(resultado.jurosTotais)}</strong> em juros.
              </p>
            </>
          )}

          <div className="text-rotulo text-ink2 border-t border-line/60 pt-3 space-y-1">
            <p>
              TAEG média praticada: {taegMediaMercado ? fmtPct(taegMediaMercado / 100, 1) : "—"} (BPstat
              {taegMediaAte ? `, ${fmtData(taegMediaAte)}` : ""}) · Limite de usura: {fmtPct(taegMaximaUsura / 100, 1)} ({trimestreUsura}).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
