"use client";

/**
 * A cena da Mercearia (P2a) — a inflação e o IVA no talão.
 *
 * A porta de `cenaMerc()` do protótipo: o palpite do saco, as etiquetas
 * que viram, as barras de subida, o gráfico do índice por produto e o
 * talão do IVA. Nenhum preço em euros inventado: tudo são razões entre
 * índices ECOICOP de data/ e taxas do Código do IVA. Com movimento, o
 * GSAP de `anima.ts` faz o caminho; sem, o estado final entra logo.
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
  reporMercearia,
  talaoIva,
  textoEtiqueta,
} from "./mercearia-arte";
import { acenar, useGsap } from "./anima";
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

  const gsapRef = useGsap();

  // ao abrir: o Sr. Manuel acena (o `acena()` do protótipo)
  useEffect(() => {
    let vivo = true;
    import("@/lib/motion/gsap").then(async ({ motionActiva, carregarGsap }) => {
      if (!motionActiva()) return;
      const { gsap } = await carregarGsap();
      const braco = arteRef.current?.querySelectorAll("#mercManuel .braco-d");
      if (vivo && braco) acenar(gsap, braco);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // PASSO 2: o saco conta de 10 € até ao preço de hoje, as etiquetas
  // viram uma a uma e o produto que mais subiu salta. Ao sair do passo
  // (ou sem movimento) fica o estado final.
  useEffect(() => {
    const raiz = arteRef.current;
    if (!raiz || passo !== 2) return;
    const saco = raiz.querySelector("#mercSacoTxt");
    const fim = () => {
      etiquetasDe(D, raiz);
      if (saco) saco.textContent = `${fmtNum(realSaco, 2)} €`;
    };
    const gsap = gsapRef.current;
    if (!gsap) {
      fim();
      return;
    }
    const tweens: { kill: () => void; progress: (p: number) => unknown }[] = [];
    const o = { v: 10 };
    tweens.push(
      gsap.to(o, {
        v: realSaco,
        duration: 1.3,
        ease: "power2.out",
        onUpdate: () => {
          if (saco) saco.textContent = `${fmtNum(o.v, 2)} €`;
        },
      })
    );
    itens.forEach((it, k) => {
      const g = raiz.querySelector(`#etq-${it.id}`);
      const b = g?.querySelector(".etq-b");
      if (!g || !b) return;
      const txt = textoEtiqueta(it.r);
      tweens.push(
        gsap
          .timeline({ delay: 0.15 * k })
          .to(g, { scaleY: 0, transformOrigin: "50% 0%", duration: 0.12 })
          .add(() => {
            b.textContent = txt;
          })
          .to(g, { scaleY: 1, duration: 0.2, ease: "back.out(3)" })
      );
    });
    const topo = itens[0] ? raiz.querySelector(`.prod[data-id="${itens[0].id}"] .prod-i`) : null;
    if (topo)
      tweens.push(
        gsap.fromTo(topo, { y: 0 }, { y: -10, duration: 0.25, yoyo: true, repeat: 5, delay: 1.4, ease: "power1.inOut" })
      );
    return () => {
      tweens.forEach((t) => {
        t.progress(1);
        t.kill();
      });
      fim();
    };
  }, [D, passo, itens, realSaco, gsapRef]);

  // PASSO 3: o realce do produto escolhido
  useEffect(() => {
    const raiz = arteRef.current;
    if (!raiz || passo !== 3 || !produtoEscolhido) return;
    for (const g of raiz.querySelectorAll(".prod")) {
      g.classList.toggle("realce", g.getAttribute("data-id") === produtoEscolhido.id);
    }
  }, [passo, produtoEscolhido]);

  // PASSO 4: o realce sai e o talão sobe da caixa registadora
  useEffect(() => {
    const raiz = arteRef.current;
    if (!raiz || passo !== 4) return;
    raiz.querySelectorAll(".prod").forEach((g) => g.classList.remove("realce"));
    const t = raiz.querySelector("#mercTalaoArte");
    if (!t) return;
    const gsap = gsapRef.current;
    if (gsap) gsap.fromTo(t, { opacity: 1, y: 40 }, { y: 0, duration: 0.7, ease: "power2.out" });
    else t.setAttribute("opacity", "1");
  }, [passo, gsapRef]);

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
  const ivaPct = (t: number | null) => (t === null ? "—" : `${fmtNum(t * 100, 0)}\u202f%`);
  const ivaEm10 = (t: number | null) => (t === null ? "—" : `${fmtNum((10 * t) / (1 + t), 2)}\u202f€`);
  const ivaRed = ivaDe("Reduzida");
  const ivaInt = ivaDe("Intermédia");
  const ivaNor = ivaDe("Normal");

  return (
    <CenaDePerto quem={T.mercQuem} fonte={passo === 4 ? D.fonteIva : D.fonte} aoFechar={aoFechar} arteHtml={interior} refArte={arteRef} rotuloArte={T.mercRotuloArte}>
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
            <p dangerouslySetInnerHTML={{ __html: T.mercExplica(pctVar(razao(D.comida, D.t0)), mesLongo(D.t0), pctVar(total)) }} />
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
                  reporMercearia(arteRef.current ?? document);
                  setPasso(1);
                  setPalpite(12);
                  setProduto(null);
                }}
              >
                {T.finBtnOutra}
              </button>
            </div>
          </>
        )}
      </div>
      <div className="b-acoes" />
    </CenaDePerto>
  );
}
