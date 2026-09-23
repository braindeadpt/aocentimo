"use client";

/**
 * CampoCentimos — o campo de cêntimos (V4, S1-04): 1 ponto = 1 cêntimo.
 *
 * A peça central da V4. Partes de um todo em dinheiro desenham-se em
 * pontos contáveis — de cada euro, 100 pontos; os que saem (vermelhão)
 * e os que ficam (verde). A máquina de estados:
 *
 *   "moeda"   a face comum do 1 € desenhada a sério (bicolor, «1»
 *             serifado, «EURO», seis linhas com as doze estrelas,
 *             aresta com espessura) — oscila devagar, nunca de perfil
 *   "montes"  um aglomerado rotulado por parte, na cor semântica
 *   "grelha"  os pontos em fila 10×10
 *
 * A transição moeda → montes/grelha é a coreografia aprovada em
 * referencias/V4/prototipo-moeda.html: a moeda pára de frente,
 * desfaz-se em pontos que herdam o metal da face, pausa «um euro são
 * 100 cêntimos», as cores das partes acendem e cada ponto voa para o
 * seu monte com atraso escalonado. Voltar à moeda fecha-a de novo.
 *
 * SSR/sem JS: o servidor renderiza um SVG do estado pedido (moeda
 * parada ou montes finais) com os mesmos números — nunca um canvas
 * vazio. O canvas cobre-o sem salto de layout e esvanece-o quando o
 * primeiro frame sai. Rótulos e legenda são HTML por cima — os centros
 * dos montes são fracções da largura, logo alinham em qualquer tamanho.
 *
 * A11y: todo o palco é aria-hidden; o equivalente textual é o irmão
 * .sr-only («De cada euro: …») — um só equivalente, sempre presente.
 * Reduced-motion: estado final imediato, sem rotação nem voo.
 *
 * Dados pré-calculados no servidor — nada de motores fiscais aqui.
 */
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { comUnidade, fmtNum } from "@/lib/format";
import { repartir } from "@/lib/pontos/repartir";
import {
  ANEL_DISCO,
  geoGrelha,
  geoMontes,
  type NomeLayout,
  type TomParte,
} from "@/lib/pontos/layouts";
import { CampoTela } from "@/lib/pontos/tela";

export interface ParteCentimos {
  id: string;
  /** nome da parte — «TSU da empresa» */
  rotulo: string;
  /** variante curta para palco estreito — «TSU» */
  rotuloCurto?: string;
  /** valor real em cêntimos, com decimais — o texto diz «63,2 c»,
   *  o desenho conta pontos inteiros */
  valor: number;
  /** cor semântica: sai = vermelhão, fica = verde, neutro = cinzento.
   *  Convenção: a parte que fica é a última. */
  tom: TomParte;
  /** linha secundária do rótulo — «356 €/mês» */
  detalhe?: string;
}

export interface TextosCentimos {
  /** frase da pausa, com a moeda desfeita — «Um euro são 100 cêntimos…» */
  pausa?: ReactNode;
  /** frase quando as cores acendem — «Destes 100 cêntimos, X saem…» */
  saiem?: ReactNode;
  /** frase final, fica visível em «montes» */
  pronto?: ReactNode;
  /** detalhe de uma parte sem pontos — «não te toca» */
  zero?: string;
}

/** tamanho de referência do svg de SSR — o desenho usa fracções da
 *  largura/altura, por isso coincide com os rótulos a qualquer escala */
const W0 = 1200;
const H0 = 460;

function fmtC(v: number): string {
  return comUnidade(fmtNum(v), "c");
}

/** estrela de cinco pontas — path SVG centrado em (0,0) */
function estrelaPath(r: number): string {
  let d = "";
  for (let k = 0; k < 10; k++) {
    const ang = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.42 : r;
    d += `${k ? "L" : "M"}${(rr * Math.cos(ang)).toFixed(2)} ${(rr * Math.sin(ang)).toFixed(2)}`;
  }
  return d + "Z";
}

