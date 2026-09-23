"use client";

import { Fragment, useMemo, useState } from "react";
import { simularDesemprego } from "@/lib/engines/desemprego";
import { REGRAS_IRS } from "@/lib/engines/irs";
import { NumHero } from "@/components/NumHero";
import { fmtEUR } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import { mascaraFaixaRasgo, sementeDe } from "@/lib/materia";

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
  const temCorte = r.duracaoDias > 180;

  // a declaração reimprime-se a cada mudança — as linhas novas entram
  // por ordem, como na impressora; a linha do tempo sobe mês a mês
  const declKey = `${bruto}-${idade}-${anosDescontos}-${majoracao}`;
  const { ref: declRef, arm: declArm } = useArmado<HTMLDivElement>(declKey);
  let linha = -1;
  const prox = () => ++linha;

  const arestaTopo = mascaraFaixaRasgo(320, { semente: sementeDe(20260214), ponta: "topo", grosseria: 0.4 });
  const arestaFundo = mascaraFaixaRasgo(320, { semente: sementeDe(20260221), ponta: "fundo", grosseria: 0.4 });

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="bruto-d">Salário bruto mensal (antes do desemprego)</label>
          <input id="bruto-d" type="number" min={0} step={50} value={bruto}
            onChange={(e) => setBruto(Number(e.target.value) || 0)} className="field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="idade">A tua idade</label>
            <input id="idade" type="number" min={16} max={66} value={idade}
              onChange={(e) => setIdade(Number(e.target.value) || 16)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="desc">Anos de descontos</label>
            <input id="desc" type="number" min={0} max={40} value={anosDescontos}
              onChange={(e) => setAnosDescontos(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-corpo-sm text-ink2">
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

      {/* a declaração — o artefacto da Segurança Social: o que descontaste
          devolve-se linha a linha, e a duração vê-se a escoar em meses
          (M-18) */}
      <div className="self-start md:sticky md:top-6" aria-live="polite">
        <div className="talao-wrap w-full max-w-96 justify-self-center" ref={declRef}>
          <div
            className="talao-aresta talao-aresta-t"
            style={{ maskImage: arestaTopo, WebkitMaskImage: arestaTopo }}
            aria-hidden
          />
          <div className="talao talao-mat">
            <span className="carimbo">simulação</span>
            <div className="talao-face px-6 pb-5 pt-7">
              <p className="talao-head text-center">Declaração de desemprego</p>
              <p className="talao-sub talao-dim mt-1 text-center">
                * * * segurança social · simulado * * *
              </p>
              {r.elegivel ? (
                <>
                  <dl className="talao-body mt-4">
                    <Fragment key={declKey}>
                      <div
                        className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                        style={{ "--linha": prox() } as React.CSSProperties}
                      >
                        <dt className="talao-dim">REMUNERAÇÃO DE REFERÊNCIA</dt>
                        <dd>{fmtEUR(r.remReferencia)}</dd>
                      </div>
                      <div
                        className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                        style={{ "--linha": prox() } as React.CSSProperties}
                      >
                        <dt className="talao-dim">… LÍQUIDA (SS + RETENÇÃO)</dt>
                        <dd>{fmtEUR(r.remReferenciaLiquida)}</dd>
                      </div>
                      <div
                        className={declArm("talao-linha") + " talao-cut mt-1 py-2.5"}
                        style={{ "--linha": prox() } as React.CSSProperties}
                      >
                        <dt className="talao-total">Mensalidade · 65 %</dt>
                        <dd className="mt-1">
                          <NumHero valor={fmtEUR(r.mensal)} sufixo="/mês" compacto animar={r.mensal} />
                        </dd>
                      </div>
                      {temCorte && (
                        <div
                          className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                          style={{ "--linha": prox() } as React.CSSProperties}
                        >
                          <dt className="talao-dim">DO 7.º MÊS EM DIANTE</dt>
                          <dd>
                            {fmtEUR(r.apos180Dias)}
                            <span className={"talao-retido " + declArm("talao-carimbo-anim")} aria-hidden>
                              −10 %
                            </span>
                          </dd>
                        </div>
                      )}
                      <div
                        className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                        style={{ "--linha": prox() } as React.CSSProperties}
                      >
                        <dt className="talao-dim">DURAÇÃO</dt>
                        <dd>
                          {r.duracaoDias} dias <span className="talao-dim">(~{meses} meses)</span>
                        </dd>
                      </div>
                    </Fragment>
                  </dl>

                  {/* a linha do tempo: cada mês um pilar de tinta; a descida
                      ao 7.º mês acontece na própria linha — altura e tinta
                      baixam juntas */}
                  <div
                    className="mt-5"
                    role="img"
                    aria-label={
                      temCorte
                        ? `${meses} meses de subsídio: ${fmtEUR(r.mensal)} por mês até ao 6.º mês, ${fmtEUR(r.apos180Dias)} do 7.º mês até ao fim`
                        : `${meses} meses de subsídio a ${fmtEUR(r.mensal)} por mês`
                    }
                  >
                    <div className="decl-tempo" aria-hidden>
                      {Array.from({ length: meses }, (_, i) => (
                        <span
                          key={`${declKey}-m${i}`}
                          className={`decl-mes ${i >= 6 ? "decl-mes-cut" : ""} ${declArm("decl-mes-anim")}`}
                          style={{
                            "--linha": i,
                            height: `${r.mensal > 0 ? ((i < 6 ? r.mensal : r.apos180Dias) / r.mensal) * 100 : 100}%`,
                          } as React.CSSProperties}
                        />
                      ))}
                    </div>
                    <div className="mt-1.5 flex justify-between text-talao-sub uppercase tracking-wider talao-dim">
                      <span>1.º mês</span>
                      {temCorte && <span>7.º −10 %</span>}
                      <span>{meses}.º</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="py-6 text-talao-corpo talao-dim">{r.nota}</p>
              )}
              <p className="talao-sub talao-dim mt-4 text-center">
                * * * * *
              </p>
            </div>
          </div>
          <div
            className="talao-aresta talao-aresta-b"
            style={{ maskImage: arestaFundo, WebkitMaskImage: arestaFundo }}
            aria-hidden
          />
        </div>
        {r.elegivel && (
          <p className="footnote mt-4 px-1">
            Limites: entre {fmtEUR(REGRAS_IRS[2026].ias)} e{" "}
            {fmtEUR(REGRAS_IRS[2026].ias * 2.5)} (1–2,5×IAS), e
            nunca acima de 75 % da remuneração líquida de referência. Pedido
            no IEFP até 90 dias após o fim do contrato.
          </p>
        )}
      </div>
    </div>
  );
}
