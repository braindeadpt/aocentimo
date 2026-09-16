"use client";

import { useMemo, useState } from "react";
import { simularDesemprego } from "@/lib/engines/desemprego";
import { fmtEUR } from "@/lib/format";

const inputCls =
  "w-full bg-paper border border-line px-3 py-2 num text-sm focus:outline-none focus:border-line2";

export function SimuladorDesemprego() {
  const [bruto, setBruto] = useState(1500);
  const [idade, setIdade] = useState(35);
  const [anosDescontos, setAnosDescontos] = useState(5);
  const [majoracao, setMajoracao] = useState(false);

  const r = useMemo(
    () => simularDesemprego(bruto, idade, anosDescontos, { majoracao }),
    [bruto, idade, anosDescontos, majoracao]
  );

  const meses = Math.round(r.duracaoDias / 30);

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="bruto-d">Salário bruto mensal (antes do desemprego)</label>
          <input id="bruto-d" type="number" min={0} step={50} value={bruto}
            onChange={(e) => setBruto(Number(e.target.value) || 0)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="idade">A tua idade</label>
            <input id="idade" type="number" min={16} max={66} value={idade}
              onChange={(e) => setIdade(Number(e.target.value) || 16)} className={inputCls} />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="desc">Anos de descontos</label>
            <input id="desc" type="number" min={0} max={40} value={anosDescontos}
              onChange={(e) => setAnosDescontos(Number(e.target.value) || 0)} className={inputCls} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink2">
          <input type="checkbox" checked={majoracao}
            onChange={(e) => setMajoracao(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]" />
          Casal desempregado com filhos / monoparental (+10 %)
        </label>
        <p className="footnote">
          A remuneração de referência é a média dos primeiros 12 dos últimos 14
          meses, com subsídios de férias e de Natal — para salário estável, é{" "}
          <span className="num">bruto × 14/12</span>. Prazo de garantia: 360
          dias de descontos nos últimos 24 meses.
        </p>
      </div>

      <div className="bg-surface border border-line self-start">
        <div className="border-b border-line px-5 py-3 flex justify-between items-baseline">
          <span className="kicker">O teu subsídio</span>
          <span className="num text-xs text-muted">65 % da remuneração de referência</span>
        </div>
        {r.elegivel ? (
          <>
            <div className="px-5 py-5">
              <p className="num text-4xl">
                {fmtEUR(r.mensal)}
                <span className="text-base text-muted">/mês</span>
              </p>
              <dl className="mt-4 text-sm space-y-2">
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  <dt className="text-ink2">Remuneração de referência</dt>
                  <dd className="num">{fmtEUR(r.remReferencia)}</dd>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  <dt className="text-ink2">… líquida (após SS + retenção)</dt>
                  <dd className="num">{fmtEUR(r.remReferenciaLiquida)}</dd>
                </div>
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  <dt className="text-ink2">Do 7.º mês em diante (−10 %)</dt>
                  <dd className="num text-up">{fmtEUR(r.apos180Dias)}</dd>
                </div>
                <div className="flex justify-between pb-1.5">
                  <dt className="text-ink2">Duração</dt>
                  <dd className="num font-medium">
                    {r.duracaoDias} dias <span className="text-muted">(~{meses} meses)</span>
                  </dd>
                </div>
              </dl>
            </div>
            <p className="footnote px-5 pb-4">
              Limites: entre {fmtEUR(537.13)} e {fmtEUR(1342.83)} (1–2,5×IAS), e
              nunca acima de 75 % da remuneração líquida de referência. Pedido
              no IEFP até 90 dias após o fim do contrato.
            </p>
          </>
        ) : (
          <p className="px-5 py-6 text-sm text-up">{r.nota}</p>
        )}
      </div>
    </div>
  );
}