/** a moeda de 1 € parada — face comum simplificada, bicolor */
function SvgMoeda() {
  const R = 165;
  const linhas = Array.from({ length: 6 }, (_, l) => {
    const x = R * (0.44 + l * 0.055);
    const yl = Math.sqrt(Math.max(0, 0.83 * R * (0.83 * R) - x * x));
    return { x, yl };
  });
  return (
    <svg
      x="30%"
      y="9%"
      width="40%"
      height="82%"
      viewBox="-175 -175 350 350"
      aria-hidden="true"
      focusable="false"
      overflow="visible"
    >
      <defs>
        <linearGradient id="cc-ouro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8c6f2c" />
          <stop offset="0.28" stopColor="#c9a64e" />
          <stop offset="0.5" stopColor="#f3e2a2" />
          <stop offset="0.74" stopColor="#b8953f" />
          <stop offset="1" stopColor="#7d6226" />
        </linearGradient>
        <linearGradient id="cc-prata" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a9da3" />
          <stop offset="0.26" stopColor="#c9ccd1" />
          <stop offset="0.5" stopColor="#f6f7f8" />
          <stop offset="0.74" stopColor="#b7bac0" />
          <stop offset="1" stopColor="#8f9298" />
        </linearGradient>
      </defs>
      {/* aresta — o filete escuro à esquerda sugere a espessura */}
      <circle cx="-7" cy="0" r="166" fill="#6f5620" />
      <circle cx="-3.5" cy="0" r="165" fill="#86692b" />
      {/* coroa de latão-níquel */}
      <circle r={R} fill="url(#cc-ouro)" />
      <circle r={R * 0.965} fill="none" stroke="rgba(255,238,184,.5)" strokeWidth={R * 0.03} />
      <circle r={R * 0.935} fill="none" stroke="rgba(70,52,16,.55)" strokeWidth={R * 0.012} />
      {/* disco de cuproníquel */}
      <circle
        r={R * ANEL_DISCO}
        fill="url(#cc-prata)"
        stroke="rgba(60,60,64,.55)"
        strokeWidth={R * 0.014}
      />
      {/* seis linhas finas com uma estrela em cada ponta */}
      {linhas.map(({ x, yl }) => (
        <g key={x}>
          <line
            x1={x}
            y1={-yl + R * 0.05}
            x2={x}
            y2={-R * 0.2}
            stroke="rgba(95,98,104,.75)"
            strokeWidth={R * 0.008}
          />
          <line
            x1={x}
            y1={R * 0.2}
            x2={x}
            y2={yl - R * 0.05}
            stroke="rgba(95,98,104,.75)"
            strokeWidth={R * 0.008}
          />
          <path d={estrelaPath(R * 0.034)} transform={`translate(${x} ${-yl})`} fill="rgba(110,86,30,.9)" />
          <path d={estrelaPath(R * 0.034)} transform={`translate(${x} ${yl})`} fill="rgba(110,86,30,.9)" />
        </g>
      ))}
      {/* o «1» — grande, serifado, inclinado, à esquerda; EURO à direita.
          A gravação é três passadas: sombra, luz, metal */}
      <g transform={`translate(${-R * 0.52} ${R * 0.4}) skewX(-8)`}>
        <text x={R * 0.01} y={R * 0.014} fill="#a6abb2"
          style={{ fontFamily: "var(--font-editorial)", fontWeight: 600, fontSize: R * 1.12 }}>1</text>
        <text x={-R * 0.007} y={-R * 0.009} fill="rgba(255,255,255,.85)"
          style={{ fontFamily: "var(--font-editorial)", fontWeight: 600, fontSize: R * 1.12 }}>1</text>
        <text x="0" y="0" fill="#c7cacf"
          style={{ fontFamily: "var(--font-editorial)", fontWeight: 600, fontSize: R * 1.12 }}>1</text>
      </g>
      <text x={-R * 0.02} y={R * 0.03} dy="0.35em" letterSpacing={R * 0.012} fill="#bfc2c8"
        style={{ fontFamily: "var(--font-editorial)", fontWeight: 600, fontSize: R * 0.2 }}>
        EURO
      </text>
    </svg>
  );
}

