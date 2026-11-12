"use client";

import { useMemo, useState } from "react";
import { Segmentado } from "@/components/Segmentado";
import { ivaContido } from "@/lib/engines/impostos";
import { fmtEUR, fmtNum, fmtPct } from "@/lib/format";
import { mascaraFaixaRasgo, r1, sementeDe } from "@/lib/materia";
import { useArmado } from "@/lib/useArmado";
import { CABAZ } from "./cabaz";

/**
 * O talão de supermercado — o segundo artefacto de papel do site.
 * O recibo de vencimento (/salario) é o euro que entra; este é o euro
 * que sai. Os preços são editáveis — são a interface, não ilustração —
 * e o IVA de cada linha e o RESUMO IVA por taxa saem do motor real
 * (ivaContido + taxas de data/fiscal/iva.json e regioes-autonomas-2026.json).
 */

const COMP = 320;
const SEMENTE = sementeDe(20260918);

export type RegiaoIva = "continente" | "acores" | "madeira";

export interface TaxasIvaRegiao {
  taxaReduzida: number;
  taxaIntermedia: number;
  taxaNormal: number;
}

export interface IvaRegioesProps {
  continenteReferencia: TaxasIvaRegiao;
  acores: TaxasIvaRegiao;
  madeira: TaxasIvaRegiao;
}

const REGIOES_PADRAO: IvaRegioesProps = {
  continenteReferencia: {
    taxaReduzida: 0.06,
    taxaIntermedia: 0.13,
    taxaNormal: 0.23,
  },
  acores: {
    taxaReduzida: 0.04,
    taxaIntermedia: 0.09,
    taxaNormal: 0.16,
  },
  madeira: {
    taxaReduzida: 0.04,
    taxaIntermedia: 0.12,
    taxaNormal: 0.22,
  },
};

function mapearTaxaRegional(
  taxaContinente: number,
  taxas: TaxasIvaRegiao,
  ref: TaxasIvaRegiao
): number {
  if (Math.abs(taxaContinente - ref.taxaReduzida) < 0.001) {
    return taxas.taxaReduzida;
  }
  if (Math.abs(taxaContinente - ref.taxaIntermedia) < 0.001) {
    return taxas.taxaIntermedia;
  }
  return taxas.taxaNormal;
}

function rotuloTaxas(t: TaxasIvaRegiao): string {
  return `${fmtNum(t.taxaReduzida * 100, 0)} / ${fmtNum(t.taxaIntermedia * 100, 0)} / ${fmtPct(t.taxaNormal, 0)}`;
}

