/**
 * A animação ambiente do bairro (P1-2 do PACK V5 PRODUÇÃO, §3.4).
 *
 * Este módulo é o que o protótipo fazia nas linhas 377-600 do
 * `mapa.tpl.html`, com três diferenças que a casa obriga:
 *
 *   1. **Entra por `ligarAmbiente(mundo)` e sai por `desligarAmbiente()`.**
 *      O protótipo atirava os tweens para o global e nunca os apanhava; aqui
 *      cada tween é destruído no `return` do efeito, senão o StrictMode do
 *      React 19 monta o componente duas vezes e o mapa fica com o dobro da
 *      animação a correr.
 *
 *   2. **O GSAP chega por `carregarGsap()`, nunca por import estático.** É a
 *      regra B-01: 40 KB de biblioteca não entram no bundle inicial de uma
 *      página que o utilizador pode não querer mexer. Com
 *      `prefers-reduced-motion` o chunk nunca é sequer descarregado
 *      (`motionActiva()` é falso e o effect não pede nada).
 *
 *   3. **Tudo o que dá para escrever em `@keyframes` fica no servidor**
 *      (`viagensSoltas()`, em `mundo.ts`). Aqui só fica o que precisa
 *      mesmo de JavaScript: as janelas que se acendem (dependem do que está
 *      tapado por quê, o que só o browser sabe), e as peças que follows uma
 *      trajetória calculada.
 *
 * Nada aqui escreve texto: o mapa é do servidor e quem o manipulou é o
 * browser.
 */

/** O que o `desligarAmbiente()` precisa saber para limpar o que criou. */
type Limpeza = () => void;

const limpezas = new WeakMap<Element, Limpeza[]>();

/** A geometria de um ponto: o que o protótipo usava como `[x, y]`. */
export type Ponto = readonly [number, number];

