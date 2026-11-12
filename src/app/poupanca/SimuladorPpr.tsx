"use client";

import { useMemo, useState } from "react";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { fmtEUR, fmtEUR0, fmtNum, fmtPct } from "@/lib/format";

export interface RegrasPprProps {
  deducao: {
    pct: number;
    limitesPorIdade: { ate: number | null; limite: number }[];
  };
  saida: {
    taxaEfetivaDentro: number;
  };
}

function limitePprPuro(idade: number, regrasPpr: RegrasPprProps): number {
  const l = regrasPpr.deducao.limitesPorIdade.find(
    (x) => x.ate === null || idade <= x.ate
  );
  return l?.limite ?? 0;
}

function parseClamp(s: string, min: number, max: number): number {
  const limpo = s.trim().replace(/\s+/g, "").replace(",", ".");
  if (limpo === "") return min;
  const n = Number(limpo);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function CampoDecimal({
  id,
  label,
  valor,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  valor: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  const [texto, setTexto] = useState(() => String(valor).replace(".", ","));

  return (
    <div>
      <label className="kicker mb-1.5 block" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={(e) => {
          const cru = e.target.value;
          if (cru !== "" && !/^\d*(?:[.,]\d*)?$/.test(cru.trim().replace(/\s+/g, ""))) {
            return;
          }
          setTexto(cru);
          onChange(parseClamp(cru, min, max));
        }}
        onBlur={() => {
          const final = parseClamp(texto, min, max);
          onChange(final);
          setTexto(String(final).replace(".", ","));
        }}
        className="field min-h-[44px]"
      />
    </div>
  );
}

export function SimuladorPpr({
  taxaLiberatoria,
  regrasPpr,
}: {
  taxaLiberatoria: number;
  regrasPpr: RegrasPprProps;
}) {
  const [entregas, setEntregas] = useState(2000);
  const [idade, setIdade] = useState(30);
  const [anos, setAnos] = useState(10);
  const [taxa, setTaxa] = useState(3.0);

  const anosClamp = Math.min(50, Math.max(1, Math.round(anos)));
  const idadeClamp = Math.min(100, Math.max(18, Math.round(idade)));

  const r = useMemo(() => {
    const ent = Math.min(100_000, Math.max(0, entregas));
    const tx = Math.min(25, Math.max(0, taxa));
    const limite = limitePprPuro(idadeClamp, regrasPpr);
    const deducaoAnual = Math.min(ent * regrasPpr.deducao.pct, limite);
    // juros compostos sobre entregas anuais no fim de cada ano (teto defensivo ≤ 50 anos)
    let capital = 0;
    for (let i = 0; i < anosClamp; i++) capital = (capital + ent) * (1 + tx / 100);
    const rendimentos = capital - ent * anosClamp;
    const impostoSaida = rendimentos * regrasPpr.saida.taxaEfetivaDentro;
    const impostoNormal = rendimentos * taxaLiberatoria;
    return {
      deducaoAnual,
      deducaoTotal: deducaoAnual * anosClamp,
      capital,
      rendimentos,
      impostoSaida,
      impostoNormal,
      liquido: capital - impostoSaida,
      poupancaTotal: deducaoAnual * anosClamp + (impostoNormal - impostoSaida),
    };
  }, [entregas, idadeClamp, anosClamp, taxa, taxaLiberatoria, regrasPpr]);

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoDecimal
            id="ppr-ent"
            label="Entregas por ano (€)"
            valor={entregas}
            onChange={setEntregas}
            min={0}
            max={100_000}
          />
          <CampoDecimal
            id="ppr-taxa"
            label="Rentabilidade (%/ano)"
            valor={taxa}
            onChange={setTaxa}
            min={0}
            max={25}
          />
        </div>
        <Regua
          id="ppr-idade"
          rotulo="A tua idade"
          valor={idadeClamp}
          onChange={setIdade}
          min={18}
          max={66}
          passo={1}
          unidade="anos"
          formato={(v) => fmtNum(v, 0)}
        />
        <Regua
          id="ppr-anos"
          rotulo="Anos até resgatar"
          valor={anosClamp}
          onChange={setAnos}
          min={1}
          max={40}
          passo={1}
          unidade="anos"
          formato={(v) => fmtNum(v, 0)}
        />
        <p className="footnote">
          Dedução à coleta de 20 % das entregas, até {fmtEUR0(limitePprPuro(idadeClamp, regrasPpr))}
          /ano na tua idade — entra no limite global do art. 78.º. Na saída
          dentro das condições legais, os rendimentos pagam 8 % efetivos.
          Resgatar fora das condições devolve o benefício +10 %/ano — o PPR
          é dinheiro preso.
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6" aria-live="polite">
        <div className="border-b border-line px-5 py-3">
          <span className="kicker">O benefício, dos dois lados</span>
        </div>
        <dl className="px-5 py-4 text-corpo-sm">
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Deduzes ao IRS, por ano</dt>
            <dd className="num text-keep">{fmtEUR(r.deducaoAnual)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">… em {anosClamp} anos de entregas</dt>
            <dd className="num text-keep">{fmtEUR0(r.deducaoTotal)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Capital estimado no resgate</dt>
            <dd className="num">{fmtEUR0(r.capital)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">
              Imposto sobre {fmtEUR0(r.rendimentos)} de rendimentos
              <span className="block text-rotulo text-muted">8 % efetivos vs {fmtPct(taxaLiberatoria, 0)} normais</span>
            </dt>
            <dd className="num">{fmtEUR(r.impostoSaida)} <span className="text-muted">({fmtEUR(r.impostoNormal)})</span></dd>
          </div>
        </dl>
        <div className="border-t border-line px-5 py-4">
          <p className="kicker">Vantagem fiscal total</p>
          <NumHero valor={fmtEUR0(r.poupancaTotal)} animar={r.poupancaTotal} casas={0} className="mt-1 text-keep" />
          <p className="footnote mt-2">
            Deduções à coleta ao longo de {anosClamp} anos + a diferença de imposto
            na saída. O PPR é dinheiro preso — a vantagem só vale dentro das
            condições legais.
          </p>
        </div>
      </div>
    </div>
  );
}

