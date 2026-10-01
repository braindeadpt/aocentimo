"use client";

/**
 * A cena da Mercearia (P2a) — a inflação e o IVA no talão.
 *
 * A porta de `cenaMerc()` do protótipo: o palpite do saco, as etiquetas
 * que viram, as barras de subida, o gráfico do índice por produto e o
 * talão do IVA. Nenhum preço em euros inventado: tudo são razões entre
 * índices ECOICOP de data/ e taxas do Código do IVA. Sem GSAP.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtNum } from "@/lib/format";
import type { DadosMercearia } from "./dados";
import {
  barrasSubida,
  etiquetasDe,
  graficoIndice,
  interiorMercearia,
  itensOrdenados,
  mesLongo,
  pctVar,
  razao,
  talaoIva,
} from "./mercearia-arte";
import CenaDePerto from "./CenaDePerto";
import { pontosDaSerie } from "./utils";
import * as T from "./textos";

export default function CenaMercearia({ D, aoFechar }: { D: DadosMercearia; aoFechar: () => void }) {
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState(12);
  const [produto, setProduto] = useState<string | null>(null);
  const arteRef = useRef<HTMLDivElement>(null);

  const interior = useMemo(() => interiorMercearia(), []);
  const itens = useMemo(() => itensOrdenados(D), [D]);
  const realSaco = 10 * razao(D.comida, D.t0);
  const { html: barras, total } = useMemo(() => barrasSubida(D, "tudo o que compramos (inflação geral)"), [D]);
  const produtoEscolhido = itens.find((i) => i.id === produto) ?? itens[0];
  const { html: talao } = useMemo(() => talaoIva(D), [D]);

  // as etiquetas viram no passo 2; o realce do produto no passo 3
  useEffect(() => {
    const raiz = arteRef.current;
    if (!raiz) return;
    if (passo >= 2) etiquetasDe(D, raiz);
    if (passo === 2) {
      const saco = raiz.querySelector("#mercSacoTxt");
      if (saco) saco.textContent = `${fmtNum(realSaco, 2)} €`;
    }
    if (passo === 3 && produtoEscolhido) {
      for (const g of raiz.querySelectorAll(".prod")) {
        g.classList.toggle("realce", g.getAttribute("data-id") === produtoEscolhido.id);
      }
    }
    if (passo === 4) {
      const t = raiz.querySelector("#mercTalaoArte");
      if (t) t.setAttribute("opacity", "1");
    }
  }, [D, passo, produtoEscolhido, realSaco]);

  const t1 = useMemo(() => {
    const ps = pontosDaSerie(D.total);
    return ps[ps.length - 1]?.t ?? D.t0;
  }, [D.total, D.t0]);
  const juizo =
    Math.abs(realSaco - palpite) <= 0.3
      ? "Acertaste em cheio!"
      : Math.abs(realSaco - palpite) <= 1
        ? "Quase!"
        : palpite < realSaco
          ? "Mais caro do que pensavas!"
          : "Um pouco menos!";

  // as taxas do IVA vêm de data/fiscal/iva.json — se uma faltar, o texto
  // diz «—», nunca 0 % inventado (regra nº1)
  const ivaDe = (nome: string) => D.iva.taxas.find((x) => x.nome === nome)?.taxa ?? null;
  const ivaPct = (t: number | null) => (t === null ? "—" : `${fmtNum(t * 100, 0)}%`);
  const ivaEm10 = (t: number | null) => (t === null ? "—" : `${fmtNum((10 * t) / (1 + t), 2)} €`);
  const ivaRed = ivaDe("Reduzida");
  const ivaInt = ivaDe("Intermédia");
  const ivaNor = ivaDe("Normal");

  return (
    <CenaDePerto quem={T.mercQuem} fonte={D.fonte} aoFechar={aoFechar} arteHtml={interior} refArte={arteRef} rotuloArte={T.mercRotuloArte}>
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.mercFala1(mesLongo(D.t0))
              : passo === 2
                ? T.mercResposta(juizo, `${fmtNum(realSaco, 2)} €`)
                : passo === 3
                  ? T.mercFala3(mesLongo(D.t0))
                  : T.mercFala4,
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <>
            <div className="b-palpite">
              <output htmlFor="mercPal">{fmtNum(palpite, 2)} €</output>
              <input
                id="mercPal"
                type="range"
                min={8}
                max={18}
                step={0.1}
                value={palpite}
                onChange={(e) => setPalpite(+e.target.value)}
                aria-label={T.mercPalpiteAria}
              />
            </div>
            <button className="b-btn" type="button" onClick={() => setPasso(2)}>
              {T.mercBtnResposta}
            </button>
          </>
        )}
        {passo === 2 && (
          <>
            <p>{T.mercExplica(pctVar(razao(D.comida, D.t0)), mesLongo(D.t0), pctVar(total))}</p>
            <div dangerouslySetInnerHTML={{ __html: barras }} />
            <button className="b-btn" type="button" onClick={() => setPasso(3)}>
              {T.finBtnGrafico}
            </button>
          </>
        )}
        {passo === 3 && produtoEscolhido && (
          <>
            <div className="opcoes" role="group" aria-label={T.mercEscolherAria}>
              {itens.map((i) => (
                <button
                  key={i.id}
                  className={`b-btn b-claro${i.id === produtoEscolhido.id ? " b-ligado" : ""}`}
                  type="button"
                  aria-pressed={i.id === produtoEscolhido.id}
                  onClick={() => setProduto(i.id)}
                >
                  {i.nome}
                </button>
              ))}
            </div>
            <div dangerouslySetInnerHTML={{ __html: graficoIndice(D, produtoEscolhido) }} />
            <p
              dangerouslySetInnerHTML={{
                __html: T.mercGraficoTexto(
                  produtoEscolhido.nome,
                  Math.round(
                    (razao(produtoEscolhido.serie, D.t0)) * 100
                  ),
                  pctVar(produtoEscolhido.r)
                ),
              }}
            />
            <p className="nota-fin">{T.mercNotaIndice}</p>
            <button className="b-btn" type="button" onClick={() => setPasso(4)}>
              {T.mercBtnIva}
            </button>
          </>
        )}
        {passo === 4 && (
          <>
            <div dangerouslySetInnerHTML={{ __html: talao }} />
            <p
              dangerouslySetInnerHTML={{
                __html: T.mercIvaTexto(
                  ivaPct(ivaRed),
                  ivaEm10(ivaRed),
                  ivaPct(ivaInt),
                  ivaPct(ivaNor),
                  ivaEm10(ivaNor)
                ),
              }}
            />
            <p className="nota-fin">{T.mercIvaNota(D.iva.regiao)}</p>
            <div className="opcoes">
              <button className="b-btn b-claro" type="button" onClick={aoFechar}>
                {T.finBtnVoltar}
              </button>
              <button
                className="b-btn b-claro"
                type="button"
                onClick={() => {
                  setPasso(1);
                  setPalpite(12);
                  setProduto(null);
                }}
              >
                {T.finBtnOutra}
              </button>
            </div>
            <p className="b-fonte-inline">{D.fonteIva} · dados até {t1}</p>
          </>
        )}
      </div>
      <div className="b-acoes" />
    </CenaDePerto>
  );
}
