"use client";

import { useMemo, useState } from "react";
import { simularSalario } from "@/lib/engines/irs";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

const inputCls =
  "w-full bg-surface border border-line px-3 py-2 num text-sm focus:outline-none focus:border-line2";

export function CalculadoraSalario({ ano }: { ano: number }) {
  const [bruto, setBruto] = useState(1500);
  const [situacao, setSituacao] = useState<"solteiro" | "casado2" | "casado1">("solteiro");
  const [conjuge, setConjuge] = useState(1500);
  const [dependentes, setDependentes] = useState(0);

  // Em "casado único titular" o cônjuge sem rendimentos conta para o
  // quociente conjugal (÷2) mas não tem dedução específica própria.
  const resultado = useMemo(() => {
    const brutos =
      situacao === "solteiro"
        ? [bruto]
        : situacao === "casado2"
          ? [bruto, conjuge]
          : [bruto, 0];
    return simularSalario(brutos, dependentes, ano);
  }, [bruto, conjuge, situacao, dependentes, ano]);

  const linhas = [
    ["Salário bruto anual", resultado.brutoAnualTotal],
    ["Segurança Social (11 %)", -resultado.ssAnual],
    [`IRS ${ano} (estimativa)`, -resultado.irsAnual],
  ];

  return (
    <div className="grid md:grid-cols-[1fr_1.2fr] gap-10">
      {/* inputs */}
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="bruto">
            Salário bruto mensal
          </label>
          <input
            id="bruto"
            type="number"
            min={0}
            step={50}
            value={bruto}
            onChange={(e) => setBruto(Number(e.target.value) || 0)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="kicker block mb-1.5" htmlFor="situacao">
            Situação
          </label>
          <select
            id="situacao"
            value={situacao}
            onChange={(e) => setSituacao(e.target.value as typeof situacao)}
            className={inputCls}
          >
            <option value="solteiro">Não casado(a)</option>
            <option value="casado2">Casado(a) — dois titulares</option>
            <option value="casado1">Casado(a) — único titular</option>
          </select>
        </div>

        {situacao === "casado2" && (
          <div>
            <label className="kicker block mb-1.5" htmlFor="conjuge">
              Bruto mensal do cônjuge
            </label>
            <input
              id="conjuge"
              type="number"
              min={0}
              step={50}
              value={conjuge}
              onChange={(e) => setConjuge(Number(e.target.value) || 0)}
              className={inputCls}
            />
          </div>
        )}

        <div>
          <label className="kicker block mb-1.5" htmlFor="dep">
            Dependentes
          </label>
          <input
            id="dep"
            type="number"
            min={0}
            max={10}
            value={dependentes}
            onChange={(e) => setDependentes(Math.max(0, Number(e.target.value) || 0))}
            className={inputCls}
          />
        </div>

        <p className="footnote">
          Estimativa anual com os escalões de {ano}, dedução específica e
          abatimento por mínimo de existência. Não é a retenção na fonte
          mensal (essa usa as tabelas da AT). Continente; Açores e Madeira
          têm tabelas próprias.
        </p>
      </div>

      {/* output — recibo editorial */}
      <div className="bg-surface border border-line">
        <div className="border-b border-line px-5 py-3 flex justify-between items-baseline">
          <span className="kicker">O teu ano em números</span>
          <span className="num text-xs text-muted">regras {ano}</span>
        </div>
        <dl className="px-5 py-4 text-sm">
          {linhas.map(([label, v]) => (
            <div key={label as string} className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">{label}</dt>
              <dd className={`num ${(v as number) < 0 ? "text-up" : ""}`}>
                {fmtEUR(Math.abs(v as number))}
                {(v as number) < 0 && " −"}
              </dd>
            </div>
          ))}
          <div className="flex justify-between py-2.5 mt-1 border-t-2 border-ink">
            <dt className="font-medium">Líquido anual</dt>
            <dd className="num font-medium text-lg">{fmtEUR(resultado.liquidoAnual)}</dd>
          </div>
          <div className="flex justify-between py-1 text-ink2">
            <dt>Líquido por mês (14 meses)</dt>
            <dd className="num">{fmtEUR(resultado.liquidoMensal14)}</dd>
          </div>
          <div className="flex justify-between py-1 text-ink2">
            <dt>Líquido por mês (12 meses, duodécimos)</dt>
            <dd className="num">{fmtEUR(resultado.liquidoMensal12)}</dd>
          </div>
        </dl>

        <div className="border-t border-line px-5 py-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="kicker">Taxa efetiva IRS</p>
            <p className="num text-xl mt-1">{fmtPct(resultado.taxaEfetiva)}</p>
          </div>
          <div>
            <p className="kicker">Taxa marginal</p>
            <p className="num text-xl mt-1">{fmtPct(resultado.taxaMarginal)}</p>
          </div>
          <div>
            <p className="kicker">Custo para a empresa</p>
            <p className="num text-xl mt-1">{fmtEUR0(resultado.custoEmpresaAnual)}/ano</p>
          </div>
          <div>
            <p className="kicker">Para o Estado, no total</p>
            <p className="num text-xl mt-1 text-up">{fmtPct(resultado.pesoEstado)}</p>
          </div>
        </div>
        <p className="footnote px-5 pb-4">
          &ldquo;Para o Estado&rdquo; soma IRS, a tua SS (11 %) e a TSU da
          empresa (23,75 %) sobre o custo total. É a fatia que nunca chega ao
          teu bolso.
        </p>
      </div>
    </div>
  );
}
