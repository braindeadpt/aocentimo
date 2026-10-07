"use client";

/**
 * A câmara do bairro — a única coisa que escreve em
 * `<div class="b-mundo">`.
 *
 * AS REGRAS DE DESEMPENHO (design/prototipos/README.md, obrigatórias):
 *
 *  · A CÂMERA NUNCA MEXE NO `viewBox`. O mundo está desenhado uma vez em
 *    camadas SVG grandes; a câmara só o desloca e escala com `transform`
 *    CSS, que o compositor resolve sem repintar. Mexer no viewBox obrigava
 *    o browser a repintar milhares de nós a cada gesto — foi o que levou o
 *    protótipo de 12 para ~35 fps.
 *  · QUANDO A ESCALA MUDA E A CÂMARA PÁRA, pede-se uma pintura nova à
 *    escala certa (a classe `b-repinta`), senão fica desfocado.
 *  · A CÂMARA ENQUADRA-SE QUANDO O CONTENTOR TEM TAMANHO (ResizeObserver),
 *    nunca só no arranque: a página pode nascer escondida e sem largura.
 *
 * É uma classe, não um hook, porque não quer re-render do React a cada
 * gesto — o React nem fica a saber de que a câmara se mexeu. Quem quiser
 * reagir (o cartão, uma cena) passa uma função de retorno.
 */
// O cliente NÃO importa a planta nem a projeção: os dois pontos onde a
// câmara pode enquadrar chegam prontos do servidor, em coordenadas de
// ecrã. Importar `planta.ts` aqui arrastaria o desenho inteiro do bairro
// para o pacote do browser por causa de dois números.
import { MUNDO } from "@/lib/bairro/iso";

/** Onde a câmara pode enquadrar: perto da fábrica, ou o bairro todo. */
export interface Enquadramentos {
  /** O ponto de partida no ecrã estreito (perto da fábrica e da avenida). */
  perto: [number, number];
  /** O ponto de partida no ecrã largo. */
  longe: [number, number];
}

/** Os limites por onde a câmara pode passear (do protótipo). */
export const LIMITES = { x: -300, y: -120, w: 2150, h: 1520 } as const;

/** Um marcador como o servidor o descreve: âncora e largura da placa, em unidades do mundo. */
export interface PinoPlanta {
  id: string;
  x: number;
  y: number;
  w: number;
}

/**
 * As folgas do enquadramento inicial, em px de ecrã — o critério do dono:
 * TODOS os marcadores inteiros no desktop com 12 px a mais em cima (é por
 * cima que a cadeia os empurra, e é lá que cortavam) e 2 px nos outros
 * lados. São critérios de teste também (`bairro.spec.ts`).
 */
export const FOLGA_TOPO = 12;
export const FOLGA_LADO = 2;

/**
 * A caixa do tabuleiro — a laje do bairro com as duas faces de terra, em
 * coordenadas do mundo, medida no SVG (as faces `#a48f72` e `#b39e80` da
 * planta vão de x −560 a 1744 e acabam em y 1427). O enquadramento
 * inicial mostra-a INTEIRA (pedido do dono a 2026-10-07: «o mapa, tanto
 * em desktop como mobile, devia estar assim logo no início, totalmente
 * visível»). O topo do tabuleiro é a torre, e acima dela só há
 * marcadores, por isso o topo vem dos marcadores. O e2e confere os
 * cantos da laje no ecrã (`bairro.spec.ts`).
 */
export const TABULEIRO = { esq: -560, dir: 1744, topo: -150, fundo: 1427 } as const;

/** A folga do tabuleiro inteiro nos lados e em baixo, em px de ecrã. */
export const FOLGA_TABULEIRO = 16;

/** Os marcadores que a vista estreita tem de mostrar sempre. */
export const ESSENCIAIS = new Set(["fabrica", "casa", "quiosque", "banco"]);

/** O rectângulo que a câmara está a ver, em coordenadas do mundo. */
export interface Vista {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface OpcoesCamera {
  /** Chamada quando a vista muda — quem quiser desenhar por cima. */
  aoMudar?: (v: Vista) => void;
  /** Chamado na primeira pintura com tamanho, para as janelas acesas. */
  aoEnquadrar?: () => void;
}

/** A última arrumação escrita, pelo primeiro marcador (muda se o DOM mudar). */
const arrumacoes = new WeakMap<SVGGElement, { largura: number; n: number; ys: number[] }>();

/** A vista que a câmara escreveu por último em cada janela. */
const vistaDaJanela = new WeakMap<HTMLElement, Vista>();

export class Camera {
  private janela: HTMLElement;
  private mundo: HTMLElement;
  private vista: Vista = { x: 0, y: 0, w: 1000, h: 600 };
  private opts: OpcoesCamera;

