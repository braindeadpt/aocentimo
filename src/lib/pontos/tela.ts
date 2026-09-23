/**
 * tela — o motor de canvas do <CampoCentimos> (V4, S1-04).
 *
 * Desenha a moeda de 1 € a oscilar em repouso e a coreografia aprovada
 * da revelação (referencias/V4/prototipo-moeda.html): a moeda pára de
 * frente, desfaz-se nos seus cêntimos (cada ponto herda o metal que
 * tinha por baixo), pausa «um euro são 100 cêntimos», as fatias ganham
 * a cor semântica, a do que sai destaca-se e os pontos voam para os
 * montes — ou para a grelha — com atraso escalonado.
 *
 * Sem React e sem bibliotecas: molas amortecidas (molaPasso), rAF só
 * enquanto houver movimento, PAUSA fora do ecrã (IntersectionObserver)
 * e com o separador escondido (visibilitychange). Em
 * prefers-reduced-motion o estado pedido desenha-se uma vez — nunca
 * há rotação nem transição.
 *
 * As cores semânticas lêem-se dos tokens CSS em runtime (--accent,
 * --keep, --ink2) e re-lêem-se quando o tema muda — os metais são o
 * objecto real e não trocam de cor.
 */
import {
  ANEL_DISCO,
  ESPESSURA,
  OSCILACAO,
  THETA_PARADA,
  METAL,
  COREO,
  faceMoeda,
  geoMoeda,
  posNaFace,
  geoGrelha,
  slotGrelha,
  geoMontes,
  slotMonte,
  atribuirSectores,
  atribuirSequencia,
  reatribuir,
  molaPasso,
  molaAssentou,
  type NomeLayout,
  type TomParte,
  type CorpoMola,
  type PontoMoeda,
} from "./layouts";

type Rgb = [number, number, number];
type Estado = "repouso" | "revelar" | "montes" | "grelha" | "voltar";

interface Ponto extends CorpoMola {
  ux: number;
  uy: number;
  metal: "ouro" | "prata";
  /** cor de origem — o metal na face */
  base: Rgb;
  /** cor actual — mistura entre metal e cor semântica */
  col: Rgb;
  part: number;
  rank: number;
  /** posição entre os pontos sem dono (part −1) — destino na grelha */
  livre: number;
  /** true enquanto vive na face da moeda (raio de desenho maior) */
  naMoeda: boolean;
}

export interface ParteTela {
  tom: TomParte;
}

export interface CoresTela {
  sai: Rgb;
  fica: Rgb;
  neutro: Rgb;
  /** família da serifada — para o «1» e o «EURO» gravados na moeda */
  serif: string;
}

export interface CampoTelaOpts {
  total?: number;
  layout?: NomeLayout;
  partes?: readonly ParteTela[];
  /** pontos por parte — saída de repartir() */
  pontos?: readonly number[];
  onRotulos?: (on: boolean) => void;
  /** legenda do palco: pausa («100 cêntimos») → saiem → pronto (montes) */
  onLegenda?: (q: "pausa" | "saiem" | "pronto" | null) => void;
  /** chamado depois do primeiro frame desenhado — o svg de SSR esconde-se */
  onPronto?: () => void;
}

const misturar = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const rgba = (c: readonly number[], al: number) =>
  `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${al})`;

/** "#rrggbb" | "#rgb" | "rgb(…)" → [r,g,b] */
export function paraRgb(s: string): Rgb {
  const v = s.trim();
  if (v.startsWith("#")) {
    const h = v.slice(1);
    if (h.length === 3)
      return [
        parseInt(h[0] + h[0], 16),
        parseInt(h[1] + h[1], 16),
        parseInt(h[2] + h[2], 16),
      ];
    if (h.length >= 6)
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
      ];
  }
  const m = /rgba?\(([^)]+)\)/.exec(v);
  if (m) {
    const p = m[1].split(/[\s,/]+/).map(parseFloat);
    return [p[0] || 0, p[1] || 0, p[2] || 0];
  }
  return [128, 128, 128];
}

export class CampoTela {
  private tela: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private el: HTMLElement;
  private opts: CampoTelaOpts;
  private reduz: MediaQueryList;

