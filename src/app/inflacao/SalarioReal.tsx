"use client";

import { useMemo, useState } from "react";
import { salarioReal, type PontoSerie } from "@/lib/engines/deflator";
import { fmtEUR, fmtPct } from "@/lib/format";

const MAX_SALARIO_REAL = 100_000;

function parseSalario(s: string): number {
  const limpo = s.trim().replace(/\s+/g, "").replace(",", ".");
  if (limpo === "") return 0;
  const n = Number(limpo);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_SALARIO_REAL, Math.max(0, n));
}

function CampoSalario({
  id,
  label,
  valor,
  onChange,
}: {
  id: string;
  label: string;
  valor: number;
  onChange: (v: number) => void;
}) {
  const [texto, setTexto] = useState(() => String(valor).replace(".", ","));

  return (
    <div>
      <label className="kicker block mb-1.5" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={(e) => {
          const cru = e.target.value;
          if (cru !== "" && !/^\d*(?:[.,]\d*)?$/.test(cru.trim().replace(/\s+/g, ""))) {
            return;
          }
          setTexto(cru);
          onChange(parseSalario(cru));
        }}
        onBlur={() => {
          const final = parseSalario(texto);
          onChange(final);
          setTexto(String(final).replace(".", ","));
        }}
        className="field"
      />
    </div>
  );
}

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
    if (salarioAntigo <= 0) return null;
    // último mês disponível desse ano
    const ponto = [...serie].reverse().find((p) => p.t.startsWith(anoInicio));
    if (!ponto) return null;
    const calc = salarioReal(salarioAntigo, salarioHoje, ponto.t, serie);
    if (!calc) return null;
    return { mes: ponto.t, ...calc };
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
          <CampoSalario id="sr-ant" label="ganhavas, brutos" valor={salarioAntigo} onChange={setSalarioAntigo} />
          <CampoSalario id="sr-hoje" label="hoje ganhas" valor={salarioHoje} onChange={setSalarioHoje} />
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
          /* PROPOSTA (revisão do dono) */
          <p className="px-5 py-6 footnote">
            {salarioAntigo <= 0
              ? "— indica um salário inicial superior a 0 €."
              : "— escolhe um ano com dados."}
          </p>
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
