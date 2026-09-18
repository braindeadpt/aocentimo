"use client";

import { useMemo, useState } from "react";
import { simularIrsAnual, limitePpr } from "@/lib/engines/irs-anual";
import { NumHero } from "@/components/NumHero";
import { fmtEUR, fmtEUR0 } from "@/lib/format";

function Campo({ id, label, valor, onChange, nota }: {
  id: string; label: string; valor: number; onChange: (v: number) => void; nota?: string;
}) {
  return (
    <div>
      <label className="kicker block mb-1.5" htmlFor={id}>{label}</label>
      <input id={id} type="number" min={0} step={50} value={valor}
        onChange={(e) => onChange(Number(e.target.value) || 0)} className="field" />
      {nota && <p className="footnote mt-1">{nota}</p>}
    </div>
  );
}

export function SimuladorAcerto({ ano }: { ano: number }) {
  const [bruto, setBruto] = useState(1500);
  const [dependentes, setDependentes] = useState(0);
  const [saude, setSaude] = useState(0);
  const [educacao, setEducacao] = useState(0);
  const [rendas, setRendas] = useState(0);
  const [lares, setLares] = useState(0);
  const [ivaFatura, setIvaFatura] = useState(0);
  const [pprEntregas, setPprEntregas] = useState(0);
  const [idade, setIdade] = useState(30);

  const r = useMemo(
    () =>
      simularIrsAnual(bruto, dependentes, {
        saude, educacao, rendas, lares, ivaFatura, pprEntregas, idadeTitular: idade,
      }, ano),
    [bruto, dependentes, saude, educacao, rendas, lares, ivaFatura, pprEntregas, idade, ano]
  );

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Campo id="ac-bruto" label="Salário bruto mensal" valor={bruto} onChange={setBruto} />
          <Campo id="ac-dep" label="Dependentes" valor={dependentes} onChange={setDependentes} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Campo id="ac-saude" label="Despesas de saúde/ano" valor={saude} onChange={setSaude}
            nota="15 %, até 1 000 €" />
          <Campo id="ac-edu" label="Educação/ano" valor={educacao} onChange={setEducacao}
            nota="30 %, até 800 €" />
          <Campo id="ac-rendas" label="Rendas HPP/ano" valor={rendas} onChange={setRendas}
            nota="15 %, até 900 € em 2026" />
          <Campo id="ac-lares" label="Lares e apoio/ano" valor={lares} onChange={setLares}
            nota="25 %, até 403,75 €" />
          <Campo id="ac-iva" label="IVA das faturas (apurado)" valor={ivaFatura} onChange={setIvaFatura}
            nota="o valor que o e-Fatura já apurou, até 250 €" />
          <div className="grid grid-cols-2 gap-2">
            <Campo id="ac-ppr" label="Entregas PPR/ano" valor={pprEntregas} onChange={setPprEntregas}
              nota={`20 %, até ${fmtEUR0(limitePpr(idade))}`} />
            <Campo id="ac-idade" label="Idade" valor={idade} onChange={setIdade} />
          </div>
        </div>
        <p className="footnote">
          Um titular não casado; os valores são os totais anuais que vês no
          e-Fatura/Anexo H. Retenção estimada = recibo mensal × 14 meses.
        </p>
      </div>

      {/* resultado pegajoso: acompanha o scroll dos inputs — a coluna
          nunca fica morta por baixo dos campos */}
      <div className="space-y-8 self-start md:sticky md:top-6" aria-live="polite">
        <div className="bg-raised border border-line shadow-raised">
          <div className="border-b border-line px-5 py-3 flex justify-between items-baseline">
            <span className="kicker">O acerto de contas</span>
            <span className="num text-xs text-muted">IRS {ano}</span>
          </div>
          <dl className="px-5 py-4 text-sm">
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Coleta antes das deduções</dt>
              <dd className="num">{fmtEUR(r.irsBruto)}</dd>
            </div>
            {r.linhasDeducao.filter((l) => l.deducao > 0).map((l) => (
              <div key={l.categoria} className="flex justify-between py-1.5 border-b border-line/60">
                <dt className="text-ink2">{l.categoria}</dt>
                <dd className="num text-keep">−{fmtEUR(l.deducao)}</dd>
              </div>
            ))}
            {r.deducaoPpr > 0 && (
              <div className="flex justify-between py-1.5 border-b border-line/60">
                <dt className="text-ink2">PPR (20 % das entregas)</dt>
                <dd className="num text-keep">−{fmtEUR(r.deducaoPpr)}</dd>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Despesas gerais + dependentes</dt>
              <dd className="num text-keep">
                −{fmtEUR(r.deducoesColeta - r.dentroDoLimiteGlobal)}
              </dd>
            </div>
            <div className="flex justify-between py-2 mt-1 border-t-2 border-ink">
              <dt className="font-medium">IRS final</dt>
              <dd className="num font-medium text-lg">{fmtEUR(r.irsAnual)}</dd>
            </div>
            <div className="flex justify-between py-1.5 text-ink2">
              <dt>Retiveste ao longo do ano</dt>
              <dd className="num">{fmtEUR(r.retidoAno)}</dd>
            </div>
          </dl>
          <div className={`border-t border-line px-5 py-4 ${r.reembolsoEstimado >= 0 ? "" : ""}`}>
            <p className="kicker">
              {r.reembolsoEstimado >= 0 ? "O Estado devolve-te" : "Ainda tens a pagar"}
            </p>
            <NumHero
              valor={fmtEUR(Math.abs(r.reembolsoEstimado))}
              animar={Math.abs(r.reembolsoEstimado)}
              sinal={r.reembolsoEstimado >= 0 ? "+" : "−"}
              className={`mt-1 ${r.reembolsoEstimado >= 0 ? "text-keep" : "text-up"}`}
            />
            <p className="footnote mt-2">
              {r.reembolsoEstimado >= 0
                ? "Reembolso — foi um empréstimo grátis que fizeste ao Estado, mês a mês."
                : "A retenção ficou aquém do IRS devido — o acerto cobra a diferença."}
              {r.limiteGlobal !== Infinity && r.linhasDeducao.reduce((a, l) => a + l.deducao, 0) + r.deducaoPpr > r.limiteGlobal &&
                ` O limite global do art. 78.º cortou-te as deduções em ${fmtEUR0(r.limiteGlobal)}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
