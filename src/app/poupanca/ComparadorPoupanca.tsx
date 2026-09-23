"use client";

import { useMemo, useState } from "react";
import {
  simularPoupanca,
  simularCA,
  simularCTPC,
  trajetoriaDeposito,
  trajetoriaCA,
  trajetoriaCTPC,
  trajetoriaColchao,
} from "@/lib/engines/poupanca";
import { fmtEUR0, fmtPct } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import ca from "@data/fiscal/ca.json";
import capitais from "@data/fiscal/capitais.json";

/**
 * O comparador como divergência: quatro produtos partem do mesmo
 * capital e afastam-se — a abertura vê-se acontecer no tempo
 * (revelação esq→dir = os anos a passar, como no mapa de /casa).
 * Cheio = nominal (o número na conta); tracejado da mesma cor = o que
 * esse dinheiro realmente vale hoje — distinção visual sem ler texto.
 * A tabela por baixo é o equivalente textual (valores finais).
 */

const W = 320;
const H = 150;

const SERIES = [
  { id: "ca", nome: "Certificados de Aforro", cor: "var(--color-ink)" },
  { id: "ctpc", nome: "Certificados do Tesouro", cor: "var(--seq-2)" },
  { id: "dep", nome: "Depósito a prazo", cor: "var(--seq-4)" },
  { id: "colchao", nome: "Debaixo do colchão", cor: "var(--color-muted)" },
] as const;