  private escalaPintada = 0;
  private temporizadorRepinta: ReturnType<typeof setTimeout> | null = null;
  private toques = new Map<number, PointerEvent>();
  private arrasto: { x: number; y: number; vx: number; vy: number; mov: boolean } | null = null;
  private pinca: { d: number; w: number } | null = null;
  /** O último `pointermove` por aplicar: aplica-se UM por fotograma. */
  private pendente: PointerEvent | null = null;
  private quadro = 0;
  private fimRoda: ReturnType<typeof setTimeout> | null = null;
  private cacheTudo: { L: number; A: number; n: number; w: number } | null = null;
  private mexeu = false;
  private enquadrado = false;
  private gsap: { to: (alvo: object, vars: object) => unknown } | null = null;
  private enquadramentos: Enquadramentos | null = null;
  private pinos: PinoPlanta[] = [];

  constructor(janela: HTMLElement, mundo: HTMLElement, opts: OpcoesCamera = {}) {
    this.janela = janela;
    this.mundo = mundo;
    this.opts = opts;
  }

  /** Os dois pontos de enquadramento, calculados no servidor. */
  defEnquadrar(e: Enquadramentos): void {
    this.enquadramentos = e;
  }

  /**
   * Os marcadores, em âncoras do mundo — vêm do servidor (`pinosDaCamera`)
   * porque é lá que se sabe onde os edifícios estão; o browser só sabe a
   * largura da janela, e é com as duas coisas que o enquadramento se mede.
   */
  defPinos(p: PinoPlanta[]): void {
    this.pinos = p;
  }

  /** Liga o GSAP quando ele chega. Sem ele, `ir()` salta em vez de deslizar. */
  ligarGsap(gsap: { to: (alvo: object, vars: object) => unknown } | null): void {
    this.gsap = gsap;
  }

  /** A vista de agora. */
  get atual(): Vista {
    return { ...this.vista };
  }

  /** A altura pela largura — o mapa é isométrico, o=râcio não é livre. */
  private razao(): number {
    return this.janela.clientWidth ? this.janela.clientHeight / this.janela.clientWidth : 0.6;
  }

  /** A largura que mostra o bairro todo (o tabuleiro e os marcadores inteiros). */
  larguraTudo(): number {
    const e = this.enquadramentos;
    const L = this.janela.clientWidth;
    const A = this.janela.clientHeight;
    if (!e || !this.pinos.length || !L || !A) return Math.max(LIMITES.w, LIMITES.h / this.razao());
    // a pinça pergunta isto a cada fotograma; só muda com o tamanho da janela
    const c = this.cacheTudo;
    if (c && c.L === L && c.A === A && c.n === this.pinos.length) return c.w;
    const w = vistaInicial(e, L, A, this.pinos).w;
    this.cacheTudo = { L, A, n: this.pinos.length, w };
    return w;
  }

  /**
   * Escreve a transformação. É a ÚNICA vez que a câmara toca no DOM:
   * `transform` no contentor, nada mais. Os marcadores são re-arrumados
   * aqui porque precisam de saber a escala a que estão a ser vistos.
   */
  aplicar(): void {
    this.vista.h = this.vista.w * this.razao();
    const s = this.janela.clientWidth / this.vista.w;
    this.mundo.style.transform =
      `translate(${(-(this.vista.x - MUNDO.x) * s).toFixed(2)}px, ` +
      `${(-(this.vista.y - MUNDO.y) * s).toFixed(2)}px) ` +
      `scale(${s.toFixed(5)})`;
    vistaDaJanela.set(this.janela, { ...this.vista });
    // uma pintura nova à escala certa, quando a escala mudou e a câmara parou
    if (Math.abs(s - this.escalaPintada) / s > 0.03) {
      if (this.temporizadorRepinta) clearTimeout(this.temporizadorRepinta);
      this.temporizadorRepinta = setTimeout(() => {
        this.escalaPintada = s;
        this.mundo.classList.add("b-repinta");
        requestAnimationFrame(() =>
          requestAnimationFrame(() => this.mundo.classList.remove("b-repinta"))
        );
      }, 180);
    }
    this.opts.aoMudar?.(this.atual);
  }

