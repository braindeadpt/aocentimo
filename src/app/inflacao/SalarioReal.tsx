"use client";

import { useMemo, useState } from "react";
import { salarioReal, type PontoSerie } from "@/lib/engines/deflator";
import { fmtEUR, fmtPct } from "@/lib/format";

/** "O salário congelou?" — compara o bruto de hoje com o antigo corrigido pelo IHPC. */
export function SalarioReal({ serie }: { serie: PontoSerie[] }) {
  const anos = useMemo(
    () => [...new Set(serie.map((p) => p.t.slice(0, 4)))],
    [serie]
  );
  const [anoInicio, setAnoInicio] = useState(anos[anos.length - 6] ?? anos[0]);
  const [salarioAntigo, setSalarioAntigo] = useState(1200);
  const [salarioHoje, setSalarioHoje] = useState(1400);

  const r = useMemo(() => {
    // último mês disponível desse ano
    const ponto = [...serie].reverse().find((p) => p.t.startsWith(anoInicio));
    if (!ponto) return null;
    return { mes: ponto.t, ...salarioReal(salarioAntigo, salarioHoje, ponto.t, serie)! };
  }, [serie, anoInicio, salarioAntigo, salarioHoje]);

  const ultimo = serie.at(-1)?.t;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="sr-ano">Em finais de</label>
            <select id="sr-ano" value={anoInicio} onChange={(e) => setAnoInicio(e.target.value)}
              className="field">
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="sr-ant">ganhavas, brutos</label>
            <input id="sr-ant" type="number" min={0} step={50} value={salarioAntigo}
              onChange={(e) => setSalarioAntigo(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="sr-hoje">hoje ganhas</label>
            <input id="sr-hoje" type="number" min={0} step={50} value={salarioHoje}
              onChange={(e) => setSalarioHoje(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <p className="footnote">
          O salário «antigo» é corrigido pelo IHPC total (índice geral) — a
          inflação média do país, não o teu cabaz. Um aumento nominal pode ser
          um corte real.
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6" aria-live="polite">
        <div className="border-b border-line px-5 py-3">
          <span className="kicker">Poder de compra {r ? `· ${r.mes} → ${ultimo}` : ""}</span>
        </div>
        {r ? (
          <dl className="px-5 py-4 text-corpo-sm">
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">{fmtEUR(salarioAntigo)} de então valem hoje</dt>
              <dd className="num">{fmtEUR(r.equivalenteHoje)}</dd>
            </div>
            <div className="flex justify-between py-2.5 mt-1 border-t-2 border-ink">
              <dt className="font-medium">Variação real do teu salário</dt>
              <dd className={`num-read font-medium ${r.variacaoReal >= 0 ? "text-keep" : "text-up"}`}>
                {r.variacaoReal >= 0 ? "+" : "−"}{fmtPct(Math.abs(r.variacaoReal))}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="px-5 py-6 footnote">— escolhe um ano com dados.</p>
        )}
        <p className="px-5 pb-4 footnote">
          {r && r.variacaoReal < 0
            ? `Ganhas mais euros, mas compras menos: o teu salário perdeu ${fmtPct(Math.abs(r.variacaoReal))} de poder de compra.`
            : r
              ? "O teu salário cresceu mais do que os preços — ganhaste poder de compra real."
              : ""}
        </p>
      </div>
    </div>
  );
}
