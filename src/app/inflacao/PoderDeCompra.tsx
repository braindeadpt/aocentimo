"use client";

import { useMemo, useState } from "react";
import { Cartao, type EstadoCartao } from "@/components/Cartao";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { fmtEUR, fmtPct } from "@/lib/format";

interface Props {
  /** pontos [{t, v}] do índice geral (CP00) — vêm do servidor */
  serie: { t: string; v: number }[];
  estado: EstadoCartao;
  estadoRotulo: string;
  rotuloFonte: string;
  fonteNome: string;
  fonteUrl?: string;
  /** «ago 2026» — já formatado no servidor */
  leituraAte: string;
}

/**
 * A máquina do tempo do euro — o instrumento do nível 1 de /inflacao
 * (3B-03): «{valor} € em janeiro de {ano} compram hoje quanto?»,
 * deflacionado pelo IHPC total. A régua de anos é o controlo (grelha
 * exacta — só pára em anos com dados); o euro encolhe para a fracção
 * de poder de compra que resta — o contorno tracejado é o que foi
 * comido. O valor final está no HTML sem JS.
 */
export function PoderDeCompra({
  serie,
  estado,
  estadoRotulo,
  rotuloFonte,
  fonteNome,
  fonteUrl,
  leituraAte,
}: Props) {
  const anos = useMemo(
    () => [...new Set(serie.map((p) => p.t.slice(0, 4)))],
    [serie]
  );
  const anosNum = useMemo(() => anos.map(Number), [anos]);
  const [ano, setAno] = useState(anos[Math.min(5, anos.length - 1)] ?? "2020");
  const [valor, setValor] = useState(1000);

  const ponto = serie.find((p) => p.t.startsWith(ano));
  const ultimo = serie[serie.length - 1];
  const resultado =
    ponto && ultimo ? valor * (ultimo.v / ponto.v) : null;
  // a fração do euro que sobrou: poder = índice(ano)/índice(hoje) ≤ 1
  const poder = ponto && ultimo ? Math.min(1, ponto.v / ultimo.v) : 1;

  return (
    <Cartao
      breadcrumb="INFLAÇÃO / A MÁQUINA DO TEMPO · EUROSTAT"
      icone="inflacao"
      meta={[`leitura ${leituraAte}`]}
      estado={estado}
      estadoRotulo={estadoRotulo}
      fonte={{
        rotulo: rotuloFonte,
        itens: [{ nome: fonteNome, url: fonteUrl }],
      }}
      controlos={
        <div className="grid items-end gap-5 sm:grid-cols-[minmax(0,9rem)_1fr]">
          <div>
            <label className="kicker mb-1.5 block" htmlFor="pd-valor">
              O valor
            </label>
            <input
              id="pd-valor"
              type="number"
              min={0}
              step={50}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value) || 0)}
              className="field"
            />
          </div>
          {/* a régua de anos — grelha exacta, só pára em anos com dados;
              o extremo direito é hoje (o euro inteiro) */}
          <Regua
            rotulo="O ano de partida — janeiro"
            valor={Number(ano)}
            onChange={(v) => setAno(String(v))}
            min={anosNum[0]}
            max={anosNum[anosNum.length - 1]}
            passo={1}
            pontos={anosNum}
            formato={(v) => String(v)}
            marcadorAgora={{
              valor: anosNum[anosNum.length - 1],
              rotulo: "hoje",
            }}
          />
        </div>
      }
    >
      <div aria-live="polite">
        {resultado !== null ? (
          <div className="flex flex-wrap items-center gap-6">
            {/* o euro a encolher — a moeda cheia era o poder de compra de
                janeiro do ano escolhido; o disco encolhe para a fração que
                resta hoje. O contorno tracejado fica: é o que foi comido.
                Vê-se, não se lê. */}
            <div className="euro-wrap" aria-hidden="true">
              <div className="euro-ghost" />
              <div
                className="euro-disc"
                style={{ transform: `scale(${poder})` }}
              >
                <span>€</span>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-ink2 text-corpo-sm">
                {fmtEUR(valor)} em janeiro de {ano} compram hoje o equivalente
                a
              </p>
              <NumHero
                compacto
                valor={fmtEUR(resultado)}
                animar={resultado}
                className="mt-1"
              />
              <p className="footnote mt-2">
                O euro de {ano} encolheu para {fmtPct(poder, 0)} do que valia —
                a inflação comeu o resto ({fmtEUR(resultado - valor)} de
                diferença).
              </p>
            </div>
          </div>
        ) : (
          <p className="text-ink2 text-corpo-sm">Sem dados suficientes.</p>
        )}
      </div>
    </Cartao>
  );
}
