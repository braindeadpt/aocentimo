"use client";

import { Interruptor } from "@/components/Interruptor";
import { JuroCapital } from "@/components/JuroCapital";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { TweenNum } from "@/components/TweenNum";
import { FINO, comUnidade, fmtData, fmtEUR, fmtEUR0, fmtNum, fmtPct } from "@/lib/format";
import { useCredito } from "./CreditoSim";

/**
 * Crédito — o nível 2 de /credito: as réguas do contrato e o mapa.
 *
 * O estado vive no <CreditoProvider> — é o mesmo contrato que a
 * resposta do nível 1 lê (a prestação-herói e a frase do total mudam
 * com estas réguas) e que a tabela do nível 3 confirma.
 *
 * A prestação esconde uma divisão: no início quase tudo é juro, no fim
 * quase tudo é capital. O <JuroCapital> mostra essa troca de peso ao
 * longo dos anos — é a leitura que o banco nunca desenha.
 *
 * O choque +1 p.p. é um interruptor, não uma linha de texto: ao ligar,
 * TODA a resposta muda de estado — o NumHero desliza para a prestação
 * chocada, os juros totais interpolam a inchar (TweenNum) e o mapa
 * re-desenha a divisória.
 */
export function SimuladorPrestacao({
  euriborAtual,
  euriborAte,
  euribor12m,
  mediana12m,
  rotulos,
}: {
  euriborAtual: number | null;
  euriborAte: string | null;
  /** Euribor 12M actual — o marcador «agora» da régua da taxa */
  euribor12m: number | null;
  /** mediana de 10 anos da Euribor 12M (painel derivado) — preset */
  mediana12m: number | null;
  rotulos: {
    capital: string;
    euribor: string;
    spread: string;
    prazo: string;
    agora12m: string;
    mediana10: string;
    menos: string;
    mais: string;
  };
}) {
  const {
    capital,
    anos,
    euribor,
    spread,
    choque,
    sim: r,
    base,
    setCapital,
    setAnos,
    setEuribor,
    setSpread,
    setChoque,
  } = useCredito();
  const runMapa = `${capital}-${anos}-${r?.tan ?? "sem-taxa"}-${spread}-${choque}`;

  // presets da taxa — âncora é o valor oficial de hoje (12M): a mediana
  // de 10 anos do painel e ±0,5 p.p. em redor do «agora»
  const presetsTaxa = [
    ...(mediana12m !== null
      ? [{ rotulo: rotulos.mediana10, valor: mediana12m }]
      : []),
    ...(euribor12m !== null
      ? [
          { rotulo: rotulos.menos, valor: euribor12m - 0.5 },
          { rotulo: rotulos.mais, valor: euribor12m + 0.5 },
        ]
      : []),
  ];

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        {/* capital, prazo e taxas são réguas físicas (catálogo V4 §5:
            todo o input numérico é régua) */}
        <Regua
          id="cap"
          rotulo={rotulos.capital}
          valor={capital}
          onChange={setCapital}
          min={10000}
          max={1000000}
          passo={5000}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />
        <Regua
          id="prazo"
          rotulo={rotulos.prazo}
          valor={anos}
          onChange={(v) => setAnos(Math.round(v))}
          min={1}
          max={50}
          passo={1}
          unidade="anos"
          formato={(v) => fmtNum(v, 0)}
        />
        {/* regra nº1: se o BPstat falhou o campo da taxa fica livre —
            o input simples de sempre, nunca um número inventado */}
        {euribor === null ? (
          <div>
            <label className="kicker block mb-1.5" htmlFor="eur">Euribor (%)</label>
            <input id="eur" type="number" step={0.1} value=""
              onChange={(e) =>
                setEuribor(e.target.value === "" ? null : Number(e.target.value))
              }
              className="field" />
          </div>
        ) : (
          <Regua
            id="eur"
            rotulo={rotulos.euribor}
            valor={euribor}
            onChange={setEuribor}
            min={-0.5}
            max={7}
            passo={0.01}
            unidade="%"
            formato={(v) => fmtNum(v, 2)}
            marcadorAgora={
              euribor12m !== null
                ? { valor: euribor12m, rotulo: rotulos.agora12m }
                : undefined
            }
            presets={presetsTaxa}
          />
        )}
        <Regua
          id="spr"
          rotulo={rotulos.spread}
          valor={spread}
          onChange={setSpread}
          min={0}
          max={3}
          passo={0.05}
          unidade="%"
          formato={(v) => fmtNum(v, 2)}
        />
        {/* o choque é um acto — não uma nota de rodapé */}
        <Interruptor
          ligado={choque}
          onChange={setChoque}
          rotulo={`Simular choque: Euribor sobe +1${FINO}p.p.`}
          className="text-corpo-sm"
        />
        <p className="footnote">
          TAN = Euribor + spread = {r ? fmtPct(r.tan) : "—"}. A TAEG junta seguros e
          comissões — é o número a comparar entre bancos, não o spread sozinho.
        </p>
        <p className="footnote mt-1">
          {euriborAtual !== null ? (
            <>
              Euribor 3M real em {fmtPct(euriborAtual / 100, 2)} (BPstat, média
              de {euriborAte ? fmtData(euriborAte) : "série mais recente"}) — o
              valor vem preenchido, muda-o à vontade.
            </>
          ) : (
            <>Euribor indisponível — o BPstat não respondeu; escreve a taxa do teu contrato.</>
          )}
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6" aria-live="polite">
        <div className="border-b border-line px-5 py-3 flex items-baseline justify-between gap-3">
          <span className="kicker">A tua prestação</span>
          {choque && (
            <span className="kicker-sm text-up">choque +1{FINO}p.p.</span>
          )}
        </div>
        <div className="px-5 py-5">
          <NumHero valor={r ? fmtEUR(r.prestacao) : "—"} sufixo={r ? "/mês" : undefined} animar={r?.prestacao} />
          <dl className="mt-5 text-corpo-sm space-y-2">
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Juros totais em {comUnidade(fmtNum(anos, 0), "anos")}</dt>
              <dd className="num">
                {r ? (
                  <TweenNum valor={r.jurosTotais} casas={0} texto={fmtEUR0(r.jurosTotais)} sufixo="€" />
                ) : "—"}
              </dd>
            </div>
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Custo total (aprox. MTIC)</dt>
              <dd className="num font-medium">
                {r ? (
                  <TweenNum valor={r.custoTotal} casas={0} texto={fmtEUR0(r.custoTotal)} sufixo="€" />
                ) : "—"}
              </dd>
            </div>
            <div className="flex justify-between pb-1.5">
              <dt className="text-ink2">O choque custa</dt>
              <dd className="num text-up">
                {choque && r && base
                  ? `+${fmtEUR(r.prestacao - base.prestacao)}/mês · +${fmtEUR0(r.jurosTotais - base.jurosTotais)} juros`
                  : "—"}
              </dd>
            </div>
          </dl>

          {/* a divisão escondida — capital fica teu, juro vai para o banco */}
          {r && <JuroCapital linhas={r.linhas} runKey={runMapa} />}
        </div>
        <p className="footnote px-5 pb-4">
          Sistema francês (prestação constante): no início quase tudo é juro,
          no fim quase tudo é capital. Por isso amortizar cedo poupa mais.
        </p>
      </div>
    </div>
  );
}
