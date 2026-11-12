"use client";

import { Interruptor } from "@/components/Interruptor";
import { JuroCapital } from "@/components/JuroCapital";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { Segmentado } from "@/components/Segmentado";
import { TweenNum } from "@/components/TweenNum";
import {
  FINO,
  comUnidade,
  fmtData,
  fmtEUR,
  fmtEUR0,
  fmtNum,
  fmtPct,
} from "@/lib/format";
import type { FaixaEtariaMutuario, RegimeTaxaCredito } from "@/lib/engines/prestacao";
import {
  useCredito,
  type AnosFixosMista,
  type PrazoEuribor,
} from "./CreditoSim";

const OPCOES_PRAZO_EURIBOR = [
  { id: "3m", rotulo: "3 meses" },
  { id: "6m", rotulo: "6 meses" },
  { id: "12m", rotulo: "12 meses" },
] as const;

/* PROPOSTA (revisão do dono) */
const OPCOES_REGIME_TAXA = [
  { id: "variavel", rotulo: "Taxa variável" },
  { id: "mista", rotulo: "Taxa mista" },
  { id: "fixa", rotulo: "Taxa fixa" },
] as const;

/* PROPOSTA (revisão do dono) */
const OPCOES_ANOS_FIXOS = [
  { id: "2", rotulo: "2 anos" },
  { id: "5", rotulo: "5 anos" },
  { id: "10", rotulo: "10 anos" },
] as const;

/* PROPOSTA (revisão do dono) */
const OPCOES_FAIXA_ETARIA = [
  { id: "ate30", rotulo: `≤${FINO}30 anos` },
  { id: "31a35", rotulo: "31–35 anos" },
  { id: "mais35", rotulo: `>${FINO}35 anos` },
] as const;

