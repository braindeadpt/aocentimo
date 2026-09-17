"use client";

import { useMemo, useState } from "react";
import { simularPrestacao } from "@/lib/engines/prestacao";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

export function SimuladorPrestacao() {
  const [capital, setCapital] = useState(200000);
  const [anos, setAnos] = useState(30);
  const [euribor, setEuribor] = useState(2.0);
  const [spread, setSpread] = useState(1.0);

  const r = useMemo(
    () => simularPrestacao(capital, anos * 12, euribor / 100, spread / 100),
    [capital, anos, euribor, spread]
  );
  const choque = useMemo(
    () => simularPrestacao(capital, anos * 12, (euribor + 1) / 100, spread / 100),
    [capital, anos, euribor, spread]
  );

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
            <input id="eur" type="number" step={0.1} value={euribor}
              onChange={(e) => setEuribor(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="spr">Spread (%)</label>
            <input id="spr" type="number" step={0.1} min={0} value={spread}
              onChange={(e) => setSpread(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <p className="footnote">
          TAN = Euribor + spread = {fmtPct(r.tan)}. A TAEG junta seguros e
          comissões — é o número a comparar entre bancos, não o spread sozinho.
        </p>
      </div>

      <div className="bg-surface border border-line" aria-live="polite">
        <div className="border-b border-line px-5 py-3">
          <span className="kicker">A tua prestação</span>
        </div>
        <div className="px-5 py-5">
          <p className="num text-4xl">{fmtEUR(r.prestacao)}<span className="text-base text-muted">/mês</span></p>
          <dl className="mt-5 text-sm space-y-2">
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Juros totais em {anos} anos</dt>
              <dd className="num">{fmtEUR0(r.jurosTotais)}</dd>
            </div>
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Custo total (aprox. MTIC)</dt>
              <dd className="num font-medium">{fmtEUR0(r.custoTotal)}</dd>
            </div>
            <div className="flex justify-between pb-1.5">
              <dt className="text-ink2">Se a Euribor subir +1 p.p.</dt>
              <dd className="num text-up">
                {fmtEUR(choque.prestacao)} (+{fmtEUR(choque.prestacao - r.prestacao)})
              </dd>
            </div>
          </dl>
        </div>
        <p className="footnote px-5 pb-4">
          Sistema francês (prestação constante): no início quase tudo é juro,
          no fim quase tudo é capital. Por isso amortizar cedo poupa mais.
        </p>
      </div>
    </div>
  );
}
