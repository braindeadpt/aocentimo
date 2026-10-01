/**
 * A copy das quatro cenas P2a — a porta do diálogo do protótipo
 * (`cena-financas.js`, `cena-banco.js`, `cena-mercearia.js` e o
 * `cenaSalario` do `mapa.tpl.html`).
 *
 * TUDO AQUI É PROPOSTA: a lista de textos para o dono rever antes de
 * lançar está em docs/NOTAS-V5.md §P2a. Os números NÃO vivem aqui — os
 * valores que a fala cita entram por parâmetro, já formatados por
 * `src/lib/format.ts` no sítio onde a cena os monta. Este ficheiro não
 * conhece `data/` e não conhece números.
 */

/* ————— moldura ————— */

export const fechar = "Voltar ao bairro";
export const saltar = "Saltar para o fim";

/* ————— Finanças · o IRS em gavetas ————— */

export const finQuem = "Finanças · balcão A · o IRS em gavetas";
export const finRotuloArte =
  "Dentro das Finanças: o balcão A, a máquina das senhas, o funcionário, a Inês e a cómoda com uma gaveta por cada escalão do IRS.";

export const finFala1 = "Bem-vindo às Finanças. Para o IRS é o balcão A: tira a tua senha.";
export const finBtnSenha = "Tirar senha";

export const finFala2 = (senha: string) =>
  `Senha ${senha}, faz favor! Antes de começarmos, um palpite:`;

export const finPalpite = (de: string, para: string, g0: string, g1: string) =>
  `A Inês foi aumentada de ${de} para ${para} brutos por mês e passou do ${g0} para o ${g1} escalão do IRS. No fim do ano, fica com…`;

export const finBtnMenos = "menos dinheiro";
export const finBtnIgual = "o mesmo";
export const finBtnMais = "mais dinheiro";

export const finAcertou = "Acertaste.";
export const finAfinalNao = "Afinal não.";

export const finResposta = (ganho: string) =>
  `Fica com mais ${ganho} por ano.`;

export const finExplica = (gaveta: string, dentro: string, taxa: string, aum: string, irs: string, ss: string) =>
  [
    `Os escalões são gavetas. O rendimento enche-as de baixo para cima, e a taxa de cada gaveta só se aplica ao que está lá dentro.`,
    `Com o aumento, só ${dentro} entraram na ${gaveta} gaveta. Só esses pagam ${taxa}; tudo o que já estava nas gavetas de baixo paga o mesmo que antes. Dos ${aum} a mais por ano, ${irs} vão para o IRS e ${ss} para a Segurança Social.`,
  ];

export const finAntes = (v: string) => `Inês antes: ${v}`;
export const finDepois = (v: string) => `Inês depois: ${v}`;

export const finCalcRotulo = "Experimenta: salário bruto por mês";
export const finCalcCol = "Rendimento coletável por ano";
export const finCalcIrs = "IRS pelos escalões, por ano";
export const finCalcMarg = "Taxa da gaveta mais alta";
export const finCalcMed = "Taxa média (o que pagas mesmo)";

export const finFala4 = (degrau: string) =>
  `Quando ouvires «estou no escalão dos ${degrau}», isso é o degrau. O que pagas mesmo é a curva.`;

export const finGraficoAria =
  "Gráfico: a taxa do escalão sobe aos degraus, a taxa média sobe devagar e fica sempre abaixo.";

export const finGraficoTexto = (degrau: string, media: string) =>
  `A Inês está no degrau dos ${degrau}, mas paga em média ${media} do rendimento coletável. A curva está sempre abaixo do degrau e nunca dá saltos, porque cada gaveta nova só apanha o dinheiro a mais.`;

export const finNotaRodape = (motor: string) =>
  `Este é o IRS calculado só pelos escalões. Depois ainda se descontam as deduções à coleta: com as despesas gerais familiares, a Inês paga ${motor} por ano, o mesmo que o simulador do AO CÊNTIMO calcula. Nos rendimentos mais baixos, o mínimo de existência ainda baixa o imposto. O que se retém todos os meses é um adiantamento: o valor final acerta-se na declaração anual.`;

export const finBtnGrafico = "Aprender a ler o gráfico";
export const finBtnVoltar = "Voltar ao bairro";
export const finBtnOutra = "Ver outra vez";

/* ————— Banco · a Euribor e a prestação ————— */

export const banQuem = "Banco · balcão A · o crédito à habitação";
export const banRotuloArte =
  "Dentro do banco: o quadro da Euribor com letras que viram, o cofre, o gerente atrás do balcão e o Rui com a Marta à frente.";

