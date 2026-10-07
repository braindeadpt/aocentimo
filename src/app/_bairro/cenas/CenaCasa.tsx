"use client";

/**
 * A cena da Casa da Inês (P2c) — quantos meses de trabalho custa uma
 * casa.
 *
 * A porta de `cenaCasa()` do protótipo: três passos — o palpite em
 * meses, a pilha de recibos que cresce até à resposta e o gráfico das
 * duas linhas (hpi contra custo do trabalho) com a mancha entre elas.
 * Todos os números vêm de `casa-em-salarios.json` via props; a pilha e
 * o texto dela mexem por manipulação directa do SVG injectado, como o
 * protótipo e como a P2a fazia.
 *
 * A pilha anima com GSAP só quando `motionActiva()` — com
 * prefers-reduced-motion o chunk nem é pedido e o estado final aparece
 * logo (regra da casa). Cada chamada mata o tween anterior: a Fábrica
 * ensinou que um callback atrasado soma por cima do valor final.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { graficoLinhas } from "@/lib/viz/grafico-linhas";
import type { DadosCasa } from "./dados-p2c";
import { interiorCasa, PX_POR_MES } from "./casa-arte";
import CenaDePerto from "./CenaDePerto";
import * as T from "./textos-p2c";
import { setaVar, trimestre } from "./p2c-arte-base";

/** Escreve a pilha no SVG injectado: altura, riscas e o número. */
function aplicaPilha(raiz: ParentNode, n: number, h: number) {
  const g = raiz.querySelector("#casaPilha");
  if (!g) return;
  g.querySelector(".pilha")?.setAttribute("y", String(-h));
  g.querySelector(".pilha")?.setAttribute("height", String(h));
  const t = g.querySelector(".pilha-txt");
  if (t) {
    t.setAttribute("y", String(-h - 8));
    t.textContent = String(Math.round(n));
  }
  const r = g.querySelector(".riscas");
  if (r)
    r.innerHTML = Array.from(
      { length: Math.max(0, Math.floor(h / 6)) },
      (_, k) => `<path d="M-34 ${-(k + 1) * 6} h68" stroke="#d8cbb4" stroke-width="1"/>`
    ).join("");
}