  private W = 0;
  private H = 0;
  private dpr = 1;
  private visivel = true;
  private raf = 0;
  private ultimo = 0;
  private relogio = 0;
  private theta = 0;
  private theta0 = 0;
  private tEstado = 0;
  private fase = 0;
  private estado: Estado = "repouso";
  private alvo: "montes" | "grelha" = "montes";

  private face: PontoMoeda[];
  private dots: Ponto[];
  private partes: readonly ParteTela[];
  private pontos: readonly number[];
  private cores!: CoresTela;
  private pronto = false;

  private ro?: ResizeObserver;
  private io?: IntersectionObserver;
  private mo?: MutationObserver;
  private limpa: (() => void)[] = [];

  constructor(tela: HTMLCanvasElement, palco: HTMLElement, opts: CampoTelaOpts) {
    this.tela = tela;
    this.el = palco;
    this.opts = opts;
    const ctx = tela.getContext("2d");
    if (!ctx) throw new Error("CampoCentimos: sem contexto 2d");
    this.ctx = ctx;
    this.reduz = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.partes = opts.partes ?? [];
    this.pontos = opts.pontos ?? [];
    const total = opts.total ?? 100;
    this.face = faceMoeda(total);
    this.dots = this.face.map((p) => ({
      ux: p.ux,
      uy: p.uy,
      metal: p.metal,
      base: [...METAL[p.metal]] as Rgb,
      col: [...METAL[p.metal]] as Rgb,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      tx: 0,
      ty: 0,
      part: -1,
      rank: 0,
      livre: 0,
      naMoeda: true,
    }));
    this.cores = this.lerCores();

    const inicial = opts.layout ?? "moeda";
    if (inicial === "moeda") {
      this.estado = "repouso";
    } else {
      this.estado = inicial;
      this.alvo = inicial;
      const donos = atribuirSequencia(total, this.pontos);
      let liv = 0;
      this.dots.forEach((d, i) => {
        d.part = donos[i].part;
        d.rank = donos[i].rank;
        d.livre = d.part < 0 ? liv++ : 0;
        d.naMoeda = false;
        d.col = [...this.corAlvo(d)] as Rgb;
      });
    }

    // — observadores: tamanho, visibilidade, separador, tema, fontes —
    this.ro = new ResizeObserver(() => this.medir());
    this.ro.observe(palco);
    if (typeof IntersectionObserver !== "undefined") {
      this.io = new IntersectionObserver(
        (e) => {
          this.visivel = e[0].isIntersecting && !document.hidden;
          if (this.visivel) this.pedir();
        },
        { threshold: 0.05 }
      );
      this.io.observe(palco);
    }
    const onVis = () => {
      this.visivel = !document.hidden;
      if (this.visivel) this.pedir();
    };
    document.addEventListener("visibilitychange", onVis);
    this.limpa.push(() => document.removeEventListener("visibilitychange", onVis));
    // tema: os tokens trocam com data-theme — re-lê e redesenha
    this.mo = new MutationObserver(() => {
      this.cores = this.lerCores();
      if (this.estado === "montes" || this.estado === "grelha")
        this.dots.forEach((d) => (d.col = [...this.corAlvo(d)] as Rgb));
      this.pedir(true);
    });
    this.mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const onReduz = () => this.pedir(true);
    this.reduz.addEventListener("change", onReduz);
    this.limpa.push(() => this.reduz.removeEventListener("change", onReduz));
    if (document.fonts?.load) {
      const fam = this.cores.serif.split(",")[0].trim();
      document.fonts
        .load(`600 100px ${fam}`)
        .then(() => this.pedir(true))
        .catch(() => {});
    }
    this.medir();
  }