export function ComparadorPoupanca() {
  const [capital, setCapital] = useState(10000);
  const [anos, setAnos] = useState(10);
  const [taxaDeposito, setTaxaDeposito] = useState(1.5);
  const [inflacao, setInflacao] = useState(2.0);
  const [anoLido, setAnoLido] = useState<number | null>(null);

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

  // as quatro trajectórias — nominal líquido e real, por ano
  const traj = useMemo(
    () => ({
      ca: trajetoriaCA(capital, anos, taxaCA, premios, taxaImposto, inflacao / 100),
      ctpc: trajetoriaCTPC(capital, anos, ca.ctpc.taxasPorAno, ca.ctpc.premio.atual, taxaImposto, inflacao / 100),
      dep: trajetoriaDeposito(capital, anos, taxaDeposito / 100, taxaImposto, inflacao / 100),
      colchao: trajetoriaColchao(capital, anos, inflacao / 100),
    }),
    [capital, anos, taxaCA, premios, taxaImposto, inflacao, taxaDeposito]
  );

  // CTPC tem prazo de 7 anos — a linha para aí (ponto repetido até ao fim
  // seria inventar trajectória: a série acaba onde o produto acaba)
  const maxY = Math.max(
    capital,
    ...SERIES.flatMap((s) => traj[s.id].map((p) => p.saldo))
  );
  const xAno = (ano: number) => (anos > 0 ? (ano / anos) * W : 0);
  const yV = (v: number) => (maxY > 0 ? H - (v / maxY) * (H - 8) : H);
  const path = (campo: "saldo" | "real") =>
    SERIES.map((s) => {
      const pts = [{ ano: 0, v: capital }, ...traj[s.id].map((p) => ({ ano: p.ano, v: p[campo] }))];
      return {
        id: s.id,
        d: pts.map((p, i) => `${i === 0 ? "M" : "L"}${xAno(p.ano)},${yV(p.v)}`).join(" "),
      };
    });

  const runDiv = `${capital}-${anos}-${taxaDeposito}-${inflacao}`;
  const { ref: divRef, arm: divArm } = useArmado<SVGSVGElement>(runDiv);
  const lido = anoLido !== null && anoLido <= anos ? anoLido : null;

  const linhas = [
    {
      nome: "Debaixo do colchão",
      final: capital,
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
            onChange={(e) => setCapital(Number(e.target.value) || 0)} className="field" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="anos">Anos</label>
            <input id="anos" type="number" min={1} max={30} value={anos}
              onChange={(e) => setAnos(Number(e.target.value) || 1)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="tdep">Depósito (%)</label>
            <input id="tdep" type="number" step={0.1} min={0} value={taxaDeposito}
              onChange={(e) => setTaxaDeposito(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="infl">Inflação (%)</label>
            <input id="infl" type="number" step={0.1} value={inflacao}
              onChange={(e) => setInflacao(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <p className="footnote">
          Juros tributados a {fmtPct(taxaImposto, 0)} (retenção liberatória).
          CA Série F: taxa base = média da Euribor 3M, limitada a 2,50 %,
          capitalização trimestral e prémios de permanência incluídos. CTPC:
          taxa crescente de 0,75 % a 2,25 % + prémio PIB atual de{" "}
          {fmtPct(ca.ctpc.premio.atual, 2)}, prazo máximo de 7 anos — simulado
          a taxas constantes, sem prever o PIB futuro.
        </p>
      </div>

      <div>
        {/* a divergência — os quatro partem juntos e afastam-se */}
        <div className="bg-raised border border-line shadow-raised px-4 pt-3 pb-4">
          <div className="chart-readout" aria-live="polite">
            {lido !== null ? (
              <>
                <span className="chart-readout-t">Ano {lido}</span>
                <span className="chart-readout-v">
                  {SERIES.map((s) => {
                    const p = traj[s.id].find((q) => q.ano === lido);
                    return p ? `${s.nome.split(" ")[0]} ${fmtEUR0(p.saldo)}` : `${s.nome.split(" ")[0]} —`;
                  }).join(" · ")}
                </span>
              </>
            ) : (
              <span className="chart-readout-t">
                Quatro destinos para o mesmo dinheiro — cheio = nominal, tracejado = vale hoje
              </span>
            )}
            <input
              type="range"
              className="chart-scrub"
              min={1}
              max={anos}
              value={lido ?? anos}
              aria-label="Percorrer os anos da poupança"
              aria-valuetext={
                lido !== null
                  ? `Ano ${lido}: ${SERIES.map((s) => {
                      const p = traj[s.id].find((q) => q.ano === lido);
                      return p ? `${s.nome} ${fmtEUR0(p.saldo)}` : `${s.nome} terminado`;
                    }).join(", ")}`
                  : undefined
              }
              onChange={(e) => setAnoLido(Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Escape") setAnoLido(null);
              }}
              onBlur={() => setAnoLido(null)}
            />
          </div>
          <svg
            ref={divRef}
            viewBox={`0 0 ${W} ${H}`}
            className="mt-2 h-40 w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Divergência de quatro produtos de poupança ao longo de ${anos} anos: no fim, CA ${fmtEUR0(caf.capitalFinalLiquido)}, depósito ${fmtEUR0(dep.capitalFinalLiquido)}, colchão ${fmtEUR0(capital)}.`}
          >
            <g className={divArm("tempo-revela")} key={runDiv}>
              {/* real — tracejado da mesma cor, sempre por baixo */}
              {path("real").map((p) => {
                const s = SERIES.find((q) => q.id === p.id)!;
                return (
                  <path
                    key={`r-${p.id}`}
                    d={p.d}
                    fill="none"
                    stroke={s.cor}
                    strokeWidth={1.1}
                    strokeDasharray="3 3"
                    opacity={0.55}
                  />
                );
              })}
              {/* nominal — cheio */}
              {path("saldo").map((p) => {
                const s = SERIES.find((q) => q.id === p.id)!;
                return (
                  <path
                    key={`n-${p.id}`}
                    d={p.d}
                    fill="none"
                    stroke={s.cor}
                    strokeWidth={s.id === "ca" ? 2 : 1.4}
                  />
                );
              })}
            </g>
            {lido !== null && (
              <line
                x1={xAno(lido)}
                x2={xAno(lido)}
                y1={0}
                y2={H}
                stroke="var(--color-ink)"
                strokeWidth={1}
              />
            )}
          </svg>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-rotulo text-muted">
            {SERIES.map((s) => (
              <span key={s.id} className="flex items-center gap-1.5">
                <span className="sw" style={{ background: s.cor }} aria-hidden />
                {s.nome}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden><line x1="0" x2="18" y1="3" y2="3" stroke="var(--color-muted)" strokeWidth="1.5" strokeDasharray="3 3" /></svg>
              = vale hoje
            </span>
          </div>
        </div>

        <table className="w-full text-corpo-sm bg-raised border border-line shadow-raised mt-4" aria-live="polite">
          <thead>
            <tr className="text-left border-b-2 border-ink">
              <th scope="col" className="px-4 py-2 font-medium">Onde está o dinheiro</th>
              <th scope="col" className="px-4 py-2 font-medium text-right">Em {anos} anos</th>
              <th scope="col" className="px-4 py-2 font-medium text-right">Vale hoje</th>
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
                    <span className="block text-rotulo text-up">perde poder de compra</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footnote mt-3">
          «Vale hoje» = o capital futuro deflacionado pela inflação
          indicada — o poder de compra real, não o número na conta.
        </p>
      </div>
    </div>
  );
}
