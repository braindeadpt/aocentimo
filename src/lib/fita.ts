/**
 * Geometria da FitaTalao — pura e testável (M-05).
 *
 * Metáfora física: a fita de talão sai da impressora de cima para baixo
 * e, em cada linha de perfuração, o pedaço da direita é arrancado. A
 * LARGURA da fita é o dinheiro — uma só escala em todo o desenho,
 * incluindo nos pedaços caídos. A aresta esquerda é fixa; a fita
 * estreita sempre pela direita, por isso os pedaços saem todos para o
 * mesmo lado.
 *
 * O notch de cada corte é desenhado pela MESMA polyline que dá o bordo
 * rasgado do pedaço (rasgoCantoPts): o buraco e o pedaço correspondem
 * por construção — o que se vê sair é exactamente o que falta na fita.
 *
 * A partitura (tempos) deriva da posição de cada corte na fita: o pedaço
 * rasga-se quando a aresta da impressão passa na sua perfuração.
 * `WIPE_MS` espelha --dur-longa da gramática (≈1200ms).
 */

import { prng, r1, rasgoCantoPts, sementeDe } from "@/lib/materia";

/* ————— medidas fixas do desenho (px do viewBox) ————— */
export const FITA = {
  X0: 60, // aresta esquerda fixa da fita
  TOPO: 78, // y onde a fita emerge (a cabeça de impressão fica acima)
  ALT: 520, // comprimento impresso
  LARG_MAX: 250, // a fita mais larga possível = o custo
  DIR: 352, // coluna da pilha — onde os pedaços aterram
  HP: 46, // altura de um pedaço (e profundidade do notch)
  LARG_MIN: 16, // largura mínima legível de um pedaço
  WIPE_MS: 1150, // duração da impressão — espelha --dur-longa
} as const;

/** fracções do comprimento onde caem as linhas de perfuração (3 cortes) */
const FRONTEIRAS = [0.3, 0.52, 0.7];

export interface PecaGeo {
  /** valor do corte em euros */
  v: number;
  /** largura do pedaço em px (>= LARG_MIN, já com clamp) */
  w: number;
  /** true quando o clamp de LARG_MIN fez o desenho deixar de ser
      proporcional — o rótulo assinala-o (honestidade) */
  naoProp: boolean;
  /** true quando o corte é 0 — não há pedaço nem notch; há um 0 €
      explícito na pilha (é conteúdo, não caso especial) */
  zero: boolean;
  /** silhueta do pedaço em coords locais (comp×HP); "" quando zero */
  path: string;
  /** posição anexada (o notch que o pedaço tapa) */
  ax: number;
  ay: number;
  /** posição final na pilha */
  fx: number;
  fy: number;
  /** rotação de aterragem em graus */
  rot: number;
  /** instante do rasgo na sequência (ms após o início) */
  delay: number;
}

export interface FitaGeo {
  /** false = dados inválidos → o componente mostra EmptyState */
  ok: boolean;
  /** escala px/€ — uma só em todo o desenho */
  k: number;
  /** silhueta da fita (path d), já com os notches rasgados */
  fita: string;
  /** larguras por troço (custo, depois de cada corte, até líquido) */
  larguras: number[];
  /** y das fronteiras entre troços (as linhas de perfuração) */
  ys: number[];
  /** y do fim da fita */
  yFim: number;
  /** linhas de perfuração a furar: y e meia-largura útil (furos de X0+9 a X0+w-4) */
  perfs: { y: number; w: number }[];
  /** troço final (o que fica) — para o realce */
  tira: { x: number; y: number; w: number; h: number };
  pecas: PecaGeo[];
}

const ptsParaD = (pts: [number, number][], dx: number, dy: number) =>
  pts.map(([x, y]) => `L${r1(x + dx)},${r1(y + dy)}`).join(" ");

/**
 * A geometria inteira da fita, derivada só dos valores.
 * `cortes` são os valores arrancados por esta ordem (cada um abre um
 * notch e cai um pedaço na pilha); `rotulos` não entra — isto é só forma.
 */
