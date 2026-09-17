"use client";

import { useMemo, useState } from "react";
import { simularMaisValia, TipoAtivo } from "@/lib/engines/mais-valias";
import { simularSalario } from "@/lib/engines/irs";
import { fmtEUR, fmtPct } from "@/lib/format";

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
    () => simularSalario([salario], 0).coletavelTributado,
    [salario]
  );

  const r = useMemo(
    () =>
      simularMaisValia(venda, compra, {
        tipo,
        despesas,
        anosDetencao: anos,
        diasDetencao: dias,
        pctReinvestida: reinvestida / 100,
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
          <div>
            <label className="kicker block mb-1.5" htmlFor="mv-compra">Compraste por</label>
            <input id="mv-compra" type="number" min={0} step={500} value={compra}
              onChange={(e) => setCompra(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="mv-venda">Vendeste por</label>
            <input id="mv-venda" type="number" min={0} step={500} value={venda}
              onChange={(e) => setVenda(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="mv-desp">Despesas (comissões, obras)</label>
            <input id="mv-desp" type="number" min={0} step={50} value={despesas}
              onChange={(e) => setDespesas(Number(e.target.value) || 0)} className="field" />
          </div>
          {tipo === "cripto" ? (
            <div>
              <label className="kicker block mb-1.5" htmlFor="mv-dias">Dias na carteira</label>
              <input id="mv-dias" type="number" min={0} value={dias}
                onChange={(e) => setDias(Number(e.target.value) || 0)} className="field" />
            </div>
          ) : (
            <div>
              <label className="kicker block mb-1.5" htmlFor="mv-anos">Anos de detenção</label>
              <input id="mv-anos" type="number" min={0} max={40} value={anos}
                onChange={(e) => setAnos(Number(e.target.value) || 0)} className="field" />
            </div>
          )}
          {tipo === "imovel" && (
            <div>
              <label className="kicker block mb-1.5" htmlFor="mv-reinv">% reinvestida noutra HPP</label>
              <input id="mv-reinv" type="number" min={0} max={100} value={reinvestida}
                onChange={(e) => setReinvestida(Number(e.target.value) || 0)} className="field" />
            </div>
          )}
          <div>
            <label className="kicker block mb-1.5" htmlFor="mv-sal">O teu bruto mensal (p/ englobar)</label>
            <input id="mv-sal" type="number" min={0} step={100} value={salario}
              onChange={(e) => setSalario(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <p className="footnote">
          Mobiliários em mercado regulamentado: exclusão de 10 % (&gt;2 anos),
          20 % (≥5) ou 30 % (≥8). Imóveis englobam metade da mais-valia —
          a correção monetária não é aplicada aqui, o imposto real é
          ligeiramente menor.
        </p>
      </div>

      <div className="bg-surface border border-line self-start" aria-live="polite">
        <div className="border-b border-line px-5 py-3">
          <span className="kicker">O imposto sobre o ganho</span>
        </div>
        <dl className="px-5 py-4 text-sm">
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
              <dt className="text-ink2">Taxa autónoma (28 %)</dt>
              <dd className="num">{fmtEUR(r.impostoAutonomo)}</dd>
            </div>
          )}
          <div className="flex justify-between py-1.5 border-b border-line/60">
            <dt className="text-ink2">Englobado nos teus escalões</dt>
            <dd className="num">{fmtEUR(r.impostoEnglobado)}</dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t-2 border-ink py-2.5">
            <dt className="shrink-0 font-medium">Pagas</dt>
            <dd className="num text-right text-lg font-medium text-up">
              {fmtEUR(imposto)}
              <span className="block text-xs font-normal text-muted">
                {r.melhor === "autonomo"
                  ? "a taxa autónoma é a que fica mais barata"
                  : r.melhor === "englobado"
                    ? "englobar compensa — a tua taxa marginal é menor que 28 %"
                    : "englobamento obrigatório em imóveis"}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
