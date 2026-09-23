"use client";

import { useMemo, useState } from "react";
import { simularIrsJovem, REGRAS_IRS_JOVEM } from "@/lib/engines/irs-jovem";
import { retencaoNaFonte } from "@/lib/engines/retencao";
import { BarraTracos } from "@/components/BarraTracos";
import { Regua } from "@/components/Regua";
import { fmtEUR, fmtEUR0, fmtNum, fmtPct } from "@/lib/format";

/**
 * IRS Jovem (3A-02): os dez anos do regime como barra de traços —
 * 1 traço = 1 ano de gozo; os vividos a neutro, o ano escolhido a
 * marca, os que faltam a vago — e a % de isenção de cada um na
 * legenda. O salário é régua (a mesma grelha canónica de /salario) e
 * o ano de gozo um contador físico — o <select> saiu.
 */

function Contador({
  id,
  rotulo,
  valor,
  onChange,
  min,
  max,
  formato,
}: {
  id: string;
  rotulo: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  formato: (v: number) => string;
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
    </div>
  );
}

export function SimuladorIrsJovem({
  ano,
  ias,
  regua,
}: {
  ano: number;
  /** IAS do ano fiscal — o teto da isenção é 55×IAS; chega por props
      do servidor (client components não leem data/) */
  ias: number;
  /** a grelha canónica do salário — os mesmos pontos da régua de
      /salario: a faixa conta sempre a mesma história */
  regua: {
    min: number;
    max: number;
    passo: number;
    pontos: number[];
    inicial: number;
  };
}) {
  const [bruto, setBruto] = useState(regua.inicial);
  const [anoGozo, setAnoGozo] = useState(1);

  const r = useMemo(
    () => simularIrsJovem(bruto * 14, anoGozo, ano),
    [bruto, anoGozo, ano]
  );

  // Na retenção, a taxa efetiva do salário total aplica-se só à parte
  // não isenta
  const ret = retencaoNaFonte(bruto, "naoCasado", 0, ano);
  const retComJovem = ret.retencao * (1 - r.pctIsencao);

  const poupanca10 = REGRAS_IRS_JOVEM.isencaoPorAno.reduce(
    (a, _p, i) => a + simularIrsJovem(bruto * 14, i + 1, ano).poupancaAnual,
    0
  );

  // a barra dos dez anos: vividos a neutro, o ano de gozo a marca,
  // os que faltam a vago — o lugar na sequência lê-se sem legendas
  const grupos = [
    ...(anoGozo > 1
      ? [{ n: anoGozo - 1, tom: "neutro" as const, rotulo: "anos já gozados" }]
      : []),
    { n: 1, tom: "marca" as const, rotulo: `o ${anoGozo}.º ano — em curso` },
    ...(anoGozo < 10
      ? [{ n: 10 - anoGozo, tom: "vago" as const, rotulo: "anos que faltam" }]
      : []),
  ];

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="space-y-5">
        <Regua
          id="bruto-j"
          rotulo="Salário bruto mensal"
          valor={bruto}
          onChange={setBruto}
          min={regua.min}
          max={regua.max}
          passo={regua.passo}
          pontos={regua.pontos}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
        />
        <Contador
          id="ano-j"
          rotulo="Ano de gozo do IRS Jovem"
          valor={anoGozo}
          onChange={setAnoGozo}
          min={1}
          max={REGRAS_IRS_JOVEM.anosMax}
          formato={(v) => `${v}.º ano`}
        />
        <p className="footnote">
          Conta a partir do primeiro ano em que entregas IRS sozinho —
          {REGRAS_IRS_JOVEM.anosMax} anos no máximo, até fazeres{" "}
          {REGRAS_IRS_JOVEM.idadeMax}. A isenção tem teto de{" "}
          {fmtEUR0(REGRAS_IRS_JOVEM.limiteIsencaoIas * ias)}/ano
          (55×IAS) e o rendimento isento ainda conta para fixar o teu
          escalão.
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="space-y-8 self-start md:sticky md:top-6" aria-live="polite">
        <div className="border border-line bg-raised shadow-raised">
          <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
            <span className="kicker">No {anoGozo}.º ano de gozo</span>
            <span className="num text-rotulo text-muted">
              {fmtPct(r.pctIsencao, 0)} isento
            </span>
          </div>
          <dl className="px-5 py-4 text-corpo-sm">
            <div className="flex justify-between border-b border-line/60 py-1.5">
              <dt className="text-ink2">Rendimento isento</dt>
              <dd className="num">{fmtEUR(r.rendimentoIsento)}/ano</dd>
            </div>
            <div className="flex justify-between border-b border-line/60 py-1.5">
              <dt className="text-ink2">IRS sem o regime</dt>
              <dd className="num">{fmtEUR(r.irsSemJovem)}</dd>
            </div>
            <div className="flex justify-between border-b border-line/60 py-1.5">
              <dt className="text-ink2">IRS com IRS Jovem</dt>
              <dd className="num">{fmtEUR(r.irsComJovem)}</dd>
            </div>
            <div className="flex justify-between border-b border-line/60 py-1.5">
              <dt className="text-ink2">Retenção no recibo</dt>
              <dd className="num">
                {fmtEUR(ret.retencao)} →{" "}
                <span className="text-keep">{fmtEUR(retComJovem)}</span>
              </dd>
            </div>
            <div className="mt-1 flex justify-between border-t-2 border-ink py-2.5">
              <dt className="font-medium">Poupança por ano</dt>
              <dd className="num-read font-medium text-keep">
                {fmtEUR(r.poupancaAnual)}
              </dd>
            </div>
          </dl>
        </div>

        {/* os dez anos — 1 traço = 1 ano de gozo, com a % de isenção
            de cada patamar na legenda (100 · 75 · 50 · 25) */}
        <div>
          <BarraTracos
            grupos={grupos}
            unidadeTraco="1 ano de IRS Jovem"
            rotulo="Os 10 anos do regime"
            valor={`${anoGozo}.º de 10`}
            nota={`neste ano: ${fmtPct(r.pctIsencao, 0)} isento — poupas ${fmtEUR0(r.poupancaAnual)}`}
            equivalente={`Dez anos de IRS Jovem; estás no ${anoGozo}.º. Isenção por ano: ${REGRAS_IRS_JOVEM.isencaoPorAno.map((p, i) => `${i + 1}.º ${fmtPct(p, 0)}`).join(", ")}.`}
          />
          <p className="footnote mt-2">
            Isenção por ano: 1.º a{" "}
            {fmtPct(REGRAS_IRS_JOVEM.isencaoPorAno[0], 0)} · 2.º–4.º a{" "}
            {fmtPct(REGRAS_IRS_JOVEM.isencaoPorAno[1], 0)} · 5.º–7.º a{" "}
            {fmtPct(REGRAS_IRS_JOVEM.isencaoPorAno[4], 0)} · 8.º–10.º a{" "}
            {fmtPct(REGRAS_IRS_JOVEM.isencaoPorAno[7], 0)}.
          </p>
          <p className="mt-3 flex items-baseline justify-between border-t-2 border-ink pt-2 text-corpo-sm">
            <span className="font-medium text-ink">Total em 10 anos</span>
            <span className="num font-medium text-keep">
              {fmtEUR0(poupanca10)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
