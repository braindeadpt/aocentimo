"use client";

import { useMemo, useState } from "react";
import { simularMaisValia, TipoAtivo } from "@/lib/engines/mais-valias";
import { simularSalario } from "@/lib/engines/irs";
import { fmtEUR, fmtPct } from "@/lib/format";

function parseClamp(
  s: string,
  min: number,
  max: number,
  inteiro = false
): number {
  const limpo = s.trim().replace(/\s+/g, "").replace(",", ".");
  if (limpo === "") return min;
  const n = Number(limpo);
  if (!Number.isFinite(n)) return min;
  const val = inteiro ? Math.round(n) : n;
  return Math.min(max, Math.max(min, val));
}

function CampoNumero({
  id,
  label,
  valor,
  onChange,
  min = 0,
  max = 10_000_000,
  inteiro = false,
}: {
  id: string;
  label: string;
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  inteiro?: boolean;
}) {
  const [texto, setTexto] = useState(() => String(valor).replace(".", ","));
  const padrao = inteiro ? /^\d*$/ : /^\d*(?:[.,]\d*)?$/;

  return (
    <div>
      <label className="kicker block mb-1.5" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={(e) => {
          const cru = e.target.value;
          if (cru !== "" && !padrao.test(cru.trim().replace(/\s+/g, ""))) {
            return;
          }
          setTexto(cru);
          onChange(parseClamp(cru, min, max, inteiro));
        }}
        onBlur={() => {
          const final = parseClamp(texto, min, max, inteiro);
          onChange(final);
          setTexto(String(final).replace(".", ","));
        }}
        className="field"
      />
    </div>
  );
}

export function SimuladorMaisValias() {
  const [tipo, setTipo] = useState<TipoAtivo>("mobiliarios");
  const [compra, setCompra] = useState(10000);
  const [venda, setVenda] = useState(15000);
  const [despesas, setDespesas] = useState(0);
  const [anos, setAnos] = useState(3);
  const [dias, setDias] = useState(400);
  const [reinvestida, setReinvestida] = useState(0);
  const [salario, setSalario] = useState(1500);

  const coletavel = useMemo(
    () => simularSalario([Math.min(100_000, Math.max(0, salario))], 0).coletavelTributado,
    [salario]
  );

  const r = useMemo(
    () =>
      simularMaisValia(venda, compra, {
        tipo,
        despesas,
        anosDetencao: Math.min(50, Math.max(0, anos)),
        diasDetencao: Math.min(36_500, Math.max(0, dias)),
        pctReinvestida: Math.min(1, Math.max(0, reinvestida / 100)),
        coletavelOutros: coletavel,
      }),
    [venda, compra, tipo, despesas, anos, dias, reinvestida, coletavel]
  );

  const imposto = r.impostoAutonomo !== null && r.melhor === "autonomo"
    ? r.impostoAutonomo
    : r.impostoEnglobado;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="mv-tipo">O que vendeste</label>
          <select id="mv-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoAtivo)}
            className="field">
            <option value="mobiliarios">Ações / ETF / fundos</option>
            <option value="cripto">Cripto</option>
            <option value="imovel">Imóvel</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <CampoNumero id="mv-compra" label="Compraste por" valor={compra} onChange={setCompra} min={0} max={10_000_000} />
          <CampoNumero id="mv-venda" label="Vendeste por" valor={venda} onChange={setVenda} min={0} max={10_000_000} />
          <CampoNumero id="mv-desp" label="Despesas (comissões, obras)" valor={despesas} onChange={setDespesas} min={0} max={10_000_000} />
          {tipo === "cripto" ? (
            <CampoNumero key="mv-dias" id="mv-dias" label="Dias na carteira" valor={dias} onChange={setDias} min={0} max={36_500} inteiro />
          ) : (
            <CampoNumero key="mv-anos" id="mv-anos" label="Anos de detenção" valor={anos} onChange={setAnos} min={0} max={50} inteiro />
          )}
          {tipo === "imovel" && (
            <CampoNumero key="mv-reinv" id="mv-reinv" label="% reinvestida noutra HPP" valor={reinvestida} onChange={setReinvestida} min={0} max={100} />
          )}
          <CampoNumero id="mv-sal" label="O teu bruto mensal (p/ englobar)" valor={salario} onChange={setSalario} min={0} max={100_000} />
        </div>
        <p className="footnote">
          Mobiliários em mercado regulamentado: exclusão de 10 % (&gt;2 anos),
          20 % (≥5) ou 30 % (≥8). Imóveis englobam metade da mais-valia —
          a correção monetária não é aplicada aqui, o imposto real é
          ligeiramente menor.
        </p>
      </div>

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="bg-raised border border-line shadow-raised self-start md:sticky md:top-6" aria-live="polite">
        <div className="border-b border-line px-5 py-3">
          <span className="kicker">O imposto sobre o ganho</span>
        </div>
        <dl className="px-5 py-4 text-corpo-sm">
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Mais-valia</dt>
            <dd className="num">{fmtEUR(r.maisValia)}</dd>
          </div>
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Tributável{r.excluido > 0 && ` (${fmtPct(r.excluido, 0)} excluído)`}</dt>
            <dd className="num">{fmtEUR(r.tributavel)}</dd>
          </div>
          {r.impostoAutonomo !== null && (
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Taxa autónoma (28 %)</dt>
              <dd className="num">{fmtEUR(r.impostoAutonomo)}</dd>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Englobado nos teus escalões</dt>
            <dd className="num">{fmtEUR(r.impostoEnglobado)}</dd>
          </div>
          <div className="mt-1 border-t-2 border-ink py-2.5">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-medium">Pagas</dt>
              <dd className="num-read font-medium text-up">{fmtEUR(imposto)}</dd>
            </div>
            <dd className="mt-1 text-rotulo text-muted">
              {r.melhor === "autonomo"
                ? "a taxa autónoma é a que fica mais barata"
                : r.melhor === "englobado"
                  ? "englobar compensa — a tua taxa marginal é menor que 28 %"
                  : "englobamento obrigatório em imóveis"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
