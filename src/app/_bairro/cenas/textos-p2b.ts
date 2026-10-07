/**
 * A copy das três cenas P2b — a porta do diálogo de `cena-correios.js`,
 * `cena-bomba.js` e do `cenaSegSocial` de `cenas-bairro.js`.
 *
 * TUDO AQUI É PROPOSTA: a lista para o dono rever está em
 * docs/NOTAS-V5.md §P2b. Os números não vivem aqui — entram por
 * parâmetro, já formatados por `src/lib/format.ts` no sítio onde a
 * cena os monta. Este ficheiro não conhece `data/` nem números.
 *
 * Diferenças deliberadas face ao protótipo (todas anotadas nas NOTAS):
 *
 *   - o montante da Dona Arminda é dito «exemplo» (regra nº1 — os
 *     10 000 € não são um dado, são a personagem do exercício);
 *   - na Bomba, «desde quando» é a primeira data REAL da série DGEG,
 *     chega por parâmetro — nunca um ano escrito à mão;
 *   - cada cena acaba com a ligação ao sítio onde se aprofunda
 *     (/poupanca, /precos, /salario) — o PACK pede-a e o protótipo
 *     não a tinha.
 */

/* ————— Correios · a poupança da Dona Arminda ————— */

export const corQuem = "Correios · senha A · poupança";
export const corRotuloArte =
  "Dentro dos Correios: a parede de cacifos, o painel da senha, o guiché A com a funcionária atrás do vidro, o balcão com duas pilhas de notas e a Dona Arminda com a caderneta.";

export const corFala1 =
  "Bom dia! A <b>poupança</b> é no balcão A. A Dona Arminda está à espera com a caderneta.";
export const corBtnSenha = (senha: string) => `Chamar a senha ${senha}`;
export const corSenha = "A 015";

export const corFala2 = (mes: string, cap: string) =>
  `Em ${mes}, a Dona Arminda guardou <b>${cap}</b> no colchão. Hoje ainda lá estão, todos. Um palpite:`;
export const corPalpite = (cap: string, mesCurto: string) =>
  `Esses ${cap} compram hoje o mesmo que quanto dinheiro comprava em ${mesCurto}?`;
export const corPalpiteAria = "O teu palpite em euros";
export const corBtnResposta = "Mostrar a resposta";

/** O juízo do palpite dos Correios (distância ao real medido). */
export const corJuizo = (dif: number, palpite: number, real: number): string =>
  dif <= 200
    ? "Acertaste em cheio!"
    : dif <= 600
      ? "Quase!"
      : palpite > real
        ? "Ainda menos!"
        : "Um pouco mais!";

export const corResposta = (juizo: string, real: string, mesCurto: string) =>
  `<b>${juizo}</b> Compram o mesmo que <span class="b-r">${real}</span> compravam em ${mesCurto}.`;
export const corSemDados =
  "Os dados de inflação não estão disponíveis agora — sem eles não se mede o poder de compra.";

export const corExplica = (variacao: string) =>
  `<p>O dinheiro não desapareceu: <b>encolheu</b>. Os preços subiram ${variacao} e cada euro compra menos. Chama-se perder <b>poder de compra</b>: a linha vermelha no monte de notas marca o que ele ainda compra.</p>`;
export const corExplicaCA = (taxa: string, imposto: string) =>
  `<p>E nos <b>Certificados de Aforro</b>, a poupança do Estado que se faz nos Correios? Hoje rendem <b>${taxa}</b> por ano, mais um prémio a partir do 2.º ano, e ${imposto} dos juros ficam para o IRS.</p>`;

export const corBtnCertificados = "E se fosse para os certificados? →";

export const corFala4 = (cap: string) =>
  `Os ${cap} crescem nos certificados. Mas crescem <b>mais depressa do que os preços?</b>`;
export const corExplicaLiq = (taxa: string, liq: string) =>
  `<p>No 1.º ano, a taxa de ${taxa} fica em <b>${liq}</b> depois do imposto. Se a inflação for maior do que isso, os euros aumentam mas compram menos; se for menor, ganha-se poder de compra. Experimenta:</p>`;
export const corNotaHipotese = (taxa: string, vigencia: string, infl: string, garantia: string) =>
  `Isto é uma hipótese, não uma previsão: a taxa dos certificados muda todos os meses (hoje ${taxa}, em vigor desde ${vigencia}) e ninguém sabe a inflação futura. Começa com a inflação dos últimos 12 meses, ${infl}. ${garantia}.`;

export const corCalcAnos = "Daqui a quantos anos?";
export const corCalcInfl = "Se a inflação fosse, por ano…";
export const corCalcCol = "No colchão";
export const corCalcCA = "Nos Certificados de Aforro (já sem imposto)";
export const corCalcJur = (imposto: string) => `Juros brutos · imposto retido (${imposto})`;
export const corAnosOut = (n: number) => (n === 1 ? "1 ano" : `${n} anos`);
export const corCompram = "compram";

export const corBtnGrafico = "Aprender a ler o gráfico →";

export const corFala5 =
  "As linhas <b>cheias</b> são os euros que vês. As <span class=\"b-r\">tracejadas</span> são o que esses euros compram.";
