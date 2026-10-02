import HomeBairro from "./_bairro/HomeBairro";

/**
 * A home passa a ser o bairro (P1 do PACK V5 PRODUÇÃO).
 *
 * A home V4 (`HeroMoeda`, `EscolhePergunta`, `Painel`) saiu daqui: o
 * bairro é a mesma promessa dita de outra maneira — cada edifício
 * responde a uma pergunta, com os números de hoje. Os componentes não
 * apagam-se ainda; `HeroMoeda` e companhia são apagados em P4, depois de
 * se ver que nenhuma outra rota os usa.
 *
 * Tudo o que a home precisa é montado no servidor e chega ao
 * `<Bairro>` por props. Ver `_bairro/HomeBairro.tsx`.
 */
export default function Home() {
  return (
    <>
      <HomeBairro />
      {/* PROVA DESCARTÁVEL do passo audit no CI: âncora sem alvo */}
      <a href="#naoexiste" aria-hidden="true" tabIndex={-1} style={{ display: "none" }}>prova</a>
    </>
  );
}
