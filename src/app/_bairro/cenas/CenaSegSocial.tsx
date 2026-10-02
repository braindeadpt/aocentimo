"use client";

/**
 * A cena da Segurança Social (P2b) — o recibo com a TSU e o bolo comum.
 *
 * A porta de `cenaSegSocial()` do protótipo (`cenas-bairro.js`), com a
 * disciplina da casa:
 *
 *   - os valores da Inês são a MESMA linha de `cenarios-salario.json`
 *     que a Fábrica lê — chegam por prop, a cena nunca reconta;
 *   - o Pedro a recibos verdes vem calculado do servidor por
 *     `simularIndependente` — aqui só se lê `ssMensal`;
 *   - a chuva de moedas e o nível do mealheiro animam por GSAP só com
 *     movimento activo; em reduced-motion o valor final está no DOM;
 *   - os ids da arte (`ssPainel`, `ssNivel`, `ssMealTxt`…) são os do
 *     protótipo e vivem no string SVG — a árvore React não os conhece.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtEUR, fmtNum, fmtPct } from "@/lib/format";
import type { DadosSegSocial } from "./dados-p2b";
import { barrasQuem, interiorSegSocial, moedaSvg, nivel, reciboInes } from "./segsocial-arte";
import CenaDePerto from "./CenaDePerto";
import * as T from "./textos-p2b";

export default function CenaSegSocial({ D, aoFechar }: { D: DadosSegSocial; aoFechar: () => void }) {
  /** 1 senha · 2 palpite · 3 o recibo e o bolo · 4 o Pedro a recibos verdes. */
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState(200);
  const [rodada, setRodada] = useState(0);
  const arteRef = useRef<HTMLDivElement>(null);
  const vivo = useRef(true);
  const tweens = useRef<{ kill: () => void }[]>([]);
  useEffect(() => {
    vivo.current = true;
    const tw = tweens.current;
    return () => {
      vivo.current = false;
      tw.forEach((t) => t.kill());
    };
  }, []);

  const interior = useMemo(() => interiorSegSocial(), []);
  const ines = D.ines;
  const total = ines ? ines.ss + ines.tsu : null;

  /* ————— a chuva de moedas no mealheiro ————— */
  const chuva = async (quantas: number, cor: string, x0: number) => {
    const raiz = arteRef.current;
    const g = raiz?.querySelector("#ssMoedas");
    if (!raiz || !g) return;
    const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
    if (!motionActiva()) return;
    const { gsap } = await carregarGsap();
    if (!vivo.current) return;
    for (let k = 0; k < quantas; k++) {
      const m = document.createElementNS("http://www.w3.org/2000/svg", "g");
      m.innerHTML = moedaSvg(0, 0, 10);
      m.querySelector("circle")?.setAttribute("fill", cor);
      g.appendChild(m);
      tweens.current.push(
        gsap.fromTo(
          m,
          { x: x0, y: 180, opacity: 1 },
          {
            x: 400 + Math.random() * 120,
            y: 380 - Math.random() * 30,
            duration: 0.9,
            delay: k * 0.12,
            ease: "power2.in",
            onComplete: () => gsap.to(m, { opacity: 0, duration: 0.3, delay: 0.3 }),
          }
        )
      );
    }
  };

  /* ————— o nível sobe ao total — estado final escrito sempre ————— */
  const subirNivel = async (v: number, anima: boolean) => {
    const raiz = arteRef.current;
    if (!raiz) return;
    const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
    if (!anima || !motionActiva()) {
      nivel(raiz, v);
      return;
    }
    const { gsap } = await carregarGsap();
    if (!vivo.current) return;
    const alvo = nivel(raiz, v); // escreve o texto final já; o rect tweena até lá
    const el = raiz.querySelector("#ssNivel");
    if (el) {
      el.setAttribute("y", "404");
      el.setAttribute("height", "0");
      tweens.current.push(
        gsap.to(el, { attr: { y: alvo.y, height: alvo.h }, duration: 1.2, delay: 0.6 })
      );
    }
  };

  /* ————— a senha pisca e a funcionária acena ————— */
  const chamarSenha = async () => {
    const raiz = arteRef.current;
    const p = raiz?.querySelector("#ssPainel");
    const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
    if (!motionActiva()) {
      if (p) p.textContent = T.ssSenha;
      if (vivo.current) setPasso(2);
      return;
    }
    const { gsap } = await carregarGsap();
    if (!vivo.current) return;
    if (p)
      gsap
        .timeline()
        .to(p, { opacity: 0, duration: 0.12, repeat: 3, yoyo: true })
        .add(() => {
          p.textContent = T.ssSenha;
        });
    const braco = raiz?.querySelectorAll("#ssFunc .braco-d");
    if (braco?.length)
      gsap
        .timeline({ delay: 0.4 })
        .to(braco, { rotation: -150, transformOrigin: "50% 0%", duration: 0.25 })
        .to(braco, { rotation: 0, duration: 0.3, delay: 0.5 });
    gsap.delayedCall(0.9, () => vivo.current && setPasso(2));
  };

  // ao entrar no passo 3: moedas dela (laranja) e da empresa (amarelo), depois o nível
  useEffect(() => {
    if (passo !== 3 || total === null) return;
    chuva(6, "#f0a468", 340);
    const t = setTimeout(() => chuva(10, "#ffc62b", 120), 700);
    subirNivel(total, true);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, rodada]);

  // ao recomeçar: esvazia o mealheiro e a senha volta a «A 106»
  useEffect(() => {
    const raiz = arteRef.current;
    if (!raiz || rodada === 0) return;
    nivel(raiz, 0);
    const p = raiz.querySelector("#ssPainel");
    if (p) p.textContent = "A 106";
    const m = raiz.querySelector("#ssMoedas");
    if (m) m.innerHTML = "";
  }, [rodada]);

  const juizo = total === null ? "" : T.ssJuizo(palpite, total);
  const fala =
    passo === 1
      ? T.ssFala1
      : passo === 2
        ? ines
          ? T.ssFala2(fmtEUR(ines.bruto))
          : T.ssSemDados
        : passo === 3
          ? total === null
            ? T.ssSemDados
            : T.ssResposta(juizo, fmtEUR(total), fmtEUR(total * 14))
          : T.ssFala4;

  const voltar = (
    <button className="b-btn b-claro" type="button" onClick={aoFechar}>
      {T.ssBtnVoltar}
    </button>
  );
  const outra = (
    <button
      className="b-btn b-claro"
      type="button"
      onClick={() => {
        setPasso(1);
        setPalpite(200);
        setRodada((r) => r + 1);
      }}
    >
      {T.ssBtnOutra}
    </button>
  );

  const tx = D.taxas;
  const barras = useMemo(() => {
    if (!ines || !D.pedro) return "";
    const inesEla = tx.trab * 100;
    const inesEmp = tx.emp * 100;
    return barrasQuem({
      inesEla,
      inesEmp,
      pedro: D.pedro.por100,
      aria: T.ssBarrasAria(fmtEUR(inesEla), fmtEUR(inesEmp), fmtEUR(D.pedro.por100)),
      textos: {
        ines: T.ssNomeInes,
        pedro: T.ssNomePedro,
        ela: T.ssEla(fmtEUR(inesEla)),
        empresa: T.ssEmpresa(fmtEUR(inesEmp)),
        ele: T.ssEle(fmtEUR(D.pedro.por100)),
        legenda: T.ssBarrasLegenda,
      },
    });
  }, [ines, D.pedro, tx]);

  return (
    <CenaDePerto quem={T.ssQuem} fonte={D.fonte} aoFechar={aoFechar} arteHtml={interior} refArte={arteRef} rotuloArte={T.ssRotuloArte}>
      <p className="b-fala" aria-live="polite" dangerouslySetInnerHTML={{ __html: fala }} />
      <div className="b-corpo">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={chamarSenha}>
            {T.ssBtnSenha(T.ssSenha)}
          </button>
        )}
        {passo === 2 && ines && (
          <>
            <p className="pergunta-fin">{T.ssPalpite}</p>
            <div className="b-palpite">
              <output htmlFor="ssPal">{fmtEUR(palpite)}</output>
              <input
                id="ssPal"
                type="range"
                min={0}
                max={900}
                step={5}
                value={palpite}
                onChange={(e) => setPalpite(+e.target.value)}
                aria-label={T.ssPalpiteAria}
              />
            </div>
            <button className="b-btn" type="button" onClick={() => setPasso(3)}>
              {T.ssBtnResposta}
            </button>
          </>
        )}
        {passo === 2 && !ines && <div className="opcoes">{voltar}</div>}
        {passo === 3 && ines && total !== null && (
          <>
            <div
              dangerouslySetInnerHTML={{
                __html: reciboInes({
                  linhas: {
                    bruto: fmtEUR(ines.bruto),
                    ss: fmtEUR(ines.ss),
                    tsu: fmtEUR(ines.tsu),
                    total: fmtEUR(total),
                  },
                  textos: {
                    cab: T.ssReciboCab,
                    bruto: T.ssReciboBruto,
                    ss: T.ssReciboSS(fmtPct(tx.trab, 0)),
                    sub: T.ssReciboSub,
                    tsu: T.ssReciboTsu(fmtPct(tx.emp, 2)),
                    total: T.ssReciboTotal,
                  },
                }),
              }}
            />
            <p dangerouslySetInnerHTML={{ __html: T.ssExplica(fmtEUR(ines.ss), fmtEUR(ines.tsu), fmtEUR(ines.custo), fmtEUR(ines.bruto)) }} />
            <p dangerouslySetInnerHTML={{ __html: T.ssBolo }} />
            <button className="b-btn" type="button" onClick={() => setPasso(4)}>
              {T.ssBtnPedro}
            </button>
          </>
        )}
        {passo === 4 && (!ines || !D.pedro) && <div className="opcoes">{voltar}</div>}
        {passo === 4 && ines && D.pedro && (
          <>
            <p
              dangerouslySetInnerHTML={{
                __html: T.ssPedroTexto(
                  fmtEUR(D.pedro.fatura),
                  fmtPct(tx.catbTaxa, 1),
                  fmtPct(tx.catbRr, 0),
                  fmtEUR(D.pedro.ssMensal),
                  tx.isencao
                ),
              }}
            />
            <div dangerouslySetInnerHTML={{ __html: barras }} />
            <p
              dangerouslySetInnerHTML={{
                __html: T.ssCompara(fmtEUR((tx.trab + tx.emp) * 100), fmtEUR(D.pedro.por100), fmtEUR(tx.trab * 100)),
              }}
            />
            <p className="nota-fin">
              {T.ssNotaCatb(
                fmtPct(tx.catbRr, 0),
                `${fmtNum(tx.baseMinIas, 1)}`,
                `IAS ${fmtEUR(tx.ias)}`,
                fmtEUR(tx.baseMinIas * tx.ias),
                tx.isencao,
                fmtPct(tx.retencao, 0)
              )}
            </p>
            <div className="opcoes">
              {voltar}
              {outra}
              <a className="b-btn" href="/salario">
                {T.ssBtnSalario}
              </a>
            </div>
          </>
        )}
      </div>
      <div className="b-acoes" />
    </CenaDePerto>
  );
}
