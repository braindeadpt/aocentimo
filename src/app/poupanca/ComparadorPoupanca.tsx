"use client";

import { useMemo, useState } from "react";
import {
  trajetoriaDeposito,
  trajetoriaCA,
  trajetoriaCTPC,
  trajetoriaColchao,
} from "@/lib/engines/poupanca";
import { Regua } from "@/components/Regua";
import { fmtEUR0, fmtNum, fmtPct } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import { PRAZO_CA, usePoupanca } from "./PoupancaSim";

/**
 * O comparador como divergência: quatro produtos partem do mesmo
 * capital e afastam-se — a abertura vê-se acontecer no tempo
 * (revelação esq→dir = os anos a passar). Cheio = nominal (o número na
 * conta); tracejado da mesma cor = o que esse dinheiro realmente vale
 * hoje — distinção visual sem ler texto. A tabela por baixo é o
 * equivalente textual (valores finais).
 *
 * O estado vem do <PoupancaProvider> — o mesmo capital, prazo e
 * inflação que a resposta do nível 1 e a caderneta leem. Os parâmetros
 * fiscais e as taxas oficiais entram por props (data/fiscal fica no
 * servidor).
 *
 * Os produtos acabam onde acabam: CA aos 15 anos, CTPC aos 7 — a linha
 * para aí, não se inventa trajectória.
 */

const W = 320;
const H = 150;

const SERIES = [
  { id: "ca", nome: "Certificados de Aforro", cor: "var(--color-ink)" },
  { id: "ctpc", nome: "Certificados do Tesouro", cor: "var(--seq-2)" },
  { id: "dep", nome: "Depósito a prazo", cor: "var(--seq-4)" },
  { id: "colchao", nome: "Debaixo do colchão", cor: "var(--color-muted)" },
] as const;

export function ComparadorPoupanca({
  taxaCA,
  premiosCA,
  taxasCtpc,
  premioCtpc,
  inflacaoReal,
}: {
  /** taxa bruta CA Série F (ca.json) */
  taxaCA: number;
  premiosCA: { de: number; ate: number; pp: number }[];
  taxasCtpc: number[];
  premioCtpc: number;
  /** inflação homóloga real do IHPC, em % — marcador «agora» da régua */
  inflacaoReal: number | null;
}) {
  const {
    capital,
    anos,
    taxaDeposito,
    inflacao,
    taxaImposto,
    dep,
    caf,
    ctpc,
    setCapital,
    setAnos,
    setTaxaDeposito,
    setInflacao,
  } = usePoupanca();
  const [anoLido, setAnoLido] = useState<number | null>(null);

  const anosCA = Math.min(anos, PRAZO_CA);

  // as quatro trajectórias — nominal líquido e real, por ano
  const traj = useMemo(
    () => ({
      ca: trajetoriaCA(capital, anosCA, taxaCA, premiosCA, taxaImposto, inflacao / 100),
      ctpc: trajetoriaCTPC(capital, anos, taxasCtpc, premioCtpc, taxaImposto, inflacao / 100),
      dep: trajetoriaDeposito(capital, anos, taxaDeposito / 100, taxaImposto, inflacao / 100),
      colchao: trajetoriaColchao(capital, anos, inflacao / 100),
    }),
    [capital, anos, anosCA, taxaCA, premiosCA, taxasCtpc, premioCtpc, taxaImposto, inflacao, taxaDeposito]
  );

  // CTPC tem prazo de 7 anos, CA 15 — a linha para onde o produto
  // acaba (ponto repetido até ao fim seria inventar trajectória)
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
      nome: `Certificados de Aforro F (${fmtPct(taxaCA, 2)} brutos)${anos > PRAZO_CA ? " (15 anos, na data)" : ""}`,
      final: caf.capitalFinalLiquido,
      real: caf.valorReal,
      taxa: caf.taxaLiquida,
    },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        {/* todo o input numérico é régua (catálogo V4 §5) */}
        <Regua
          id="cap"
          rotulo="Capital inicial"
          valor={capital}
          onChange={setCapital}
          min={100}
          max={100000}
          passo={100}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />
        <Regua
          id="anos"
          rotulo="Prazo"
          valor={anos}
          onChange={(v) => setAnos(Math.round(v))}
          min={1}
          max={30}
          passo={1}
          unidade="anos"
          formato={(v) => fmtNum(v, 0)}
          descricao="CA matura aos 15 anos e o CTPC aos 7 — para lá disso a linha acaba."
        />
        <Regua
          id="tdep"
          rotulo="Depósito a prazo (TANB)"
          valor={taxaDeposito}
          onChange={setTaxaDeposito}
          min={0}
          max={5}
          passo={0.05}
          unidade="%"
          formato={(v) => fmtNum(v, 2)}
        />
        <Regua
          id="infl"
          rotulo="Inflação"
          valor={inflacao}
          onChange={setInflacao}
          min={-1}
          max={10}
          passo={0.1}
          unidade="%"
          formato={(v) => fmtNum(v, 1)}
          marcadorAgora={
            inflacaoReal !== null
              ? { valor: inflacaoReal, rotulo: "agora" }
              : undefined
          }
        />
        <p className="footnote">
          Juros tributados a {fmtPct(taxaImposto, 0)} (retenção liberatória).
          CA Série F: taxa base = média da Euribor 3M, limitada a 2,50 %,
          capitalização trimestral e prémios de permanência incluídos. CTPC:
          taxa crescente de 0,75 % a 2,25 % + prémio PIB atual de{" "}
          {fmtPct(premioCtpc, 2)}, prazo máximo de 7 anos — simulado
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
