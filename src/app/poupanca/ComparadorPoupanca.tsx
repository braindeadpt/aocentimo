"use client";

import { useMemo, useState } from "react";
import { simularPoupanca, simularCA, simularCTPC } from "@/lib/engines/poupanca";
import { fmtEUR0, fmtPct } from "@/lib/format";
import ca from "@data/fiscal/ca.json";
import capitais from "@data/fiscal/capitais.json";

const inputCls =
  "w-full bg-paper border border-line px-3 py-2 num text-sm focus:outline-none focus:border-line2";

export function ComparadorPoupanca() {
  const [capital, setCapital] = useState(10000);
  const [anos, setAnos] = useState(10);
  const [taxaDeposito, setTaxaDeposito] = useState(1.5);
  const [inflacao, setInflacao] = useState(2.0);

  const taxaImposto = capitais.retencaoLiberatoria.taxa;
  const taxaCA = ca.serieF.taxaBrutaNovasSubscricoes;
  const premios = ca.serieF.premiosPermanencia;

  const dep = useMemo(
    () => simularPoupanca(capital, anos, taxaDeposito / 100, taxaImposto, inflacao / 100),
    [capital, anos, taxaDeposito, taxaImposto, inflacao]
  );
  const caf = useMemo(
    () => simularCA(capital, anos, taxaCA, premios, taxaImposto, inflacao / 100),
    [capital, anos, taxaCA, premios, taxaImposto, inflacao]
  );
  const ctpc = useMemo(
    () =>
      simularCTPC(
        capital,
        Math.min(anos, ca.ctpc.taxasPorAno.length),
        ca.ctpc.taxasPorAno,
        ca.ctpc.premio.atual,
        taxaImposto,
        inflacao / 100
      ),
    [capital, anos, taxaImposto, inflacao]
  );
  const colchao = capital; // sem juros

  const linhas = [
    {
      nome: "Debaixo do colchão",
      final: colchao,
      real: capital / Math.pow(1 + inflacao / 100, anos),
      taxa: 0,
    },
    {
      nome: `Depósito a prazo (${fmtPct(taxaDeposito / 100)})`,
      final: dep.capitalFinalLiquido,
      real: dep.valorReal,
      taxa: dep.taxaLiquida,
    },
    {
      nome: `Certificados do Tesouro PC${anos > 7 ? " (7 anos, na data)" : ""}`,
      final: ctpc.capitalFinalLiquido,
      real: ctpc.valorReal,
      taxa: ctpc.taxaLiquida,
    },
    {
      nome: `Certificados de Aforro F (${fmtPct(taxaCA, 2)} brutos)`,
      final: caf.capitalFinalLiquido,
      real: caf.valorReal,
      taxa: caf.taxaLiquida,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="cap">Capital inicial</label>
          <input id="cap" type="number" min={0} step={500} value={capital}
            onChange={(e) => setCapital(Number(e.target.value) || 0)} className={inputCls} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="anos">Anos</label>
            <input id="anos" type="number" min={1} max={30} value={anos}
              onChange={(e) => setAnos(Number(e.target.value) || 1)} className={inputCls} />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="tdep">Depósito (%)</label>
            <input id="tdep" type="number" step={0.1} min={0} value={taxaDeposito}
              onChange={(e) => setTaxaDeposito(Number(e.target.value) || 0)} className={inputCls} />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="infl">Inflação (%)</label>
            <input id="infl" type="number" step={0.1} value={inflacao}
              onChange={(e) => setInflacao(Number(e.target.value) || 0)} className={inputCls} />
          </div>
        </div>
        <p className="footnote">
          Juros tributados a {fmtPct(taxaImposto, 0)} (retenção liberatória).
          CA Série F: taxa base = média da Euribor 3M, limitada a 2,50 %,
          capitalização trimestral e prémios de permanência incluídos. CTPC:
          taxa crescente de 0,75 % a 2,25 % + prémio PIB atual de{" "}
          {fmtPct(ca.ctpc.premio.atual, 2)}, prazo máximo de 7 anos — simulado
          a taxas constantes, sem prever o PIB futuro.
        </p>
      </div>

      <div>
        <table className="w-full text-sm bg-surface border border-line">
          <thead>
            <tr className="text-left border-b-2 border-ink">
              <th className="px-4 py-2 font-medium">Onde está o dinheiro</th>
              <th className="px-4 py-2 font-medium text-right">Em {anos} anos</th>
              <th className="px-4 py-2 font-medium text-right">Vale hoje</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.nome} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink2">{l.nome}</td>
                <td className="px-4 py-3 text-right num">{fmtEUR0(l.final)}</td>
                <td className="px-4 py-3 text-right num">
                  {fmtEUR0(l.real)}
                  {l.real < capital && (
                    <span className="block text-xs text-up">perde poder de compra</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footnote mt-3">
          &ldquo;Vale hoje&rdquo; = o capital futuro deflacionado pela inflação
          indicada — o poder de compra real, não o número na conta.
        </p>
      </div>
    </div>
  );
}
