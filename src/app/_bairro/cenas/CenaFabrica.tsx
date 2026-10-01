"use client";

/**
 * A cena da Fábrica (P2a) — o salário corre pelas ruas do bairro.
 *
 * A porta de `cenaSalario()` do protótipo (`mapa.tpl.html`), com as
 * diferenças que a infraestrutura P1 obriga:
 *
 *   - não há `P()` nem `PT` no cliente: as rotas chegam já projetadas
 *     pelo servidor (`DadosFabrica.rotas`, píxeis do mundo congelados);
 *   - as moedas voam nas camadas de movimento (`#b-movA`/`#b-movB`) por
 *     GSAP — o mesmo `carregarGsap` da animação ambiente: nunca no
 *     bundle inicial, nunca descarregado com `prefers-reduced-motion`;
 *   - SEM GSAP (ou sem movimento), a cena escreve DIRETO o estado final:
 *     os totais no contador e a última fala — o que importa continua no
 *     HTML/DOM, como manda o PACK («estado final sem animação»).
 *
 * O painel é o `.b-painel` do P1 (o CSS já existe); as etiquetas
 * azuis/vermelhas/verdes caem em `#b-gEtiq`, como no protótipo.
 */
import { useEffect, useRef, useState } from "react";
import { fmtEUR } from "@/lib/format";
import type { DadosFabrica } from "./dados";
import * as T from "./textos";

/** A moeda do salário (o `moeda()` do protótipo). */
const MOEDA_SVG =
  `<ellipse cx="0" cy="2" rx="9" ry="4" fill="rgba(22,19,15,.2)"/>` +
  `<circle cy="-8" r="9" fill="#f0a468" stroke="#16130f" stroke-width="2.6"/>` +
  `<text y="-4.5" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="10" fill="#16130f">€</text>`;

/** A etiqueta colorida que cai no mapa (a `etiqueta()` do protótipo). */
function etiquetaSvg(txt: string, cor: string): string {
  const w = txt.length * 10.5 + 24;
  return (
    `<rect x="${-w / 2}" y="-18" width="${w}" height="32" rx="10" fill="${cor}" stroke="#16130f" stroke-width="2.6"/>` +
    `<text y="4" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" fill="#fff">${txt}</text>`
  );
}

interface PropsFabrica {
  D: DadosFabrica;
  /** O SVG do mapa — é aqui dentro que as moedas nascem e morrem. */
  mundoRef: React.RefObject<HTMLDivElement | null>;
  /** A câmara, para a cena a mover (o mesmo objecto do zoom). */
  camaraRef: React.MutableRefObject<{
    ir: (cx: number, cy: number, w: number, dur?: number, desvio?: number) => void;
    /** A vista de agora — a cena lê-a para medir o painel contra o mapa. */
    atual: { x: number; y: number; w: number; h: number };
  } | null>;
  /** Fechar: o pai limpa o mapa e devolve o foco ao edifício. */
  aoFechar: () => void;
}