  /** Um salto brusco para uma vista. */
  irPara(cx: number, cy: number, w: number, desvio = 0): void {
    const h = w * this.razao();
    this.vista.x = cx - w / 2 - desvio;
    this.vista.y = cy - h / 2;
    this.vista.w = w;
    this.aplicar();
  }

  /**
   * Um deslize suave para uma vista. Com GSAP, interpola a `Vista` e
   * repinta a cada passo; sem GSAP (ou com prefers-reduced-motion), salta.
   */
  ir(cx: number, cy: number, w: number, dur = 1, desvio = 0): void {
    const h = w * this.razao();
    const alvo = { x: cx - w / 2 - desvio, y: cy - h / 2, w };
    if (this.gsap) {
      this.gsap.to(this.vista, { ...alvo, duration: dur, ease: "power2.inOut", onUpdate: () => this.aplicar() });
    } else {
      this.irPara(cx, cy, w, desvio);
    }
  }

  /** Ver o bairro inteiro — a mesma vista do arranque. */
  tudo(dur = 1): void {
    const e = this.enquadramentos;
    if (!e || !this.pinos.length) return;
    const v = vistaInicial(e, this.janela.clientWidth, this.janela.clientHeight, this.pinos);
    this.ir(v.x + v.w / 2, v.y + v.h / 2, v.w, dur);
  }

  /** Aproxima (f > 1) ou afasta, à volta de um ponto da janela. */
  zoom(f: number, px = 0.5, py = 0.5): void {
    this.mexeu = true;
    const w = Math.min(this.larguraTudo() * 1.15, Math.max(300, this.vista.w / f));
    const cx = this.vista.x + this.vista.w * px;
    const cy = this.vista.y + this.vista.h * py;
    this.vista.x = cx - w * px;
    this.vista.y = cy - w * this.razao() * py;
    this.vista.w = w;
    this.aplicar();
  }

  /* ————— os gestos ————— */

  /**
   * Liga arrastar, roda e pinça. Um `pointermove` no `window` (e não no
   * contentor) porque o dedo sai do mapa a meio do gesto — se só
   * escutássemos aqui, o mapa «saltava» ao levantar o dedo.
   */
  ligar(): () => void {
    const janela = this.janela;

    // O GESTO SEM REPINTAR também na pinça e na roda (iPad, 2026-10-07):
    // só o arrasto de um dedo punha `b-arrasto`, e a pinça fazia o WebKit
    // repintar o bairro inteiro, com as animações a correr, a cada passo.
    const emGesto = (sim: boolean) => janela.classList.toggle("b-arrasto", sim);

    const aoRodar = (e: WheelEvent) => {
      e.preventDefault();
      emGesto(true);
      if (this.fimRoda) clearTimeout(this.fimRoda);
      this.fimRoda = setTimeout(() => {
        this.fimRoda = null;
        if (!this.toques.size) emGesto(false);
      }, 220);
      const r = janela.getBoundingClientRect();
      this.zoom(
        e.deltaY < 0 ? 1.15 : 1 / 1.15,
        (e.clientX - r.left) / r.width,
        (e.clientY - r.top) / r.height
      );
    };

    const aoBaixar = (e: PointerEvent) => {
      this.toques.set(e.pointerId, e);
      if (this.toques.size === 1) {
        this.arrasto = { x: e.clientX, y: e.clientY, vx: this.vista.x, vy: this.vista.y, mov: false };
      } else if (this.toques.size === 2) {
        const [a, b] = [...this.toques.values()];
        this.pinca = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), w: this.vista.w };
        this.arrasto = null;
        emGesto(true);
      }
    };

    // O iPad entrega `pointermove` a 120 Hz, e cada um lia o tamanho da
    // janela e escrevia o transform: guardamos o último e aplicamos UM
    // por fotograma.
    const aoMover = (e: PointerEvent) => {
      if (!this.toques.has(e.pointerId)) return;
      this.toques.set(e.pointerId, e);
      this.pendente = e;
      if (!this.quadro) this.quadro = requestAnimationFrame(passo);
    };

