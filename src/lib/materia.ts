/**
 * Matéria — o sistema material do site: papel, rasgo, perfuração, sombra.
 *
 * Tudo determinista: a mesma semente produz sempre a mesma forma, para que
 * o mesmo salário rasgue da mesma maneira entre renders (não "salta").
 *
 * Orçamento de desempenho (regra dura):
 *  - filtros SVG (feGaussianBlur, feDropShadow, feTurbulence) re-pintam a
 *    cada frame — SÓ em elementos estáticos; o que anima usa transform e
 *    opacity apenas
 *  - todas as coordenadas geradas saem a 1 casa decimal (peso e costuras
 *    de subpixel)
 *  - para eliminar costuras entre formas adjacentes, sobrepõe-se .5px em
 *    vez de encostar exatamente (ver pecaRasgada)
 */

/** Arredonda a 1 casa decimal — peso do ficheiro e costuras de subpixel.
 *  `|| 0` normaliza -0 (que é falsy): "L-0,0" e "L0,0" são o mesmo ponto,
 *  mas os testes e o diff do DOM preferem a forma limpa. */
export const r1 = (n: number): number => Math.round(n * 10) / 10 || 0;

/** PRNG mulberry32 — próprio, com semente; nunca Math.random. */
export function prng(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente estável derivada de um valor — o mesmo dinheiro rasga igual. */
export function sementeDe(n: number): number {
  let a = Math.abs(Math.round(n * 100)) >>> 0;
  a = Math.imul(a ^ (a >>> 16), 0x45d9f3b) >>> 0;
  return a;
}

export interface RasgoOpts {
  /** semente determinista — a mesma semente dá o mesmo rasgo */
  semente: number;
  /** 0..1 — 0 = corte quase limpo; 1 = rasgo violento. Defeito 0.55. */
  grosseria?: number;
  /** lado para onde saem os dentes: 1 = +y (para baixo), -1 = -y (para cima) */
  lado?: 1 | -1;
}

/**
 * Aresta rasgada como pontos — de (0,0) a (comprimento,0), dentes a sair
 * para `lado`.
 *
 * Papel rasgado nunca é regular: o passo e a amplitude variam por dente,
 * a ponta nunca cai ao centro do dente, e um joelho a meio do flanco
 * quebra a leitura de "serra". De vez em quando sai uma fibra — um dente
 * mais comprido e fino, que é o que a vista lê como papel.
 */
export function arestaRasgadaPts(
  comprimento: number,
  o: RasgoOpts
): [number, number][] {
  const rand = prng(o.semente);
  const g = Math.min(1, Math.max(0, o.grosseria ?? 0.55));
  const lado = o.lado ?? 1;
  const ampMax = 2.5 + 6.5 * g;
  const pts: [number, number][] = [[0, 0]];
  let x = 0;
  while (x < comprimento - 4) {
    const fibra = rand() < 0.08;
    const passo = Math.min(
      comprimento - x,
      (fibra ? 0.4 + rand() * 0.25 : 0.7 + rand() * 0.8) * 9
    );
    const amp =
      (fibra
        ? ampMax * (1.9 + rand() * 1.3)
        : ampMax * (0.35 + rand() * 0.65)) * lado;
    const ponta = x + passo * (0.3 + rand() * 0.4);
    const jx = x + passo * 0.22;
    const jy = amp * (0.25 + rand() * 0.35);
    pts.push([r1(jx), r1(jy)], [r1(ponta), r1(amp)], [r1(x + passo), 0]);
    x += passo;
  }
  pts.push([r1(comprimento), 0]);
  return pts;
}

/** Aresta rasgada como caminho SVG aberto — de (0,0) a (comprimento,0). */
export function arestaRasgada(comprimento: number, o: RasgoOpts): string {
  return arestaRasgadaPts(comprimento, o)
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
}

export interface PecaOpts {
  semente: number;
  /** 0..1 — como arestaRasgada. Defeito 0.55. */
  grosseria?: number;
  /** rasgar a aresta de cima. Defeito true. */
  rasgoTopo?: boolean;
  /** rasgar a aresta de baixo. Defeito true. */
  rasgoFundo?: boolean;
}

/**
 * Silhueta de um pedaço arrancado — caminho FECHADO comp×alt.
 * Rasgo em cima E em baixo: um pedaço arrancado da fita separa-se nas
 * duas pontas — dentes só no topo com as outras três arestas rectas é o
 * que denuncia o desenho. As laterais ficam rectas: são as bordas da fita,
 * cortadas à máquina (ao contrário do rasgo, que é à mão).
 *
 * As arestas rasgadas entram .5px na caixa (sobreposição) para eliminar
 * costuras de subpixel entre formas adjacentes.
 */
export function pecaRasgada(
  comp: number,
  alt: number,
  o: PecaOpts
): string {
  const g = Math.min(1, Math.max(0, o.grosseria ?? 0.55));
  const topo: [number, number][] =
    o.rasgoTopo === false
      ? [
          [0, 0],
          [r1(comp), 0],
        ]
      : arestaRasgadaPts(comp, {
          semente: o.semente,
          grosseria: g,
          lado: -1,
        });
  // fundo: gera esq→dir com dentes para baixo e espelha x — fica dir→esq
  const fundo: [number, number][] =
    o.rasgoFundo === false
      ? [
          [r1(comp), r1(alt)],
          [0, r1(alt)],
        ]
      : arestaRasgadaPts(comp, {
          semente: o.semente + 0x9e3779b9,
          grosseria: g,
          lado: 1,
        }).map(([x, y]) => [r1(comp - x), r1(y + alt)] as [number, number]);
  const d = [
    `M${topo[0][0]},${topo[0][1]}`,
    ...topo.slice(1).map(([x, y]) => `L${x},${y}`),
    ...fundo.map(([x, y]) => `L${x},${y}`),
    "Z",
  ];
  return d.join(" ");
}

/**
 * Canto de rasgo em L — a linha de separação entre a fita e o pedaço
 * que sai para a direita: um troço HORIZONTAL rasgado (dentes para
 * baixo, lado=1) seguido de um VERTICAL (dentes para a direita).
 *
 * Pontos de (comp,0) até (0,alt), em ordem de percurso. A MESMA
 * polyline serve os dois lados — a fita desenha-a como notch na sua
 * aresta direita e o pedaço como o seu bordo superior-esquerdo: a
 * correspondência rasgo↔falta é perfeita por construção, não por
 * aproximação de semente.
 */
export function rasgoCantoPts(
  comp: number,
  alt: number,
  o: RasgoOpts
): [number, number][] {
  const g = o.grosseria ?? 0.55;
  // horizontal: gerado esq→dir com dentes para baixo, depois invertido —
  // o percurso é da direita (comp,0) para a esquina (0,0)
  const h = arestaRasgadaPts(comp, {
    semente: o.semente,
    grosseria: g,
    lado: 1,
  }).reverse() as [number, number][];
  // vertical: gerado esq→dir com dentes para baixo e rodado 90° —
  // (x,y) → (y,x): fica de (0,0) a (0,alt) com dentes para +x
  const v = arestaRasgadaPts(alt, {
    semente: o.semente + 0x9e3779b9,
    grosseria: g,
    lado: 1,
  })
    .slice(1)
    .map(([x, y]) => [r1(y), r1(x)] as [number, number]);
  return [...h, ...v];
}

/** Profundidade máxima que os dentes atingem para uma dada grosseria —
 *  útil para dimensionar margens do viewBox. */
export function profundidadeRasgo(grosseria: number): number {
  const g = Math.min(1, Math.max(0, grosseria));
  return r1((2.5 + 6.5 * g) * 3.3);
}

/**
 * Furos de perfuração — centros em x. Espaçamento REGULAR de máquina, ao
 * contrário do rasgo feito à mão: este contraste é a ideia.
 * O buraco real faz-se por máscara no desenho — o furo mostra o fundo da
 * página, nunca uma cor pintada.
 */
export function furos(
  comprimento: number,
  o: { espacamento?: number; margem?: number } = {}
): number[] {
  const e = o.espacamento ?? 14;
  const m = o.margem ?? e * 0.75;
  const out: number[] = [];
  for (let x = m; x <= comprimento - m + 0.001; x += e) out.push(r1(x));
  return out;
}

/**
 * Sombra por peça — cada pedaço arrancado cai de maneira diferente.
 * `angulo` (graus) deriva o desvio horizontal; `altura` (0..1, quão alto
 * caiu) deriva desfoque, distância e opacidade. A luz vem sempre de cima
 * à esquerda — a direção base da sombra é constante, o ângulo modula-a.
 * Devolve um `filter` CSS — aplicar a elementos ESTÁTICOS (ver orçamento).
 */
export function sombraPeca(o: { angulo?: number; altura?: number } = {}): string {
  const a = o.angulo ?? 0;
  const h = Math.min(1, Math.max(0, o.altura ?? 0.5));
  const dx = r1(2 + Math.sin((a * Math.PI) / 180) * 8);
  const dy = r1(6 + h * 16);
  const blur = r1(5 + h * 11);
  const op = r1((0.2 + h * 0.16) * 100) / 100;
  return `drop-shadow(${dx}px ${dy}px ${blur}px rgba(24,17,6,${op}))`;
}
