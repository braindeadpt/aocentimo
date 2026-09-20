"use client";

/**
 * Barras — barras verticais (B-02): positivos em --ink, negativos em
 * --accent abaixo da linha de zero. Reordenar é uma transformação
 * explicada (M-06): as barras viajam FLIP — mede-se a posição antes e
 * depois da mudança de DOM e o delta anima com --dur-media.
 * Equivalente único: tabela sr-only na ordem apresentada.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { fmtNum } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";
import {
  carregarGsap,
  dur,
  ease,
  motionActiva,
  stagger,
} from "@/lib/motion/gsap";
import { escalaValor } from "@/lib/viz/escalas";
import { EmptyState } from "@/components/EmptyState";

interface Item {
  id: string;
  rotulo: string;
  valor: number;
  t?: string;
}

interface Props {
  itens: Item[];
  unidade: string;
  ordenar?: "valor" | "rotulo" | "tempo";
  titulo: string;
}

const W = 640;
const H = 228;
const PAD = { top: 18, right: 8, bottom: 46, left: 40 };

const fmtV = (v: number, unidade: string) =>
  unidade ? `${fmtNum(v)} ${unidade}` : fmtNum(v);

/* largura aproximada de um carácter mono a 10 px — o mesmo factor do
   Declive (6,2 px a 11 px) */
const PX_CHAR = 5.7;

/** Parte o rótulo em ≤2 linhas por palavras; se não couber, a segunda
 *  leva «…» e o rótulo completo vai para o <title> da célula. */
function quebraRotulo(
  rotulo: string,
  maxChars: number
): { linhas: string[]; cortado: boolean } {
  if (rotulo.length <= maxChars) return { linhas: [rotulo], cortado: false };
  const palavras = rotulo.split(" ");
  const linhas: string[] = [""];
  for (const p of palavras) {
    const ult = linhas[linhas.length - 1];
    const tentativa = ult ? `${ult} ${p}` : p;
    if (tentativa.length <= maxChars || ult === "") {
      linhas[linhas.length - 1] = tentativa;
    } else if (linhas.length < 2) {
      linhas.push(p);
    } else {
      break;
    }
  }
  const coberto = linhas.join(" ").length;
  if (coberto < rotulo.length) {
    let l2 = linhas[1] ?? "";
    while (l2.length > 0 && `${l2}…`.length > maxChars) l2 = l2.slice(0, -1);
    linhas[1] = `${l2.replace(/ $/, "")}…`;
    return { linhas: linhas.filter(Boolean), cortado: true };
  }
  return { linhas, cortado: false };
}

