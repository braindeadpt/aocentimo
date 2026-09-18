"use client";

import { useMemo, useState } from "react";
import { REGRAS_PPR, limitePpr } from "@/lib/engines/irs-anual";
import capitais from "@data/fiscal/capitais.json";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

export function SimuladorPpr() {
  const [entregas, setEntregas] = useState(2000);
  const [idade, setIdade] = useState(30);
  const [anos, setAnos] = useState(10);
  const [taxa, setTaxa] = useState(3.0);

  const r = useMemo(() => {
    const limite = limitePpr(idade);
    const deducaoAnual = Math.min(entregas * REGRAS_PPR.deducao.pct, limite);
    // juros compostos sobre entregas anuais no fim de cada ano
    let capital = 0;
    for (let i = 0; i < anos; i++) capital = (capital + entregas) * (1 + taxa / 100);
    const rendimentos = capital - entregas * anos;
    const impostoSaida = rendimentos * REGRAS_PPR.saida.taxaEfetivaDentro;
    const impostoNormal = rendimentos * capitais.retencaoLiberatoria.taxa;
    return {
      deducaoAnual,
      deducaoTotal: deducaoAnual * anos,
      capital,
      rendimentos,
      impostoSaida,
      impostoNormal,
      liquido: capital - impostoSaida,
      poupancaTotal: deducaoAnual * anos + (impostoNormal - impostoSaida),
    };
  }, [entregas, idade, anos, taxa]);

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="ppr-ent">Entregas por ano</label>
            <input id="ppr-ent" type="number" min={0} step={100} value={entregas}
              onChange={(e) => setEntregas(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="ppr-idade">A tua idade</label>
            <input id="ppr-idade" type="number" min={18} max={66} value={idade}
              onChange={(e) => setIdade(Number(e.target.value) || 18)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="ppr-anos">Anos até resgatar</label>
            <input id="ppr-anos" type="number" min={1} max={40} value={anos}
              onChange={(e) => setAnos(Number(e.target.value) || 1)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="ppr-taxa">Rentabilidade (%/ano)</label>
            <input id="ppr-taxa" type="number" step={0.5} value={taxa}
              onChange={(e) => setTaxa(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <p className="footnote">
          Dedução à coleta de 20 % das entregas, até {fmtEUR0(limitePpr(idade))}
          /ano na tua idade — entra no limite global do art. 78.º. Na saída
          dentro das condições legais, os rendimentos pagam 8 % efetivos.
          Resgatar fora das condições devolve o benefício +10 %/ano — o PPR
          é dinheiro preso.
        </p>
      </div>

      <div className="bg-raised border border-line shadow-raised self-start" aria-live="polite">
        <div className="border-b border-line px-5 py-3">
          <span className="kicker">O benefício, dos dois lados</span>
        </div>
        <dl className="px-5 py-4 text-sm">
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Deduzes ao IRS, por ano</dt>
            <dd className="num text-keep">{fmtEUR(r.deducaoAnual)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">… em {anos} anos de entregas</dt>
            <dd className="num text-keep">{fmtEUR0(r.deducaoTotal)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Capital estimado no resgate</dt>
            <dd className="num">{fmtEUR0(r.capital)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">
              Imposto sobre {fmtEUR0(r.rendimentos)} de rendimentos
              <span className="block text-xs text-muted">8 % efetivos vs {fmtPct(capitais.retencaoLiberatoria.taxa, 0)} normais</span>
            </dt>
            <dd className="num">{fmtEUR(r.impostoSaida)} <span className="text-muted">({fmtEUR(r.impostoNormal)})</span></dd>
          </div>
          <div className="flex justify-between py-2.5 mt-1 border-t-2 border-ink">
            <dt className="font-medium">Vantagem fiscal total</dt>
            <dd className="num font-medium text-lg text-keep">{fmtEUR0(r.poupancaTotal)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
