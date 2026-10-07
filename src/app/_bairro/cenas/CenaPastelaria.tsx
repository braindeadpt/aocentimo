"use client";

/**
 * A cena da Pastelaria (P2c) — o café e o pastel: comer fora contra
 * comer em casa, e o IVA.
 *
 * A porta de `cenaPastelaria()` do protótipo: três passos — o palpite
 * em euros, o quadro de ardósia que escreve o preço de hoje com o
 * gráfico fora/casa, e o IVA da restauração contra o do pão.
 *
 * Os números são os da série IHPC cp11 (fora) e cp01 (comida), ambas
 * reais em `data/sources/eurostat`; o IVA vem de `iva.json`. O preço de
 * «2 € em T0» é EXEMPLO — a cena diz-o, como o protótipo.
 *
 * GSAP: o vapor e o «hoje» do quadro; só quando `motionActiva()`. Em
 * reduced-motion o preço final aparece escrito e nenhum chunk é pedido.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { graficoLinhas, rebase } from "@/lib/viz/grafico-linhas";
import { fmtEUR, fmtPct } from "@/lib/format";
import type { DadosPastelaria } from "./dados-p2c";
import { interiorPastelaria } from "./pastelaria-arte";
import { mesCurto, mesLongo, pctVar } from "./mercearia-arte";
import CenaDePerto from "./CenaDePerto";
import { pontosDaSerie } from "./utils";
import * as T from "./textos-p2c";

export default function CenaPastelaria({
  D,
  aoFechar,
}: {
  D: DadosPastelaria;
  aoFechar: () => void;
}) {
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState(2.4);
  const arteRef = useRef<HTMLDivElement>(null);
  const geracao = useRef(0);

  const ptsFora = useMemo(() => pontosDaSerie(D.fora), [D.fora]);
  const ptsComida = useMemo(() => pontosDaSerie(D.comida), [D.comida]);
  // «hoje» = o exemplo de T0 crescido pela razão da série (o `r11` do
  // protótipo — último ÷ primeiro da série desde 2019)
  const r11 = D.subidaFora !== null ? 1 + D.subidaFora : null;
  const hoje = r11 !== null ? D.base * r11 : null;

  const interior = useMemo(
    () =>
      interiorPastelaria(
        T.pastPlaca,
        T.pastQuadroTitulo,
        T.pastQuadroAntes(mesCurto(D.t0), fmtEUR(D.base))
      ),
    [D]
  );

  const grafico = useMemo(() => {
    const fora = rebase(ptsFora, D.t0);
    const casa = rebase(ptsComida, D.t0);
    if (!fora.length || !casa.length) return null;
    const max = Math.ceil(Math.max(...fora.map((p) => p.v)) / 10) * 10;
    return graficoLinhas({
      series: [
        { pts: fora, cor: "#e2412a", larg: 3.2, rotulo: T.pastGraficoRotA },
        { pts: casa, cor: "#16130f", larg: 2.6, traco: "6 4", rotulo: T.pastGraficoRotB },
      ],
      y: { min: 90, max, passo: 10, fmt: (v) => String(Math.round(v)), realce: 100 },
      marcas: [
        { s: 0, k: -1, texto: String(Math.round(fora.at(-1)!.v)), cor: "#e2412a", dx: -8, dy: -12, ancora: "end", corTexto: "#c7361f" },
        { s: 1, k: -1, texto: String(Math.round(casa.at(-1)!.v)), cor: "#fff", dx: -8, dy: 22, ancora: "end" },
      ],
      aria: T.pastGraficoAria(
        mesLongo(D.t0),
        String(Math.round(fora.at(-1)!.v)),
        String(Math.round(casa.at(-1)!.v))
      ),
    });
  }, [ptsFora, ptsComida, D.t0]);

  // o vapor da máquina (loop) — só com movimento; limpo no desmontar
  useEffect(() => {
    let morto = false;
    let tween: { kill?: () => void } | null = null;
    (async () => {
      const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
      if (morto || !motionActiva()) return;
      const { gsap } = await carregarGsap();
      const el = arteRef.current?.closest(".b-cena")?.querySelector(".vapor");
      if (morto || !el) return;
      tween = gsap.to(el, { y: -6, opacity: 0.2, duration: 1.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    })();
    return () => {
      morto = true;
      tween?.kill?.();
    };
  }, []);

  // o «hoje:» do quadro — conta de T0 até ao preço de hoje; com
  // reduced-motion escreve-se o valor final, sem GSAP
  useEffect(() => {
    const raiz = arteRef.current?.closest(".b-cena");
    const el = raiz?.querySelector("#pastHoje");
    if (!raiz || !el || passo < 2 || hoje === null) return;
    const gen = ++geracao.current;
    let morto = false;
    let tween: { kill?: () => void } | null = null;
    (async () => {
      const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
      if (morto || gen !== geracao.current) return;
      if (!motionActiva()) {
        el.textContent = T.pastQuadroHoje(fmtEUR(hoje));
        return;
      }
      const { gsap } = await carregarGsap();
      if (morto || gen !== geracao.current) return;
      const o = { v: D.base };
      tween = gsap.to(o, {
        v: hoje,
        duration: 1.2,
        ease: "power2.out",
        onUpdate: () => {
          if (gen === geracao.current) el.textContent = T.pastQuadroHoje(fmtEUR(o.v));
        },
      });
    })();
    return () => {
      morto = true;
      tween?.kill?.();
    };
  }, [passo, hoje, D.base]);

  // IVA dentro do preço: parte = preço × taxa ÷ (1 + taxa)
  const ivaNoPreco = (taxa: number | null) =>
    hoje !== null && taxa !== null ? (hoje * taxa) / (1 + taxa) : null;
  const ivaCafe = ivaNoPreco(D.ivaCafe);
  const ivaPao = ivaNoPreco(D.ivaMercearia);
  const fmtOuFalha = (v: number | null) => (v === null ? "—" : fmtEUR(v));
  const taxaOuFalha = (v: number | null) => (v === null ? "—" : fmtPct(v, 0));

  return (
    <CenaDePerto
      quem={T.pastQuem}
      fonte={D.fonte}
      aoFechar={aoFechar}
      arteHtml={interior}
      refArte={arteRef}
      rotuloArte={T.pastRotuloArte}
    >
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.pastFala1(mesLongo(D.t0), fmtEUR(D.base))
              : passo === 2
                ? T.pastFala2(
                    T.juizoPalpite(palpite, hoje ?? 0, 0.05, 0.2),
                    fmtOuFalha(hoje),
                    r11 !== null ? pctVar(r11) : "—"
                  )
                : T.pastFala3(taxaOuFalha(D.ivaCafe)),
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <>
            <p className="pergunta-fin">{T.pastPergunta}</p>
            <p className="nota-fin">{T.pastNotaExemplo(fmtEUR(D.base))}</p>
            <div className="b-palpite">
              <output htmlFor="pastPal">{fmtEUR(palpite)}</output>
              <input
                id="pastPal"
                type="range"
                min={2}
                max={4}
                step={0.05}
                value={palpite}
                aria-label={T.pastPalpiteAria}
                onChange={(e) => setPalpite(+e.target.value)}
              />
            </div>
          </>
        )}
        {passo === 2 && (
          <>
            <p
              dangerouslySetInnerHTML={{
                __html: T.pastExplica(
                  mesLongo(D.t0),
                  r11 !== null ? pctVar(r11) : "—",
                  D.comida.v.length >= 2
                    ? pctVar(
                        ptsComida.at(-1)!.v /
                          (ptsComida.find((p) => p.t === D.t0)?.v ?? NaN)
                      )
                    : "—"
                ),
              }}
            />
            {grafico && (
              <>
                <div dangerouslySetInnerHTML={{ __html: grafico.svg }} />
                <div dangerouslySetInnerHTML={{ __html: grafico.texto }} />
              </>
            )}
            <p className="nota-fin">{T.pastNotaIndice}</p>
          </>
        )}
        {passo === 3 && (
          <>
            <p
              dangerouslySetInnerHTML={{
                __html: T.pastIvaTexto(
                  fmtOuFalha(hoje),
                  fmtOuFalha(ivaCafe),
                  taxaOuFalha(D.ivaCafe),
                  taxaOuFalha(D.ivaMercearia),
                  fmtOuFalha(ivaPao)
                ),
              }}
            />
            <p className="nota-fin">{T.pastNotaIva}</p>
          </>
        )}
      </div>
      <div className="b-acoes">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={() => setPasso(2)}>
            {T.pastBtnResposta}
          </button>
        )}
        {passo === 2 && (
          <button className="b-btn" type="button" onClick={() => setPasso(3)}>
            {T.pastBtnIva}
          </button>
        )}
        {passo === 3 && (
          <>
            <button className="b-btn b-claro" type="button" onClick={aoFechar}>
              {T.pastBtnVoltar}
            </button>
            <button
              className="b-btn b-claro"
              type="button"
              onClick={() => {
                setPasso(1);
                setPalpite(2.4);
              }}
            >
              {T.pastBtnOutra}
            </button>
            <a className="b-btn" href="/inflacao">
              {T.pastLinkInflacao}
            </a>
          </>
        )}
      </div>
    </CenaDePerto>
  );
}
