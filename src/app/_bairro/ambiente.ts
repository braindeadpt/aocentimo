/**
 * A animação ambiente do bairro (P1-2 do PACK V5 PRODUÇÃO, §3.4).
 *
 * Este módulo porta as animações JavaScript do `mapa.tpl.html`, com
 * diferenças de ciclo de vida que a casa obriga:
 *
 *   1. **Entra por `ligarAmbiente(mundo)` e sai pela limpeza devolvida.**
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
 *      tapado por quê, o que só o browser sabe), e as peças que seguem uma
 *      trajectória calculada.
 *
 * Nada aqui escreve texto: o mapa é do servidor e quem o manipulou é o
 * browser.
 */

/** O que o `desligarAmbiente()` precisa saber para limpar o que criou. */
type Limpeza = () => void;
type Animacao = {
  kill: () => void;
  eventCallback: (evento: "onComplete", callback?: () => void) => unknown;
};

const limpezasLuzes = new WeakMap<Element, Limpeza>();

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
  return h.length >= 3 && h.every((a, k) => cruz(a, h[(k + 1) % h.length], p) > 0);
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
export function calcularLuzes(mundo: Element): Limpeza {
  // Uma saída e reentrada no mapa não pode duplicar luzes nem listeners.
  limpezasLuzes.get(mundo)?.();

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

  // Usa um SVG de camada com o viewBox do mundo inteiro; uma nuvem solta
  // usa outro viewBox e tornaria a transformação inversa incorrecta.
  const svg = mundo.querySelector<SVGSVGElement>("#b-cFundo");
  if (!svg) return () => {};
  const ctm = svg.getScreenCTM();
  if (!ctm) return () => {};
  const inv = ctm.inverse();

  const grupos = new Map<string, string>();
  mundo.querySelectorAll<SVGGraphicsElement>(
    "#b-gTras .vidro, #b-gFrente .vidro, #b-gGaia .vidro"
  )
    .forEach((v) => {
      const r = sorte();
      if (r > 0.58) return; // nem todas as janelas acendem

      // o `getBBox` está no sistema do elemento; as coordenadas do mundo
      // exigem a matriz que o traz para o ecrã e a que a traz de volta
      const matriz = v.getScreenCTM();
      if (!matriz) return;
      const m = inv.multiply(matriz);
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
  const criadas = [...mundo.querySelectorAll<SVGGElement>("#b-gLuzes > .b-luzes-ed")];
  const desligar: Limpeza[] = [];

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
    let frame = 0;
    const aoMudar = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    for (const ev of ["pointerenter", "pointerleave", "focus", "blur"])
      g.addEventListener(ev, aoMudar);
    const mo = new MutationObserver(sync);
    mo.observe(g, { attributes: true, attributeFilter: ["class"] });
    desligar.push(() => {
      cancelAnimationFrame(frame);
      l.classList.remove("b-sobe");
      for (const ev of ["pointerenter", "pointerleave", "focus", "blur"])
        g.removeEventListener(ev, aoMudar);
      mo.disconnect();
    });
  });

  const limpar: Limpeza = () => {
    desligar.forEach((f) => f());
    criadas.forEach((g) => g.remove());
    if (limpezasLuzes.get(mundo) === limpar) limpezasLuzes.delete(mundo);
  };
  limpezasLuzes.set(mundo, limpar);
  return limpar;
}

/**
 * Liga tudo o que precisa de JavaScript, e devolve a rotina de limpeza.
 * As coordenadas e os pontos projectados chegam como dados do servidor;
 * o cliente não importa `planta.ts` nem volta a desenhar o mapa.
 */
