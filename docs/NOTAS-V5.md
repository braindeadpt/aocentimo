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

### P1-1 — o mapa, sem uma linha de JavaScript

O bairro e os treze marcadores chegam ao utilizador em HTML do servidor
(`mundo.ts` embrulha a planta em oito camadas; `HomeBairro` entrega-a ao
`<Bairro>` por prop). Confirmado no browser: os valores que aparecem são os
de `data/` — `1 500,00 €`, `23,75 %`, `168,17 €`, `2,95 %`, `2,50 %`,
`2,181 €/L`, `2,097 €/L`, `+35 %`, `+47 %`, `1 166,83 €`, `+3,6 %`, `5,7 %`.

**A planta não vai para o bundle do cliente.** Importar `planta.ts` na
câmara arrastaria o desenho inteiro (100+ KB) para o browser só por causa
de dois números; os pontos de enquadramento chegam prontos do servidor, em
coordenadas de ecrã, por prop (`Enquadramentos { perto, longe }`). Verificado
por `grep` nos chunks: zero vestígios.

### Três coisas que o CSS obriga a decidir (medidas no browser)

1. **`scale()` não aceita comprimento.** `scale(calc(100cqw / 2219))` dá
   `none`. A `scale` do enquadramento por omissão tem de ser um número
   fixo, apurado para uma janela de referência. Sem JavaScript o mapa
   aparece com um enquadramento apurado; com JavaScript a câmara refaz isto
   em milissegundos e passa a acompanhar o ecrã a cada gesto.
2. **`cqw`, não `vw`.** `vw` é 1% da janela do browser, e o contentor do
   mapa não é a janela — com `vw` o mapa ficava descentrado 20 px para cada
   lado. A solução é `container-type: inline-size` no `.b-janela`. Confirmado
   no browser: `containerType` devolve `"inline-size"` e `100cqw` mede
   exactamente a largura do contentor.
3. **O ponto de enquadramento é um literal, não um ponto da planta.** No
   protótipo o enquadramento do ecrã largo é `ir(760, 470, ...)` escrito à
   mão. Derivá-lo da planta (`Pt(2.7, 4.4)` → `(611, 367)`) faz a câmara
   saltar no primeiro quadro, sem o CSS dar conta. Os dois pontos vivem
   agora em `ENQUADRAMENTOS`, em `planta.ts`, e o teste que amarra o
   `transform` do CSS ao da câmara lê essa mesma constante — confirmado que
   falha se alguém voltar a derivá-lo.

### P1-2 — a animação ambiente

O bairro mexe-se: o elétrico sobe e desce a Avenida, as gaivotas traçam três
órbitas sobre o rio, o nadador dá braçadas debaixo da ponte, os pombos
ajeitam-se na Ribeira, o fumo sobe da fábrica e o brilho desliza sobre o
Douro. Tudo o que dá para escrever em `@keyframes` ficou no servidor
(`viagensSoltas()`, em `mundo.ts`) e corre sem uma linha de JavaScript.

O resto é o que precisa mesmo do browser:

- **As janelas que se acendem à noite** (`calcularLuzes`). Uma janela só
  acende se nenhuma caixa desenhada à frente a tapar — e «tapar» é um
  teste de ponto-dentro-de-polígono contra a casca convexa da silhueta de
  cada caixa (`data-sil`). É geometria a correr uma vez, no arranque, com
  um sorteio de semente fixa para dar igual em qualquer máquina.
- **As peças animadas** (elétrico, gaivotas, nadador, pombos, fumo, brilho
  da água), que seguem trajetórias calculadas.

**O GSAP continua fora do bundle inicial.** Entra por `carregarGsap()`
(`src/lib/motion/gsap.ts`, regra B-01) e só quando há movimento legítimo
por fazer; com `prefers-reduced-motion` o chunk nunca é descarregado.
Verificado nos chunks: os 51 KB e 43 KB do GSAP e do ScrollTrigger estão
em ficheiros à parte, e o JS inicial da home subiu só 2,2 KB
(185,7 → 187,9 KB gzip).

**Duas decisões que custaram uma iteração:**

1. **Uma função de servidor não atravessa a fronteira.** A primeira versão
   passava `coordenada={Pt}` (a função `P` da planta) como prop, e o
   `tsc` passava limpo — só o `next build` é que recusou, com *"Functions
   cannot be passed directly to Client Components"*. Agora os pontos viajam
   como **dados**: uma tabela de `[i, j, z]` e a tabela de coordenadas de
   ecrã correspondente (`PONTOS_ANIMACAO` / `PontosDeEcran()`).
   *Vale a pena reter:* o typecheck não apanha isto. O build é o portão.
2. **As classes de animação levam o prefixo `b-`, as estruturais não.**
   `.ed`, `.caixa`, `.vidro`, `.pin` e `.guia` ficam como estavam — são
   parte do desenho. `.b-fumo`, `.b-baforada`, `.b-corpo-pombo` e
   `.b-gaivota` ganham-no, para o CSS da V4 não apanhar o fumo da fábrica.

### P1-5 — os e2e da home V4 reconciledos, e três defeitos reais

As 33 falhas do CI **não eram todas relics da V4**. Separadas:

