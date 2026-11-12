"use client";

import { Cartao, type EstadoCartao } from "@/components/Cartao";
import { NumHero } from "@/components/NumHero";
import {
  comUnidade,
  fmtEUR,
  fmtEUR0,
  fmtNum,
  fmtPeriodo,
  fmtPct,
} from "@/lib/format";
import { useCredito } from "./CreditoSim";

/**
 * O nível 1 de /credito — «a resposta».
 *
 * Instrumento: a prestação mensal como número herói dentro do cartão
 * Ledger (breadcrumb, meta com a taxa, orbe de frescura da Euribor,
 * fonte BPstat). Frase: «Pedes X, devolves Y — Z× o que pediste.»
 *
 * Os dois leem o MESMO contrato que as réguas de «Explora» via
 * <CreditoProvider> — a resposta respira com os teus números. Sem a
 * Euribor (fonte em falha) mostram a falha, nunca um número inventado.
 */
export function InstrumentoPrestacao({
  euriborAte,
  estado,
  estadoRotulo,
}: {
  /** período do último valor da Euribor (YYYY-MM → fmtPeriodo) */
  euriborAte: string | null;
  estado: EstadoCartao;
  estadoRotulo: string;
}) {
  const { anos, euribor, choque, sim, prazoEuribor, taxasEuribor, urlPartilha } = useCredito();
  const ate = taxasEuribor[prazoEuribor]?.serieAte ?? euriborAte;
  const rotuloPrazo = prazoEuribor.toUpperCase();

  return (
    <Cartao
      icone="credito"
      breadcrumb="O BANCO / CRÉDITO HABITAÇÃO · CÁLCULO PRÓPRIO"
      acoes={[
        {
          copiar: urlPartilha,
          rotulo: "Copiar ligação",
          ariaLabel: "Copiar ligação desta simulação",
        },
      ]}
      meta={[
        sim ? `TAN ${fmtPct(sim.tan)}` : "TAN —",
        ...(euribor !== null
          ? [
              `Euribor ${rotuloPrazo} ${comUnidade(fmtNum(euribor, 2), "%")}${choque ? " + choque" : ""}`,
            ]
          : []),
        ...(ate ? [`série até ${fmtPeriodo(ate)}`] : []),
      ]}
      estado={estado}
      estadoRotulo={estadoRotulo}
      fonte={{
        rotulo: "Fonte",
        itens: [
          {
            nome: `Euribor ${rotuloPrazo} — Banco de Portugal, BPstat`,
            url: "https://bpstat.bportugal.pt",
          },
        ],
      }}
    >
      <NumHero
        valor={sim ? fmtEUR(sim.prestacao) : "—"}
        sufixo={sim ? "/mês" : undefined}
        animar={sim?.prestacao}
      />
      <p className="footnote mt-2">
        {sim
          ? `por mês, durante ${comUnidade(fmtNum(anos, 0), "anos")} — prestação constante (sistema francês)`
          : "sem a Euribor do BPstat não há conta — escreve a taxa do teu contrato em «Explora»"}
      </p>
    </Cartao>
  );
}

/** A frase da resposta — o total contra o que pediste. */
export function FrasePrestacao() {
  const { capital, sim } = useCredito();
  if (!sim || capital <= 0) {
    return (
      <>
        Sem a taxa não há conta — escreve a Euribor do teu contrato nas
        réguas de «Explora».
      </>
    );
  }
  const racio = sim.custoTotal / capital;
  return (
    <>
      Pedes <strong>{fmtEUR0(capital)}</strong>, devolves{" "}
      <strong>{fmtEUR0(sim.custoTotal)}</strong> — {fmtNum(racio, 2)}× o que
      pediste.
    </>
  );
}
