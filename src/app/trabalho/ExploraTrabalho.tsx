"use client";

import { Fragment, type ReactNode } from "react";
import { BarraTracos } from "@/components/BarraTracos";
import { Cartao } from "@/components/Cartao";
import { Interruptor } from "@/components/Interruptor";
import { NumHero } from "@/components/NumHero";
import { SITE_URL } from "@/lib/site";
import { useArmado } from "@/lib/useArmado";
import { mascaraFaixaRasgo, sementeDe } from "@/lib/materia";
import { fmtEUR } from "@/lib/format";
import { useTrabalho } from "./contexto";
import { SimuladorIndependente } from "./SimuladorIndependente";

/**
 * Nível 2 de /trabalho (3A-03) — «Explora»: os controlos físicos do
 * caso (idade, descontos, majoração), a declaração da Segurança
 * Social a provar a mensalidade, os meses de subsídio em barra de
 * traços (1 traço = 1 mês, com o degrau de −10 % a partir do 7.º mês
 * desenhado na cor) e os recibos verdes — da faturação ao bolso em
 * campo de cêntimos.
 *
 * O bruto vem da régua do nível 1 via useTrabalho — a mesma grelha
 * canónica de /salario.
 */

/** Contador — o mesmo controlo físico de /salario (botões pílula −/+
    à volta do valor em mono); local à rota, como lá. */
function Contador({
  id,
  rotulo,
  valor,
  onChange,
  min,
  max,
  formato,
  nota,
}: {
  id: string;
  rotulo: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  formato: (v: number) => string;
  nota?: ReactNode;
}) {
  const move = (d: number) =>
    onChange(Math.min(max, Math.max(min, valor + d)));
  const btn =
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-controlo border border-line2 bg-panel font-mono text-corpo text-ink2 transition-colors hover:text-ink disabled:opacity-40 disabled:hover:text-ink2";
  return (
    <div role="group" aria-labelledby={`${id}-rot`}>
      <span id={`${id}-rot`} className="kicker mb-1.5 block">
        {rotulo}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => move(-1)}
          disabled={valor <= min}
          aria-label={`${rotulo} — menos`}
        >
          −
        </button>
        <span
          role="status"
          aria-live="polite"
          className="num min-w-20 text-center text-corpo"
        >
          {formato(valor)}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => move(1)}
          disabled={valor >= max}
          aria-label={`${rotulo} — mais`}
        >
          +
        </button>
      </div>
      {nota && <p className="footnote mt-1">{nota}</p>}
    </div>
  );
}

/** os controlos do caso — idade e descontos em contadores, majoração
    em interruptor; o salário é a régua do nível 1 */
function ControlosDesemprego() {
  const s = useTrabalho();
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Contador
          id="idade"
          rotulo="A tua idade"
          valor={s.idade}
          onChange={s.setIdade}
          min={16}
          max={66}
          formato={(v) => `${v} anos`}
        />
        <Contador
          id="desc"
          rotulo="Anos de descontos"
          valor={s.anosDescontos}
          onChange={s.setAnosDescontos}
          min={0}
          max={40}
          formato={(v) => `${v} anos`}
          nota="nos últimos 20 anos de carreira"
        />
      </div>
      <Interruptor
        ligado={s.majoracao}
        onChange={s.setMajoracao}
        rotulo="Casal desempregado com filhos / monoparental (+10 %)"
        className="text-corpo-sm"
      />
      <p className="footnote">
        A remuneração de referência é a média dos primeiros 12 dos
        últimos 14 meses, com subsídios de férias e de Natal — para
        salário estável, é <span className="num">bruto × 14/12</span>.
        Prazo de garantia: 360 dias de descontos nos últimos 24 meses.
      </p>
    </div>
  );
}

/** a declaração — o artefacto da Segurança Social: o que descontaste
    devolve-se linha a linha (M-18). A contagem dos meses saiu daqui:
    é a BarraTracos do cartão seguinte que a desenha (redundância é
    defeito). */
