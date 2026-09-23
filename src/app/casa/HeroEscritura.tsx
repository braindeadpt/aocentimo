"use client";

import { Cartao, type EstadoCartao } from "@/components/Cartao";
import { NumHero } from "@/components/NumHero";
import { fmtEUR0 } from "@/lib/format";
import { useCasa } from "./CasaSim";

/**
 * O nível 1 de /casa — «a resposta»: o dinheiro que tens de ter no dia
 * da escritura (entrada + IMT + Imposto de Selo + registos), com a
 * frase a dizê-lo por extenso. Lê a MESMA compra das réguas de
 * «Explora» via <CasaProvider>.
 */
export function InstrumentoEscritura({
  anoImt,
  estado,
  estadoRotulo,
}: {
  anoImt: number;
  estado: EstadoCartao;
  estadoRotulo: string;
}) {
  const { preco, compra, dinheiroEntrada, jovem, tipo } = useCasa();
  return (
    <Cartao
      icone="casa"
      breadcrumb={`O BANCO / COMPRAR CASA · IMT ${anoImt} + REGISTOS`}
      meta={[
        `IMT ${fmtEUR0(compra.imt)}`,
        `selo ${fmtEUR0(compra.isAquisicao + compra.isCredito)}`,
      ]}
      estado={estado}
      estadoRotulo={estadoRotulo}
      fonte={{
        rotulo: "Fonte",
        itens: [
          {
            nome: "Tabelas IMT — Ofício Circulado AT",
            url: "https://info.portaldasfinancas.gov.pt",
          },
          {
            nome: "Registos — Casa Pronta (valor típico)",
            url: "https://eportugal.gov.pt/servicos/comprar-casa-atraves-do-balcao-casa-pronta",
          },
        ],
      }}
    >
      <NumHero valor={fmtEUR0(dinheiroEntrada)} animar={dinheiroEntrada} casas={0} />
      <p className="footnote mt-2">
        saem-te do bolso no dia da escritura — a casa é de{" "}
        {fmtEUR0(preco)} e o banco empresta o resto
        {jovem && tipo === "hpp" ? " · com IMT Jovem" : ""}
      </p>
    </Cartao>
  );
}

/** A frase da resposta — o número do dia da escritura, por extenso. */
export function FraseEscritura() {
  const { preco, entradaEf, compra, dinheiroEntrada } = useCasa();
  return (
    <>
      Uma casa de <strong>{fmtEUR0(preco)}</strong> pede{" "}
      <strong>{fmtEUR0(dinheiroEntrada)}</strong> na escritura:{" "}
      {fmtEUR0(entradaEf)} de entrada, {fmtEUR0(compra.totalCustos)} de
      impostos e registos.
    </>
  );
}
