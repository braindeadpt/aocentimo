/**
 * Os textos das cenas P2c — Casa da Inês, Pastelaria, Quiosque e Escola.
 *
 * TUDO o que é copy vive aqui (PROPOSTA, a listar em docs/NOTAS-V5.md):
 * falas, perguntas, botões, notas de rodapé e rótulos aria. Nenhum texto
 * fica escrito dentro dos componentes — nem um aria-label.
 *
 * Os números chegam já formatados pelos componentes (format.ts corre no
 * cliente); as funções só cospem a frase à volta.
 */

/* ————— juízo do palpite (porta de `juizoPalpite` do protótipo) ————— */

export function juizoPalpite(
  palpite: number,
  real: number,
  perto: number,
  quase: number
): string {
  const d = Math.abs(palpite - real);
  if (d <= perto) return "Acertaste em cheio!";
  if (d <= quase) return "Quase!";
  return palpite < real ? "Mais do que pensavas!" : "Menos do que pensavas!";
}

/* ————— Casa da Inês · o preço das casas ————— */

export const casaQuem = "Casa da Inês · o preço das casas";
export const casaPlaca = "CASA DA INÊS";
export const casaPilhaLeg = "meses de trabalho";
export const casaRotuloArte =
  "A sala da Inês com a janela para a Ribeira: na mesa, uma casa em miniatura e, ao lado, uma pilha de recibos de vencimento que cresce.";
export const casaFala1 =
  "Imagina que, em <b>2015</b>, uma casa custava o mesmo que <b>100 meses</b> de trabalho.";
export const casaPergunta =
  "Hoje, a mesma casa custa o mesmo que quantos meses de trabalho?";
export const casaPalpiteAria = "O teu palpite em meses";
export const casaPalpiteFmt = (v: number) => `${v} meses`;
export const casaBtnResposta = "Mostrar a resposta";
export const casaFala2 = (juizo: string, meses: string) =>
  `<b>${juizo}</b> Hoje custa <span class="b-r">${meses} meses</span>.`;
export const casaExplica = (subHpi: string, subLci: string) =>
  `Desde 2015, os preços das casas subiram <span class="b-r">${subHpi}</span>. O custo do trabalho, o que as empresas pagam por cada hora trabalhada, subiu <b>${subLci}</b>.`;
export const casaNota = (ultimo: string) =>
  `«Meses de trabalho» é uma forma de ler a razão entre dois índices oficiais (preços da habitação ÷ custo do trabalho, 2015 = 100). Não é o salário líquido de ninguém. Último dado: ${ultimo}.`;
export const casaBtnGrafico = "Aprender a ler o gráfico →";
export const casaFala3 =
  "Duas linhas que partem do <b>mesmo 100</b>. A distância entre elas é o que mudou.";
export const casaGraficoRotA = "preço das casas";
export const casaGraficoRotB = "custo do trabalho";
export const casaGraficoAria = (hpi: string, lci: string) =>
  `Desde 2015, o índice de preços das casas passou de 100 para ${hpi}; o custo do trabalho, de 100 para ${lci}.`;
export const casaGraficoTexto = (hpi: string, lci: string) =>
  `Em 2015 as duas linhas estavam juntas, em 100. Hoje o preço das casas vale <span class="b-r">${hpi}</span> e o custo do trabalho <b>${lci}</b>. A mancha entre as duas é a parte da subida das casas que o custo do trabalho não acompanhou.`;
export const casaBtnVoltar = "Voltar ao bairro";
export const casaBtnOutra = "Ver outra vez";
export const casaLinkCasa = "Ver a casa por dentro →";

/* ————— Pastelaria · o café e o pastel ————— */

export const pastQuem = "Pastelaria · o café e o pastel";
export const pastPlaca = "PASTELARIA";
export const pastRotuloArte =
  "A pastelaria por dentro: a vitrine com pastéis de nata e bolas de Berlim, a máquina de café, a empregada ao balcão e o quadro com o preço de antes e de hoje.";
export const pastFala1 = (mes: string, preco: string) =>
  `Um café e um pastel de nata! Em ${mes}, digamos que custavam <b>${preco}</b>.`;
export const pastPergunta =
  "Quanto custam hoje o mesmo café e o mesmo pastel?";
export const pastNotaExemplo = (preco: string) =>
  `Os ${preco} são um exemplo. O que é real é quanto subiram os preços.`;
export const pastPalpiteAria = "O teu palpite em euros";
export const pastBtnResposta = "Mostrar a resposta";
export const pastQuadroHoje = (preco: string) => `hoje: ${preco}`;
export const pastQuadroAntes = (mes: string, preco: string) =>
  `${mes}: ${preco}`;