| | |
|---|---|
| 21 em `sessao-2-{hero,portas,painel}` | relics da home V4 — ficheiros apagados |
| 4 em `painel.spec.ts` (`/`), 2 em `smoke`, 1 em `coreografia`, 1 em `controlos` | pontos de entrada que apanharam o `--` certo (`/dados`, `/poupanca`) |
| **1 em `smoke` (contraste AA)** | **defeito real, com três causas** |

**O que se apagou:** `e2e/sessao-2-hero`, `-portas` e `-painel` só testavam
`/`, e o que descreveram saiu da página. `painel.spec.ts` ficou só com
`/dados` — o `<Painel>` continua lá, com as mesmas regras. O botão do JSON
veio do `<Leitura>`, que vive nas rotas de conteúdo: o teste passou a
apontar para `/poupanca`.

**O que entrou:** `e2e/bairro.spec.ts`, com os sete casos do §P1 item 6 —
os onze edifícios focáveis e com nome acessível, os valores de `data/` nos
marcadores, o bairro e os números sem JavaScript, sem transbordo a 375 px,
`reduced-motion` a não descarregar o GSAP, a câmara a mexer ao arrastar e
os três botões de zoom, a hora do dia, e zero erros de consola.

### Três defeitos de contraste reais, medidos no browser

1. **O selo** dava 3,45:1. `--verde` sobre `--verde-2` não chega ao AA de
   4,5:1 num texto de 14 px. Nasceu o token `--verde-fundo` (5,50:1) — não
   se mexeu no `--verde` global, que é usado no site inteiro.
   *A folga importa:* o primeiro candidato dava 4,4999:1 — passava a régua
   e reprovava o teste. Escureci até ficar comfortably acima.
2. **A home V5 é uma página de papel, mas o `body` seguia o tema do site.**
   `[data-pele="v5"]` fixa a paleta clara do protótipo (`--tinta` tem de ser
   escura, senão os contornos dos edifícios desaparecem no céu da noite), e o
   texto à volta usa `--tinta-2` — também escuro. Em `dark` ficava escuro
   sobre escuro: 2,07:1 no parágrafo de entrada, 1,18:1 na dica sobre o
   cartão branco, 1,33:1 no «ao cêntimo» sobre o amarelo.
   Agora `:root:has([data-pele="v5"])` repõe a superfície clara enquanto o
   bairro está no ecrã, e a dica e o realce do título levam `--tinta`
   explícito (são fundos fixos: branco e amarelo).
3. **O teste media o contraste a meio da transição de tema.** O `body` tem
   `transition: background-color` e o bloco global de reduced-motion não a
   apanha — a medição comparava texto do tema novo com o fundo do antigo.
   Morta a transição antes de medir.

**Uma coisa que fiz e vale a pena dizer em voz alta:** o mapa deixou de ser
medido pelo teste de contraste. Os letreiros pintados nos edifícios são
texto dentro de uma ilustração, e a WCAG 1.4.3 isenta «texto que faz parte
de uma imagem que contém outro conteúdo visual significativo» — medir um
letreiro de telhado contra o telhado ao lado dava 1,1:1. A informação
continua acessível (cada edifício tem `aria-label`; os valores dos
marcadores são conferidos em `bairro.spec.ts`). Ainda assim, **é um
relaxamento do teste** e por isso está escrito no código com o porquê.

### O CI — o que passa e o que não passa

Corrido no GitHub (é a primeira vez que o código V5 chega ao CI):

| passo | resultado |
|---|---|
| `lint`, `typecheck`, `test:unit`, `derive`, `validate:data` | ✅ |
| **`build`** | ✅ **com Turbopack** — a ressalva do P1-1 fica resolvida |
| `test:e2e` | ❌ **33 falhas, todas da home V4** |

As 33 falhas são `smoke`, `painel`, `sessao-2-hero`, `sessao-2-painel`,
`sessao-2-portas`, `coreografia` e `controlos` — ou seja, testes que
descrevem a home V4, que a V5 substituiu. **Não é regressão**; é o P1-5 do
pack (linha 217), que ainda não foi feito. Os 195 e2e que não tocam na home
passam. Está anotado em `docs/PACK-V5-PRODUCAO.md` §P1-5.

### O que ficou em aberto

- **O HTML da home tem 130,8 KB gzip**, acima dos 80 KB que o pack impõe
  (§4). O mapa é a razão. **Para o dono decidir em P4**: reduzir o mapa
  servido (marcadores só para o ecrã grande?) ou subir o limite, com
  nota no `AGENTS.md`.
- **JS inicial da home**: 185,7 KB gzip (9 ficheiros), dentro dos 350 KB do
  pack. `/sobre` fica nos 182,7 KB — o bairro acrescenta ~3 KB.
- Ressalva de ambiente: o build foi validado com `--webpack` (o
  `node_modules` é um symlink e o Turbopack recusa-o). O CI usa Turbopack.

## P2a–P2c · As cenas

_(por preencher — toda a copy das onze cenas é PROPOSTA)_

## P3 · A pele V5 nas 13 rotas

_(por preencher)_

## P4 · Qualidade e lançamento

_(por preencher — a lista final de textos PROPOSTA é a que o dono revê
antes do lançamento. Não lançar sem essa revisão.)_
