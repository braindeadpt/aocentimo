import type { Metadata } from "next";
import { metaDeRota } from "@/lib/seo";
import { TituloPagina } from "@/components/Voo";

export const metadata: Metadata = metaDeRota("/sobre");

export default function SobrePage() {
  /* M-19: a sobriedade aqui é a decisão, não a falta dela — uma página
     sobre quem faz isto e porquê não precisa de instrumentos nem
     movimento; as promessas a cumprir são os links (repositório e
     contacto reais) e a voz. */
  return (
    <div className="rt5 mx-auto max-w-2xl px-5 pt-14 pb-10">
      <p className="kicker">Sobre</p>
      <TituloPagina rota="/sobre">Porque existe o AO CÊNTIMO</TituloPagina>
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

      {/* privacidade — a Play Store exige uma política dentro da app
          (a TWA é este site); a honestidade aqui é que ela cabe numa
          secção porque a resposta é «não recolhe nada» */}
      <section id="privacidade" className="mt-10 border-t border-line pt-6">
        <h2 className="font-display text-display-sm mb-6">Privacidade</h2>
        <div className="body-copy space-y-5">
          <p>
            O AO CÊNTIMO não recolhe dados pessoais. Não há contas,
            formulários, cookies, analytics, publicidade nem rastreadores —
            o site não sabe quem és.
          </p>
          <p>
            Os cálculos correm todos no teu aparelho: nada do que escrevas
            num simulador sai do dispositivo — e não podia, porque este site
            não tem servidor de aplicação, só ficheiros estáticos. A
            preferência de tema (claro ou escuro) fica guardada no
            armazenamento local do navegador e nunca é enviada para lado
            nenhum.
          </p>
          <p>
            As ligações de «fonte» abrem sites oficiais — DGEG, INE, Banco
            de Portugal, Eurostat e outros. A partir do momento em que as
            segues, passam a valer as políticas desses sites.
          </p>
          <p>
            A app Android é este mesmo site a correr em ecrã inteiro:
            recolhe exatamente os mesmos dados — nenhuns.
          </p>
          <p className="text-sm text-muted">
            Última revisão: novembro de 2026.
          </p>
        </div>
      </section>
    </div>
  );
}
