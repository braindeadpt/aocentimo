# REVISÃO DE COPY V5 — aprovada pelo dono a 2026-10-06

> **Uma tabela só.** Todas as frases que o site mostra e que ainda não
> foram aprovadas pelo dono, extraídas por `node scripts/_revisao-copy.mjs`
> das fontes de verdade (`cenas/textos.ts`, `textos-p2b.ts`,
> `textos-p2c.ts`, `messages/pt.json`, `docs/NOTAS-V5.md` §Textos
> PROPOSTA e `docs/AUDITORIA-CENAS-V5.md` §2.2). **Não está escrita à
> mão** — se o texto mudar no código, corre-se o script e a tabela muda
> com ele (`--check` diz se está desactualizada, sem escrever).
>
> **Como ler.** «Onde» é `ficheiro:chave`. «Texto tal como está no site»
> é a frase com os parâmetros já virados em `{parametro}` — o número que
> lá entra em produção é o que o componente lhe passa, já formatado.
> ⚠️ **número escrito à mão**: há um número dentro da frase, à mão, sem
> fonte no código — é o risco da Regra nº1 e o ponto que mais merece
> atenção nesta revisão. A coluna da direita é para o dono: escreve
> «aprovado» ou o texto novo.
>
> Nada entra sem a coluna da direita preenchida (P4 do
> `docs/PACK-V5-PRODUCAO.md` §P4.4).

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|