export const pastQuadroTitulo = "café + pastel";
export const pastFala2 = (juizo: string, preco: string, varPct: string) =>
  `<b>${juizo}</b> Hoje custam <span class="b-r">${preco}</span>: ${varPct}.`;
export const pastExplica = (mes: string, varFora: string, varCasa: string) =>
  `Comer fora subiu mais do que comer em casa. Desde ${mes}, os restaurantes e cafés subiram <span class="b-r">${varFora}</span>; a comida da mercearia, <b>${varCasa}</b>.`;
export const pastGraficoRotA = "comer fora";
export const pastGraficoRotB = "comer em casa";
export const pastGraficoAria = (mes: string, fora: string, casa: string) =>
  `Com 100 em ${mes}, comer fora vale hoje ${fora} e comer em casa ${casa}.`;
export const pastNotaIndice =
  "«Comer fora» é o índice europeu de restaurantes e alojamento, onde entram os cafés e também os hotéis.";
export const pastBtnIva = "E o IVA do café? →";
export const pastFala3 = (taxa: string) =>
  `No café, o IVA é de <span class="b-r">${taxa}</span>.`;
export const pastIvaTexto = (
  hoje: string,
  iva: string,
  taxaCafe: string,
  taxaPao: string,
  ivaPao: string
) =>
  `Dos <b>${hoje}</b> do café e do pastel, <span class="b-r">${iva}</span> são IVA. A restauração paga a taxa intermédia, ${taxaCafe}. Se fosse a taxa do pão, ${taxaPao}, seriam ${ivaPao}.`;
export const pastNotaIva = "Taxas do continente, do Código do IVA.";
export const pastBtnVoltar = "Voltar ao bairro";
export const pastBtnOutra = "Ver outra vez";
export const pastLinkInflacao = "Ver a inflação por dentro →";

/* ————— Quiosque · o país hoje ————— */

export const quiQuem = "Quiosque da praça · o país hoje";
export const quiPlaca = "QUIOSQUE DA PRAÇA";
export const quiRotuloArte =
  "O quiosque da praça com os jornais pendurados, o vendedor e a primeira página do Jornal do Bairro com os números do país.";
export const quiFala1 =
  "O Gonçalo passa pelo quiosque. A manchete de hoje é sobre os <b>jovens</b>.";
export const quiPergunta =
  "Em cada <b>100 jovens</b> com menos de 25 anos que querem trabalhar, quantos não encontram emprego em Portugal?";
export const quiPalpiteAria = "O teu palpite";
export const quiPalpiteFmt = (v: number) => `${v} em 100`;
export const quiBtnManchete = "Ler a manchete";
export const quiMancheteSub = "dos jovens sem emprego";
export const quiJornalCab = "JORNAL DO BAIRRO";
export const quiJornalTitulo = "o país em números";
export const quiFala2 = (juizo: string, n: string, pct: string, mes: string) =>
  `<b>${juizo}</b> São cerca de <span class="b-r">${n} em cada 100</span> (${pct}, ${mes}).`;
export const quiJornalDesemprego = (pt: string, mes: string, n: string, ue: string) =>
  `<b>Desemprego</b> · ${mes}. Em cada 100 pessoas que trabalham ou procuram trabalho, cerca de ${n} procuram sem encontrar. Na UE: ${ue}.`;
export const quiJornalJovens = (razao: string) =>
  `<b>Desemprego jovem</b> (menos de 25 anos): ${razao} vezes o total.`;
export const quiJornalPib = (tri: string, v: string, sinal: string) =>
  `<b>Economia (PIB)</b> · ${tri}: o país produziu ${v} ${sinal} do que no mesmo trimestre do ano anterior.`;
export const quiJornalPibMais = "mais";
export const quiJornalPibMenos = "menos";
export const quiJornalInflacao = (mes: string, v: string) =>
  `<b>Inflação</b> · ${mes}: os preços estão ${v} mais altos do que há um ano.`;
export const quiJornalConfianca = (mes: string, sentido: string) =>
  `<b>Confiança dos consumidores</b> · ${mes}: ${sentido} (0 seria empate).`;
export const quiJornalConfPessimista = "há mais pessimistas do que otimistas";
export const quiJornalConfOtimista = "há mais otimistas do que pessimistas";
export const quiJornalSmn = (ano: string, hoje: string, ano0: string, valor0: string) =>
  `<b>Salário mínimo</b> em ${ano}, no continente. Em ${ano0} era ${valor0}.`;
export const quiJornalFalha = "Dado em falta — a fonte não respondeu.";
export const quiBtnGrafico = "Aprender a ler o gráfico →";
export const quiFala3 =
  "Três linhas: os <span class=\"b-r\">jovens</span>, o <b>total</b> e a média da <span class=\"b-a\">UE</span>.";
