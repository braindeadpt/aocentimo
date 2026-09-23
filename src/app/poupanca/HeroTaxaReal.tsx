"use client";

import { Cartao, type EstadoCartao } from "@/components/Cartao";
import { NumHero } from "@/components/NumHero";
import { comUnidade, fmtNum, fmtPct } from "@/lib/format";
import { usePoupanca } from "./PoupancaSim";

/**
 * O nível 1 de /poupanca — «a resposta»: a taxa real do melhor produto,
 * depois de imposto e inflação, com a frase a comparar com o pior e
 * com o dinheiro parado. Lê a MESMA poupança das réguas de «Explora»
 * via <PoupancaProvider>.
 */
export function InstrumentoTaxaReal({
  estado,
  estadoRotulo,
}: {
  estado: EstadoCartao;
  estadoRotulo: string;
}) {
  const { melhor, produtos, anos } = usePoupanca();

  return (
    <Cartao
      icone="poupanca"
      breadcrumb="O BANCO / POUPANÇA · TAXA REAL LÍQUIDA"
      meta={produtos.map(
        (p) => `${p.curto} ${comUnidade(fmtNum(p.taxaReal * 100, 1), "%")}`
      )}
      estado={estado}
      estadoRotulo={estadoRotulo}
      fonte={{
        rotulo: "Fonte",
        itens: [
          {
            nome: "Taxas CA e CTPC — IGCP",
            url: "https://www.igcp.pt",
          },
          {
            nome: "Retenção sobre juros — CIRS art. 71.º-72.º",
            url: "https://info.portaldasfinancas.gov.pt",
          },
        ],
      }}
    >
      <NumHero
        valor={comUnidade(fmtNum(melhor.taxaReal * 100, 1), "%")}
        sufixo="/ano"
        animar={melhor.taxaReal * 100}
        casas={1}
      />
      <p className="footnote mt-2">
        a melhor taxa real dos três produtos, já limpa de imposto e
        inflação — ao ano, durante {comUnidade(fmtNum(anos, 0), "anos")}
      </p>
    </Cartao>
  );
}

/** A frase da resposta — o melhor contra o pior e o colchão. */
export function FraseTaxaReal() {
  const { melhor, pior, realColchao } = usePoupanca();
  return (
    <>
      Depois de impostos e inflação:{" "}
      <strong>{fmtPct(melhor.taxaReal, 1)}</strong> ao ano {melhor.em};{" "}
      <strong>{fmtPct(pior.taxaReal, 1)}</strong> {pior.em} — parado, perde{" "}
      {fmtPct(Math.abs(realColchao), 1)}.
    </>
  );
}
