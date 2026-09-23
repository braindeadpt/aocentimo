import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";

export const metadata: Metadata = {
  title: "Sobre",
  description: "O que é o AO CÊNTIMO e porquê existe.",
  alternates: { canonical: "/sobre", types: ALT_FEED },
};

export default function SobrePage() {
  /* M-19: a sobriedade aqui é a decisão, não a falta dela — uma página
     sobre quem faz isto e porquê não precisa de instrumentos nem
     movimento; as promessas a cumprir são os links (repositório e
     contacto reais) e a voz. */
  return (
    <div className="mx-auto max-w-2xl px-5 pt-14 pb-10">
      <p className="kicker">Sobre</p>
      <h1 className="titulo-pagina">
        Porque existe o AO CÊNTIMO
      </h1>
      <div className="body-copy mt-8 space-y-5">
        <p>
          Em Portugal fala-se de dinheiro todos os dias — escalões, Euribor,
          spread, retenção — mas poucos sítios explicam a mecânica por trás das
          palavras. Este projeto nasce para preencher esse espaço: dados
          oficiais, simuladores transparentes e um glossário sem jargão.
        </p>
        <p>
          É um projeto pessoal, sem publicidade e sem rastreamento. O código e
          os dados são abertos: cada número pode ser verificado na fonte, e cada
          fórmula pode ser lida{" "}
          <a
            href="https://github.com/braindeadpt/aocentimo"
            className="underline decoration-line2 underline-offset-2"
          >
            no repositório
          </a>
          .
        </p>
        <p>
          O desenho segue uma regra simples: se parecer gerado automaticamente,
          falhou. Um site sobre dinheiro público merece o cuidado de uma
          publicação de referência.
        </p>
      </div>

      {/* autor + contacto — o plano §7 define a página como
          "Autor, propósito, contacto"; os links são reais, nunca placeholder */}
      <div className="body-copy mt-10 space-y-5 border-t border-line pt-6">
        <p>
          Autor —{" "}
          <a
            href="https://github.com/braindeadpt"
            className="underline decoration-line2 underline-offset-2"
          >
            braindeadpt
          </a>
          .
        </p>
        <p>
          Erros, sugestões e termos em falta para o glossário:{" "}
          <a
            href="https://github.com/braindeadpt/aocentimo/issues"
            className="underline decoration-line2 underline-offset-2"
          >
            GitHub Issues
          </a>
          .
        </p>
      </div>
    </div>
  );
}