/** O produto vectorial cruzado de `(a-o)` com `(b-o)` — o `cruz()` do protótipo. */
export function cruz(o: Ponto, a: Ponto, b: Ponto): number {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/**
 * A casca convexa de uma silhueta — o `casca()` do protótipo.
 *
 * É o que decide que janela se acende: uma janela só acende se nenhuma
 * caixa desenhada à frente a tapar, e «tapar» é o mesmo que «o ponto
 * está dentro da casca».
 */
export function casca(ps: Ponto[]): Ponto[] {
  ps.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const meia = (arr: Ponto[]): Ponto[] => {
    const h: Ponto[] = [];
    for (const p of arr) {
      while (h.length > 1 && cruz(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop();
      h.push(p);
    }
    return h.slice(0, -1);
  };
  return meia(ps).concat(meia([...ps].reverse()));
}

/** `p` está dentro do polígono `h`? */
export function dentro(h: Ponto[], p: Ponto): boolean {
  return h.every((a, k) => cruz(a, h[(k + 1) % h.length], p) > 0);
}

/** Lê uma `data-sil` (`"x,y x,y …"`) na casca convexa que ela descreve. */
export function silParaCascas(sil: string | undefined): Ponto[] {
  return casca(
    (sil ?? "")
      .split(" ")
      .filter(Boolean)
      .map((q) => q.split(",").map(Number) as unknown as Ponto)
  );
}

/**
 * Janelas que se acendem à noite (`calcularLuzes` do protótipo).
 *
 * O truque do protótipo, que vale a pena explicar: uma janela só se acende
 * se **nenhuma caixa desenhada à frente dela** a tapar. As caixas trazem a
 * sua silhueta convexa em `data-sil`, e o código monta o envelope
 * (casca) de cada uma e testa o meio da janela contra os envelopes das
 * caixas seguintes. É geometria de polígonos a correr uma vez, no arranque.
 *
 * O sorteio é determinístico (semente fixa), para o HTML ser o mesmo em
 * qualquer máquina — senão a hidratação queixava-se.
 */
export function calcularLuzes(mundo: Element): void {
  // o mesmo LCG do protótipo, com a mesma semente: as janelas acendem
  // exactamente nas mesmas casas que no mapa de desenho
  let semente = 11;
  const sorte = (): number =>
    ((semente = (semente * 9301 + 49297) % 233280), semente / 233280);

  const caixas = [
    ...mundo.querySelectorAll<SVGGElement>(
      "#b-gTras .caixa, #b-gFrente .caixa, #b-gGaia .caixa"
    ),
  ];
  const cascas = caixas.map((c) => silParaCascas(c.dataset.sil));

  const svg = mundo.querySelector("svg");
  if (!svg) return;
  const ctm = svg.getScreenCTM();
  if (!ctm) return;
  const inv = ctm.inverse();

  const grupos = new Map<string, string>();
  mundo
    .querySelectorAll<SVGGraphicsElement>(
      "#b-gTras .vidro, #b-gFrente .vidro, #b-gGaia .vidro"
    )
    .forEach((v) => {
      const r = sorte();
      if (r > 0.58) return; // nem todas as janelas acendem

      // o `getBBox` está no sistema do elemento; as coordenadas do mundo
      // exigem a matriz que o traz para o ecrã e a que a traz de volta
      const m = inv.multiply(v.getScreenCTM() as DOMMatrix);
      const b = v.getBBox();
      const cantos: Ponto[] = [
        [b.x, b.y],
        [b.x + b.width, b.y],
        [b.x + b.width, b.y + b.height],
        [b.x, b.y + b.height],
      ].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f] as Ponto);
      const meio: Ponto = [
        (cantos[0][0] + cantos[2][0]) / 2,
        (cantos[0][1] + cantos[2][1]) / 2,
      ];

      // alguma caixa à frente tapa o meio desta janela?
      const n = caixas.indexOf(v.closest(".caixa") as SVGGElement);
      if (cascas.some((h, k) => k > n && dentro(h, meio))) return;

      const pts = cantos.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      const id = v.closest(".ed")?.getAttribute("data-id") ?? "";
      grupos.set(
        id,
        (grupos.get(id) ?? "") +
          `<polygon class="b-acesa${r < 0.2 ? " b-cedo" : ""}" points="${pts}"/>`
      );
    });

  let html = "";
  grupos.forEach((pol, id) => {
    html += `<g class="b-luzes-ed" data-ed="${id}">${pol}</g>`;
  });
  mundo.querySelector("#b-gLuzes")?.insertAdjacentHTML("afterbegin", html);

  // as luzes sobem quando o edifício está por baixo do rato, focado, ou
  // aberto — o CSS faz a transição, aqui só se decide a classe
  mundo.querySelectorAll<SVGGElement>(".ed").forEach((g) => {
    const id = g.getAttribute("data-id");
    const l = id
      ? mundo.querySelector(`.b-luzes-ed[data-ed="${CSS.escape(id)}"]`)
      : null;
    if (!l) return;
    const sync = (): void => {
      l.classList.toggle("b-sobe", g.matches(":hover, :focus-visible, .b-ativo"));
    };
    // no próximo quadro, não já: o `:hover` chega ao DOM antes de o
    // browser ter pintado, e subir a luz um quadro antes vê-se a saltar
    const aoMudar = (): void => {
      requestAnimationFrame(sync);
    };
    for (const ev of ["pointerenter", "pointerleave", "focus", "blur"])
      g.addEventListener(ev, aoMudar);
    const mo = new MutationObserver(sync);
    mo.observe(g, { attributes: true, attributeFilter: ["class"] });
    limpezas.set(g, [
      () => {
        for (const ev of ["pointerenter", "pointerleave", "focus", "blur"])
          g.removeEventListener(ev, aoMudar);
        mo.disconnect();
      },
    ]);
  });
}

/**
 * Liga tudo o que precisa de JavaScript, e devolve a rotina de limpeza.
 *
 * `coordenada` traduz as coordenadas da planta (i, j) para o mundo — vem
 * do servidor, porque `planta.ts` não pode entrar no bundle do cliente.
 */
export async function ligarAmbiente(
  mundo: Element,
  opcoes: {
    /**
     * Os pontos de que a animação precisa, como dados e não como função:
     * uma função de servidor não atravessa a fronteira para o cliente
     * (o Next recusa o build). `coordenadas[i]` e `pontos[i]` descrevem
     * o mesmo sítio, nas coordenadas da planta e em coordenadas de ecrã.
     */
    coordenadas: readonly (readonly [number, number, number])[];
    pontos: readonly Ponto[];
    /** As três gaivotas: centro, raio em x e em y, e o período. */
    gaivotas: readonly (readonly [Ponto, number, number, number])[];
    /** A hora do mapa, para o fumo da fábrica não acender à noite. */
  }
): Promise<Limpeza> {
  const feito: Limpeza[] = [];

  // as janelas acesas não precisam do GSAP — são geometria e `innerHTML`,
  // e assim ficam de pé mal o chunk chegue (ou não chegue)
  calcularLuzes(mundo);
  const luzes = limpezas.get(mundo.querySelector(".ed") ?? mundo);
  if (luzes) feito.push(...luzes);

  // o resto é tudo animação: espera pelo GSAP, e se o utilizador pediu
  // menos movimento, não o pede sequer
  const { motionActiva, carregarGsap } = await import("@/lib/motion/gsap");
  if (!motionActiva()) return () => feito.forEach((f) => f());
  const { gsap } = await carregarGsap();

  // atalho para o ponto i da tabela — o que o protótipo escrevia `P(i, j)`
  const em = (k: number): Ponto => opcoes.pontos[k] ?? [0, 0];
  // o mesmo ponto a partir das coordenadas da planta, para quando o
  // animação precisa de deslizar ao longo de uma linha
  const P = (i: number, j: number, z = 0): Ponto => {
    const k = opcoes.coordenadas.findIndex(([a, b]) => a === i && b === j);
    return k >= 0 ? opcoes.pontos[k] : [i * 64 - j * 64, (i + j) * 32 - z];
  };

  /* ——— o elétrico: sobe e desce a avenida, a entrar e a sair ——— */
  {
    const el = mundo.querySelector<SVGGElement>("#b-eletrico");
    if (el) {
      const o = { k: 0 };
      const tw = gsap.timeline({ repeat: -1, repeatDelay: 2 });
      tw.fromTo(
        o,
        { k: 0 },
        {
          k: 1,
          duration: 24,
          ease: "none",
          onUpdate: () => {
            const [x0, y0] = em(0);
            const [x1, y1] = em(1);
            // o caminho é uma reta entre as duas pontas da avenida, e o
            // elétrico fica uma fração do caminho — o mesmo que o
            // protótipo fazia com `el.i * 64, el.i * 32`
            const t = o.k;
            const [x, y] = [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
            el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
            // aparece e desaparece nas pontas, senão teleporta à frente
            // de quem está a ler o mapa
            el.style.opacity = String(Math.max(0, Math.min(1, t / 0.05, (1 - t) / 0.05)));
          },
        }
      );
      feito.push(() => tw.kill());
    }
  }

  /* ——— as gaivotas: três órbitas por cima do rio, e as asas a bater ——— */
  opcoes.gaivotas.forEach(([c, rx, ry, dur], k) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = `<path class="b-gaivota" d="M-9 0 q4 -6 9 0 q5 -6 9 0" fill="none" stroke="#16130f" stroke-width="2.2" stroke-linecap="round"/>`;
    mundo.querySelector("#b-gCeu")?.appendChild(g);
    const o = { t: k * 2 };
    const tw = gsap.to(o, {
      t: k * 2 + Math.PI * 2,
      duration: dur,
      ease: "none",
      repeat: -1,
      onUpdate: () => {
        const x = c[0] + Math.cos(o.t) * rx;
        const y = c[1] - 150 + Math.sin(o.t) * ry;
        // a gaivota de/CBD mostra o dorso a subir, a de baixo o-ventre
        g.setAttribute(
          "transform",
          `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${Math.sin(o.t) > 0 ? 1.15 : 1})`
        );
      },
    });
    const asas = gsap.to(g.firstElementChild, {
      scaleY: 0.35,
      transformOrigin: "50% 100%",
      duration: 0.22,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: k * 0.1,
    });
    feito.push(() => {
      tw.kill();
      asas.kill();
      g.remove();
    });
  });

  /* ——— o nadador: a cabeça a subir e o braço a dar ——— */
  {
    const nad = mundo.querySelector<SVGGElement>(".b-nadador");
    if (nad) {
      const t1 = gsap.to(nad, {
        y: "+=2",
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
      const braco = nad.querySelector(".b-brazo-n");
      const t2 = braco
        ? gsap.to(braco, {
            rotation: -40,
            transformOrigin: "0% 50%",
            duration: 0.6,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          })
        : null;
      feito.push(() => {
        t1.kill();
        t2?.kill();
      });
    }
  }

  /* ——— os pombos da Ribeira: ajeitam-se e voltam ——— */
  {
    const tws = [...mundo.querySelectorAll<SVGGElement>(".b-corpo-pombo")].map(
      (c, k) =>
        gsap
          .timeline({ repeat: -1, repeatDelay: 1.2 + (k % 3) * 0.9, delay: k * 0.4 })
          .to(c, { rotation: 32, transformOrigin: "40% 90%", duration: 0.14 })
          .to(c, { rotation: 0, duration: 0.14 })
          .to(c, { rotation: 32, duration: 0.14 })
          .to(c, { rotation: 0, duration: 0.14 })
    );
    feito.push(() => tws.forEach((t) => t.kill()));
  }

  /* ——— o fumo da fábrica: quatro baforadas a subir e adeserialize ——— */
  {
    const fumo = mundo.querySelector<SVGGElement>(".b-fumo");
    // o fumo sai para a camada do céu: uma camada pesada não pode
    // repintar vinte vezes por segundo só por causa de quatro círculos
    const ceu = mundo.querySelector("#b-gCeu");
    if (fumo && ceu) {
      ceu.appendChild(fumo);
      const tws = [...fumo.querySelectorAll<SVGCircleElement>(".b-baforada")].map(
        (b, k) => {
          const cy = Number(b.getAttribute("cy"));
          const cx = Number(b.getAttribute("cx"));
          return gsap
            .timeline({ repeat: -1, delay: k * 0.9 })
            .fromTo(
              b,
              { attr: { cy, cx }, scale: 0.5, transformOrigin: "50% 50%" },
              {
                attr: { cy: cy - 110, cx: cx + 40 },
                scale: 1.7,
                duration: 3.6,
                ease: "sine.out",
              },
              0
            )
            .fromTo(b, { opacity: 0 }, { opacity: 0.95, duration: 0.8 }, 0)
            .to(b, { opacity: 0, duration: 1.3 }, 2.3);
        }
      );
      feito.push(() => tws.forEach((t) => t.kill()));
    }
  }

  /* ——— o brilho da água: oito traços que deslizam e desaparecem ——— */
  {
    const agua = mundo.querySelector("#b-gAgua") ?? mundo.querySelector("#b-cRio");
    if (agua) {
      let semente = 5;
      const sorte = (): number =>
        ((semente = (semente * 9301 + 49297) % 233280), semente / 233280);
      let h = "";
      for (let k = 0; k < 8; k++) {
        const [x, y] = P(-0.5 + sorte() * 15.5, 11.3 + sorte() * 3.6);
        h += `<path class="b-brilho-agua" d="M${(x - 8).toFixed(0)} ${y.toFixed(0)} q8 -5 16 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0"/>`;
      }
      agua.insertAdjacentHTML("afterbegin", h);
      const tws = [...agua.querySelectorAll(".b-brilho-agua")].map((b, k) =>
        gsap.to(b, {
          opacity: 0.9,
          x: 6,
          duration: 1.2,
          yoyo: true,
          repeat: -1,
          repeatDelay: 1.5 + (k % 5) * 0.6,
          delay: k * 0.37,
          ease: "sine.inOut",
        })
      );
      feito.push(() => {
        tws.forEach((t) => t.kill());
        agua.querySelectorAll(".b-brilho-agua").forEach((b) => b.remove());
      });
    }
  }

  return () => feito.forEach((f) => f());
}