export async function ligarAmbiente(
  mundo: Element,
  opcoes: {
    /** Triplos [i,j,z] e coordenadas projetadas correspondentes, gerados no servidor. */
    coordenadas: readonly (readonly [number, number, number])[];
    pontos: readonly Ponto[];
    /** As três gaivotas: centro, raio em x e em y, e o período. */
    gaivotas: readonly (readonly [Ponto, number, number, number])[];
  }
): Promise<Limpeza> {
  const feito: Limpeza[] = [];
  const animacoes = new Set<Animacao>();
  const restaurar = new Map<Element, Limpeza>();
  const atrasos = new Set<{ kill: () => void }>();
  let desligado = false;
  const acompanhar = <T extends Animacao>(animacao: T, aoTerminar?: () => void): T => {
    animacoes.add(animacao);
    const callback = animacao.eventCallback("onComplete");
    animacao.eventCallback("onComplete", () => {
      animacoes.delete(animacao);
      if (typeof callback === "function") callback();
      aoTerminar?.();
    });
    return animacao;
  };
  const aoRestaurar = (alvo: Element, restauracao: Limpeza): void => {
    if (!restaurar.has(alvo)) restaurar.set(alvo, restauracao);
  };
  const limparTudo: Limpeza = () => {
    if (desligado) return;
    desligado = true;
    atrasos.forEach((atraso) => atraso.kill());
    atrasos.clear();
    animacoes.forEach((animacao) => animacao.kill());
    animacoes.clear();
    feito.reverse().forEach((f) => f());
    restaurar.forEach((restauracao) => restauracao());
    restaurar.clear();
  };

  // A geometria tem de ser validada antes de instalar listeners/luzes: se
  // chegar uma tabela truncada, o effect pode falhar sem deixar lixo no DOM.
  if (opcoes.coordenadas.length < 2 || opcoes.pontos.length !== opcoes.coordenadas.length) {
    throw new Error("A tabela de animação precisa de coordenadas projetadas correspondentes");
  }
  const [i0, j0, z0] = opcoes.coordenadas[0];
  const [i1, j1, z1] = opcoes.coordenadas[1];
  const [x0, y0] = opcoes.pontos[0];
  const [x1, y1] = opcoes.pontos[1];
  if (i0 === i1 || j0 !== j1 || z0 !== z1 || !Number.isFinite(x0 + y0 + x1 + y1)) {
    throw new Error("A tabela começa com dois pontos da mesma linha e cota");
  }

  // as janelas acesas não precisam do GSAP — são geometria e `innerHTML`.
  // As mesmas luzes e listeners são removidos na pausa e refeitos na reentrada.
  feito.push(calcularLuzes(mundo));

  // o resto é tudo animação: espera pelo GSAP, e se o utilizador pediu
  // menos movimento, não o pede sequer
  let motionActiva: () => boolean;
  let carregarGsap: typeof import("@/lib/motion/gsap")["carregarGsap"];
  try {
    ({ motionActiva, carregarGsap } = await import("@/lib/motion/gsap"));
    if (!motionActiva()) return limparTudo;
  } catch (erro) {
    limparTudo();
    throw erro;
  }
  let gsap: Awaited<ReturnType<typeof import("@/lib/motion/gsap")["carregarGsap"]>>["gsap"];
  try {
    ({ gsap } = await carregarGsap());
  } catch (erro) {
    limparTudo();
    throw erro;
  }

  try {
    // A tabela começa pelas duas pontas da avenida, na mesma profundidade
    // e cota: delas vem a grelha isométrica, sem importar a planta ao cliente.
  const coordenadasFixas = new Map(
    opcoes.coordenadas.map(([i, j, z], k) => [`${i}|${j}|${z}`, opcoes.pontos[k]] as const)
  );
  const pxI = (x1 - x0) / (i1 - i0);
  const pyI = (y1 - y0) / (i1 - i0);
  const pxJ = -pxI;
  const pyJ = pyI;
  const P = (i: number, j: number, z = 0): Ponto => [
    x0 + (i - i0) * pxI + (j - j0) * pxJ,
    y0 + (i - i0) * pyI + (j - j0) * pyJ - (z - z0),
  ];
  // Os pontos nomeados usam exactamente a projeção do servidor; o fallback
  // aplica a mesma grelha isométrica aos pontos intermédios dos miúdos.
  const coordenada = (i: number, j: number, z: number): Ponto =>
    coordenadasFixas.get(`${i}|${j}|${z}`) ?? P(i, j, z);
  // Os atrasos recorrentes são GSAP delayedCall, para poderem ser mortos
  // junto com timelines ao sair do ecrã ou desmontar o mapa.
  const agendar = (segundos: number, cb: () => void): void => {
    if (desligado) return;
    const atraso = gsap.delayedCall(segundos, () => {
      atrasos.delete(atraso);
      animacoes.delete(atraso);
      if (!desligado) cb();
    });
    atrasos.add(atraso);
    animacoes.add(atraso);
  };

  /* ——— o elétrico: sobe e desce a avenida, a entrar e a sair ——— */
  {
    const el = mundo.querySelector<SVGGElement>("#b-eletrico");
    if (el) {
      const o = { k: 0 };
      const transformInicial = el.getAttribute("transform");
      const opacidadeInicial = el.style.opacity;
      aoRestaurar(el, () => {
        if (transformInicial) el.setAttribute("transform", transformInicial);
        else el.removeAttribute("transform");
        if (opacidadeInicial) el.style.opacity = opacidadeInicial;
        else el.style.removeProperty("opacity");
      });
      acompanhar(gsap.timeline({ repeat: -1, repeatDelay: 2 })).fromTo(
        o,
        { k: 0 },
        {
          k: 1,
          duration: 24,
          ease: "none",
          onUpdate: () => {
            // Este grupo contém um SVG já desenhado em i=0; a viagem é
            // uma translação relativa, como no protótipo (i×64, i×32).
            const t = o.k;
            const i = -3.4 + (13.4 - -3.4) * t;
            const x = i * pxI;
            const y = i * pyI;
            el.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
            // aparece e desaparece nas pontas, senão teleporta à frente
            // de quem está a ler o mapa
            // o protótipo esbate ao longo de 1,4 ladrilhos em cada ponta
            // (de −3,4 a 13,4 são 16,8): 1,4/16,8 da viagem, não 5 %
            const borda = 1.4 / (13.4 - -3.4);
            el.style.opacity = String(Math.max(0, Math.min(1, t / borda, (1 - t) / borda)));
          },
        }
      );
    }
  }

  /* ——— as gaivotas: três órbitas por cima do rio, e as asas a bater ——— */
  opcoes.gaivotas.forEach(([c, rx, ry, dur], k) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = `<path class="b-gaivota" d="M-9 0 q4 -6 9 0 q5 -6 9 0" fill="none" stroke="#16130f" stroke-width="2.2" stroke-linecap="round"/>`;
    mundo.querySelector("#b-gCeu")?.appendChild(g);
    feito.push(() => g.remove());
    const o = { t: k * 2 };
    acompanhar(gsap.to(o, {
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
    }));
    acompanhar(gsap.to(g.firstElementChild, {
      scaleY: 0.35,
      transformOrigin: "50% 100%",
      duration: 0.22,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: k * 0.1,
    }));
  });

  /* ——— a gente está viva: pestaneja e respira (o `pessoa()` do protótipo) ———
     Perdera-se na passagem para produção (auditoria 2026-10-06). O
     protótipo usava `Math.random`; aqui o sorteio é o LCG de sempre, com
     semente fixa, para o mapa se comportar igual em todas as máquinas. */
  {
    let semente = 7;
    const sorte = (): number =>
      ((semente = (semente * 9301 + 49297) % 233280), semente / 233280);
    mundo.querySelectorAll<SVGGElement>(".pessoa").forEach((p) => {
      const olhos = p.querySelector<SVGGraphicsElement>(".olhos");
      if (olhos) {
        const estilo = olhos.getAttribute("style");
        aoRestaurar(olhos, () => {
          if (estilo === null) olhos.removeAttribute("style");
          else olhos.setAttribute("style", estilo);
        });
        const pisca = (): void => {
          acompanhar(gsap.to(olhos, { scaleY: 0.1, transformOrigin: "50% 50%", duration: 0.07, yoyo: true, repeat: 1 }));
          agendar(2.2 + sorte() * 3, pisca);
        };
        agendar(sorte() * 2.5, pisca);
      }
      // quem anda já balança o tronco no passo (`caminhar`): respirar por
      // cima disso eram dois tweens a escrever no mesmo transform
      if (p.closest("[data-b-andador]")) return;
      const tronco = p.querySelector<SVGGraphicsElement>(".tronco");
      if (!tronco) return;
      const estilo = tronco.getAttribute("style");
      aoRestaurar(tronco, () => {
        if (estilo === null) tronco.removeAttribute("style");
        else tronco.setAttribute("style", estilo);
      });
      acompanhar(gsap.to(tronco, { y: -1.6, duration: 1.2 + sorte(), yoyo: true, repeat: -1, ease: "sine.inOut" }));
    });
  }

  /* ——— gente: o Pedro atravessa a Avenida e a Arminda vai aos Correios ——— */
  const caminhar = (
    chave: string,
    rota: readonly (readonly [number, number, number])[],
    velocidade: number,
    aoFim: () => void
  ): void => {
    const figura = mundo.querySelector<SVGGElement>(`[data-b-andador="${chave}"]`);
    if (!figura) return;
    const valoresIniciais = {
      i: figura.dataset.bI,
      j: figura.dataset.bJ,
      z: figura.dataset.bZ,
      dir: figura.dataset.bDir,
    };
    const zInicial = Number(figura.dataset.bZ);
    const estado = {
      i: Number(figura.dataset.bI),
      j: Number(figura.dataset.bJ),
      z: zInicial,
      dir: Number(figura.dataset.bDir) || 1,
      xy: coordenada(Number(figura.dataset.bI), Number(figura.dataset.bJ), zInicial),
    };
    const transformInicial = figura.getAttribute("transform");
    aoRestaurar(figura, () => {
      if (transformInicial === null) figura.removeAttribute("transform");
      else figura.setAttribute("transform", transformInicial);
      figura.dataset.bI = valoresIniciais.i ?? "";
      figura.dataset.bJ = valoresIniciais.j ?? "";
      figura.dataset.bZ = valoresIniciais.z ?? "";
      figura.dataset.bDir = valoresIniciais.dir ?? "";
    });
    const aplicar = (): void => {
      figura.setAttribute(
        "transform",
        `translate(${estado.xy[0].toFixed(1)} ${estado.xy[1].toFixed(1)}) scale(${(0.36 * estado.dir).toFixed(2)} 0.36)`
      );
      figura.dataset.bI = String(estado.i);
      figura.dataset.bJ = String(estado.j);
      figura.dataset.bZ = String(estado.z);
      figura.dataset.bDir = String(estado.dir);
    };
    const pernas = [
      figura.querySelector<SVGGraphicsElement>(".perna-e"),
      figura.querySelector<SVGGraphicsElement>(".perna-d"),
      figura.querySelector<SVGGraphicsElement>(".braco-e"),
      figura.querySelector<SVGGraphicsElement>(".braco-d"),
    ].filter((alvo): alvo is SVGGraphicsElement => alvo !== null);
    const tronco = figura.querySelector<SVGGraphicsElement>(".tronco");
    const passo = acompanhar(gsap.timeline({ repeat: -1, yoyo: true }));
    pernas.forEach((alvo, k) => {
      passo.to(alvo, {
        rotation: k < 2 ? (k === 0 ? 24 : -24) : (k === 2 ? -18 : 18),
        transformOrigin: "50% 0%",
        duration: 0.28,
        ease: "sine.inOut",
      }, 0);
    });
    if (tronco) passo.to(tronco, { y: -1.6, duration: 0.56, ease: "sine.inOut" }, 0);
    const partes = [...pernas, ...(tronco ? [tronco] : [])];
    const estilosIniciais = new Map(partes.map((parte) => [parte, parte.getAttribute("style")]));
    const restaurarEstilos = (): void => {
      estilosIniciais.forEach((estilo, parte) => {
        if (estilo === null) parte.removeAttribute("style");
        else parte.setAttribute("style", estilo);
      });
    };
    partes.forEach((parte) => aoRestaurar(parte, restaurarEstilos));
    const passos = acompanhar(gsap.timeline(), () => {
      passo.kill();
      animacoes.delete(passo);
      restaurarEstilos();
      const destino = rota.at(-1);
      if (destino) {
        estado.i = destino[0];
        estado.j = destino[1];
        estado.z = destino[2];
        estado.xy = coordenada(destino[0], destino[1], destino[2]);
        aplicar();
      }
      figura.dataset.bI = String(estado.i);
      figura.dataset.bJ = String(estado.j);
      figura.dataset.bZ = String(estado.z);
      figura.dataset.bDir = String(estado.dir);
      aoFim();
    });
    let anterior: readonly [number, number, number] = [estado.i, estado.j, zInicial];
    for (const destino of rota) {
      const inicioPonto = anterior;
      const inicio = coordenada(inicioPonto[0], inicioPonto[1], inicioPonto[2]);
      const fim = coordenada(destino[0], destino[1], destino[2]);
      const distancia = Math.hypot(destino[0] - inicioPonto[0], destino[1] - inicioPonto[1]);
      if (distancia < 0.001) { anterior = destino; continue; }
      const direcao = (destino[0] - inicioPonto[0]) - (destino[1] - inicioPonto[1]) >= 0 ? 1 : -1;
      const t = { v: 0 };
      passos.to(t, {
        v: 1,
        duration: distancia / velocidade,
        ease: "none",
        onUpdate: () => {
          estado.i = inicioPonto[0] + (destino[0] - inicioPonto[0]) * t.v;
          estado.j = inicioPonto[1] + (destino[1] - inicioPonto[1]) * t.v;
          estado.z = inicioPonto[2] + (destino[2] - inicioPonto[2]) * t.v;
          estado.dir = direcao;
          estado.xy = [inicio[0] + (fim[0] - inicio[0]) * t.v, inicio[1] + (fim[1] - inicio[1]) * t.v];
          aplicar();
        },
      });
      anterior = destino;
    }
  };

  const pedroRota = (): void => {
    const pedro = mundo.querySelector<SVGGElement>('[data-b-andador="pedro"]');
    if (!pedro) return;
    const volta = Number(pedro.dataset.bI) > 8;
    const destino = volta ? [1, 3.85, 110] as const : [14, 3.85, 110] as const;
    caminhar("pedro", [destino], 0.7, () => agendar(1.8, pedroRota));
  };
  const rotaArmindaIda = [
    [7.5, 8.8, 0], [7.5, 8.4, 0], [7.5, 5.4, 110], [7.5, 3.8, 110], [11.7, 3.8, 110],
  ] as const;
  const rotaArmindaVolta = [
    [7.5, 3.8, 110], [7.5, 5.4, 110], [7.5, 8.4, 0], [7.5, 8.85, 0], [3.3, 8.85, 0],
  ] as const;
  const armindaRota = (): void => {
    const arminda = mundo.querySelector<SVGGElement>('[data-b-andador="arminda"]');
    if (!arminda) return;
    const destinoIda = Number(arminda.dataset.bI) < 7 ? rotaArmindaIda : rotaArmindaVolta;
    const destinoVolta = destinoIda === rotaArmindaIda ? rotaArmindaVolta : rotaArmindaIda;
    caminhar("arminda", destinoIda, 0.55, () =>
      agendar(2.5, () =>
        caminhar("arminda", destinoVolta, 0.55, () => agendar(3, armindaRota))
      )
    );
  };
  agendar(1.2, pedroRota);
  agendar(2.5, armindaRota);

  /* ——— sorrisos e acenos em intervalos, sem setInterval permanente ——— */
  const acenarFigura = (selector: string, intervalo: number): void => {
    const braco = mundo.querySelector<SVGGraphicsElement>(`${selector} .braco-d`);
    if (!braco) return;
    const estiloInicial = braco.getAttribute("style");
    aoRestaurar(braco, () => {
      if (estiloInicial === null) braco.removeAttribute("style");
      else braco.setAttribute("style", estiloInicial);
    });
    const onda = acompanhar(gsap.timeline(), () => {
      if (estiloInicial === null) braco.removeAttribute("style");
      else braco.setAttribute("style", estiloInicial);
      agendar(intervalo, () => acenarFigura(selector, intervalo));
    });
    onda.to(braco, { rotation: -150, transformOrigin: "50% 0%", duration: 0.25 })
      .to(braco, { rotation: -120, duration: 0.15, yoyo: true, repeat: 3 })
      .to(braco, { rotation: 0, duration: 0.3 });
  };
  const sorrirGoncalo = (): void => {
    const figura = mundo.querySelector<SVGGraphicsElement>('[data-pessoa="goncalo"]');
    const boca = figura?.querySelector<SVGPathElement>(".boca");
    const escala = figura?.querySelector<SVGGraphicsElement>(".escala");
    if (boca) {
      const repouso = boca.getAttribute("d");
      const y = Number(repouso?.split(" ")[1] ?? -105);
      const fillRepouso = boca.getAttribute("fill");
      aoRestaurar(boca, () => {
        if (repouso === null) boca.removeAttribute("d");
        else boca.setAttribute("d", repouso);
        if (fillRepouso === null) boca.removeAttribute("fill");
        else boca.setAttribute("fill", fillRepouso);
      });
      if (repouso) {
        const sorriso = acompanhar(gsap.timeline());
        sorriso.to(boca, { attr: { d: `M-6.5 ${y - 1} q6.5 8 13 0 z`, fill: "#16130f" }, duration: 0.1 })
          .to({}, { duration: 1.2 })
          .to(boca, { attr: { d: repouso, fill: "none" }, duration: 0.1 });
      }
    }
    if (escala) {
      const transformEscala = escala.getAttribute("transform");
      const estiloEscala = escala.getAttribute("style");
      aoRestaurar(escala, () => {
        if (transformEscala === null) escala.removeAttribute("transform");
        else escala.setAttribute("transform", transformEscala);
        if (estiloEscala === null) escala.removeAttribute("style");
        else escala.setAttribute("style", estiloEscala);
      });
      acompanhar(gsap.fromTo(escala, { y: 0 }, { y: -20, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }));
    }
    agendar(4.7, sorrirGoncalo);
  };
  agendar(4.7, sorrirGoncalo);
  agendar(6.1, () => acenarFigura('[data-pessoa="manuel"]', 6.1));
  agendar(7.3, () => acenarFigura('[data-pessoa="marta"]', 7.3));

  /* ——— os vizinhos aparecem à janela numa sequência determinística ——— */
  {
    const vizinhos = [...mundo.querySelectorAll<SVGGraphicsElement>("#b-gFrente .vizinho")];
    let proximo = 0;
    const mostrarVizinho = (): void => {
      if (!vizinhos.length) return;
      const vizinho = vizinhos[proximo++ % vizinhos.length];
      const opacidadeInicial = vizinho.getAttribute("opacity");
      const estiloInicial = vizinho.getAttribute("style");
      aoRestaurar(vizinho, () => {
        if (opacidadeInicial === null) vizinho.removeAttribute("opacity");
        else vizinho.setAttribute("opacity", opacidadeInicial);
        if (estiloInicial === null) vizinho.removeAttribute("style");
        else vizinho.setAttribute("style", estiloInicial);
      });
      const aparicao = acompanhar(gsap.timeline({ onComplete: () => agendar(1.6, mostrarVizinho) }));
      aparicao.to(vizinho, { opacity: 1, duration: 0.4 })
        .to({}, { duration: 3.5 })
        .to(vizinho, { opacity: 0, duration: 0.4 });
    };
    agendar(1.6, mostrarVizinho);
  }

  /* ——— a bóia do pescador sobe e desce ——— */
  {
    const boia = mundo.querySelector<SVGCircleElement>(".b-boia");
    if (boia) {
      const cyInicial = boia.getAttribute("cy");
      aoRestaurar(boia, () => {
        if (cyInicial === null) boia.removeAttribute("cy");
        else boia.setAttribute("cy", cyInicial);
      });
      acompanhar(gsap.to(boia, { attr: { cy: 100 }, duration: 1.1, yoyo: true, repeat: -1, ease: "sine.inOut" }));
    }
  }

  /* ——— miúdos: saltam da ponte, mergulham, salpicam e regressam ——— */
  {
    const miudos = [...mundo.querySelectorAll<SVGGElement>("[data-b-jumper]")];
    miudos.forEach((figura, k) => {
      const iInicial = Number(figura.dataset.bI);
      const j = Number(figura.dataset.bJ);
      const zInicial = Number(figura.dataset.bZ);
      const salpico = mundo.querySelector<SVGGElement>(`[data-b-salpico="${k}"]`);
      if (!salpico) return;
      const transformInicial = figura.getAttribute("transform");
      const estiloFiguraInicial = figura.getAttribute("style");
      aoRestaurar(figura, () => {
        if (transformInicial === null) figura.removeAttribute("transform");
        else figura.setAttribute("transform", transformInicial);
        if (estiloFiguraInicial === null) figura.removeAttribute("style");
        else figura.setAttribute("style", estiloFiguraInicial);
      });
      const estiloSalpico = salpico.getAttribute("style");
      const opacidadeSalpico = salpico.getAttribute("opacity");
      const transformSalpico = salpico.getAttribute("transform");
      aoRestaurar(salpico, () => {
        if (estiloSalpico === null) salpico.removeAttribute("style");
        else salpico.setAttribute("style", estiloSalpico);
        if (opacidadeSalpico === null) salpico.removeAttribute("opacity");
        else salpico.setAttribute("opacity", opacidadeSalpico);
        if (transformSalpico === null) salpico.removeAttribute("transform");
        else salpico.setAttribute("transform", transformSalpico);
      });
      const z = { i: iInicial, atual: zInicial, rotacao: 0, opacidade: 1 };
      const atualizar = (): void => {
        const [x, y] = P(z.i, j, z.atual);
        figura.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(0.36) rotate(${z.rotacao.toFixed(0)} 0 -64)`);
        figura.style.opacity = String(z.opacidade);
      };
      const saltar = acompanhar(gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 1.5 + k * 2.6 }));
      saltar.to(z, { atual: zInicial - 4, duration: 0.3, ease: "power1.out", onUpdate: atualizar })
        .to(z, { i: 15.18, duration: 1, ease: "none", onUpdate: atualizar })
        .to(z, { atual: zInicial + 22, duration: 0.38, ease: "power1.out", onUpdate: atualizar }, "<")
        .to(z, { atual: -26, duration: 0.62, ease: "power2.in", onUpdate: atualizar }, ">")
        .to(z, { rotacao: k ? -360 : -25, duration: 0.95, ease: "power1.inOut", onUpdate: atualizar }, "<-0.38")
        .set(z, { opacidade: 0, onComplete: atualizar })
        .set(salpico, { opacity: 1, scale: 0.3, transformOrigin: "50% 50%" }, "<")
        .to(salpico, { opacity: 0, scale: 1.5, duration: 0.9, ease: "power2.out" }, "<")
        .set(z, { i: iInicial, atual: zInicial, rotacao: 0 }, "+=2.2")
        .to(z, { opacidade: 1, duration: 0.5, onUpdate: atualizar });
    });
  }

  /* ——— o nadador: a cabeça a subir e o braço a dar ——— */
  {
    const nad = mundo.querySelector<SVGGElement>(".b-nadador");
    if (nad) {
      aoRestaurar(nad, () => nad.removeAttribute("style"));
      acompanhar(gsap.to(nad, {
        y: "+=2",
        duration: 1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      }));
      const braco = nad.querySelector<SVGGraphicsElement>(".b-braço-n");
      if (braco) aoRestaurar(braco, () => braco.removeAttribute("style"));
      if (braco) acompanhar(gsap.to(braco, {
            rotation: -40,
            transformOrigin: "0% 50%",
            duration: 0.6,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          }));
    }
  }

  /* ——— os pombos da Ribeira: ajeitam-se e voltam ——— */
  {
    [...mundo.querySelectorAll<SVGGElement>(".b-corpo-pombo")].forEach(
      (c, k) => {
        const estiloInicial = c.getAttribute("style");
        aoRestaurar(c, () => {
          if (estiloInicial === null) c.removeAttribute("style");
          else c.setAttribute("style", estiloInicial);
        });
        acompanhar(
          gsap
            .timeline({ repeat: -1, repeatDelay: 1.2 + (k % 3) * 0.9, delay: k * 0.4 })
            .to(c, { rotation: 32, transformOrigin: "40% 90%", duration: 0.14 })
            .to(c, { rotation: 0, duration: 0.14 })
            .to(c, { rotation: 32, duration: 0.14 })
            .to(c, { rotation: 0, duration: 0.14 })
        );
      }
    );
  }

  /* ——— o fumo da fábrica: quatro baforadas a subir e a dissipar ——— */
  {
    const fumo = mundo.querySelector<SVGGElement>(".b-fumo");
    // o fumo sai para a camada do céu: uma camada pesada não pode
    // repintar vinte vezes por segundo só por causa de quatro círculos
    const ceu = mundo.querySelector("#b-gCeu");
    if (fumo && ceu) {
      const posicaoOriginal = fumo.getAttribute("transform");
      const paiOriginal = fumo.parentNode;
      const irmaoSeguinte = fumo.nextSibling;
      ceu.appendChild(fumo);
      feito.push(() => {
        if (paiOriginal) paiOriginal.insertBefore(fumo, irmaoSeguinte);
        if (posicaoOriginal === null) fumo.removeAttribute("transform");
        else fumo.setAttribute("transform", posicaoOriginal);
      });
      [...fumo.querySelectorAll<SVGCircleElement>(".b-baforada")].forEach(
        (b, k) => {
          const cy = Number(b.getAttribute("cy"));
          const cx = Number(b.getAttribute("cx"));
          const estiloInicial = b.getAttribute("style");
          const opacidadeInicial = b.getAttribute("opacity");
          aoRestaurar(b, () => {
            b.setAttribute("cy", String(cy));
            b.setAttribute("cx", String(cx));
            if (estiloInicial === null) b.removeAttribute("style");
            else b.setAttribute("style", estiloInicial);
            if (opacidadeInicial === null) b.removeAttribute("opacity");
            else b.setAttribute("opacity", opacidadeInicial);
          });
          return acompanhar(gsap
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
            .to(b, { opacity: 0, duration: 1.3 }, 2.3)
          );
        }
      );
    }
  }

  /* ——— o brilho da água: oito traços do conjunto fixo da planta ——— */
  {
    const agua = mundo.querySelector("#b-gAgua") ?? mundo.querySelector("#b-cRio");
    if (agua) {
      // [0..2] são os pontos do elétrico; os oito pontos seguintes são o rio.
      const pontosAgua = opcoes.pontos.slice(3, 11);
      const h = pontosAgua
        .map(([x, y]) => `<path class="b-brilho-agua" d="M${(x - 8).toFixed(0)} ${y.toFixed(0)} q8 -5 16 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0"/>`)
        .join("");
      agua.insertAdjacentHTML("afterbegin", h);
      const brilhos = [...agua.querySelectorAll<SVGPathElement>(".b-brilho-agua")].filter((b) => b.getAttribute("opacity") === "0");
      feito.push(() => brilhos.forEach((b) => b.remove()));
      brilhos.forEach((b, k) =>
        acompanhar(gsap.to(b, {
          opacity: 0.9,
          x: 6,
          duration: 1.2,
          yoyo: true,
          repeat: -1,
          repeatDelay: 1.5 + (k % 5) * 0.6,
          delay: k * 0.37,
          ease: "sine.inOut",
        }))
      );
    }
  }

  return limparTudo;
  } catch (erro) {
    limparTudo();
    throw erro;
  }
}
