"use client";

import { Fragment, useMemo, useState } from "react";
import { simularIrsAnual, limitePpr } from "@/lib/engines/irs-anual";
import { NumHero } from "@/components/NumHero";
import { fmtEUR, fmtEUR0 } from "@/lib/format";
import { mascaraFaixaRasgo, r1, sementeDe } from "@/lib/materia";
import { useArmado } from "@/lib/useArmado";
import { SITE_URL } from "@/lib/site";

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

  // a nota reimprime-se linha a linha a cada mudança — o dl fica
  // estável, o Fragment com key remonta só as linhas (M-13 fix)
  const notaKey = [bruto, dependentes, saude, educacao, rendas, lares,
    ivaFatura, pprEntregas, idade].map(r1).join("|");
  const { ref: notaRef, arm: notaArm } = useArmado<HTMLDivElement>(notaKey);
  // contador de linha para a impressão escalonada — repõe-se a cada
  // render (variável simples, não ref: os hooks lint proíbem refs no render)
  let linha = -1;
  const prox = () => ++linha;

  const arestaTopo = mascaraFaixaRasgo(320, { semente: sementeDe(20261103), ponta: "topo", grosseria: 0.4 });
  const arestaFundo = mascaraFaixaRasgo(320, { semente: sementeDe(20261110), ponta: "fundo", grosseria: 0.4 });

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Campo id="ac-bruto" label="Salário bruto mensal" valor={bruto} onChange={setBruto} />
          <Campo id="ac-dep" label="Dependentes" valor={dependentes} onChange={setDependentes} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Campo id="ac-saude" label="Despesas de saúde/ano" valor={saude} onChange={setSaude}
            nota="15 %, até 1 000 €" />
          <Campo id="ac-edu" label="Educação/ano" valor={educacao} onChange={setEducacao}
            nota="30 %, até 800 €" />
          <Campo id="ac-rendas" label="Rendas HPP/ano" valor={rendas} onChange={setRendas}
            nota="15 %, até 900 € em 2026" />
          <Campo id="ac-lares" label="Lares e apoio/ano" valor={lares} onChange={setLares}
            nota="25 %, até 403,75 €" />
          <Campo id="ac-iva" label="IVA das faturas (apurado)" valor={ivaFatura} onChange={setIvaFatura}
            nota="o valor que o e-Fatura já apurou, até 250 €" />
          <div className="grid grid-cols-2 gap-2">
            <Campo id="ac-ppr" label="Entregas PPR/ano" valor={pprEntregas} onChange={setPprEntregas}
              nota={`20 %, até ${fmtEUR0(limitePpr(idade))}`} />
            <Campo id="ac-idade" label="Idade" valor={idade} onChange={setIdade} />
          </div>
        </div>
        <p className="footnote">
          Um titular não casado; os valores são os totais anuais que vês no
          e-Fatura/Anexo H. Retenção estimada = recibo mensal × 14 meses.
        </p>
      </div>

      {/* a nota de liquidação — o documento que a AT emite em maio:
          coleta, deduções a descontar linha a linha, IRS devido,
          confronto com o que retiveste, e o veredito carimbado.
          Reimprime-se a cada mudança; pegajosa para acompanhar os
          inputs (M-16) */}
      <div className="self-start md:sticky md:top-6" aria-live="polite">
        <div className="talao-wrap w-full max-w-96 justify-self-center" ref={notaRef}>
          <div
            className="talao-aresta talao-aresta-t"
            style={{ maskImage: arestaTopo, WebkitMaskImage: arestaTopo }}
            aria-hidden
          />
          <div className="talao talao-mat">
            <span className="carimbo">simulação</span>
            <div className="talao-face px-6 pb-5 pt-7">
              <p className="talao-head text-center">Nota de liquidação</p>
              <p className="talao-sub talao-dim mt-1 text-center">
                * * * IRS {ano} · simulado * * *
              </p>
              <dl className="talao-body mt-4">
                <Fragment key={notaKey}>
                  <div
                    className={notaArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">COLETA ANTES DAS DEDUÇÕES</dt>
                    <dd>{fmtEUR(r.irsBruto)}</dd>
                  </div>
                  {r.linhasDeducao.filter((l) => l.deducao > 0).map((l) => (
                    <div
                      key={l.categoria}
                      className={notaArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                      style={{ "--linha": prox() } as React.CSSProperties}
                    >
                      <dt className="talao-dim">{l.categoria.toUpperCase()}</dt>
                      <dd>−{fmtEUR(l.deducao)}</dd>
                    </div>
                  ))}
                  {r.deducaoPpr > 0 && (
                    <div
                      className={notaArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                      style={{ "--linha": prox() } as React.CSSProperties}
                    >
                      <dt className="talao-dim">PPR · 20 % DAS ENTREGAS</dt>
                      <dd>−{fmtEUR(r.deducaoPpr)}</dd>
                    </div>
                  )}
                  <div
                    className={notaArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">DESPESAS GERAIS + DEPENDENTES</dt>
                    <dd>−{fmtEUR(r.deducoesColeta - r.dentroDoLimiteGlobal)}</dd>
                  </div>
                  <div
                    className={notaArm("talao-linha") + " talao-cut mt-1 flex items-baseline justify-between gap-4 py-2.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-total">IRS devido</dt>
                    <dd className="text-display-sm font-bold">{fmtEUR(r.irsAnual)}</dd>
                  </div>
                  <div
                    className={notaArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">RETIDO AO LONGO DO ANO</dt>
                    <dd>
                      {fmtEUR(r.retidoAno)}
                      <span className={"talao-retido " + notaArm("talao-carimbo-anim")} aria-hidden>
                        adiantado
                      </span>
                    </dd>
                  </div>
                </Fragment>
              </dl>

              {/* o veredito — a última linha da nota, carimbada */}
              <div className="talao-cut mt-2 py-3">
                <p className="talao-note talao-dim uppercase tracking-mono-lg">
                  {r.reembolsoEstimado >= 0 ? "Resultado · a receber" : "Resultado · a pagar"}
                </p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <NumHero
                    valor={fmtEUR(Math.abs(r.reembolsoEstimado))}
                    animar={Math.abs(r.reembolsoEstimado)}
                    sinal={r.reembolsoEstimado >= 0 ? "+" : "−"}
                    className="min-w-0 flex-1 text-display-sm"
                  />
                  <span
                    className={
                      (r.reembolsoEstimado >= 0 ? "talao-recebe " : "talao-retido ") +
                      "shrink-0 " +
                      notaArm("talao-carimbo-anim")
                    }
                    aria-hidden
                  >
                    {r.reembolsoEstimado >= 0 ? "a receber" : "a pagar"}
                  </span>
                </div>
                <p className="talao-note talao-dim mt-2">
                  {r.reembolsoEstimado >= 0
                    ? "REEMBOLSO — FOI UM EMPRÉSTIMO GRÁTIS QUE FIZESTE AO ESTADO, MÊS A MÊS."
                    : "A RETENÇÃO FICOU AQUÉM DO IRS DEVIDO — O ACERTO COBRA A DIFERENÇA."}
                  {r.limiteGlobal !== Infinity &&
                    r.linhasDeducao.reduce((a, l) => a + l.deducao, 0) + r.deducaoPpr > r.limiteGlobal &&
                    ` O LIMITE GLOBAL DO ART. 78.º CORTOU-TE AS DEDUÇÕES EM ${fmtEUR0(r.limiteGlobal)}.`}
                </p>
              </div>

              <div className="talao-barras mt-5" aria-hidden />
              <p className="talao-meta talao-dim mt-2 flex justify-between">
                <span>CIRS · LIQUIDAÇÃO {ano}</span>
                <span>{new URL(SITE_URL).host.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <div
            className="talao-aresta talao-aresta-b"
            style={{ maskImage: arestaFundo, WebkitMaskImage: arestaFundo }}
            aria-hidden
          />
        </div>
        <p className="footnote mt-6">
          A nota de liquidação é o documento em que o IRS se acerta: depois
          da declaração, o Estado confronta o imposto devido com o que já
          retiveste — e fecha a conta.
        </p>
      </div>
    </div>
  );
}
