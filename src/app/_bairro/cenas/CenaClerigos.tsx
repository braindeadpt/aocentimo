"use client";

/**
 * A cena da Torre dos Clérigos — «O Norte na economia» (ponto 6 da
 * auditoria do mapa, copy aprovada pelo dono a 2026-10-12).
 *
 * Dois passos: do alto da torre, os três números do Norte no país (PIB,
 * exportações de bens, emprego na indústria) e, depois, o contraponto do
 * PIB por habitante. As colunas sobem do rio uma a uma com o número a
 * contar e um rabelo atravessa o Douro (CSS + rAF; nada em reduced-motion). Os números vêm de `data/regional/norte.json` pelo
 * `public/cenas/clerigos.json`; um em falta mostra «—», nunca 0.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { FINO, fmtEUR0, fmtNum } from "@/lib/format";
import type { DadosClerigos } from "./dados-norte";
import { interiorClerigos } from "./clerigos-arte";
import CenaDePerto from "./CenaDePerto";
import * as T from "./textos-norte";

const pct1 = (v: number | null | undefined) => (v == null ? "—" : `${fmtNum(v, 1)}${FINO}%`);

export default function CenaClerigos({ D, aoFechar }: { D: DadosClerigos; aoFechar: () => void }) {
  const [passo, setPasso] = useState(1);

  const arteRef = useRef<HTMLDivElement>(null);

  // passo 1: as três colunas do peso do Norte; passo 2: o PIB por
  // habitante, Norte ao lado do país (o país é a coluna inteira)
  const colunas = useMemo(() => {
    if (passo === 1)
      return [
        { rotulo: "PIB", v: D.pib?.pesoPct ?? null, pct: D.pib?.pesoPct ?? null, fmt: pct1, cor: "#ffc62b" },
        { rotulo: "EXPORTAÇÕES", v: D.exportacoes?.pesoPct ?? null, pct: D.exportacoes?.pesoPct ?? null, fmt: pct1, cor: "#0c8f5c" },
        { rotulo: "EMPREGO NA INDÚSTRIA", v: D.industria?.pesoPct ?? null, pct: D.industria?.pesoPct ?? null, fmt: pct1, cor: "#2445d6" },
      ];
    const h = D.porHabitante;
    const eur = (v: number | null) => (v == null ? "—" : fmtEUR0(v));
    return [
      { rotulo: "NORTE", v: h?.norte ?? null, pct: h ? (h.norte / h.pais) * 100 : null, fmt: eur, cor: "#e2412a" },
      { rotulo: "PORTUGAL", v: h?.pais ?? null, pct: h ? 100 : null, fmt: eur, cor: "#2445d6" },
    ];
  }, [passo, D]);

  const interior = useMemo(
    () =>
      interiorClerigos(
        T.ntePlaca,
        colunas.map((c) => ({ rotulo: c.rotulo, valor: c.fmt(c.v), pct: c.pct, cor: c.cor }))
      ),
    [colunas]
  );

  // o número de cada coluna conta de 0 até ao valor enquanto ela sobe
  // (o CSS faz a coluna; isto só o texto). Em reduced-motion não corre:
  // o texto já está no valor final, que é o mesmo nos dois caminhos.
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const raiz = arteRef.current;
    if (!raiz) return;
    let raf = 0;
    const t0 = performance.now();
    const DUR = 700;
    const passo1 = () => {
      const agora = performance.now();
      let falta = false;
      colunas.forEach((c, k) => {
        const el = raiz.querySelector(`#nteV${k}`);
        if (!el || c.v == null) return;
        const t = Math.min(1, Math.max(0, (agora - t0 - (250 + k * 350)) / DUR));
        const e = 1 - Math.pow(1 - t, 3);
        const casas = Number.isInteger(c.v) ? 0 : 1;
        const v = t >= 1 ? c.v : Math.round(c.v * e * 10 ** casas) / 10 ** casas;
        el.textContent = c.fmt(v);
        if (t < 1) falta = true;
      });
      if (falta) raf = requestAnimationFrame(passo1);
    };
    raf = requestAnimationFrame(passo1);
    return () => cancelAnimationFrame(raf);
  }, [colunas, interior]);

  return (
    <CenaDePerto quem={T.nteQuem} fonte={D.fonte} aoFechar={aoFechar} arteHtml={interior} refArte={arteRef} rotuloArte={T.nteRotuloArte}>
      <p
        className="b-fala"
        aria-live="polite"
        dangerouslySetInnerHTML={{
          __html:
            passo === 1
              ? T.nteFala1
              : D.porHabitante
                ? T.nteFecho(fmtEUR0(D.porHabitante.norte), fmtEUR0(D.porHabitante.pais))
                : T.nteFalha,
        }}
      />
      <div className="b-corpo">
        {passo === 1 && (
          <div className="b-jornal b-nte">
            <Linha
              valor={D.pib ? T.ntePibValor(pct1(D.pib.pesoPct)) : "—"}
              texto={D.pib ? T.ntePibTexto(fmtNum(D.pib.milhoesEur, 0), String(D.pib.ano)) : T.nteFalha}
            />
            <Linha
              valor={D.exportacoes ? T.nteExpValor(pct1(D.exportacoes.pesoPct)) : "—"}
              texto={
                D.exportacoes
                  ? T.nteExpTexto(fmtNum(D.exportacoes.milhoesEur, 0), String(D.exportacoes.ano))
                  : T.nteFalha
              }
            />
            <Linha
              valor={D.industria ? T.nteIndValor(fmtNum(Math.round(D.industria.milhares), 0)) : "—"}
              texto={D.industria ? T.nteIndTexto(pct1(D.industria.pesoPct), String(D.industria.ano)) : T.nteFalha}
            />
          </div>
        )}
        {passo === 2 && D.texteisPct !== null && (
          <p dangerouslySetInnerHTML={{ __html: T.nteExtra(pct1(D.texteisPct)) }} />
        )}
      </div>
      <div className="b-acoes">
        {passo === 1 && (
          <button className="b-btn" type="button" onClick={() => setPasso(2)}>
            {T.nteBtnPessoa}
          </button>
        )}
        {passo === 2 && (
          <>
            <button className="b-btn b-claro" type="button" onClick={aoFechar}>
              {T.nteBtnVoltar}
            </button>
            <button className="b-btn b-claro" type="button" onClick={() => setPasso(1)}>
              {T.nteBtnOutra}
            </button>
          </>
        )}
      </div>
    </CenaDePerto>
  );
}

/** Uma linha: o número grande à esquerda e o que ele quer dizer à direita. */
function Linha({ valor, texto }: { valor: string; texto: string }) {
  return (
    <div className="b-j-n">
      <span className="b-j-v">{valor}</span>
      <span dangerouslySetInnerHTML={{ __html: texto }} />
    </div>
  );
}