/** montes finais em svg — pontos por parte na cor semântica */
function SvgMontes({
  pontos,
  toms,
  livres,
  total,
}: {
  pontos: number[];
  toms: TomParte[];
  livres: number;
  total: number;
}) {
  const gm = geoMontes(W0, H0, pontos);
  return (
    <g>
      {pontos.map((c, i) => {
        const m = gm.montes[i];
        if (!m || c === 0) return null;
        const cx = `${(m.fx * 100).toFixed(3)}%`;
        const cy = `${(gm.baseFrac * 100).toFixed(2)}%`;
        const r = Math.max(2.2, m.gap * 0.34);
        return Array.from({ length: c }, (_, k) => {
          const dx = -((m.cols - 1) / 2) * m.gap + (k % m.cols) * m.gap;
          const dy = -Math.floor(k / m.cols) * m.gap;
          return (
            <circle
              key={`${i}-${k}`}
              cx={cx}
              cy={cy}
              r={r}
              transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)})`}
              className={`cc-d-${toms[i] ?? "neutro"}`}
            />
          );
        });
      })}
      {/* pontos sem dono — a grelha neutra atrás dos montes */}
      {livres > 0 && <SvgGrelhaDots inicio={pontos.reduce((a, b) => a + b, 0)} livres={livres} total={total} />}
    </g>
  );
}

function SvgGrelhaDots({
  inicio = 0,
  livres,
  total,
  toms,
  pontos,
}: {
  inicio?: number;
  livres?: number;
  total: number;
  toms?: TomParte[];
  pontos?: number[];
}) {
  const g = geoGrelha(W0, H0, total);
  const r = g.r;
  const els: ReactNode[] = [];
  if (pontos && toms) {
    let i = 0;
    pontos.forEach((c, p) => {
      for (let k = 0; k < c; k++, i++) {
        els.push(<circle key={i} cx="50%" cy="44%" r={r} className={`cc-d-${toms[p]}`}
          transform={`translate(${((i % g.cols) - (g.cols - 1) / 2) * g.passo} ${(Math.floor(i / g.cols) - (g.linhas - 1) / 2) * g.passo})`} />);
      }
    });
  }
  for (let k = 0; k < (livres ?? 0); k++) {
    const i = inicio + k;
    els.push(<circle key={`l${k}`} cx="50%" cy="44%" r={r} className="cc-d-neutro"
      transform={`translate(${((i % g.cols) - (g.cols - 1) / 2) * g.passo} ${(Math.floor(i / g.cols) - (g.linhas - 1) / 2) * g.passo})`} />);
  }
  return <g>{els}</g>;
}

export function CampoCentimos({
  partes,
  layout = "moeda",
  total = 100,
  equivalente,
  textos,
  className,
}: {
  partes: ParteCentimos[];
  layout?: NomeLayout;
  /** pontos no campo — de cada euro são 100 */
  total?: number;
  /** frase do equivalente textual — gerada das partes se omitida */
  equivalente?: string;
  textos?: TextosCentimos;
  className?: string;
}) {
  const rep = useMemo(() => repartir(partes, total), [partes, total]);
  const pontos = useMemo(() => rep.partes.map((p) => p.pontos), [rep]);
  const partesTela = useMemo(
    () => partes.map((p) => ({ tom: p.tom })),
    [partes]
  );
  // os centros dos montes são fracções da largura — o W0 é nominal
  const gm = useMemo(() => geoMontes(W0, H0, pontos), [pontos]);

  const palcoRef = useRef<HTMLDivElement>(null);
  const telaRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<CampoTela | null>(null);
  const [pronto, setPronto] = useState(false);
  const [rotulosOn, setRotulosOn] = useState(layout === "montes");
  const [legenda, setLegenda] = useState<"pausa" | "saiem" | "pronto" | null>(
    layout === "montes" ? "pronto" : null
  );

  // o sim nasce já no estado pedido — igual ao svg de SSR
  useEffect(() => {
    const palco = palcoRef.current;
    const tela = telaRef.current;
    if (!palco || !tela) return;
    const sim = new CampoTela(tela, palco, {
      total,
      layout,
      partes: partesTela,
      pontos,
      onRotulos: setRotulosOn,
      onLegenda: setLegenda,
      onPronto: () => setPronto(true),
    });
    simRef.current = sim;
    return () => {
      sim.destruir();
      simRef.current = null;
    };
    // o sim é criado uma vez por `total`; o resto entra pelos efeitos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    simRef.current?.mudarLayout(layout);
  }, [layout]);

  useEffect(() => {
    simRef.current?.setDados(partesTela, pontos);
  }, [partesTela, pontos]);

  const eq =
    equivalente ??
    `${total === 100 ? "De cada euro" : `De cada ${total} cêntimos`}: ${partes
      .map((p) => `${p.rotulo} — ${fmtNum(p.valor)} cêntimos`)
      .join("; ")}.`;

  const legendaConteudo =
    legenda === "pausa"
      ? textos?.pausa
      : legenda === "saiem"
        ? (textos?.saiem ?? textos?.pausa)
        : legenda === "pronto"
          ? (textos?.pronto ?? textos?.saiem ?? null)
          : null;

  return (
    <div className={`cc${className ? ` ${className}` : ""}`}>
      <div
        ref={palcoRef}
        className="cc-palco"
        aria-hidden="true"
        data-pronto={pronto ? "" : undefined}
      >
        <svg className="cc-svg" aria-hidden="true" focusable="false">
          {layout === "moeda" && <SvgMoeda />}
          {layout === "montes" && (
            <SvgMontes
              pontos={pontos}
              toms={partes.map((p) => p.tom)}
              livres={rep.livres}
              total={rep.total}
            />
          )}
          {layout === "grelha" && (
            <SvgGrelhaDots
              pontos={pontos}
              toms={partes.map((p) => p.tom)}
              livres={rep.livres}
              total={rep.total}
            />
          )}
        </svg>
        <canvas ref={telaRef} className="cc-tela" aria-hidden="true" />
        <div className="cc-rotulos">
          {partes.map((p, i) => {
            const zero = rep.partes[i].pontos === 0;
            const m = gm.montes[i];
            const det =
              zero && p.valor <= 0
                ? (textos?.zero ?? "não te toca")
                : zero
                  ? "menos de um ponto"
                  : p.detalhe;
            return (
              <div
                key={p.id}
                className={`cc-rot${rotulosOn ? " on" : ""}`}
                data-tom={p.tom}
                data-zero={zero || undefined}
                style={{
                  left: `${((m?.fx ?? 0.5) * 100).toFixed(3)}%`,
                  top: `${(gm.rotuloFrac * 100).toFixed(2)}%`,
                }}
              >
                <span className="cc-rot-n">
                  <span className="cc-rot-l">{p.rotulo}</span>
                  {p.rotuloCurto && <span className="cc-rot-c">{p.rotuloCurto}</span>}
                </span>
                <span className="cc-rot-v">
                  {zero && p.valor <= 0 ? "0 c" : fmtC(p.valor)}
                </span>
                {det && <span className="cc-rot-e">{det}</span>}
              </div>
            );
          })}
        </div>
        <p className={`cc-legenda${legendaConteudo ? " on" : ""}`}>
          {legendaConteudo}
        </p>
      </div>
      <p className="sr-only" data-cc-equivalente>
        {eq}
      </p>
    </div>
  );
}
