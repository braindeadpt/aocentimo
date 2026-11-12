"use client";

import { useMemo, useState } from "react";
import {
  trajetoriaDeposito,
  trajetoriaCA,
  trajetoriaCT,
  trajetoriaColchao,
  trajetoriaComReforco,
  resgateAntecipadoCT,
} from "@/lib/engines/poupanca";
import { Regua } from "@/components/Regua";
import { fmtEUR0, fmtNum, fmtPct } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import { PRAZO_CA, PRAZO_CT, usePoupanca } from "./PoupancaSim";

/**
 * O comparador como divergência: quatro produtos partem do mesmo
 * capital e afastam-se — a abertura vê-se acontecer no tempo
 * (revelação esq→dir = os anos a passar). Cheio = nominal (o número na
 * conta); tracejado da mesma cor = o que esse dinheiro realmente vale
 * hoje — distinção visual sem ler texto. A tabela por baixo é o
 * equivalente textual (valores finais).
 *
 * O estado vem do <PoupancaProvider> — o mesmo capital, reforço mensal,
 * prazo e inflação que a resposta do nível 1 e a caderneta leem. Os
 * parâmetros fiscais e as taxas oficiais entram por props (data/fiscal
 * fica no servidor).
 *
 * Os produtos acabam onde acabam: CA aos 15 anos, CT Série 5 aos 10 —
 * a linha para aí, não se inventa trajectória.
 */

const W = 320;
const H = 150;

const SERIES = [
  /* PROPOSTA (revisão do dono) */
  { id: "ca", nome: "Certificados de Aforro (Série F)", cor: "var(--color-ink)" },
  { id: "ct", nome: "Certificados do Tesouro (Série 5)", cor: "var(--seq-2)" },
  { id: "dep", nome: "Depósito a prazo", cor: "var(--seq-4)" },
  { id: "colchao", nome: "Debaixo do colchão", cor: "var(--color-muted)" },
] as const;