/**
 * Crédito — o nível 2 de /credito: as réguas do contrato e o mapa.
 *
 * O estado vive no <CreditoProvider> — é o mesmo contrato que a
 * resposta do nível 1 lê (a prestação-herói e a frase do total mudam
 * com estas réguas) e que a tabela do nível 3 confirma.
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
    regimeTaxa,
    anosFixos,
    tanFixa,
    rendimentoLiquido,
    faixaEtaria,
    macroprudencial,
    choque,
    sim: r,
    base,
    prazoEuribor,
    taxasEuribor,
    setCapital,
    setAnos,
    setEuribor,
    setSpread,
    setRegimeTaxa,
    setAnosFixos,
    setTanFixa,
    setRendimentoLiquido,
    setFaixaEtaria,
    setChoque,
    setPrazoEuribor,
  } = useCredito();

  const runMapa = `${capital}-${anos}-${regimeTaxa}-${anosFixos}-${tanFixa}-${r?.tan ?? "sem-taxa"}-${spread}-${choque}`;

  const infoPrazo = taxasEuribor[prazoEuribor];
  const taxaAtual =
    infoPrazo?.valor ?? (prazoEuribor === "12m" ? euribor12m : euriborAtual);
  const dataAtual = infoPrazo?.serieAte ?? euriborAte;
  const medianaAtual = infoPrazo?.mediana ?? mediana12m;

  // presets da taxa — âncora é o valor oficial do prazo selecionado:
  // a mediana de 10 anos do painel e ±0,5 p.p. em redor do «agora»
  const presetsTaxa = [
    ...(medianaAtual !== null
      ? [{ rotulo: rotulos.mediana10, valor: medianaAtual }]
      : []),
    ...(taxaAtual !== null
      ? [
          { rotulo: rotulos.menos, valor: taxaAtual - 0.5 },
          { rotulo: rotulos.mais, valor: taxaAtual + 0.5 },
        ]
      : []),
  ];

  const anosFixosEfetivos = r ? Math.round(r.mesesFixos / 12) : anosFixos;
  const anosVariaveisEfetivos = r ? Math.round(r.mesesVariaveis / 12) : Math.max(0, anos - anosFixos);

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
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

        {/* PROPOSTA (revisão do dono) — Selector de modalidade de taxa */}
        <div>
          <label className="kicker block mb-1.5">
            Modalidade de taxa de juro
          </label>
          <Segmentado
            rotulo="Modalidade de taxa de juro"
            valor={regimeTaxa}
            onChange={(id) => setRegimeTaxa(id as RegimeTaxaCredito)}
            opcoes={OPCOES_REGIME_TAXA}
          />
        </div>

        {/* PROPOSTA (revisão do dono) — Controlos de taxa mista ou fixa */}
        {regimeTaxa === "mista" && (
          <div>
            <label className="kicker block mb-1.5">
              Período inicial de taxa fixa
            </label>
            <Segmentado
              rotulo="Período inicial de taxa fixa"
              valor={String(anosFixos)}
              onChange={(id) => setAnosFixos(Number(id) as AnosFixosMista)}
              opcoes={OPCOES_ANOS_FIXOS}
            />
          </div>
        )}

        {(regimeTaxa === "mista" || regimeTaxa === "fixa") && (
          <Regua
            id="tan-fixa"
            rotulo={
              regimeTaxa === "mista"
                ? `TAN fixa nos primeiros ${comUnidade(fmtNum(anosFixosEfetivos, 0), "anos")}`
                : "TAN fixa durante todo o contrato"
            }
            valor={tanFixa}
            onChange={setTanFixa}
            min={0.5}
            max={7}
            passo={0.05}
            unidade="%"
            formato={(v) => fmtNum(v, 2)}
          />
        )}

        {regimeTaxa !== "fixa" && (
          <>
            {/* Selector de prazo da Euribor (3M · 6M · 12M) */}
            <div>
              <label className="kicker block mb-1.5">Prazo da Euribor</label>
              <Segmentado
                rotulo="Prazo da Euribor"
                valor={prazoEuribor}
                onChange={(id) => setPrazoEuribor(id as PrazoEuribor)}
                opcoes={OPCOES_PRAZO_EURIBOR}
              />
            </div>

            {/* regra nº1: se o BPstat falhou o campo da taxa fica livre —
                o input simples de sempre, nunca um número inventado */}
            {euribor === null ? (
              <div>
                <label className="kicker block mb-1.5" htmlFor="eur">
                  Euribor {prazoEuribor.toUpperCase()} (%)
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
                rotulo={
                  regimeTaxa === "mista"
                    ? `Euribor ${prazoEuribor.toUpperCase()} após período fixo (%)`
                    : `Euribor ${prazoEuribor.toUpperCase()} (%)`
                }
                valor={euribor}
                onChange={setEuribor}
                min={-0.5}
                max={7}
                passo={0.01}
                unidade="%"
                formato={(v) => fmtNum(v, 2)}
                marcadorAgora={
                  taxaAtual !== null
                    ? {
                        valor: taxaAtual,
                        rotulo: `agora ${prazoEuribor.toUpperCase()}`,
                      }
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
          </>
        )}

        {/* PROPOSTA (revisão do dono) — Taxa de Esforço e Limites Macroprudenciais do BdP */}
        <div className="border-t border-line pt-5 space-y-4">
          <div>
            <label className="kicker block mb-1.5">
              Idade do titular (limite de prazo BdP)
            </label>
            <Segmentado
              rotulo="Idade do titular (limite de prazo BdP)"
              valor={faixaEtaria}
              onChange={(id) => setFaixaEtaria(id as FaixaEtariaMutuario)}
              opcoes={OPCOES_FAIXA_ETARIA}
            />
          </div>
          <Regua
            id="rend-liq"
            rotulo="Rendimento líquido mensal do agregado (taxa de esforço)"
            valor={rendimentoLiquido}
            onChange={setRendimentoLiquido}
            min={800}
            max={8000}
            passo={100}
            unidade="€/mês"
            formato={(v) => fmtNum(v, 0)}
          />
        </div>

        <p className="footnote">
          {regimeTaxa === "variavel" && (
            <>
              TAN = Euribor + spread = {r ? fmtPct(r.tan) : "—"}. A TAEG junta
              seguros e comissões — é o número a comparar entre bancos, não o
              spread sozinho.
            </>
          )}
          {regimeTaxa === "mista" && (
            <>
              {/* PROPOSTA (revisão do dono) */}
              Taxa mista: TAN fixa de {r ? fmtPct(r.tanFixa) : "—"} nos primeiros{" "}
              {comUnidade(fmtNum(anosFixosEfetivos, 0), "anos")}, seguida de
              Euribor + spread ({r ? fmtPct(r.tanVariavel) : "—"}) nos restantes{" "}
              {comUnidade(fmtNum(anosVariaveisEfetivos, 0), "anos")}.
            </>
          )}
          {regimeTaxa === "fixa" && (
            <>
              {/* PROPOSTA (revisão do dono) */}
              Taxa fixa: TAN constante de {r ? fmtPct(r.tanFixa) : "—"} durante
              todos os {comUnidade(fmtNum(anos, 0), "anos")} do contrato — a
              prestação não oscila com a Euribor.
            </>
          )}
        </p>
        {regimeTaxa !== "fixa" && (
          <p className="footnote mt-1">
            {taxaAtual !== null ? (
              <>
                Euribor {prazoEuribor.toUpperCase()} real em{" "}
                {fmtPct(taxaAtual / 100, 2)} (BPstat, média de{" "}
                {dataAtual ? fmtData(dataAtual) : "série mais recente"}) — o
                valor vem preenchido, muda-o à vontade.
              </>
            ) : (
              <>
                Euribor indisponível — o BPstat não respondeu; escreve a taxa do
                teu contrato.
              </>
            )}
          </p>
        )}
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div
        className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6"
        aria-live="polite"
      >
        <div className="border-b border-line px-5 py-3 flex items-baseline justify-between gap-3">
          <span className="kicker">
            {regimeTaxa === "mista" && r && r.mesesVariaveis > 0
              ? `A tua prestação (1.ºs ${comUnidade(fmtNum(anosFixosEfetivos, 0), "anos")})`
              : "A tua prestação"}
          </span>
          {choque && regimeTaxa !== "fixa" && (
            <span className="kicker-sm text-up">choque +1{FINO}p.p.</span>
          )}
        </div>
        <div className="px-5 py-5">
          <NumHero
            valor={r ? fmtEUR(r.prestacao) : "—"}
            sufixo={r ? "/mês" : undefined}
            animar={r?.prestacao}
          />

          {/* PROPOSTA (revisão do dono) — Desdobramento da 2.ª fase na taxa mista */}
          {regimeTaxa === "mista" && r && r.mesesVariaveis > 0 && (
            <div className="mt-4 border border-line bg-panel p-3.5 text-corpo-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink2">
                  Anos 1 a {anosFixosEfetivos} (fixa {fmtPct(r.tanFixa)})
                </span>
                <span className="num font-medium">
                  {fmtEUR(r.prestacaoFixa)}/mês
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink2">
                  Anos {anosFixosEfetivos + 1} a {anos} (Euribor + spread{" "}
                  {fmtPct(r.tanVariavel)})
                </span>
                <span className="num font-semibold text-up">
                  {fmtEUR(r.prestacaoVariavel)}/mês
                </span>
              </div>
              <div className="flex justify-between border-t border-line/60 pt-1 text-rotulo text-muted">
                <span>Capital em dívida ao fim do período fixo</span>
                <span className="num">{fmtEUR0(r.capitalAposFixo)}</span>
              </div>
            </div>
          )}

          <dl className="mt-5 text-corpo-sm space-y-2">
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">
                Juros totais em {comUnidade(fmtNum(anos, 0), "anos")}
              </dt>
              <dd className="num">
                {r ? (
                  <TweenNum
                    valor={r.jurosTotais}
                    casas={0}
                    texto={fmtEUR0(r.jurosTotais)}
                    sufixo="€"
                  />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">Custo total (aprox. MTIC)</dt>
              <dd className="num font-medium">
                {r ? (
                  <TweenNum
                    valor={r.custoTotal}
                    casas={0}
                    texto={fmtEUR0(r.custoTotal)}
                    sufixo="€"
                  />
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex justify-between border-b border-line/60 pb-1.5">
              <dt className="text-ink2">O choque custa</dt>
              <dd className="num text-up">
                {choque && r && base && regimeTaxa !== "fixa"
                  ? `+${fmtEUR((regimeTaxa === "mista" ? r.prestacaoVariavel - base.prestacaoVariavel : r.prestacao - base.prestacao))}/mês · +${fmtEUR0(r.jurosTotais - base.jurosTotais)} juros`
                  : "—"}
              </dd>
            </div>

            {/* PROPOSTA (revisão do dono) — Leitura de Taxa de Esforço (DSTI) e Maturidade BdP */}
            {macroprudencial && (
              <>
                <div className="flex justify-between border-b border-line/60 pb-1.5">
                  <dt className="text-ink2">
                    Taxa de esforço (DSTI sobre {fmtEUR0(rendimentoLiquido)})
                  </dt>
                  <dd
                    className={`num font-medium ${macroprudencial.excedeDstiAtual ? "text-up" : "text-keep"}`}
                  >
                    {fmtPct(macroprudencial.dstiAtual, 1)}
                  </dd>
                </div>
                {macroprudencial.choqueAplicado > 0 && (
                  <div className="flex justify-between pb-1.5">
                    <dt className="text-ink2">
                      Teste de esforço BdP (+
                      {fmtNum(macroprudencial.choqueAplicado * 100, 1)}
                      {FINO}p.p.)
                    </dt>
                    <dd
                      className={`num font-medium ${macroprudencial.excedeDstiChoque ? "text-up" : "text-ink"}`}
                    >
                      {fmtPct(macroprudencial.dstiChoqueBdP, 1)} (máx.{" "}
                      {fmtPct(macroprudencial.limiteDsti, 0)})
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>

          {/* PROPOSTA (revisão do dono) — Avisos pedagógicos da Recomendação Macroprudencial do BdP */}
          {macroprudencial &&
            (macroprudencial.excedeMaturidade ||
              macroprudencial.excedeDstiAtual ||
              macroprudencial.excedeDstiChoque) && (
              <div
                role="status"
                className="mt-4 border border-up/50 bg-panel p-3.5 text-corpo-sm text-ink2 space-y-1.5"
              >
                <p className="font-semibold text-up">
                  Acima dos limites recomendados pelo Banco de Portugal
                </p>
                {macroprudencial.excedeMaturidade && (
                  <p>
                    Para a faixa etária selecionada, o Banco de Portugal
                    recomenda um prazo máximo de{" "}
                    <strong>
                      {comUnidade(
                        fmtNum(macroprudencial.prazoMaximoRecomendado, 0),
                        "anos"
                      )}
                    </strong>{" "}
                    (estás a simular {comUnidade(fmtNum(anos, 0), "anos")}).
                  </p>
                )}
                {(macroprudencial.excedeDstiAtual ||
                  macroprudencial.excedeDstiChoque) && (
                  <p>
                    A taxa de esforço em teste de stress (
                    {fmtPct(macroprudencial.dstiChoqueBdP, 1)}) ultrapassa o
                    tecto geral de{" "}
                    <strong>{fmtPct(macroprudencial.limiteDsti, 0)}</strong> do
                    rendimento líquido mensal recomendado pelo Banco de Portugal
                    (Instrução n.º 16/2023).
                  </p>
                )}
              </div>
            )}

          {/* a divisão escondida — capital fica teu, juro vai para o banco */}
          {r && <JuroCapital linhas={r.linhas} runKey={runMapa} />}
        </div>
        <p className="footnote px-5 pb-4">
          Sistema francês (prestação constante): no início quase tudo é juro, no
          fim quase tudo é capital. Por isso amortizar cedo poupa mais.
        </p>
      </div>
    </div>
  );
}
