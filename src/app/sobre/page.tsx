import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre",
  description: "O que é o Cêntimo e porquê existe.",
};

export default function SobrePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-14 pb-10">
      <p className="kicker">Sobre</p>
      <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Porque existe o Cêntimo
      </h1>
      <div className="mt-8 space-y-5 text-ink2 text-[0.95rem] leading-relaxed">
        <p>
          Em Portugal fala-se de dinheiro todos os dias — escalões, Euribor,
          spread, retenção — mas poucos sítios explicam a mecânica por trás das
          palavras. Este projeto nasce para preencher esse espaço: dados
          oficiais, simuladores transparentes e um glossário sem jargão.
        </p>
        <p>
          É um projeto pessoal, sem publicidade e sem rastreamento. O código e
          os dados são abertos: cada número pode ser verificado na fonte, e cada
          fórmula pode ser lida no repositório.
        </p>
        <p>
          O desenho segue uma regra simples: se parecer gerado automaticamente,
          falhou. Um site sobre dinheiro público merece o cuidado de uma
          publicação de referência.
        </p>
      </div>
    </div>
  );
}
