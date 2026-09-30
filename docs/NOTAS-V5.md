# NOTAS V5 — registo de trabalho da «O Bairro»

> Documento de trabalho local da V5 (sessões do plano em
> `docs/PACK-V5-PRODUCAO.md`). Dúvidas, hipóteses conservadoras e copy a
> rever, por tarefa. Não é contrato — o contrato é `docs/PRODUTO.md` §6b.

**Regra desta secção:** todo o texto que veio do protótipo é **PROPOSTA**
até o dono o rever. Nada de cenas nem de cartas publicam sem essa revisão
(P4). Onde o texto é meu e não do protótipo, diz-se.

---

## P0 · Fundação

### O que ficou escrito

- **Tokens V5 em `[data-pele="v5"]`, não em `:root`.** Não é uma escolha de
  estilo: `--linha` já é o contador de escalonamento que `/salario`,
  `/impostos`, `/casa`, `/poupanca` e `/trabalho` escrevem no elemento, e
  declará-lo como cor em `:root` invalidaria os quatro `calc()` do
  escalonamento e pararia a animação de entrada dessas cinco rotas. AGENTS e
  PRODUTO registam o porquê.
- **`f1()` passou a devolver número**, como no protótipo. Com o tipo `string`
  só quebravam as chamadas `porta2(f1(x), …)`; era um retrato fiel do
  protótipo que não compilava.
- **`caixa()` ganhou cor de parede por omissão.** O protótipo escrevia
  `fill="undefined"` e o browser pintava a parede de preto, sem erro na
  consola. Há teste a apanhar esta classe de erro.

### Duas divergências deliberadas em relação ao protótipo, no desenho

1. **O terreno deixou de ser um global.** `definirTerreno()` escrevia numa
   variável de módulo que todas as peças de `iso.js` liam. Passou a ser o
   argumento `Terreno`. Motivo: o mapa não pode depender da ordem de
   chamada, e os testes têm de poder correr em paralelo.
2. **O lenço deixou de ser um global.** `cabelo()` lia `lencoAtual`, escrita
   por `pessoa()` e nunca limpa — duas personagens desenhadas em sequência
   podiam ver o lenço uma da outra. Passou a argumento.

### O que não foi observado — e porquê

`dadosBairro()` traz os valores dos marcadores, a linha do salário e as
fontes. **Não** traz ainda os blocos de dados das dez cenas (as oito
rúbricas ECOICOP, a decomposição do combustível, a série da Euribor, o
glossário). Escrevê-los agora seria adivinhar o que cada cena vai pedir;
entram em P2, com a cena à vista, em `dadosCena()`. O pack previa
`montar.cjs` a montar tudo; parti o problema por onde o dado é conhecido.

### Um número escrito à mão no protótipo

`design/prototipos/mapa/mapa.tpl.html` tinha, no objecto `D`:

```
tsu: "23,75 %",
```

Uma taxa contributiva digitada à mão — exactamente o que a Regra nº1
proíbe. Se a TSU mudasse na lei, o mapa continuaria a dizer 23,75 % em
silêncio. **Não foi portada:** em `dados.ts` a taxa sai de
`data/fiscal/ss.json` (`ss.entidadePatronal.taxa`), pelo valor de hoje. O
texto visível fica igual ao protótipo — muda é que deixou de ser uma
constante.

### Dúvidas numeradas para o dono

1. **A carta da Inês tem números escritos à mão.** O protótipo diz
   «Porque é que 1 500 € brutos viram 1 167 €.» — o bruto e o líquido
   digitados na frase. O valor real de hoje é 1 500 € e 1 166,83 €, e o
   líquido muda com a lei. **Proposta:** compor a frase com o valor que
   `dadosBairro()` trouxer, e escrever «1 166,83 €» — ou, se preferir menos
   casas na copy, «1 167 €» arredondado mas ainda calculado. Não está
   implementado: em P1, quando a carta entrar.
2. **O `--linha` da V5 é um nome ocupado.** Resolvi pondo os tokens V5 em
   `[data-pele="v5"]`, o que resolve e não toca em nada. A alternativa —
   renomear o token V5 para `--divisao` — é mais limpa a médio prazo e
   exige mudar o CSS do protótipo. Diga se prefere.
3. **O eslint passou a ignorar `design/`.** `npm run lint` já falhava antes
   de existir uma linha de V5, por causa dos `require()` do `montar.cjs`.
   Tratei os protótipos como maquetes, que é o que o README deles diz. Se
   preferir que sejam limpos também, é trabalho à parte.

---

## Textos PROPOSTA (revisão do dono)

