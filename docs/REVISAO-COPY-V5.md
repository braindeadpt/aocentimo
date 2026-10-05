# REVISÃO DE COPY V5 — o que o dono tem de aprovar antes do lançamento

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

**cenas P2a** (98)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 1 | `src/app/_bairro/cenas/textos.ts:fechar` | Voltar ao bairro | sem número |  |
| 2 | `src/app/_bairro/cenas/textos.ts:saltar` | Saltar para o fim | sem número |  |
| 3 | `src/app/_bairro/cenas/textos.ts:aCarregar` | A ir buscar os números… | sem número |  |
| 4 | `src/app/_bairro/cenas/textos.ts:falhaAoCarregar` | Os números desta cena não chegaram. Fecha e tenta outra vez. | sem número |  |
| 5 | `src/app/_bairro/cenas/textos.ts:finQuem` | Finanças · balcão A · o IRS em gavetas | sem número |  |
| 6 | `src/app/_bairro/cenas/textos.ts:finRotuloArte` | Dentro das Finanças: o balcão A, a máquina das senhas, o funcionário, a Inês e a cómoda com uma gaveta por cada escalão do IRS. | sem número |  |
| 7 | `src/app/_bairro/cenas/textos.ts:finFala1` | Bem-vindo às Finanças. Para o IRS é o balcão A: tira a tua senha. | sem número |  |
| 8 | `src/app/_bairro/cenas/textos.ts:finBtnSenha` | Tirar senha | sem número |  |
| 9 | `src/app/_bairro/cenas/textos.ts:finFala2` | Senha {senha}, faz favor! Antes de começarmos, um palpite: | parâmetro — de onde vem: CenaFinancas.tsx: "A 023" |  |
| 10 | `src/app/_bairro/cenas/textos.ts:finPalpite` | A Inês foi aumentada de {de} para {para} brutos por mês e passou do {g0} para o {g1} escalão do IRS. No fim do ano, fica com… | parâmetro — de onde vem: CenaFinancas.tsx: fmtEUR(1500), fmtEUR(1650), ordinal(g0.k + 1), ordinal(g1.k + 1) |  |
| 11 | `src/app/_bairro/cenas/textos.ts:finBtnMenos` | menos dinheiro | sem número |  |
| 12 | `src/app/_bairro/cenas/textos.ts:finBtnIgual` | o mesmo | sem número |  |
| 13 | `src/app/_bairro/cenas/textos.ts:finBtnMais` | mais dinheiro | sem número |  |
| 14 | `src/app/_bairro/cenas/textos.ts:finAcertou` | Acertaste. | sem número |  |
| 15 | `src/app/_bairro/cenas/textos.ts:finAfinalNao` | Afinal não. | sem número |  |
| 16 | `src/app/_bairro/cenas/textos.ts:finResposta` | Fica com mais {ganho} por ano. | parâmetro — de onde vem: CenaFinancas.tsx: ganho |  |
| 17 | `src/app/_bairro/cenas/textos.ts:finExplica` | Os escalões são gavetas. O rendimento enche-as de baixo para cima, e a taxa de cada gaveta só se aplica ao que está lá dentro. Com o aumento, só {dentro} entraram na {gaveta} gaveta. Só esses pagam {taxa}; tudo o que já estava nas gavetas de baixo paga o mesmo que antes. Dos {aum} a mais por ano, {irs} vão para o IRS e {ss} para a Segurança Social. | parâmetro — de onde vem: CenaFinancas.tsx: ordinal(g1.k + 1), fmtEUR(g1.dentro), pctTaxa(g1.taxa), fmtEUR(150 * 14), fmtEUR(irsPorEscaloes(D.escaloes, c1) - irsPorEscaloes(D.escaloes, c0)), fmtEUR(150 * 14 * D.ssTaxa) |  |
| 18 | `src/app/_bairro/cenas/textos.ts:finAntes` | Inês antes: {v} | parâmetro — de onde vem: CenaFinancas.tsx: fmtEUR(1500) |  |
| 19 | `src/app/_bairro/cenas/textos.ts:finDepois` | Inês depois: {v} | parâmetro — de onde vem: CenaFinancas.tsx: fmtEUR(1650) |  |
| 20 | `src/app/_bairro/cenas/textos.ts:finCalcRotulo` | Experimenta: salário bruto por mês | sem número |  |
| 21 | `src/app/_bairro/cenas/textos.ts:finCalcCol` | Rendimento coletável por ano | sem número |  |
| 22 | `src/app/_bairro/cenas/textos.ts:finCalcIrs` | IRS pelos escalões, por ano | sem número |  |
| 23 | `src/app/_bairro/cenas/textos.ts:finCalcMarg` | Taxa da gaveta mais alta | sem número |  |
| 24 | `src/app/_bairro/cenas/textos.ts:finCalcMed` | Taxa média (o que pagas mesmo) | sem número |  |
| 25 | `src/app/_bairro/cenas/textos.ts:finFala4` | Quando ouvires «estou no escalão dos {degrau}», isso é o degrau. O que pagas mesmo é a curva. | parâmetro — de onde vem: CenaFinancas.tsx: gV ? pctTaxa(gV.taxa) : "—" |  |
| 26 | `src/app/_bairro/cenas/textos.ts:finGraficoAria` | Gráfico: a taxa do escalão sobe aos degraus, a taxa média sobe devagar e fica sempre abaixo. | sem número |  |
| 27 | `src/app/_bairro/cenas/textos.ts:finGraficoTexto` | A Inês está no degrau dos {degrau}, mas paga em média {media} do rendimento coletável. A curva está sempre abaixo do degrau e nunca dá saltos, porque cada gaveta nova só apanha o dinheiro a mais. | parâmetro — de onde vem: CenaFinancas.tsx: gV ? pctTaxa(gV.taxa) : "—", cV > 0 ? pctTaxa(medV) : "—" |  |
| 28 | `src/app/_bairro/cenas/textos.ts:finNotaRodape` | Este é o IRS calculado só pelos escalões. Depois ainda se descontam as deduções à coleta: com as despesas gerais familiares, a Inês paga {motor} por ano, o mesmo que o simulador do AO CÊNTIMO calcula. Nos rendimentos mais baixos, o mínimo de existência ainda baixa o imposto. O que se retém todos os meses é um adiantamento: o valor final acerta-se na declaração anual. | parâmetro — de onde vem: CenaFinancas.tsx: D.motorIrsAnual === null ? "—" : fmtEUR(D.motorIrsAnual) |  |
| 29 | `src/app/_bairro/cenas/textos.ts:finBtnGrafico` | Aprender a ler o gráfico | sem número |  |
| 30 | `src/app/_bairro/cenas/textos.ts:finBtnVoltar` | Voltar ao bairro | sem número |  |
| 31 | `src/app/_bairro/cenas/textos.ts:finBtnOutra` | Ver outra vez | sem número |  |
| 32 | `src/app/_bairro/cenas/textos.ts:banQuem` | Banco · balcão A · o crédito à habitação | sem número |  |
| 33 | `src/app/_bairro/cenas/textos.ts:banRotuloArte` | Dentro do banco: o quadro da Euribor com letras que viram, o cofre, o gerente atrás do balcão e o Rui com a Marta à frente. | sem número |  |
| 34 | `src/app/_bairro/cenas/textos.ts:banFala1` | Bom dia! O crédito à habitação é no balcão A. O Rui e a Marta já tiraram a senha. | sem número |  |
| 35 | `src/app/_bairro/cenas/textos.ts:banBtnSenha` | Chamar a senha A 041 | sem número |  |
| 36 | `src/app/_bairro/cenas/textos.ts:banFala2` | O Rui e a Marta querem pedir {capital} a {anos} anos para comprar casa. Um palpite antes: | parâmetro — de onde vem: CenaBanco.tsx: fmtEUR(exemplo.capital), exemplo.anos |  |
| 37 | `src/app/_bairro/cenas/textos.ts:banPalpite` | Em {mesA}, a prestação deste empréstimo seria de {prestA} por mês. E se o pedissem em {mesB}, pela mesma casa? | parâmetro — de onde vem: CenaBanco.tsx: mesLongo(a.t), fmtEUR(pa), mesLongo(b.t) |  |
| 38 | `src/app/_bairro/cenas/textos.ts:banPalpiteAria` | O teu palpite em euros por mês | sem número |  |
| 39 | `src/app/_bairro/cenas/textos.ts:banNotaExemplo` | Exemplo com spread de {spread}. Só a Euribor é um dado real (BPstat). | parâmetro — de onde vem: CenaBanco.tsx: pct2(exemplo.spread) |  |
| 40 | `src/app/_bairro/cenas/textos.ts:banBtnResposta` | Mostrar a resposta | sem número |  |
| 41 | `src/app/_bairro/cenas/textos.ts:banResposta` | {juizo} Em {mesB} seria {prestB} por mês: mais {dif} do que em {mesA}. | parâmetro — de onde vem: CenaBanco.tsx: juizo, mesLongo(b.t), fmtEUR(pb), mesLongo(a.t), fmtEUR(pb - pa) |  |
| 42 | `src/app/_bairro/cenas/textos.ts:banExplica` | A casa é a mesma, o dinheiro pedido é o mesmo e o banco não mudou nada. Mudou a Euribor: de {eA} para {eB}. A taxa do empréstimo é a Euribor mais o spread, a parte fixa que o banco cobra. Arrasta pelo tempo e vê o quadro e a prestação a mudar. Repara também na barra: quando a taxa sobe, quase toda a primeira prestação vai para juros. | parâmetro — de onde vem: CenaBanco.tsx: pct2(a.v), pct2(b.v) |  |
| 43 | `src/app/_bairro/cenas/textos.ts:banGraficoAria` | Dois gráficos com o mesmo tempo, de 2019 até hoje: em cima a Euribor a 12 meses e a taxa do empréstimo; em baixo a prestação, que sobe e desce com a Euribor. | ⚠️ número escrito na frase: 12 meses |  |
| 44 | `src/app/_bairro/cenas/textos.ts:banFala4` | Dois gráficos, o mesmo tempo. Quando a linha azul sobe, a vermelha sobe logo atrás. | sem número |  |
| 45 | `src/app/_bairro/cenas/textos.ts:banGraficoTexto` | Em cima, a Euribor e, a tracejado, a taxa do empréstimo; a faixa amarela entre as duas é o spread. Em baixo, a prestação. Hoje ({hoje}), a Euribor está em {eur} e a prestação do exemplo seria de {prest}. | parâmetro — de onde vem: CenaBanco.tsx: mesLongo(hoje.t), pct2(hoje.v), fmtEUR(ph) |  |
| 46 | `src/app/_bairro/cenas/textos.ts:banNotaGrafico` | Para comparar, cada ponto é um empréstimo novo feito nesse mês. Num contrato a sério, a taxa revê-se de 3, 6 ou 12 em 12 meses sobre a dívida que falta pagar. Imposto do Selo, seguros e comissões não estão incluídos. | ⚠️ número escrito na frase: 3, 6 · 12 · 12 meses |  |
| 47 | `src/app/_bairro/cenas/textos.ts:banCalcTempo` | Se pedissem o empréstimo em… | sem número |  |
| 48 | `src/app/_bairro/cenas/textos.ts:banCalcEur` | Euribor a 12 meses | ⚠️ número escrito na frase: 12 meses |  |
| 49 | `src/app/_bairro/cenas/textos.ts:banCalcTan` | Taxa do empréstimo (Euribor + spread) | sem número |  |
| 50 | `src/app/_bairro/cenas/textos.ts:banCalcPrest` | Prestação por mês | sem número |  |
| 51 | `src/app/_bairro/cenas/textos.ts:banCalcJuros` | Da 1.ª prestação, juros | ⚠️ número escrito na frase: 1 |  |
| 52 | `src/app/_bairro/cenas/textos.ts:banJurosDe` | {juros} de {prest} | parâmetro — de onde vem: CenaBanco.tsx: fmtEUR(Math.max(0, juro1a)), fmtEUR(prK) |  |
| 53 | `src/app/_bairro/cenas/textos.ts:banRotJuros` | juros | sem número |  |
| 54 | `src/app/_bairro/cenas/textos.ts:banRotCasa` | paga a casa | sem número |  |
| 55 | `src/app/_bairro/cenas/textos.ts:banExemplo` | Exemplo: {capital} a {anos} anos, spread de {spread}. Mudar | parâmetro — de onde vem: CenaBanco.tsx: fmtEUR(exemplo.capital), exemplo.anos, pct2(exemplo.spread) |  |
| 56 | `src/app/_bairro/cenas/textos.ts:banExemploCap` | Montante | sem número |  |
| 57 | `src/app/_bairro/cenas/textos.ts:banExemploAnos` | {n} anos | parâmetro — de onde vem: CenaBanco.tsx: exemplo.anos |  |
| 58 | `src/app/_bairro/cenas/textos.ts:banExemploSpread` | Spread | sem número |  |
| 59 | `src/app/_bairro/cenas/textos.ts:mercQuem` | Mercearia do Sr. Manuel · a inflação e o IVA | sem número |  |
| 60 | `src/app/_bairro/cenas/textos.ts:mercRotuloArte` | Dentro da mercearia: duas prateleiras com pão, leite, carne, peixe, fruta, legumes, azeite e açúcar, cada uma com a etiqueta «1 € em 2020», o balcão com a caixa registadora e o Sr. Manuel. | ⚠️ número escrito na frase: 1 |  |
| 61 | `src/app/_bairro/cenas/textos.ts:mercFala1` | Bom dia! Em {mes}, este saco de compras custava 10 €. Quanto custa hoje o mesmo saco? | ⚠️ número escrito na frase: 10 |  |
| 62 | `src/app/_bairro/cenas/textos.ts:mercPalpiteAria` | O teu palpite em euros | sem número |  |
| 63 | `src/app/_bairro/cenas/textos.ts:mercBtnResposta` | Mostrar a resposta | sem número |  |
| 64 | `src/app/_bairro/cenas/textos.ts:mercResposta` | {juizo} Hoje o mesmo saco custa {real}. Isto chama-se inflação. | parâmetro — de onde vem: CenaMercearia.tsx: juizo, `${fmtNum(realSaco, 2)} €` |  |
| 65 | `src/app/_bairro/cenas/textos.ts:mercExplica` | A comida subiu {comida} desde {mes}; tudo o que compramos, em média, subiu {total}. Mas cada prateleira subiu à sua maneira: as etiquetas dizem quanto custa hoje o que custava 1 € em 2020. | ⚠️ número escrito na frase: 1 |  |
| 66 | `src/app/_bairro/cenas/textos.ts:mercEtiquetaHoje` | {v} hoje | sem número |  |
| 67 | `src/app/_bairro/cenas/textos.ts:mercEtiquetaAntes` | 1 € em 2020 | ⚠️ número escrito na frase: 1 |  |
| 68 | `src/app/_bairro/cenas/textos.ts:mercSubidaLegenda` | tudo o que compramos (inflação geral): {total} | sem número |  |
| 69 | `src/app/_bairro/cenas/textos.ts:mercFala3` | Um índice é uma régua de preços. Aqui, 100 é o preço em {mes}. | ⚠️ número escrito na frase: 100 |  |
| 70 | `src/app/_bairro/cenas/textos.ts:mercGraficoAria` | Índice de preços de {nome}, com 100 no preço de {mes}: hoje vale {hoje}. A inflação geral, a tracejado, vale {geral}. | ⚠️ número escrito na frase: 100 |  |
| 71 | `src/app/_bairro/cenas/textos.ts:mercGraficoTexto` | A linha vermelha é ${nome.toLowerCase()}: começa em 100 e hoje vale {hoje}, ou seja, está {variacao} mais caro. A tracejado, a inflação geral. Quando a vermelha fica por cima, esse produto subiu mais do que o resto. | ⚠️ número escrito na frase: 100 |  |
| 72 | `src/app/_bairro/cenas/textos.ts:mercNotaIndice` | São índices, não preços: dizem quanto subiu, não quanto custa um quilo. Cada produto é uma família do índice europeu de preços (por exemplo, «cereais e derivados» inclui pão, arroz e massa). | sem número |  |
| 73 | `src/app/_bairro/cenas/textos.ts:mercEscolherAria` | Escolher o produto | sem número |  |
| 74 | `src/app/_bairro/cenas/textos.ts:mercBtnIva` | Ver o IVA no talão | sem número |  |
| 75 | `src/app/_bairro/cenas/textos.ts:mercFala4` | E há uma parte de cada compra que vai para o Estado: o IVA. Já vem dentro do preço. | sem número |  |
| 76 | `src/app/_bairro/cenas/textos.ts:mercIvaTexto` | O IVA tem três taxas. Os alimentos básicos da lista I do Código do IVA, como o pão, o leite, a fruta e os legumes, pagam a reduzida, {red}: em cada 10 € ficam {em10Red} para o Estado. As conservas e o vinho pagam a intermédia, {inter}. Tudo o que não está nas listas do Código do IVA paga a normal, {norm}: {em10Norm} em cada 10 €. | ⚠️ número escrito na frase: 10 · 10 |  |
| 77 | `src/app/_bairro/cenas/textos.ts:mercIvaNota` | * Taxa normal: o que não está nas listas I e II do Código do IVA (art. 18.º). Os exemplos são indicativos; as listas definem o enquadramento exato de cada produto. {regiao}. | ⚠️ número escrito na frase: 18 |  |
| 78 | `src/app/_bairro/cenas/textos.ts:mercTalaoAria` | Talão de exemplo: por cada 10 euros em pão, leite e fruta e legumes, {em10Red} são IVA; em conservas e vinho, {em10Inter}; nos outros produtos, {em10Norm}. | ⚠️ número escrito na frase: 10 euros |  |
| 79 | `src/app/_bairro/cenas/textos.ts:mercTalaoCab` | MERCEARIA DO MANUEL | sem número |  |
| 80 | `src/app/_bairro/cenas/textos.ts:mercTalaoSub` | por cada 10,00 € que pagas em… | ⚠️ número escrito na frase: 10,00 |  |
| 81 | `src/app/_bairro/cenas/textos.ts:mercTalaoTotal` | TOTAL | sem número |  |
| 82 | `src/app/_bairro/cenas/textos.ts:mercTalaoIvaIncluido` | IVA incluído no preço | sem número |  |
| 83 | `src/app/_bairro/cenas/textos.ts:mercTalaoIvaTotal` | IVA total | sem número |  |
| 84 | `src/app/_bairro/cenas/textos.ts:fabQuem` | A fábrica · o salário da Inês | sem número |  |
| 85 | `src/app/_bairro/cenas/textos.ts:fabFala` | A empresa da Inês gasta {custo} por mês com ela. Cada moeda é uma fatia. Segue-as pelo bairro! | parâmetro — de onde vem: CenaFabrica.tsx: fmtEUR(l.custo) |  |
| 86 | `src/app/_bairro/cenas/textos.ts:fabFalaSS` | Primeiro, {ss} entram na Segurança Social: {tsu} pagos pela empresa (a TSU) e {ssInes} descontados à Inês. | parâmetro — de onde vem: CenaFabrica.tsx: fmtEUR(l.tsu + l.ss), fmtEUR(l.tsu), fmtEUR(l.ss) |  |
| 87 | `src/app/_bairro/cenas/textos.ts:fabFalaIrs` | Depois, {irs} ficam nas Finanças — o IRS retido todos os meses, um adiantamento que se acerta na declaração anual. | parâmetro — de onde vem: CenaFabrica.tsx: fmtEUR(l.irs) |  |
| 88 | `src/app/_bairro/cenas/textos.ts:fabFalaRua` | O resto desce a rua com a Inês até casa… | sem número |  |
| 89 | `src/app/_bairro/cenas/textos.ts:fabFalaCasa` | Chegam a casa da Inês {liq}. De cada euro que a empresa gasta, {fica} cêntimos chegam à conta dela. | parâmetro — de onde vem: CenaFabrica.tsx: fmtEUR(l.liquido), fmtNumFica(l.fica) |  |
| 90 | `src/app/_bairro/cenas/textos.ts:fabSemDados` | Os dados do salário não estão disponíveis agora. | sem número |  |
| 91 | `src/app/_bairro/cenas/textos.ts:fabContAria` | O percurso do salário até agora | sem número |  |
| 92 | `src/app/_bairro/cenas/textos.ts:finPalpiteAria` | O teu palpite | sem número |  |
| 93 | `src/app/_bairro/cenas/textos.ts:finGavetasAria` | Ver as gavetas da Inês | sem número |  |
| 94 | `src/app/_bairro/cenas/textos.ts:fabContSS` | Seg. Social: {v} | parâmetro — de onde vem: CenaFabrica.tsx: fmtEUR(totais.ss) |  |
| 95 | `src/app/_bairro/cenas/textos.ts:fabContIrs` | IRS: {v} | parâmetro — de onde vem: CenaFabrica.tsx: fmtEUR(totais.irs) |  |
| 96 | `src/app/_bairro/cenas/textos.ts:fabContCasa` | Chega a casa: {v} | parâmetro — de onde vem: CenaFabrica.tsx: fmtEUR(totais.casa) |  |
| 97 | `src/app/_bairro/cenas/textos.ts:fabBtnOutra` | Ver outra vez | sem número |  |
| 98 | `src/app/_bairro/cenas/textos.ts:fabBtnSimulador` | Fazer com o meu salário | sem número |  |
**cenas P2b** (96)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 99 | `src/app/_bairro/cenas/textos-p2b.ts:corQuem` | Correios · senha A · a poupança | sem número |  |
| 100 | `src/app/_bairro/cenas/textos-p2b.ts:corRotuloArte` | Dentro dos Correios: a parede de cacifos, o painel da senha, o guiché A com a funcionária atrás do vidro, o balcão com duas pilhas de notas e a Dona Arminda com a caderneta. | sem número |  |
| 101 | `src/app/_bairro/cenas/textos-p2b.ts:corFala1` | Bom dia! A **poupança** é no balcão A. A Dona Arminda está à espera com a caderneta. | sem número |  |
| 102 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnSenha` | Chamar a senha {senha} | parâmetro — de onde vem: CenaCorreios.tsx: T.corSenha |  |
| 103 | `src/app/_bairro/cenas/textos-p2b.ts:corSenha` | A 015 | sem número |  |
| 104 | `src/app/_bairro/cenas/textos-p2b.ts:corFala2` | Em {mes}, a Dona Arminda guardou **{cap}** no colchão. Hoje ainda lá estão, todos. Um palpite: | parâmetro — de onde vem: CenaCorreios.tsx: mesLongo(D.mesT0), fmtEUR0(cap0) |  |
| 105 | `src/app/_bairro/cenas/textos-p2b.ts:corPalpite` | Esses {cap} compram hoje o mesmo que quanto dinheiro comprava em {mesCurto}? | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0), mesCurto(D.mesT0) |  |
| 106 | `src/app/_bairro/cenas/textos-p2b.ts:corNotaExemplo` | Os {cap} são um exemplo — o que é real é quanto os preços subiram desde então. | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0) |  |
| 107 | `src/app/_bairro/cenas/textos-p2b.ts:corPalpiteAria` | O teu palpite em euros | sem número |  |
| 108 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnResposta` | Mostrar a resposta | sem número |  |
| 109 | `src/app/_bairro/cenas/textos-p2b.ts:corJuizo` | Acertaste em cheio! / Quase! / Ainda menos! / Um pouco mais! | parâmetro — de onde vem: CenaCorreios.tsx: Math.abs(real0 - palpite), palpite, real0 |  |
| 110 | `src/app/_bairro/cenas/textos-p2b.ts:corResposta` | **{juizo}** Compram o mesmo que «{real}» compravam em {mesCurto}. | parâmetro — de onde vem: CenaCorreios.tsx: juizo, fmtEUR0(real0), mesCurto(D.mesT0) |  |
| 111 | `src/app/_bairro/cenas/textos-p2b.ts:corSemDados` | Os dados de inflação não estão disponíveis agora — sem eles não se mede o poder de compra. | sem número |  |
| 112 | `src/app/_bairro/cenas/textos-p2b.ts:corExplica` | O dinheiro não desapareceu: **encolheu**. Os preços subiram {variacao} desde então e cada euro compra menos. Chama-se perder **poder de compra**: a linha vermelha no monte de notas marca o que ele ainda compra em {mesT1}. | parâmetro — de onde vem: CenaCorreios.tsx: D.razaoTotal === null ? "—" : pctVarTxt(D.razaoTotal), mesCurto(D.mesT1 ?? D.mesT0) |  |
| 113 | `src/app/_bairro/cenas/textos-p2b.ts:corExplicaCA` | E nos **Certificados de Aforro**, a poupança do Estado que se faz nos Correios? Hoje rendem **{taxa}** por ano, mais um prémio a partir do 2.º ano, e {imposto} dos juros ficam retidos como imposto. | ⚠️ número escrito na frase: 2 |  |
| 114 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnCertificados` | E se fosse para os certificados? → | sem número |  |
| 115 | `src/app/_bairro/cenas/textos-p2b.ts:corFala4` | Os {cap} crescem nos certificados. Mas crescem **mais depressa do que os preços?** | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0) |  |
| 116 | `src/app/_bairro/cenas/textos-p2b.ts:corExplicaLiq` | No 1.º ano, a taxa de {taxa} fica em **{liq}** depois do imposto. Se a inflação for maior do que isso, os euros aumentam mas compram menos; se for menor, ganha-se poder de compra. Experimenta: | ⚠️ número escrito na frase: 1 |  |
| 117 | `src/app/_bairro/cenas/textos-p2b.ts:corNotaHipotese` | Isto é uma hipótese, não uma previsão: a taxa dos certificados muda todos os meses (hoje {taxa}, em vigor desde {vigencia}) e ninguém sabe a inflação futura. Começa com a inflação dos últimos 12 meses, {infl}. {garantia}. | ⚠️ número escrito na frase: 12 meses |  |
| 118 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcAnos` | Daqui a quantos anos? | sem número |  |
| 119 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcInfl` | Se a inflação fosse, por ano… | sem número |  |
| 120 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcCol` | No colchão | sem número |  |
| 121 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcCA` | Nos Certificados de Aforro (já sem imposto) | sem número |  |
| 122 | `src/app/_bairro/cenas/textos-p2b.ts:corCalcJur` | Juros brutos · imposto retido ({imposto}) | parâmetro — de onde vem: CenaCorreios.tsx: fmtPct(ca.imposto, 0) |  |
| 123 | `src/app/_bairro/cenas/textos-p2b.ts:corAnosOut` | {n} anos | parâmetro — de onde vem: CenaCorreios.tsx: anos |  |
| 124 | `src/app/_bairro/cenas/textos-p2b.ts:corCompram` | compram | sem número |  |
| 125 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnGrafico` | Aprender a ler o gráfico → | sem número |  |
| 126 | `src/app/_bairro/cenas/textos-p2b.ts:corFala5` | As linhas **cheias** são os euros que vês. As «tracejadas» são o que esses euros compram. | sem número |  |
| 127 | `src/app/_bairro/cenas/textos-p2b.ts:corGraficoTexto` | No colchão, a linha cheia nunca se mexe: são sempre {cap}. Mas a tracejada desce todos os anos. Nos certificados, a cheia sobe; se a tracejada ficar abaixo de {cap}, a poupança está a perder para os preços. A distância entre as duas linhas é a **inflação**. | parâmetro — de onde vem: CenaCorreios.tsx: fmtEUR0(cap0) |  |
| 128 | `src/app/_bairro/cenas/textos-p2b.ts:corGraficoAria` | Gráfico de 15 anos: as linhas cheias são os euros que se veem, as tracejadas o que esses euros compram. Com {infl} de inflação por ano, os {cap} do colchão compram {realCol} ao fim de 15 anos; nos Certificados de Aforro, {saldoCA} que compram {realCA}. | ⚠️ número escrito na frase: 15 anos · 15 anos |  |
| 129 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnVoltar` | Voltar ao bairro | sem número |  |
| 130 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnOutra` | Ver outra vez | sem número |  |
| 131 | `src/app/_bairro/cenas/textos-p2b.ts:corBtnPoupanca` | Saber mais sobre poupança → | sem número |  |
| 132 | `src/app/_bairro/cenas/textos-p2b.ts:bmbQuem` | Bomba de gasolina · o litro por dentro | sem número |  |
| 133 | `src/app/_bairro/cenas/textos-p2b.ts:bmbRotuloArte` | Na bomba de gasolina: a pala, a bomba com o mostrador, o carro do Pedro com a prancha no tejadilho e um garrafão de um litro que se enche por camadas — o combustível e os três impostos. | sem número |  |
| 134 | `src/app/_bairro/cenas/textos-p2b.ts:bmbFala1` | O Pedro vai atestar: **{litros} litros** de ${nome.toLowerCase()}, ao preço médio de hoje, **{preco}** por litro. | parâmetro — de onde vem: CenaBomba.tsx: litros, D.gasolina.nome, fmtLitro(D.gasolina.preco!) |  |
| 135 | `src/app/_bairro/cenas/textos-p2b.ts:bmbPalpite` | Vai pagar **{total}**. Quanto desse dinheiro é imposto? | parâmetro — de onde vem: CenaBomba.tsx: fmtEUR(total!) |  |
| 136 | `src/app/_bairro/cenas/textos-p2b.ts:bmbPalpiteAria` | O teu palpite em euros | sem número |  |
| 137 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnAtestar` | Atestar e ver a resposta | sem número |  |
| 138 | `src/app/_bairro/cenas/textos-p2b.ts:bmbJuizo` | Acertaste em cheio! / Quase! / Muito mais do que pensavas! / Um pouco menos! | parâmetro — de onde vem: CenaBomba.tsx: Math.abs(palpiteV - impostos), palpiteV, impostos |  |
| 139 | `src/app/_bairro/cenas/textos-p2b.ts:bmbResposta` | **{juizo}** Dos {total}, «{impostos}» são impostos: «{peso}» do que pagou. | parâmetro — de onde vem: CenaBomba.tsx: juizo, fmtEUR(total), fmtEUR(impostos), fmtPct(c.dec!.pesoImpostos, 0) |  |
| 140 | `src/app/_bairro/cenas/textos-p2b.ts:bmbRespostaTroca` | Com ${nome.toLowerCase()}: dos {total}, «{impostos}» são impostos: «{peso}» do que se paga. | parâmetro — de onde vem: CenaBomba.tsx: c.nome, fmtEUR(total), fmtEUR(impostos), fmtPct(c.dec!.pesoImpostos, 0) |  |
| 141 | `src/app/_bairro/cenas/textos-p2b.ts:bmbSemDados` | O preço médio de hoje não está disponível — sem ele não se abre o litro. | sem número |  |
| 142 | `src/app/_bairro/cenas/textos-p2b.ts:bmbExplica` | Olha para dentro de **um litro**. Por baixo, o que paga o combustível e quem o traz até à bomba. Por cima, três impostos: o «ISP», a «taxa de carbono» e o «IVA». | sem número |  |
| 143 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCombustiveisAria` | Escolher o combustível | sem número |  |
| 144 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamProduto` | Combustível e distribuição | sem número |  |
| 145 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamIsp` | ISP | sem número |  |
| 146 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamCarbono` | Taxa de carbono | sem número |  |
| 147 | `src/app/_bairro/cenas/textos-p2b.ts:bmbCamIva` | IVA | sem número |  |
| 148 | `src/app/_bairro/cenas/textos-p2b.ts:bmbImpostosLitro` | Impostos em cada litro | sem número |  |
| 149 | `src/app/_bairro/cenas/textos-p2b.ts:bmbDeposito` | Num depósito de {litros} litros | parâmetro — de onde vem: CenaBomba.tsx: litros |  |
| 150 | `src/app/_bairro/cenas/textos-p2b.ts:bmbIvaSobreImp` | Repara no tracejado dentro do IVA: são «{v}» por litro de **IVA sobre os outros impostos**. O IVA calcula-se sobre o preço que já leva o ISP e a taxa de carbono: paga-se imposto sobre imposto. | parâmetro — de onde vem: CenaBomba.tsx: eur3(d.ivaSobreImp) |  |
| 151 | `src/app/_bairro/cenas/textos-p2b.ts:bmbNotaIsp` | O ISP muda por portaria, às vezes todas as semanas. Valores em vigor desde {vigencia}: {notaIsp}. Preço: média nacional da DGEG de {data}. | parâmetro — de onde vem: CenaBomba.tsx: fmtData(D.ispVigencia), c.notaIsp, fmtData(c.data ?? "") |  |
| 152 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnGrafico` | Aprender a ler o gráfico → | sem número |  |
| 153 | `src/app/_bairro/cenas/textos-p2b.ts:bmbFala3` | E o preço de cada dia? Aqui está desde {inicio}. Um ponto por semana, a **média do país**. | parâmetro — de onde vem: CenaBomba.tsx: inicioSerie |  |
| 154 | `src/app/_bairro/cenas/textos-p2b.ts:bmbGraficoTexto` | A linha vermelha é a gasolina 95; a preta, o gasóleo. Em cada semana, o ISP e a taxa de carbono são valores fixos por litro (o ISP muda por portaria); só o IVA acompanha o preço. Por isso, na mesma semana, quando o preço sobe, a parte do imposto **pesa menos** em percentagem; quando desce, pesa mais. | ⚠️ número escrito na frase: 95 |  |
| 155 | `src/app/_bairro/cenas/textos-p2b.ts:bmbNotaGrafico` | Este gráfico mostra o preço, não a parte de imposto de cada dia: só temos o ISP em vigor hoje. | sem número |  |
| 156 | `src/app/_bairro/cenas/textos-p2b.ts:bmbSemSerie` | A série de preços da DGEG não está disponível agora. | sem número |  |
| 157 | `src/app/_bairro/cenas/textos-p2b.ts:bmbGraficoAria` | Preço médio por litro desde {inicio}: a gasolina 95 teve o pico de {pico} em {mesPico} e o valor mais baixo de {baixo} em {mesBaixo}. | ⚠️ número escrito na frase: 95 |  |
| 158 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnVoltar` | Voltar ao bairro | sem número |  |
| 159 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnOutra` | Ver outra vez | sem número |  |
| 160 | `src/app/_bairro/cenas/textos-p2b.ts:bmbBtnPrecos` | Ver os preços todos → | sem número |  |
| 161 | `src/app/_bairro/cenas/textos-p2b.ts:ssQuem` | Segurança Social · senha A · os descontos | sem número |  |
| 162 | `src/app/_bairro/cenas/textos-p2b.ts:ssRotuloArte` | Dentro da Segurança Social: o guiché A, a funcionária, a Inês com o recibo e um grande mealheiro comum onde caem as moedas dos descontos dela e da empresa. | sem número |  |
| 163 | `src/app/_bairro/cenas/textos-p2b.ts:ssFala1` | Bom dia! Os **descontos** são no balcão A. A Inês trouxe o recibo de vencimento. | sem número |  |
| 164 | `src/app/_bairro/cenas/textos-p2b.ts:ssSenha` | A 107 | sem número |  |
| 165 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnSenha` | Chamar a senha {senha} | parâmetro — de onde vem: CenaSegSocial.tsx: T.ssSenha |  |
| 166 | `src/app/_bairro/cenas/textos-p2b.ts:ssFala2` | A Inês ganha **{bruto}** brutos por mês. Um palpite: | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(ines.bruto) |  |
| 167 | `src/app/_bairro/cenas/textos-p2b.ts:ssPalpite` | Somando o que ela desconta e o que a empresa paga por ela, quanto entra na Segurança Social **por mês**? | sem número |  |
| 168 | `src/app/_bairro/cenas/textos-p2b.ts:ssPalpiteAria` | O teu palpite em euros por mês | sem número |  |
| 169 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnResposta` | Mostrar a resposta | sem número |  |
| 170 | `src/app/_bairro/cenas/textos-p2b.ts:ssResposta` | **{juizo}** Entram {total}» por mês: {ano} por ano. | parâmetro — de onde vem: CenaSegSocial.tsx: juizo, fmtEUR(total), fmtEUR(total * 14) |  |
| 171 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboCab` | RECIBO DA INÊS · 1 mês | ⚠️ número escrito na frase: 1 |  |
| 172 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboBruto` | Salário bruto | sem número |  |
| 173 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboSS` | Segurança Social ({taxa}) | parâmetro — de onde vem: CenaSegSocial.tsx: fmtPct(tx.trab, 0) |  |
| 174 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboSub` | e o que não aparece no recibo | sem número |  |
| 175 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboTsu` | A empresa paga por cima ({taxa}) | parâmetro — de onde vem: CenaSegSocial.tsx: fmtPct(tx.emp, 2) |  |
| 176 | `src/app/_bairro/cenas/textos-p2b.ts:ssReciboTotal` | Para a Segurança Social | sem número |  |
| 177 | `src/app/_bairro/cenas/textos-p2b.ts:ssExplica` | A Inês vê no recibo os **{ss}** que lhe descontam. Mas a empresa paga mais {tsu}» por ela, a chamada TSU, que nunca aparece no recibo. Por isso a Inês custa à empresa **{custo}** por mês, e não {bruto}. | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(ines.ss), fmtEUR(ines.tsu), fmtEUR(ines.custo), fmtEUR(ines.bruto) |  |
| 178 | `src/app/_bairro/cenas/textos-p2b.ts:ssBolo` | Este dinheiro vai para um bolo comum que paga, por exemplo, as pensões de quem já não trabalha e os subsídios de desemprego, de doença e parentais. | sem número |  |
| 179 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnPedro` | E o Pedro, a recibos verdes? → | sem número |  |
| 180 | `src/app/_bairro/cenas/textos-p2b.ts:ssFala4` | O Pedro trabalha a **recibos verdes**. Não tem empresa: paga tudo sozinho. | sem número |  |
| 181 | `src/app/_bairro/cenas/textos-p2b.ts:ssPedroTexto` | Se o Pedro faturar os mesmos **{fat}** por mês, desconta {taxa} sobre {rr} do que fatura: {ssMes}» por mês, pagos por ele, de 3 em 3 meses. No primeiro ano de atividade está isento ({isencao} meses). | ⚠️ número escrito na frase: 3 · 3 meses |  |
| 182 | `src/app/_bairro/cenas/textos-p2b.ts:ssBarrasAria` | Por cada 100 euros: a Inês desconta {inesEla} e a empresa paga {inesEmp}; o Pedro paga {pedro} sozinho. | ⚠️ número escrito na frase: 100 euros |  |
| 183 | `src/app/_bairro/cenas/textos-p2b.ts:ssBarrasLegenda` | em cada 100 € de salário ou de faturação | ⚠️ número escrito na frase: 100 |  |
| 184 | `src/app/_bairro/cenas/textos-p2b.ts:ssNomeInes` | Inês | sem número |  |
| 185 | `src/app/_bairro/cenas/textos-p2b.ts:ssNomePedro` | Pedro | sem número |  |
| 186 | `src/app/_bairro/cenas/textos-p2b.ts:ssEla` | ela {v} | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(inesEla) |  |
| 187 | `src/app/_bairro/cenas/textos-p2b.ts:ssEmpresa` | empresa {v} | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(inesEmp) |  |
| 188 | `src/app/_bairro/cenas/textos-p2b.ts:ssEle` | ele {v} | parâmetro — de onde vem: CenaSegSocial.tsx: fmtEUR(D.pedro.por100) |  |
| 189 | `src/app/_bairro/cenas/textos-p2b.ts:ssCompara` | Por cada 100 €, entram mais na Segurança Social pela Inês ({ines}) do que pelo Pedro ({pedro}). Mas a Inês só sente os {sente} que lhe descontam; o Pedro sente tudo, porque paga do próprio bolso. | ⚠️ número escrito na frase: 100 |  |
| 190 | `src/app/_bairro/cenas/textos-p2b.ts:ssNotaCatb` | Recibos verdes: rendimento relevante de {rr} do faturado em serviços, com base mínima de {baseMinIas} × IAS ({baseMin}). Isenção nos primeiros {isencao} meses; os clientes retêm {retencao} na fonte (art. 151.º do CIRS). O apuramento da Segurança Social é trimestral — aqui mostra-se a média anual. IAS de {ias}. | ⚠️ número escrito na frase: 151 |  |
| 191 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnVoltar` | Voltar ao bairro | sem número |  |
| 192 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnOutra` | Ver outra vez | sem número |  |
| 193 | `src/app/_bairro/cenas/textos-p2b.ts:ssBtnSalario` | Fazer contas com o teu salário → | sem número |  |
| 194 | `src/app/_bairro/cenas/textos-p2b.ts:ssSemDados` | Os dados do salário não estão disponíveis agora. | sem número |  |
**cenas P2c** (114)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 195 | `src/app/_bairro/cenas/textos-p2c.ts:casaQuem` | Casa da Inês · o preço das casas | sem número |  |
| 196 | `src/app/_bairro/cenas/textos-p2c.ts:casaPlaca` | CASA DA INÊS | sem número |  |
| 197 | `src/app/_bairro/cenas/textos-p2c.ts:casaPilhaLeg` | meses de trabalho | sem número |  |
| 198 | `src/app/_bairro/cenas/textos-p2c.ts:casaRotuloArte` | A sala da Inês com a janela para a Ribeira: na mesa, uma casa em miniatura e, ao lado, uma pilha de recibos de vencimento que cresce. | sem número |  |
| 199 | `src/app/_bairro/cenas/textos-p2c.ts:casaFala1` | Imagina que, em **2015**, uma casa custava o mesmo que **100 meses** de trabalho. | ⚠️ número escrito na frase: 100 meses |  |
| 200 | `src/app/_bairro/cenas/textos-p2c.ts:casaPergunta` | Hoje, a mesma casa custa o mesmo que quantos meses de trabalho? | sem número |  |
| 201 | `src/app/_bairro/cenas/textos-p2c.ts:casaPalpiteAria` | O teu palpite em meses | sem número |  |
| 202 | `src/app/_bairro/cenas/textos-p2c.ts:casaPalpiteFmt` | {v} meses | parâmetro — de onde vem: CenaCasa.tsx: palpite |  |
| 203 | `src/app/_bairro/cenas/textos-p2c.ts:casaBtnResposta` | Mostrar a resposta | sem número |  |
| 204 | `src/app/_bairro/cenas/textos-p2c.ts:casaFala2` | **{juizo}** Hoje custa «{meses} meses». | parâmetro — de onde vem: CenaCasa.tsx: T.juizoPalpite(palpite, meses ?? 0, 5, 20), hoje |  |
| 205 | `src/app/_bairro/cenas/textos-p2c.ts:casaExplica` | Desde 2015, os preços das casas subiram «{subHpi}». O custo do trabalho, o que as empresas pagam por cada hora trabalhada, subiu **{subLci}**. | ⚠️ número escrito na frase: 2015, |  |
| 206 | `src/app/_bairro/cenas/textos-p2c.ts:casaNota` | «Meses de trabalho» é uma forma de ler a razão entre dois índices oficiais (preços da habitação ÷ custo do trabalho, 2015 = 100). Não é o salário líquido de ninguém. Último dado: {ultimo}. | ⚠️ número escrito na frase: 100 |  |
| 207 | `src/app/_bairro/cenas/textos-p2c.ts:casaBtnGrafico` | Aprender a ler o gráfico → | sem número |  |
| 208 | `src/app/_bairro/cenas/textos-p2c.ts:casaFala3` | Duas linhas que partem do **mesmo 100**. A distância entre elas é o que mudou. | ⚠️ número escrito na frase: 100 |  |
| 209 | `src/app/_bairro/cenas/textos-p2c.ts:casaGraficoRotA` | preço das casas | sem número |  |
| 210 | `src/app/_bairro/cenas/textos-p2c.ts:casaGraficoRotB` | custo do trabalho | sem número |  |
| 211 | `src/app/_bairro/cenas/textos-p2c.ts:casaGraficoAria` | Desde 2015, o índice de preços das casas passou de 100 para {hpi}; o custo do trabalho, de 100 para {lci}. | ⚠️ número escrito na frase: 2015, · 100 · 100 |  |
| 212 | `src/app/_bairro/cenas/textos-p2c.ts:casaGraficoTexto` | Em 2015 as duas linhas estavam juntas, em 100. Hoje o preço das casas vale «{hpi}» e o custo do trabalho **{lci}**. A mancha entre as duas é a parte da subida das casas que o custo do trabalho não acompanhou. | ⚠️ número escrito na frase: 100. |  |
| 213 | `src/app/_bairro/cenas/textos-p2c.ts:casaBtnVoltar` | Voltar ao bairro | sem número |  |
| 214 | `src/app/_bairro/cenas/textos-p2c.ts:casaBtnOutra` | Ver outra vez | sem número |  |
| 215 | `src/app/_bairro/cenas/textos-p2c.ts:casaLinkCasa` | Ver a casa por dentro → | sem número |  |
| 216 | `src/app/_bairro/cenas/textos-p2c.ts:pastQuem` | Pastelaria · o café e o pastel | sem número |  |
| 217 | `src/app/_bairro/cenas/textos-p2c.ts:pastPlaca` | PASTELARIA | sem número |  |
| 218 | `src/app/_bairro/cenas/textos-p2c.ts:pastRotuloArte` | A pastelaria por dentro: a vitrine com pastéis de nata e bolas de Berlim, a máquina de café, a empregada ao balcão e o quadro com o preço de antes e de hoje. | sem número |  |
| 219 | `src/app/_bairro/cenas/textos-p2c.ts:pastFala1` | Um café e um pastel de nata! Em {mes}, digamos que custavam **{preco}**. | parâmetro — de onde vem: CenaPastelaria.tsx: mesLongo(D.t0), fmtEUR(D.base) |  |
| 220 | `src/app/_bairro/cenas/textos-p2c.ts:pastPergunta` | Quanto custam hoje o mesmo café e o mesmo pastel? | sem número |  |
| 221 | `src/app/_bairro/cenas/textos-p2c.ts:pastNotaExemplo` | Os {preco} são um exemplo. O que é real é quanto subiram os preços. | parâmetro — de onde vem: CenaPastelaria.tsx: fmtEUR(D.base) |  |
| 222 | `src/app/_bairro/cenas/textos-p2c.ts:pastPalpiteAria` | O teu palpite em euros | sem número |  |
| 223 | `src/app/_bairro/cenas/textos-p2c.ts:pastBtnResposta` | Mostrar a resposta | sem número |  |
| 224 | `src/app/_bairro/cenas/textos-p2c.ts:pastQuadroHoje` | hoje: {preco} | parâmetro — de onde vem: CenaPastelaria.tsx: fmtEUR(hoje) ; CenaPastelaria.tsx: fmtEUR(o.v) |  |
| 225 | `src/app/_bairro/cenas/textos-p2c.ts:pastQuadroAntes` | {mes}: {preco} | parâmetro — de onde vem: CenaPastelaria.tsx: mesCurto(D.t0), fmtEUR(D.base) |  |
| 226 | `src/app/_bairro/cenas/textos-p2c.ts:pastQuadroTitulo` | café + pastel | sem número |  |
| 227 | `src/app/_bairro/cenas/textos-p2c.ts:pastFala2` | **{juizo}** Hoje custam «{preco}»: {varPct}. | parâmetro — de onde vem: CenaPastelaria.tsx: T.juizoPalpite(palpite, hoje ?? 0, 0.05, 0.2), fmtOuFalha(hoje), r11 !== null ? pctVar(r11) : "—" |  |
| 228 | `src/app/_bairro/cenas/textos-p2c.ts:pastExplica` | Comer fora subiu mais do que comer em casa. Desde {mes}, os restaurantes e cafés subiram «{varFora}»; a comida da mercearia, **{varCasa}**. | parâmetro — de onde vem: CenaPastelaria.tsx: mesLongo(D.t0), r11 !== null ? pctVar(r11) : "—", D.comida.v.length >= 2 ? pctVar( ptsComida.at(-1)!.v / (ptsComida.find((p) => p.t === D.t0)?.v ?? NaN) ) : "—" |  |
| 229 | `src/app/_bairro/cenas/textos-p2c.ts:pastGraficoRotA` | comer fora | sem número |  |
| 230 | `src/app/_bairro/cenas/textos-p2c.ts:pastGraficoRotB` | comer em casa | sem número |  |
| 231 | `src/app/_bairro/cenas/textos-p2c.ts:pastGraficoAria` | Com 100 em {mes}, comer fora vale hoje {fora} e comer em casa {casa}. | ⚠️ número escrito na frase: 100 |  |
| 232 | `src/app/_bairro/cenas/textos-p2c.ts:pastNotaIndice` | «Comer fora» é o índice europeu de restaurantes e alojamento, onde entram os cafés e também os hotéis. | sem número |  |
| 233 | `src/app/_bairro/cenas/textos-p2c.ts:pastBtnIva` | E o IVA do café? → | sem número |  |
| 234 | `src/app/_bairro/cenas/textos-p2c.ts:pastFala3` | No café, o IVA é de «{taxa}». | parâmetro — de onde vem: CenaPastelaria.tsx: taxaOuFalha(D.ivaCafe) |  |
| 235 | `src/app/_bairro/cenas/textos-p2c.ts:pastIvaTexto` | Dos **{hoje}** do café e do pastel, «{iva}» são IVA. A restauração paga a taxa intermédia, {taxaCafe}. Se fosse a taxa do pão, {taxaPao}, seriam {ivaPao}. | parâmetro — de onde vem: CenaPastelaria.tsx: fmtOuFalha(hoje), fmtOuFalha(ivaCafe), taxaOuFalha(D.ivaCafe), taxaOuFalha(D.ivaMercearia), fmtOuFalha(ivaPao) |  |
| 236 | `src/app/_bairro/cenas/textos-p2c.ts:pastNotaIva` | Taxas do continente, do Código do IVA. | sem número |  |
| 237 | `src/app/_bairro/cenas/textos-p2c.ts:pastBtnVoltar` | Voltar ao bairro | sem número |  |
| 238 | `src/app/_bairro/cenas/textos-p2c.ts:pastBtnOutra` | Ver outra vez | sem número |  |
| 239 | `src/app/_bairro/cenas/textos-p2c.ts:pastLinkInflacao` | Ver a inflação por dentro → | sem número |  |
| 240 | `src/app/_bairro/cenas/textos-p2c.ts:quiQuem` | Quiosque da praça · o país hoje | sem número |  |
| 241 | `src/app/_bairro/cenas/textos-p2c.ts:quiPlaca` | QUIOSQUE DA PRAÇA | sem número |  |
| 242 | `src/app/_bairro/cenas/textos-p2c.ts:quiRotuloArte` | O quiosque da praça com os jornais pendurados, o vendedor e a primeira página do Jornal do Bairro com os números do país. | sem número |  |
| 243 | `src/app/_bairro/cenas/textos-p2c.ts:quiFala1` | O Gonçalo passa pelo quiosque. A manchete de hoje é sobre os **jovens**. | sem número |  |
| 244 | `src/app/_bairro/cenas/textos-p2c.ts:quiPergunta` | Em cada **100 jovens** com menos de 25 anos que querem trabalhar, quantos não encontram emprego em Portugal? | ⚠️ número escrito na frase: 100 · 25 anos |  |
| 245 | `src/app/_bairro/cenas/textos-p2c.ts:quiPalpiteAria` | O teu palpite | sem número |  |
| 246 | `src/app/_bairro/cenas/textos-p2c.ts:quiPalpiteFmt` | {v} em 100 | ⚠️ número escrito na frase: 100 |  |
| 247 | `src/app/_bairro/cenas/textos-p2c.ts:quiBtnManchete` | Ler a manchete | sem número |  |
| 248 | `src/app/_bairro/cenas/textos-p2c.ts:quiMancheteSub` | dos jovens sem emprego | sem número |  |
| 249 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalCab` | JORNAL DO BAIRRO | sem número |  |
| 250 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalTitulo` | o país em números | sem número |  |
| 251 | `src/app/_bairro/cenas/textos-p2c.ts:quiFala2` | **{juizo}** São cerca de «{n} em cada 100» ({pct}, {mes}). | ⚠️ número escrito na frase: 100 |  |
| 252 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalDesemprego` | **Desemprego** · {mes}. Em cada 100 pessoas que trabalham ou procuram trabalho, cerca de {n} procuram sem encontrar. Na UE: {ue}. | ⚠️ número escrito na frase: 100 |  |
| 253 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalJovens` | **Desemprego jovem** (menos de 25 anos): {razao} vezes o total. | ⚠️ número escrito na frase: 25 anos |  |
| 254 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalPib` | **Economia (PIB)** · {tri}: o país produziu {v} {sinal} do que no mesmo trimestre do ano anterior. | parâmetro — de onde vem: CenaQuiosque.tsx: fmtPeriodo(D.pib.t), `${fmtNum(Math.abs(D.pib.v), 1)}${FINO}%`, D.pib.v >= 0 ? T.quiJornalPibMais : T.quiJornalPibMenos |  |
| 255 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalPibMais` | mais | sem número |  |
| 256 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalPibMenos` | menos | sem número |  |
| 257 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalInflacao` | **Inflação** · {mes}: os preços estão {v} mais altos do que há um ano. | parâmetro — de onde vem: CenaQuiosque.tsx: mesLongo(D.inflacao.t), `${fmtNum(D.inflacao.v * 100, 1)}${FINO}%` |  |
| 258 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalConfianca` | **Confiança dos consumidores** · {mes}: {sentido} (0 seria empate). | ⚠️ número escrito na frase: 0 |  |
| 259 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalConfPessimista` | há mais pessimistas do que otimistas | sem número |  |
| 260 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalConfOtimista` | há mais otimistas do que pessimistas | sem número |  |
| 261 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalSmn` | **Salário mínimo** em {ano}, no continente. Em {ano0} era {valor0}. | parâmetro — de onde vem: CenaQuiosque.tsx: "2026", fmtEUR(D.smn), String(D.smn0.ano), fmtEUR(D.smn0.valor) |  |
| 262 | `src/app/_bairro/cenas/textos-p2c.ts:quiJornalFalha` | Dado em falta — a fonte não respondeu. | sem número |  |
| 263 | `src/app/_bairro/cenas/textos-p2c.ts:quiBtnGrafico` | Aprender a ler o gráfico → | sem número |  |
| 264 | `src/app/_bairro/cenas/textos-p2c.ts:quiFala3` | Três linhas: os «jovens», o **total** e a média da «UE». | sem número |  |
| 265 | `src/app/_bairro/cenas/textos-p2c.ts:quiGraficoRotA` | jovens | sem número |  |
| 266 | `src/app/_bairro/cenas/textos-p2c.ts:quiGraficoRotB` | Portugal | sem número |  |
| 267 | `src/app/_bairro/cenas/textos-p2c.ts:quiGraficoRotC` | UE | sem número |  |
| 268 | `src/app/_bairro/cenas/textos-p2c.ts:quiGraficoAria` | Taxa de desemprego desde 2019: jovens {jov}, Portugal {pt}, União Europeia {ue}, em {mes}. | parâmetro — de onde vem: CenaQuiosque.tsx: pct1(ultJovens?.v), pct1(ultPt?.v), pct1(ultUe?.v), ultPt ? mesLongo(ultPt.t) : "—" |  |
| 269 | `src/app/_bairro/cenas/textos-p2c.ts:quiGraficoTexto` | A taxa de desemprego conta só quem **procura** trabalho, dividido por todos os que trabalham ou procuram. Quem estuda e não procura não entra na conta. Por isso «{jovPct} dos jovens» não quer dizer «{jovPct} de todos os jovens». | parâmetro — de onde vem: CenaQuiosque.tsx: ultJovens !== null ? `${fmtNum(Math.round(ultJovens.v), 0)}${FINO}%` : "—" |  |
| 270 | `src/app/_bairro/cenas/textos-p2c.ts:quiBtnVoltar` | Voltar ao bairro | sem número |  |
| 271 | `src/app/_bairro/cenas/textos-p2c.ts:quiBtnOutra` | Ver outra vez | sem número |  |
| 272 | `src/app/_bairro/cenas/textos-p2c.ts:quiLinkTrabalho` | Ver o trabalho → | sem número |  |
| 273 | `src/app/_bairro/cenas/textos-p2c.ts:quiLinkDados` | Ver os dados do país → | sem número |  |
| 274 | `src/app/_bairro/cenas/textos-p2c.ts:escQuem` | Escola · aprender a ler gráficos | sem número |  |
| 275 | `src/app/_bairro/cenas/textos-p2c.ts:escPlaca` | ESCOLA | sem número |  |
| 276 | `src/app/_bairro/cenas/textos-p2c.ts:escRotuloArte` | Uma sala de aula: a professora Diana ao quadro verde, com um gráfico desenhado a giz, e o Gonçalo na carteira. | sem número |  |
| 277 | `src/app/_bairro/cenas/textos-p2c.ts:escFala1` | Bom dia, turma! Hoje a professora **Diana** ensina a ler gráficos. Primeira pergunta: | sem número |  |
| 278 | `src/app/_bairro/cenas/textos-p2c.ts:escPergunta` | Estes dois gráficos mostram o preço da comida no último ano. Em qual deles os preços subiram **mais**? | sem número |  |
| 279 | `src/app/_bairro/cenas/textos-p2c.ts:escPerguntaCurta` | em qual subiram mais? | sem número |  |
| 280 | `src/app/_bairro/cenas/textos-p2c.ts:escMiniA` | Gráfico A | sem número |  |
| 281 | `src/app/_bairro/cenas/textos-p2c.ts:escMiniB` | Gráfico B | sem número |  |
| 282 | `src/app/_bairro/cenas/textos-p2c.ts:escBtnA` | No A | sem número |  |
| 283 | `src/app/_bairro/cenas/textos-p2c.ts:escBtnB` | No B | sem número |  |
| 284 | `src/app/_bairro/cenas/textos-p2c.ts:escBtnMesmo` | Subiram o mesmo | sem número |  |
| 285 | `src/app/_bairro/cenas/textos-p2c.ts:escFala2Certo` | **Muito bem!** | sem número |  |
| 286 | `src/app/_bairro/cenas/textos-p2c.ts:escFala2Errado` | **Apanhado!** | sem número |  |
| 287 | `src/app/_bairro/cenas/textos-p2c.ts:escFala2` | {veredito} São os **mesmos números**: os preços subiram {subida} nos dois. | parâmetro — de onde vem: CenaEscola.tsx: acertou ? T.escFala2Certo : T.escFala2Errado, D.subidaComida !== null ? pct1(D.subidaComida) : "—" |  |
| 288 | `src/app/_bairro/cenas/textos-p2c.ts:escMiniALeg` | A · o eixo começa no 0 | ⚠️ número escrito na frase: 0 |  |
| 289 | `src/app/_bairro/cenas/textos-p2c.ts:escMiniBLeg` | B · o eixo começa em {lo} | parâmetro — de onde vem: CenaEscola.tsx: fmtNum(miniB.lo, 0) |  |
| 290 | `src/app/_bairro/cenas/textos-p2c.ts:escMiniAria` | Eixo de {lo} a {hi} | sem número |  |
| 291 | `src/app/_bairro/cenas/textos-p2c.ts:escExplicaEixo` | No B, o eixo não começa no zero: corta o fundo e faz a mesma subida parecer uma montanha. Não é mentira, mas engana. **Primeira regra: olha sempre para onde começa o eixo.** | sem número |  |
| 292 | `src/app/_bairro/cenas/textos-p2c.ts:escBtnLicao2` | Segunda lição: num mês ou num ano? → | sem número |  |
| 293 | `src/app/_bairro/cenas/textos-p2c.ts:escFala3` | Dois jornais, {mes}. Um diz «os preços **{dirMes} {mm}**». O outro diz «**subiram {yy}**». Quem mente? | parâmetro — de onde vem: CenaEscola.tsx: mes ? mesCurto(mes) : "—", cadeia && cadeia.v < 0 ? T.escDesceram : T.escSubiram, cadeia ? pct1(Math.abs(cadeia.v)) : "—", homologa ? pct1(Math.abs(homologa.v)) : "—" |  |
| 294 | `src/app/_bairro/cenas/textos-p2c.ts:escSubiram` | subiram | sem número |  |
| 295 | `src/app/_bairro/cenas/textos-p2c.ts:escDesceram` | desceram | sem número |  |
| 296 | `src/app/_bairro/cenas/textos-p2c.ts:escExplica3a` | **Ninguém.** Comparam com meses diferentes: | sem número |  |
| 297 | `src/app/_bairro/cenas/textos-p2c.ts:escCadeia` | Comparado com o **mês anterior** ({mes}): variação em cadeia | parâmetro — de onde vem: CenaEscola.tsx: cadeia ? mesCurto(cadeia.t) : "—" |  |
| 298 | `src/app/_bairro/cenas/textos-p2c.ts:escHomologa` | Comparado com o **mesmo mês do ano passado** ({mes}): variação homóloga | parâmetro — de onde vem: CenaEscola.tsx: homologa ? mesCurto(homologa.t) : "—" |  |
| 299 | `src/app/_bairro/cenas/textos-p2c.ts:escExplica3b` | **Segunda regra: pergunta sempre «comparado com quando?».** A inflação que ouves nas notícias é quase sempre a homóloga, a de um ano inteiro. | sem número |  |
| 300 | `src/app/_bairro/cenas/textos-p2c.ts:escNotaIndices` | Os dois números são do mesmo índice de preços (IHPC total), {mes}: a variação em cadeia compara com o mês anterior; a homóloga, com o mesmo mês do ano anterior. | parâmetro — de onde vem: CenaEscola.tsx: mes ? fmtPeriodo(mes) : "—" |  |
| 301 | `src/app/_bairro/cenas/textos-p2c.ts:escBtnLicao3` | Terceira lição: as palavras → | sem número |  |
| 302 | `src/app/_bairro/cenas/textos-p2c.ts:escFala4` | **Terceira regra: sabe o que as palavras querem dizer.** Toca numa palavra para ires ao sítio do bairro onde ela vive. | sem número |  |
| 303 | `src/app/_bairro/cenas/textos-p2c.ts:escVerEm` | ver em: {titulo} → | parâmetro — de onde vem: CenaEscola.tsx: onde.titulo |  |
| 304 | `src/app/_bairro/cenas/textos-p2c.ts:escVerGlossario` | glossário → | sem número |  |
| 305 | `src/app/_bairro/cenas/textos-p2c.ts:escOnde` | ipc-ihpc / a Pastelaria / /#pastelaria / taxa-real / os Correios / /#correios / escalao-irs / as Finanças / /#financas / o Banco / /#banco / a Fábrica / /#fabrica | sem número |  |
| 306 | `src/app/_bairro/cenas/textos-p2c.ts:escBtnVoltar` | Voltar ao bairro | sem número |  |
| 307 | `src/app/_bairro/cenas/textos-p2c.ts:escBtnOutra` | Ver outra vez | sem número |  |
| 308 | `src/app/_bairro/cenas/textos-p2c.ts:escLinkAprender` | Ver o glossário todo → | sem número |  |
**home · bairro** (87)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 309 | `messages/pt.json:bairro.selo.independente1` | Independente e gratuito. | sem número |  |
| 310 | `messages/pt.json:bairro.selo.independente2` | Aqui ninguém te quer vender nada. | sem número |  |
| 311 | `messages/pt.json:bairro.h1a` | O dinheiro explicado | sem número |  |
| 312 | `messages/pt.json:bairro.h1b` | ao cêntimo. | sem número |  |
| 313 | `messages/pt.json:bairro.intro` | Este é o bairro. Cada edifício responde a uma pergunta sobre dinheiro — com os números de hoje. Toca num para entrar. | sem número |  |
| 314 | `messages/pt.json:bairro.dica.arrasta` | Arrasta para passear · roda para aproximar · | sem número |  |
| 315 | `messages/pt.json:bairro.dica.fabrica` | toca na Fábrica! | sem número |  |
| 316 | `messages/pt.json:bairro.mapa.descricao` | Mapa ilustrado de um bairro português visto de cima: fábrica, Segurança Social, Finanças, banco, correios e bomba de gasolina na avenida do elétrico; mercearia, pastelaria, a casa da Inês, a praça com o quiosque e a escola cá em baixo, no Cais da Ribeira, ligados à avenida por umas escadinhas; a Torre dos Clérigos lá atrás; à frente o Douro, os barcos rabelos e a Ponte D. Luís I. Cada edifício tem por cima um número real de hoje. | sem número |  |
| 317 | `messages/pt.json:bairro.mapa.rotuloHora` | Hora do dia | sem número |  |
| 318 | `messages/pt.json:bairro.hora.dia` | Dia | sem número |  |
| 319 | `messages/pt.json:bairro.hora.tarde` | Fim de tarde | sem número |  |
| 320 | `messages/pt.json:bairro.hora.noite` | Noite | sem número |  |
| 321 | `messages/pt.json:bairro.zoom.mais` | Aproximar | sem número |  |
| 322 | `messages/pt.json:bairro.zoom.menos` | Afastar | sem número |  |
| 323 | `messages/pt.json:bairro.zoom.tudo` | Ver o bairro todo | sem número |  |
| 324 | `messages/pt.json:bairro.cartao.entrar` | toca para entrar → | sem número |  |
| 325 | `messages/pt.json:bairro.cartao.breve` | em breve | sem número |  |
| 326 | `messages/pt.json:bairro.breve.titulo` | Em breve — este edifício ainda está em obras. | sem número |  |
| 327 | `messages/pt.json:bairro.breve.fechar` | Fechar | sem número |  |
| 328 | `messages/pt.json:bairro.elenco.etiqueta` | Quem vive no bairro | sem número |  |
| 329 | `messages/pt.json:bairro.elenco.h2` | Escolhe a tua personagem. | sem número |  |
| 330 | `messages/pt.json:bairro.elenco.lead` | O mesmo trabalho, pago de maneiras diferentes: por conta de outrem, na função pública, a recibos verdes ou com empresa própria. Cada pessoa do bairro mostra um caminho diferente do dinheiro. Toca numa para a encontrares no mapa. | sem número |  |
| 331 | `messages/pt.json:bairro.elenco.notas` | De onde vêm os números do bairro: | sem número |  |
| 332 | `messages/pt.json:bairro.elenco.ola` | Olá! Sou {quem}. | sem número |  |
| 333 | `messages/pt.json:bairro.elenco.emBreve` | Em breve | sem número |  |
| 334 | `messages/pt.json:bairro.elenco.segueDinheiro` | vais poder seguir o meu dinheiro pelo bairro. | sem número |  |
| 335 | `messages/pt.json:bairro.elenco.cartas.ines.nome` | Inês | sem número |  |
| 336 | `messages/pt.json:bairro.elenco.cartas.ines.papel` | Operária da fábrica | sem número |  |
| 337 | `messages/pt.json:bairro.elenco.cartas.ines.perfil` | Conta de outrem · setor privado | sem número |  |
| 338 | `messages/pt.json:bairro.elenco.cartas.ines.ola` | a Inês | sem número |  |
| 339 | `messages/pt.json:bairro.elenco.cartas.ines.aprende` | Porque é que {bruto} brutos viram {liquido}. | sem número |  |
| 340 | `messages/pt.json:bairro.elenco.cartas.diana.nome` | Diana | sem número |  |
| 341 | `messages/pt.json:bairro.elenco.cartas.diana.papel` | Professora | sem número |  |
| 342 | `messages/pt.json:bairro.elenco.cartas.diana.perfil` | Função pública | sem número |  |
| 343 | `messages/pt.json:bairro.elenco.cartas.diana.ola` | a Diana | sem número |  |
| 344 | `messages/pt.json:bairro.elenco.cartas.diana.aprende` | Descontos diferentes para o mesmo salário. | sem número |  |
| 345 | `messages/pt.json:bairro.elenco.cartas.pedro.nome` | Pedro | sem número |  |
| 346 | `messages/pt.json:bairro.elenco.cartas.pedro.papel` | Freelancer | sem número |  |
| 347 | `messages/pt.json:bairro.elenco.cartas.pedro.perfil` | Independente · recibos verdes | sem número |  |
| 348 | `messages/pt.json:bairro.elenco.cartas.pedro.ola` | o Pedro | sem número |  |
| 349 | `messages/pt.json:bairro.elenco.cartas.pedro.aprende` | Segurança Social trimestral e IRS da categoria B. | sem número |  |
| 350 | `messages/pt.json:bairro.elenco.cartas.manuel.nome` | Sr. Manuel | sem número |  |
| 351 | `messages/pt.json:bairro.elenco.cartas.manuel.papel` | Dono da mercearia | sem número |  |
| 352 | `messages/pt.json:bairro.elenco.cartas.manuel.perfil` | Pequeno empresário | sem número |  |
| 353 | `messages/pt.json:bairro.elenco.cartas.manuel.ola` | o Sr. Manuel | sem número |  |
| 354 | `messages/pt.json:bairro.elenco.cartas.manuel.aprende` | O IVA que cobra, a TSU que paga, o lucro da empresa. | sem número |  |
| 355 | `messages/pt.json:bairro.elenco.cartas.arminda.nome` | Dona Arminda | sem número |  |
| 356 | `messages/pt.json:bairro.elenco.cartas.arminda.papel` | Reformada | sem número |  |
| 357 | `messages/pt.json:bairro.elenco.cartas.arminda.perfil` | Pensão e poupança | sem número |  |
| 358 | `messages/pt.json:bairro.elenco.cartas.arminda.ola` | a Dona Arminda | sem número |  |
| 359 | `messages/pt.json:bairro.elenco.cartas.arminda.aprende` | Quanto rende a poupança e o IRS sobre a pensão. | sem número |  |
| 360 | `messages/pt.json:bairro.elenco.cartas.goncalo.nome` | Gonçalo | sem número |  |
| 361 | `messages/pt.json:bairro.elenco.cartas.goncalo.papel` | Estudante, 16 anos | ⚠️ número escrito na frase: 16 anos |  |
| 362 | `messages/pt.json:bairro.elenco.cartas.goncalo.perfil` | Mesada e primeiro trabalho | sem número |  |
| 363 | `messages/pt.json:bairro.elenco.cartas.goncalo.ola` | o Gonçalo | sem número |  |
| 364 | `messages/pt.json:bairro.elenco.cartas.goncalo.aprende` | O primeiro recibo, o IRS Jovem, a primeira conta. | sem número |  |
| 365 | `messages/pt.json:bairro.elenco.cartas.rui.nome` | Rui e Marta | sem número |  |
| 366 | `messages/pt.json:bairro.elenco.cartas.rui.papel` | Casal com crédito | sem número |  |
| 367 | `messages/pt.json:bairro.elenco.cartas.rui.perfil` | Crédito à habitação | sem número |  |
| 368 | `messages/pt.json:bairro.elenco.cartas.rui.ola` | o Rui, e esta é a Marta | sem número |  |
| 369 | `messages/pt.json:bairro.elenco.cartas.rui.aprende` | A prestação, a Euribor e quanto do salário ela come. | sem número |  |
| 370 | `messages/pt.json:bairro.edificios.fabrica.titulo` | Fábrica | sem número |  |
| 371 | `messages/pt.json:bairro.edificios.fabrica.pergunta` | Para onde vai o teu salário? | sem número |  |
| 372 | `messages/pt.json:bairro.edificios.segsocial.titulo` | Segurança Social | sem número |  |
| 373 | `messages/pt.json:bairro.edificios.segsocial.pergunta` | O que são os descontos e para que servem? | sem número |  |
| 374 | `messages/pt.json:bairro.edificios.financas.titulo` | Finanças | sem número |  |
| 375 | `messages/pt.json:bairro.edificios.financas.pergunta` | Como funcionam os escalões do IRS? | sem número |  |
| 376 | `messages/pt.json:bairro.edificios.banco.titulo` | Banco | sem número |  |
| 377 | `messages/pt.json:bairro.edificios.banco.pergunta` | Quanto custa pedir dinheiro emprestado? | sem número |  |
| 378 | `messages/pt.json:bairro.edificios.correios.titulo` | Correios | sem número |  |
| 379 | `messages/pt.json:bairro.edificios.correios.pergunta` | Onde rende a poupança da Dona Arminda? | sem número |  |
| 380 | `messages/pt.json:bairro.edificios.bomba.titulo` | Bomba de gasolina | sem número |  |
| 381 | `messages/pt.json:bairro.edificios.bomba.pergunta` | Quanto do litro é imposto? | sem número |  |
| 382 | `messages/pt.json:bairro.edificios.mercearia.titulo` | Mercearia do Manuel | sem número |  |
| 383 | `messages/pt.json:bairro.edificios.mercearia.pergunta` | Porque está tudo mais caro? | sem número |  |
| 384 | `messages/pt.json:bairro.edificios.pastelaria.titulo` | Pastelaria | sem número |  |
| 385 | `messages/pt.json:bairro.edificios.pastelaria.pergunta` | Quanto subiu o café? | sem número |  |
| 386 | `messages/pt.json:bairro.edificios.casa.titulo` | Casa da Inês | sem número |  |
| 387 | `messages/pt.json:bairro.edificios.casa.pergunta` | Quantos meses de trabalho custa uma casa? | sem número |  |
| 388 | `messages/pt.json:bairro.edificios.quiosque.titulo` | Quiosque da praça | sem número |  |
| 389 | `messages/pt.json:bairro.edificios.quiosque.pergunta` | Os números do país, hoje | sem número |  |
| 390 | `messages/pt.json:bairro.edificios.escola.titulo` | Escola | sem número |  |
| 391 | `messages/pt.json:bairro.edificios.escola.pergunta` | Aprender a ler gráficos e as palavras do dinheiro | sem número |  |
| 392 | `messages/pt.json:bairro.extra.bomba` | Hoje: gasóleo {gasoleo} e gasolina 95 {gasolina} por litro, em média. | ⚠️ número escrito na frase: 95 |  |
| 393 | `messages/pt.json:bairro.extra.banco` | A Euribor a 12 meses está em {euribor}. | ⚠️ número escrito na frase: 12 meses |  |
| 394 | `messages/pt.json:bairro.extra.correios` | Os Certificados de Aforro rendem {ca} (taxa base). | sem número |  |
| 395 | `messages/pt.json:bairro.extra.quiosque` | Inflação: {inflacao} num ano. Desemprego: {desemprego}. | sem número |  |
**`/estilo` (P3c)** (23)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 396 | `messages/pt.json:estilo.titulo` | Contrato visual «O Bairro» | sem número |  |
| 397 | `messages/pt.json:estilo.nota` | Esta página é a referência do aspecto do site: as cores, a tipografia e as formas que se repetem em todas as páginas. Onde ela e as regras da casa divergirem, ganham as regras da casa. | sem número |  |
| 398 | `messages/pt.json:estilo.cor` | Cor | sem número |  |
| 399 | `messages/pt.json:estilo.corNota` | Cada cor tem um nome e um sítio. O verde é o que fica contigo, o vermelho é o que sai, o azul é neutro e informa. Nenhuma cor decora. | sem número |  |
| 400 | `messages/pt.json:estilo.tipografia` | Tipografia | sem número |  |
| 401 | `messages/pt.json:estilo.tipografiaNota` | Uma família para tudo, uma mão para os gráficos, e a monoespaçada do sistema para o talão e o recibo. Não há fonte editorial. | sem número |  |
| 402 | `messages/pt.json:estilo.arquivoEixo` | O eixo da largura | sem número |  |
| 403 | `messages/pt.json:estilo.arquivoEixoNota` | O mesmo Archivo aperta a manchete e alarga o número. É assim que um título se distingue de um corpo — não é outra fonte. | sem número |  |
| 404 | `messages/pt.json:estilo.mao` | Caveat — a mão | sem número |  |
| 405 | `messages/pt.json:estilo.maoNota` | Só nos gráficos e no quadro da escola. Nunca num número que a pessoa precise de ler já. | sem número |  |
| 406 | `messages/pt.json:estilo.mono` | Monoespaçada do sistema | sem número |  |
| 407 | `messages/pt.json:estilo.monoNota` | O talão e o recibo. Não descarrega nada. | sem número |  |
| 408 | `messages/pt.json:estilo.forma` | Forma | sem número |  |
| 409 | `messages/pt.json:estilo.pilha` | Botão em pílula | sem número |  |
| 410 | `messages/pt.json:estilo.pilhaNota` | Traço de 3 px em tinta preta e sombra dura 3px 4px. Sobe ao pairar, afunda ao premir — o gesto é o mesmo de quem carrega num botão de plástico. | sem número |  |
| 411 | `messages/pt.json:estilo.cartao` | Cartão | sem número |  |
| 412 | `messages/pt.json:estilo.cartaoNota` | Raio de 22 px, traço de tinta, a mesma sombra dura. Nada de vidro, nada de gradiente, nada de sombra difusa. | sem número |  |
| 413 | `messages/pt.json:estilo.grafico` | Gráfico | sem número |  |
| 414 | `messages/pt.json:estilo.graficoNota` | Toda a figura tem um equivalente textual e é legível nos dois temas. As séries de fundo, que dão contexto, usam tons de tinta e não cor. | sem número |  |
| 415 | `messages/pt.json:estilo.papel` | O papel | sem número |  |
| 416 | `messages/pt.json:estilo.papelNota` | O talão é um objecto físico: não muda de cor quando se apaga a luz. O verde é o papel do que fica contigo, o vermelho o do que sai. | sem número |  |
| 417 | `messages/pt.json:estilo.noite` | A noite do bairro | sem número |  |
| 418 | `messages/pt.json:estilo.noiteNota` | O tema escuro não é um inverso: é o céu (#141a33) sobre o papel das janelas (#1d2442). O mesmo azul, verde e vermelho, medidos para passarem em AA sobre a noite. | sem número |  |
**tema** (4)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 419 | `messages/pt.json:tema.mudarParaClaro` | Mudar para tema claro | sem número |  |
| 420 | `messages/pt.json:tema.mudarParaEscuro` | Mudar para tema escuro | sem número |  |
| 421 | `messages/pt.json:tema.claro` | claro | sem número |  |
| 422 | `messages/pt.json:tema.escuro` | escuro | sem número |  |
**volta ao bairro (P3b)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 423 | `messages/pt.json:pagina.voltarBairro` | Voltar ao bairro | sem número |  |
**SEO (títulos e descrições)** (28)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 424 | `messages/pt.json:seo.rotas.salario.titulo` | Do bruto ao líquido — salário e IRS | sem número |  |
| 425 | `messages/pt.json:seo.rotas.salario.descricao` | Calculadora de salário líquido em Portugal: Segurança Social, IRS por escalões, deduções e o custo real para a empresa. | sem número |  |
| 426 | `messages/pt.json:seo.rotas.irs.titulo` | IRS — escalões, retenção e IRS Jovem | sem número |  |
| 427 | `messages/pt.json:seo.rotas.irs.descricao` | Os escalões de IRS em Portugal, a retenção na fonte mensal e o simulador de IRS Jovem: quanto poupas em cada um dos 10 anos. | ⚠️ número escrito na frase: 10 anos |  |
| 428 | `messages/pt.json:seo.rotas.impostos.titulo` | Impostos — o imposto dentro do preço | sem número |  |
| 429 | `messages/pt.json:seo.rotas.impostos.descricao` | IVA por produto em Portugal e a decomposição do preço dos combustíveis: ISP, taxa de carbono e a cascata do IVA sobre impostos. | sem número |  |
| 430 | `messages/pt.json:seo.rotas.poupanca.titulo` | Poupança — Certificados de Aforro, depósitos e inflação | sem número |  |
| 431 | `messages/pt.json:seo.rotas.poupanca.descricao` | Como funcionam os Certificados de Aforro, a tributação de 28 % sobre juros, e porque a taxa que importa é a real, não a nominal. | ⚠️ número escrito na frase: 28 |  |
| 432 | `messages/pt.json:seo.rotas.credito.titulo` | Crédito — Euribor, spread e prestação | sem número |  |
| 433 | `messages/pt.json:seo.rotas.credito.descricao` | O que é a Euribor, como o spread forma a TAN, e simulador de prestação de crédito habitação com custo total do empréstimo. | sem número |  |
| 434 | `messages/pt.json:seo.rotas.casa.titulo` | Comprar casa — IMT, Imposto de Selo e prestação | sem número |  |
| 435 | `messages/pt.json:seo.rotas.casa.descricao` | O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual do Banco de Portugal. | sem número |  |
| 436 | `messages/pt.json:seo.rotas.inflacao.titulo` | Inflação — quanto mais caro está o que compras | sem número |  |
| 437 | `messages/pt.json:seo.rotas.inflacao.descricao` | IHPC em Portugal por categoria ECOICOP: alimentação, energia, habitação, transportes. Variação homóloga mensal com dados Eurostat. | sem número |  |
| 438 | `messages/pt.json:seo.rotas.precos.titulo` | Preços — combustíveis dia a dia | sem número |  |
| 439 | `messages/pt.json:seo.rotas.precos.descricao` | Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG. | sem número |  |
| 440 | `messages/pt.json:seo.rotas.trabalho.titulo` | Subsídio de desemprego — quanto e por quanto tempo | sem número |  |
| 441 | `messages/pt.json:seo.rotas.trabalho.descricao` | Simulador do subsídio de desemprego em Portugal: 65 % da remuneração de referência, limites do IAS, duração por idade e descontos. | ⚠️ número escrito na frase: 65 |  |
| 442 | `messages/pt.json:seo.rotas.dados.titulo` | Dados — painéis vivos de fontes oficiais | sem número |  |
| 443 | `messages/pt.json:seo.rotas.dados.descricao` | Euribor, TAEG do crédito ao consumo vs teto legal de usura, taxa base dos Certificados de Aforro e o calendário fiscal — direto das fontes oficiais. | sem número |  |
| 444 | `messages/pt.json:seo.rotas.aprender.titulo` | Aprender — glossário de dinheiro | sem número |  |
| 445 | `messages/pt.json:seo.rotas.aprender.descricao` | Euribor, spread, TAN, TAEG, MTIC, escalões, retenção na fonte: os termos do dinheiro em Portugal explicados em português simples, com exemplos. | sem número |  |
| 446 | `messages/pt.json:seo.rotas.metodologia.titulo` | Metodologia e fontes | sem número |  |
| 447 | `messages/pt.json:seo.rotas.metodologia.descricao` | De onde vêm os números do AO CÊNTIMO: fontes oficiais, frequência de atualização e limitações dos simuladores. | sem número |  |
| 448 | `messages/pt.json:seo.rotas.estilo.titulo` | Sistema de design | sem número |  |
| 449 | `messages/pt.json:seo.rotas.estilo.descricao` | Referência viva do design system do AO CÊNTIMO — tokens, tipografia e componentes. | sem número |  |
| 450 | `messages/pt.json:seo.rotas.sobre.titulo` | Sobre | sem número |  |
| 451 | `messages/pt.json:seo.rotas.sobre.descricao` | O que é o AO CÊNTIMO, porquê existe e quem o faz: um projeto pessoal, sem publicidade nem rastreamento, com o código e os dados abertos. | sem número |  |
**edifícios (aria-label)** (11)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 452 | `Bairro.tsx:edificio.fabrica` | Fábrica — para onde vai o teu salário? | sem número |  |
| 453 | `Bairro.tsx:edificio.segsocial` | Segurança Social — os descontos | sem número |  |
| 454 | `Bairro.tsx:edificio.financas` | Finanças — os escalões do IRS | sem número |  |
| 455 | `Bairro.tsx:edificio.banco` | Banco — crédito, juros e a Euribor | sem número |  |
| 456 | `Bairro.tsx:edificio.correios` | Correios — os certificados de aforro | sem número |  |
| 457 | `Bairro.tsx:edificio.bomba` | Bomba de gasolina — quanto do litro é imposto? | sem número |  |
| 458 | `Bairro.tsx:edificio.mercearia` | Mercearia — porque está tudo mais caro? | sem número |  |
| 459 | `Bairro.tsx:edificio.pastelaria` | Pastelaria — o café e o pastel | sem número |  |
| 460 | `Bairro.tsx:edificio.casa` | Casa da Inês — o que chega ao fim do mês | sem número |  |
| 461 | `Bairro.tsx:edificio.quiosque` | Quiosque — os números do país hoje | sem número |  |
| 462 | `Bairro.tsx:edificio.escola` | Escola — as palavras do dinheiro | sem número |  |
**marcadores do mapa** (13)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 463 | `src/lib/bairro/planta.ts:rótulo` | Salário bruto | sem número |  |
| 464 | `src/lib/bairro/planta.ts:rótulo` | TSU da empresa | sem número |  |
| 465 | `src/lib/bairro/planta.ts:rótulo` | IRS retido / mês | sem número |  |
| 466 | `src/lib/bairro/planta.ts:rótulo` | Euribor 12 meses | sem número |  |
| 467 | `src/lib/bairro/planta.ts:rótulo` | Cert. de Aforro | sem número |  |
| 468 | `src/lib/bairro/planta.ts:rótulo` | Gasóleo · hoje | sem número |  |
| 469 | `src/lib/bairro/planta.ts:rótulo` | Gasolina 95 | sem número |  |
| 470 | `src/lib/bairro/planta.ts:rótulo` | Cabaz desde 2020 | sem número |  |
| 471 | `src/lib/bairro/planta.ts:rótulo` | Cafés desde 2020 | sem número |  |
| 472 | `src/lib/bairro/planta.ts:rótulo` | Chega à conta | sem número |  |
| 473 | `src/lib/bairro/planta.ts:rótulo` | Inflação · 12 meses | sem número |  |
| 474 | `src/lib/bairro/planta.ts:rótulo` | Desemprego | sem número |  |
| 475 | `src/lib/bairro/planta.ts:rótulo` | Pergunta do dia | sem número |  |
**letreiros desenhados** (22)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 476 | `src/lib/bairro/planta.ts:letreiro` | FÁBRICA | sem número |  |
| 477 | `src/lib/bairro/planta.ts:letreiro` | FIAÇÃO DO DOURO | sem número |  |
| 478 | `src/lib/bairro/planta.ts:letreiro` | SEGURANÇA SOCIAL | sem número |  |
| 479 | `src/lib/bairro/planta.ts:letreiro` | FINANÇAS | sem número |  |
| 480 | `src/lib/bairro/planta.ts:letreiro` | BANCO | sem número |  |
| 481 | `src/lib/bairro/planta.ts:letreiro` | CORREIOS | sem número |  |
| 482 | `src/lib/bairro/planta.ts:letreiro` | MERCEARIA | sem número |  |
| 483 | `src/lib/bairro/planta.ts:letreiro` | PASTELARIA | sem número |  |
| 484 | `src/lib/bairro/planta.ts:letreiro` | ESCOLA | sem número |  |
| 485 | `src/lib/bairro/planta.ts:letreiro` | JORNAIS | sem número |  |
| 486 | `src/lib/bairro/planta.ts:letreiro` | COMBUSTÍVEIS | sem número |  |
| 487 | `src/lib/bairro/planta.ts:letreiro` | LOJA | sem número |  |
| 488 | `src/lib/bairro/planta.ts:letreiro` | CAFÉ | sem número |  |
| 489 | `src/lib/bairro/planta.ts:letreiro` | VINHO DO PORTO | sem número |  |
| 490 | `src/lib/bairro/planta.ts:letreiro` | CAVES | sem número |  |
| 491 | `src/lib/bairro/planta.ts:letreiro` | GASÓLEO | sem número |  |
| 492 | `src/lib/bairro/planta.ts:letreiro` | GASOLINA 95 | sem número |  |
| 493 | `src/lib/bairro/planta.ts:letreiro` | € por litro | sem número |  |
| 494 | `src/lib/bairro/planta.ts:letreiro` | 22 | sem número |  |
| 495 | `src/lib/bairro/planta.ts:letreiro` | cafe | sem número |  |
| 496 | `src/lib/bairro/planta.ts:letreiro` | o que é a inflação? | sem número |  |
| 497 | `src/lib/bairro/planta.ts:letreiro` | 24 | sem número |  |
**cartas · nome** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 498 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Nome | sem número |  |
| 499 | `messages/pt.json:bairro.elenco.cartas.*.nome` | --- | sem número |  |
| 500 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Inês | sem número |  |
| 501 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Diana | sem número |  |
| 502 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Pedro | sem número |  |
| 503 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Sr. Manuel | sem número |  |
| 504 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Dona Arminda | sem número |  |
| 505 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Gonçalo | sem número |  |
| 506 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Rui e Marta | sem número |  |
**cartas · papel** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 507 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Papel | sem número |  |
| 508 | `messages/pt.json:bairro.elenco.cartas.*.papel` | --- | sem número |  |
| 509 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Operária da fábrica | sem número |  |
| 510 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Professora | sem número |  |
| 511 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Freelancer | sem número |  |
| 512 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Dono da mercearia | sem número |  |
| 513 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Reformada | sem número |  |
| 514 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Estudante, 16 anos | sem número |  |
| 515 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Casal com crédito | sem número |  |
**cartas · perfil** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 516 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Perfil | sem número |  |
| 517 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | --- | sem número |  |
| 518 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Conta de outrem · setor privado | sem número |  |
| 519 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Função pública | sem número |  |
| 520 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Independente · recibos verdes | sem número |  |
| 521 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Pequeno empresário | sem número |  |
| 522 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Pensão e poupança | sem número |  |
| 523 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Mesada e primeiro trabalho | sem número |  |
| 524 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Crédito à habitação | sem número |  |
**cartas · aprende** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 525 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O que aprende | sem número |  |
| 526 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | --- | sem número |  |
| 527 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Porque é que 1 500 € brutos viram 1 167 €. ⚠️ ver dúvida 1 | ⚠️ número escrito na frase: 1 500 · 1 167 · 1 |  |
| 528 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Descontos diferentes para o mesmo salário. | sem número |  |
| 529 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Segurança Social trimestral e IRS da categoria B. | sem número |  |
| 530 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O IVA que cobra, a TSU que paga, o lucro da empresa. | sem número |  |
| 531 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Quanto rende a poupança e o IRS sobre a pensão. | sem número |  |
| 532 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O primeiro recibo, o IRS Jovem, a primeira conta. | sem número |  |
| 533 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | A prestação, a Euribor e quanto do salário ela come. | sem número |  |
**controlos da home** (6)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 534 | `messages/pt.json:bairro.*` | Dia | sem número |  |
| 535 | `messages/pt.json:bairro.*` | Fim de tarde | sem número |  |
| 536 | `messages/pt.json:bairro.*` | Noite | sem número |  |
| 537 | `messages/pt.json:bairro.*` | Ver a tabela dos escalões | sem número |  |
| 538 | `messages/pt.json:bairro.*` | Fechar | sem número |  |
| 539 | `messages/pt.json:bairro.*` | Em breve | sem número |  |
**home · Selo** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 540 | `messages/pt.json:bairro.*` | Independente e gratuito. Aqui ninguém te quer vender nada. | sem número |  |
**home · Título (h1)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 541 | `messages/pt.json:bairro.*` | O dinheiro explicado ao cêntimo. | sem número |  |
**home · Introdução** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 542 | `messages/pt.json:bairro.*` | Este é o bairro. Cada edifício responde a uma pergunta sobre dinheiro — com os números de hoje. Toca num para entrar. | sem número |  |
**home · Selo de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 543 | `messages/pt.json:bairro.*` | Quem vive no bairro | sem número |  |
**home · Título de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 544 | `messages/pt.json:bairro.*` | Escolhe a tua personagem. | sem número |  |
**home · Entrada de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 545 | `messages/pt.json:bairro.*` | O mesmo trabalho, pago de maneiras diferentes: por conta de outrem, na função pública, a recibos verdes ou com empresa própria. Cada pessoa do bairro mostra um caminho diferente do dinheiro. Toca numa para a encontrares no mapa. | sem número |  |
**home · Dica do mapa** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 546 | `messages/pt.json:bairro.*` | Arrasta para passear · roda para aproximar · toca na Fábrica! | sem número |  |
**proposta de alteração (P1)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 547 | `docs/AUDITORIA-CENAS-V5.md §2.2` | `textos-p2c.ts:40-41` — «quase o dobro» hardcoded. | proposta — não aplicada; a copy é do dono |  |
**proposta de alteração (P2)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 548 | `docs/AUDITORIA-CENAS-V5.md §2.2` | Bomba, 50 litros sem «exemplo». | proposta — não aplicada; a copy é do dono |  |
**proposta de alteração (P3)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 549 | `docs/AUDITORIA-CENAS-V5.md §2.2` | `irs-2026.json` fonte. | proposta — não aplicada; a copy é do dono |  |

---

**Total: 549 frases.** As marcadas com ⚠️ têm um número escrito à mão
dentro do texto — se a lei, a série ou a portaria mudar, a frase mente em
silêncio. As que têm `{parametro}` recebem o valor do servidor e
mostram a fonte no rodapé da cena; as restantes são palavras.

_(Regenerar: `node scripts/_revisao-copy.mjs`. Verificar sem escrever:
`node scripts/_revisao-copy.mjs --check`.)_