export function TalaoCompras({
  scrubAria,
  ivaRegioes = REGIOES_PADRAO,
}: {
  scrubAria: string;
  ivaRegioes?: IvaRegioesProps;
}) {
  const [precos, setPrecos] = useState<number[]>(CABAZ.map((i) => i.preco));
  const [regiao, setRegiao] = useState<RegiaoIva>("continente");
  const [ativo, setAtivo] = useState<number | null>(null);

  const taxasAtuais: TaxasIvaRegiao =
    regiao === "acores"
      ? ivaRegioes.acores
      : regiao === "madeira"
        ? ivaRegioes.madeira
        : ivaRegioes.continenteReferencia;

  const linhas = useMemo(
    () =>
      CABAZ.map((it, i) => {
        const taxa = mapearTaxaRegional(
          it.taxa,
          taxasAtuais,
          ivaRegioes.continenteReferencia
        );
        const preco = Math.max(0, precos[i] || 0);
        return {
          ...it,
          taxa,
          preco,
          ...(preco > 0
            ? ivaContido(preco, taxa)
            : { iva: 0, semIva: 0, pesoIva: 0 }),
        };
      }),
    [precos, taxasAtuais, ivaRegioes.continenteReferencia]
  );

  const ivaContinente = useMemo(
    () =>
      CABAZ.reduce((acc, it, i) => {
        const preco = Math.max(0, precos[i] || 0);
        return acc + (preco > 0 ? ivaContido(preco, it.taxa).iva : 0);
      }, 0),
    [precos]
  );

  const ivaAcores = useMemo(
    () =>
      CABAZ.reduce((acc, it, i) => {
        const preco = Math.max(0, precos[i] || 0);
        const taxa = mapearTaxaRegional(
          it.taxa,
          ivaRegioes.acores,
          ivaRegioes.continenteReferencia
        );
        return acc + (preco > 0 ? ivaContido(preco, taxa).iva : 0);
      }, 0),
    [precos, ivaRegioes.acores, ivaRegioes.continenteReferencia]
  );

  // RESUMO IVA por taxa — o bloco que os talões reais trazem no fim
  const resumo = useMemo(() => {
    const porTaxa = new Map<number, { base: number; iva: number }>();
    for (const l of linhas) {
      const r = porTaxa.get(l.taxa) ?? { base: 0, iva: 0 };
      r.base += l.semIva;
      r.iva += l.iva;
      porTaxa.set(l.taxa, r);
    }
    return [...porTaxa.entries()]
      .map(([taxa, r]) => ({ taxa, ...r }))
      .sort((a, b) => a.taxa - b.taxa);
  }, [linhas]);

  const total = linhas.reduce((a, l) => a + l.preco, 0);
  const totalIva = linhas.reduce((a, l) => a + l.iva, 0);
  const poupancaFaceContinente = Math.max(0, ivaContinente - totalIva);
  const lida = ativo !== null ? linhas[ativo] : null;
  const runId = `${regiao}|${precos.map((p) => r1(p)).join("|")}`;
  const { ref: talaoRef, arm: talaoArm } = useArmado<HTMLDivElement>(runId);

  const arestaTopo = mascaraFaixaRasgo(COMP, {
    semente: SEMENTE,
    ponta: "topo",
    grosseria: 0.45,
  });
  const arestaFundo = mascaraFaixaRasgo(COMP, {
    semente: SEMENTE + 7,
    ponta: "fundo",
    grosseria: 0.45,
  });

  return (
    <div className="grid items-start gap-10 md:grid-cols-[1fr_auto]">
      {/* leitura — a coluna explica o objecto; pegajosa porque o
          talão é alto: o readout fica visível ao interrogar o fim */}
      <div className="self-start md:sticky md:top-6">
        {/* readout fixo — a linha interrogada; régua percorre por teclado */}
        <div className="chart-readout" aria-live="polite">
          {lida ? (
            <>
              <span className="chart-readout-t">{lida.nome}</span>
              <span className="chart-readout-v">{fmtEUR(lida.preco)}</span>
              <span className="chart-readout-t">
                inclui {fmtEUR(lida.iva)} de IVA ({fmtPct(lida.taxa, 0)})
              </span>
            </>
          ) : (
            <span className="chart-readout-t">
              {fmtEUR(total)} · {fmtEUR(totalIva)} são IVA
            </span>
          )}
          <input
            type="range"
            className="chart-scrub"
            min={0}
            max={linhas.length - 1}
            value={ativo ?? linhas.length - 1}
            aria-label={scrubAria}
            aria-valuetext={
              lida ? `${lida.nome}: ${fmtEUR(lida.preco)}` : undefined
            }
            onChange={(e) => setAtivo(Number(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAtivo(null);
            }}
            onBlur={() => setAtivo(null)}
          />
        </div>

        {/* PROPOSTA (revisão do dono) — Selector regional de IVA (art. 18.º n.º 3 CIVA) */}
        <div className="mt-5">
          <span className="kicker mb-1.5 block">Taxas de IVA por região</span>
          <Segmentado
            rotulo="Taxas de IVA por região"
            valor={regiao}
            onChange={(v) => setRegiao(v as RegiaoIva)}
            opcoes={[
              { id: "continente", rotulo: "Continente" },
              { id: "acores", rotulo: "Açores" },
              { id: "madeira", rotulo: "Madeira" },
            ]}
          />
          <p className="footnote mt-1.5">
            Taxas em vigor:{" "}
            <strong>
              {regiao === "continente"
                ? `Continente (${rotuloTaxas(ivaRegioes.continenteReferencia)})`
                : regiao === "acores"
                  ? `Açores (${rotuloTaxas(ivaRegioes.acores)})`
                  : `Madeira (${rotuloTaxas(ivaRegioes.madeira)})`}
            </strong>
            .
          </p>
        </div>

        <p className="body-copy mt-4">
          Um talão de supermercado real traz o IVA escondido nas letras do
          fim de cada linha e no resumo por taxa. Aqui os preços são teus —
          edita-os no talão — e a máquina é o motor de IVA do site: cada
          preço já inclui imposto, que o recibo só declara no fim.
        </p>
        <p className="footnote mt-4">
          {regiao === "continente" ? (
            <>
              No <strong>Continente</strong> ({rotuloTaxas(ivaRegioes.continenteReferencia)}),
              este cabaz inclui <strong>{fmtEUR(totalIva)}</strong> de IVA. Nos{" "}
              <strong>Açores</strong> ({rotuloTaxas(ivaRegioes.acores)}) o mesmo
              cabaz leva menos{" "}
              <strong>{fmtEUR(Math.max(0, ivaContinente - ivaAcores))}</strong>{" "}
              de imposto na caixa (art. 18.º n.º 3 do CIVA).
            </>
          ) : (
            <>
              Em <strong>{regiao === "acores" ? "Açores" : "Madeira"}</strong> (
              {rotuloTaxas(taxasAtuais)}), este cabaz inclui{" "}
              <strong>{fmtEUR(totalIva)}</strong> de IVA — menos{" "}
              <strong>{fmtEUR(poupancaFaceContinente)}</strong> de imposto do
              que no Continente ({fmtEUR(ivaContinente)}) para os mesmos preços
              finais (art. 18.º n.º 3 do CIVA).
            </>
          )}
        </p>
      </div>

      {/* o talão — duas peças: compras + cupão IVA, separadas por
          perfuração a sério; arestas rasgadas fecham o conjunto */}
      <div className="talao-wrap w-full max-w-80 justify-self-center" aria-live="polite" ref={talaoRef}>
        <div
          className="talao-aresta talao-aresta-t"
          style={{ maskImage: arestaTopo, WebkitMaskImage: arestaTopo }}
          aria-hidden
        />
        <div className="talao talao-mat">
          <span className="carimbo">simulação</span>
          <div className="talao-face px-6 pb-5 pt-7">
            <p className="talao-head text-center">Talão de compras</p>
            <p className="talao-sub talao-dim mt-1 text-center">
              * * * preços editáveis * * *
            </p>
            <ul className="talao-body mt-4">
              {linhas.map((l, i) => (
                <li
                  key={l.nome}
                  className={`talao-sep chart-hit py-1.5 ${
                    ativo !== null && ativo !== i ? "chart-hit-off" : ""
                  }`}
                  onPointerEnter={() => setAtivo(i)}
                  onPointerLeave={() => setAtivo(null)}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="talao-dim min-w-0">{l.nome}</span>
                    <label className="flex items-baseline gap-1">
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={precos[i]}
                        aria-label={`Preço de ${l.nome.toLowerCase()}`}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setPrecos((p) => p.map((x, j) => (j === i ? v : x)));
                        }}
                        className="talao-field w-16 text-right"
                      />
                      <span aria-hidden>€</span>
                    </label>
                  </div>
                  <div className="mt-0.5 flex items-baseline justify-between gap-3">
                    <span className="talao-note talao-dim">
                      IVA {fmtPct(l.taxa, 0)} · contém {fmtEUR(l.iva)}
                    </span>
                    <span className="iva-mini" aria-hidden>
                      <span
                        className="iva-mini-base"
                        style={{
                          width: `${l.preco > 0 ? (l.semIva / l.preco) * 100 : 0}%`,
                        }}
                      />
                      <span
                        className="iva-mini-fatia"
                        style={{
                          width: `${l.preco > 0 ? (l.iva / l.preco) * 100 : 0}%`,
                        }}
                      />
                      {/* a fatia que se separa — clone efémero, cai para
                          o cupão; remonta por mudança de valor */}
                      <span
                        key={runId}
                        className={"iva-voa " + talaoArm("iva-voa-anim")}
                        style={
                          {
                            width: `${l.preco > 0 ? (l.iva / l.preco) * 100 : 0}%`,
                            "--linha": i,
                          } as React.CSSProperties
                        }
                      />
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="talao-cut mt-1 flex items-baseline justify-between gap-4 py-3">
              <span className="talao-total">Total</span>
              <span className="text-talao-hero font-bold">{fmtEUR(total)}</span>
            </div>
          </div>
        </div>

        {/* a linha por onde o cupão se destaca — furos a sério */}
        <div className="talao-perf" aria-hidden />

        {/* peça II — o cupão RESUMO IVA, o que se separou das linhas */}
        <div className="talao talao-mat">
          <div className="talao-face px-6 pb-5 pt-4">
            <table className="talao-body talao-dim mt-1 w-full">
              <thead>
                <tr className="talao-note text-left uppercase">
                  <th scope="col" className="py-1 font-normal">Resumo IVA</th>
                  <th scope="col" className="py-1 text-right font-normal">base</th>
                  <th scope="col" className="py-1 text-right font-normal">imposto</th>
                  <th scope="col" className="py-1 font-normal">
                    <span className="sr-only">peso no IVA</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resumo.map((r, i) => (
                  <tr key={r.taxa} className="talao-sep">
                    <td className="py-1 tabular-nums">{fmtPct(r.taxa, 0)}</td>
                    <td className="py-1 text-right tabular-nums">{fmtEUR(r.base)}</td>
                    <td className="py-1 text-right tabular-nums">{fmtEUR(r.iva)}</td>
                    <td className="py-1 pl-2">
                      <span className="iva-barra" aria-hidden>
                        <span
                          key={runId}
                          className={"iva-barra-f " + talaoArm("iva-barra-anim")}
                          style={
                            {
                              width: `${totalIva > 0 ? (r.iva / totalIva) * 100 : 0}%`,
                              "--linha": i,
                            } as React.CSSProperties
                          }
                        />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="talao-cut mt-1 flex items-baseline justify-between gap-4 py-1.5">
              <span className="talao-total">Deste total é IVA</span>
              <span className="whitespace-nowrap text-talao-destaque font-bold">
                {fmtEUR(totalIva)}
                <span className="talao-note talao-dim ml-2 whitespace-nowrap">
                  {fmtPct(total > 0 ? totalIva / total : 0)}
                </span>
              </span>
            </div>

            <div className="talao-barras mt-5" aria-hidden />
            <p className="talao-meta talao-dim mt-2 flex justify-between">
              <span>CIVA · LISTAS I/II</span>
              <span>AOCENTIMO</span>
            </p>
          </div>
        </div>
        <div
          className="talao-aresta talao-aresta-b"
          style={{ maskImage: arestaFundo, WebkitMaskImage: arestaFundo }}
          aria-hidden
        />
      </div>
    </div>
  );
}