export default function CenaFabrica({ D, mundoRef, camaraRef, aoFechar }: PropsFabrica) {
  const [totais, setTotais] = useState({ ss: 0, irs: 0, casa: 0 });
  /** O passo da história: 1 fábrica · 2 SS · 3 Finanças · 4 rua · 99 fim. */
  const [passo, setPasso] = useState(1);
  /** A corrida das moedas: montagem + cada «Ver outra vez». O `passo`
      NÃO pode dispará-la — é o próprio timeline que o muda. */
  const [rodada, setRodada] = useState(0);
  const aoPasso = setPasso;
  const focoRef = useRef<HTMLSpanElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  // o foco entra no título, como nas cenas com moldura (PACK §2.3)
  useEffect(() => {
    focoRef.current?.focus();
  }, []);

  // a Fábrica não usa a moldura `CenaDePerto` — o Escape é dela
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  const l = D.linha;
  const rotas = D.rotas;

  /* ————— a corrida das moedas ————— */
  useEffect(() => {
    if (!l || !rotas) return;
    const mundo = mundoRef.current;
    if (!mundo) return;

    const movA = mundo.querySelector("#b-movA");
    const movB = mundo.querySelector("#b-movB");
    const gEtiq = mundo.querySelector("#b-gEtiq");
    if (!movA || !movB || !gEtiq) return;

    // `morto` é LOCAL a cada execução: a bandeira de uma corrida velha não
    // pode ressuscitar-se quando a nova a repõe (era o que `mortoRef`
    // partilhado fazia — e pior, o efeito com deps [passo] matava a
    // corrida assim que o timeline chamava aoPasso(2)).
    let morto = false;

    // limpeza de moedas de corridas anteriores
    mundo.querySelectorAll(".moeda-salario").forEach((m) => m.remove());
    gEtiq.innerHTML = "";

    const NS = "http://www.w3.org/2000/svg";
    const n = D.moedas ?? { ss: 7, irs: 6, casa: 7 };
    const frac = { ss: (l.tsu + l.ss) / n.ss, irs: l.irs / n.irs, casa: l.liquido / n.casa };

    const lista: { dest: "ss" | "irs" | "casa" }[] = [
      ...Array.from({ length: n.ss }, () => ({ dest: "ss" as const })),
      ...Array.from({ length: n.irs }, () => ({ dest: "irs" as const })),
      ...Array.from({ length: n.casa }, () => ({ dest: "casa" as const })),
    ];

    const somar = (dest: "ss" | "irs" | "casa") =>
      setTotais((t) => ({
        ss: t.ss + (dest === "ss" ? frac.ss : 0),
        irs: t.irs + (dest === "irs" ? frac.irs : 0),
        casa: t.casa + (dest === "casa" ? frac.casa : 0),
      }));

    let limpar = () => {};
    const tls: { kill: () => void }[] = [];

    (async () => {
      const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
      if (!motionActiva() || morto) {
        // SEM ANIMAÇÃO: o estado final, direto — é isto que o e2e vê
        setTotais({ ss: l.tsu + l.ss, irs: l.irs, casa: l.liquido });
        aoPasso(99); // a fala final
        return;
      }
      const { gsap } = await carregarGsap();
      if (morto) return;

      // a fábrica e o percurso ficam À VISTA, ao lado do painel que os
      // tapava (revisão do dono). Mede-se o edifício, o painel e a vista
      // actual no ecrã; das posições de ecrã recuperam-se as coordenadas
      // do mundo e a câmara enquadra o edifício no centro da faixa livre
      // — no desktop o painel cobre a esquerda e a faixa livre é à
      // direita; no telemóvel o painel está em cima e o alvo desce.
      const ini = rotas.ss[0];
      const janela = mundo.closest(".b-janela");
      const ed = mundo.querySelector('.ed[data-id="fabrica"]');
      const painel = painelRef.current;
      const cam = camaraRef.current;
      let cx = ini.x + 180;
      let cy = ini.y + 40;
      let w = 820;
      if (janela && ed && painel && cam) {
        const jr = janela.getBoundingClientRect();
        const pr = painel.getBoundingClientRect();
        const er = ed.getBoundingClientRect();
        const vista = cam.atual;
        if (jr.width > 0 && vista.w > 0) {
          const FOLGA = 14;
          const sCur = jr.width / vista.w;
          // o edifício em unidades do mundo, recuperado do ecrã
          const ecx = vista.x + (er.left + er.width / 2 - jr.left) / sCur;
          const ecy = vista.y + (er.top + er.height / 2 - jr.top) / sCur;
          const razao = jr.height / jr.width;
          if (jr.width <= 700) {
            // painel em cima — o alvo desce para o centro da faixa livre
            const topo = pr.bottom - jr.top + FOLGA;
            const livre = Math.max(80, jr.height - topo - FOLGA);
            const sy = topo + livre / 2;
            const s = jr.width / w;
            cx = ecx;
            cy = ecy - sy / s + (w * razao) / 2;
          } else {
            // painel à esquerda — a faixa livre é à direita; se o
            // edifício for mais largo que ela, a vista afasta até caber
            const livreE = pr.right - jr.left + FOLGA;
            const livreW = Math.max(200, jr.width - livreE - FOLGA);
            w = Math.max(820, Math.min(1600, ((er.width / sCur) * jr.width) / livreW));
            const s = jr.width / w;
            cx = ecx + w / 2 - (livreE + livreW / 2) / s;
            cy = ecy;
          }
        }
      }
      camaraRef.current?.ir(cx, cy, w, 1, 0);

      lista.forEach(({ dest }, k) => {
        const rota = rotas[dest];
        const m = document.createElementNS(NS, "g");
        m.classList.add("moeda-salario");
        m.innerHTML = MOEDA_SVG;
        (dest === "casa" ? movB : movA).appendChild(m);
        m.style.opacity = "0";

        const tl = gsap.timeline({ delay: 1 + k * 0.16 });
        tls.push(tl);
        const o = { x: rota[0].x, y: rota[0].y };
        tl.set(m, { opacity: 1 });
        rota.slice(1).forEach((p, i) => {
          const dx = p.x - (i === 1 ? rota[0].x : rota[i].x);
          const dy = p.y - (i === 1 ? rota[0].y : rota[i].y);
          tl.to(o, {
            x: p.x,
            y: p.y,
            duration: 0.16,
            ease: "none",
            onUpdate: () => m.setAttribute("transform", `translate(${o.x.toFixed(1)} ${o.y.toFixed(1)})`),
          }, `+=${Math.hypot(dx, dy) / 100}`);
        });
        tl.to(m, {
          opacity: dest === "casa" ? 1 : 0,
          duration: 0.25,
          onComplete: () => {
            if (!morto) somar(dest);
            if (dest !== "casa") m.remove();
          },
        });
      });

      // as etiquetas nos destinos e as falas, no ritmo do protótipo
      const pSS = rotas.ss[rotas.ss.length - 1];
      const pIRS = rotas.irs[rotas.irs.length - 1];
      const pCasa = rotas.casa[rotas.casa.length - 1];
      const etiq = (p: { x: number; y: number }, txt: string, cor: string) => {
        const g = document.createElementNS(NS, "g");
        g.classList.add("moeda-salario");
        g.setAttribute("transform", `translate(${p.x.toFixed(1)} ${(p.y - 172).toFixed(1)})`);
        g.innerHTML = etiquetaSvg(txt, cor);
        gEtiq.appendChild(g);
      };
      const etSS = l.tsu + l.ss;
      const t1 = gsap.timeline({ delay: 1.6 });
      tls.push(t1);
      t1.add(() => !morto && aoPasso(2), 0);
      t1.add(() => !morto && etiq(pSS, "+" + fmtEUR(etSS), "#2445d6"), 1.8);
      t1.add(() => !morto && aoPasso(3), 2.6);
      t1.add(() => !morto && etiq(pIRS, "+" + fmtEUR(l.irs), "#e2412a"), 3.4);
      t1.add(() => !morto && aoPasso(4), 4.2);
      t1.add(() => !morto && etiq(pCasa, fmtEUR(l.liquido), "#0c8f5c"), 5);
      t1.add(() => {
        if (morto) return;
        setTotais({ ss: etSS, irs: l.irs, casa: l.liquido });
        aoPasso(99);
      }, 5.8);

      limpar = () => {
        tls.forEach((t) => t.kill());
        mundo.querySelectorAll(".moeda-salario").forEach((m) => m.remove());
        gEtiq.innerHTML = "";
      };
    })();

    return () => {
      morto = true;
      limpar();
    };
    // a corrida corre uma vez à montagem e outra por cada «Ver outra vez»
    // — NUNCA por mudança de `passo`, porque é o timeline que o escreve
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodada]);

  if (!l || !rotas) {
    return (
      <div className="b-painel" role="dialog" aria-labelledby="fab-quem">
        <button className="b-fechar" type="button" aria-label={T.fechar} onClick={aoFechar}>×</button>
        <span className="b-quem" id="fab-quem" tabIndex={-1}>{T.fabQuem}</span>
        <p className="b-fala">A linha do salário não chegou — a cena não tem números de que não desconfie.</p>
        <div className="b-acoes">
          <button className="b-btn b-claro" type="button" onClick={aoFechar}>{T.finBtnVoltar}</button>
        </div>
      </div>
    );
  }

  const fala =
    passo === 99
      ? T.fabFalaCasa(fmtEUR(l.liquido), fmtNumFica(l.fica))
      : passo === 4
        ? T.fabFalaRua
        : passo === 3
          ? T.fabFalaIrs(fmtEUR(l.irs))
          : passo === 2
            ? T.fabFalaSS(fmtEUR(l.tsu + l.ss), fmtEUR(l.tsu), fmtEUR(l.ss))
            : T.fabFala(fmtEUR(l.custo));

  return (
    <div className="b-painel" role="dialog" aria-labelledby="fab-quem" ref={painelRef}>
      <button className="b-fechar" type="button" aria-label={T.fechar} onClick={aoFechar}>×</button>
      <span className="b-quem" id="fab-quem" tabIndex={-1} ref={focoRef}>{T.fabQuem}</span>
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            fala +
            (passo === 99
              ? ` <a class="b-btn" href="/salario">${T.fabBtnSimulador}</a>`
              : ""),
        }}
      />
      <div className="contador" role="status" aria-label="O percurso do salário até agora">
        <span style={{ background: "var(--azul-2)" }}>{T.fabContSS(fmtEUR(totais.ss))}</span>
        <span style={{ background: "var(--vermelho-2)" }}>{T.fabContIrs(fmtEUR(totais.irs))}</span>
        <span style={{ background: "var(--verde-2)" }}>{T.fabContCasa(fmtEUR(totais.casa))}</span>
      </div>
      <div className="b-acoes">
        {passo === 99 && (
          <button className="b-btn b-claro" type="button" onClick={() => { setTotais({ ss: 0, irs: 0, casa: 0 }); aoPasso(1); setRodada((r) => r + 1); }}>
            {T.fabBtnOutra}
          </button>
        )}
        <button className="b-btn b-claro" type="button" onClick={aoFechar}>
          {T.finBtnVoltar}
        </button>
      </div>
    </div>
  );
}

/** «71,92 cêntimos» — o `fica` do cenário, já com a vírgula do site. */
function fmtNumFica(fica: number): string {
  return fica.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
