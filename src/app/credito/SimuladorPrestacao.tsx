"use client";

import { useMemo, useState } from "react";
import { simularPrestacao } from "@/lib/engines/prestacao";
import { JuroCapital } from "@/components/JuroCapital";
import { NumHero } from "@/components/NumHero";
import { TweenNum } from "@/components/TweenNum";
import { fmtData, fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

/**
 * Crédito — o mapa de amortização e o choque.
 *
 * A prestação é um número que esconde uma divisão: no início quase
 * tudo é juro, no fim quase tudo é capital. O <JuroCapital> mostra
 * essa troca de peso ao longo dos anos — é a leitura que o banco
 * nunca desenha.
 *
 * O choque +1 p.p. é um interruptor, não uma linha de texto: ao ligar,
 * TODA a resposta muda de estado — o NumHero desliza para a prestação
 * chocada, os juros totais interpolam a inchar (TweenNum) e o mapa
 * re-desenha a divisória. Tudo sobre o mesmo token de duração (M-09).
 */
export function SimuladorPrestacao({
  euriborAtual,
  euriborAte,
}: {
  euriborAtual: number | null;
  euriborAte: string | null;
}) {
  const [capital, setCapital] = useState(200000);
  const [anos, setAnos] = useState(30);
  const [choqueOn, setChoqueOn] = useState(false);
  // regra nº1: se o BPstat falhar, o campo fica vazio — nunca um valor inventado
  const [euribor, setEuribor] = useState<number | null>(
    euriborAtual !== null ? Math.round(euriborAtual * 100) / 100 : null
  );
  const [spread, setSpread] = useState(1.0);

  // a taxa em vigor no painel — com o choque ligado, +1 p.p.
  const eurEf = euribor === null ? null : euribor + (choqueOn ? 1 : 0);

  const r = useMemo(
    () => (eurEf === null ? null : simularPrestacao(capital, anos * 12, eurEf / 100, spread / 100)),
    [capital, anos, eurEf, spread]
  );
  // a simulação de base — para ler o custo do choque em euros
  const base = useMemo(
    () => (euribor === null ? null : simularPrestacao(capital, anos * 12, euribor / 100, spread / 100)),
    [capital, anos, euribor, spread]
  );
  const runMapa = `${capital}-${anos}-${eurEf}-${spread}`;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="cap">Capital em dívida</label>
          <input id="cap" type="number" min={0} step={5000} value={capital}
            onChange={(e) => setCapital(Number(e.target.value) || 0)} className="field" />
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="prazo">Prazo (anos)</label>
          <input id="prazo" type="number" min={1} max={50} value={anos}
            onChange={(e) => setAnos(Number(e.target.value) || 1)} className="field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="eur">Euribor (%)</label>
            <input id="eur" type="number" step={0.1} value={euribor ?? ""}
              onChange={(e) =>
                setEuribor(e.target.value === "" ? null : Number(e.target.value))
              }
              className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="spr">Spread (%)</label>
            <input id="spr" type="number" step={0.1} min={0} value={spread}
              onChange={(e) => setSpread(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        {/* o choque é um acto — não uma nota de rodapé */}
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={choqueOn}
            onChange={(e) => setChoqueOn(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-up)]"
          />
          Simular choque: Euribor sobe +1 p.p.
        </label>
        <p className="footnote">
          TAN = Euribor + spread = {r ? fmtPct(r.tan) : "—"}. A TAEG junta seguros e
          comissões — é o número a comparar entre bancos, não o spread sozinho.
        </p>
        <p className="footnote mt-1">
          {euriborAtual !== null ? (
            <>
              Euribor 3M real em {fmtPct(euriborAtual / 100, 2)} (BPstat, média
              de {euriborAte ? fmtData(euriborAte) : "série mais recente"}) — o
              valor vem preenchido, muda-o à vontade.
            </>
          ) : (
            <>Euribor indisponível — o BPstat não respondeu; escreve a taxa do teu contrato.</>
          )}
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6" aria-live="polite">
        <div className="border-b border-line px-5 py-3 flex items-baseline justify-between gap-3">
          <span className="kicker">A tua prestação</span>
          {choqueOn && (
            <span className="kicker-sm text-up">choque +1 p.p.</span>
          )}
        </div>
        <div className="px-5 py-5">
          <NumHero valor={r ? fmtEUR(r.prestacao) : "—"} sufixo={r ? "/mês" : undefined} animar={r?.prestacao} />
          <dl className="mt-5 text-sm space-y-2">
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Juros totais em {anos} anos</dt>
              <dd className="num">
                {r ? (
                  <TweenNum valor={r.jurosTotais} casas={0} texto={fmtEUR0(r.jurosTotais)} sufixo=" €" />
                ) : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Custo total (aprox. MTIC)</dt>
              <dd className="num font-medium">
                {r ? (
                  <TweenNum valor={r.custoTotal} casas={0} texto={fmtEUR0(r.custoTotal)} sufixo=" €" />
                ) : "—"}
              </dd>
            </div>
            <div className="flex justify-between pb-1.5">
              <dt className="text-ink2">O choque custa</dt>
              <dd className="num text-up">
                {choqueOn && r && base
                  ? `+${fmtEUR(r.prestacao - base.prestacao)}/mês · +${fmtEUR0(r.jurosTotais - base.jurosTotais)} juros`
                  : "—"}
              </dd>
            </div>
          </dl>

          {/* a divisão escondida — capital fica teu, juro vai para o banco */}
          {r && <JuroCapital linhas={r.linhas} runKey={runMapa} />}
        </div>
        <p className="footnote px-5 pb-4">
          Sistema francês (prestação constante): no início quase tudo é juro,
          no fim quase tudo é capital. Por isso amortizar cedo poupa mais.
        </p>
      </div>
    </div>
  );
}
