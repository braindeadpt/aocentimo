"use client";

import { Fragment, useMemo, useState } from "react";
import { simularPrestacao } from "@/lib/engines/prestacao";
import { custoCompra } from "@/lib/engines/imt";
import { EuroBar } from "@/components/EuroBar";
import { JuroCapital } from "@/components/JuroCapital";
import { NumHero } from "@/components/NumHero";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import { mascaraFaixaRasgo, sementeDe } from "@/lib/materia";
import { useArmado } from "@/lib/useArmado";

/**
 * Comprar casa — a escritura e os trinta anos.
 *
 * A escritura é papel (matéria M-01): arestas rasgadas, carimbo,
 * linhas que se imprimem em sequência (talao-linha). A acreção — o
 * preço a somar IMT, Selo e registos — vê-se duas vezes: nas linhas
 * que imprimem uma a uma e na barra que empilha uma camada por custo,
 * ao mesmo ritmo (a camada cresce quando a sua linha imprime).
 *
 * A segunda transformação: os N anos de prestações — a faixa anual
 * divide-se em capital (verde-keep: fica teu, é património) e juro
 * (up: sai para o banco). A divisória troca de peso ao longo do tempo
 * — o gráfico revela-se da esquerda para a direita, o tempo a passar.
 * Interrogável por ano (régua + readout).
 */

const COMP = 320;
const SEMENTE = sementeDe(20260101);

/** papel = tinta fixa; custos = família torrada do "sai" */
const TINTA = "rgba(44,36,19,";
const TORRADO = "rgba(157,42,13,";

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

  // re-animações por mudança de valores — spans/grupos efémeros, nunca inputs
  const runEscritura = `${preco}-${tipo}-${jovem}-${credito}`;
  const runTempo = `${credito}-${anos}-${euribor}-${spread}`;

  // gates de dobra (M-09): nascer à vista = nascer impresso; abaixo
  // da dobra, a primeira impressão/revelação acontece ao entrar
  const { ref: talaoRef, arm: talaoArm } = useArmado<HTMLDivElement>(runEscritura);

  // camadas da acreção — a ordem é a da escritura
  const camadas = [
    { nome: "Preço na placa", v: preco, cor: `${TINTA}0.75)`, txt: `${TINTA}0.9)` },
    { nome: "IMT", v: compra.imt, cor: `${TORRADO}0.85)`, txt: `${TORRADO}1)` },
    { nome: "Imposto de Selo — compra (0,8 %)", v: compra.isAquisicao, cor: `${TORRADO}0.62)`, txt: `${TORRADO}0.9)` },
    { nome: "Imposto de Selo — crédito (0,6 %)", v: compra.isCredito, cor: `${TORRADO}0.45)`, txt: `${TORRADO}0.8)` },
    { nome: "Escritura e registos (Casa Pronta)", v: compra.registos, cor: `${TINTA}0.35)`, txt: `${TINTA}0.7)` },
  ];
  const realEscritura = preco + compra.totalCustos;

  const arestaTopo = mascaraFaixaRasgo(COMP, { semente: SEMENTE, ponta: "topo", grosseria: 0.35 });
  const arestaFundo = mascaraFaixaRasgo(COMP, { semente: SEMENTE + 3, ponta: "fundo", grosseria: 0.35 });

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
          <label className="flex items-center gap-2 text-corpo-sm text-ink2">
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

      {/* resultado pegajoso — acompanha o scroll dos inputs */}
      <div className="space-y-8 self-start md:sticky md:top-6" aria-live="polite">
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
                      className={talaoArm("talao-linha") + " talao-sep flex items-baseline justify-between gap-3 py-1.5"}
                      style={{ "--linha": i } as React.CSSProperties}
                    >
                      <dt className="talao-dim flex items-center gap-2">
                        <span className="sw" style={{ background: c.cor }} aria-hidden />
                        {c.nome}
                        {c.nome === "IMT" && jovem && tipo === "hpp" && " (Jovem)"}
                      </dt>
                      <dd className="num">
                        {i > 0 && <span aria-hidden className="talao-dim">+ </span>}
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
                className={talaoArm("talao-linha") + " talao-cut mt-1 flex items-baseline justify-between gap-4 py-2.5"}
                style={{ "--linha": camadas.length } as React.CSSProperties}
                key={`cut-${runEscritura}`}
              >
                <span className="talao-total">Custa mesmo</span>
                <span className="text-display-sm font-bold">{fmtEUR0(realEscritura)}</span>
              </div>
              <p
                className={talaoArm("talao-linha") + " talao-note talao-dim"}
                style={{ "--linha": camadas.length + 1 } as React.CSSProperties}
                key={`note-${runEscritura}`}
              >
                à entrada saem-te {fmtEUR0(dinheiroEntrada)} do bolso —{" "}
                {fmtEUR0(entrada)} de entrada + {fmtEUR0(compra.totalCustos)} de custos
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
            <NumHero valor={fmtEUR(prest.prestacao)} sufixo="/mês" animar={prest.prestacao} />
            <dl className="mt-4 text-corpo-sm space-y-2">
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
                  {fmtEUR0(realEscritura + prest.jurosTotais)}
                </dd>
              </div>
            </dl>

            {/* juro vs capital — a divisória que troca de peso:
                capital (keep) fica teu, juro (up) sai para o banco */}
            <JuroCapital linhas={prest.linhas} runKey={runTempo} />
          </div>
        </div>

        <div>
          <p className="kicker-sm mb-3">
            O dinheiro do dia da escritura, partido
          </p>
          <EuroBar
            total={realEscritura}
            segmentos={[
              { label: "A casa (preço)", valor: preco, cor: "var(--color-ink)" },
              { label: "IMT + IS", valor: compra.imt + compra.isAquisicao + compra.isCredito, cor: "var(--color-accent)" },
              { label: "Registos", valor: compra.registos, cor: "var(--color-ink2)" },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