export const banFala1 =
  "Bom dia! O crédito à habitação é no balcão A. O Rui e a Marta já tiraram a senha.";
export const banBtnSenha = "Chamar a senha A 041";

export const banFala2 = (capital: string, anos: number) =>
  `O Rui e a Marta querem pedir ${capital} a ${anos} anos para comprar casa. Um palpite antes:`;

export const banPalpite = (mesA: string, prestA: string, mesB: string) =>
  `Em ${mesA}, a prestação deste empréstimo seria de ${prestA} por mês. E se o pedissem em ${mesB}, pela mesma casa?`;

export const banPalpiteAria = "O teu palpite em euros por mês";
export const banNotaExemplo = (spread: string) =>
  `Exemplo com spread de ${spread}. Só a Euribor é um dado real (BPstat).`;
export const banBtnResposta = "Mostrar a resposta";

export const banResposta = (juizo: string, mesB: string, prestB: string, mesA: string, dif: string) =>
  `${juizo} Em ${mesB} seria ${prestB} por mês: mais ${dif} do que em ${mesA}.`;

export const banExplica = (eA: string, eB: string) =>
  [
    `A casa é a mesma, o dinheiro pedido é o mesmo e o banco não mudou nada. Mudou a Euribor: de ${eA} para ${eB}. A taxa do empréstimo é a Euribor mais o spread, a parte fixa que o banco cobra.`,
    `Arrasta pelo tempo e vê o quadro e a prestação a mudar. Repara também na barra: quando a taxa sobe, quase toda a primeira prestação vai para juros.`,
  ];

export const banGraficoAria =
  "Dois gráficos com o mesmo tempo, de 2019 até hoje: em cima a Euribor a 12 meses e a taxa do empréstimo; em baixo a prestação, que sobe e desce com a Euribor.";

export const banFala4 =
  "Dois gráficos, o mesmo tempo. Quando a linha azul sobe, a vermelha sobe logo atrás.";

export const banGraficoTexto = (hoje: string, eur: string, prest: string) =>
  `Em cima, a Euribor e, a tracejado, a taxa do empréstimo; a faixa amarela entre as duas é o spread. Em baixo, a prestação. Hoje (${hoje}), a Euribor está em ${eur} e a prestação do exemplo seria de ${prest}.`;

export const banNotaGrafico =
  `Para comparar, cada ponto é um empréstimo novo feito nesse mês. Num contrato a sério, a taxa revê-se de 3, 6 ou 12 em 12 meses sobre a dívida que falta pagar. Imposto do Selo, seguros e comissões não estão incluídos.`;

export const banCalcTempo = "Se pedissem o empréstimo em…";
export const banCalcEur = "Euribor a 12 meses";
export const banCalcTan = "Taxa do empréstimo (Euribor + spread)";
export const banCalcPrest = "Prestação por mês";
export const banCalcJuros = "Da 1.ª prestação, juros";
export const banJurosDe = (juros: string, prest: string) => `${juros} de ${prest}`;
export const banRotJuros = "juros";
export const banRotCasa = "paga a casa";
export const banExemplo = (capital: string, anos: number, spread: string) =>
  `Exemplo: ${capital} a ${anos} anos, spread de ${spread}. Mudar`;
export const banExemploCap = "Montante";
export const banExemploAnos = (n: number) => `${n} anos`;
export const banExemploSpread = "Spread";

/* ————— Mercearia · a inflação e o IVA no talão ————— */

export const mercQuem = "Mercearia do Sr. Manuel · a inflação e o IVA";
export const mercRotuloArte =
  "Dentro da mercearia: duas prateleiras com pão, leite, carne, peixe, fruta, legumes, azeite e açúcar, cada uma com a etiqueta «1 € em 2020», o balcão com a caixa registadora e o Sr. Manuel.";

export const mercFala1 = (mes: string) =>
  `Bom dia! Em ${mes}, este saco de compras custava 10 €. Quanto custa hoje o mesmo saco?`;

export const mercPalpiteAria = "O teu palpite em euros";
export const mercBtnResposta = "Mostrar a resposta";

export const mercResposta = (juizo: string, real: string) =>
  `${juizo} Hoje o mesmo saco custa ${real}. Isto chama-se inflação.`;

export const mercExplica = (comida: string, mes: string, total: string) =>
  `A comida subiu ${comida} desde ${mes}; tudo o que compramos, em média, subiu ${total}. Mas cada prateleira subiu à sua maneira: as etiquetas dizem quanto custa hoje o que custava 1 € em 2020.`;

