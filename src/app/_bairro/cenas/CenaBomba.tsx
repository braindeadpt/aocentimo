"use client";

/**
 * A cena da Bomba (P2b) — o litro por dentro: o garrafão que se enche
 * por camadas (combustível, ISP, carbono, IVA), o IVA sobre os outros
 * impostos a tracejado, e o gráfico DGEG dos preços.
 *
 * A porta de `cenaBomba()` do protótipo (`cena-bomba.js`), com a
 * disciplina da casa:
 *
 *   - a decomposição NÃO se refaz aqui: chega pronta do servidor, que
 *     chamou `decomporCombustivel` do motor com o ISP/carbono da
 *     portaria em vigor (`isp.json`) e o IVA normal (`iva.json`);
 *   - o gráfico começa na PRIMEIRA data real da série DGEG — o «desde
 *     quando» chega por prop, nunca escrito à mão;
 *   - o mostrador e as camadas animam por GSAP só com movimento activo;
 *     em reduced-motion escreve-se o estado final.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtEUR, fmtEUR0, fmtNum, fmtPct } from "@/lib/format";
import type { CombCena, DadosBomba } from "./dados-p2b";
import { aplicarJarra, CAM, interiorBomba, JR, mostrador, graficoComb, rotulosJarra, type Dec } from "./bomba-arte";
import { pontosDeDias } from "./utils";
import { mesCurto, mesLongo } from "./mercearia-arte";
import CenaDePerto from "./CenaDePerto";
import * as T from "./textos-p2b";

/** «0,444 €» — o EURO(v, 3) do protótipo, por format.ts. */
const eur3 = (v: number) => `${fmtNum(v, 3)} €`;