    const passo = () => {
      this.quadro = 0;
      const e = this.pendente;
      this.pendente = null;
      if (!e) return;
      if (this.pinca && this.toques.size === 2) {
        const [a, b] = [...this.toques.values()];
        const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const r = janela.getBoundingClientRect();
        this.zoom(
          this.vista.w / ((this.pinca.w * this.pinca.d) / d),
          ((a.clientX + b.clientX) / 2 - r.left) / r.width,
          ((a.clientY + b.clientY) / 2 - r.top) / r.height
        );
        return;
      }
      if (!this.arrasto) return;
      const k = this.vista.w / janela.clientWidth;
      const dx = e.clientX - this.arrasto.x;
      const dy = e.clientY - this.arrasto.y;
      if (Math.hypot(dx, dy) > 5) {
        this.arrasto.mov = true;
        emGesto(true);
      }
      if (this.arrasto.mov) {
        this.vista.x = this.arrasto.vx - dx * k;
        this.vista.y = this.arrasto.vy - dy * k;
        this.aplicar();
      }
    };

    const aoLevantar = (e: PointerEvent) => {
      this.toques.delete(e.pointerId);
      if (this.toques.size < 2) this.pinca = null;
      if (!this.toques.size) {
        // o último movimento ainda por aplicar fica aplicado já
        if (this.quadro) {
          cancelAnimationFrame(this.quadro);
          passo();
        }
        emGesto(false);
      }
      // um instante para o click do rato não valer como arrasto
      setTimeout(() => {
        if (!this.toques.size) this.arrasto = null;
      }, 0);
    };

    const aoMexer = () => {
      this.mexeu = true;
    };

    const aoResize = () => this.enquadrarSePrecisa();

    window.addEventListener("pointermove", aoMover);
    window.addEventListener("pointerup", aoLevantar);
    window.addEventListener("pointercancel", aoLevantar);
    janela.addEventListener("wheel", aoRodar, { passive: false });
    janela.addEventListener("pointerdown", aoBaixar);
    janela.addEventListener("pointerdown", aoMexer);
    janela.addEventListener("wheel", aoMexer);

    // o contentor pode nascer escondido e sem largura — só se enquadra
    // quando tem tamanho, e re-enquadra ao mudar
    const ro = new ResizeObserver(aoResize);
    ro.observe(janela);

    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerup", aoLevantar);
      window.removeEventListener("pointercancel", aoLevantar);
      janela.removeEventListener("wheel", aoRodar);
      janela.removeEventListener("pointerdown", aoBaixar);
      janela.removeEventListener("pointerdown", aoMexer);
      janela.removeEventListener("wheel", aoMexer);
      ro.disconnect();
      if (this.temporizadorRepinta) clearTimeout(this.temporizadorRepinta);
      if (this.fimRoda) clearTimeout(this.fimRoda);
      if (this.quadro) cancelAnimationFrame(this.quadro);
    };
  }

  /**
   * O enquadramento inicial: o bairro todo, no telemóvel e no computador
   * (pedido do dono a 2026-10-07). Enquanto ninguém mexeu,
   * um `resize` volta a enquadrar; depois disso mantém o centro (o
   * utilizador escolheu onde estava, não se lhe tira a escolha).
   */
  private enquadrarSePrecisa(): void {
    if (!this.janela.clientWidth || !this.janela.clientHeight) return;
    if (!this.enquadrado) {
      this.enquadrado = true;
      this.enquadrar();
      this.opts.aoEnquadrar?.();
      return;
    }
    if (!this.mexeu) this.enquadrar();
    else this.aplicar();
  }

  /**
   * O enquadramento em si — POR MEDIÇÃO, não por constantes: primeiro a
   * cadeia de marcadores é repartida (a mesma conta que a aplicação lhes
   * vai dar), e só depois se escolhe a vista que a mostra. Foi medir que
   * faltava: a câmara antiga partia de constantes e o pin da Segurança
   * Social, empurrado para cima pela cadeia, nascia cortado pelo tecto.
   */
  enquadrar(): void {
    const e = this.enquadramentos;
    if (!e || !this.pinos.length) return;
    const v = vistaInicial(e, this.janela.clientWidth, this.janela.clientHeight, this.pinos);
    this.irPara(v.x + v.w / 2, v.y + v.h / 2, v.w);
  }

  /** O gesto actual foi um arrasto? Então o click não é um click. */
  get foiArrasto(): boolean {
    return this.arrasto?.mov ?? false;
  }
}

/* ——————————————————— os marcadores à escala ——————————————————— */

/** Um marcador, tal como a planta o escreve. */
export interface MarcadorVivo {
  g: SVGGElement;
  x: number;
  y: number;
  w: number;
  guia: SVGPathElement | null;
}