  destruir(): void {
    this.ro?.disconnect();
    this.io?.disconnect();
    this.mo?.disconnect();
    this.limpa.forEach((f) => f());
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /* ————— dados e layout pedidos ————— */

  setDados(partes: readonly ParteTela[], pontos: readonly number[]): void {
    const mudouPontos = this.pontos.join() !== pontos.join();
    const mudouTons =
      this.partes.map((p) => p.tom).join() !== partes.map((p) => p.tom).join();
    this.partes = partes;
    this.pontos = pontos;
    if (!mudouPontos) {
      // tons novos com os mesmos pontos → as cores convergem na mola
      if (mudouTons) this.pedir();
      return;
    }
    if (this.estado === "montes" || this.estado === "grelha") {
      const donos = reatribuir(
        this.dots.map((d) => ({ part: d.part, rank: d.rank })),
        pontos
      );
      let liv = 0;
      this.dots.forEach((d, i) => {
        d.part = donos[i].part;
        d.rank = donos[i].rank;
        d.livre = d.part < 0 ? liv++ : 0;
      });
      this.retarget();
      this.pedir();
    }
    // em repouso a repartição só interessa ao revelar — nada a fazer
  }

  /** o layout pedido mudou — dispara a transição */
  mudarLayout(nome: NomeLayout): void {
    const actual =
      this.estado === "revelar"
        ? this.alvo
        : this.estado === "voltar"
          ? "moeda"
          : this.estado;
    if (nome === actual) return;
    if (this.reduz.matches) {
      this.saltarPara(nome);
      this.pedir(true);
      return;
    }
    if (nome === "moeda") {
      if (this.estado === "repouso") return;
      this.opts.onRotulos?.(false);
      this.opts.onLegenda?.(null);
      this.estado = "voltar";
      this.fase = 0;
      this.tEstado = performance.now();
      this.pedir();
      return;
    }
    if (this.estado === "repouso") {
      // a revelação completa: moeda → pontos → cores → voo
      this.atribuirSectores();
      this.alvo = nome;
      this.estado = "revelar";
      this.fase = 0;
      this.theta0 = this.theta;
      this.tEstado = performance.now();
      this.pedir();
      return;
    }
    if (this.estado === "revelar") {
      this.alvo = nome;
      return;
    }
    // montes ↔ grelha — voo directo
    this.alvo = nome;
    this.estado = nome;
    this.retarget();
    this.opts.onRotulos?.(nome === "montes");
    this.opts.onLegenda?.(nome === "montes" ? "pronto" : null);
    this.pedir();
  }

  private saltarPara(nome: NomeLayout): void {
    const face0 = this.face;
    if (nome === "moeda") {
      this.estado = "repouso";
      this.theta = THETA_PARADA;
      this.dots.forEach((d, i) => {
        d.part = -1;
        d.naMoeda = true;
        d.col = [...d.base] as Rgb;
        const q = posNaFace(face0[i], geoMoeda(this.W, this.H), THETA_PARADA);
        d.x = d.tx = q.x;
        d.y = d.ty = q.y;
        d.vx = d.vy = 0;
      });
      this.opts.onRotulos?.(false);
      this.opts.onLegenda?.(null);
      return;
    }
    this.estado = nome;
    this.alvo = nome;
    const donos = atribuirSequencia(this.dots.length, this.pontos);
    let liv = 0;
    this.dots.forEach((d, i) => {
      d.part = donos[i].part;
      d.rank = donos[i].rank;
      d.livre = d.part < 0 ? liv++ : 0;
      d.naMoeda = false;
      d.col = [...this.corAlvo(d)] as Rgb;
      d.vx = d.vy = 0;
    });
    this.retarget(true);
    this.opts.onRotulos?.(nome === "montes");
    this.opts.onLegenda?.(nome === "montes" ? "pronto" : null);
  }

  /* ————— geometria de suporte ————— */

  /** índice na grelha: por parte, depois por rank — blocos contíguos;
   *  os pontos sem dono ficam depois de todos */
  private idxGrelha(d: Ponto): number {
    if (d.part < 0 || d.part >= this.pontos.length) {
      const soma = this.pontos.reduce((a, b) => a + b, 0);
      return Math.min(this.dots.length - 1, soma + d.livre);
    }
    let i = d.rank;
    for (let p = 0; p < d.part; p++) i += this.pontos[p] ?? 0;
    return i;
  }

  private alvoDo(d: Ponto): { x: number; y: number } {
    const paraGrelha =
      this.estado === "grelha" ||
      (this.estado === "revelar" && this.alvo === "grelha");
    if (paraGrelha || d.part < 0 || d.part >= this.pontos.length) {
      // sem dono → grelha, depois das partes — mesmo nos montes
      const g = geoGrelha(this.W, this.H, this.dots.length);
      return slotGrelha(g, this.idxGrelha(d));
    }
    const gm = geoMontes(this.W, this.H, this.pontos);
    return slotMonte(gm.montes[d.part], d.rank);
  }

  private retarget(snap = false): void {
    this.dots.forEach((d) => {
      const s = this.alvoDo(d);
      d.tx = s.x;
      d.ty = s.y;
      if (snap) {
        d.x = s.x;
        d.y = s.y;
      }
    });
  }

  private corAlvo(d: Ponto): Rgb {
    const p = d.part >= 0 ? this.partes[d.part] : undefined;
    const tom = p?.tom ?? "neutro";
    return tom === "sai"
      ? this.cores.sai
      : tom === "fica"
        ? this.cores.fica
        : this.cores.neutro;
  }

  private atribuirSectores(): void {
    const donos = atribuirSectores(this.face, this.pontos);
    let liv = 0;
    this.dots.forEach((d, i) => {
      d.part = donos[i].part;
      d.rank = donos[i].rank;
      d.livre = d.part < 0 ? liv++ : 0;
    });
  }

  private lerCores(): CoresTela {
    const cs = getComputedStyle(this.el);
    const serif =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-editorial")
        .trim() || "Georgia, serif";
    return {
      sai: paraRgb(cs.getPropertyValue("--accent") || "#ff6133"),
      fica: paraRgb(cs.getPropertyValue("--keep") || "#63d6a4"),
      neutro: paraRgb(cs.getPropertyValue("--ink2") || "#aba28c"),
      serif,
    };
  }

  /* ————— desenho da moeda — a face comum do 1 € ————— */

  private estrela(x: number, y: number, r: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = -Math.PI / 2 + (k * Math.PI) / 5;
      const rr = k % 2 ? r * 0.42 : r;
      if (k) ctx.lineTo(x + rr * Math.cos(ang), y + rr * Math.sin(ang));
      else ctx.moveTo(x + rr * Math.cos(ang), y + rr * Math.sin(ang));
    }
    ctx.closePath();
    ctx.fill();
  }