export const corGraficoTexto = (cap: string) =>
  `No colchão, a linha cheia nunca se mexe: são sempre ${cap}. Mas a tracejada desce todos os anos. Nos certificados, a cheia sobe; se a tracejada ficar abaixo de ${cap}, a poupança está a perder para os preços. A distância entre as duas linhas é a <b>inflação</b>.`;

export const corGraficoAria = (
  infl: string,
  cap: string,
  realCol: string,
  saldoCA: string,
  realCA: string
) =>
  `Gráfico de 15 anos: as linhas cheias são os euros que se veem, as tracejadas o que esses euros compram. Com ${infl} de inflação por ano, os ${cap} do colchão compram ${realCol} ao fim de 15 anos; nos Certificados de Aforro, ${saldoCA} que compram ${realCA}.`;

export const corBtnVoltar = "Voltar ao bairro";
export const corBtnOutra = "Ver outra vez";
export const corBtnPoupanca = "Saber mais sobre poupança →";

/* ————— Bomba · o litro por dentro ————— */

export const bmbQuem = "Bomba de gasolina · o litro por dentro";
export const bmbRotuloArte =
  "Na bomba de gasolina: a pala, a bomba com o mostrador, o carro do Pedro com a prancha no tejadilho e um garrafão de um litro que se enche por camadas — o combustível e os três impostos.";

export const bmbFala1 = (litros: number, nome: string, preco: string) =>
  `O Pedro vai atestar: <b>${litros} litros</b> de ${nome.toLowerCase()}, ao preço médio de hoje, <b>${preco}</b> por litro.`;
export const bmbPalpite = (total: string) =>
  `Vai pagar <b>${total}</b>. Quanto desse dinheiro é imposto?`;
export const bmbPalpiteAria = "O teu palpite em euros";
export const bmbBtnAtestar = "Atestar e ver a resposta";

/** O juízo do palpite da Bomba (distância aos impostos do depósito). */
export const bmbJuizo = (dif: number, palpite: number, impostos: number): string =>
  dif <= 3
    ? "Acertaste em cheio!"
    : dif <= 10
      ? "Quase!"
      : palpite < impostos
        ? "Muito mais do que pensavas!"
        : "Um pouco menos!";

export const bmbResposta = (juizo: string, total: string, impostos: string, peso: string) =>
  `<b>${juizo}</b> Dos ${total}, <span class="b-r">${impostos}</span> são impostos: <span class="b-r">${peso}</span> do que pagou.`;
export const bmbRespostaTroca = (nome: string, total: string, impostos: string, peso: string) =>
  `Com ${nome.toLowerCase()}: dos ${total}, <span class="b-r">${impostos}</span> são impostos: <span class="b-r">${peso}</span> do que se paga.`;
export const bmbSemDados =
  "O preço médio de hoje não está disponível — sem ele não se abre o litro.";

export const bmbExplica =
  `<p>Olha para dentro de <b>um litro</b>. Por baixo, o que paga o combustível e quem o traz até à bomba. Por cima, três impostos: o <span class="b-r">ISP</span>, a <span class="b-r">taxa de carbono</span> e o <span class="b-r">IVA</span>.</p>`;
export const bmbCombustiveisAria = "Escolher o combustível";
export const bmbCamProduto = "Combustível e distribuição";
export const bmbCamIsp = "ISP";
export const bmbCamCarbono = "Taxa de carbono";
export const bmbCamIva = "IVA";
export const bmbImpostosLitro = "Impostos em cada litro";
export const bmbDeposito = (litros: number) => `Num depósito de ${litros} litros`;

export const bmbIvaSobreImp = (v: string) =>
  `<p>Repara no tracejado dentro do IVA: são <span class="b-r">${v}</span> por litro de <b>IVA sobre os outros impostos</b>. O IVA calcula-se sobre o preço que já leva o ISP e a taxa de carbono: paga-se imposto sobre imposto.</p>`;
export const bmbNotaIsp = (vigencia: string, notaIsp: string, data: string) =>
  `O ISP muda por portaria, às vezes todas as semanas. Valores em vigor desde ${vigencia}: ${notaIsp}. Preço: média nacional da DGEG de ${data}.`;

export const bmbBtnGrafico = "Aprender a ler o gráfico →";

export const bmbFala3 = (inicio: string) =>
  `E o preço de cada dia? Aqui está desde ${inicio}. Um ponto por semana, a <b>média do país</b>.`;
export const bmbGraficoTexto =
  `A linha vermelha é a gasolina 95; a preta, o gasóleo. O ISP e a taxa de carbono são valores fixos por litro; só o IVA acompanha o preço. Por isso, quando o preço sobe, a parte do imposto <b>pesa menos</b> em percentagem; quando desce, pesa mais.`;
export const bmbNotaGrafico =
  `Este gráfico mostra o preço, não a parte de imposto de cada dia: o repositório só tem o ISP em vigor hoje.`;
export const bmbSemSerie =
  "A série de preços da DGEG não está disponível agora.";