/**
 * Mantém os marcadores do tamanho certo e sem sobreposição quando a
 * câmara muda a escala.
 *
 * Sem isto, o marcador é desenhado no tamanho do mundo: a afastar, fica
 * ilegível; a aproximar, tapa o edifício todo. O truque do protótipo é
 * contrário ao mundo — o marcador é compensado com `scale(1/k)` para
 * ficar sempre com o mesmo tamanho no ecrã, e depois, se ainda assim
 * se sobrepuser a outro, sobe até caber.
 */
export function arrumarPinos(janela: HTMLElement, pinos: readonly MarcadorVivo[]): void {
  const largura = janela.clientWidth;
  if (!largura || !pinos.length) return;
  const k = Math.min(
    1.7,
    Math.max(0.55, pinos[0].g.ownerSVGElement?.viewBox.baseVal.width ?? 1000) / largura
  );

  // A arrumação só depende da largura da janela: arrastar não a muda.
  // Reescrever 13 `transform` a cada fotograma do arrasto invalidava a
  // camada de topo sem mudar um píxel (auditoria 2026-10-06, Item B).
  const feita = arrumacoes.get(pinos[0].g);
  let ys: number[];
  if (feita && feita.largura === largura && feita.n === pinos.length) {
    ys = feita.ys;
  } else {
    // fase 2: escrever — os y já vieram da mesma conta que o enquadramento usou
    ys = repartirPinos(
      pinos.map((p) => ({ id: "", x: p.x, y: p.y, w: p.w })),
      largura
    );
    pinos.forEach((p, i) => {
      const y = ys[i];
      p.g.setAttribute(
        "transform",
        `translate(${p.x.toFixed(1)} ${y.toFixed(1)}) scale(${k.toFixed(3)})`
      );
      // a guia estica-se para o edifício, que fica onde estava
      if (p.guia) p.guia.setAttribute("d", `M0 0 V${((p.y - y) / k).toFixed(1)}`);
    });
    arrumacoes.set(pinos[0].g, { largura, n: pinos.length, ys });
  }

  esconderCortados(janela, pinos, ys, k);
}

/** A largura abaixo da qual a vista é «de telemóvel» — a mesma de `vistaInicial`. */
export const LARGURA_ESTREITA = 700;

/**
 * No telemóvel, um marcador que não cabe INTEIRO na janela esconde-se
 * (classe `b-fora`, o CSS esbate-o) e volta quando entra na vista. A
 * vista estreita é mais pequena do que o bairro: «Cabaz desde 2020» e
 * «Cert. de Aforro» nasciam cortados ao meio nas pontas — meia placa
 * lê-se mal e parece um defeito. No computador nunca se esconde nada.
 * A conta é a mesma das caixas do enquadramento (`caixasAposCadeia`).
 */
export function marcadorCabe(
  p: { x: number; w: number },
  y: number,
  k: number,
  v: Vista,
  L: number,
  A: number
): boolean {
  const s = L / v.w;
  const esq = (p.x - (p.w / 2) * k - v.x) * s;
  const dir = (p.x + (p.w / 2) * k - v.x) * s;
  const topo = (y - 64 * k - v.y) * s;
  const fundo = (y - v.y) * s;
  return esq >= 0 && dir <= L && topo >= 0 && fundo <= A;
}

function esconderCortados(
  janela: HTMLElement,
  pinos: readonly MarcadorVivo[],
  ys: readonly number[],
  k: number
): void {
  const L = janela.clientWidth;
  const A = janela.clientHeight;
  const v = vistaDaJanela.get(janela);
  const estreita = L < LARGURA_ESTREITA && !!v && A > 0;
  pinos.forEach((p, i) => {
    const fora = estreita && !marcadorCabe(p, ys[i], k, v!, L, A);
    // só escreve quando muda: uma classe igual não deve custar nada
    if (p.g.classList.contains("b-fora") !== fora) p.g.classList.toggle("b-fora", fora);
  });
}

/**
 * FASE 1 da arrumação: onde fica a âncora de cada marcador, sem sobre-
 * posições — a MESMA cadeia de subidas de sempre (de baixo para cima, os
 * da frente ficam, os de trás sobem de `PASSO` em `PASSO`), agora numa
 * função pura que o enquadramento também usa: primeiro se calcula onde
 * os marcadores VÃO ficar, depois se escolhe a vista que os mostra.
 */
