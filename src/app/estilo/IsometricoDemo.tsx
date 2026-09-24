"use client";

/**
 * IsometricoDemo — o exemplo vivo do isométrico em /estilo. O corpo do
 * componente é o Isometrico partilhado; este invólucro dá-lhe a peça
 * de papel (.leitura-amplo → --l-*) e arma a entrada abaixo da dobra —
 * o molde do extinto EuroExplodido (removido na S4 — sem uso).
 *
 * A mensalidade do crédito à habitação decompõe-se nas suas peças —
 * estrutura, sem medida: nenhuma camada codifica quantidade (a API nem
 * aceita números) e o texto de cada chamada diz o papel da peça. A
 * peça-mãe (a mensalidade) não entra na lista — é o todo, não um passo.
 */
import { Isometrico } from "@/components/Isometrico";
import { useArmado } from "@/lib/useArmado";

const CAMADAS = [
  {
    id: "mensalidade",
    forma: "moeda" as const,
    rotulo: "A mensalidade",
    detalhe: "o débito de cada mês",
    tom: "neutro" as const,
  },
  {
    id: "capital",
    forma: "placa" as const,
    rotulo: "Capital",
    texto: "amortiza",
    textoLista: "amortiza a dívida",
    detalhe: "o que se abate ao empréstimo",
    tom: "neutro" as const,
  },
  {
    id: "juro",
    forma: "placa" as const,
    rotulo: "Juro",
    texto: "ao banco",
    textoLista: "ao banco",
    detalhe: "Euribor + spread — o preço do dinheiro",
    tom: "corte" as const,
  },
  {
    id: "seguros",
    forma: "placa" as const,
    rotulo: "Seguros",
    texto: "à seguradora",
    textoLista: "à seguradora",
    detalhe: "vida e multirriscos — obrigatórios",
    tom: "corte" as const,
  },
  {
    id: "conta",
    forma: "base" as const,
    rotulo: "A tua conta",
    textoLista: "sai por mês",
    detalhe: "onde o débito aterra",
    tom: "corte" as const,
  },
];

export function IsometricoDemo() {
  const { ref, arm } = useArmado<HTMLElement>("estilo-isometrico");
  return (
    <article
      ref={ref}
      className={`leitura leitura-amplo iso-card ${arm("iso-on")}`}
    >
      <div className="leitura-corpo">
        <Isometrico
          camadas={CAMADAS}
          numero={{
            kicker: "a mensalidade",
            valor: "P + J + S",
            compacto: true,
            pequeno: "capital + juro + seguros",
          }}
          nome="iso"
        />
      </div>
      <footer className="leitura-foot">
        <span className="leitura-tom">
          estrutura — as camadas não medem o que pagas
        </span>
      </footer>
    </article>
  );
}