export function geometriaFita(
  custo: number,
  cortes: number[],
  liquido: number
): FitaGeo {
  const ok =
    Number.isFinite(custo) &&
    custo > 0 &&
    Number.isFinite(liquido) &&
    liquido >= 0 &&
    cortes.every((c) => Number.isFinite(c) && c >= 0) &&
    // a soma não pode exceder o todo (tolerância de arredondamento)
    cortes.reduce((a, b) => a + b, 0) + liquido <= custo + 0.51;

  // dados inválidos → geometria vazia; o componente mostra EmptyState.
  // (Sem este bailout um custo de 0 explodia a escala e o rasgo iterava
  // sobre uma largura infinita.)
  if (!ok) {
    return {
      ok: false,
      k: 0,
      fita: "",
      larguras: [],
      ys: [],
      yFim: 0,
      perfs: [],
      tira: { x: FITA.X0, y: FITA.TOPO, w: 0, h: 0 },
      pecas: [],
    };
  }

  const k = FITA.LARG_MAX / custo;

  // larguras por troço — o que fica depois de cada corte
  const larguras: number[] = [r1(custo * k)];
  let resto = custo;
  for (const c of cortes) {
    resto -= c;
    larguras.push(r1(resto * k));
  }

  // fronteiras: espaçadas pelas fracções; para n≠3 distribui-se igual
  const n = cortes.length;
  const ys = Array.from({ length: n }, (_, i) =>
    r1(
      FITA.TOPO +
        FITA.ALT *
          (FRONTEIRAS[i] ?? 0.25 + (0.62 * (i + 1)) / n)
    )
  );
  const yFim = r1(FITA.TOPO + FITA.ALT);

  const pecas: PecaGeo[] = [];
  const perfs: { y: number; w: number }[] = [];

  // silhueta — aresta direita top→bottom com notches rasgados
  let d = `M${FITA.X0},${FITA.TOPO} L${r1(FITA.X0 + larguras[0])},${FITA.TOPO}`;
  let wCur = larguras[0];
  for (let i = 0; i < n; i++) {
    const corte = cortes[i];
    const y = ys[i];
    const wNext = larguras[i + 1];
    d += ` L${r1(FITA.X0 + wCur)},${y}`;
    perfs.push({ y, w: wNext });
    const semente = sementeDe(corte * 100 + i);
    const zero = corte <= 0;
    // a fita nunca mente: o notch tem SEMPRE a largura real do degrau.
    // O pedaço é que pode ser clampado para se ler — e nesse caso o
    // rótulo assinala que a escala ali já não é exacta (naoProp).
    const degrau = r1(wCur - wNext);
    const w = Math.min(
      Math.max(FITA.LARG_MIN, corte * k),
      FITA.DIR - FITA.X0 - wNext - 24 // nunca invade a pilha
    );
    const naoProp = !zero && r1(w) !== degrau;

    if (!zero) {
      // o notch — a MESMA polyline que dá o bordo do pedaço
      const canto = rasgoCantoPts(degrau, FITA.HP, {
        semente,
        grosseria: 0.5,
      });
      d += " " + ptsParaD(canto, FITA.X0 + wNext, y);
    }
    wCur = wNext;

    const rand = prng(semente + 7);
    const rot = r1((rand() < 0.5 ? -1 : 1) * (4 + rand() * 6));
    // path local do pedaço: bordo rasgado em cima+esquerda (o canto),
    // direita e fundo rectos (borda da fita e corte à máquina)
    const path = zero
      ? ""
      : `M${r1(w)},0 ${rasgoCantoPts(w, FITA.HP, { semente, grosseria: 0.5 })
          .map(([x, yy]) => `L${x},${yy}`)
          .join(" ")} L0,${FITA.HP} L${r1(w)},${FITA.HP} Z`;

    pecas.push({
      v: corte,
      w: r1(w),
      naoProp,
      zero,
      path,
      ax: r1(FITA.X0 + wNext),
      ay: y,
      fx: FITA.DIR,
      fy: r1(y - FITA.HP - 8),
      rot,
      // rasga quando a impressão passa a perfuração: fracção do wipe
      delay: Math.round(((y - FITA.TOPO) / FITA.ALT) * FITA.WIPE_MS) + 60,
    });
  }
  d += ` L${r1(FITA.X0 + wCur)},${yFim} L${FITA.X0},${yFim} Z`;

  // o troço final — do fim da última perfuração ao fim da fita
  const tira = {
    x: FITA.X0,
    y: n > 0 ? ys[n - 1] : FITA.TOPO,
    w: wCur,
    h: r1(yFim - (n > 0 ? ys[n - 1] : FITA.TOPO)),
  };

  return { ok, k, fita: d, larguras, ys, yFim, perfs, tira, pecas };
}