function repartirPinos(pinos: readonly PinoPlanta[], largura: number): number[] {
  const k = pinos.length
    ? Math.min(1.7, Math.max(0.55, MUNDO.w / largura))
    : 1;
  const alto = 64 * k;
  const folga = 6 * k;
  const passo = 6 * k;
  const postos: { x: number; y: number; w: number }[] = [];
  const res = new Array<number>(pinos.length);

  for (const [p, i] of pinos
    .map((p, i) => [p, i] as const)
    .sort((a, b) => b[0].y - a[0].y)) {
    let y = p.y;
    const toca = (): boolean =>
      postos.some(
        (o) =>
          Math.abs(o.x - p.x) < ((o.w + p.w) / 2) * k + folga &&
          y > o.y - alto - folga &&
          y - alto - folga < o.y
      );
    let guarda = 0;
    while (toca() && y > p.y - 800 && guarda++ < 200) y -= passo;
    postos.push({ x: p.x, y, w: p.w });
    res[i] = y;
  }
  return res;
}

/**
 * A vista do arranque, EM PURA — e é esta função que o teste do CSS usa
 * para conferir o enquadramento por omissão: o `bairro.css` e a câmara
 * saem daqui, não de duas contas gémeas que um dia divergem.
 *
 * DECISÃO DO DONO, 2026-10-07: no computador E no telemóvel o mapa abre
 * TOTALMENTE VISÍVEL — o tabuleiro inteiro (`TABULEIRO`) e os 13
 * marcadores inteiros, centrados na janela. Substitui o arranque do
 * protótipo no telemóvel («perto da fábrica e da avenida») e o piso de
 * 11 px de legibilidade que o acompanhava: no telemóvel os valores ficam
 * pequenos, e quem quiser lê-los aproxima com a pinça ou com o «+».
 *
 * Folgas: 12 px em cima (é por cima que a cadeia empurra os marcadores),
 * 16 px nos lados e em baixo; o que sobrar reparte-se ao meio.
 * `e` fica na assinatura: os pontos de enquadramento continuam a servir
 * as cenas e o OG.
 */
export function vistaInicial(
  e: Enquadramentos,
  L: number,
  A: number,
  pinos: readonly PinoPlanta[]
): Vista {
  void e;
  const caixas = caixasAposCadeia(pinos, L);
  const esq = Math.min(TABULEIRO.esq, ...caixas.map((c) => c.esq));
  const dir = Math.max(TABULEIRO.dir, ...caixas.map((c) => c.dir));
  const topo = Math.min(TABULEIRO.topo, ...caixas.map((c) => c.topo));
  const fundo = Math.max(TABULEIRO.fundo, ...caixas.map((c) => c.fundo));
  const fl = FOLGA_TABULEIRO;
  // a largura que faz caber o conteúdo nas duas direcções, com as folgas
  const wX = (dir - esq) / Math.max(0.1, 1 - (2 * fl) / L);
  const wY = (L * (fundo - topo)) / Math.max(1, A - FOLGA_TOPO - fl);
  const w = Math.max(wX, wY);
  const s = L / w;
  const h = w * (A / L);
  // centrado: o que sobra na horizontal e na vertical reparte-se ao meio
  const x = (esq + dir) / 2 - w / 2;
  const sobraY = h - (fundo - topo) - (FOLGA_TOPO + fl) / s;
  const y = topo - FOLGA_TOPO / s - sobraY / 2;
  return { x, y, w, h };
}

/**
 * As caixas dos marcadores DEPOIS da cadeia de subidas, em coordenadas
 * do mundo: o rectângulo que o enquadramento tem de mostrar.
 */
function caixasAposCadeia(
  pinos: readonly PinoPlanta[],
  largura: number
): { id: string; esq: number; dir: number; topo: number; fundo: number }[] {
  const k = Math.min(1.7, Math.max(0.55, MUNDO.w / largura));
  const alto = 64 * k;
  const ys = repartirPinos(pinos, largura);
  return pinos.map((p, i) => ({
    id: p.id,
    esq: p.x - (p.w / 2) * k,
    dir: p.x + (p.w / 2) * k,
    topo: ys[i] - alto,
    fundo: ys[i],
  }));
}

/** O `k` (escala do marcador) que `arrumarPinos` está a usar, para testes. */
export function escalaDoMarcador(janela: HTMLElement, larguraMundo: number): number {
  if (!janela.clientWidth) return 1;
  return Math.min(1.7, Math.max(0.55, larguraMundo / janela.clientWidth));
}