  /** gravação em relevo: sombra para baixo, luz para cima, metal por cima */
  private gravar(txt: string, font: string, x: number, y: number, R: number, base: string): void {
    const ctx = this.ctx;
    ctx.font = font;
    ctx.fillStyle = "#a6abb2";
    ctx.fillText(txt, x + R * 0.01, y + R * 0.014);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText(txt, x - R * 0.007, y - R * 0.009);
    ctx.fillStyle = base;
    ctx.fillText(txt, x, y);
  }

  private moeda(th: number, alpha: number): void {
    if (alpha <= 0.01) return;
    const ctx = this.ctx;
    const g = geoMoeda(this.W, this.H);
    const R = g.R;
    const c = Math.cos(th);
    const s = Math.sin(th);
    const esp = ESPESSURA * R * s;
    ctx.save();
    ctx.globalAlpha = alpha;

    // a aresta: a espessura vê-se quando a moeda roda; segmentos lisos e
    // serrilhados alternados
    const passos = Math.max(1, Math.ceil(Math.abs(esp)));
    for (let k = passos; k >= 1; k--) {
      const off = (-esp * k) / passos;
      ctx.beginPath();
      ctx.ellipse(g.cx + off, g.cy, Math.max(0.5, R * c), R, 0, 0, Math.PI * 2);
      ctx.fillStyle = k % 4 < 2 ? rgba(METAL.arestaEscura, 1) : rgba(METAL.arestaClara, 1);
      ctx.fill();
    }

    ctx.translate(g.cx, g.cy);
    ctx.scale(Math.max(0.02, c), 1);
    const luz = 0.5 + th * 0.55; // o brilho metálico desliza com a rotação

    // coroa de latão-níquel (dourada)
    const gl = ctx.createLinearGradient(-R, -R, R, R);
    gl.addColorStop(0, "#8c6f2c");
    gl.addColorStop(Math.max(0, luz - 0.28), "#c9a64e");
    gl.addColorStop(Math.min(1, Math.max(0, luz)), "#f3e2a2");
    gl.addColorStop(Math.min(1, luz + 0.28), "#b8953f");
    gl.addColorStop(1, "#7d6226");
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = gl;
    ctx.fill();
    ctx.lineWidth = R * 0.03;
    ctx.strokeStyle = "rgba(255,238,184,.5)";
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.965, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = R * 0.012;
    ctx.strokeStyle = "rgba(70,52,16,.55)";
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.935, 0, Math.PI * 2);
    ctx.stroke();

