"use client";

/**
 * A cena da Torre dos Clérigos — «O Norte na economia» (ponto 6 da
 * auditoria do mapa, copy aprovada pelo dono a 2026-10-12).
 *
 * Dois passos: do alto da torre, os três números do Norte no país (PIB,
 * exportações de bens, emprego na indústria) e, depois, o contraponto do
 * PIB por habitante. Os números vêm de `data/regional/norte.json` pelo
 * `public/cenas/clerigos.json`; um em falta mostra «—», nunca 0.
 */
import { useMemo, useState } from "react";
import { FINO, fmtEUR0, fmtNum } from "@/lib/format";
import type { DadosClerigos } from "./dados-norte";
import { interiorClerigos } from "./clerigos-arte";
import CenaDePerto from "./CenaDePerto";
import * as T from "./textos-norte";

const pct1 = (v: number | null | undefined) => (v == null ? "—" : `${fmtNum(v, 1)}${FINO}%`);

export default function CenaClerigos({ D, aoFechar }: { D: DadosClerigos; aoFechar: () => void }) {
  const [passo, setPasso] = useState(1);

  const interior = useMemo(
    () =>
      interiorClerigos(T.ntePlaca, [
        { rotulo: "PIB", valor: pct1(D.pib?.pesoPct), pct: D.pib?.pesoPct ?? null, cor: "#ffc62b" },
        { rotulo: "EXPORTAÇÕES", valor: pct1(D.exportacoes?.pesoPct), pct: D.exportacoes?.pesoPct ?? null, cor: "#0c8f5c" },
        { rotulo: "EMPREGO NA INDÚSTRIA", valor: pct1(D.industria?.pesoPct), pct: D.industria?.pesoPct ?? null, cor: "#2445d6" },
      ]),
    [D]
  );

  return (
    <CenaDePerto quem={T.nteQuem} fonte={D.fonte} aoFechar={aoFechar} arteHtml={interior} rotuloArte={T.nteRotuloArte}>
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
          <div className="b-jornal">
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
