"use client";

/**
 * A cena do Quiosque (P2c) — o «Jornal do Bairro» com os números do
 * país hoje.
 *
 * A porta de `cenaQuiosque()` do protótipo: três passos — o palpite
 * sobre o desemprego jovem, a primeira página do jornal (cada número
 * com a SUA data e a sua fonte) e o gráfico das três linhas
 * (jovens/Portugal/UE).
 *
 * Nenhum número é inventado: vêm de une-pt-total, une-pt-jovem,
 * une-ue27-total, pib-pt-homologo, confianca-pt, cp00 e smn.json. Um
 * dado em falta mostra «—» e a linha diz que a fonte falhou — nunca um
 * 0 (regra nº1).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { graficoLinhas } from "@/lib/viz/grafico-linhas";
import { FINO, fmtEUR, fmtNum, fmtPeriodo } from "@/lib/format";
import type { DadosQuiosque } from "./dados-p2c";
import { interiorQuiosque } from "./quiosque-arte";
import { mesLongo } from "./mercearia-arte";
import CenaDePerto from "./CenaDePerto";
import { pontosDaSerie } from "./utils";
import * as T from "./textos-p2c";

/** «20,1 %» — taxa em percentagem com uma casa decimal. */
const pct1 = (v: number | null | undefined) =>
  v == null ? "—" : `${fmtNum(v, 1)}${FINO}%`;