export function ComparadorPoupanca({
  taxaCA,
  premiosCA,
  taxasCT,
  taxaBpstat,
  inflacaoReal,
}: {
  /** taxa bruta CA Série F (ca.json) */
  taxaCA: number;
  premiosCA: { de: number; ate: number; pp: number }[];
  /** taxas por ano de vida dos CT Série 5 (ct.json) */
  taxasCT: number[];
  /** última TANB média mensal dos novos depósitos até 1 ano (BPstat), em % */
  taxaBpstat: number | null;
  /** inflação homóloga real do IHPC, em % — marcador «agora» da régua */
  inflacaoReal: number | null;
}) {
  const {
    capital,
    reforcoMensal,
    anos,
    taxaDeposito,
    inflacao,
    taxaImposto,
    maximoEurosCA,
    minimoSubscricaoCA,
    minimoSubscricaoCT,
    maximoEurosCT,
    excedenteCA,
    dep,
    caf,
    ct,
    setCapital,
    setReforcoMensal,
    setAnos,
    setTaxaDeposito,
    setInflacao,
  } = usePoupanca();
  const [anoLido, setAnoLido] = useState<number | null>(null);
  const [anoResgateCT, setAnoResgateCT] = useState(3.5);

  const anosCA = Math.min(anos, PRAZO_CA);
  const anosCT = Math.min(anos, Math.min(PRAZO_CT, taxasCT.length));

  // as quatro trajectórias — nominal líquido e real, por ano
  const traj = useMemo(() => {
    const infl = inflacao / 100;
    if (reforcoMensal === 0 && excedenteCA === 0 && capital >= minimoSubscricaoCT) {
      return {
        ca: trajetoriaCA(capital, anosCA, taxaCA, premiosCA, taxaImposto, infl),
        ct: trajetoriaCT(capital, taxasCT.slice(0, anosCT), taxaImposto, infl),
        dep: trajetoriaDeposito(capital, anos, taxaDeposito / 100, taxaImposto, infl),
        colchao: trajetoriaColchao(capital, anos, infl),
      };
    }
    return {
      ca: trajetoriaComReforco({
        produto: "ca",
        capitalInicial: capital,
        reforcoMensal,
        anos: anosCA,
        taxaImposto,
        inflacaoAnual: infl,
        taxaCA,
        premiosCA,
        minimoSubscricaoCA,
        maximoEurosCA,
      }),
      ct: trajetoriaComReforco({
        produto: "ct",
        capitalInicial: capital,
        reforcoMensal,
        anos: anosCT,
        taxaImposto,
        inflacaoAnual: infl,
        taxasCT,
        minimoSubscricaoCT,
        maximoEurosCT,
      }),
      dep: trajetoriaComReforco({
        produto: "dep",
        capitalInicial: capital,
        reforcoMensal,
        anos,
        taxaImposto,
        inflacaoAnual: infl,
        taxaDeposito: taxaDeposito / 100,
      }),
      colchao: trajetoriaComReforco({
        produto: "colchao",
        capitalInicial: capital,
        reforcoMensal,
        anos,
        taxaImposto,
        inflacaoAnual: infl,
      }),
    };
  }, [
    capital,
    reforcoMensal,
    excedenteCA,
    anos,
    anosCA,
    anosCT,
    taxaCA,
    premiosCA,
    minimoSubscricaoCA,
    maximoEurosCA,
    taxasCT,
    minimoSubscricaoCT,
    maximoEurosCT,
    taxaImposto,
    inflacao,
    taxaDeposito,
  ]);

  // CT Série 5 tem prazo de 10 anos, CA 15 — a linha para onde o produto
  // acaba (ponto repetido até ao fim seria inventar trajectória)
  const maxY = Math.max(
    capital,
    ...SERIES.flatMap((s) => traj[s.id].map((p) => p.saldo))
  );
  const xAno = (ano: number) => (anos > 0 ? (ano / anos) * W : 0);
  const yV = (v: number) => (maxY > 0 ? H - (v / maxY) * (H - 8) : H);
  const path = (campo: "saldo" | "real") =>
    SERIES.map((s) => {
      const pts = [
        { ano: 0, v: capital },
        ...traj[s.id].map((p) => ({ ano: p.ano, v: p[campo] })),
      ];
      return {
        id: s.id,
        d: pts
          .map((p, i) => `${i === 0 ? "M" : "L"}${xAno(p.ano)},${yV(p.v)}`)
          .join(" "),
      };
    });

  const runDiv = `${capital}-${reforcoMensal}-${anos}-${taxaDeposito}-${inflacao}`;
  const { ref: divRef, arm: divArm } = useArmado<SVGSVGElement>(runDiv);
  const lido = anoLido !== null && anoLido <= anos ? anoLido : null;

  const totalColchao = capital + reforcoMensal * 12 * anos;
  const realColchaoFinal =
    traj.colchao.at(-1)?.real ??
    totalColchao / Math.pow(1 + inflacao / 100, anos);

  const capBaseResgateCT =
    capital >= minimoSubscricaoCT ? Math.min(capital, maximoEurosCT) : 10000;
  const resgateCT = useMemo(
    () =>
      resgateAntecipadoCT(
        capBaseResgateCT,
        anoResgateCT,
        taxasCT,
        taxaImposto
      ),
    [capBaseResgateCT, anoResgateCT, taxasCT, taxaImposto]
  );

  const atingiuTectoCA =
    capital > maximoEurosCA || caf.totalEntregas > maximoEurosCA;

  const linhas = [
    {
      nome: "Debaixo do colchão",
      investido: totalColchao,
      final: totalColchao,
      real: realColchaoFinal,
      taxa: 0,
    },
    {
      nome: `Depósito a prazo (${fmtPct(taxaDeposito / 100)})`,
      investido: dep.totalEntregas,
      final: dep.capitalFinalLiquido,
      real: dep.valorReal,
      taxa: dep.taxaLiquida,
    },
    {
      /* PROPOSTA (revisão do dono) */
      nome: `Certificados do Tesouro Série 5 (sem capitalização)${
        anos > PRAZO_CT ? ` (${PRAZO_CT} anos, na data)` : ""
      }`,
      investido: ct.totalEntregas,
      final: ct.capitalFinalLiquido,
      real: ct.valorReal,
      taxa: ct.taxaLiquida,
    },
    {
      /* PROPOSTA (revisão do dono) */
      nome: `Certificados de Aforro Série F (${fmtPct(taxaCA, 2)} brutos)${
        anos > PRAZO_CA ? ` (${PRAZO_CA} anos, na data)` : ""
      }`,
      investido: caf.totalEntregas,
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
          presets={[
            { rotulo: fmtEUR0(1000), valor: 1000 },
            { rotulo: fmtEUR0(10000), valor: 10000 },
            { rotulo: fmtEUR0(50000), valor: 50000 },
          ]}
          /* PROPOSTA (revisão do dono) */
          descricao={
            atingiuTectoCA
              ? `Série F limitada por lei a ${fmtEUR0(maximoEurosCA)} por titular (Portaria 149-A/2023) — na linha de CA apenas ${fmtEUR0(caf.capitalSubscritoProduto)} vencem juros; o excedente fica à ordem.`
              : capital < minimoSubscricaoCT
                ? `CT Série 5 exige subscrição mínima de ${fmtEUR0(minimoSubscricaoCT)} (${fmtNum(minimoSubscricaoCT, 0)} unidades).`
                : undefined
          }
        />
        <Regua
          id="reforco"
          /* PROPOSTA (revisão do dono) */
          rotulo="Reforço mensal"
          valor={reforcoMensal}
          onChange={setReforcoMensal}
          min={0}
          max={1000}
          passo={50}
          unidade="€/mês"
          formato={(v) => fmtNum(v, 0)}
          presets={[
            { rotulo: fmtEUR0(0), valor: 0 },
            { rotulo: fmtEUR0(100), valor: 100 },
            { rotulo: fmtEUR0(250), valor: 250 },
            { rotulo: fmtEUR0(1000), valor: 1000 },
          ]}
          /* PROPOSTA (revisão do dono) */
          descricao={
            reforcoMensal > 0 && reforcoMensal < minimoSubscricaoCT
              ? `Cada subscrição de CT Série 5 exige no mínimo ${fmtEUR0(minimoSubscricaoCT)}: reforços de ${fmtEUR0(reforcoMensal)}/mês entram no depósito${reforcoMensal >= minimoSubscricaoCA ? " e nos CA" : ""}, mas ficam à ordem nos CT.`
              : "Para quem constrói fundo de emergência mês a mês (mínimo por subscrição: 100\u202f€ em CA, 1\u202f000\u202f€ em CT Série 5)."
          }
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
          /* PROPOSTA (revisão do dono) */
          descricao="CA Série F matura aos 15 anos e CT Série 5 aos 10 — para lá disso a linha acaba."
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
          marcadorAgora={
            taxaBpstat !== null
              ? { valor: taxaBpstat, rotulo: "média BPstat" }
              : undefined
          }
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
        {/* PROPOSTA (revisão do dono) */}
        <p className="footnote">
          Juros tributados a {fmtPct(taxaImposto, 0)} (retenção liberatória).
          CA Série F: taxa base = média da Euribor 3M limitada a 2,50 %,
          capitalização trimestral, prémios de permanência e tecto legal de{" "}
          {fmtEUR0(maximoEurosCA)} por titular. CT Série 5 (RCM 141-A/2026):
          10 anos, taxa fixa de {fmtPct(taxasCT[0] ?? 0.0235, 2)} no 1.º ano
          a {fmtPct(taxasCT[taxasCT.length - 1] ?? 0.0335, 2)} no 10.º,{" "}
          <strong>sem capitalização</strong> — os juros caem no IBAN todos os
          anos e não rendem juro sobre juro.
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
                    const rotuloCurto =
                      s.id === "ca"
                        ? "CA"
                        : s.id === "ct"
                          ? "CT"
                          : s.nome.split(" ")[0];
                    return p
                      ? `${rotuloCurto} ${fmtEUR0(p.saldo)}`
                      : `${rotuloCurto} —`;
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
                      return p
                        ? `${s.nome} ${fmtEUR0(p.saldo)}`
                        : `${s.nome} terminado`;
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
            aria-label={`Divergência de quatro produtos de poupança ao longo de ${anos} anos: no fim, CA ${fmtEUR0(caf.capitalFinalLiquido)}, CT Série 5 ${fmtEUR0(ct.capitalFinalLiquido)}, depósito ${fmtEUR0(dep.capitalFinalLiquido)}, colchão ${fmtEUR0(totalColchao)}.`}
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
              <svg width="18" height="6" aria-hidden>
                <line
                  x1="0"
                  x2="18"
                  y1="3"
                  y2="3"
                  stroke="var(--color-muted)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
              </svg>
              = vale hoje
            </span>
          </div>
        </div>

        <table
          className="w-full text-corpo-sm bg-raised border border-line shadow-raised mt-4"
          aria-live="polite"
        >
          <thead>
            <tr className="text-left border-b-2 border-ink">
              <th scope="col" className="px-4 py-2 font-medium">
                Onde está o dinheiro
              </th>
              <th scope="col" className="px-4 py-2 font-medium text-right">
                Em {anos} anos
              </th>
              <th scope="col" className="px-4 py-2 font-medium text-right">
                Vale hoje
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.nome} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-ink2">{l.nome}</td>
                <td className="px-4 py-3 text-right num">{fmtEUR0(l.final)}</td>
                <td className="px-4 py-3 text-right num">
                  {fmtEUR0(l.real)}
                  {l.real < l.investido && (
                    <span className="block text-rotulo text-up">
                      perde poder de compra
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="footnote mt-3">
          «Vale hoje» = o capital futuro deflacionado pela inflação indicada —
          o poder de compra real, não o número na conta.
        </p>

        {/* PROPOSTA (revisão do dono): interactivo de resgate antecipado CT Série 5 */}
        <div className="mt-4 bg-raised border border-line shadow-raised px-4 py-3 space-y-2">
          <p className="kicker">
            Armadilha do resgate antecipado · CT Série 5
          </p>
          <p className="text-corpo-sm text-ink2">
            Nos Certificados do Tesouro Série 5 os juros vencem uma vez por
            ano. Se resgatares{" "}
            <strong>{fmtNum(anoResgateCT, 1)} anos</strong> após subscrever{" "}
            {fmtEUR0(capBaseResgateCT)}, recebes{" "}
            <strong className="num">{fmtEUR0(resgateCT.valorRecebido)}</strong>{" "}
            (capital + anos completos já vencidos) e{" "}
            {resgateCT.jurosPerdidos > 0 ? (
              <>
                <strong className="text-up num">
                  perdes {fmtEUR0(resgateCT.jurosPerdidos)}
                </strong>{" "}
                de juros líquidos do ano em curso — nos CA Série F os juros
                vencem de 3 em 3 meses.
              </>
            ) : (
              <>
                não perdes juros corridos por ser a data exacta do aniversário
                anual.
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[1.5, 3.5, 4, 7.5].map((a) => {
              const ativo = Math.abs(anoResgateCT - a) < 0.01;
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setAnoResgateCT(a)}
                  className={`chip${ativo ? " chip-ativo" : ""}`}
                >
                  {fmtNum(a, a % 1 === 0 ? 0 : 1)} anos
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