export const mercEtiquetaHoje = (v: string) => `${v} hoje`;
export const mercEtiquetaAntes = "1 € em 2020";

export const mercSubidaLegenda = (total: string) =>
  `tudo o que compramos (inflação geral): ${total}`;

export const mercFala3 = (mes: string) =>
  `Um índice é uma régua de preços. Aqui, 100 é o preço em ${mes}.`;

export const mercGraficoAria = (nome: string, mes: string, hoje: number, geral: number) =>
  `Índice de preços de ${nome}, com 100 no preço de ${mes}: hoje vale ${hoje}. A inflação geral, a tracejado, vale ${geral}.`;

export const mercGraficoTexto = (nome: string, hoje: number, variacao: string) =>
  `A linha vermelha é ${nome.toLowerCase()}: começa em 100 e hoje vale ${hoje}, ou seja, está ${variacao} mais caro. A tracejado, a inflação geral. Quando a vermelha fica por cima, esse produto subiu mais do que o resto.`;

export const mercNotaIndice =
  `São índices, não preços: dizem quanto subiu, não quanto custa um quilo. Cada produto é uma família do índice europeu de preços (por exemplo, «cereais e derivados» inclui pão, arroz e massa).`;

export const mercEscolherAria = "Escolher o produto";
export const mercBtnIva = "Ver o IVA no talão";

export const mercFala4 =
  "E há uma parte de cada compra que vai para o Estado: o IVA. Já vem dentro do preço.";

export const mercIvaTexto = (red: string, em10Red: string, inter: string, norm: string, em10Norm: string) =>
  `O IVA tem três taxas. Os alimentos básicos da lista I do Código do IVA, como o pão, o leite, a fruta e os legumes, pagam a reduzida, ${red}: em cada 10 € ficam ${em10Red} para o Estado. As conservas e o vinho pagam a intermédia, ${inter}. Tudo o que não está nas listas do Código do IVA paga a normal, ${norm}: ${em10Norm} em cada 10 €.`;

export const mercIvaNota = (regiao: string) =>
  `* Taxa normal: o que não está nas listas I e II do Código do IVA (art. 18.º). Os exemplos são indicativos; as listas definem o enquadramento exato de cada produto. ${regiao}.`;

export const mercTalaoAria = (em10Red: string, em10Inter: string, em10Norm: string) =>
  `Talão de exemplo: por cada 10 euros em pão, leite e fruta e legumes, ${em10Red} são IVA; em conservas e vinho, ${em10Inter}; nos outros produtos, ${em10Norm}.`;

export const mercTalaoCab = "MERCEARIA DO MANUEL";
export const mercTalaoSub = "por cada 10,00 € que pagas em…";
export const mercTalaoTotal = "TOTAL";
export const mercTalaoIvaIncluido = "IVA incluído no preço";
export const mercTalaoIvaTotal = "IVA total";

/* ————— Fábrica · o salário da Inês ————— */

export const fabQuem = "A fábrica · o salário da Inês";
export const fabFala = (custo: string) =>
  `A empresa da Inês gasta ${custo} por mês com ela. Cada moeda é uma fatia. Segue-as pelo bairro!`;

export const fabFalaSS = (ss: string, tsu: string, ssInes: string) =>
  `Primeiro, ${ss} entram na Segurança Social: ${tsu} pagos pela empresa (a TSU) e ${ssInes} descontados à Inês.`;

export const fabFalaIrs = (irs: string) =>
  `Depois, ${irs} ficam nas Finanças — o IRS retido todos os meses, um adiantamento que se acerta na declaração anual.`;

export const fabFalaRua = "O resto desce a rua com a Inês até casa…";

export const fabFalaCasa = (liq: string, fica: string) =>
  `Chegam a casa da Inês ${liq}. De cada euro que a empresa gasta, ${fica} cêntimos chegam à conta dela.`;

export const fabSemDados = "Os dados do salário não estão disponíveis agora.";
export const fabContAria = "O percurso do salário até agora";
export const finPalpiteAria = "O teu palpite";
export const finGavetasAria = "Ver as gavetas da Inês";

export const fabContSS = (v: string) => `Seg. Social: ${v}`;
export const fabContIrs = (v: string) => `IRS: ${v}`;
export const fabContCasa = (v: string) => `Chega a casa: ${v}`;

export const fabBtnOutra = "Ver outra vez";
export const fabBtnSimulador = "Fazer com o meu salário";
