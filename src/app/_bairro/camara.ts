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

  /** A largura que mostra o bairro todo à altura que o ecrã tem. */
  larguraTudo(): number {
    return Math.max(LIMITES.w, LIMITES.h / this.razao());
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

  /** Ver o bairro inteiro. */
  tudo(dur = 1): void {
    const w = this.larguraTudo();
    this.ir(LIMITES.x + LIMITES.w / 2, LIMITES.y + LIMITES.h / 2, w, dur);
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

    const aoRodar = (e: WheelEvent) => {
      e.preventDefault();
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
      }
    };

    const aoMover = (e: PointerEvent) => {
      if (!this.toques.has(e.pointerId)) return;
      this.toques.set(e.pointerId, e);
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
        janela.classList.add("b-arrasto");
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
      janela.classList.remove("b-arrasto");
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
    };
  }

  /**
   * O enquadramento inicial: no telemóvel começa perto da fábrica e da
   * avenida, no computador vê-se o bairro todo. Enquanto ninguém mexeu,
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
  if (!largura) return;
  const k = pinos.length
    ? Math.min(1.7, Math.max(0.55, pinos[0].g.ownerSVGElement?.viewBox.baseVal.width ?? 1000) / largura)
    : 1;

  // fase 2: escrever — os y já vieram da mesma conta que o enquadramento usou
  const ys = repartirPinos(
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
 * O encaixe puro: parte de uma vista candidata e ajusta-a (no x, e a
 * subir no y) até que todas as caixas fiquem inteiras com as folgas do
 * dono. Devolve a vista final — sem tocar em nada. Com `podeAlargar` a
 * falso, a largura fica: desloca-se só o necessário e o que não couber
 * nos lados fica de fora (o arrasto vai buscá-lo) — é o que se quer
 * quando alargar derrubaria a fonte abaixo da legibilidade.
 */
function encaixaCaixas(
  v: { x: number; y: number; w: number; h: number },
  L: number,
  caixas: { id: string; esq: number; dir: number; topo: number; fundo: number }[],
  folgaTopo: number,
  folgaLado: number,
  podeAlargar = true
): { x: number; y: number; w: number; h: number } {
  const r = { ...v };
  const razao = r.h / r.w;
  const minEsq = Math.min(...caixas.map((c) => c.esq));
  const maxDir = Math.max(...caixas.map((c) => c.dir));
  const minTopo = Math.min(...caixas.map((c) => c.topo));
  const maxFundo = Math.max(...caixas.map((c) => c.fundo));

  // X: se o conteúdo não cabe, a vista alarga; senão, desloca-se o mínimo
  const precisoX = (maxDir - minEsq) / (1 - (2 * folgaLado) / L);
  if (podeAlargar && precisoX > r.w) {
    r.w = precisoX;
    r.h = r.w * razao;
    const fm = folgaLado / (L / r.w);
    r.x = minEsq - fm;
  } else {
    const fm = folgaLado / (L / r.w);
    if (minEsq < r.x + fm) r.x = minEsq - fm;
    else if (maxDir > r.x + r.w - fm) r.x = maxDir + fm - r.w;
  }

  // Y: sobe a vista até o marcador mais alto ter a folga do topo
  const s = L / r.w;
  const ft = folgaTopo / s;
  const ff = folgaLado / s;
  if (minTopo < r.y + ft) r.y = minTopo - ft;
  else if (maxFundo > r.y + r.h - ff) r.y = maxFundo + ff - r.h;
  return r;
}

/**
 * A vista do arranque, EM PURA — e é esta função que o teste do CSS usa
 * para conferir o enquadramento por omissão: o `bairro.css` e a câmara
 * saem daqui, não de duas contas gémeas que um dia divergem.
 *
 * No computador mostram-se TODOS os marcadores com as folgas do dono; a
 * vista parte do enquadramento de referência do protótipo e estica só o
 * que faltar. No telemóvel começa-se perto da fábrica e da avenida (o
 * protótipo), mas a vista tem de conter os marcadores essenciais: se não
 * couberem, alarga-se ATÉ couberem — medido, não adivinhado. A fonte dos
 * valores desce com a escala (19×k×s); nos ecrãs estreitos fica
 * ~13,7–14,2 px, acima dos 11 px de legibilidade que o dono fixou; os
 * outros marcadores ficam a um arrasto de distância.
 */
export function vistaInicial(
  e: Enquadramentos,
  L: number,
  A: number,
  pinos: readonly PinoPlanta[]
): Vista {
  const razao = A / L;
  const caixas = caixasAposCadeia(pinos, L);
  if (L < 700) {
    const [x, y] = e.perto;
    const ess = caixas.filter((c) => ESSENCIAIS.has(c.id));
    const larguraConteudo = Math.max(...ess.map((c) => c.dir)) - Math.min(...ess.map((c) => c.esq));
    const w = Math.max(820, larguraConteudo / (1 - (2 * FOLGA_LADO) / L));
    const v = encaixaCaixas(
      { x: x - w / 2, y: y - 10 - (w * razao) / 2, w, h: w * razao },
      L, ess, FOLGA_TOPO, FOLGA_LADO
    );
    return v;
  }
  const [x, y] = e.longe;
  const w0 = Math.max(1500, 1140 / razao);
  const base = { x: x - w0 / 2, y: y - (w0 * razao) / 2, w: w0, h: w0 * razao };
  const v = encaixaCaixas(base, L, caixas, FOLGA_TOPO, FOLGA_LADO, true);
  // Piso de legibilidade: mostrar os 13 alarga a vista; se a fonte dos
  // valores (19 unidades × compensação k × escala s) baixar de 11 px
  // efectivos, mantém-se a largura do protótipo — encaixa-se só o topo
  // (o defeito que o dono apanhou) e o que ficar nos lados fica ao
  // alcance do arrasto. Nos ecrãs do dono (1280+) sobra folga.
  const k = Math.min(1.7, Math.max(0.55, MUNDO.w / L));
  if (19 * k * (L / v.w) < 11) {
    return encaixaCaixas(base, L, caixas, FOLGA_TOPO, FOLGA_LADO, false);
  }
  return v;
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