export default function CenaQuiosque({
  D,
  aoFechar,
}: {
  D: DadosQuiosque;
  aoFechar: () => void;
}) {
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState(8);
  const arteRef = useRef<HTMLDivElement>(null);

  const { ultPt, ultJovens, ultUe } = D.desemprego;

  const interior = useMemo(
    () => interiorQuiosque(T.quiPlaca, T.quiJornalCab, T.quiMancheteSub),
    []
  );

  // a manchete escreve-se quando se «lê» o jornal (passo 2) — texto
  // directo no SVG, como no protótipo; sem animação, não há o que
  // esperar em reduced-motion
  useEffect(() => {
    const raiz = arteRef.current?.closest(".b-cena");
    const el = raiz?.querySelector("#quiManchete");
    if (!el || passo < 2) return;
    el.textContent = pct1(ultJovens?.v);
  }, [passo, ultJovens]);

  const grafico = useMemo(() => {
    const jov = pontosDaSerie(D.desemprego.jovens);
    const pt = pontosDaSerie(D.desemprego.pt);
    const ue = pontosDaSerie(D.desemprego.ue);
    if (!jov.length || !pt.length || !ue.length) return null;
    const max = Math.ceil(Math.max(...jov.map((p) => p.v)) / 5) * 5;
    return graficoLinhas({
      series: [
        { pts: jov, cor: "#e2412a", larg: 3, rotulo: T.quiGraficoRotA },
        { pts: pt, cor: "#16130f", larg: 2.8, rotulo: T.quiGraficoRotB },
        { pts: ue, cor: "#2445d6", larg: 2.4, traco: "6 4", rotulo: T.quiGraficoRotC },
      ],
      y: { min: 0, max, passo: 5, fmt: (v) => `${fmtNum(v, 0)}${FINO}%` },
      marcas: [
        { s: 0, k: -1, texto: pct1(ultJovens?.v), cor: "#e2412a", dx: -8, dy: -12, ancora: "end", corTexto: "#c7361f" },
        { s: 1, k: -1, texto: pct1(ultPt?.v), cor: "#fff", dx: -8, dy: 20, ancora: "end" },
      ],
      aria: T.quiGraficoAria(
        pct1(ultJovens?.v),
        pct1(ultPt?.v),
        pct1(ultUe?.v),
        ultPt ? mesLongo(ultPt.t) : "—"
      ),
    });
  }, [D, ultPt, ultJovens, ultUe]);

  return (
    <CenaDePerto
      quem={T.quiQuem}
      fonte={D.fonte}
      aoFechar={aoFechar}
      arteHtml={interior}
      refArte={arteRef}
      rotuloArte={T.quiRotuloArte}
    >
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.quiFala1
              : passo === 2
                ? T.quiFala2(
                    T.juizoPalpite(
                      palpite,
                      ultJovens !== null ? Math.round(ultJovens.v) : 0,
                      1,
                      4
                    ),
                    ultJovens !== null ? String(Math.round(ultJovens.v)) : "—",
                    pct1(ultJovens?.v),
                    ultJovens ? mesLongo(ultJovens.t) : "—"
                  )
                : T.quiFala3,
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <>
            <p className="pergunta-fin" dangerouslySetInnerHTML={{ __html: T.quiPergunta }} />
            <div className="b-palpite">
              <output htmlFor="quiPal">{T.quiPalpiteFmt(palpite)}</output>
              <input
                id="quiPal"
                type="range"
                min={0}
                max={50}
                step={1}
                value={palpite}
                aria-label={T.quiPalpiteAria}
                onChange={(e) => setPalpite(+e.target.value)}
              />
            </div>
          </>
        )}
        {passo === 2 && (
          <div className="b-jornal">
            <b className="b-j-cab">
              {T.quiJornalCab} · {T.quiJornalTitulo}
            </b>
            <LinhaJornal
              valor={pct1(ultPt?.v)}
              cor="r"
              texto={T.quiJornalDesemprego(
                pct1(ultPt?.v),
                ultPt ? mesLongo(ultPt.t) : "—",
                ultPt !== null ? String(Math.round(ultPt.v)) : "—",
                pct1(ultUe?.v)
              )}
            />
            <LinhaJornal
              valor={pct1(ultJovens?.v)}
              cor="r"
              texto={
                ultJovens && ultPt
                  ? T.quiJornalJovens(fmtNum(ultJovens.v / ultPt.v, 1))
                  : T.quiJornalFalha
              }
            />
            <LinhaJornal
              valor={
                D.pib
                  ? `${D.pib.v >= 0 ? "+" : "−"}${fmtNum(Math.abs(D.pib.v), 1)}${FINO}%`
                  : "—"
              }
              cor={D.pib && D.pib.v >= 0 ? "g" : "r"}
              texto={
                D.pib
                  ? T.quiJornalPib(
                      fmtPeriodo(D.pib.t),
                      `${fmtNum(Math.abs(D.pib.v), 1)}${FINO}%`,
                      D.pib.v >= 0 ? T.quiJornalPibMais : T.quiJornalPibMenos
                    )
                  : T.quiJornalFalha
              }
            />
            <LinhaJornal
              valor={
                D.inflacao
                  ? `+${fmtNum(D.inflacao.v * 100, 1)}${FINO}%`
                  : "—"
              }
              cor="r"
              texto={
                D.inflacao
                  ? T.quiJornalInflacao(
                      mesLongo(D.inflacao.t),
                      `${fmtNum(D.inflacao.v * 100, 1)}${FINO}%`
                    )
                  : T.quiJornalFalha
              }
            />
            <LinhaJornal
              valor={D.confianca ? fmtNum(D.confianca.v, 1) : "—"}
              cor=""
              texto={
                D.confianca
                  ? T.quiJornalConfianca(
                      mesLongo(D.confianca.t),
                      D.confianca.v < 0
                        ? T.quiJornalConfPessimista
                        : T.quiJornalConfOtimista
                    )
                  : T.quiJornalFalha
              }
            />
            <LinhaJornal
              valor={D.smn !== null ? fmtEUR(D.smn) : "—"}
              cor=""
              texto={
                D.smn !== null && D.smn0
                  ? T.quiJornalSmn(
                      "2026",
                      fmtEUR(D.smn),
                      String(D.smn0.ano),
                      fmtEUR(D.smn0.valor)
                    )
                  : T.quiJornalFalha
              }
            />
          </div>
        )}
        {passo === 3 && grafico && (
          <>
            <div dangerouslySetInnerHTML={{ __html: grafico.svg }} />
            <div dangerouslySetInnerHTML={{ __html: grafico.texto }} />
            <p
              dangerouslySetInnerHTML={{
                __html: T.quiGraficoTexto(
                  ultJovens !== null ? `${fmtNum(Math.round(ultJovens.v), 0)}${FINO}%` : "—"
                ),
              }}
            />
          </>
        )}
      </div>
      <div className="b-acoes">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={() => setPasso(2)}>
            {T.quiBtnManchete}
          </button>
        )}
        {passo === 2 && (
          <button className="b-btn" type="button" onClick={() => setPasso(3)}>
            {T.quiBtnGrafico}
          </button>
        )}
        {passo === 3 && (
          <>
            <button className="b-btn b-claro" type="button" onClick={aoFechar}>
              {T.quiBtnVoltar}
            </button>
            <button
              className="b-btn b-claro"
              type="button"
              onClick={() => {
                setPasso(1);
                setPalpite(8);
              }}
            >
              {T.quiBtnOutra}
            </button>
            <a className="b-btn" href="/trabalho">
              {T.quiLinkTrabalho}
            </a>
            <a className="b-btn" href="/dados">
              {T.quiLinkDados}
            </a>
          </>
        )}
      </div>
    </CenaDePerto>
  );
}

/** Uma linha do jornal: o valor à esquerda e a notícia à direita. */
function LinhaJornal({
  valor,
  cor,
  texto,
}: {
  valor: string;
  cor: "r" | "g" | "";
  texto: string;
}) {
  return (
    <div className="b-j-n">
      <span className={`b-j-v${cor ? ` ${cor}` : ""}`}>{valor}</span>
      <span dangerouslySetInnerHTML={{ __html: texto }} />
    </div>
  );
}
