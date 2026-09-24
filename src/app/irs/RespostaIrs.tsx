"use client";

import { Cartao } from "@/components/Cartao";
import { NumHero } from "@/components/NumHero";
import { Regua } from "@/components/Regua";
import { fmtEUR, fmtEUR0, fmtNum, fmtPct } from "@/lib/format";
import { useIrs } from "./contexto";

/**
 * Nível 1 de /irs (3A-02): UM instrumento — o cartão com a régua do
 * salário bruto anual na zona de medição, o IRS certo como número
 * herói e os nove recipientes que enchem por ordem (M-16 — a peça
 * existente, agora dentro do Cartao e com régua em vez de input).
 *
 * A resposta à pergunta «subir de escalão faz-me perder dinheiro?»
 * está no desmentido: o valor do mito riscado ao lado da coleta real.
 * No SSR sai o cenário canónico — sem JS a resposta está lá.
 */

const TORRADO = "rgba(157,42,13,";

export function RespostaIrs() {
  const s = useIrs();
  return (
    <Cartao
      icone="irs"
      breadcrumb={`O QUE GANHAS / IRS · ESCALÕES ${s.ano}`}
      controlos={
        <Regua
          id="bruto"
          rotulo={s.regua.rotulo}
          valor={s.bruto}
          onChange={s.setBruto}
          min={s.regua.min}
          max={s.regua.max}
          passo={s.regua.passo}
          unidade="€"
          formato={(v) => fmtNum(v, 0)}
          marcadorAgora={s.regua.marcador ?? undefined}
          descricao={s.regua.descricao}
          limites={s.regua.limites}
        />
      }
      fonte={{
        rotulo: "Fonte",
        itens: [{ nome: "art. 68.º CIRS — Lei 73-A/2025" }],
      }}
    >
      <p className="leitura-insight">O IRS certo, fatia a fatia</p>
      <NumHero valor={fmtEUR0(s.coleta)} animar={s.coleta} casas={0} />
      <p className="leitura-breadcrumb mt-1">
        com {fmtEUR0(s.bruto)} brutos por ano — se o mito fosse
        verdade seriam {fmtEUR0(s.mito)}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        {/* os recipientes — cada escalão só cobre a sua fatia */}
        <div className="space-y-2">
          {s.fatias.map((f, i) => (
            <div key={f.n}>
              <div className="flex items-baseline justify-between gap-3 text-rotulo">
                <span className="text-ink2">
                  {f.n}.º escalão ·{" "}
                  {f.ate === null
                    ? `mais de ${fmtEUR0(f.de)}`
                    : `até ${fmtEUR0(f.ate)}`}
                </span>
                <span className="num">{fmtPct(f.taxa)}</span>
              </div>
              <div
                className={
                  f.ate === null ? "esc-vessel esc-aberto" : "esc-vessel"
                }
                role="img"
                aria-label={`${f.n}.º escalão: ${
                  f.fatia > 0
                    ? `${fmtEUR(f.fatia)} dentro, imposto ${fmtEUR(f.imposto)}`
                    : "vazio"
                }`}
              >
                <div
                  className="esc-fill"
                  style={{
                    width: `${Math.min(100, f.ocupacao * 100)}%`,
                    background: `${TORRADO}${0.22 + i * 0.09})`,
                  }}
                />
              </div>
              <p className="flex justify-between text-rotulo text-muted">
                <span>{f.fatia > 0 ? `${fmtEUR(f.fatia)} dentro` : "vazio"}</span>
                <span className="num">
                  {f.imposto > 0 ? `−${fmtEUR(f.imposto)}` : ""}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* o desmentido, em números */}
        <div className="self-start">
          <div
            className="space-y-1.5 border border-line bg-panel px-5 py-4 text-corpo-sm"
            aria-live="polite"
          >
            <p className="flex justify-between">
              <span className="text-ink2">
                Contam para o IRS, depois das deduções
              </span>
              <span className="num">{fmtEUR0(s.rc)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-ink2">Taxa do último escalão tocado</span>
              <span className="num">{fmtPct(s.marginal.taxa)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-ink2">
                Se o mito fosse verdade — tudo a{" "}
                {fmtPct(s.marginal.taxa, 0)}
              </span>
              <span className="num text-muted line-through decoration-line2">
                {fmtEUR0(s.mito)}
              </span>
            </p>
            <p className="flex justify-between border-t border-line pt-1.5">
              <span className="font-medium text-ink">
                Coleta real, fatia a fatia
              </span>
              <span className="num font-medium">{fmtEUR0(s.coleta)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-ink2">
                Taxa média — o que pagas por euro
              </span>
              <span className="num text-keep">{fmtPct(s.taxaMedia)}</span>
            </p>
          </div>
          <p className="footnote mt-3">
            Enchem por ordem e nunca voltam atrás. Acima de{" "}
            {fmtEUR0(s.solidariedade[0].de)} acresce a taxa de
            solidariedade ({fmtPct(s.solidariedade[0].taxa, 1)};{" "}
            {fmtPct(s.solidariedade[1].taxa, 1)} acima de{" "}
            {fmtEUR0(s.solidariedade[1].de)}) — não desenhada aqui.
          </p>
        </div>
      </div>
    </Cartao>
  );
}

/** a frase da resposta — reage à régua; inline (vive dentro de
    .pg-frase, que é um <p>: só elementos de texto) */
export function FraseIrs() {
  const s = useIrs();
  return (
    <>
      Não — só a parte acima do limite paga a taxa nova: com{" "}
      <strong className="num">{fmtEUR0(s.bruto)}</strong> brutos por
      ano pagas{" "}
      <strong className="num">{fmtEUR0(s.coleta)}</strong> de IRS, não{" "}
      {fmtEUR0(s.mito)}.
    </>
  );
}
