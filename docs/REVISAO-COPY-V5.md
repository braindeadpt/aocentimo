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

**home · bairro** (110)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 1 | `messages/pt.json:bairro.selo.independente1` | Independente e gratuito. | sem número | aprovado 2026-10-06 |
| 2 | `messages/pt.json:bairro.selo.independente2` | Aqui ninguém te quer vender nada. | sem número | aprovado 2026-10-06 |
| 3 | `messages/pt.json:bairro.h1a` | O dinheiro explicado | sem número | aprovado 2026-10-06 |
| 4 | `messages/pt.json:bairro.h1b` | ao cêntimo. | sem número | aprovado 2026-10-06 |
| 5 | `messages/pt.json:bairro.intro` | Este é o bairro. Cada edifício responde a uma pergunta sobre dinheiro — com os números de hoje. Toca num para entrar. | sem número | aprovado 2026-10-06 |
| 6 | `messages/pt.json:bairro.dica.arrasta` | Arrasta para passear · roda para aproximar · | sem número | aprovado 2026-10-06 |
| 7 | `messages/pt.json:bairro.dica.fabrica` | toca na Fábrica! | sem número | aprovado 2026-10-06 |
| 8 | `messages/pt.json:bairro.mapa.descricao` | Mapa ilustrado de um bairro português visto de cima: fábrica, Segurança Social, Finanças, banco, correios e bomba de gasolina na avenida do elétrico; mercearia, pastelaria, a casa da Inês, a praça com o quiosque e a escola cá em baixo, no Cais da Ribeira, ligados à avenida por umas escadinhas; a Torre dos Clérigos lá atrás; à frente o Douro, os barcos rabelos e a Ponte D. Luís I. Cada edifício tem por cima um número real de hoje. | sem número | aprovado 2026-10-06 |
| 9 | `messages/pt.json:bairro.mapa.rotuloHora` | Hora do dia | sem número | aprovado 2026-10-06 |
| 10 | `messages/pt.json:bairro.mapa.rotuloAvenida` | Os edifícios da avenida | sem número | aprovado 2026-10-06 |
| 11 | `messages/pt.json:bairro.mapa.rotuloRibeira` | Os edifícios do Cais da Ribeira | sem número | aprovado 2026-10-06 |
| 12 | `messages/pt.json:bairro.hora.dia` | Dia | sem número | aprovado 2026-10-06 |
| 13 | `messages/pt.json:bairro.hora.tarde` | Fim de tarde | sem número | aprovado 2026-10-06 |
| 14 | `messages/pt.json:bairro.hora.noite` | Noite | sem número | aprovado 2026-10-06 |
| 15 | `messages/pt.json:bairro.zoom.mais` | Aproximar | sem número | aprovado 2026-10-06 |
| 16 | `messages/pt.json:bairro.zoom.menos` | Afastar | sem número | aprovado 2026-10-06 |
| 17 | `messages/pt.json:bairro.zoom.tudo` | Ver o bairro todo | sem número | aprovado 2026-10-06 |
| 18 | `messages/pt.json:bairro.cartao.entrar` | toca para entrar → | sem número | aprovado 2026-10-06 |
| 19 | `messages/pt.json:bairro.cartao.breve` | em breve | sem número | aprovado 2026-10-06 |
| 20 | `messages/pt.json:bairro.breve.titulo` | Em breve — este edifício ainda está em obras. | sem número | aprovado 2026-10-06 |
| 21 | `messages/pt.json:bairro.breve.fechar` | Fechar | sem número | aprovado 2026-10-06 |
| 22 | `messages/pt.json:bairro.elenco.etiqueta` | Quem vive no bairro | sem número | aprovado 2026-10-06 |
| 23 | `messages/pt.json:bairro.elenco.h2` | Escolhe a tua personagem. | sem número | aprovado 2026-10-06 |
| 24 | `messages/pt.json:bairro.elenco.lead` | O mesmo trabalho, pago de maneiras diferentes: por conta de outrem, na função pública, a recibos verdes ou com empresa própria. Cada pessoa do bairro mostra um caminho diferente do dinheiro. Toca numa para a encontrares no mapa. | sem número | aprovado 2026-10-06 |
| 25 | `messages/pt.json:bairro.elenco.notas` | De onde vêm os números do bairro: | sem número | aprovado 2026-10-06 |
| 26 | `messages/pt.json:bairro.elenco.ola` | Olá! Sou {quem}. | sem número | aprovado 2026-10-06 |
| 27 | `messages/pt.json:bairro.elenco.cartas.ines.nome` | Inês | sem número | aprovado 2026-10-06 |
| 28 | `messages/pt.json:bairro.elenco.cartas.ines.papel` | Operária da fábrica | sem número | aprovado 2026-10-06 |
| 29 | `messages/pt.json:bairro.elenco.cartas.ines.perfil` | Conta de outrem · setor privado | sem número | aprovado 2026-10-06 |
| 30 | `messages/pt.json:bairro.elenco.cartas.ines.ola` | a Inês | sem número | aprovado 2026-10-06 |
| 31 | `messages/pt.json:bairro.elenco.cartas.ines.aprende` | Porque é que {bruto} brutos viram {liquido}. | sem número | aprovado 2026-10-06 |
| 32 | `messages/pt.json:bairro.elenco.cartas.ines.fala` | Porque é que {bruto} brutos viram {liquido}? Segue o meu salário desde a Fábrica ou simula o teu recibo. | sem número | aprovado 2026-10-06 |
| 33 | `messages/pt.json:bairro.elenco.cartas.ines.cenaRotulo` | Entrar na Fábrica | sem número | aprovado 2026-10-06 |
| 34 | `messages/pt.json:bairro.elenco.cartas.ines.rotaRotulo` | Simular o recibo → | sem número | aprovado 2026-10-06 |
| 35 | `messages/pt.json:bairro.elenco.cartas.diana.nome` | Diana | sem número | aprovado 2026-10-06 |
| 36 | `messages/pt.json:bairro.elenco.cartas.diana.papel` | Professora | sem número | aprovado 2026-10-06 |
| 37 | `messages/pt.json:bairro.elenco.cartas.diana.perfil` | Função pública | sem número | aprovado 2026-10-06 |
| 38 | `messages/pt.json:bairro.elenco.cartas.diana.ola` | a Diana | sem número | aprovado 2026-10-06 |
| 39 | `messages/pt.json:bairro.elenco.cartas.diana.aprende` | O desconto da ADSE no recibo e os escalões do IRS. | sem número | aprovado 2026-10-06 |
| 40 | `messages/pt.json:bairro.elenco.cartas.diana.fala` | Na função pública os escalões do IRS são os mesmos do privado e o desconto da ADSE acumula no recibo: entra nas Finanças ou simula o vencimento. | sem número | aprovado 2026-10-06 |
| 41 | `messages/pt.json:bairro.elenco.cartas.diana.cenaRotulo` | Ver os escalões do IRS | sem número | aprovado 2026-10-06 |
| 42 | `messages/pt.json:bairro.elenco.cartas.diana.rotaRotulo` | Simular com ADSE → | sem número | aprovado 2026-10-06 |
| 43 | `messages/pt.json:bairro.elenco.cartas.pedro.nome` | Pedro | sem número | aprovado 2026-10-06 |
| 44 | `messages/pt.json:bairro.elenco.cartas.pedro.papel` | Freelancer | sem número | aprovado 2026-10-06 |
| 45 | `messages/pt.json:bairro.elenco.cartas.pedro.perfil` | Independente · recibos verdes | sem número | aprovado 2026-10-06 |
| 46 | `messages/pt.json:bairro.elenco.cartas.pedro.ola` | o Pedro | sem número | aprovado 2026-10-06 |
| 47 | `messages/pt.json:bairro.elenco.cartas.pedro.aprende` | Segurança Social trimestral e IRS da categoria B. | sem número | aprovado 2026-10-06 |
| 48 | `messages/pt.json:bairro.elenco.cartas.pedro.fala` | A recibos verdes pago a Segurança Social do meu bolso, de três em três meses. Vê a conta ao balcão ou simula os teus recibos. | sem número | aprovado 2026-10-06 |
| 49 | `messages/pt.json:bairro.elenco.cartas.pedro.cenaRotulo` | Entrar na Seg. Social | sem número | aprovado 2026-10-06 |
| 50 | `messages/pt.json:bairro.elenco.cartas.pedro.rotaRotulo` | Simular recibos verdes → | sem número | aprovado 2026-10-06 |
| 51 | `messages/pt.json:bairro.elenco.cartas.manuel.nome` | Sr. Manuel | sem número | aprovado 2026-10-06 |
| 52 | `messages/pt.json:bairro.elenco.cartas.manuel.papel` | Dono da mercearia | sem número | aprovado 2026-10-06 |
| 53 | `messages/pt.json:bairro.elenco.cartas.manuel.perfil` | Pequeno empresário | sem número | aprovado 2026-10-06 |
| 54 | `messages/pt.json:bairro.elenco.cartas.manuel.ola` | o Sr. Manuel | sem número | aprovado 2026-10-06 |
| 55 | `messages/pt.json:bairro.elenco.cartas.manuel.aprende` | O IVA na caixa, o salário de gerente e o IRC da empresa. | sem número | aprovado 2026-10-06 |
| 56 | `messages/pt.json:bairro.elenco.cartas.manuel.fala` | O IVA que entra na caixa não é da mercearia e o lucro paga IRC antes de chegar ao bolso. Entra na Mercearia ou simula as contas de uma PME. | sem número | aprovado 2026-10-06 |
| 57 | `messages/pt.json:bairro.elenco.cartas.manuel.cenaRotulo` | Entrar na Mercearia | sem número | aprovado 2026-10-06 |
| 58 | `messages/pt.json:bairro.elenco.cartas.manuel.rotaRotulo` | Simular uma PME → | sem número | aprovado 2026-10-06 |
| 59 | `messages/pt.json:bairro.elenco.cartas.arminda.nome` | Dona Arminda | sem número | aprovado 2026-10-06 |
| 60 | `messages/pt.json:bairro.elenco.cartas.arminda.papel` | Reformada | sem número | aprovado 2026-10-06 |
| 61 | `messages/pt.json:bairro.elenco.cartas.arminda.perfil` | Pensão e poupança | sem número | aprovado 2026-10-06 |
| 62 | `messages/pt.json:bairro.elenco.cartas.arminda.ola` | a Dona Arminda | sem número | aprovado 2026-10-06 |
| 63 | `messages/pt.json:bairro.elenco.cartas.arminda.aprende` | A retenção da pensão de reforma e o juro real da poupança. | sem número | aprovado 2026-10-06 |
| 64 | `messages/pt.json:bairro.elenco.cartas.arminda.fala` | A pensão de reforma está isenta de Segurança Social e retém IRS por tabelas próprias. Entra nos Correios ou simula a tua pensão. | sem número | aprovado 2026-10-06 |
| 65 | `messages/pt.json:bairro.elenco.cartas.arminda.cenaRotulo` | Entrar nos Correios | sem número | aprovado 2026-10-06 |
| 66 | `messages/pt.json:bairro.elenco.cartas.arminda.rotaRotulo` | Simular a pensão → | sem número | aprovado 2026-10-06 |
| 67 | `messages/pt.json:bairro.elenco.cartas.goncalo.nome` | Gonçalo | sem número | aprovado 2026-10-06 |
| 68 | `messages/pt.json:bairro.elenco.cartas.goncalo.papel` | Estudante, 16 anos | ⚠️ número escrito na frase: 16 anos | aprovado 2026-10-06 |
| 69 | `messages/pt.json:bairro.elenco.cartas.goncalo.perfil` | Mesada e primeiro trabalho | sem número | aprovado 2026-10-06 |
| 70 | `messages/pt.json:bairro.elenco.cartas.goncalo.ola` | o Gonçalo | sem número | aprovado 2026-10-06 |
| 71 | `messages/pt.json:bairro.elenco.cartas.goncalo.aprende` | As palavras do dinheiro na Escola e o benefício do IRS Jovem. | sem número | aprovado 2026-10-06 |
| 72 | `messages/pt.json:bairro.elenco.cartas.goncalo.fala` | Antes do primeiro recibo convém saber ler os números. Passa pela Escola ou vê quanto poupa o IRS Jovem. | sem número | aprovado 2026-10-06 |
| 73 | `messages/pt.json:bairro.elenco.cartas.goncalo.cenaRotulo` | Entrar na Escola | sem número | aprovado 2026-10-06 |
| 74 | `messages/pt.json:bairro.elenco.cartas.goncalo.rotaRotulo` | Ver o IRS Jovem → | sem número | aprovado 2026-10-06 |
| 75 | `messages/pt.json:bairro.elenco.cartas.rui.nome` | Rui e Marta | sem número | aprovado 2026-10-06 |
| 76 | `messages/pt.json:bairro.elenco.cartas.rui.papel` | Casal com crédito | sem número | aprovado 2026-10-06 |
| 77 | `messages/pt.json:bairro.elenco.cartas.rui.perfil` | Crédito à habitação | sem número | aprovado 2026-10-06 |
| 78 | `messages/pt.json:bairro.elenco.cartas.rui.ola` | o Rui, e esta é a Marta | sem número | aprovado 2026-10-06 |
| 79 | `messages/pt.json:bairro.elenco.cartas.rui.aprende` | A prestação, a Euribor e quanto do salário ela come. | sem número | aprovado 2026-10-06 |
| 80 | `messages/pt.json:bairro.elenco.cartas.rui.fala` | Quando a Euribor mexe, a prestação da casa mexe com ela. Entra no Banco ou simula um empréstimo. | sem número | aprovado 2026-10-06 |
| 81 | `messages/pt.json:bairro.elenco.cartas.rui.cenaRotulo` | Entrar no Banco | sem número | aprovado 2026-10-06 |
| 82 | `messages/pt.json:bairro.elenco.cartas.rui.rotaRotulo` | Simular a prestação → | sem número | aprovado 2026-10-06 |
| 83 | `messages/pt.json:bairro.edificios.fabrica.titulo` | Fábrica | sem número | aprovado 2026-10-06 |
| 84 | `messages/pt.json:bairro.edificios.fabrica.pergunta` | Para onde vai o teu salário? | sem número | aprovado 2026-10-06 |
| 85 | `messages/pt.json:bairro.edificios.segsocial.titulo` | Segurança Social | sem número | aprovado 2026-10-06 |
| 86 | `messages/pt.json:bairro.edificios.segsocial.pergunta` | O que são os descontos e para que servem? | sem número | aprovado 2026-10-06 |
| 87 | `messages/pt.json:bairro.edificios.financas.titulo` | Finanças | sem número | aprovado 2026-10-06 |
| 88 | `messages/pt.json:bairro.edificios.financas.pergunta` | Como funcionam os escalões do IRS? | sem número | aprovado 2026-10-06 |
| 89 | `messages/pt.json:bairro.edificios.banco.titulo` | Banco | sem número | aprovado 2026-10-06 |
| 90 | `messages/pt.json:bairro.edificios.banco.pergunta` | Quanto custa pedir dinheiro emprestado? | sem número | aprovado 2026-10-06 |
| 91 | `messages/pt.json:bairro.edificios.correios.titulo` | Correios | sem número | aprovado 2026-10-06 |
| 92 | `messages/pt.json:bairro.edificios.correios.pergunta` | Onde rende a poupança da Dona Arminda? | sem número | aprovado 2026-10-06 |
| 93 | `messages/pt.json:bairro.edificios.bomba.titulo` | Bomba de gasolina | sem número | aprovado 2026-10-06 |
| 94 | `messages/pt.json:bairro.edificios.bomba.pergunta` | Quanto do litro é imposto? | sem número | aprovado 2026-10-06 |
| 95 | `messages/pt.json:bairro.edificios.mercearia.titulo` | Mercearia do Manuel | sem número | aprovado 2026-10-06 |
| 96 | `messages/pt.json:bairro.edificios.mercearia.pergunta` | Porque está tudo mais caro? | sem número | aprovado 2026-10-06 |
| 97 | `messages/pt.json:bairro.edificios.pastelaria.titulo` | Pastelaria | sem número | aprovado 2026-10-06 |
| 98 | `messages/pt.json:bairro.edificios.pastelaria.pergunta` | Quanto subiu o café? | sem número | aprovado 2026-10-06 |
| 99 | `messages/pt.json:bairro.edificios.casa.titulo` | Casa da Inês | sem número | aprovado 2026-10-06 |
| 100 | `messages/pt.json:bairro.edificios.casa.pergunta` | Quantos meses de trabalho custa uma casa? | sem número | aprovado 2026-10-06 |
| 101 | `messages/pt.json:bairro.edificios.quiosque.titulo` | Quiosque da praça | sem número | aprovado 2026-10-06 |
| 102 | `messages/pt.json:bairro.edificios.quiosque.pergunta` | Os números do país, hoje | sem número | aprovado 2026-10-06 |
| 103 | `messages/pt.json:bairro.edificios.escola.titulo` | Escola | sem número | aprovado 2026-10-06 |
| 104 | `messages/pt.json:bairro.edificios.escola.pergunta` | Aprender a ler gráficos e as palavras do dinheiro | sem número | aprovado 2026-10-06 |
| 105 | `messages/pt.json:bairro.edificios.clerigos.titulo` | Torre dos Clérigos | sem número | aprovado 2026-10-06 |
| 106 | `messages/pt.json:bairro.edificios.clerigos.pergunta` | O Norte na economia | sem número | aprovado 2026-10-06 |
| 107 | `messages/pt.json:bairro.extra.bomba` | Hoje: gasóleo {gasoleo} e gasolina 95 {gasolina} por litro, em média. | ⚠️ número escrito na frase: 95 | aprovado 2026-10-06 |
| 108 | `messages/pt.json:bairro.extra.banco` | A Euribor a 12 meses está em {euribor}. | ⚠️ número escrito na frase: 12 meses | aprovado 2026-10-06 |
| 109 | `messages/pt.json:bairro.extra.correios` | Os Certificados de Aforro rendem {ca} (taxa base). | sem número | aprovado 2026-10-06 |
| 110 | `messages/pt.json:bairro.extra.quiosque` | Inflação: {inflacao} num ano. Desemprego: {desemprego}. | sem número | aprovado 2026-10-06 |
**`/estilo` (P3c)** (23)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 111 | `messages/pt.json:estilo.titulo` | Contrato visual «O Bairro» | sem número | aprovado 2026-10-06 |
| 112 | `messages/pt.json:estilo.nota` | Esta página é a referência do aspecto do site: as cores, a tipografia e as formas que se repetem em todas as páginas. Onde ela e as regras da casa divergirem, ganham as regras da casa. | sem número | aprovado 2026-10-06 |
| 113 | `messages/pt.json:estilo.cor` | Cor | sem número | aprovado 2026-10-06 |
| 114 | `messages/pt.json:estilo.corNota` | Cada cor tem um nome e um sítio. O verde é o que fica contigo, o vermelho é o que sai, o azul é neutro e informa. Nenhuma cor decora. | sem número | aprovado 2026-10-06 |
| 115 | `messages/pt.json:estilo.tipografia` | Tipografia | sem número | aprovado 2026-10-06 |
| 116 | `messages/pt.json:estilo.tipografiaNota` | Uma família para tudo, uma mão para os gráficos, e a monoespaçada do sistema para o talão e o recibo. Não há fonte editorial. | sem número | aprovado 2026-10-06 |
| 117 | `messages/pt.json:estilo.arquivoEixo` | O eixo da largura | sem número | aprovado 2026-10-06 |
| 118 | `messages/pt.json:estilo.arquivoEixoNota` | O mesmo Archivo aperta a manchete e alarga o número. É assim que um título se distingue de um corpo — não é outra fonte. | sem número | aprovado 2026-10-06 |
| 119 | `messages/pt.json:estilo.mao` | Caveat — a mão | sem número | aprovado 2026-10-06 |
| 120 | `messages/pt.json:estilo.maoNota` | Só nos gráficos e no quadro da escola. Nunca num número que a pessoa precise de ler já. | sem número | aprovado 2026-10-06 |
| 121 | `messages/pt.json:estilo.mono` | Monoespaçada do sistema | sem número | aprovado 2026-10-06 |
| 122 | `messages/pt.json:estilo.monoNota` | O talão e o recibo. Não descarrega nada. | sem número | aprovado 2026-10-06 |
| 123 | `messages/pt.json:estilo.forma` | Forma | sem número | aprovado 2026-10-06 |
| 124 | `messages/pt.json:estilo.pilha` | Botão em pílula | sem número | aprovado 2026-10-06 |
| 125 | `messages/pt.json:estilo.pilhaNota` | Traço de 3 px em tinta preta e sombra dura 3px 4px. Sobe ao pairar, afunda ao premir — o gesto é o mesmo de quem carrega num botão de plástico. | sem número | aprovado 2026-10-06 |
| 126 | `messages/pt.json:estilo.cartao` | Cartão | sem número | aprovado 2026-10-06 |
| 127 | `messages/pt.json:estilo.cartaoNota` | Raio de 22 px, traço de tinta, a mesma sombra dura. Nada de vidro, nada de gradiente, nada de sombra difusa. | sem número | aprovado 2026-10-06 |
| 128 | `messages/pt.json:estilo.grafico` | Gráfico | sem número | aprovado 2026-10-06 |
| 129 | `messages/pt.json:estilo.graficoNota` | Toda a figura tem um equivalente textual e é legível nos dois temas. As séries de fundo, que dão contexto, usam tons de tinta e não cor. | sem número | aprovado 2026-10-06 |
| 130 | `messages/pt.json:estilo.papel` | O papel | sem número | aprovado 2026-10-06 |
| 131 | `messages/pt.json:estilo.papelNota` | O talão é um objecto físico: não muda de cor quando se apaga a luz. O verde é o papel do que fica contigo, o vermelho o do que sai. | sem número | aprovado 2026-10-06 |
| 132 | `messages/pt.json:estilo.noite` | A noite do bairro | sem número | aprovado 2026-10-06 |
| 133 | `messages/pt.json:estilo.noiteNota` | O tema escuro não é um inverso: é o céu (#141a33) sobre o papel das janelas (#1d2442). O mesmo azul, verde e vermelho, medidos para passarem em AA sobre a noite. | sem número | aprovado 2026-10-06 |
**tema** (4)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 134 | `messages/pt.json:tema.mudarParaClaro` | Mudar para tema claro | sem número | aprovado 2026-10-06 |
| 135 | `messages/pt.json:tema.mudarParaEscuro` | Mudar para tema escuro | sem número | aprovado 2026-10-06 |
| 136 | `messages/pt.json:tema.claro` | claro | sem número | aprovado 2026-10-06 |
| 137 | `messages/pt.json:tema.escuro` | escuro | sem número | aprovado 2026-10-06 |
**volta ao bairro (P3b)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 138 | `messages/pt.json:pagina.voltarBairro` | Voltar ao bairro | sem número | aprovado 2026-10-06 |
**SEO (títulos e descrições)** (28)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 139 | `messages/pt.json:seo.rotas.salario.titulo` | Do bruto ao líquido — salário e IRS | sem número | aprovado 2026-10-06 |
| 140 | `messages/pt.json:seo.rotas.salario.descricao` | Calculadora de salário líquido em Portugal: Segurança Social, IRS por escalões, deduções e o custo real para a empresa. | sem número | aprovado 2026-10-06 |
| 141 | `messages/pt.json:seo.rotas.irs.titulo` | IRS — escalões, retenção e IRS Jovem | sem número | aprovado 2026-10-06 |
| 142 | `messages/pt.json:seo.rotas.irs.descricao` | Os escalões de IRS em Portugal, a retenção na fonte mensal e o simulador de IRS Jovem: quanto poupas em cada um dos 10 anos. | ⚠️ número escrito na frase: 10 anos | aprovado 2026-10-06 |
| 143 | `messages/pt.json:seo.rotas.impostos.titulo` | Impostos — o imposto dentro do preço | sem número | aprovado 2026-10-06 |
| 144 | `messages/pt.json:seo.rotas.impostos.descricao` | IVA por produto em Portugal e a decomposição do preço dos combustíveis: ISP, taxa de carbono e a cascata do IVA sobre impostos. | sem número | aprovado 2026-10-06 |
| 145 | `messages/pt.json:seo.rotas.poupanca.titulo` | Poupança — Certificados de Aforro, depósitos e inflação | sem número | aprovado 2026-10-06 |
| 146 | `messages/pt.json:seo.rotas.poupanca.descricao` | Como funcionam os Certificados de Aforro, a tributação de 28 % sobre juros, e porque a taxa que importa é a real, não a nominal. | ⚠️ número escrito na frase: 28 | aprovado 2026-10-06 |
| 147 | `messages/pt.json:seo.rotas.credito.titulo` | Crédito — Euribor, spread e prestação | sem número | aprovado 2026-10-06 |
| 148 | `messages/pt.json:seo.rotas.credito.descricao` | O que é a Euribor, como o spread forma a TAN, e simulador de prestação de crédito habitação com custo total do empréstimo. | sem número | aprovado 2026-10-06 |
| 149 | `messages/pt.json:seo.rotas.casa.titulo` | Comprar casa — IMT, Imposto de Selo e prestação | sem número | aprovado 2026-10-06 |
| 150 | `messages/pt.json:seo.rotas.casa.descricao` | O custo real de comprar casa em Portugal: IMT, Imposto de Selo, registos e a prestação com a Euribor atual do Banco de Portugal. | sem número | aprovado 2026-10-06 |
| 151 | `messages/pt.json:seo.rotas.inflacao.titulo` | Inflação — quanto mais caro está o que compras | sem número | aprovado 2026-10-06 |
| 152 | `messages/pt.json:seo.rotas.inflacao.descricao` | IHPC em Portugal por categoria ECOICOP: alimentação, energia, habitação, transportes. Variação homóloga mensal com dados Eurostat. | sem número | aprovado 2026-10-06 |
| 153 | `messages/pt.json:seo.rotas.precos.titulo` | Preços — combustíveis dia a dia | sem número | aprovado 2026-10-06 |
| 154 | `messages/pt.json:seo.rotas.precos.descricao` | Preços dos combustíveis em Portugal em euros por litro, com variações diária, semanal, mensal e anual — dados DGEG. | sem número | aprovado 2026-10-06 |
| 155 | `messages/pt.json:seo.rotas.trabalho.titulo` | Subsídio de desemprego — quanto e por quanto tempo | sem número | aprovado 2026-10-06 |
| 156 | `messages/pt.json:seo.rotas.trabalho.descricao` | Simulador do subsídio de desemprego em Portugal: 65 % da remuneração de referência, limites do IAS, duração por idade e descontos. | ⚠️ número escrito na frase: 65 | aprovado 2026-10-06 |
| 157 | `messages/pt.json:seo.rotas.dados.titulo` | Dados — painéis vivos de fontes oficiais | sem número | aprovado 2026-10-06 |
| 158 | `messages/pt.json:seo.rotas.dados.descricao` | Euribor, TAEG do crédito ao consumo vs teto legal de usura, taxa base dos Certificados de Aforro e o calendário fiscal — direto das fontes oficiais. | sem número | aprovado 2026-10-06 |
| 159 | `messages/pt.json:seo.rotas.aprender.titulo` | Aprender — glossário de dinheiro | sem número | aprovado 2026-10-06 |
| 160 | `messages/pt.json:seo.rotas.aprender.descricao` | Euribor, spread, TAN, TAEG, MTIC, escalões, retenção na fonte: os termos do dinheiro em Portugal explicados em português simples, com exemplos. | sem número | aprovado 2026-10-06 |
| 161 | `messages/pt.json:seo.rotas.metodologia.titulo` | Metodologia e fontes | sem número | aprovado 2026-10-06 |
| 162 | `messages/pt.json:seo.rotas.metodologia.descricao` | De onde vêm os números do AO CÊNTIMO: fontes oficiais, frequência de atualização e limitações dos simuladores. | sem número | aprovado 2026-10-06 |
| 163 | `messages/pt.json:seo.rotas.estilo.titulo` | Sistema de design | sem número | aprovado 2026-10-06 |
| 164 | `messages/pt.json:seo.rotas.estilo.descricao` | Referência viva do design system do AO CÊNTIMO — tokens, tipografia e componentes. | sem número | aprovado 2026-10-06 |
| 165 | `messages/pt.json:seo.rotas.sobre.titulo` | Sobre | sem número | aprovado 2026-10-06 |
| 166 | `messages/pt.json:seo.rotas.sobre.descricao` | O que é o AO CÊNTIMO, porque existe e quem o faz: um projeto pessoal, sem publicidade nem rastreamento, com o código e os dados abertos. | sem número | aprovado 2026-10-06 |
**edifícios (aria-label)** (11)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 167 | `Bairro.tsx:edificio.fabrica` | Fábrica — para onde vai o teu salário? | sem número | aprovado 2026-10-06 |
| 168 | `Bairro.tsx:edificio.segsocial` | Segurança Social — os descontos | sem número | aprovado 2026-10-06 |
| 169 | `Bairro.tsx:edificio.financas` | Finanças — os escalões do IRS | sem número | aprovado 2026-10-06 |
| 170 | `Bairro.tsx:edificio.banco` | Banco — crédito, juros e a Euribor | sem número | aprovado 2026-10-06 |
| 171 | `Bairro.tsx:edificio.correios` | Correios — os certificados de aforro | sem número | aprovado 2026-10-06 |
| 172 | `Bairro.tsx:edificio.bomba` | Bomba de gasolina — quanto do litro é imposto? | sem número | aprovado 2026-10-06 |
| 173 | `Bairro.tsx:edificio.mercearia` | Mercearia — porque está tudo mais caro? | sem número | aprovado 2026-10-06 |
| 174 | `Bairro.tsx:edificio.pastelaria` | Pastelaria — o café e o pastel | sem número | aprovado 2026-10-06 |
| 175 | `Bairro.tsx:edificio.casa` | Casa da Inês — o que chega ao fim do mês | sem número | aprovado 2026-10-06 |
| 176 | `Bairro.tsx:edificio.quiosque` | Quiosque — os números do país hoje | sem número | aprovado 2026-10-06 |
| 177 | `Bairro.tsx:edificio.escola` | Escola — as palavras do dinheiro | sem número | aprovado 2026-10-06 |
**marcadores do mapa** (13)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 178 | `src/lib/bairro/planta.ts:rótulo` | Salário bruto | sem número | aprovado 2026-10-06 |
| 179 | `src/lib/bairro/planta.ts:rótulo` | TSU da empresa | sem número | aprovado 2026-10-06 |
| 180 | `src/lib/bairro/planta.ts:rótulo` | IRS retido / mês | sem número | aprovado 2026-10-06 |
| 181 | `src/lib/bairro/planta.ts:rótulo` | Euribor 12 meses | sem número | aprovado 2026-10-06 |
| 182 | `src/lib/bairro/planta.ts:rótulo` | Cert. de Aforro | sem número | aprovado 2026-10-06 |
| 183 | `src/lib/bairro/planta.ts:rótulo` | Gasóleo · hoje | sem número | aprovado 2026-10-06 |
| 184 | `src/lib/bairro/planta.ts:rótulo` | Gasolina 95 | sem número | aprovado 2026-10-06 |
| 185 | `src/lib/bairro/planta.ts:rótulo` | Cabaz desde 2020 | sem número | aprovado 2026-10-06 |
| 186 | `src/lib/bairro/planta.ts:rótulo` | Cafés desde 2020 | sem número | aprovado 2026-10-06 |
| 187 | `src/lib/bairro/planta.ts:rótulo` | Chega à conta | sem número | aprovado 2026-10-06 |
| 188 | `src/lib/bairro/planta.ts:rótulo` | Inflação · 12 meses | sem número | aprovado 2026-10-06 |
| 189 | `src/lib/bairro/planta.ts:rótulo` | Desemprego | sem número | aprovado 2026-10-06 |
| 190 | `src/lib/bairro/planta.ts:rótulo` | Pergunta do dia | sem número | aprovado 2026-10-06 |
**letreiros desenhados** (22)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 191 | `src/lib/bairro/planta.ts:letreiro` | FÁBRICA | sem número | aprovado 2026-10-06 |
| 192 | `src/lib/bairro/planta.ts:letreiro` | FIAÇÃO DO DOURO | sem número | aprovado 2026-10-06 |
| 193 | `src/lib/bairro/planta.ts:letreiro` | SEGURANÇA SOCIAL | sem número | aprovado 2026-10-06 |
| 194 | `src/lib/bairro/planta.ts:letreiro` | FINANÇAS | sem número | aprovado 2026-10-06 |
| 195 | `src/lib/bairro/planta.ts:letreiro` | BANCO | sem número | aprovado 2026-10-06 |
| 196 | `src/lib/bairro/planta.ts:letreiro` | CORREIOS | sem número | aprovado 2026-10-06 |
| 197 | `src/lib/bairro/planta.ts:letreiro` | MERCEARIA | sem número | aprovado 2026-10-06 |
| 198 | `src/lib/bairro/planta.ts:letreiro` | PASTELARIA | sem número | aprovado 2026-10-06 |
| 199 | `src/lib/bairro/planta.ts:letreiro` | ESCOLA | sem número | aprovado 2026-10-06 |
| 200 | `src/lib/bairro/planta.ts:letreiro` | JORNAIS | sem número | aprovado 2026-10-06 |
| 201 | `src/lib/bairro/planta.ts:letreiro` | COMBUSTÍVEIS | sem número | aprovado 2026-10-06 |
| 202 | `src/lib/bairro/planta.ts:letreiro` | LOJA | sem número | aprovado 2026-10-06 |
| 203 | `src/lib/bairro/planta.ts:letreiro` | CAFÉ | sem número | aprovado 2026-10-06 |
| 204 | `src/lib/bairro/planta.ts:letreiro` | VINHO DO PORTO | sem número | aprovado 2026-10-06 |
| 205 | `src/lib/bairro/planta.ts:letreiro` | CAVES | sem número | aprovado 2026-10-06 |
| 206 | `src/lib/bairro/planta.ts:letreiro` | GASÓLEO | sem número | aprovado 2026-10-06 |
| 207 | `src/lib/bairro/planta.ts:letreiro` | GASOLINA 95 | sem número | aprovado 2026-10-06 |
| 208 | `src/lib/bairro/planta.ts:letreiro` | € por litro | sem número | aprovado 2026-10-06 |
| 209 | `src/lib/bairro/planta.ts:letreiro` | 22 | sem número | aprovado 2026-10-06 |
| 210 | `src/lib/bairro/planta.ts:letreiro` | cafe | sem número | aprovado 2026-10-06 |
| 211 | `src/lib/bairro/planta.ts:letreiro` | o que é a inflação? | sem número | aprovado 2026-10-06 |
| 212 | `src/lib/bairro/planta.ts:letreiro` | 24 | sem número | aprovado 2026-10-06 |
**cartas · nome** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 213 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Nome | sem número | aprovado 2026-10-06 |
| 214 | `messages/pt.json:bairro.elenco.cartas.*.nome` | --- | sem número | aprovado 2026-10-06 |
| 215 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Inês | sem número | aprovado 2026-10-06 |
| 216 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Diana | sem número | aprovado 2026-10-06 |
| 217 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Pedro | sem número | aprovado 2026-10-06 |
| 218 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Sr. Manuel | sem número | aprovado 2026-10-06 |
| 219 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Dona Arminda | sem número | aprovado 2026-10-06 |
| 220 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Gonçalo | sem número | aprovado 2026-10-06 |
| 221 | `messages/pt.json:bairro.elenco.cartas.*.nome` | Rui e Marta | sem número | aprovado 2026-10-06 |
**cartas · papel** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 222 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Papel | sem número | aprovado 2026-10-06 |
| 223 | `messages/pt.json:bairro.elenco.cartas.*.papel` | --- | sem número | aprovado 2026-10-06 |
| 224 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Operária da fábrica | sem número | aprovado 2026-10-06 |
| 225 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Professora | sem número | aprovado 2026-10-06 |
| 226 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Freelancer | sem número | aprovado 2026-10-06 |
| 227 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Dono da mercearia | sem número | aprovado 2026-10-06 |
| 228 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Reformada | sem número | aprovado 2026-10-06 |
| 229 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Estudante, 16 anos | sem número | aprovado 2026-10-06 |
| 230 | `messages/pt.json:bairro.elenco.cartas.*.papel` | Casal com crédito | sem número | aprovado 2026-10-06 |
**cartas · perfil** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 231 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Perfil | sem número | aprovado 2026-10-06 |
| 232 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | --- | sem número | aprovado 2026-10-06 |
| 233 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Conta de outrem · setor privado | sem número | aprovado 2026-10-06 |
| 234 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Função pública | sem número | aprovado 2026-10-06 |
| 235 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Independente · recibos verdes | sem número | aprovado 2026-10-06 |
| 236 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Pequeno empresário | sem número | aprovado 2026-10-06 |
| 237 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Pensão e poupança | sem número | aprovado 2026-10-06 |
| 238 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Mesada e primeiro trabalho | sem número | aprovado 2026-10-06 |
| 239 | `messages/pt.json:bairro.elenco.cartas.*.perfil` | Crédito à habitação | sem número | aprovado 2026-10-06 |
**cartas · aprende** (9)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 240 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O que aprende | sem número | aprovado 2026-10-06 |
| 241 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | --- | sem número | aprovado 2026-10-06 |
| 242 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Porque é que 1 500 € brutos viram 1 167 €. ⚠️ ver dúvida 1 | ⚠️ número escrito na frase: 1 500 · 1 167 · 1 | aprovado 2026-10-06 |
| 243 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Descontos diferentes para o mesmo salário. | sem número | aprovado 2026-10-06 |
| 244 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Segurança Social trimestral e IRS da categoria B. | sem número | aprovado 2026-10-06 |
| 245 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O IVA que cobra, a TSU que paga, o lucro da empresa. | sem número | aprovado 2026-10-06 |
| 246 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | Quanto rende a poupança e o IRS sobre a pensão. | sem número | aprovado 2026-10-06 |
| 247 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | O primeiro recibo, o IRS Jovem, a primeira conta. | sem número | aprovado 2026-10-06 |
| 248 | `messages/pt.json:bairro.elenco.cartas.*.aprende` | A prestação, a Euribor e quanto do salário ela come. | sem número | aprovado 2026-10-06 |
**controlos da home** (6)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 249 | `messages/pt.json:bairro.*` | Dia | sem número | aprovado 2026-10-06 |
| 250 | `messages/pt.json:bairro.*` | Fim de tarde | sem número | aprovado 2026-10-06 |
| 251 | `messages/pt.json:bairro.*` | Noite | sem número | aprovado 2026-10-06 |
| 252 | `messages/pt.json:bairro.*` | Ver a tabela dos escalões | sem número | aprovado 2026-10-06 |
| 253 | `messages/pt.json:bairro.*` | Fechar | sem número | aprovado 2026-10-06 |
| 254 | `messages/pt.json:bairro.*` | Em breve | sem número | aprovado 2026-10-06 |
**home · Selo** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 255 | `messages/pt.json:bairro.*` | Independente e gratuito. Aqui ninguém te quer vender nada. | sem número | aprovado 2026-10-06 |
**home · Título (h1)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 256 | `messages/pt.json:bairro.*` | O dinheiro explicado ao cêntimo. | sem número | aprovado 2026-10-06 |
**home · Introdução** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 257 | `messages/pt.json:bairro.*` | Este é o bairro. Cada edifício responde a uma pergunta sobre dinheiro — com os números de hoje. Toca num para entrar. | sem número | aprovado 2026-10-06 |
**home · Selo de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 258 | `messages/pt.json:bairro.*` | Quem vive no bairro | sem número | aprovado 2026-10-06 |
**home · Título de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 259 | `messages/pt.json:bairro.*` | Escolhe a tua personagem. | sem número | aprovado 2026-10-06 |
**home · Entrada de secção** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 260 | `messages/pt.json:bairro.*` | O mesmo trabalho, pago de maneiras diferentes: por conta de outrem, na função pública, a recibos verdes ou com empresa própria. Cada pessoa do bairro mostra um caminho diferente do dinheiro. Toca numa para a encontrares no mapa. | sem número | aprovado 2026-10-06 |
**home · Dica do mapa** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 261 | `messages/pt.json:bairro.*` | Arrasta para passear · roda para aproximar · toca na Fábrica! | sem número | aprovado 2026-10-06 |
**proposta de alteração (P1)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 262 | `docs/AUDITORIA-CENAS-V5.md §2.2` | `textos-p2c.ts:40-41` — «quase o dobro» hardcoded. | proposta da auditoria | aplicada no #68 (a comparação «quase o dobro» foi retirada) |
**proposta de alteração (P2)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 263 | `docs/AUDITORIA-CENAS-V5.md §2.2` | Bomba, 50 litros sem «exemplo». | proposta da auditoria | aplicada: «Imagina que o Pedro vai atestar 50 litros» |
**proposta de alteração (P3)** (1)

| # | Onde (ficheiro:chave) | Texto tal como está no site | Fonte do número | aprovado / alterar |
|---|---|---|---|---|
| 264 | `docs/AUDITORIA-CENAS-V5.md §2.2` | `irs-2026.json` fonte. | proposta da auditoria | em aberto: é metadado do irs-2026.json, não copy do site |

---

**Total: 264 frases.** As marcadas com ⚠️ têm um número escrito à mão
dentro do texto — se a lei, a série ou a portaria mudar, a frase mente em
silêncio. As que têm `{parametro}` recebem o valor do servidor e
mostram a fonte no rodapé da cena; as restantes são palavras.

_(Regenerar: `node scripts/_revisao-copy.mjs`. Verificar sem escrever:
`node scripts/_revisao-copy.mjs --check`.)_