    // disco de cuproníquel (prateado)
    const gp = ctx.createLinearGradient(
      -R * ANEL_DISCO,
      -R * ANEL_DISCO,
      R * ANEL_DISCO,
      R * ANEL_DISCO
    );
    gp.addColorStop(0, "#9a9da3");
    gp.addColorStop(Math.max(0, luz - 0.3), "#c9ccd1");
    gp.addColorStop(Math.min(1, Math.max(0, luz)), "#f6f7f8");
    gp.addColorStop(Math.min(1, luz + 0.3), "#b7bac0");
    gp.addColorStop(1, "#8f9298");
    ctx.beginPath();
    ctx.arc(0, 0, R * ANEL_DISCO, 0, Math.PI * 2);
    ctx.fillStyle = gp;
    ctx.fill();
    ctx.lineWidth = R * 0.014;
    ctx.strokeStyle = "rgba(60,60,64,.55)";
    ctx.stroke();

    // seis linhas finas verticais com uma estrela em cada ponta — as
    // doze estrelas da face comum (o mapa pode omitir-se)
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.9, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineWidth = R * 0.008;
    ctx.strokeStyle = "rgba(95,98,104,.75)";
    ctx.fillStyle = "rgba(110,86,30,.9)";
    for (let l = 0; l < 6; l++) {
      const x = R * (0.44 + l * 0.055);
      const yl = Math.sqrt(Math.max(0, 0.83 * R * (0.83 * R) - x * x));
      ctx.beginPath();
      ctx.moveTo(x, -yl + R * 0.05);
      ctx.lineTo(x, -R * 0.2);
      ctx.moveTo(x, R * 0.2);
      ctx.lineTo(x, yl - R * 0.05);
      ctx.stroke();
      this.estrela(x, -yl, R * 0.034);
      this.estrela(x, yl, R * 0.034);
    }
    ctx.restore();

    const serif = this.cores.serif;
    // o «1», grande, com serifa e inclinado, à esquerda
    ctx.save();
    ctx.transform(1, 0, -0.14, 1, 0, 0);
    ctx.textBaseline = "alphabetic";
    this.gravar(
      "1",
      `600 ${(R * 1.12).toFixed(1)}px ${serif}`,
      -R * 0.52,
      R * 0.4,
      R,
      "#c7cacf"
    );
    ctx.restore();

    // «EURO» a atravessar a metade direita
    ctx.textBaseline = "middle";
    const ctxLetras = ctx as CanvasRenderingContext2D & { letterSpacing?: string };
    if ("letterSpacing" in ctxLetras && ctxLetras.letterSpacing !== undefined)
      ctxLetras.letterSpacing = `${(R * 0.012).toFixed(1)}px`;
    this.gravar(
      "EURO",
      `600 ${(R * 0.2).toFixed(1)}px ${serif}`,
      -R * 0.02,
      R * 0.03,
      R,
      "#bfc2c8"
    );
    if ("letterSpacing" in ctxLetras) ctxLetras.letterSpacing = "0px";