function DeclaracaoDesemprego({ ias }: { ias: number }) {
  const s = useTrabalho();
  const r = s.r;

  // reimpressão linha a linha a cada mudança — o mesmo verniz do
  // recibo de /salario e da nota de liquidação de /irs
  const declKey = [s.bruto, s.idade, s.anosDescontos, s.majoracao].join("-");
  const { ref: declRef, arm: declArm } = useArmado<HTMLDivElement>(declKey);
  let linha = -1;
  const prox = () => ++linha;

  const arestaTopo = mascaraFaixaRasgo(320, {
    semente: sementeDe(20260214),
    ponta: "topo",
    grosseria: 0.4,
  });
  const arestaFundo = mascaraFaixaRasgo(320, {
    semente: sementeDe(20260221),
    ponta: "fundo",
    grosseria: 0.4,
  });

  return (
    <div>
      <div
        className="talao-wrap mt-6 w-full max-w-96 self-start justify-self-center md:sticky md:top-6 md:mt-0"
        ref={declRef}
      >
        <div
          className="talao-aresta talao-aresta-t"
          style={{ maskImage: arestaTopo, WebkitMaskImage: arestaTopo }}
          aria-hidden
        />
        <div className="talao talao-mat">
          <span className="carimbo">simulação</span>
          <div className="talao-face px-6 pb-5 pt-7">
            <p className="talao-head text-center">Declaração de desemprego</p>
            <p className="talao-sub talao-dim mt-1 text-center">
              * * * segurança social · simulado * * *
            </p>
            {r.elegivel ? (
              <dl className="talao-body mt-4">
                <Fragment key={declKey}>
                  <div
                    className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">REMUNERAÇÃO DE REFERÊNCIA</dt>
                    <dd>{fmtEUR(r.remReferencia)}</dd>
                  </div>
                  <div
                    className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">… LÍQUIDA (SS + RETENÇÃO)</dt>
                    <dd>{fmtEUR(r.remReferenciaLiquida)}</dd>
                  </div>
                  <div
                    className={declArm("talao-linha") + " talao-cut mt-1 py-2.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-total">Mensalidade · 65 %</dt>
                    <dd className="mt-1">
                      <NumHero
                        valor={fmtEUR(r.mensal)}
                        sufixo="/mês"
                        compacto
                        animar={r.mensal}
                      />
                    </dd>
                  </div>
                  {s.temCorte && (
                    <div
                      className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                      style={{ "--linha": prox() } as React.CSSProperties}
                    >
                      <dt className="talao-dim">DO 7.º MÊS EM DIANTE</dt>
                      <dd>
                        {fmtEUR(r.apos180Dias)}
                        <span
                          className={"talao-retido " + declArm("talao-carimbo-anim")}
                          aria-hidden
                        >
                          −10 %
                        </span>
                      </dd>
                    </div>
                  )}
                  <div
                    className={declArm("talao-linha") + " talao-sep flex justify-between gap-4 py-1.5"}
                    style={{ "--linha": prox() } as React.CSSProperties}
                  >
                    <dt className="talao-dim">DURAÇÃO</dt>
                    <dd>
                      {r.duracaoDias} dias{" "}
                      <span className="talao-dim">(~{s.meses} meses)</span>
                    </dd>
                  </div>
                </Fragment>
              </dl>
            ) : (
              <p className="py-6 text-talao-corpo talao-dim">{r.nota}</p>
            )}
            <div className="talao-barras mt-5" aria-hidden />
            <p className="talao-meta talao-dim mt-2 flex justify-between">
              <span>DL 220/2006 · SEG. SOCIAL</span>
              <span>{new URL(SITE_URL).host.toUpperCase()}</span>
            </p>
          </div>
        </div>
        <div
          className="talao-aresta talao-aresta-b"
          style={{ maskImage: arestaFundo, WebkitMaskImage: arestaFundo }}
          aria-hidden
        />
      </div>
      {r.elegivel && (
        <p className="footnote mt-4 px-1">
          Limites: entre {fmtEUR(ias)} e {fmtEUR(ias * 2.5)} (1–2,5×IAS), e
          nunca acima de 75 % da remuneração líquida de referência. Pedido
          no IEFP até 90 dias após o fim do contrato.
        </p>
      )}
    </div>
  );
}

/** os meses de subsídio — 1 traço = 1 mês: os primeiros seis a valor
    inteiro («fica»), do 7.º em diante a marca (−10 % visível na cor,
    explicado na nota). Calculado do motor, nunca ilustrado. */
function MesesSubsidio() {
  const s = useTrabalho();
  const r = s.r;
  return (
    <Cartao
      breadcrumb="O SUBSÍDIO / DURAÇÃO · MESES"
      fonte={{
        rotulo: "Fonte",
        itens: [{ nome: "DL 220/2006 — duração por idade e descontos" }],
      }}
    >
      {r.elegivel ? (
        <>
          <p className="leitura-insight">
            {s.temCorte
              ? `${s.meses} meses de subsídio — a partir do 7.º, cada mês vale menos 10 %.`
              : `${s.meses} meses de subsídio — acaba antes do degrau dos seis.`}
          </p>
          <div className="mt-4">
            <BarraTracos
              grupos={
                s.temCorte
                  ? [
                      { n: 6, tom: "fica", rotulo: "meses a valor inteiro" },
                      {
                        n: Math.max(0, s.meses - 6),
                        tom: "marca",
                        rotulo: "meses a −10 %",
                      },
                    ]
                  : [{ n: s.meses, tom: "fica", rotulo: "meses de subsídio" }]
              }
              unidadeTraco="1 mês de subsídio"
              rotulo="Os meses de subsídio"
              valor={`${s.meses} meses`}
              nota={
                s.temCorte
                  ? `1.º–6.º a ${fmtEUR(r.mensal)} · do 7.º em diante ${fmtEUR(r.apos180Dias)}`
                  : `${fmtEUR(r.mensal)} por mês`
              }
              equivalente={
                s.temCorte
                  ? `${s.meses} meses de subsídio: ${fmtEUR(r.mensal)} por mês até ao 6.º mês, ${fmtEUR(r.apos180Dias)} do 7.º mês até ao fim.`
                  : `${s.meses} meses de subsídio a ${fmtEUR(r.mensal)} por mês.`
              }
            />
          </div>
          <p className="footnote mt-3">
            São {r.duracaoDias} dias corridos — a tabela por idade e anos
            de descontos está em «3 · Confirma».
          </p>
        </>
      ) : (
        <p className="leitura-insight">
          Com {s.anosDescontos} anos de descontos não há subsídio — o
          prazo de garantia pede 360 dias nos últimos 24 meses.
        </p>
      )}
    </Cartao>
  );
}

/** a grelha do nível 2: controlos à esquerda, a declaração a provar
    à direita; por baixo os meses em traços e os recibos verdes */
export function ExploraTrabalho({ ias }: { ias: number }) {
  return (
    <div className="space-y-10">
      <div className="grid items-start gap-10 md:grid-cols-[1fr_1.2fr]">
        <ControlosDesemprego />
        <DeclaracaoDesemprego ias={ias} />
      </div>
      <MesesSubsidio />
      <Cartao
        breadcrumb="SE FORES INDEPENDENTE / RECIBOS VERDES"
        fonte={{
          rotulo: "Fonte",
          itens: [{ nome: "CIRS art. 31.º/101.º · Cód. Contributivo art. 168.º" }],
        }}
      >
        <p className="leitura-insight">
          Sem subsídio de desemprego — mas com regras próprias: de cada
          euro que faturas, o que sai e o que fica.
        </p>
        <div className="mt-4">
          <SimuladorIndependente />
        </div>
      </Cartao>
    </div>
  );
}