Vêm do protótipo. **Nenhum foi aprovado ainda.**

### Cabeçalho e introdução da home

| Onde | Texto |
|---|---|
| Selo | «Independente e gratuito. Aqui ninguém te quer vender nada.» |
| Título (h1) | «O dinheiro explicado ao cêntimo.» |
| Introdução | «Este é o bairro. Cada edifício responde a uma pergunta sobre dinheiro — com os números de hoje. Toca num para entrar.» |
| Selo de secção | «Quem vive no bairro» |
| Título de secção | «Escolhe a tua personagem.» |
| Entrada de secção | «O mesmo trabalho, pago de maneiras diferentes: por conta de outrem, na função pública, a recibos verdes ou com empresa própria. Cada pessoa do bairro mostra um caminho diferente do dinheiro. Toca numa para a encontrares no mapa.» |
| Dica do mapa | «Arrasta para passear · roda para aproximar · toca na Fábrica!» |

### Controlos

«Dia» · «Fim de tarde» · «Noite» · «Ver a tabela dos escalões» · «Fechar» ·
«Em breve» (o cartão dos edifícios sem cena em P1)

### Nomes acessíveis dos edifícios (`aria-label`)

| `data-id` | Rótulo |
|---|---|
| `fabrica` | «Fábrica — para onde vai o teu salário?» |
| `segsocial` | «Segurança Social — os descontos» |
| `financas` | «Finanças — os escalões do IRS» |
| `banco` | «Banco — crédito, juros e a Euribor» |
| `correios` | «Correios — os certificados de aforro» |
| `bomba` | «Bomba de gasolina — quanto do litro é imposto?» |
| `mercearia` | «Mercearia — porque está tudo mais caro?» |
| `pastelaria` | «Pastelaria — o café e o pastel» |
| `casa` | «Casa da Inês — o que chega ao fim do mês» |
| `quiosque` | «Quiosque — os números do país hoje» |
| `escola` | «Escola — as palavras do dinheiro» |

### Rótulos dos marcadores

«Salário bruto» · «TSU da empresa» · «IRS retido / mês» · «Euribor 12
meses» · «Cert. de Aforro» · «Gasóleo · hoje» · «Gasolina 95» · «Cabaz
desde 2020» · «Cafés desde 2020» · «Chega à conta» · «Inflação · 12 meses»
· «Desemprego» · «Pergunta do dia»

### Placas e letreiros desenhados no mapa

«FÁBRICA» · «FIAÇÃO DO DOURO» · «SEGURANÇA SOCIAL» · «FINANÇAS» ·
«BANCO» · «CORREIOS» · «MERCEARIA» · «PASTELARIA» · «ESCOLA» · «JORNAIS»
· «COMBUSTÍVEIS» · «LOJA · CAFÉ» · «VINHO DO PORTO» · «CAVES» · «GASÓLEO»
· «GASOLINA 95» · «€ por litro» · «22» (o elétrico) · «cafe» (o cavalete
da pastelaria) · «o que é a inflação?» (o quadro da escola) · «24» (a casa
da Inês)

### As sete cartas de personagem

| Nome | Papel | Perfil | O que aprende |
|---|---|---|---|
| Inês | Operária da fábrica | Conta de outrem · setor privado | Porque é que 1 500 € brutos viram 1 167 €. ⚠️ ver dúvida 1 |
| Diana | Professora | Função pública | Descontos diferentes para o mesmo salário. |
| Pedro | Freelancer | Independente · recibos verdes | Segurança Social trimestral e IRS da categoria B. |
| Sr. Manuel | Dono da mercearia | Pequeno empresário | O IVA que cobra, a TSU que paga, o lucro da empresa. |
| Dona Arminda | Reformada | Pensão e poupança | Quanto rende a poupança e o IRS sobre a pensão. |
| Gonçalo | Estudante, 16 anos | Mesada e primeiro trabalho | O primeiro recibo, o IRS Jovem, a primeira conta. |
| Rui e Marta | Casal com crédito | Crédito à habitação | A prestação, a Euribor e quanto do salário ela come. |

A saudação ao tocar numa carta («Olá! Sou a Inês. …») e a frase de
«Em breve» entram em P1, com o painel.

---

## P1 · A home é o bairro

_(por preencher)_

## P2a–P2c · As cenas

_(por preencher — toda a copy das onze cenas é PROPOSTA)_

## P3 · A pele V5 nas 13 rotas

_(por preencher)_

## P4 · Qualidade e lançamento

_(por preencher — a lista final de textos PROPOSTA é a que o dono revê
antes do lançamento. Não lançar sem essa revisão.)_
