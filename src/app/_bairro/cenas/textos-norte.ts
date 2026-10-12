/**
 * A copy da cena da Torre dos Clérigos — «O Norte na economia».
 *
 * APROVADA PELO DONO a 2026-10-12 (ponto 6 da auditoria do mapa), palavra
 * a palavra. Os números entram por argumento, já formatados, a partir de
 * `data/regional/norte.json` — nenhum está escrito aqui. Os botões
 * («E por cada pessoa? →») são a única copy nova fora do texto aprovado.
 */

export const nteQuem = "Torre dos Clérigos · o Norte na economia";
export const ntePlaca = "O NORTE NA ECONOMIA";
export const nteRotuloArte =
  "Do alto da Torre dos Clérigos: os telhados do Porto, o Douro e três colunas com o peso do Norte no PIB, nas exportações e no emprego da indústria.";

export const nteFala1 =
  "Da Torre dos Clérigos vê-se a região que faz <b>quase um terço da riqueza do país</b>.";

export const ntePibValor = (pct: string) => `${pct} do PIB`;
export const ntePibTexto = (milhoes: string, ano: string) =>
  `O Norte produziu <b>${milhoes} milhões de euros</b> em ${ano}: perto de 3 em cada 10 euros de Portugal.`;

export const nteExpValor = (pct: string) => `${pct} das exportações de bens`;
export const nteExpTexto = (milhoes: string, ano: string) =>
  `<b>${milhoes} milhões de euros</b> vendidos lá para fora em ${ano}: um terço de tudo o que o país exporta.`;

export const nteIndValor = (mil: string) => `${mil} mil pessoas na indústria`;
export const nteIndTexto = (pct: string, ano: string) =>
  `Quase 1 em cada 4 empregos do Norte (${pct}) é numa fábrica, média de ${ano}.`;

export const nteExtra = (pct: string) =>
  `<b>${pct}</b> de quem trabalha em têxteis, vestuário e calçado em Portugal está no Norte.`;

export const nteFecho = (norte: string, pais: string) =>
  `Mas cada pessoa ainda produz menos do que a média: <span class="b-r">${norte}</span> de PIB por habitante, contra <b>${pais}</b> no país.`;

export const nteBtnPessoa = "E por cada pessoa? →";
export const nteBtnVoltar = "Voltar ao bairro";
export const nteBtnOutra = "Ver outra vez";
export const nteFalha = "A fonte falhou — este número fica por mostrar.";
