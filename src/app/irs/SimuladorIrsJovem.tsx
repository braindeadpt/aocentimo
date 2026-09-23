"use client";

import { Fragment, useMemo, useState } from "react";
import { simularIrsJovem, REGRAS_IRS_JOVEM } from "@/lib/engines/irs-jovem";
import { REGRAS_IRS } from "@/lib/engines/irs";
import { retencaoNaFonte } from "@/lib/engines/retencao";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";

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

  // a sequência reimprime-se passo a passo quando o salário muda —
  // key num Fragment dentro do <ol> estável (M-13 fix)
  const runJov = `${bruto}`;
  const { ref: passosRef, arm: passosArm } = useArmado<HTMLOListElement>(runJov);

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

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="space-y-8 self-start md:sticky md:top-6" aria-live="polite">
        <div className="bg-raised border border-line shadow-raised">
          <div className="border-b border-line px-5 py-3 flex justify-between items-baseline">
            <span className="kicker">No {anoGozo}.º ano de gozo</span>
            <span className="num text-rotulo text-muted">{fmtPct(r.pctIsencao, 0)} isento</span>
          </div>
          <dl className="px-5 py-4 text-corpo-sm">
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
              <dd className="num-read font-medium text-keep">{fmtEUR(r.poupancaAnual)}</dd>
            </div>
          </dl>
        </div>

        {/* os 10 anos como sequência — cada passo é um botão que escolhe
            o ano de gozo; o medidor mostra a isenção a escoar
            (100 → 75 → 50 → 25 %). Reimprimem-se em cadeia quando o
            salário muda: a poupança percorre os dez anos outra vez */}
        <div>
          <p className="kicker-sm mb-3">Os 10 anos, um a um</p>
          <ol className="jovem-passos" ref={passosRef}>
            <Fragment key={runJov}>
              {linhas.map((l, i) => (
                <li key={l.ano}>
                  <button
                    type="button"
                    onClick={() => setAnoGozo(l.ano)}
                    aria-pressed={l.ano === anoGozo}
                    aria-label={`${l.ano}.º ano: ${fmtPct(l.pct, 0)} de isenção — poupas ${fmtEUR0(l.poupanca)}`}
                    className={
                      "jovem-passo " + passosArm("talao-linha") +
                      (l.ano === anoGozo ? " jovem-passo-ativo" : "")
                    }
                    style={{ "--linha": i } as React.CSSProperties}
                  >
                    <span className="jovem-passo-ano">{l.ano}.º</span>
                    <span className="jovem-gauge" aria-hidden>
                      <span
                        className="jovem-gauge-f"
                        style={{ height: `${l.pct * 100}%` }}
                      />
                    </span>
                    <span className="jovem-passo-val">{fmtEUR0(l.poupanca)}</span>
                  </button>
                </li>
              ))}
            </Fragment>
          </ol>
          <p className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-2 text-corpo-sm">
            <span className="font-medium text-ink">Total em 10 anos</span>
            <span className="num font-medium text-keep">{fmtEUR0(poupanca10)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