export function Barras({ itens, unidade, ordenar = "valor", titulo }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const { ref: refArmado, armado } = useArmado<HTMLDivElement>(titulo);
  const posAnt = useRef<Map<string, number>>(new Map());
  const ordemAnt = useRef<string>("");

  const dados = useMemo(() => {
    const limpos = itens.filter((i) => Number.isFinite(i.valor));
    const por = {
      valor: (a: Item, b: Item) => b.valor - a.valor,
      rotulo: (a: Item, b: Item) => a.rotulo.localeCompare(b.rotulo, "pt-PT"),
      tempo: (a: Item, b: Item) => (a.t ?? "").localeCompare(b.t ?? ""),
    }[ordenar];
    return [...limpos].sort(por);
  }, [itens, ordenar]);

  const y = useMemo(
    () =>
      escalaValor(
        dados.map((i) => i.valor),
        [H - PAD.bottom, PAD.top],
        { zero: true, nice: true }
      ),
    [dados]
  );

  const n = dados.length;
  const slot = (W - PAD.left - PAD.right) / Math.max(1, n);
  const bw = Math.min(48, slot * 0.62);
  const xDe = (i: number) => PAD.left + slot * i + (slot - bw) / 2;

  /* revelação — as barras nascem do eixo ao entrar na dobra; o GSAP
     chega por dynamic import, fora do bundle inicial */
  useEffect(() => {
    if (!armado || !motionActiva()) return;
    let morto = false;
    void carregarGsap().then(({ gsap }) => {
      const alvo = scope.current;
      if (morto || !alvo) return;
      const barras = alvo.querySelectorAll(".barra-v");
      if (!barras.length) return;
      const y0 = y(0);
      gsap.fromTo(
        barras,
        { attr: { y: y0, height: 0 } },
        {
          attr: {
            y: (i: number) => y(Math.max(0, dados[i]?.valor ?? 0)),
            height: (i: number) =>
              Math.abs(y(dados[i]?.valor ?? 0) - y0),
          },
          duration: dur("media"),
          ease: ease("entra"),
          stagger: stagger() / 3,
        }
      );
    });
    return () => {
      morto = true;
    };
    // a revelação corre uma vez quando a dobra arma — com os dados e a
    // escala desse instante; dados novos são outra história (a ordem)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armado]);

  /* reordenar = FLIP: posições medidas antes da mudança, delta animado.
     Só anima quando a ORDEM muda — um resize não é uma transformação
     a explicar */
  useLayoutEffect(() => {
    const ordem = dados.map((d) => d.id).join("|");
    const mudouOrdem = ordemAnt.current !== "" && ordemAnt.current !== ordem;
    const novas = new Map<string, number>();
    scope.current
      ?.querySelectorAll<SVGRectElement>(".barra-v")
      .forEach((el) => {
        const id = el.dataset.id;
        if (id) novas.set(id, el.getBoundingClientRect().left);
      });
    if (!mudouOrdem || !motionActiva()) {
      ordemAnt.current = ordem;
      posAnt.current = novas;
      return;
    }
    ordemAnt.current = ordem;
    const deltas: [SVGRectElement, number][] = [];
    scope.current
      ?.querySelectorAll<SVGRectElement>(".barra-v")
      .forEach((el) => {
        const id = el.dataset.id!;
        const antes = posAnt.current.get(id);
        const depois = novas.get(id);
        if (antes === undefined || depois === undefined) return;
        const dx = antes - depois;
        if (Math.abs(dx) < 0.5) return;
        deltas.push([el, dx]);
      });
    posAnt.current = novas;
    if (!deltas.length) return;
    void carregarGsap().then(({ gsap }) => {
      for (const [el, dx] of deltas) {
        gsap.fromTo(
          el,
          { x: dx },
          { x: 0, duration: dur("media"), ease: ease("entra") }
        );
      }
    });
  }, [dados]);

  if (dados.length === 0) return <EmptyState titulo="Dados indisponíveis" />;

  const y0 = y(0);

  return (
    <div
      ref={(el) => {
        scope.current = el;
        refArmado(el);
      }}
      className="relative w-full"
    >
      <div className="sr-only">
        <table>
          <caption>{titulo}</caption>
          <thead>
            <tr>
              <th scope="col">{""}</th>
              <th scope="col">Valor</th>
              {dados.some((d) => d.t) && <th scope="col">Período</th>}
            </tr>
          </thead>
          <tbody>
            {dados.map((i) => (
              <tr key={i.id}>
                <th scope="row">{i.rotulo}</th>
                <td>{fmtV(i.valor, unidade)}</td>
                {dados.some((d) => d.t) && <td>{i.t ?? "—"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        aria-hidden
        data-viz
      >
        {/* linha de zero */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y0}
          y2={y0}
          stroke="var(--line2)"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {dados.map((d, i) => {
          const yv = y(d.valor);
          const neg = d.valor < 0;
          return (
            <g key={d.id}>
              <rect
                className="barra-v"
                data-id={d.id}
                x={xDe(i)}
                y={neg ? y0 : yv}
                width={bw}
                height={Math.max(0.5, Math.abs(yv - y0))}
                fill={neg ? "var(--accent)" : "var(--ink)"}
              />
              <text
                x={xDe(i) + bw / 2}
                y={neg ? yv + 12 : yv - 5}
                textAnchor="middle"
                fontSize={10}
                fill="var(--ink2)"
                fontFamily="var(--font-mono)"
                className="tabular-nums"
              >
                {fmtV(d.valor, unidade)}
              </text>
              {/* rótulo em até 2 linhas + data em muted por baixo */}
              {(() => {
                const maxChars = Math.max(4, Math.floor((slot - 4) / PX_CHAR));
                const { linhas, cortado } = quebraRotulo(d.rotulo, maxChars);
                const yBase = H - PAD.bottom + 14;
                return (
                  <text
                    x={xDe(i) + bw / 2}
                    y={yBase}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--ink2)"
                    fontFamily="var(--font-mono)"
                  >
                    {cortado && <title>{d.rotulo}</title>}
                    {linhas.map((l, li) => (
                      <tspan key={li} x={xDe(i) + bw / 2} dy={li === 0 ? 0 : 11}>
                        {l}
                      </tspan>
                    ))}
                    {d.t && (
                      <tspan
                        x={xDe(i) + bw / 2}
                        dy={11}
                        fontSize={9}
                        fill="var(--muted)"
                      >
                        {d.t}
                      </tspan>
                    )}
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
