"use client";

import { Fragment } from "react";
import { Interruptor } from "@/components/Interruptor";
import { JuroCapital } from "@/components/JuroCapital";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import type { CompradoresJovens } from "@/lib/engines/imt-puro";
import {
  FINO,
  comUnidade,
  fmtEUR,
  fmtEUR0,
  fmtNum,
  fmtPct,
} from "@/lib/format";
import { mascaraFaixaRasgo, sementeDe } from "@/lib/materia";
import { useArmado } from "@/lib/useArmado";
import { useCasa } from "./CasaSim";

/**
 * Comprar casa — o nível 2 de /casa: a escritura e os trinta anos.
 *
 * O estado vive no <CasaProvider> — o mesmo preço, a mesma entrada e o
 * mesmo contrato que a resposta do nível 1 lê e que as tabelas do
 * nível 3 confirmam.
 */

const COMP = 320;
const SEMENTE = sementeDe(20260101);

/** papel = tinta fixa; custos = família torrada do "sai" */
const TINTA = "rgba(44,36,19,";
const TORRADO = "rgba(157,42,13,";

export function SimuladorCasa({
  euriborAtual,
  euriborAte,
}: {
  euriborAtual: number | null;
  /** período da série («2026-08» → fmtPeriodo no texto) */
  euriborAte: string | null;
}) {
  const {
    preco,
    tipo,
    jovem,
    compradoresJovens,
    garantiaPublica,
    garantiaPublicaElegivel,
    entradaEf,
    entradaMinimaBdP,
    ltvAtual,
    ltvMaximoBdP,
    anos,
    euribor,
    spread,
    credito,
    compra,
    prest,
    prestSemGarantia90,
    regrasCredito,
    dinheiroEntrada,
    realEscritura,
    setPreco,
    setTipo,
    setJovem,
    setCompradoresJovens,
    setGarantiaPublica,
    setEntrada,
    setAnos,
    setEuribor,
    setSpread,
  } = useCasa();

  // re-animações por mudança de valores — spans/grupos efémeros, nunca inputs
  const runEscritura = `${preco}-${tipo}-${compradoresJovens}-${credito}`;
  const runTempo = `${credito}-${anos}-${euribor}-${spread}`;

  // gates de dobra (M-09): nascer à vista = nascer impresso; abaixo
  // da dobra, a primeira impressão/revelação acontece ao entrar
  const { ref: talaoRef, arm: talaoArm } = useArmado<HTMLDivElement>(runEscritura);

  // camadas da acreção — a ordem é a da escritura
  const camadas = [
    { nome: "Preço na placa", v: preco, cor: `${TINTA}0.75)`, txt: `${TINTA}0.9)` },
    { nome: "IMT", v: compra.imt, cor: `${TORRADO}0.85)`, txt: `${TORRADO}1)` },
    { nome: `Imposto de Selo — compra (${comUnidade("0,8", "%")})`, v: compra.isAquisicao, cor: `${TORRADO}0.62)`, txt: `${TORRADO}0.9)` },
    { nome: `Imposto de Selo — crédito (${comUnidade("0,6", "%")})`, v: compra.isCredito, cor: `${TORRADO}0.45)`, txt: `${TORRADO}0.8)` },
    { nome: "Escritura e registos (Casa Pronta)", v: compra.registos, cor: `${TINTA}0.35)`, txt: `${TINTA}0.7)` },
  ];

  const arestaTopo = mascaraFaixaRasgo(COMP, { semente: SEMENTE, ponta: "topo", grosseria: 0.35 });
  const arestaFundo = mascaraFaixaRasgo(COMP, { semente: SEMENTE + 3, ponta: "fundo", grosseria: 0.35 });

  const pctEntradaMinBdP = Math.round((1 - ltvMaximoBdP) * 100);
  const garantiaValorMax = Math.round(
    preco * regrasCredito.garantiaPublicaJovem.garantiaMaxPct
  );

  const presetsEntrada = [
    {
      rotulo: `Mín. BdP (${comUnidade(fmtNum(pctEntradaMinBdP, 0), "%")})`,
      valor: entradaMinimaBdP,
    },
    {
      rotulo: comUnidade("20", "%"),
      valor: Math.round(preco * 0.2),
    },
    ...(garantiaPublicaElegivel
      ? [{ rotulo: `${comUnidade("0", "€")} (Garantia)`, valor: 0 }]
      : []),
  ];

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <Regua
          id="preco"
          rotulo="Preço da casa"
          valor={preco}
          onChange={setPreco}
          min={20000}
          max={1000000}
          passo={5000}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />
        <Segmentado
          rotulo="Finalidade"
          valor={tipo}
          onChange={(id) => setTipo(id as "hpp" | "secundaria")}
          opcoes={[
            { id: "hpp", rotulo: "Habitação própria" },
            { id: "secundaria", rotulo: "Secundária" },
          ]}
        />
        <div className="space-y-3">
          {/* desactivado fora da HPP — a razão fica acessível no
              próprio interruptor (title + nota visível) */}
          <Interruptor
            ligado={jovem}
            onChange={setJovem}
            desativado={tipo !== "hpp"}
            razao="só se aplica a habitação própria e permanente"
            rotulo="IMT Jovem (≤35 anos, 1.ª casa)"
            className="text-corpo-sm"
          />

          {/* PROPOSTA (revisão do dono) — Selector de compra individual vs compra a dois (art. 9.º CIMT) */}
          {tipo === "hpp" && (
            <div>
              <label className="kicker block mb-1.5">
                Compradores elegíveis para IMT Jovem
              </label>
              <Segmentado
                rotulo="Compradores elegíveis para IMT Jovem"
                valor={compradoresJovens}
                onChange={(id) =>
                  setCompradoresJovens(id as CompradoresJovens)
                }
                opcoes={[
                  { id: "nenhum", rotulo: "Regime geral" },
                  { id: "todos", rotulo: `Jovem 100${FINO}%` },
                  { id: "umDeDois", rotulo: "Compra a 2 (1 ≤35)" },
                ]}
              />
              {compradoresJovens === "umDeDois" && (
                <p className="footnote mt-1.5">
                  {/* PROPOSTA (revisão do dono) */}
                  Compra em compropriedade (50{FINO}% / 50{FINO}%) onde apenas 1
                  dos 2 compradores cumpre os requisitos do IMT Jovem: metade
                  beneficia da isenção de IMT e Selo de compra e a outra metade
                  paga pela tabela geral HPP (art. 9.º do CIMT).
                </p>
              )}
            </div>
          )}
        </div>

        <Regua
          id="entrada"
          rotulo="Entrada"
          valor={entradaEf}
          onChange={setEntrada}
          min={0}
          max={Math.max(0, preco)}
          passo={1000}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
          presets={presetsEntrada}
          limites={{ max: "não podes entrar com mais do que a casa" }}
          descricao={`${fmtPct(preco > 0 ? entradaEf / preco : 0, 0)} do preço · LTV ${fmtPct(ltvAtual, 0)} (máx. BdP ${fmtPct(ltvMaximoBdP, 0)}) · crédito de ${fmtEUR0(credito)}`}
        />

        {/* PROPOSTA (revisão do dono) — Garantia Pública do Estado (DL 44/2024) */}
        <div className="space-y-2">
          <Interruptor
            ligado={garantiaPublica}
            onChange={setGarantiaPublica}
            desativado={!garantiaPublicaElegivel}
            razao={
              tipo !== "hpp"
                ? "só se aplica a 1.ª habitação própria e permanente"
                : `só se aplica a imóveis até ${fmtEUR0(regrasCredito.garantiaPublicaJovem.precoMax)}`
            }
            rotulo={`Garantia Pública do Estado (≤${FINO}${regrasCredito.garantiaPublicaJovem.idadeMax} anos, até 100${FINO}% crédito)`}
            className="text-corpo-sm"
          />

          {garantiaPublica && (
            <div
              role="status"
              className="border border-line bg-panel p-3.5 text-corpo-sm text-ink2 space-y-1.5"
            >
              <p className="font-medium text-ink">
                {/* PROPOSTA (revisão do dono) */}
                Financiamento a 100{FINO}% com Garantia Pública até{" "}
                {fmtPct(regrasCredito.garantiaPublicaJovem.garantiaMaxPct, 0)} (
                {fmtEUR0(garantiaValorMax)})
              </p>
              <p>
                {/* PROPOSTA (revisão do dono) */}
                O Estado garante até{" "}
                {fmtPct(regrasCredito.garantiaPublicaJovem.garantiaMaxPct, 0)}{" "}
                do valor de transação (DL n.º 44/2024), permitindo {fmtEUR0(0)}{" "}
                de entrada para o preço.{" "}
                <strong>
                  Mas os impostos e registos ({fmtEUR0(compra.totalCustos)}) não
                  são financiados
                </strong>{" "}
                e saem do teu bolso no dia da escritura.
              </p>
              {prest && prestSemGarantia90 && (
                <p className="text-up">
                  {/* PROPOSTA (revisão do dono) */}
                  Pedir 100{FINO}% em vez de 90{FINO}% agrava a prestação em{" "}
                  <strong>
                    +{fmtEUR(prest.prestacao - prestSemGarantia90.prestacao)}
                    /mês
                  </strong>{" "}
                  e soma{" "}
                  <strong>
                    +{fmtEUR0(prest.jurosTotais - prestSemGarantia90.jurosTotais)}
                  </strong>{" "}
                  em juros ao longo de {comUnidade(fmtNum(anos, 0), "anos")}.
                </p>
              )}
            </div>
          )}

          {!garantiaPublica && ltvAtual > ltvMaximoBdP + 0.001 && (
            <div
              role="status"
              className="border border-up/50 bg-panel p-3.5 text-corpo-sm text-ink2"
            >
              {/* PROPOSTA (revisão do dono) */}
              Sem Garantia Pública Jovem, o Banco de Portugal recomenda um
              financiamento (LTV) máximo de{" "}
              <strong>{fmtPct(ltvMaximoBdP, 0)}</strong> — o que exige pelo
              menos{" "}
              <strong>
                {fmtEUR0(entradaMinimaBdP)} ({fmtPct(1 - ltvMaximoBdP, 0)})
              </strong>{" "}
              de capitais próprios para a entrada.
            </div>
          )}
        </div>

        <Regua
          id="prazo"
          rotulo="Prazo"
          valor={anos}
          onChange={(v) => setAnos(Math.round(v))}
          min={1}
          max={50}
          passo={1}
          unidade="anos"
          formato={(v) => fmtNum(v, 0)}
        />
        {euribor === null ? (
          <div>
            <label className="kicker block mb-1.5" htmlFor="eur">
              Euribor (%)
            </label>
            <input
              id="eur"
              type="number"
              step={0.1}
              value=""
              onChange={(e) =>
                setEuribor(
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="field"
            />
          </div>
        ) : (
          <Regua
            id="eur"
            rotulo="Euribor"
            valor={euribor}
            onChange={setEuribor}
            min={-0.5}
            max={7}
            passo={0.01}
            unidade="%"
            formato={(v) => fmtNum(v, 2)}
            marcadorAgora={
              euriborAtual !== null
                ? { valor: euriborAtual, rotulo: "agora 3M" }
                : undefined
            }
          />
        )}
        <Regua
          id="spr"
          rotulo="Spread"
          valor={spread}
          onChange={setSpread}
          min={0}
          max={3}
          passo={0.05}
          unidade="%"
          formato={(v) => fmtNum(v, 2)}
        />
        <p className="footnote">
          Euribor 3M real em{" "}
          {euriborAtual !== null ? fmtPct(euriborAtual / 100, 2) : "—"} (BPstat,
          média de {euriborAte ?? "série mais recente"}) — o valor vem
          preenchido, muda-o à vontade. IMT incide sobre o maior de preço ou
          VPT.
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div
        className="space-y-8 self-start md:sticky md:top-6"
        aria-live="polite"
      >
        {/* a escritura — papel, linhas que se imprimem, camada a camada */}
        <div className="talao-wrap" ref={talaoRef}>
          <div
            className="talao-aresta talao-aresta-t"
            style={{ maskImage: arestaTopo, WebkitMaskImage: arestaTopo }}
            aria-hidden
          />
          <div className="talao talao-mat">
            <span className="carimbo">simulação</span>
            <div className="talao-face px-5 pb-5 pt-6">
              <p className="talao-head text-center">No dia da escritura</p>
              <p className="talao-sub talao-dim mt-1 text-center">
                o preço mais o que se junta a ele
              </p>
              <dl className="talao-body mt-3">
                <Fragment key={runEscritura}>
                  {camadas.map((c, i) => (
                    <div
                      key={c.nome}
                      className={
                        talaoArm("talao-linha") +
                        " talao-sep flex items-baseline justify-between gap-3 py-1.5"
                      }
                      style={{ "--linha": i } as React.CSSProperties}
                    >
                      <dt className="talao-dim flex items-center gap-2">
                        <span
                          className="sw"
                          style={{ background: c.cor }}
                          aria-hidden
                        />
                        {c.nome}
                        {c.nome === "IMT" &&
                          jovem &&
                          tipo === "hpp" &&
                          (compradoresJovens === "umDeDois"
                            ? " (Jovem 1/2)"
                            : " (Jovem)")}
                      </dt>
                      <dd className="num">
                        {i > 0 && (
                          <span aria-hidden className="talao-dim">
                            +{" "}
                          </span>
                        )}
                        {fmtEUR(c.v)}
                      </dd>
                    </div>
                  ))}
                </Fragment>
              </dl>
              {/* a acreção — cada camada empilha quando a sua linha imprime */}
              <div className="acre mt-2" key={runEscritura} aria-hidden>
                {camadas.map((c, i) => (
                  <span
                    key={c.nome}
                    className={"acre-seg " + talaoArm("acre-anim")}
                    style={
                      {
                        width: `${realEscritura > 0 ? (c.v / realEscritura) * 100 : 0}%`,
                        background: c.cor,
                        "--cam": i,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <div
                className={
                  talaoArm("talao-linha") +
                  " talao-cut mt-1 flex items-baseline justify-between gap-4 py-2.5"
                }
                style={{ "--linha": camadas.length } as React.CSSProperties}
                key={`cut-${runEscritura}`}
              >
                <span className="talao-total">Custa mesmo</span>
                <span className="text-display-sm font-bold">
                  {fmtEUR0(realEscritura)}
                </span>
              </div>
              <p
                className={
                  talaoArm("talao-linha") + " talao-note talao-dim"
                }
                style={
                  { "--linha": camadas.length + 1 } as React.CSSProperties
                }
                key={`note-${runEscritura}`}
              >
                à entrada saem-te {fmtEUR0(dinheiroEntrada)} do bolso —{" "}
                {fmtEUR0(entradaEf)} de entrada + {fmtEUR0(compra.totalCustos)}{" "}
                de custos
              </p>
            </div>
          </div>
          <div
            className="talao-aresta talao-aresta-b"
            style={{ maskImage: arestaFundo, WebkitMaskImage: arestaFundo }}
            aria-hidden
          />
        </div>

        <div className="bg-raised border border-line shadow-raised">
          <div className="border-b border-line px-5 py-3">
            <span className="kicker">Todos os meses</span>
          </div>
          <div className="px-5 py-5">
            <NumHero
              valor={prest ? fmtEUR(prest.prestacao) : "—"}
              sufixo={prest ? "/mês" : undefined}
              animar={prest?.prestacao}
            />
            <dl className="mt-4 text-corpo-sm space-y-2">
              <div className="flex justify-between border-b border-line/60 pb-1.5">
                <dt className="text-ink2">TAN (Euribor + spread)</dt>
                <dd className="num">{prest ? fmtPct(prest.tan) : "—"}</dd>
              </div>
              <div className="flex justify-between border-b border-line/60 pb-1.5">
                <dt className="text-ink2">
                  Juros totais em {comUnidade(fmtNum(anos, 0), "anos")}
                </dt>
                <dd className="num">
                  {prest ? fmtEUR0(prest.jurosTotais) : "—"}
                </dd>
              </div>
              <div className="flex justify-between pb-1.5">
                <dt className="text-ink2">A casa custa, no fim</dt>
                <dd className="num font-medium">
                  {prest ? fmtEUR0(realEscritura + prest.jurosTotais) : "—"}
                </dd>
              </div>
            </dl>

            {/* juro vs capital — a divisória que troca de peso:
                capital (keep) fica teu, juro (up) sai para o banco */}
            {prest && <JuroCapital linhas={prest.linhas} runKey={runTempo} />}
          </div>
        </div>
      </div>
    </div>
  );
}