export default function CenaBomba({ D, aoFechar }: { D: DadosBomba; aoFechar: () => void }) {
  /** 1 palpite · 2 o litro por camadas · 3 o gráfico. */
  const [passo, setPasso] = useState(1);
  const [palpite, setPalpite] = useState<number | null>(null);
  const [comb, setComb] = useState<"gasolina" | "gasoleo">("gasolina");
  const [rodada, setRodada] = useState(0);
  const arteRef = useRef<HTMLDivElement>(null);
  const vivo = useRef(true);
  const tweens = useRef<{ kill: () => void }[]>([]);
  const ultimoComb = useRef(comb);
  useEffect(() => {
    vivo.current = true;
    const tw = tweens.current;
    return () => {
      vivo.current = false;
      tw.forEach((t) => t.kill());
    };
  }, []);

  const interior = useMemo(() => interiorBomba(), []);
  const c: CombCena = comb === "gasolina" ? D.gasolina : D.gasoleo;
  const litros = D.litros;
  const temPreco = c.preco !== null && c.dec !== null;
  const total = temPreco ? c.preco! * litros : null;
  const impostos = c.dec ? c.dec.impostos * litros : null;
  const palpiteV = palpite ?? (total === null ? 0 : Math.round(total * 0.25));

  /* ————— o mostrador corre até ao total e PARA ————— */
  const correrMostrador = async (cc: CombCena, anima: boolean) => {
    const raiz = arteRef.current;
    if (!raiz || cc.preco === null) return;
    const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
    if (!anima || !motionActiva()) {
      mostrador(raiz, cc.nome, cc.preco * litros, litros);
      return;
    }
    const { gsap } = await carregarGsap();
    if (!vivo.current) return;
    const o = { e: 0, l: 0 };
    tweens.current.push(
      gsap.to(o, {
        e: cc.preco * litros,
        l: litros,
        duration: 2.2,
        ease: "none",
        onUpdate: () => mostrador(raiz, cc.nome, o.e, o.l),
        onComplete: () => mostrador(raiz, cc.nome, cc.preco! * litros, litros),
      })
    );
  };

  /* ————— a jarra enche por camadas (e os rótulos aparecem no fim) ————— */
  const encher = async (dec: Dec, anima: boolean) => {
    const raiz = arteRef.current;
    if (!raiz) return;
    const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
    if (!anima || !motionActiva()) {
      aplicarJarra(raiz, dec);
      const rot = raiz.querySelector<SVGGElement>("#bmbRot");
      if (rot) rot.style.opacity = "1";
      return;
    }
    const { gsap } = await carregarGsap();
    if (!vivo.current) return;
    const alvos = alvosDaJarra(dec);
    alvos.forEach(({ cam, y, h }, n) => {
      const el = raiz.querySelector(`#cam-${cam}`);
      if (!el) return;
      tweens.current.push(
        gsap.fromTo(el, { attr: { y, height: 0 } }, { attr: { y, height: h }, duration: 0.5, delay: n * 0.45, ease: "power1.out" })
      );
    });
    const eli = raiz.querySelector("#cam-ivaimp");
    if (eli) {
      const yImp = alvos.reduce<number>((m, a) => Math.min(m, a.y), JR.base);
      tweens.current.push(
        gsap.fromTo(eli, { attr: { y: yImp, height: 0 } }, { attr: { y: yImp, height: dec.ivaSobreImp * (JR.alt / dec.precoFinal) }, duration: 0.4, delay: 2, ease: "power1.out" })
      );
    }
    const rot = raiz.querySelector<SVGGElement>("#bmbRot");
    if (rot)
      tweens.current.push(
        gsap.fromTo(
          rot,
          { opacity: 0 },
          { opacity: 1, duration: 0.4, delay: 1.9, onStart: () => rotulosJarra(raiz, dec) }
        )
      );
  };

  const resetArte = () => {
    const raiz = arteRef.current;
    if (!raiz) return;
    tweens.current.forEach((t) => t.kill());
    tweens.current = [];
    for (const id of [...CAM.map(([k]) => `cam-${k}`), "cam-ivaimp"]) {
      const el = raiz.querySelector(`#${id}`);
      el?.setAttribute("y", "402");
      el?.setAttribute("height", "0");
    }
    const rot = raiz.querySelector("#bmbRot");
    if (rot) rot.innerHTML = "";
  };

  useEffect(() => {
    // no passo 3 o litro fica cheio, como no protótipo
    if (passo === 3) return;
    resetArte();
    if (passo === 1 && D.gasolina.preco !== null) {
      mostrador(arteRef.current!, D.gasolina.nome, 0, 0);
    }
    if (passo === 2 && D.gasolina.dec) {
      correrMostrador(D.gasolina, true);
      const t = setTimeout(() => {
        if (ultimoComb.current === "gasolina") encher(D.gasolina.dec!, true);
      }, 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passo, rodada, D]);

  /* troca de combustível dentro do passo 2 — camadas animadas, mostrador
     instantâneo (o protótipo não reanima o contador ao trocar). A entrada
     no passo 2 já enche a gasolina — o efeito só corre quando o combustível
     muda mesmo. */
  useEffect(() => {
    const mudou = ultimoComb.current !== comb;
    ultimoComb.current = comb;
    if (!mudou || passo !== 2 || !c.dec || c.preco === null) return;
    resetArte();
    encher(c.dec, true);
    mostrador(arteRef.current!, c.nome, c.preco * litros, litros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comb, passo]);

  const grafico = useMemo(() => {
    if (!D.gasolina.serie || !D.gasoleo.serie) return "";
    const a = pontosDeDias(D.gasolina.serie);
    const km = a.reduce((m, p, k) => (p.v > a[m].v ? k : m), 0);
    const kn = a.reduce((m, p, k) => (p.v < a[m].v ? k : m), 0);
    return graficoComb(
      D.gasolina.serie,
      D.gasoleo.serie,
      T.bmbGraficoAria(mesCurto(a[0].t), eur3(a[km].v), mesLongo(a[km].t), eur3(a[kn].v), mesLongo(a[kn].t))
    );
  }, [D]);

  const inicioSerie = D.gasolina.serie ? D.gasolina.serie.inicio.slice(0, 4) : "—";

  const juizo =
    impostos === null ? "" : T.bmbJuizo(Math.abs(palpiteV - impostos), palpiteV, impostos);

  const fala =
    passo === 1
      ? temPreco
        ? T.bmbFala1(litros, D.gasolina.nome, eur3(D.gasolina.preco!))
        : T.bmbSemDados
      : passo === 2
        ? impostos === null || total === null
          ? T.bmbSemDados
          : comb === "gasolina"
            ? T.bmbResposta(juizo, fmtEUR(total), fmtEUR(impostos), fmtPct(c.dec!.pesoImpostos, 0))
            : T.bmbRespostaTroca(c.nome, fmtEUR(total), fmtEUR(impostos), fmtPct(c.dec!.pesoImpostos, 0))
        : T.bmbFala3(inicioSerie);

  const voltar = (
    <button className="b-btn b-claro" type="button" onClick={aoFechar}>
      {T.bmbBtnVoltar}
    </button>
  );
  const outra = (
    <button
      className="b-btn b-claro"
      type="button"
      onClick={() => {
        setPasso(1);
        setPalpite(null);
        setComb("gasolina");
        setRodada((r) => r + 1);
      }}
    >
      {T.bmbBtnOutra}
    </button>
  );

  const d = c.dec;

  return (
    <CenaDePerto quem={T.bmbQuem} fonte={D.fonte} aoFechar={aoFechar} arteHtml={interior} refArte={arteRef} rotuloArte={T.bmbRotuloArte}>
      <p className="b-fala" aria-live="polite" dangerouslySetInnerHTML={{ __html: fala }} />
      <div className="b-corpo">
        {passo === 1 && temPreco && (
          <>
            <p className="pergunta-fin" dangerouslySetInnerHTML={{ __html: T.bmbPalpite(fmtEUR(total!)) }} />
            <div className="b-palpite">
              <output htmlFor="bmbPal">{fmtEUR0(palpiteV)}</output>
              <input
                id="bmbPal"
                type="range"
                min={0}
                max={Math.round(total!)}
                step={1}
                value={palpiteV}
                onChange={(e) => setPalpite(+e.target.value)}
                aria-label={T.bmbPalpiteAria}
              />
            </div>
            <button className="b-btn" type="button" onClick={() => setPasso(2)}>
              {T.bmbBtnAtestar}
            </button>
          </>
        )}
        {passo === 1 && !temPreco && <div className="opcoes">{voltar}</div>}
        {passo === 2 && d && (
          <>
            <p dangerouslySetInnerHTML={{ __html: T.bmbExplica }} />
            <div className="opcoes" role="group" aria-label={T.bmbCombustiveisAria}>
              {([D.gasolina, D.gasoleo] as const).map((cc) => (
                <button
                  key={cc.id}
                  className={`b-btn b-claro${comb === cc.id ? " b-ligado" : ""}`}
                  type="button"
                  aria-pressed={comb === cc.id}
                  onClick={() => setComb(cc.id)}
                >
                  {cc.nome}
                </button>
              ))}
            </div>
            <div className="b-calc">
              {[...CAM].reverse().map(([k, nome]) => (
                <div className="b-calc-linha" key={k}>
                  <span>{nome === "Combustível e distribuição" ? T.bmbCamProduto : nome === "ISP" ? T.bmbCamIsp : nome === "Taxa de carbono" ? T.bmbCamCarbono : T.bmbCamIva}</span>
                  <b className={k === "produto" ? "" : "b-r"}>{eur3(d[k])}</b>
                </div>
              ))}
              <div className="b-calc-linha">
                <span>
                  <b>{T.bmbImpostosLitro}</b>
                </span>
                <b className="b-r">
                  {eur3(d.impostos)} · {fmtPct(d.pesoImpostos, 0)}
                </b>
              </div>
              <div className="b-calc-linha">
                <span>{T.bmbDeposito(litros)}</span>
                <b className="b-r">
                  {fmtEUR(d.impostos * litros)} de {fmtEUR(c.preco! * litros)}
                </b>
              </div>
            </div>
            <p dangerouslySetInnerHTML={{ __html: T.bmbIvaSobreImp(eur3(d.ivaSobreImp)) }} />
            <p className="nota-fin">
              {T.bmbNotaIsp(D.ispVigencia.split("-").reverse().join("/"), c.notaIsp, (c.data ?? "").split("-").reverse().join("/"))}
            </p>
            <button className="b-btn" type="button" onClick={() => setPasso(3)}>
              {T.bmbBtnGrafico}
            </button>
          </>
        )}
        {passo === 3 && (
          <>
            {grafico ? <div dangerouslySetInnerHTML={{ __html: grafico }} /> : <p className="nota-fin">{T.bmbSemSerie}</p>}
            <p dangerouslySetInnerHTML={{ __html: T.bmbGraficoTexto }} />
            <p className="nota-fin">{T.bmbNotaGrafico}</p>
            <div className="opcoes">
              {voltar}
              {outra}
              <a className="b-btn" href="/precos">
                {T.bmbBtnPrecos}
              </a>
            </div>
          </>
        )}
      </div>
      <div className="b-acoes" />
    </CenaDePerto>
  );
}

/* ————— helpers que lêem a jarra sem saber desenhá-la ————— */

function alvosDaJarra(d: Dec): { cam: (typeof CAM)[number][0]; y: number; h: number }[] {
  let y: number = JR.base;
  const esc = JR.alt / d.precoFinal;
  return CAM.map(([k]) => {
    const h = d[k] * esc;
    const topo = y - h;
    y = topo;
    return { cam: k, y: topo, h };
  });
}
