"use client";

import { useState } from "react";
import { decomporCombustivel, IVA_NORMAL } from "@/lib/engines/impostos";
import { NumHero } from "@/components/NumHero";
import { fmtEUR, fmtPct } from "@/lib/format";
import { r1 } from "@/lib/materia";
import isp from "@data/fiscal/isp.json";
import { useArmado } from "@/lib/useArmado";

type Fuel = "gasolina95" | "gasoleo";

/**
 * O litro de combustível como cascata — o facto mais contra-intuitivo
 * da página: o IVA incide SOBRE o ISP. A coluna empilha
 * produto → carbono → ISP (a base tributável, abraçada pela chaveta)
 * e só depois o IVA pousa por cima — mede a pilha inteira, inclui os
 * impostos que lá estão. A legenda de cor liga cada número ao segmento.
 * Re-anima a cada mudança de combustível/preço (key por valores).
 */
export function DecomposicaoFuel() {
  const [fuel, setFuel] = useState<Fuel>("gasoleo");
  const [preco, setPreco] = useState(1.65);

  const d = isp[fuel];
  const r = decomporCombustivel(preco, d.ispELitro, d.carbonoELitro);

  // coluna — geometria da cascata (defensiva: nada de alturas < 0)
  const H = 182;
  const yBase = 196;
  const esc = r.precoFinal > 0 ? H / r.precoFinal : 0;
  const segs = [
    { nome: "Produto + margens", v: Math.max(0, r.produto), fill: "var(--color-line2)" },
    { nome: "Taxa de carbono", v: Math.max(0, r.carbono), fill: "var(--color-up)", op: 0.6 },
    { nome: "ISP", v: Math.max(0, r.isp), fill: "var(--color-up)", op: 0.8 },
  ];
  const ivaV = Math.max(0, r.iva);
  let acc = 0;
  const pilha = segs.map((s) => {
    const h = s.v * esc;
    const y = yBase - (acc + s.v) * esc;
    acc += s.v;
    return { ...s, y: r1(y), h: r1(h) };
  });
  const yTopoBase = acc > 0 ? r1(yBase - acc * esc) : yBase;
  const ivaH = r1(ivaV * esc);
  const ivaY = r1(yTopoBase - ivaH);

  const legenda = [
    ...segs,
    { nome: `IVA (${fmtPct(IVA_NORMAL, 0)})`, v: ivaV, fill: "var(--color-up)", op: 1 },
  ];

  // re-anima a cascata quando a conta muda — remonta-se só o desenho
  const cascaKey = `${fuel}-${r1(preco)}`;
  const casca = useArmado<SVGSVGElement>();

  return (
    <div className="bg-raised border border-line shadow-raised px-5 py-5" aria-live="polite">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kicker block mb-1.5" htmlFor="fuel">Combustível</label>
          <select
            id="fuel"
            value={fuel}
            onChange={(e) => setFuel(e.target.value as Fuel)}
            className="field"
          >
            <option value="gasoleo">Gasóleo</option>
            <option value="gasolina95">Gasolina 95</option>
          </select>
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="preco">Preço por litro</label>
          <input
            id="preco"
            type="number"
            min={0}
            step={0.01}
            value={preco}
            onChange={(e) => setPreco(Number(e.target.value) || 0)}
            className="field"
          />
        </div>
      </div>

      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
        {/* a cascata — a base tributável sobe, a chaveta mede-a toda,
            e o IVA pousa sobre ela: imposto sobre imposto, visto */}
        <svg
          ref={casca.ref}
          key={cascaKey}
          viewBox="0 0 150 210"
          className="h-56 w-40 justify-self-center"
          aria-hidden="true"
        >
          {/* chaveta: mede a pilha produto+carbono+ISP — é sobre ISTO
              que o IVA se calcula */}
          <path
            className={casca.arm("casca-brace")}
            pathLength={1}
            d={`M40,${yBase} H32 V${yTopoBase} H40`}
            fill="none"
            stroke="var(--color-ink2)"
            strokeWidth={1.4}
          />
          <text
            x={24}
            y={r1((yBase + yTopoBase) / 2)}
            transform={`rotate(-90 24 ${r1((yBase + yTopoBase) / 2)})`}
            textAnchor="middle"
            className="fill-muted"
            fontSize={7}
            letterSpacing={1.5}
          >
            BASE DO IVA
          </text>
          {pilha.map((s, i) => (
            <rect
              key={s.nome}
              className={casca.arm("casca-seg")}
              style={{ "--seg": i } as React.CSSProperties}
              x={48}
              y={s.y}
              width={60}
              height={Math.max(0, s.h)}
              fill={s.fill}
              opacity={s.op ?? 1}
            />
          ))}
          <rect
            className={casca.arm("casca-iva")}
            x={48}
            y={ivaY}
            width={60}
            height={Math.max(0, ivaH)}
            fill="var(--color-up)"
          />
          {/* linha do preço final */}
          <line
            x1={44}
            x2={112}
            y1={r1(ivaY - 4)}
            y2={r1(ivaY - 4)}
            stroke="var(--color-muted)"
            strokeWidth={0.8}
            strokeDasharray="3 3"
          />
        </svg>

        {/* legenda de cor — o número liga-se ao segmento pela cor */}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-1 md:grid-cols-2">
          {legenda.map((s) => (
            <div key={s.nome} className="flex items-baseline gap-2">
              <span
                className="sw self-center"
                style={{ background: s.fill, opacity: s.op ?? 1 }}
                aria-hidden
              />
              <div>
                <dt className="kicker">{s.nome}</dt>
                <dd className="num text-lg mt-0.5">{fmtEUR(s.v)}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 border-t-2 border-ink pt-4">
        <p className="kicker">Impostos no total — do preço por litro</p>
        <NumHero valor={fmtPct(r.pesoImpostos)} animar={r.pesoImpostos * 100} casas={1} className="mt-1 text-up" />
        <p className="footnote mt-2">
          O IVA incide sobre o preço que já inclui ISP e carbono — pagas
          imposto sobre imposto.
        </p>
      </div>
      <p className="footnote mt-2">
        ISP e carbono vigentes em {isp.vigencia} · {isp.nota}
      </p>
    </div>
  );
}
