"use client";

import { DEMOS, type Demo } from "@/content/demos";
import { useArmado } from "@/lib/useArmado";

/** Micro-demonstração do glossário (M-19) — o conceito desenhado, não
 *  descrito. O desenho passa pelo gate de dobra (M-09): nasce visível,
 *  nasce no estado final; nasce abaixo, desenha-se ao entrar no
 *  viewport. Reduced-motion e SSR ficam no estado final. */
export function MicroDemo({ slug }: { slug: string }) {
  const d = DEMOS[slug];
  const { ref, arm } = useArmado<HTMLElement>(slug);
  if (!d) return null;
  return (
    <figure className="mdemo" role="img" aria-label={d.alt} ref={ref}>
      <Corpo d={d} arm={arm} />
    </figure>
  );
}

function Corpo({ d, arm }: { d: Demo; arm: (cls: string) => string }) {
  if (d.tipo === "pilha" && d.pilha) {
    return (
      <div className="md-pilha" aria-hidden>
        <div className="md-pilha-barra">
          {d.pilha.map((s, i) => (
            <span
              key={i}
              className={`md-seg ${arm("md-draw")} ${s.cor ? `md-seg-${s.cor}` : ""}`}
              style={{ flexBasis: `${s.pct}%`, "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
        <p className="md-cap">
          {d.pilha.map((s) => s.rotulo).join(" + ")}
          {d.total ? ` = ${d.total}` : ""}
        </p>
      </div>
    );
  }
  if (d.tipo === "barras" && d.barras) {
    return (
      <div className="md-barras" aria-hidden>
        {d.barras.map((b, i) => (
          <div key={i} className="md-linha">
            <span className="md-linha-rotulo">{b.rotulo}</span>
            <span className="md-linha-trilho">
              <span
                className={`md-seg ${arm("md-draw")} ${b.cor ? `md-seg-${b.cor}` : ""}`}
                style={{ width: `${b.pct}%`, "--i": i } as React.CSSProperties}
              />
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (d.tipo === "vasos" && d.vasos) {
    return (
      <div className="md-vasos" aria-hidden>
        {d.vasos.map((v, i) => (
          <div key={i} className="md-vaso">
            <span className="md-vaso-corpo">
              <span
                className={`md-fill ${arm("md-fill-v")}`}
                style={{ height: `${v.cheio * 100}%`, "--i": i } as React.CSSProperties}
              />
            </span>
            <span className="md-vaso-taxa">{v.rotulo}</span>
          </div>
        ))}
      </div>
    );
  }
  if (d.tipo === "passos" && d.passos) {
    return (
      <div className="md-passos" aria-hidden>
        {d.passos.map((p, i) => (
          <div key={i} className="md-passo">
            <span
              className={`md-seg ${arm("md-grow")} ${p.cor ? `md-seg-${p.cor}` : ""}`}
              style={{ height: `${p.pct}%`, "--i": i } as React.CSSProperties}
            />
            <span className="md-passo-rotulo">{p.rotulo}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}