export const quiGraficoRotA = "jovens";
export const quiGraficoRotB = "Portugal";
export const quiGraficoRotC = "UE";
export const quiGraficoAria = (jov: string, pt: string, ue: string, mes: string) =>
  `Taxa de desemprego desde 2019: jovens ${jov}, Portugal ${pt}, União Europeia ${ue}, em ${mes}.`;
export const quiGraficoTexto = (jovPct: string) =>
  `A taxa de desemprego conta só quem <b>procura</b> trabalho, dividido por todos os que trabalham ou procuram. Quem estuda e não procura não entra na conta. Por isso «${jovPct} dos jovens» não quer dizer «${jovPct} de todos os jovens».`;
export const quiBtnVoltar = "Voltar ao bairro";
export const quiBtnOutra = "Ver outra vez";
export const quiLinkTrabalho = "Ver o trabalho →";
export const quiLinkDados = "Ver os dados do país →";

/* ————— Escola · aprender a ler gráficos ————— */

export const escQuem = "Escola · aprender a ler gráficos";
export const escPlaca = "ESCOLA";
export const escRotuloArte =
  "Uma sala de aula: a professora Diana ao quadro verde, com um gráfico desenhado a giz, e o Gonçalo na carteira.";
export const escFala1 =
  "Bom dia, turma! Hoje a professora <b>Diana</b> ensina a ler gráficos. Primeira pergunta:";
export const escPergunta =
  "Estes dois gráficos mostram o preço da comida no último ano. Em qual deles os preços subiram <b>mais</b>?";
export const escPerguntaCurta = "em qual subiram mais?";
export const escMiniA = "Gráfico A";
export const escMiniB = "Gráfico B";
export const escBtnA = "No A";
export const escBtnB = "No B";
export const escBtnMesmo = "Subiram o mesmo";
export const escFala2Certo = "<b>Muito bem!</b>";
export const escFala2Errado = "<b>Apanhado!</b>";
export const escFala2 = (veredito: string, subida: string) =>
  `${veredito} São os <b>mesmos números</b>: os preços subiram ${subida} nos dois.`;
export const escMiniALeg = "A · o eixo começa no 0";
export const escMiniBLeg = (lo: string) => `B · o eixo começa em ${lo}`;
export const escMiniAria = (lo: string, hi: string) => `Eixo de ${lo} a ${hi}`;
export const escExplicaEixo =
  "No B, o eixo não começa no zero: corta o fundo e faz a mesma subida parecer uma montanha. Não é mentira, mas engana. <b>Primeira regra: olha sempre para onde começa o eixo.</b>";
export const escBtnLicao2 = "Segunda lição: num mês ou num ano? →";
export const escFala3 = (
  mes: string,
  dirMes: string,
  mm: string,
  yy: string
) =>
  `Dois jornais, ${mes}. Um diz «os preços <b>${dirMes} ${mm}</b>». O outro diz «<b>subiram ${yy}</b>». Quem mente?`;
export const escSubiram = "subiram";
export const escDesceram = "desceram";
export const escExplica3a = "<b>Ninguém.</b> Comparam com meses diferentes:";
export const escCadeia = (mes: string) =>
  `Comparado com o <b>mês anterior</b> (${mes}): variação em cadeia`;
export const escHomologa = (mes: string) =>
  `Comparado com o <b>mesmo mês do ano passado</b> (${mes}): variação homóloga`;
export const escExplica3b =
  "<b>Segunda regra: pergunta sempre «comparado com quando?».</b> A inflação que ouves nas notícias é quase sempre a homóloga, a de um ano inteiro.";
export const escBtnLicao3 = "Terceira lição: as palavras →";
export const escFala4 =
  "<b>Terceira regra: sabe o que as palavras querem dizer.</b> Toca numa palavra para ires ao sítio do bairro onde ela vive.";
export const escVerEm = (titulo: string) => `ver em: ${titulo} →`;
export const escBtnVoltar = "Voltar ao bairro";
export const escBtnOutra = "Ver outra vez";
export const escLinkAprender = "Ver o glossário todo →";

export const escNotaIndices = (mes: string) =>
  `Os dois números são do mesmo índice de preços (IHPC total), ${mes}: a variação em cadeia compara com o mês anterior; a homóloga, com o mesmo mês do ano anterior.`;

export const escVerGlossario = "glossário →";

export const escOnde: Record<string, { titulo: string; href: string }> = {
  "ipc-ihpc": { titulo: "a Pastelaria", href: "/#pastelaria" },
  "taxa-real": { titulo: "os Correios", href: "/#correios" },
  "escalao-irs": { titulo: "as Finanças", href: "/#financas" },
  spread: { titulo: "o Banco", href: "/#banco" },
  tsu: { titulo: "a Fábrica", href: "/#fabrica" },
};
