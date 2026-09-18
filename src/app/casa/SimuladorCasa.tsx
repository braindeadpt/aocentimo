"use client";

import { useMemo, useState } from "react";
import { simularPrestacao } from "@/lib/engines/prestacao";
import { custoCompra } from "@/lib/engines/imt";
import { EuroBar } from "@/components/EuroBar";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";

export function SimuladorCasa({ euriborAtual }: { euriborAtual: number | null }) {
  const [preco, setPreco] = useState(200000);
  const [tipo, setTipo] = useState<"hpp" | "secundaria">("hpp");
  const [jovem, setJovem] = useState(false);
  const [entrada, setEntrada] = useState(20000);
  const [anos, setAnos] = useState(30);
  // valor inicial arredondado a 2 casas — a mesma precisão do resto do site
  const [euribor, setEuribor] = useState(
    euriborAtual !== null ? Math.round(euriborAtual * 100) / 100 : 2.5
  );
  const [spread, setSpread] = useState(1.0);

  const credito = Math.max(0, preco - entrada);

  const compra = useMemo(
    () => custoCompra(preco, { tipo, jovem, montanteCredito: credito }),
    [preco, tipo, jovem, credito]
  );
  const prest = useMemo(
    () => simularPrestacao(credito, anos * 12, euribor / 100, spread / 100),
    [credito, anos, euribor, spread]
  );

  const dinheiroEntrada = entrada + compra.totalCustos;

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="space-y-5">
        <div>
          <label className="kicker block mb-1.5" htmlFor="preco">Preço da casa</label>
          <input id="preco" type="number" min={0} step={5000} value={preco}
            onChange={(e) => setPreco(Number(e.target.value) || 0)} className="field" />
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="tipo">Finalidade</label>
          <select id="tipo" value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)} className="field w-full">
            <option value="hpp">Habitação própria e permanente</option>
            <option value="secundaria">Secundária / investimento</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-ink2">
            <input type="checkbox" checked={jovem} disabled={tipo !== "hpp"}
              onChange={(e) => setJovem(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-accent)]" />
            IMT Jovem (≤35 anos, 1.ª casa)
          </label>
        </div>
        <div>
          <label className="kicker block mb-1.5" htmlFor="entrada">Entrada</label>
          <input id="entrada" type="number" min={0} step={1000} value={entrada}
            onChange={(e) => setEntrada(Number(e.target.value) || 0)} className="field" />
          <p className="footnote mt-1">
            {fmtPct(preco > 0 ? entrada / preco : 0, 0)} do preço · crédito de{" "}
            {fmtEUR0(credito)}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="kicker block mb-1.5" htmlFor="prazo">Prazo (anos)</label>
            <input id="prazo" type="number" min={1} max={50} value={anos}
              onChange={(e) => setAnos(Number(e.target.value) || 1)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="eur">Euribor (%)</label>
            <input id="eur" type="number" step={0.1} value={euribor}
              onChange={(e) => setEuribor(Number(e.target.value) || 0)} className="field" />
          </div>
          <div>
            <label className="kicker block mb-1.5" htmlFor="spr">Spread (%)</label>
            <input id="spr" type="number" step={0.1} min={0} value={spread}
              onChange={(e) => setSpread(Number(e.target.value) || 0)} className="field" />
          </div>
        </div>
        <p className="footnote">
          Euribor 3M real em {euriborAtual !== null ? fmtPct(euriborAtual / 100, 2) : "—"} (BPstat,
          média mensal mais recente) — o valor vem preenchido, muda-o à
          vontade. IMT incide sobre o maior de preço ou VPT.
        </p>
      </div>

      <div className="space-y-8" aria-live="polite">
        <div className="bg-raised border border-line shadow-raised">
          <div className="border-b border-line px-5 py-3 flex justify-between items-baseline">
            <span className="kicker">No dia da escritura</span>
            <span className="num text-xs text-muted">impostos + registos</span>
          </div>
          <dl className="px-5 py-4 text-sm">
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">IMT {jovem && tipo === "hpp" && "(Jovem)"}</dt>
              <dd className="num">{fmtEUR(compra.imt)}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Imposto de Selo — compra (0,8 %)</dt>
              <dd className="num">{fmtEUR(compra.isAquisicao)}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Imposto de Selo — crédito (0,6 %)</dt>
              <dd className="num">{fmtEUR(compra.isCredito)}</dd>
            </div>
            <div className="flex justify-between py-1.5 border-b border-line/60">
              <dt className="text-ink2">Escritura e registos (Casa Pronta)</dt>
              <dd className="num">{fmtEUR(compra.registos)}</dd>
            </div>
            <div className="flex justify-between py-2.5 mt-1 border-t-2 border-ink">
              <dt className="font-medium">Precisas à entrada</dt>
              <dd className="num font-medium text-lg">
                {fmtEUR0(dinheiroEntrada)}
                <span className="block text-xs font-normal text-muted">
                  {fmtEUR0(entrada)} de entrada + {fmtEUR0(compra.totalCustos)} de custos
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-raised border border-line shadow-raised">
          <div className="border-b border-line px-5 py-3">
            <span className="kicker">Todos os meses</span>
          </div>
          <div className="px-5 py-5">
            <p className="num text-4xl">
              {fmtEUR(prest.prestacao)}
              <span className="text-base text-muted">/mês</span>
            </p>
            <dl className="mt-4 text-sm space-y-2">
              <div className="flex justify-between border-b border-line/60 pb-1.5">
                <dt className="text-ink2">TAN (Euribor + spread)</dt>
                <dd className="num">{fmtPct(prest.tan)}</dd>
              </div>
              <div className="flex justify-between border-b border-line/60 pb-1.5">
                <dt className="text-ink2">Juros totais em {anos} anos</dt>
                <dd className="num">{fmtEUR0(prest.jurosTotais)}</dd>
              </div>
              <div className="flex justify-between pb-1.5">
                <dt className="text-ink2">A casa custa, no fim</dt>
                <dd className="num font-medium">
                  {fmtEUR0(compra.precoFinal + prest.jurosTotais)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div>
          <p className="kicker-sm mb-3">
            O dinheiro da escritura, partido
          </p>
          <EuroBar
            total={preco + compra.totalCustos}
            segmentos={[
              { label: "A casa (preço)", valor: preco, cor: "var(--color-keep)" },
              { label: "IMT + IS", valor: compra.imt + compra.isAquisicao + compra.isCredito, cor: "var(--color-accent)" },
              { label: "Registos", valor: compra.registos, cor: "var(--color-ink2)" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
