import HomeBairro from "./_bairro/HomeBairro";

/**
 * A home passa a ser o bairro (P1 do PACK V5 PRODUÇÃO).
 *
 * A home V4 (`HeroMoeda`, `EscolhePergunta`, `Painel`) saiu daqui: o
 * bairro é a mesma promessa dita de outra maneira — cada edifício
 * responde a uma pergunta, com os números de hoje.
 *
 * Em P3c apagou-se a ilha que NADA referenciava: `EscolhePergunta`,
 * `portas-previews` e `portas.css` (1 108 linhas). `HeroMoeda` e
 * companhia sobrevivem porque o ÚNICO ficheiro que os referencia é o
 * próprio teste — estão listados no PR para a decisão do dono (P4).
 *
 * Tudo o que a home precisa é montado no servidor e chega ao
 * `<Bairro>` por props. Ver `_bairro/HomeBairro.tsx`.
 */
export default function Home() {
  return <HomeBairro />;
}
