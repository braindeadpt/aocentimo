"use client";

import { useMemo, useState } from "react";
import { simularIndependente } from "@/lib/engines/independente";
import { Cascata } from "@/components/Cascata";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

export function SimuladorIndependente() {
  const [faturacao, setFaturacao] = useState(2000);
  const [primeiroAno, setPrimeiroAno] = useState(false);

  const anual = faturacao * 12;
  const r = useMemo(
    () => simularIndependente(anual, { primeiroAno }),
    [anual, primeiroAno]
  );

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="fat">Faturação média mensal</label>
          <input id="fat" type="number" min={0} step={100} value={faturacao}
            onChange={(e) => setFaturacao(Number(e.target.value) || 0)} className="field" />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink2">
          <input type="checkbox" checked={primeiroAno}
            onChange={(e) => setPrimeiroAno(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]" />
          Primeiro ano de atividade (isento de SS)
        </label>
        <p className="footnote">
          Regime simplificado: o IRS incide sobre 75 % do que faturas. A SS é
          21,4 % sobre o rendimento relevante (70 % do bruto) — cerca de 15 %
          do que recebes, com base mínima de 1,5×IAS. Os clientes retêm 23 %
          na fonte (2026), que acerta na liquidação.
        </p>
      </div>

      <div className="space-y-8" aria-live="polite">
        <div className="bg-surface border border-line">
          <div className="border-b border-line px-5 py-3">
            <span className="kicker">Por ano, em {fmtEUR0(anual)} faturados</span>
          </div>
          <dl className="px-5 py-4 text-sm">
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Segurança Social{primeiroAno && " (isento)"}</dt>
              <dd className="num text-up">{fmtEUR(r.ss)} −</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">IRS (75 % × escalões)</dt>
              <dd className="num text-up">{fmtEUR(r.irs)} −</dd>
            </div>
            <div className="flex justify-between py-2.5 mt-1 border-t-2 border-ink">
              <dt className="font-medium">Líquido anual</dt>
              <dd className="num font-medium text-lg">{fmtEUR(r.liquidoAnual)}</dd>
            </div>
            <div className="flex justify-between py-1 text-ink2">
              <dt>Por mês (12)</dt>
              <dd className="num">{fmtEUR(r.liquidoMensal12)}</dd>
            </div>
            <div className="flex justify-between py-1 text-ink2">
              <dt>Peso total (SS + IRS)</dt>
              <dd className="num text-up">{fmtPct(r.pesoTotal)}</dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="kicker-sm mb-3">
            Da faturação ao bolso
          </p>
          <Cascata
            passos={[
              { label: "Faturação", valor: r.faturacaoAnual, tipo: "base" },
              { label: "Segurança Social", valor: -r.ss, tipo: "corte" },
              { label: "IRS", valor: -r.irs, tipo: "corte" },
              { label: "Líquido", valor: r.liquidoAnual, tipo: "total" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
