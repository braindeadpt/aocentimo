"use client";

import { Fragment, useMemo, useState } from "react";
import { trajetoriaCA } from "@/lib/engines/poupanca";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import { mascaraFaixaRasgo, sementeDe } from "@/lib/materia";
import { useArmado } from "@/lib/useArmado";
import ca from "@data/fiscal/ca.json";
import capitais from "@data/fiscal/capitais.json";

/**
 * A caderneta de Certificados de Aforro — papel M-01: arestas rasgadas,
 * carimbo, linhas que se imprimem ano a ano. Cada linha mostra o juro
 * que entra (a engordar: juro composto) e o imposto que sai — e no
 * fim a faixa nominal-vs-real: o número na conta a abrir do que esse
 * dinheiro realmente vale (a inflação a comer o intervalo).
 */

const COMP = 320;
const SEMENTE = sementeDe(20260901);
const W = 300;
const H = 64;

export function CadernetaAforro() {
  const [capital, setCapital] = useState(10000);
  const [anos, setAnos] = useState(15);
  const [inflacao, setInflacao] = useState(2.0);

  const taxaImposto = capitais.retencaoLiberatoria.taxa;
  const taxaCA = ca.serieF.taxaBrutaNovasSubscricoes;
  const premios = ca.serieF.premiosPermanencia;

  const traj = useMemo(
    () => trajetoriaCA(capital, anos, taxaCA, premios, taxaImposto, inflacao / 100),
    [capital, anos, taxaCA, premios, taxaImposto, inflacao]
  );
  const ultimo = traj.at(-1);
  const impostoTotal = traj.reduce((a, p) => a + p.imposto, 0);

  const runCad = `${capital}-${anos}-${inflacao}`;
  const { ref: cadRef, arm: cadArm } = useArmado<HTMLDivElement>(runCad);

  // nominal vs real — o intervalo que a inflação come
  const maxY = Math.max(capital, ...(ultimo ? [ultimo.saldo] : []));
  const xAno = (ano: number) => (anos > 0 ? (ano / anos) * W : 0);
  const yV = (v: number) => (maxY > 0 ? H - (v / maxY) * (H - 6) : H);
  const pts = [{ ano: 0, saldo: capital, real: capital }, ...traj];
  const nomPath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xAno(p.ano)},${yV(p.saldo)}`).join(" ");
  const realPath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xAno(p.ano)},${yV(p.real)}`).join(" ");
  // o intervalo: nominal em frente, real de volta — polígono fechado
  const gapPath =
    nomPath +
    " " +
    [...pts].reverse().map((p) => `L${xAno(p.ano)},${yV(p.real)}`).join(" ") +
    " Z";

  const arestaTopo = mascaraFaixaRasgo(COMP, { semente: SEMENTE, ponta: "topo", grosseria: 0.4 });
  const arestaFundo = mascaraFaixaRasgo(COMP, { semente: SEMENTE + 5, ponta: "fundo", grosseria: 0.4 });

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="cad-cap">Quanto metes de lado</label>
          <input id="cad-cap" type="number" min={0} step={500} value={capital}
            onChange={(e) => setCapital(Number(e.target.value) || 0)} className="field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="cad-anos">Anos (máx. 15)</label>
            <input id="cad-anos" type="number" min={1} max={15} value={anos}
              onChange={(e) => setAnos(Math.min(15, Number(e.target.value) || 1))} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="cad-infl">Inflação (%)</label>
            <input id="cad-infl" type="number" step={0.1} value={inflacao}
              onChange={(e) => setInflacao(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <p className="footnote">
          CA Série F: {fmtPct(taxaCA, 2)} brutos em novas subscrições
          ({ca.serieF.base.toLowerCase()}). Prémios de permanência somam-se
          à base: {premios.map((p) => `+${p.pp.toFixed(2).replace(".", ",")} p.p. ${p.anos} ano`).join(" · ")}.
          Juros capitalizam trimestralmente; imposto {fmtPct(taxaImposto, 0)} retido
          em cada vencimento. {ca.serieF.garantia}.
        </p>
      </div>

      {/* a caderneta — papel, linhas carimbadas ano a ano */}
      <div className="talao-wrap self-start" ref={cadRef}>
        <div
          className="talao-aresta talao-aresta-t"
          style={{ maskImage: arestaTopo, WebkitMaskImage: arestaTopo }}
          aria-hidden
        />
        <div className="talao talao-mat">
          <span className="carimbo">aforro</span>
          <div className="talao-face px-5 pb-5 pt-6">
            <p className="talao-head text-center">Caderneta de Aforro</p>
            <p className="talao-sub talao-dim mt-1 text-center">
              {fmtEUR0(capital)} a {fmtPct(taxaCA, 2)} + prémios · Série F
            </p>
            <dl className="talao-body mt-3">
              <Fragment key={runCad}>
                {traj.map((p, i) => (
                  <div
                    key={p.ano}
                    className={cadArm("talao-linha") + " talao-sep flex items-baseline justify-between gap-3 py-1"}
                    style={{ "--linha": i } as React.CSSProperties}
                  >
                    <dt className="talao-dim text-talao-head">
                      ano {p.ano} · +{fmtEUR0(p.juro)} juro ·{" "}
                      <span className="talao-retido">−{fmtEUR0(p.imposto)} fisco</span>
                    </dt>
                    <dd className="num text-talao-corpo">{fmtEUR(p.saldo)}</dd>
                  </div>
                ))}
              </Fragment>
            </dl>
            {/* nominal vs real — o intervalo é a inflação */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="mt-3 h-16 w-full"
              preserveAspectRatio="none"
              role="img"
              aria-label={`Em ${anos} anos, ${fmtEUR0(capital)} viram ${ultimo ? fmtEUR0(ultimo.saldo) : "—"} na conta, que valem ${ultimo ? fmtEUR0(ultimo.real) : "—"} em euros de hoje.`}
            >
              <g className={cadArm("tempo-revela")} key={runCad}>
                <path d={gapPath} fill="var(--color-up)" opacity={0.1} />
                <path d={realPath} fill="none" stroke="var(--color-ink)" strokeWidth={1.2} strokeDasharray="3 3" />
                <path d={nomPath} fill="none" stroke="var(--color-ink)" strokeWidth={1.6} />
              </g>
            </svg>
            <div className="mt-1 flex items-center gap-4 text-talao-head talao-dim">
              <span className="flex items-center gap-1.5">
                <svg width="16" height="4" aria-hidden><line x1="0" x2="16" y1="2" y2="2" stroke="currentColor" strokeWidth="1.6" /></svg>
                na conta
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="16" height="4" aria-hidden><line x1="0" x2="16" y1="2" y2="2" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" /></svg>
                vale hoje
              </span>
            </div>
            <div
              className={cadArm("talao-linha") + " talao-cut mt-1 flex items-baseline justify-between gap-4 py-2.5"}
              style={{ "--linha": traj.length } as React.CSSProperties}
            >
              <span className="talao-total">Vale mesmo</span>
              <span className="text-talao-numero font-bold">{ultimo ? fmtEUR0(ultimo.real) : "—"}</span>
            </div>
            <p
              className={cadArm("talao-linha") + " talao-note talao-dim"}
              style={{ "--linha": traj.length + 1 } as React.CSSProperties}
            >
              {ultimo ? fmtEUR0(ultimo.saldo) : "—"} na conta — o fisco já
              levou {fmtEUR0(impostoTotal)} pelo caminho e a inflação fez o resto.
            </p>
          </div>
        </div>
        <div
          className="talao-aresta talao-aresta-b"
          style={{ maskImage: arestaFundo, WebkitMaskImage: arestaFundo }}
          aria-hidden
        />
      </div>
    </div>
  );
}