    ctx.restore();
  }

  /* ————— desenho dos pontos ————— */

  private pontosDesenho(alpha: number, raioMoeda: number, th = 0): void {
    const ctx = this.ctx;
    const gm = geoMontes(this.W, this.H, this.pontos);
    const gg = geoGrelha(this.W, this.H, this.dots.length);
    const gapRef = this.estado === "grelha" || (this.estado === "revelar" && this.alvo === "grelha")
      ? gg.passo
      : (gm.montes.find((m) => m.cols > 0)?.gap ?? 14);
    const rr = Math.max(2.2, gapRef * 0.34);
    // ordenação em z: os pontos da metade que recua desenham-se primeiro
    // e escurecem — sombreamento por profundidade na face inclinada
    const cos = Math.cos(th);
    const ordenados = this.dots
      .map((d) => ({ d, z: d.ux * cos }))
      .sort((a, b) => a.z - b.z);
    for (const { d } of ordenados) {
      const assenteVerde =
        d.part >= 0 &&
        this.partes[d.part]?.tom === "fica" &&
        this.estado === "montes" &&
        Math.abs(d.tx - d.x) < 2 &&
        Math.abs(d.ty - d.y) < 2;
      if (assenteVerde && !this.reduz.matches) {
        ctx.shadowColor = rgba(this.cores.fica, 0.55);
        ctx.shadowBlur = 9;
      } else {
        ctx.shadowBlur = 0;
      }
      // profundidade: o lado da face que se afasta perde luz
      const sombra = d.naMoeda && th !== 0 ? 0.78 + 0.22 * (1 - Math.abs(d.ux * cos)) : 1;
      ctx.fillStyle = rgba(
        [d.col[0] * sombra, d.col[1] * sombra, d.col[2] * sombra],
        alpha
      );
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.naMoeda ? raioMoeda : rr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /* ————— ciclo de desenho ————— */

  private pedir(forcar = false): void {
    if (this.raf || !this.visivel) return;
    if (forcar) this.ultimo = 0;
    this.raf = requestAnimationFrame(this.quadro);
  }

  private medir(): void {
    const r = this.el.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = r.width;
    this.H = r.height;
    this.tela.width = Math.max(1, Math.round(this.W * this.dpr));
    this.tela.height = Math.max(1, Math.round(this.H * this.dpr));
    if (this.estado === "montes" || this.estado === "grelha") {
      this.retarget(true);
      // posições já assentadas redesenham-se no sítio
      this.dots.forEach((d) => {
        d.x = d.tx;
        d.y = d.ty;
        d.vx = d.vy = 0;
      });
    }
    this.pedir(true);
  }

  private quadro = (agora: number): void => {
    this.raf = 0;
    if (!this.visivel) return;
    const dt = Math.min(48, agora - (this.ultimo || agora));
    this.ultimo = agora;
    const fdt = Math.max(0.1, dt / 16.667);
    const t = agora - this.tEstado;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    const g = geoMoeda(this.W, this.H);
    const raioMoeda = g.R * 0.058;
    let continuar = true;

    if (this.reduz.matches && this.estado === "revelar") {
      this.saltarPara(this.alvo);
    }
    if (this.reduz.matches && this.estado === "voltar") {
      this.saltarPara("moeda");
    }

    if (this.estado === "repouso") {
      if (!this.reduz.matches) {
        this.relogio += dt;
        this.theta = OSCILACAO * Math.sin(this.relogio * 0.0007);
      } else {
        this.theta = THETA_PARADA;
      }
      this.moeda(this.theta, 1);
      continuar = !this.reduz.matches;
    } else if (this.estado === "revelar") {
      continuar = this.quadroRevelar(t, fdt, raioMoeda);
    } else if (this.estado === "montes" || this.estado === "grelha") {
      let assente = true;
      for (const d of this.dots) {
        d.naMoeda = false;
        const alvoC = this.corAlvo(d);
        d.col = misturar(d.col, alvoC, Math.min(1, 0.18 * fdt));
        molaPasso(d, 0.085, 0.72, fdt);
        const corLa =
          Math.abs(d.col[0] - alvoC[0]) +
            Math.abs(d.col[1] - alvoC[1]) +
            Math.abs(d.col[2] - alvoC[2]) <
          6;
        if (!molaAssentou(d) || !corLa) assente = false;
      }
      this.pontosDesenho(1, raioMoeda);
      continuar = !assente;
    } else if (this.estado === "voltar") {
      // os pontos regressam à face, recuperam o metal, a moeda fecha-se
      let todos = true;
      const g0 = geoMoeda(this.W, this.H);
      for (let i = 0; i < this.dots.length; i++) {
        const d = this.dots[i];
        const q = posNaFace(this.face[i], g0, 0);
        d.tx = q.x;
        d.ty = q.y;
        d.naMoeda = true;
        d.col = misturar(d.col, d.base, Math.min(1, 0.12 * fdt));
        molaPasso(d, 0.08, 0.72, fdt);
        if (Math.abs(d.tx - d.x) > 0.6 || Math.abs(d.ty - d.y) > 0.6) todos = false;
      }
      if (todos && this.fase !== 9) {
        this.fase = 9;
        this.tEstado = agora;
      }
      const ef = this.fase === 9 ? Math.min(1, (agora - this.tEstado) / 380) : 0;
      this.moeda(0, ef);
      this.pontosDesenho(1 - ef, raioMoeda);
      if (this.fase === 9 && ef >= 1) {
        this.estado = "repouso";
        this.relogio = 0;
        this.theta = 0;
      }
    }
    if (!this.pronto) {
      this.pronto = true;
      this.opts.onPronto?.();
    }
    if (continuar) this.raf = requestAnimationFrame(this.quadro);
  };

  /** a sequência aprovada da revelação — os tempos vêm de COREO */
  private quadroRevelar(t: number, fdt: number, raioMoeda: number): boolean {
    const g = geoMoeda(this.W, this.H);
    const e1 = Math.min(1, t / COREO.frente);
    const th = this.theta0 * (1 - (1 - Math.pow(1 - e1, 3)));
    const ed = Math.max(0, Math.min(1, (t - COREO.desfazIni) / (COREO.desfazFim - COREO.desfazIni)));
    const ec = Math.max(0, Math.min(1, (t - COREO.coresIni) / (COREO.coresFim - COREO.coresIni)));
    const ep = Math.max(0, Math.min(1, (t - COREO.puxaIni) / (COREO.puxaFim - COREO.puxaIni)));
    const puxa = (1 - Math.pow(1 - ep, 3)) * g.R * 0.14;

    if (this.fase === 0 && t > COREO.pausaIni) {
      this.fase = 0.5;
      this.opts.onLegenda?.("pausa");
    }
    if (this.fase === 0.5 && t > COREO.puxaIni) {
      this.fase = 1;
      this.opts.onLegenda?.("saiem");
    }

    const nPartes = this.pontos.length;
    let todos = true;
    for (const d of this.dots) {
      const q = posNaFace({ ux: d.ux, uy: d.uy, metal: d.metal }, g, th);
      const ordem = d.part >= 0 ? d.part : nPartes;
      const p0 = COREO.vooIni + ordem * COREO.vooPorParte + d.rank * COREO.vooPorPonto;
      d.col = misturar(d.base, this.corAlvo(d), ec);
      if (t < p0) {
        const sai = d.part >= 0 && this.partes[d.part]?.tom === "sai";
        const off = sai ? puxa : 0;
        d.x = q.x - off;
        d.y = q.y;
        d.vx = d.vy = 0;
        d.naMoeda = true;
        todos = false;
      } else {
        const s = this.alvoDo(d);
        d.tx = s.x;
        d.ty = s.y;
        d.naMoeda = false;
        molaPasso(d, 0.075, 0.74, fdt);
        if (
          Math.abs(d.tx - d.x) > 0.4 ||
          Math.abs(d.ty - d.y) > 0.4 ||
          Math.abs(d.vx) > 0.05
        )
          todos = false;
      }
    }
    this.moeda(th, 1 - ed);
    this.pontosDesenho(ed, raioMoeda * (0.7 + 0.3 * ed), th);
    if (this.fase === 1 && t > COREO.vooIni + nPartes * COREO.vooPorParte + 63 * COREO.vooPorPonto + 350) {
      this.fase = 2;
      this.opts.onRotulos?.(this.alvo === "montes");
      this.opts.onLegenda?.("pronto");
    }
    if (todos && t > COREO.assenta) {
      this.estado = this.alvo;
      if (this.fase < 2) {
        this.fase = 2;
        this.opts.onRotulos?.(this.alvo === "montes");
        this.opts.onLegenda?.("pronto");
      }
    }
    return true;
  }
}