export const bmbGraficoAria = (
  inicio: string,
  pico: string,
  mesPico: string,
  baixo: string,
  mesBaixo: string
) =>
  `Preço médio por litro desde ${inicio}: a gasolina 95 teve o pico de ${pico} em ${mesPico} e o valor mais baixo de ${baixo} em ${mesBaixo}.`;

export const bmbBtnVoltar = "Voltar ao bairro";
export const bmbBtnOutra = "Ver outra vez";
export const bmbBtnPrecos = "Ver os preços todos →";

/* ————— Segurança Social · o recibo e o bolo comum ————— */

export const ssQuem = "Segurança Social · senha A · os descontos";
export const ssRotuloArte =
  "Dentro da Segurança Social: o guiché A, a funcionária, a Inês com o recibo e um grande mealheiro comum onde caem as moedas dos descontos dela e da empresa.";

export const ssFala1 =
  "Bom dia! Os <b>descontos</b> são no balcão A. A Inês trouxe o recibo de vencimento.";
export const ssSenha = "A 107";
export const ssBtnSenha = (senha: string) => `Chamar a senha ${senha}`;

export const ssFala2 = (bruto: string) =>
  `A Inês ganha <b>${bruto}</b> brutos por mês. Um palpite:`;
export const ssPalpite =
  `Somando o que ela desconta e o que a empresa paga por ela, quanto entra na Segurança Social <b>por mês</b>?`;
export const ssPalpiteAria = "O teu palpite em euros por mês";
export const ssBtnResposta = "Mostrar a resposta";

/** O juízo do palpite da SS (o `juizoPalpite` do protótipo). */
export const ssJuizo = (palpite: number, real: number): string => {
  const d = Math.abs(palpite - real);
  return d <= 15
    ? "Acertaste em cheio!"
    : d <= 60
      ? "Quase!"
      : palpite < real
        ? "Mais do que pensavas!"
        : "Menos do que pensavas!";
};

export const ssResposta = (juizo: string, total: string, ano: string) =>
  `<b>${juizo}</b> Entram <span class="b-a">${total}</span> por mês: ${ano} por ano.`;

export const ssReciboCab = "RECIBO DA INÊS · 1 mês";
export const ssReciboBruto = "Salário bruto";
export const ssReciboSS = (taxa: string) => `Segurança Social (${taxa})`;
export const ssReciboSub = "e o que não aparece no recibo";
export const ssReciboTsu = (taxa: string) => `A empresa paga por cima (${taxa})`;
export const ssReciboTotal = "Para a Segurança Social";

export const ssExplica = (ss: string, tsu: string, custo: string, bruto: string) =>
  `<p>A Inês vê no recibo os <b>${ss}</b> que lhe descontam. Mas a empresa paga mais <span class="b-a">${tsu}</span> por ela, a chamada TSU, que nunca aparece no recibo. Por isso a Inês custa à empresa <b>${custo}</b> por mês, e não ${bruto}.</p>`;
export const ssBolo =
  `<p>Este dinheiro vai para um bolo comum que paga, por exemplo, as pensões de quem já não trabalha e os subsídios de desemprego, de doença e parentais.</p>`;

export const ssBtnPedro = "E o Pedro, a recibos verdes? →";

export const ssFala4 =
  "O Pedro trabalha a <b>recibos verdes</b>. Não tem empresa: paga tudo sozinho.";
export const ssPedroTexto = (fat: string, taxa: string, rr: string, ssMes: string) =>
  `<p>Se o Pedro faturar os mesmos <b>${fat}</b> por mês, desconta ${taxa} sobre ${rr} do que fatura: <span class="b-a">${ssMes}</span> por mês, pagos por ele, de 3 em 3 meses. No primeiro ano de atividade está isento.</p>`;
export const ssBarrasAria = (inesEla: string, inesEmp: string, pedro: string) =>
  `Por cada 100 euros: a Inês desconta ${inesEla} e a empresa paga ${inesEmp}; o Pedro paga ${pedro} sozinho.`;
export const ssBarrasLegenda = "em cada 100 € de salário ou de faturação";
export const ssNomeInes = "Inês";
export const ssNomePedro = "Pedro";
export const ssEla = (v: string) => `ela ${v}`;
export const ssEmpresa = (v: string) => `empresa ${v}`;
export const ssEle = (v: string) => `ele ${v}`;

export const ssCompara = (ines: string, pedro: string, sente: string) =>
  `<p>Por cada 100 €, entram mais na Segurança Social pela Inês (${ines}) do que pelo Pedro (${pedro}). Mas a Inês só sente os ${sente} que lhe descontam; o Pedro sente tudo, porque paga do próprio bolso.</p>`;
export const ssNotaCatb = (rr: string, baseMinIas: string, baseMin: string, isencao: number) =>
  `Recibos verdes: rendimento relevante de ${rr} do faturado em serviços, com base mínima de ${baseMinIas} × IAS (${baseMin}). Isenção nos primeiros ${isencao} meses.`;

export const ssBtnVoltar = "Voltar ao bairro";
export const ssBtnOutra = "Ver outra vez";
export const ssBtnSalario = "Fazer contas com o teu salário →";
export const ssSemDados = "Os dados do salário não estão disponíveis agora.";
