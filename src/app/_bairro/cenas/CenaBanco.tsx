"use client";

/**
 * A cena do Banco (P2a) — o crédito à habitação do Rui e da Marta.
 *
 * A porta de `cenaBanco()` do protótipo: senha, o palpite entre o mês
 * mais barato e o mais caro da Euribor, o quadro de letras que vira e os
 * dois gráficos com o mesmo tempo. A prestação é SEMPRE
 * `simularPrestacao()` (o motor), via `banco-arte.ts`. Sem GSAP: as
 * letras mudam direto e o estado final é o mesmo com e sem animação.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtEUR } from "@/lib/format";
import type { DadosBanco } from "./dados";
import {
  cursorGrafico,
  graficoBanco,
  interiorBanco,
  mesCurto,
  mesLongo,
  mostrarMesSvg,
  pct2,
  prestacaoDe,
} from "./banco-arte";
import CenaDePerto from "./CenaDePerto";
import { pontosDaSerie } from "./utils";
import * as T from "./textos";

/** O exemplo — não é um dado publicado, e a cena diz isso. */
const EX = { capital: 150000, anos: 30, spread: 1 };

export default function CenaBanco({ D, aoFechar }: { D: DadosBanco; aoFechar: () => void }) {
  const [passo, setPasso] = useState(1);
  const [exemplo, setExemplo] = useState(EX);

  const [kEscolhido, setKEscolhido] = useState<number | null>(null);
  const [palpite, setPalpite] = useState(0);
  const arteRef = useRef<HTMLDivElement>(null);

  // a série compacta do servidor reconstrói-se aqui, no cliente
  const eur = useMemo(() => pontosDaSerie(D.serie), [D.serie]);

  /**
   * O mês mostrado: o que a pessoa escolheu, ou o mês mais barato — o
   * estado DERIVADO chega a 0 no render, sem `setState` em efeito (a
   * regra `react-hooks` da casa proíbe os efeitos em cascata).
   */
  const idxMin = useMemo(() => eur.reduce((a, p, i) => (p.v < eur[a].v ? i : a), 0), [eur]);
  const idxMax = useMemo(() => eur.reduce((a, p, i) => (p.v > eur[a].v ? i : a), 0), [eur]);
  const kVivo = kEscolhido ?? idxMin;
  const idxHoje = eur.length - 1;

  const interior = useMemo(() => interiorBanco(), []);
  // o gráfico refaz-se quando o exemplo muda (a forma das curvas depende do exemplo)
  const grafico = useMemo(
    () => graficoBanco(eur, exemplo, T.banGraficoAria),
    [eur, exemplo]
  );

  // O quadro + papel + taxa: sempre acompanham `kVivo` e `exemplo`. O
  // DOM do interior NÃO é estado React: escreve-se por efeito. A raiz de
  // procura é a `.b-cena` inteira: os ids do interior estão na arte e os
  // do gráfico (banPa, banPb, banCursor) na coluna do texto — o gráfico
  // não pode ir para o desenho, sobrepunha-se ao interior.
  useEffect(() => {
    const raiz = arteRef.current?.closest(".b-cena");
    if (!raiz || eur.length === 0) return;
    mostrarMesSvg(raiz, eur, kVivo, exemplo);
    if (passo === 4) cursorGrafico(raiz, grafico, eur, kVivo);
  }, [eur, kVivo, exemplo, passo, grafico]);

  if (eur.length === 0) {
    return (
      <CenaDePerto quem={T.banQuem} fonte={D.fonte} aoFechar={aoFechar} rotuloArte={T.banRotuloArte}>
        <p className="b-fala">A série da Euribor não chegou — a cena precisa dela para existir.</p>
      </CenaDePerto>
    );
  }

  const a = eur[idxMin];
  const b = eur[idxMax];
  const hoje = eur[idxHoje];
  const pa = prestacaoDe(exemplo.capital, exemplo.anos, a.v, exemplo.spread);
  const pb = prestacaoDe(exemplo.capital, exemplo.anos, b.v, exemplo.spread);
  const ph = prestacaoDe(exemplo.capital, exemplo.anos, hoje.v, exemplo.spread);
  const dif = Math.abs(palpite - pb);
  const juizo =
    dif <= 25 ? "Acertaste em cheio!" : dif <= 80 ? "Quase!" : palpite < pb ? "Mais do que pensavas!" : "Um pouco menos!";

  const juro1a = (exemplo.capital * (eur[kVivo].v + exemplo.spread)) / 100 / 12;
  const prK = prestacaoDe(exemplo.capital, exemplo.anos, eur[kVivo].v, exemplo.spread);
  const frJuros = Math.max(0, Math.min(1, juro1a / prK));
  // o palpite arranca a 1,3× da prestação do mês mais barato
  const palpiteInicial = Math.round((pa * 1.3) / 10) * 10;
  const palpiteEfetivo = palpite || palpiteInicial;

  return (
    <CenaDePerto
      quem={T.banQuem}
      fonte={D.fonte}
      aoFechar={aoFechar}
      arteHtml={interior}
      refArte={arteRef}
      rotuloArte={T.banRotuloArte}
    >
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.banFala1
              : passo === 2
                ? T.banFala2(fmtEUR(exemplo.capital), exemplo.anos)
                : passo === 3
                  ? T.banResposta(juizo, mesLongo(b.t), fmtEUR(pb), mesLongo(a.t), fmtEUR(pb - pa))
                  : T.banFala4,
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={() => setPasso(2)}>
            {T.banBtnSenha}
          </button>
        )}
        {passo === 2 && (
          <>
            <p className="pergunta-fin">{T.banPalpite(mesLongo(a.t), fmtEUR(pa), mesLongo(b.t))}</p>
            <div className="b-palpite">
              <output htmlFor="banPal">{fmtEUR(palpiteEfetivo)}</output>
              <input
                id="banPal"
                type="range"
                min={Math.round(pa / 10) * 10}
                max={Math.round((pa * 2.4) / 10) * 10}
                step={10}
                value={palpiteEfetivo}
                onChange={(e) => setPalpite(+e.target.value)}
                aria-label={T.banPalpiteAria}
              />
            </div>
            <p className="nota-fin">{T.banNotaExemplo(pct2(exemplo.spread))}</p>
            <button className="b-btn" type="button" onClick={() => setPasso(3)}>
              {T.banBtnResposta}
            </button>
          </>
        )}
        {passo === 3 && (
          <>
            {T.banExplica(pct2(a.v), pct2(b.v)).map((p, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
            <p>
              Em {mesLongo(a.t)}: {fmtEUR(pa)}/mês · em {mesLongo(b.t)}: <b className="b-r">{fmtEUR(pb)}/mês</b>
            </p>
            <button className="b-btn" type="button" onClick={() => { setKEscolhido(idxMax); setPasso(4); }}>
              {T.finBtnGrafico}
            </button>
          </>
        )}
        {passo === 4 && (
          <>
            {/* o gráfico fica na coluna da conversa (`.b-corpo`), como no
                protótipo — nunca dentro do desenho */}
            <div dangerouslySetInnerHTML={{ __html: grafico.svg }} />
            <p>{T.banGraficoTexto(mesLongo(hoje.t), pct2(hoje.v), fmtEUR(ph))}</p>
            <p className="nota-fin">{T.banNotaGrafico}</p>
            <div className="b-calc">
              <label htmlFor="banTempo">
                <b>{T.banCalcTempo}</b> <output htmlFor="banTempo">{mesCurto(eur[kVivo].t)}</output>
              </label>
              <input
                id="banTempo"
                type="range"
                min={0}
                max={eur.length - 1}
                step={1}
                value={kVivo}
                onChange={(e) => setKEscolhido(+e.target.value)}
              />
              <div className="b-calc-linha">
                <span>{T.banCalcEur}</span>
                <b>{pct2(eur[kVivo].v)}</b>
              </div>
              <div className="b-calc-linha">
                <span>{T.banCalcTan}</span>
                <b>{pct2(eur[kVivo].v + exemplo.spread)}</b>
              </div>
              <div className="b-calc-linha">
                <span>{T.banCalcPrest}</span>
                <b className="b-r">{fmtEUR(prK)}</b>
              </div>
              <div className="b-calc-linha">
                <span>{T.banCalcJuros}</span>
                <b>{T.banJurosDe(fmtEUR(Math.max(0, juro1a)), fmtEUR(prK))}</b>
              </div>
              <div className="b-barra-juros" aria-hidden="true">
                <span className="b-bj" style={{ width: `${(frJuros * 100).toFixed(1)}%` }}>
                  {frJuros > 0.18 ? T.banRotJuros : ""}
                </span>
                <span className="b-bc" style={{ width: `${((1 - frJuros) * 100).toFixed(1)}%` }}>
                  {frJuros < 0.82 ? T.banRotCasa : ""}
                </span>
              </div>
              <details className="b-exemplo">
                <summary>{T.banExemplo(fmtEUR(exemplo.capital), exemplo.anos, pct2(exemplo.spread))}</summary>
                <label htmlFor="banCap">
                  {T.banExemploCap} <output htmlFor="banCap">{fmtEUR(exemplo.capital)}</output>
                </label>
                <input
                  id="banCap"
                  type="range"
                  min={50000}
                  max={400000}
                  step={5000}
                  value={exemplo.capital}
                  onChange={(e) => setExemplo({ ...exemplo, capital: +e.target.value })}
                />
                <label htmlFor="banAnos">
                  {T.banExemploAnos(exemplo.anos)} <output htmlFor="banAnos">{exemplo.anos}</output>
                </label>
                <input
                  id="banAnos"
                  type="range"
                  min={10}
                  max={40}
                  step={1}
                  value={exemplo.anos}
                  onChange={(e) => setExemplo({ ...exemplo, anos: +e.target.value })}
                />
                <label htmlFor="banSpread">
                  {T.banExemploSpread} <output htmlFor="banSpread">{pct2(exemplo.spread)}</output>
                </label>
                <input
                  id="banSpread"
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.05}
                  value={exemplo.spread}
                  onChange={(e) => setExemplo({ ...exemplo, spread: +e.target.value })}
                />
              </details>
            </div>
            <button className="b-btn b-claro" type="button" onClick={aoFechar}>
              {T.finBtnVoltar}
            </button>
          </>
        )}
      </div>
      <div className="b-acoes" />
    </CenaDePerto>
  );
}