export default function CenaCasa({ D, aoFechar }: { D: DadosCasa; aoFechar: () => void }) {
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState(130);
  const arteRef = useRef<HTMLDivElement>(null);
  // bilhete de geração: um tween atrasado não escreve por cima do actual
  const geracao = useRef(0);

  const interior = useMemo(() => interiorCasa(T.casaPlaca, T.casaPilhaLeg), []);
  const meses = D.meses;
  const ultimo = D.razao.at(-1);
  const hpiU = D.hpi.at(-1);
  const lciU = D.lci.at(-1);

  const grafico = useMemo(() => {
    if (!D.hpi.length || !D.lci.length) return null;
    const max = Math.ceil(Math.max(...D.hpi.map((p) => p.v)) / 50) * 50;
    return graficoLinhas({
      series: [
        { pts: D.hpi, cor: "#e2412a", larg: 3.2, rotulo: T.casaGraficoRotA },
        { pts: D.lci, cor: "#16130f", larg: 2.6, traco: "6 4", rotulo: T.casaGraficoRotB },
      ],
      faixa: [0, 1],
      faixaCor: "#ffc2b3",
      y: { min: 50, max, passo: 50, fmt: (v) => String(Math.round(v)), realce: 100 },
      anoPasso: 2,
      marcas: [
        { s: 0, k: -1, texto: String(Math.round(hpiU?.v ?? 0)), cor: "#e2412a", dx: -8, dy: -12, ancora: "end", corTexto: "#c7361f" },
        { s: 1, k: -1, texto: String(Math.round(lciU?.v ?? 0)), cor: "#fff", dx: -8, dy: 22, ancora: "end" },
      ],
      aria: T.casaGraficoAria(
        String(Math.round(hpiU?.v ?? 0)),
        String(Math.round(lciU?.v ?? 0))
      ),
    });
  }, [D, hpiU, lciU]);

  // a pilha: no passo 1 fica nos 100 meses de 2015 (estado final logo,
  // síncrono); no passo 2 cresce até à resposta — com GSAP só se
  // motionActiva, e um bilhete de geração anula callbacks atrasados
  // (a lição do contador da Fábrica); no passo 3 fica como ficou
  useEffect(() => {
    const raiz = arteRef.current?.closest(".b-cena");
    if (!raiz) return;
    // antes da resposta a pilha fica nos 100 de 2015; depois do passo 2
    // fica onde ficou — voltar a 100 no gráfico esquecia a resposta
    if (passo === 1 || meses === null) {
      aplicaPilha(raiz, 100, 100 * PX_POR_MES);
      return;
    }
    if (passo !== 2) return;
    const gen = ++geracao.current;
    let morto = false;
    let tween: { kill?: () => void } | null = null;
    (async () => {
      const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
      if (morto || gen !== geracao.current) return;
      if (!motionActiva()) {
        aplicaPilha(raiz, meses, meses * PX_POR_MES);
        return;
      }
      const { gsap } = await carregarGsap();
      if (morto || gen !== geracao.current) return;
      const o = {
        h: Number(raiz.querySelector("#casaPilha .pilha")?.getAttribute("height")) || 0,
        n: Number(raiz.querySelector("#casaPilha .pilha-txt")?.textContent) || 0,
      };
      tween = gsap.to(o, {
        h: meses * PX_POR_MES,
        n: meses,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: () => {
          if (gen === geracao.current) aplicaPilha(raiz, o.n, o.h);
        },
      });
    })();
    return () => {
      morto = true;
      tween?.kill?.();
    };
  }, [passo, meses]);

  const hoje = meses !== null ? String(meses) : "—";
  const subHpi = hpiU ? setaVar(hpiU.v - 100) : "—";
  const subLci = lciU ? setaVar(lciU.v - 100) : "—";

  return (
    <CenaDePerto
      quem={T.casaQuem}
      fonte={D.fonte}
      aoFechar={aoFechar}
      arteHtml={interior}
      refArte={arteRef}
      rotuloArte={T.casaRotuloArte}
    >
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.casaFala1
              : passo === 2
                ? T.casaFala2(T.juizoPalpite(palpite, meses ?? 0, 5, 20), hoje)
                : T.casaFala3,
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <>
            <p className="pergunta-fin">{T.casaPergunta}</p>
            <div className="b-palpite">
              <output htmlFor="casaPal">{T.casaPalpiteFmt(palpite)}</output>
              <input
                id="casaPal"
                type="range"
                min={60}
                max={300}
                step={1}
                value={palpite}
                aria-label={T.casaPalpiteAria}
                onChange={(e) => setPalpite(+e.target.value)}
              />
            </div>
          </>
        )}
        {passo === 2 && (
          <>
            <p dangerouslySetInnerHTML={{ __html: T.casaExplica(subHpi, subLci) }} />
            <p className="nota-fin">
              {T.casaNota(ultimo ? trimestre(ultimo.t) : "—")}
            </p>
          </>
        )}
        {passo === 3 && grafico && (
          <>
            <div dangerouslySetInnerHTML={{ __html: grafico.svg }} />
            <div dangerouslySetInnerHTML={{ __html: grafico.texto }} />
            <p dangerouslySetInnerHTML={{ __html: T.casaGraficoTexto(
              String(Math.round(hpiU?.v ?? 0)),
              String(Math.round(lciU?.v ?? 0))
            ) }} />
          </>
        )}
      </div>
      <div className="b-acoes">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={() => setPasso(2)}>
            {T.casaBtnResposta}
          </button>
        )}
        {passo === 2 && (
          <button className="b-btn" type="button" onClick={() => setPasso(3)}>
            {T.casaBtnGrafico}
          </button>
        )}
        {passo === 3 && (
          <>
            <button className="b-btn b-claro" type="button" onClick={aoFechar}>
              {T.casaBtnVoltar}
            </button>
            <button
              className="b-btn b-claro"
              type="button"
              onClick={() => { setPasso(1); setPalpite(130); }}
            >
              {T.casaBtnOutra}
            </button>
            <a className="b-btn" href="/casa">
              {T.casaLinkCasa}
            </a>
          </>
        )}
      </div>
    </CenaDePerto>
  );
}