**cenas P2b** (96)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 1 | `src/app/_bairro/cenas/textos-p2b.ts:corQuem` | Correios · senha A · a poupança | sem número | aprovado 2026-10-06 |
| 2 | `src/app/_bairro/cenas/textos-p2b.ts:corRotuloArte` | Dentro dos Correios: a parede de cacifos, o painel da senha, o guiché A com a funcionária atrás do vidro, o balcão com duas pilhas de notas e a Dona Arminda com a caderneta. | sem número | aprovado 2026-10-06 |
| 3 | `src/app/_bairro/cenas/textos-p2b.ts:corFala1` | Bom dia! A **poupança** é no balcão A. A Dona Arminda está à espera com a caderneta. | sem número | aprovado 2026-10-06 |
| 4 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnSenha` | Chamar a senha {senha} | parâmetro — de onde vem: CenaCorreios.tsx: T.corSenha | aprovado 2026-10-06 |
| 5 | `src/app/_bairro/cenas/textos-p2b.ts:corSenha` | A 015 | sem número | aprovado 2026-10-06 |
| 6 | `src/app/_bairro/cenas/textos-p2b.ts:corFala2` | Em {mes}, a Dona Arminda guardou **{cap}** no colchão. Hoje ainda lá estão, todos. Um palpite: | parâmetro — de onde vem: CenaCorreios.tsx: mesLongo(D.mesT0), fmtEUR0(cap0) | aprovado 2026-10-06 |
| 7 | `src/app/_bairro/cenas/textos-p2b.ts:corPalpite` | Esses {cap} compram hoje o mesmo que quanto dinheiro comprava em {mesCurto}? | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0), mesCurto(D.mesT0) | aprovado 2026-10-06 |
| 8 | `src/app/_bairro/cenas/textos-p2b.ts:corNotaExemplo` | Os {cap} são um exemplo — o que é real é quanto os preços subiram desde então. | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0) | aprovado 2026-10-06 |
| 9 | `src/app/_bairro/cenas/textos-p2b.ts:corPalpiteAria` | O teu palpite em euros | sem número | aprovado 2026-10-06 |
| 10 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnResposta` | Mostrar a resposta | sem número | aprovado 2026-10-06 |
| 11 | `src/app/_bairro/cenas/textos-p2b.ts:corJuizo` | Acertaste em cheio! / Quase! / Ainda menos! / Um pouco mais! | parâmetro — de onde vem: CenaCorreios.tsx: Math.abs(real0 - palpite), palpite, real0 | aprovado 2026-10-06 |
| 12 | `src/app/_bairro/cenas/textos-p2b.ts:corResposta` | **{juizo}** Compram o mesmo que «{real}» compravam em {mesCurto}. | parâmetro — de onde vem: CenaCorreios.tsx: juizo, fmtEUR0(real0), mesCurto(D.mesT0) | aprovado 2026-10-06 |
| 13 | `src/app/_bairro/cenas/textos-p2b.ts:corSemDados` | Os dados de inflação não estão disponíveis agora — sem eles não se mede o poder de compra. | sem número | aprovado 2026-10-06 |
| 14 | `src/app/_bairro/cenas/textos-p2b.ts:corExplica` | O dinheiro não desapareceu: **encolheu**. Os preços subiram {variacao} desde então e cada euro compra menos. Chama-se perder **poder de compra**: a linha vermelha no monte de notas marca o que ele ainda compra em {mesT1}. | parâmetro — de onde vem: CenaCorreios.tsx: D.razaoTotal === null ? "—" : pctVarTxt(D.razaoTotal), mesCurto(D.mesT1 ?? D.mesT0) | aprovado 2026-10-06 |
| 15 | `src/app/_bairro/cenas/textos-p2b.ts:corExplicaCA` | E nos **Certificados de Aforro**, a poupança do Estado que se faz nos Correios? Hoje rendem **{taxa}** por ano, mais um prémio a partir do 2.º ano, e {imposto} dos juros ficam retidos como imposto. | ⚠️ número escrito na frase: 2 | aprovado 2026-10-06 |
| 16 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnCertificados` | E se fosse para os certificados? → | sem número | aprovado 2026-10-06 |
| 17 | `src/app/_bairro/cenas/textos-p2b.ts:corFala4` | Os {cap} crescem nos certificados. Mas crescem **mais depressa do que os preços?** | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0) | aprovado 2026-10-06 |
| 18 | `src/app/_bairro/cenas/textos-p2b.ts:corExplicaLiq` | No 1.º ano, a taxa de {taxa} fica em **{liq}** depois do imposto. Se a inflação for maior do que isso, os euros aumentam mas compram menos; se for menor, ganha-se poder de compra. Experimenta: | ⚠️ número escrito na frase: 1 | aprovado 2026-10-06 |
| 19 | `src/app/_bairro/cenas/textos-p2b.ts:corNotaHipotese` | Isto é uma hipótese, não uma previsão: a taxa dos certificados muda todos os meses (hoje {taxa}, em vigor desde {vigencia}) e ninguém sabe a inflação futura. Começa com a inflação dos últimos 12 meses, {infl}. {garantia}. | ⚠️ número escrito na frase: 12 meses | aprovado 2026-10-06 |
| 20 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcAnos` | Daqui a quantos anos? | sem número | aprovado 2026-10-06 |
| 21 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcInfl` | Se a inflação fosse, por ano… | sem número | aprovado 2026-10-06 |
| 22 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcCol` | No colchão | sem número | aprovado 2026-10-06 |
| 23 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcCA` | Nos Certificados de Aforro (já sem imposto) | sem número | aprovado 2026-10-06 |
| 24 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcJur` | Juros brutos · imposto retido ({imposto}) | parâmetro — de onde vem: CenaCorreios.tsx: fmtPct(ca.imposto, 0) | aprovado 2026-10-06 |
| 25 | `src/app/_bairro/cenas/textos-p2b.ts:corAnosOut` | {n} anos | parâmetro — de onde vem: CenaCorreios.tsx: anos | aprovado 2026-10-06 |
| 26 | `src/app/_bairro/cenas/textos-p2b.ts:corCompram` | compram | sem número | aprovado 2026-10-06 |
| 27 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnGrafico` | Aprender a ler o gráfico → | sem número | aprovado 2026-10-06 |
| 28 | `src/app/_bairro/cenas/textos-p2b.ts:corFala5` | As linhas **cheias** são os euros que vês. As «tracejadas» são o que esses euros compram. | sem número | aprovado 2026-10-06 |
| 29 | `src/app/_bairro/cenas/textos-p2b.ts:corGraficoTexto` | No colchão, a linha cheia nunca se mexe: são sempre {cap}. Mas a tracejada desce todos os anos. Nos certificados, a cheia sobe; se a tracejada ficar abaixo de {cap}, a poupança está a perder para os preços. A distância entre as duas linhas é a **inflação**. | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0) | aprovado 2026-10-06 |
| 30 | `src/app/_bairro/cenas/textos-p2b.ts:corGraficoAria` | Gráfico de 15 anos: as linhas cheias são os euros que se veem, as tracejadas o que esses euros compram. Com {infl} de inflação por ano, os {cap} do colchão compram {realCol} ao fim de 15 anos; nos Certificados de Aforro, {saldoCA} que compram {realCA}. | ⚠️ número escrito na frase: 15 anos · 15 anos | aprovado 2026-10-06 |
| 31 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnVoltar` | Voltar ao bairro | sem número | aprovado 2026-10-06 |
| 32 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnOutra` | Ver outra vez | sem número | aprovado 2026-10-06 |
| 33 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnPoupanca` | Saber mais sobre poupança → | sem número | aprovado 2026-10-06 |
| 34 | `src/app/_bairro/cenas/textos-p2b.ts:bmbQuem` | Bomba de gasolina · o litro por dentro | sem número | aprovado 2026-10-06 |
| 35 | `src/app/_bairro/cenas/textos-p2b.ts:bmbRotuloArte` | Na bomba de gasolina: a pala, a bomba com o mostrador, o carro do Pedro com a prancha no tejadilho e um garrafão de um litro que se enche por camadas — o combustível e os três impostos. | sem número | aprovado 2026-10-06 |
| 36 | `src/app/_bairro/cenas/textos-p2b.ts:bmbFala1` | Imagina que o Pedro vai atestar **{litros} litros** de ${nome.toLowerCase()}, ao preço médio de hoje, **{preco}** por litro. | parâmetro — de onde vem: CenaBomba.tsx: litros, D.gasolina.nome, fmtLitro(D.gasolina.preco!) | aprovado 2026-10-06 |
| 37 | `src/app/_bairro/cenas/textos-p2b.ts:bmbPalpite` | Vai pagar **{total}**. Quanto desse dinheiro é imposto? | parâmetro — de onde vem: CenaBomba.tsx: fmtEUR(total!) | aprovado 2026-10-06 |
| 38 | `src/app/_bairro/cenas/textos-p2b.ts:bmbPalpiteAria` | O teu palpite em euros | sem número | aprovado 2026-10-06 |
| 39 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnAtestar` | Atestar e ver a resposta | sem número | aprovado 2026-10-06 |
| 40 | `src/app/_bairro/cenas/textos-p2b.ts:bmbJuizo` | Acertaste em cheio! / Quase! / Muito mais do que pensavas! / Um pouco menos! | parâmetro — de onde vem: CenaBomba.tsx: Math.abs(palpiteV - impostos), palpiteV, impostos | aprovado 2026-10-06 |
| 41 | `src/app/_bairro/cenas/textos-p2b.ts:bmbResposta` | **{juizo}** Dos {total}, «{impostos}» são impostos: «{peso}» do que pagou. | parâmetro — de onde vem: CenaBomba.tsx: juizo, fmtEUR(total), fmtEUR(impostos), fmtPct(c.dec!.pesoImpostos, 0) | aprovado 2026-10-06 |
| 42 | `src/app/_bairro/cenas/textos-p2b.ts:bmbRespostaTroca` | Com ${nome.toLowerCase()}: dos {total}, «{impostos}» são impostos: «{peso}» do que se paga. | parâmetro — de onde vem: CenaBomba.tsx: c.nome, fmtEUR(total), fmtEUR(impostos), fmtPct(c.dec!.pesoImpostos, 0) | aprovado 2026-10-06 |
| 43 | `src/app/_bairro/cenas/textos-p2b.ts:bmbSemDados` | O preço médio de hoje não está disponível — sem ele não se abre o litro. | sem número | aprovado 2026-10-06 |
| 44 | `src/app/_bairro/cenas/textos-p2b.ts:bmbExplica` | Olha para dentro de **um litro**. Por baixo, o que paga o combustível e quem o traz até à bomba. Por cima, três impostos: o «ISP», a «taxa de carbono» e o «IVA». | sem número | aprovado 2026-10-06 |
| 45 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCombustiveisAria` | Escolher o combustível | sem número | aprovado 2026-10-06 |
| 46 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamProduto` | Combustível e distribuição | sem número | aprovado 2026-10-06 |
| 47 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamIsp` | ISP | sem número | aprovado 2026-10-06 |
| 48 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamCarbono` | Taxa de carbono | sem número | aprovado 2026-10-06 |
| 49 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamIva` | IVA | sem número | aprovado 2026-10-06 |
| 50 | `src/app/_bairro/cenas/textos-p2b.ts:bmbImpostosLitro` | Impostos em cada litro | sem número | aprovado 2026-10-06 |
| 51 | `src/app/_bairro/cenas/textos-p2b.ts:bmbDeposito` | Num depósito de {litros} litros | parâmetro — de onde vem: CenaBomba.tsx: litros | aprovado 2026-10-06 |
| 52 | `src/app/_bairro/cenas/textos-p2b.ts:bmbIvaSobreImp` | Repara no tracejado dentro do IVA: são «{v}» por litro de **IVA sobre os outros impostos**. O IVA calcula-se sobre o preço que já leva o ISP e a taxa de carbono: paga-se imposto sobre imposto. | parâmetro — de onde vem: CenaBomba.tsx: eur3(d.ivaSobreImp) | aprovado 2026-10-06 |
| 53 | `src/app/_bairro/cenas/textos-p2b.ts:bmbNotaIsp` | O ISP muda por portaria, às vezes todas as semanas. Valores em vigor desde {vigencia}: {notaIsp}. Preço: média nacional da DGEG de {data}. | parâmetro — de onde vem: CenaBomba.tsx: fmtData(D.ispVigencia), c.notaIsp, fmtData(c.data ?? "") | aprovado 2026-10-06 |
| 54 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnGrafico` | Aprender a ler o gráfico → | sem número | aprovado 2026-10-06 |
| 55 | `src/app/_bairro/cenas/textos-p2b.ts:bmbFala3` | E o preço de cada dia? Aqui está desde {inicio}. Um ponto por semana, a **média do país**. | parâmetro — de onde vem: CenaBomba.tsx: inicioSerie | aprovado 2026-10-06 |
| 56 | `src/app/_bairro/cenas/textos-p2b.ts:bmbGraficoTexto` | A linha vermelha é a gasolina 95; a preta, o gasóleo. Em cada semana, o ISP e a taxa de carbono são valores fixos por litro (o ISP muda por portaria); só o IVA acompanha o preço. Por isso, na mesma semana, quando o preço sobe, a parte do imposto **pesa menos** em percentagem; quando desce, pesa mais. | ⚠️ número escrito na frase: 95 | aprovado 2026-10-06 |
| 57 | `src/app/_bairro/cenas/textos-p2b.ts:bmbNotaGrafico` | Este gráfico mostra o preço, não a parte de imposto de cada dia: só temos o ISP em vigor hoje. | sem número | aprovado 2026-10-06 |
| 58 | `src/app/_bairro/cenas/textos-p2b.ts:bmbSemSerie` | A série de preços da DGEG não está disponível agora. | sem número | aprovado 2026-10-06 |
| 59 | `src/app/_bairro/cenas/textos-p2b.ts:bmbGraficoAria` | Preço médio por litro desde {inicio}: a gasolina 95 teve o pico de {pico} em {mesPico} e o valor mais baixo de {baixo} em {mesBaixo}. | ⚠️ número escrito na frase: 95 | aprovado 2026-10-06 |
| 60 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnVoltar` | Voltar ao bairro | sem número | aprovado 2026-10-06 |
| 61 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnOutra` | Ver outra vez | sem número | aprovado 2026-10-06 |
| 62 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnPrecos` | Ver os preços todos → | sem número | aprovado 2026-10-06 |
| 63 | `src/app/_bairro/cenas/textos-p2b.ts:ssQuem` | Segurança Social · senha A · os descontos | sem número | aprovado 2026-10-06 |
| 64 | `src/app/_bairro/cenas/textos-p2b.ts:ssRotuloArte` | Dentro da Segurança Social: o guiché A, a funcionária, a Inês com o recibo e um grande mealheiro comum onde caem as moedas dos descontos dela e da empresa. | sem número | aprovado 2026-10-06 |
| 65 | `src/app/_bairro/cenas/textos-p2b.ts:ssFala1` | Bom dia! Os **descontos** são no balcão A. A Inês trouxe o recibo de vencimento. | sem número | aprovado 2026-10-06 |
| 66 | `src/app/_bairro/cenas/textos-p2b.ts:ssSenha` | A 107 | sem número | aprovado 2026-10-06 |
| 67 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnSenha` | Chamar a senha {senha} | parâmetro — de onde vem: CenaSegSocial.tsx: T.ssSenha | aprovado 2026-10-06 |
| 68 | `src/app/_bairro/cenas/textos-p2b.ts:ssFala2` | A Inês ganha **{bruto}** brutos por mês. Um palpite: | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(ines.bruto) | aprovado 2026-10-06 |
| 69 | `src/app/_bairro/cenas/textos-p2b.ts:ssPalpite` | Somando o que ela desconta e o que a empresa paga por ela, quanto entra na Segurança Social **por mês**? | sem número | aprovado 2026-10-06 |
| 70 | `src/app/_bairro/cenas/textos-p2b.ts:ssPalpiteAria` | O teu palpite em euros por mês | sem número | aprovado 2026-10-06 |
| 71 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnResposta` | Mostrar a resposta | sem número | aprovado 2026-10-06 |
| 72 | `src/app/_bairro/cenas/textos-p2b.ts:ssResposta` | **{juizo}** Entram {total}» por mês: {ano} por ano. | parâmetro — de onde vem: CenaSegSocial.tsx: juizo, fmtEUR(total), fmtEUR(total * 14) | aprovado 2026-10-06 |
| 73 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboCab` | RECIBO DA INÊS · 1 mês | ⚠️ número escrito na frase: 1 | aprovado 2026-10-06 |
| 74 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboBruto` | Salário bruto | sem número | aprovado 2026-10-06 |
| 75 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboSS` | Segurança Social ({taxa}) | parâmetro — de onde vem: CenaSegSocial.tsx: fmtPct(tx.trab, 0) | aprovado 2026-10-06 |
| 76 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboSub` | e o que não aparece no recibo | sem número | aprovado 2026-10-06 |
| 77 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboTsu` | A empresa paga por cima ({taxa}) | parâmetro — de onde vem: CenaSegSocial.tsx: fmtPct(tx.emp, 2) | aprovado 2026-10-06 |
| 78 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboTotal` | Para a Segurança Social | sem número | aprovado 2026-10-06 |
| 79 | `src/app/_bairro/cenas/textos-p2b.ts:ssExplica` | A Inês vê no recibo os **{ss}** que lhe descontam. Mas a empresa paga mais {tsu}» por ela, a chamada TSU, que nunca aparece no recibo. Por isso a Inês custa à empresa **{custo}** por mês, e não {bruto}. | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(ines.ss), fmtEUR(ines.tsu), fmtEUR(ines.custo), fmtEUR(ines.bruto) | aprovado 2026-10-06 |
| 80 | `src/app/_bairro/cenas/textos-p2b.ts:ssBolo` | Este dinheiro vai para um bolo comum que paga, por exemplo, as pensões de quem já não trabalha e os subsídios de desemprego, de doença e parentais. | sem número | aprovado 2026-10-06 |
| 81 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnPedro` | E o Pedro, a recibos verdes? → | sem número | aprovado 2026-10-06 |
| 82 | `src/app/_bairro/cenas/textos-p2b.ts:ssFala4` | O Pedro trabalha a **recibos verdes**. Não tem empresa: paga tudo sozinho. | sem número | aprovado 2026-10-06 |
| 83 | `src/app/_bairro/cenas/textos-p2b.ts:ssPedroTexto` | Se o Pedro faturar os mesmos **{fat}** por mês, desconta {taxa} sobre {rr} do que fatura: {ssMes}» por mês, pagos por ele, de 3 em 3 meses. No primeiro ano de atividade está isento ({isencao} meses). | ⚠️ número escrito na frase: 3 · 3 meses | aprovado 2026-10-06 |
| 84 | `src/app/_bairro/cenas/textos-p2b.ts:ssBarrasAria` | Por cada 100 euros: a Inês desconta {inesEla} e a empresa paga {inesEmp}; o Pedro paga {pedro} sozinho. | ⚠️ número escrito na frase: 100 euros | aprovado 2026-10-06 |
| 85 | `src/app/_bairro/cenas/textos-p2b.ts:ssBarrasLegenda` | em cada 100 € de salário ou de faturação | ⚠️ número escrito na frase: 100 | aprovado 2026-10-06 |
| 86 | `src/app/_bairro/cenas/textos-p2b.ts:ssNomeInes` | Inês | sem número | aprovado 2026-10-06 |
| 87 | `src/app/_bairro/cenas/textos-p2b.ts:ssNomePedro` | Pedro | sem número | aprovado 2026-10-06 |
| 88 | `src/app/_bairro/cenas/textos-p2b.ts:ssEla` | ela {v} | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(inesEla) | aprovado 2026-10-06 |
| 89 | `src/app/_bairro/cenas/textos-p2b.ts:ssEmpresa` | empresa {v} | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(inesEmp) | aprovado 2026-10-06 |
| 90 | `src/app/_bairro/cenas/textos-p2b.ts:ssEle` | ele {v} | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(D.pedro.por100) | aprovado 2026-10-06 |
| 91 | `src/app/_bairro/cenas/textos-p2b.ts:ssCompara` | Por cada 100 €, entram mais na Segurança Social pela Inês ({ines}) do que pelo Pedro ({pedro}). Mas a Inês só sente os {sente} que lhe descontam; o Pedro sente tudo, porque paga do próprio bolso. | ⚠️ número escrito na frase: 100 | aprovado 2026-10-06 |
| 92 | `src/app/_bairro/cenas/textos-p2b.ts:ssNotaCatb` | Recibos verdes: rendimento relevante de {rr} do faturado em serviços, com base mínima de {baseMinIas} × IAS ({baseMin}). Isenção nos primeiros {isencao} meses; os clientes retêm {retencao} na fonte (art. 151.º do CIRS). O apuramento da Segurança Social é trimestral — aqui mostra-se a média anual. IAS de {ias}. | ⚠️ número escrito na frase: 151 | aprovado 2026-10-06 |
| 93 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnVoltar` | Voltar ao bairro | sem número | aprovado 2026-10-06 |
| 94 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnOutra` | Ver outra vez | sem número | aprovado 2026-10-06 |
| 95 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnSalario` | Fazer contas com o teu salário → | sem número | aprovado 2026-10-06 |
| 96 | `src/app/_bairro/cenas/textos-p2b.ts:ssSemDados` | Os dados do salário não estão disponíveis agora. | sem número | aprovado 2026-10-06 |
**home · bairro** (89)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 97 | `messages/pt.json:bairro.selo.independente1` | Independente e gratuito. | sem número | aprovado 2026-10-06 |
| 98 | `messages/pt.json:bairro.selo.independente2` | Aqui ninguém te quer vender nada. | sem número | aprovado 2026-10-06 |
| 99 | `messages/pt.json:bairro.h1a` | O dinheiro explicado | sem número | aprovado 2026-10-06 |
| 100 | `messages/pt.json:bairro.h1b` | ao cêntimo. | sem número | aprovado 2026-10-06 |
| 101 | `messages/pt.json:bairro.intro` | Este é o bairro. Cada edifício responde a uma pergunta sobre dinheiro — com os números de hoje. Toca num para entrar. | sem número | aprovado 2026-10-06 |
| 102 | `messages/pt.json:bairro.dica.arrasta` | Arrasta para passear · roda para aproximar · | sem número | aprovado 2026-10-06 |
| 103 | `messages/pt.json:bairro.dica.fabrica` | toca na Fábrica! | sem número | aprovado 2026-10-06 |
| 104 | `messages/pt.json:bairro.mapa.descricao` | Mapa ilustrado de um bairro português visto de cima: fábrica, Segurança Social, Finanças, banco, correios e bomba de gasolina na avenida do elétrico; mercearia, pastelaria, a casa da Inês, a praça com o quiosque e a escola cá em baixo, no Cais da Ribeira, ligados à avenida por umas escadinhas; a Torre dos Clérigos lá atrás; à frente o Douro, os barcos rabelos e a Ponte D. Luís I. Cada edifício tem por cima um número real de hoje. | sem número | aprovado 2026-10-06 |
| 105 | `messages/pt.json:bairro.mapa.rotuloHora` | Hora do dia | sem número | aprovado 2026-10-06 |
| 106 | `messages/pt.json:bairro.mapa.rotuloAvenida` | Os edifícios da avenida | sem número | aprovado 2026-10-06 |
| 107 | `messages/pt.json:bairro.mapa.rotuloRibeira` | Os edifícios do Cais da Ribeira | sem número | aprovado 2026-10-06 |
| 108 | `messages/pt.json:bairro.hora.dia` | Dia | sem número | aprovado 2026-10-06 |
| 109 | `messages/pt.json:bairro.hora.tarde` | Fim de tarde | sem número | aprovado 2026-10-06 |
| 110 | `messages/pt.json:bairro.hora.noite` | Noite | sem número | aprovado 2026-10-06 |
| 111 | `messages/pt.json:bairro.zoom.mais` | Aproximar | sem número | aprovado 2026-10-06 |
| 112 | `messages/pt.json:bairro.zoom.menos` | Afastar | sem número | aprovado 2026-10-06 |
| 113 | `messages/pt.json:bairro.zoom.tudo` | Ver o bairro todo | sem número | aprovado 2026-10-06 |
| 114 | `messages/pt.json:bairro.cartao.entrar` | toca para entrar → | sem número | aprovado 2026-10-06 |
| 115 | `messages/pt.json:bairro.cartao.breve` | em breve | sem número | aprovado 2026-10-06 |
| 116 | `messages/pt.json:bairro.breve.titulo` | Em breve — este edifício ainda está em obras. | sem número | aprovado 2026-10-06 |
| 117 | `messages/pt.json:bairro.breve.fechar` | Fechar | sem número | aprovado 2026-10-06 |
| 118 | `messages/pt.json:bairro.elenco.etiqueta` | Quem vive no bairro | sem número | aprovado 2026-10-06 |
| 119 | `messages/pt.json:bairro.elenco.h2` | Escolhe a tua personagem. | sem número | aprovado 2026-10-06 |
| 120 | `messages/pt.json:bairro.elenco.lead` | O mesmo trabalho, pago de maneiras diferentes: por conta de outrem, na função pública, a recibos verdes ou com empresa própria. Cada pessoa do bairro mostra um caminho diferente do dinheiro. Toca numa para a encontrares no mapa. | sem número | aprovado 2026-10-06 |
| 121 | `messages/pt.json:bairro.elenco.notas` | De onde vêm os números do bairro: | sem número | aprovado 2026-10-06 |
| 122 | `messages/pt.json:bairro.elenco.ola` | Olá! Sou {quem}. | sem número | aprovado 2026-10-06 |
| 123 | `messages/pt.json:bairro.elenco.emBreve` | Em breve | sem número | aprovado 2026-10-06 |
| 124 | `messages/pt.json:bairro.elenco.segueDinheiro` | vais poder seguir o meu dinheiro pelo bairro. | sem número | aprovado 2026-10-06 |
| 125 | `messages/pt.json:bairro.elenco.cartas.ines.nome` | Inês | sem número | aprovado 2026-10-06 |
| 126 | `messages/pt.json:bairro.elenco.cartas.ines.papel` | Operária da fábrica | sem número | aprovado 2026-10-06 |
| 127 | `messages/pt.json:bairro.elenco.cartas.ines.perfil` | Conta de outrem · setor privado | sem número | aprovado 2026-10-06 |
| 128 | `messages/pt.json:bairro.elenco.cartas.ines.ola` | a Inês | sem número | aprovado 2026-10-06 |
| 129 | `messages/pt.json:bairro.elenco.cartas.ines.aprende` | Porque é que {bruto} brutos viram {liquido}. | sem número | aprovado 2026-10-06 |
| 130 | `messages/pt.json:bairro.elenco.cartas.diana.nome` | Diana | sem número | aprovado 2026-10-06 |
| 131 | `messages/pt.json:bairro.elenco.cartas.diana.papel` | Professora | sem número | aprovado 2026-10-06 |
| 132 | `messages/pt.json:bairro.elenco.cartas.diana.perfil` | Função pública | sem número | aprovado 2026-10-06 |
| 133 | `messages/pt.json:bairro.elenco.cartas.diana.ola` | a Diana | sem número | aprovado 2026-10-06 |
| 134 | `messages/pt.json:bairro.elenco.cartas.diana.aprende` | Descontos diferentes para o mesmo salário. | sem número | aprovado 2026-10-06 |
| 135 | `messages/pt.json:bairro.elenco.cartas.pedro.nome` | Pedro | sem número | aprovado 2026-10-06 |
| 136 | `messages/pt.json:bairro.elenco.cartas.pedro.papel` | Freelancer | sem número | aprovado 2026-10-06 |
| 137 | `messages/pt.json:bairro.elenco.cartas.pedro.perfil` | Independente · recibos verdes | sem número | aprovado 2026-10-06 |
| 138 | `messages/pt.json:bairro.elenco.cartas.pedro.ola` | o Pedro | sem número | aprovado 2026-10-06 |
| 139 | `messages/pt.json:bairro.elenco.cartas.pedro.aprende` | Segurança Social trimestral e IRS da categoria B. | sem número | aprovado 2026-10-06 |
| 140 | `messages/pt.json:bairro.elenco.cartas.manuel.nome` | Sr. Manuel | sem número | aprovado 2026-10-06 |
| 141 | `messages/pt.json:bairro.elenco.cartas.manuel.papel` | Dono da mercearia | sem número | aprovado 2026-10-06 |
| 142 | `messages/pt.json:bairro.elenco.cartas.manuel.perfil` | Pequeno empresário | sem número | aprovado 2026-10-06 |
| 143 | `messages/pt.json:bairro.elenco.cartas.manuel.ola` | o Sr. Manuel | sem número | aprovado 2026-10-06 |
| 144 | `messages/pt.json:bairro.elenco.cartas.manuel.aprende` | O IVA que cobra, a TSU que paga, o lucro da empresa. | sem número | aprovado 2026-10-06 |
| 145 | `messages/pt.json:bairro.elenco.cartas.arminda.nome` | Dona Arminda | sem número | aprovado 2026-10-06 |
| 146 | `messages/pt.json:bairro.elenco.cartas.arminda.papel` | Reformada | sem número | aprovado 2026-10-06 |
| 147 | `messages/pt.json:bairro.elenco.cartas.arminda.perfil` | Pensão e poupança | sem número | aprovado 2026-10-06 |
| 148 | `messages/pt.json:bairro.elenco.cartas.arminda.ola` | a Dona Arminda | sem número | aprovado 2026-10-06 |
| 149 | `messages/pt.json:bairro.elenco.cartas.arminda.aprende` | Quanto rende a poupança e o IRS sobre a pensão. | sem número | aprovado 2026-10-06 |
| 150 | `messages/pt.json:bairro.elenco.cartas.goncalo.nome` | Gonçalo | sem número | aprovado 2026-10-06 |
| 151 | `messages/pt.json:bairro.elenco.cartas.goncalo.papel` | Estudante, 16 anos | ⚠️ número escrito na frase: 16 anos | aprovado 2026-10-06 |
| 152 | `messages/pt.json:bairro.elenco.cartas.goncalo.perfil` | Mesada e primeiro trabalho | sem número | aprovado 2026-10-06 |
| 153 | `messages/pt.json:bairro.elenco.cartas.goncalo.ola` | o Gonçalo | sem número | aprovado 2026-10-06 |
| 154 | `messages/pt.json:bairro.elenco.cartas.goncalo.aprende` | O primeiro recibo, o IRS Jovem, a primeira conta. | sem número | aprovado 2026-10-06 |
| 155 | `messages/pt.json:bairro.elenco.cartas.rui.nome` | Rui e Marta | sem número | aprovado 2026-10-06 |
| 156 | `messages/pt.json:bairro.elenco.cartas.rui.papel` | Casal com crédito | sem número | aprovado 2026-10-06 |
| 157 | `messages/pt.json:bairro.elenco.cartas.rui.perfil` | Crédito à habitação | sem número | aprovado 2026-10-06 |
| 158 | `messages/pt.json:bairro.elenco.cartas.rui.ola` | o Rui, e esta é a Marta | sem número | aprovado 2026-10-06 |
| 159 | `messages/pt.json:bairro.elenco.cartas.rui.aprende` | A prestação, a Euribor e quanto do salário ela come. | sem número | aprovado 2026-10-06 |
| 160 | `messages/pt.json:bairro.edificios.fabrica.titulo` | Fábrica | sem número | aprovado 2026-10-06 |
| 161 | `messages/pt.json:bairro.edificios.fabrica.pergunta` | Para onde vai o teu salário? | sem número | aprovado 2026-10-06 |
| 162 | `messages/pt.json:bairro.edificios.segsocial.titulo` | Segurança Social | sem número | aprovado 2026-10-06 |
| 163 | `messages/pt.json:bairro.edificios.segsocial.pergunta` | O que são os descontos e para que servem? | sem número | aprovado 2026-10-06 |
| 164 | `messages/pt.json:bairro.edificios.financas.titulo` | Finanças | sem número | aprovado 2026-10-06 |
| 165 | `messages/pt.json:bairro.edificios.financas.pergunta` | Como funcionam os escalões do IRS? | sem número | aprovado 2026-10-06 |
| 166 | `messages/pt.json:bairro.edificios.banco.titulo` | Banco | sem número | aprovado 2026-10-06 |
| 167 | `messages/pt.json:bairro.edificios.banco.pergunta` | Quanto custa pedir dinheiro emprestado? | sem número | aprovado 2026-10-06 |
| 168 | `messages/pt.json:bairro.edificios.correios.titulo` | Correios | sem número | aprovado 2026-10-06 |
| 169 | `messages/pt.json:bairro.edificios.correios.pergunta` | Onde rende a poupança da Dona Arminda? | sem número | aprovado 2026-10-06 |
| 170 | `messages/pt.json:bairro.edificios.bomba.titulo` | Bomba de gasolina | sem número | aprovado 2026-10-06 |
| 171 | `messages/pt.json:bairro.edificios.bomba.pergunta` | Quanto do litro é imposto? | sem número | aprovado 2026-10-06 |
| 172 | `messages/pt.json:bairro.edificios.mercearia.titulo` | Mercearia do Manuel | sem número | aprovado 2026-10-06 |
| 173 | `messages/pt.json:bairro.edificios.mercearia.pergunta` | Porque está tudo mais caro? | sem número | aprovado 2026-10-06 |
| 174 | `messages/pt.json:bairro.edificios.pastelaria.titulo` | Pastelaria | sem número | aprovado 2026-10-06 |
| 175 | `messages/pt.json:bairro.edificios.pastelaria.pergunta` | Quanto subiu o café? | sem número | aprovado 2026-10-06 |
| 176 | `messages/pt.json:bairro.edificios.casa.titulo` | Casa da Inês | sem número | aprovado 2026-10-06 |
| 177 | `messages/pt.json:bairro.edificios.casa.pergunta` | Quantos meses de trabalho custa uma casa? | sem número | aprovado 2026-10-06 |
| 178 | `messages/pt.json:bairro.edificios.quiosque.titulo` | Quiosque da praça | sem número | aprovado 2026-10-06 |
| 179 | `messages/pt.json:bairro.edificios.quiosque.pergunta` | Os números do país, hoje | sem número | aprovado 2026-10-06 |
| 180 | `messages/pt.json:bairro.edificios.escola.titulo` | Escola | sem número | aprovado 2026-10-06 |
| 181 | `messages/pt.json:bairro.edificios.escola.pergunta` | Aprender a ler gráficos e as palavras do dinheiro | sem número | aprovado 2026-10-06 |
| 182 | `messages/pt.json:bairro.extra.bomba` | Hoje: gasóleo {gasoleo} e gasolina 95 {gasolina} por litro, em média. | ⚠️ número escrito na frase: 95 | aprovado 2026-10-06 |
| 183 | `messages/pt.json:bairro.extra.banco` | A Euribor a 12 meses está em {euribor}. | ⚠️ número escrito na frase: 12 meses | aprovado 2026-10-06 |
| 184 | `messages/pt.json:bairro.extra.correios` | Os Certificados de Aforro rendem {ca} (taxa base). | sem número | aprovado 2026-10-06 |
| 185 | `messages/pt.json:bairro.extra.quiosque` | Inflação: {inflacao} num ano. Desemprego: {desemprego}. | sem número | aprovado 2026-10-06 |
**`/estilo` (P3c)** (23)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 186 | `messages/pt.json:estilo.titulo` | Contrato visual «O Bairro» | sem número | aprovado 2026-10-06 |
| 187 | `messages/pt.json:estilo.nota` | Esta página é a referência do aspecto do site: as cores, a tipografia e as formas que se repetem em todas as páginas. Onde ela e as regras da casa divergirem, ganham as regras da casa. | sem número | aprovado 2026-10-06 |
| 188 | `messages/pt.json:estilo.cor` | Cor | sem número | aprovado 2026-10-06 |
| 189 | `messages/pt.json:estilo.corNota` | Cada cor tem um nome e um sítio. O verde é o que fica contigo, o vermelho é o que sai, o azul é neutro e informa. Nenhuma cor decora. | sem número | aprovado 2026-10-06 |
| 190 | `messages/pt.json:estilo.tipografia` | Tipografia | sem número | aprovado 2026-10-06 |
| 191 | `messages/pt.json:estilo.tipografiaNota` | Uma família para tudo, uma mão para os gráficos, e a monoespaçada do sistema para o talão e o recibo. Não há fonte editorial. | sem número | aprovado 2026-10-06 |
| 192 | `messages/pt.json:estilo.arquivoEixo` | O eixo da largura | sem número | aprovado 2026-10-06 |
| 193 | `messages/pt.json:estilo.arquivoEixoNota` | O mesmo Archivo aperta a manchete e alarga o número. É assim que um título se distingue de um corpo — não é outra fonte. | sem número | aprovado 2026-10-06 |
| 194 | `messages/pt.json:estilo.mao` | Caveat — a mão | sem número | aprovado 2026-10-06 |
| 195 | `messages/pt.json:estilo.maoNota` | Só nos gráficos e no quadro da escola. Nunca num número que a pessoa precise de ler já. | sem número | aprovado 2026-10-06 |
| 196 | `messages/pt.json:estilo.mono` | Monoespaçada do sistema | sem número | aprovado 2026-10-06 |
| 197 | `messages/pt.json:estilo.monoNota` | O talão e o recibo. Não descarrega nada. | sem número | aprovado 2026-10-06 |
| 198 | `messages/pt.json:estilo.forma` | Forma | sem número | aprovado 2026-10-06 |
| 199 | `messages/pt.json:estilo.pilha` | Botão em pílula | sem número | aprovado 2026-10-06 |
| 200 | `messages/pt.json:estilo.pilhaNota` | Traço de 3 px em tinta preta e sombra dura 3px 4px. Sobe ao pairar, afunda ao premir — o gesto é o mesmo de quem carrega num botão de plástico. | sem número | aprovado 2026-10-06 |
| 201 | `messages/pt.json:estilo.cartao` | Cartão | sem número | aprovado 2026-10-06 |
| 202 | `messages/pt.json:estilo.cartaoNota` | Raio de 22 px, traço de tinta, a mesma sombra dura. Nada de vidro, nada de gradiente, nada de sombra difusa. | sem número | aprovado 2026-10-06 |
| 203 | `messages/pt.json:estilo.grafico` | Gráfico | sem número | aprovado 2026-10-06 |
| 204 | `messages/pt.json:estilo.graficoNota` | Toda a figura tem um equivalente textual e é legível nos dois temas. As séries de fundo, que dão contexto, usam tons de tinta e não cor. | sem número | aprovado 2026-10-06 |
| 205 | `messages/pt.json:estilo.papel` | O papel | sem número | aprovado 2026-10-06 |
| 206 | `messages/pt.json:estilo.papelNota` | O talão é um objecto físico: não muda de cor quando se apaga a luz. O verde é o papel do que fica contigo, o vermelho o do que sai. | sem número | aprovado 2026-10-06 |
| 207 | `messages/pt.json:estilo.noite` | A noite do bairro | sem número | aprovado 2026-10-06 |
| 208 | `messages/pt.json:estilo.noiteNota` | O tema escuro não é um inverso: é o céu (#141a33) sobre o papel das janelas (#1d2442). O mesmo azul, verde e vermelho, medidos para passarem em AA sobre a noite. | sem número | aprovado 2026-10-06 |
**tema** (4)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 209 | `messages/pt.json:tema.mudarParaClaro` | Mudar para tema claro | sem número | aprovado 2026-10-06 |
| 210 | `messages/pt.json:tema.mudarParaEscuro` | Mudar para tema escuro | sem número | aprovado 2026-10-06 |
| 211 | `messages/pt.json:tema.claro` | claro | sem número | aprovado 2026-10-06 |
| 212 | `messages/pt.json:tema.escuro` | escuro | sem número | aprovado 2026-10-06 |
**volta ao bairro (P3b)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 213 | `messages/pt.json:pagina.voltarBairro` | Voltar ao bairro | sem número | aprovado 2026-10-06 |
**SEO (títulos e descrições)** (28)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 214 | `messages/pt.json:seo.rotas.salario.titulo` | Do bruto ao líquido — salário e IRS | sem número | aprovado 2026-10-06 |
| 215 | `messages/pt.json:seo.rotas.salario.descricao` | Calculadora de salário líquido em Portugal: Segurança Social, IRS por escalões, deduções e o custo real para a empresa. | sem número | aprovado 2026-10-06 |
| 216 | `messages/pt.json:seo.rotas.irs.titulo` | IRS — escalões, retenção e IRS Jovem | sem número | aprovado 2026-10-06 |
| 217 | `messages/pt.json:seo.rotas.irs.descricao` | Os escalões de IRS em Portugal, a retenção na fonte mensal e o simulador de IRS Jovem: quanto poupas em cada um dos 10 anos. | ⚠️ número escrito na frase: 10 anos | aprovado 2026-10-06 |
| 218 | `messages/pt.json:seo.rotas.impostos.titulo` | Impostos — o imposto dentro do preço | sem número | aprovado 2026-10-06 |
| 219 | `messages/pt.json:seo.rotas.impostos.descricao` | IVA por produto em Portugal e a decomposição do preço dos combustíveis: ISP, taxa de carbono e a cascata do IVA sobre impostos. | sem número | aprovado 2026-10-06 |
| 220 | `messages/pt.json:seo.rotas.poupanca.titulo` | Poupança — Certificados de Aforro, depósitos e inflação | sem número | aprovado 2026-10-06 |
| 221 | `messages/pt.json:seo.rotas.poupanca.descricao` | Como funcionam os Certificados de Aforro, a tributação de 28 % sobre juros, e porque a taxa que importa é a real, não a nominal. | ⚠️ número escrito na frase: 28 | aprovado 2026-10-06 |
| 222 | `messages/pt.json:seo.rotas.credito.titulo` | Crédito — Euribor, spread e prestação | sem número | aprovado 2026-10-06 |
| 223 | `messages/pt.json:seo.rotas.credito.descricao` | O que é a Euribor, como o spread forma a TAN, e simulador de prestação de crédito habitação com custo total do empréstimo. | sem número | aprovado 2026-10-06 |
| 224 | `messages/pt.json:seo.rotas.casa.titulo` | Comprar casa — IMT, Imposto de Selo e prestação | sem número | aprovado 2026-10-06 |
| 225 | `messages/pt.json:seo.rotas.casa.descricao` | O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual do Banco de Portugal. | sem número | aprovado 2026-10-06 |
| 226 | `messages/pt.json:seo.rotas.inflacao.titulo` | Inflação — quanto mais caro está o que compras | sem número | aprovado 2026-10-06 |
| 227 | `messages/pt.json:seo.rotas.inflacao.descricao` | IHPC em Portugal por categoria ECOICOP: alimentação, energia, habitação, transportes. Variação homóloga mensal com dados Eurostat. | sem número | aprovado 2026-10-06 |
| 228 | `messages/pt.json:seo.rotas.precos.titulo` | Preços — combustíveis dia a dia | sem número | aprovado 2026-10-06 |
| 229 | `messages/pt.json:seo.rotas.precos.descricao` | Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG. | sem número | aprovado 2026-10-06 |
| 230 | `messages/pt.json:seo.rotas.trabalho.titulo` | Subsídio de desemprego — quanto e por quanto tempo | sem número | aprovado 2026-10-06 |
| 231 | `messages/pt.json:seo.rotas.trabalho.descricao` | Simulador do subsídio de desemprego em Portugal: 65 % da remuneração de referência, limites do IAS, duração por idade e descontos. | ⚠️ número escrito na frase: 65 | aprovado 2026-10-06 |
| 232 | `messages/pt.json:seo.rotas.dados.titulo` | Dados — painéis vivos de fontes oficiais | sem número | aprovado 2026-10-06 |
| 233 | `messages/pt.json:seo.rotas.dados.descricao` | Euribor, TAEG do crédito ao consumo vs teto legal de usura, taxa base dos Certificados de Aforro e o calendário fiscal — direto das fontes oficiais. | sem número | aprovado 2026-10-06 |
| 234 | `messages/pt.json:seo.rotas.aprender.titulo` | Aprender — glossário de dinheiro | sem número | aprovado 2026-10-06 |
| 235 | `messages/pt.json:seo.rotas.aprender.descricao` | Euribor, spread, TAN, TAEG, MTIC, escalões, retenção na fonte: os termos do dinheiro em Portugal explicados em português simples, com exemplos. | sem número | aprovado 2026-10-06 |
| 236 | `messages/pt.json:seo.rotas.metodologia.titulo` | Metodologia e fontes | sem número | aprovado 2026-10-06 |
| 237 | `messages/pt.json:seo.rotas.metodologia.descricao` | De onde vêm os números do AO CÊNTIMO: fontes oficiais, frequência de atualização e limitações dos simuladores. | sem número | aprovado 2026-10-06 |
| 238 | `messages/pt.json:seo.rotas.estilo.titulo` | Sistema de design | sem número | aprovado 2026-10-06 |
| 239 | `messages/pt.json:seo.rotas.estilo.descricao` | Referência viva do design system do AO CÊNTIMO — tokens, tipografia e componentes. | sem número | aprovado 2026-10-06 |
| 240 | `messages/pt.json:seo.rotas.sobre.titulo` | Sobre | sem número | aprovado 2026-10-06 |
| 241 | `messages/pt.json:seo.rotas.sobre.descricao` | O que é o AO CÊNTIMO, porquê existe e quem o faz: um projeto pessoal, sem publicidade nem rastreamento, com o código e os dados abertos. | sem número | aprovado 2026-10-06 |
**edifícios (aria-label)** (11)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 242 | `Bairro.tsx:edificio.fabrica` | Fábrica — para onde vai o teu salário? | sem número | aprovado 2026-10-06 |
| 243 | `Bairro.tsx:edificio.segsocial` | Segurança Social — os descontos | sem número | aprovado 2026-10-06 |
| 244 | `Bairro.tsx:edificio.financas` | Finanças — os escalões do IRS | sem número | aprovado 2026-10-06 |
| 245 | `Bairro.tsx:edificio.banco` | Banco — crédito, juros e a Euribor | sem número | aprovado 2026-10-06 |
| 246 | `Bairro.tsx:edificio.correios` | Correios — os certificados de aforro | sem número | aprovado 2026-10-06 |
| 247 | `Bairro.tsx:edificio.bomba` | Bomba de gasolina — quanto do litro é imposto? | sem número | aprovado 2026-10-06 |
| 248 | `Bairro.tsx:edificio.mercearia` | Mercearia — porque está tudo mais caro? | sem número | aprovado 2026-10-06 |
| 249 | `Bairro.tsx:edificio.pastelaria` | Pastelaria — o café e o pastel | sem número | aprovado 2026-10-06 |
| 250 | `Bairro.tsx:edificio.casa` | Casa da Inês — o que chega ao fim do mês | sem número | aprovado 2026-10-06 |
| 251 | `Bairro.tsx:edificio.quiosque` | Quiosque — os números do país hoje | sem número | aprovado 2026-10-06 |
| 252 | `Bairro.tsx:edificio.escola` | Escola — as palavras do dinheiro | sem número | aprovado 2026-10-06 |
**marcadores do mapa** (13)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 253 | `src/lib/bairro/planta.ts:rótulo` | Salário bruto | sem número | aprovado 2026-10-06 |
| 254 | `src/lib/bairro/planta.ts:rótulo` | TSU da empresa | sem número | aprovado 2026-10-06 |
| 255 | `src/lib/bairro/planta.ts:rótulo` | IRS retido / mês | sem número | aprovado 2026-10-06 |
| 256 | `src/lib/bairro/planta.ts:rótulo` | Euribor 12 meses | sem número | aprovado 2026-10-06 |
| 257 | `src/lib/bairro/planta.ts:rótulo` | Cert. de Aforro | sem número | aprovado 2026-10-06 |
| 258 | `src/lib/bairro/planta.ts:rótulo` | Gasóleo · hoje | sem número | aprovado 2026-10-06 |
| 259 | `src/lib/bairro/planta.ts:rótulo` | Gasolina 95 | sem número | aprovado 2026-10-06 |
| 260 | `src/lib/bairro/planta.ts:rótulo` | Cabaz desde 2020 | sem número | aprovado 2026-10-06 |
| 261 | `src/lib/bairro/planta.ts:rótulo` | Cafés desde 2020 | sem número | aprovado 2026-10-06 |
| 262 | `src/lib/bairro/planta.ts:rótulo` | Chega à conta | sem número | aprovado 2026-10-06 |
| 263 | `src/lib/bairro/planta.ts:rótulo` | Inflação · 12 meses | sem número | aprovado 2026-10-06 |
| 264 | `src/lib/bairro/planta.ts:rótulo` | Desemprego | sem número | aprovado 2026-10-06 |
| 265 | `src/lib/bairro/planta.ts:rótulo` | Pergunta do dia | sem número | aprovado 2026-10-06 |
**letreiros desenhados** (22)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 266 | `src/lib/bairro/planta.ts:letreiro` | FÁBRICA | sem número | aprovado 2026-10-06 |
| 267 | `src/lib/bairro/planta.ts:letreiro` | FIAÇÃO DO DOURO | sem número | aprovado 2026-10-06 |
| 268 | `src/lib/bairro/planta.ts:letreiro` | SEGURANÇA SOCIAL | sem número | aprovado 2026-10-06 |
| 269 | `src/lib/bairro/planta.ts:letreiro` | FINANÇAS | sem número | aprovado 2026-10-06 |
| 270 | `src/lib/bairro/planta.ts:letreiro` | BANCO | sem número | aprovado 2026-10-06 |
| 271 | `src/lib/bairro/planta.ts:letreiro` | CORREIOS | sem número | aprovado 2026-10-06 |
| 272 | `src/lib/bairro/planta.ts:letreiro` | MERCEARIA | sem número | aprovado 2026-10-06 |
| 273 | `src/lib/bairro/planta.ts:letreiro` | PASTELARIA | sem número | aprovado 2026-10-06 |
| 274 | `src/lib/bairro/planta.ts:letreiro` | ESCOLA | sem número | aprovado 2026-10-06 |
| 275 | `src/lib/bairro/planta.ts:letreiro` | JORNAIS | sem número | aprovado 2026-10-06 |
| 276 | `src/lib/bairro/planta.ts:letreiro` | COMBUSTÍVEIS | sem número | aprovado 2026-10-06 |
| 277 | `src/lib/bairro/planta.ts:letreiro` | LOJA | sem número | aprovado 2026-10-06 |
| 278 | `src/lib/bairro/planta.ts:letreiro` | CAFÉ | sem número | aprovado 2026-10-06 |
| 279 | `src/lib/bairro/planta.ts:letreiro` | VINHO DO PORTO | sem número | aprovado 2026-10-06 |
| 280 | `src/lib/bairro/planta.ts:letreiro` | CAVES | sem número | aprovado 2026-10-06 |
| 281 | `src/lib/bairro/planta.ts:letreiro` | GASÓLEO | sem número | aprovado 2026-10-06 |
| 282 | `src/lib/bairro/planta.ts:letreiro` | GASOLINA 95 | sem número | aprovado 2026-10-06 |
| 283 | `src/lib/bairro/planta.ts:letreiro` | € por litro | sem número | aprovado 2026-10-06 |
| 284 | `src/lib/bairro/planta.ts:letreiro` | 22 | sem número | aprovado 2026-10-06 |
| 285 | `src/lib/bairro/planta.ts:letreiro` | cafe | sem número | aprovado 2026-10-06 |
| 286 | `src/lib/bairro/planta.ts:letreiro` | o que é a inflação? | sem número | aprovado 2026-10-06 |
| 287 | `src/lib/bairro/planta.ts:letreiro` | 24 | sem número | aprovado 2026-10-06 |
**cartas · nome** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 288 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Nome | sem número | aprovado 2026-10-06 |
| 289 | `messages/pt.json:bairro.elenco.cartas.*.nome` | --- | sem número | aprovado 2026-10-06 |
| 290 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Inês | sem número | aprovado 2026-10-06 |
| 291 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Diana | sem número | aprovado 2026-10-06 |
| 292 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Pedro | sem número | aprovado 2026-10-06 |
| 293 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Sr. Manuel | sem número | aprovado 2026-10-06 |
| 294 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Dona Arminda | sem número | aprovado 2026-10-06 |
| 295 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Gonçalo | sem número | aprovado 2026-10-06 |
| 296 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Rui e Marta | sem número | aprovado 2026-10-06 |
**cartas · papel** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 297 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Papel | sem número | aprovado 2026-10-06 |
| 298 | `messages/pt.json:bairro.elenco.cartas.*.papel` | --- | sem número | aprovado 2026-10-06 |
| 299 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Operária da fábrica | sem número | aprovado 2026-10-06 |
| 300 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Professora | sem número | aprovado 2026-10-06 |
| 301 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Freelancer | sem número | aprovado 2026-10-06 |
| 302 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Dono da mercearia | sem número | aprovado 2026-10-06 |
| 303 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Reformada | sem número | aprovado 2026-10-06 |
| 304 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Estudante, 16 anos | sem número | aprovado 2026-10-06 |
| 305 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Casal com crédito | sem número | aprovado 2026-10-06 |
**cartas · perfil** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 306 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Perfil | sem número | aprovado 2026-10-06 |
| 307 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | --- | sem número | aprovado 2026-10-06 |
| 308 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Conta de outrem · setor privado | sem número | aprovado 2026-10-06 |
| 309 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Função pública | sem número | aprovado 2026-10-06 |
| 310 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Independente · recibos verdes | sem número | aprovado 2026-10-06 |
| 311 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Pequeno empresário | sem número | aprovado 2026-10-06 |
| 312 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Pensão e poupança | sem número | aprovado 2026-10-06 |
| 313 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Mesada e primeiro trabalho | sem número | aprovado 2026-10-06 |
| 314 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Crédito à habitação | sem número | aprovado 2026-10-06 |
**cartas · aprende** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 315 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O que aprende | sem número | aprovado 2026-10-06 |
| 316 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | --- | sem número | aprovado 2026-10-06 |
| 317 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Porque é que 1 500 € brutos viram 1 167 €. ⚠️ ver dúvida 1 | ⚠️ número escrito na frase: 1 500 · 1 167 · 1 | aprovado 2026-10-06 |
| 318 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Descontos diferentes para o mesmo salário. | sem número | aprovado 2026-10-06 |
| 319 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Segurança Social trimestral e IRS da categoria B. | sem número | aprovado 2026-10-06 |
| 320 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O IVA que cobra, a TSU que paga, o lucro da empresa. | sem número | aprovado 2026-10-06 |
| 321 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Quanto rende a poupança e o IRS sobre a pensão. | sem número | aprovado 2026-10-06 |
| 322 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O primeiro recibo, o IRS Jovem, a primeira conta. | sem número | aprovado 2026-10-06 |
| 323 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | A prestação, a Euribor e quanto do salário ela come. | sem número | aprovado 2026-10-06 |
**controlos da home** (6)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 324 | `messages/pt.json:bairro.*` | Dia | sem número | aprovado 2026-10-06 |
| 325 | `messages/pt.json:bairro.*` | Fim de tarde | sem número | aprovado 2026-10-06 |
| 326 | `messages/pt.json:bairro.*` | Noite | sem número | aprovado 2026-10-06 |
| 327 | `messages/pt.json:bairro.*` | Ver a tabela dos escalões | sem número | aprovado 2026-10-06 |
| 328 | `messages/pt.json:bairro.*` | Fechar | sem número | aprovado 2026-10-06 |
| 329 | `messages/pt.json:bairro.*` | Em breve | sem número | aprovado 2026-10-06 |
**home · Selo** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 330 | `messages/pt.json:bairro.*` | Independente e gratuito. Aqui ninguém te quer vender nada. | sem número | aprovado 2026-10-06 |
**home · Título (h1)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 331 | `messages/pt.json:bairro.*` | O dinheiro explicado ao cêntimo. | sem número | aprovado 2026-10-06 |
**home · Introdução** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 332 | `messages/pt.json:bairro.*` | Este é o bairro. Cada edifício responde a uma pergunta sobre dinheiro — com os números de hoje. Toca num para entrar. | sem número | aprovado 2026-10-06 |
**home · Selo de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 333 | `messages/pt.json:bairro.*` | Quem vive no bairro | sem número | aprovado 2026-10-06 |
**home · Título de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 334 | `messages/pt.json:bairro.*` | Escolhe a tua personagem. | sem número | aprovado 2026-10-06 |
**home · Entrada de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 335 | `messages/pt.json:bairro.*` | O mesmo trabalho, pago de maneiras diferentes: por conta de outrem, na função pública, a recibos verdes ou com empresa própria. Cada pessoa do bairro mostra um caminho diferente do dinheiro. Toca numa para a encontrares no mapa. | sem número | aprovado 2026-10-06 |
**home · Dica do mapa** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 336 | `messages/pt.json:bairro.*` | Arrasta para passear · roda para aproximar · toca na Fábrica! | sem número | aprovado 2026-10-06 |
**proposta de alteração (P1)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 337 | `docs/AUDITORIA-CENAS-V5.md §2.2` | `textos-p2c.ts:40-41` — «quase o dobro» hardcoded. | proposta da auditoria | aplicada no #68 (a comparação «quase o dobro» foi retirada) |
**proposta de alteração (P2)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 338 | `docs/AUDITORIA-CENAS-V5.md §2.2` | Bomba, 50 litros sem «exemplo». | proposta da auditoria | aplicada: «Imagina que o Pedro vai atestar 50 litros» |
**proposta de alteração (P3)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 339 | `docs/AUDITORIA-CENAS-V5.md §2.2` | `irs-2026.json` fonte. | proposta da auditoria | em aberto: é metadado do irs-2026.json, não copy do site |

---

**Total: 339 frases.** As marcadas com ⚠️ têm um número escrito à mão
dentro do texto — se a lei, a série ou a portaria mudar, a frase mente em
silêncio. As que têm `{parametro}` recebem o valor do servidor e
mostram a fonte no rodapé da cena; as restantes são palavras.

_(Regenerar: `node scripts/_revisao-copy.mjs`. Verificar sem escrever:
`node scripts/_revisao-copy.mjs --check`.)_
