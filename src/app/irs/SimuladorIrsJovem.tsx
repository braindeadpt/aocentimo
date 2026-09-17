"use client";

import { useMemo, useState } from "react";
import { simularIrsJovem, REGRAS_IRS_JOVEM } from "@/lib/engines/irs-jovem";
import { REGRAS_IRS } from "@/lib/engines/irs";
import { retencaoNaFonte } from "@/lib/engines/retencao";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

export function SimuladorIrsJovem({ ano }: { ano: number }) {
  const [bruto, setBruto] = useState(1500);
  const [anoGozo, setAnoGozo] = useState(1);

  const r = useMemo(() => simularIrsJovem(bruto * 14, anoGozo, ano), [bruto, anoGozo, ano]);

  // Na retenção, a taxa efetiva do salário total aplica-se só à parte não isenta
  const ret = retencaoNaFonte(bruto, "naoCasado", 0, ano);
  const retComJovem = ret.retencao * (1 - r.pctIsencao);

  const linhas = REGRAS_IRS_JOVEM.isencaoPorAno.map((pct, i) => {
    const s = simularIrsJovem(bruto * 14, i + 1, ano);
    return { ano: i + 1, pct, poupanca: s.poupancaAnual };
  });
  const poupanca10 = linhas.reduce((a, l) => a + l.poupanca, 0);

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="bruto-j">Salário bruto mensal</label>
          <input id="bruto-j" type="number" min={0} step={50} value={bruto}
            onChange={(e) => setBruto(Number(e.target.value) || 0)} className="field" />
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="ano-j">Ano de gozo do IRS Jovem</label>
          <select id="ano-j" value={anoGozo}
            onChange={(e) => setAnoGozo(Number(e.target.value))} className="field">
            {REGRAS_IRS_JOVEM.isencaoPorAno.map((p, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}.º ano — {fmtPct(p, 0)} de isenção
              </option>
            ))}
          </select>
        </div>
        <p className="footnote">
          Conta a partir do primeiro ano em que entregas IRS sozinho —
          {REGRAS_IRS_JOVEM.anosMax} anos no máximo, até fazeres{" "}
          {REGRAS_IRS_JOVEM.idadeMax}. A isenção tem teto de{" "}
          {fmtEUR0(REGRAS_IRS_JOVEM.limiteIsencaoIas * REGRAS_IRS[2026].ias)}/ano
          (55×IAS) e o
          rendimento isento ainda conta para fixar o teu escalão.
        </p>
      </div>

      <div className="space-y-8" aria-live="polite">
        <div className="bg-surface border border-line">
          <div className="border-b border-line px-5 py-3 flex justify-between items-baseline">
            <span className="kicker">No {anoGozo}.º ano de gozo</span>
            <span className="num text-xs text-muted">{fmtPct(r.pctIsencao, 0)} isento</span>
          </div>
          <dl className="px-5 py-4 text-sm">
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Rendimento isento</dt>
              <dd className="num">{fmtEUR(r.rendimentoIsento)}/ano</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">IRS sem o regime</dt>
              <dd className="num">{fmtEUR(r.irsSemJovem)}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">IRS com IRS Jovem</dt>
              <dd className="num">{fmtEUR(r.irsComJovem)}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Retenção no recibo</dt>
              <dd className="num">
                {fmtEUR(ret.retencao)} → <span className="text-keep">{fmtEUR(retComJovem)}</span>
              </dd>
            </div>
            <div className="flex justify-between py-2.5 mt-1 border-t-2 border-ink">
              <dt className="font-medium">Poupança por ano</dt>
              <dd className="num font-medium text-lg text-keep">{fmtEUR(r.poupancaAnual)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="num mb-3 text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            Os 10 anos, um a um
          </p>
          <table className="w-full text-sm bg-surface border border-line">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th scope="col" className="px-4 py-2 font-medium">Ano de gozo</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Isenção</th>
                <th scope="col" className="px-4 py-2 font-medium text-right">Poupas</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.ano}
                  className={`border-b border-line last:border-0 ${l.ano === anoGozo ? "bg-paper" : ""}`}>
                  <td className="px-4 py-2 text-ink2">{l.ano}.º ano</td>
                  <td className="px-4 py-2 text-right num">{fmtPct(l.pct, 0)}</td>
                  <td className="px-4 py-2 text-right num">{fmtEUR0(l.poupanca)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-ink">
                <td className="px-4 py-2 font-medium" colSpan={2}>Total em 10 anos</td>
                <td className="px-4 py-2 text-right num font-medium">{fmtEUR0(poupanca10)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
