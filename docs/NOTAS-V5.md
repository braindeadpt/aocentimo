# NOTAS V5 — registo de trabalho da «O Bairro»

> Documento de trabalho da V5 (sessões do plano em
> `docs/PACK-V5-PRODUCAO.md`). Dúvidas, hipóteses conservadoras e copy a
> rever, por tarefa. **Não é contrato** — o contrato é `docs/PRODUTO.md` §2
> e §6b.

**Regra desta secção:** todo o texto que veio do protótipo é **PROPOSTA**
até o dono o rever. Nada de cenas nem de cartas publicam sem essa revisão
(P4). Onde o texto é meu e não do protótipo, diz-se.

---

## Índice

| Fase | O que era | Estado |
|---|---|---|
| [P0](#p0--fundação) · Fundação | tokens V5, kit `src/lib/bairro/`, `dadosBairro()`, PRODUTO §6b | ✅ **CONCLUÍDO** — em `main` |
| [P1](#p1--a-home-é-o-bairro) · A home é o bairro | o mapa no servidor, a câmara, a animação ambiente, as sete cartas | ✅ **CONCLUÍDO** — em `main` |
| [Hotfix P1](#hotfix-p1--o-veredicto-do-design-e-o-mapa-publicado-estava-partido) | as camadas empilhavam em fluxo; o CSS escrevia classes que não existem no HTML | ✅ **CONCLUÍDO** — em `main` |
| [P4 (conserto do flight)](#p4--o-conserto-do-flight-a-home-deixou-de-ser-o-mapa-duas-vezes) | o mapa viajava duas vezes (DOM + payload RSC) | ✅ **CONCLUÍDO** — em `main` |
| [P1-gente](#p1-gente--a-gente-do-bairro-no-mapa) | as personagens paradas no mapa | ✅ **CONCLUÍDO** — em `main` |
| [P2a](#p2a--as-quatro-primeiras-cenas-fábrica-finan%C3%A7as-banco-mercearia) · Fábrica, Finanças, Banco, Mercearia | as primeiras quatro cenas | ✅ **CONCLUÍDO** — em `main` |
| [P2b](#p2b--correios-bomba-segurança-social) · Correios, Bomba, Segurança Social | mais três cenas | ✅ **CONCLUÍDO** — em `main` |
| [P2c](#p2c--casa-da-in%C3%AAs-pastelaria-quiosque-escola) · Casa, Pastelaria, Quiosque, Escola | as quatro últimas cenas + `grafico-linhas` | ✅ **CONCLUÍDO** — em `main` |
| [P3a](#p3a--tokens--cabe%C3%A7alho navega%C3%A7%C3%A3o-rodap%C3%A9 ramo-v5p3-pele-a) · chrome | `data-pele="v5"` no `<html>`, cabeçalho/nav/rodapé | ✅ **CONCLUÍDO** — em `main` |
| [P3b g1](#p3b--grupo-1--as-rotas-de-dinheiro-ramo-v5p3-pele-b1) · dinheiro | `/salario` `/irs` `/impostos` `/poupanca` `/credito` `/casa` | ✅ **CONCLUÍDO** — em `main` |
| [P3b g2](#p3b--grupo-2--pre%C3%A7os-e-trabalho-ramo-v5p3-pele-b2) · preços e trabalho | `/inflacao` `/precos` `/trabalho` `/dados` | ✅ **CONCLUÍDO** — em `main` |
| [P3b g3](#p3b--grupo-3--aprender-meta-e-estilo-ramo-v5p3-pele-b3) · aprender, meta, `/estilo` | `/aprender` `/metodologia` `/sobre` `/estilo` | ✅ **CONCLUÍDO** — em `main` |
| [P3c](#p3c--as-fontes-os-tokens-mortos-e-a-estilo-escrita-ramo-v5p3-pele-c) · fontes e `/estilo` | das cinco fontes a duas; tokens mortos; `/estilo` reescrita na linguagem do bairro | ✅ **CONCLUÍDO** — em `main` |
| [P4 · dados das cenas](#p4--os-dados-das-cenas-saem-do-payload-da-home) | `public/cenas/*.json` em vez do flight | ✅ **CONCLUÍDO** — em `main` |
| **P4 · revisão de copy** | — | ⬜ **ABERTO** — `docs/REVISAO-COPY-V5.md` |
| **P4 · lançamento** | — | ⬜ **ABERTO** — merge para `main`; o dono faz |

### Textos PROPOSTA

A lista que o dono revê antes do lançamento **não está mais neste
ficheiro**: saiu para **`docs/REVISAO-COPY-V5.md`**, uma tabela só,
**gerada por script** (`node scripts/_revisao-copy.mjs`) a partir das
fontes de verdade. Escrevê-la à mão era o mesmo defeito que a Regra nº1
proíbe — um texto que muda no código e uma lista que não muda.

O bloco [«Textos PROPOSTA (revisão do dono)»](#textos-proposta-revis%C3%A3o-do-dono)
abaixo fica como registo do que o protótipo propunha na altura da P0/P1;
onde diverge do que está no site hoje, quem manda é a tabela.

---

## P0 · Fundação — ✅ CONCLUÍDO (em `main`)

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

## Textos PROPOSTA (revisão do dono) — registo da P0/P1

> **Superado por `docs/REVISAO-COPY-V5.md`**, que é a lista viva e a
> única que o dono revê antes do lançamento. Isto é o que o protótipo
> propunha na altura da P0/P1, com os textos que a P2/P3 já mudaram.

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

## P1 · A home é o bairro — ✅ CONCLUÍDO (em `main`)

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

### P1-4 — as sete cartas: «Escolhe a tua personagem»

A secção do elenco deixa de ser um título vazio. As sete cartas do
`CARTAS` do `mapa.tpl.html` entram com a mesma ordem, as mesmas cores e
o mesmo desenho — a figura é `pessoa(ELENCO[·])`, a mesma função que o
mapa usa, e a do casal junta o Rui e a Marta num só `svg`, como lá.

**O número da Inês sai dos dados.** A dúvida 1 das P0 resolvia-se aqui:
a frase «Porque é que 1 500 € brutos viram 1 167 €.» compõe-se em
`HomeBairro` com `linhaSalario()` (a linha de `brutoRef` de
`cenarios-salario.json`) e `fmtEUR0` — o «1 167 €» é o líquido real
arredondado, calculado e não digitado. Se a linha faltar, sai «—».
O e2e lê o mesmo JSON e compara com o texto da página.

**A ponte carta→mapa é um `CustomEvent`.** As cartas vivem no `<main>`
do servidor e não podem receber uma função do `<Bairro>` (cliente);
`b:escolhe-personagem` na janela leva a escolha — chave mais as partes
do painel. O cliente das cartas (`Cartas.tsx`) é pequeno de propósito:
só o clique e a composição do detalhe.

**O payload das cartas tem dieta própria** (reparação pós-gente): a
figura já não viaja por prop — desenha-se no cliente com
`pessoa(ELENCO[·])` (o kit é puro e já está no bundle; o SSR continua a
pô-la no HTML) e sai-lhe o HTML morto (`data-nome`, as classes que são
ganchos do mapa, `scale(1)`, whitespace). O `CartaDados` e o `comum`
são tuplos — os nomes das chaves repetiam-se sete vezes no flight. A
fala «Olá!» monta-se no cliente de `olaTpl`+`ola`+`aprende` (strings de
`pt.json` na mesma, só repartidas). A cor do fundo vive no CSS por
`[data-k]`, não em `style` inline. Resultado: ~0,7 KB gzip de props
das cartas (antes ~8,4 KB com as figuras), home a 79,9 KB no gate.

**No `<Bairro>`:** o clique esconde o cartão de edifício, fecha a cena
aberta (com a âncora limpa do URL), faz scroll suave ao palco
(instantâneo em reduced-motion), abre a moldura `.b-painel` que já
existia e voa a câmara para o centro da caixa do
`[data-pessoa="<chave>"]` — o contrato com a sessão «gente no mapa».
Se a figura ainda não existir (a gente funde noutro ramo), fica o
scroll e o painel — nunca falha. Com GSAP activo a câmara desliza
(`ligarGsap` + `ir(·, ·, 560, 1.1)`) e a personagem acena — `.braco-d`,
e nos dois quando a carta é a do casal. Em reduced-motion o chunk nem
é pedido: o `ir()` salta para a vista final.

**A câmara mede o alvo em unidades do mundo, nunca `getCTM()`.**
`getCTM()` devolve px do viewport da camada SVG — metia a personagem a
−1050 px e fora do mundo (defeito medido no build integrado). A conta
é a da `CenaFabrica`: `getBoundingClientRect()` do alvo e da janela +
`camara.atual` convertem px do ecrã em unidades do mundo. O destino
pousa na faixa que o painel não tapa — em desktop à direita do painel
à esquerda, no telemóvel abaixo do painel no topo. E o foco do painel
é `preventScroll`: o scroll-para-o-foco do browser cancelava o
`scrollIntoView` do palco a meio (o ecrã ficava a 360 px do destino).

**Acessibilidade:** cada carta é `<button>` com nome acessível «Nome,
papel» e o «o que aprendes» ligado por `aria-describedby`; a figura é
`aria-hidden`; ao fechar (Escape, × ou Fechar) o foco volta à carta.

**CSS:** o bloco `.b-cartas`/`.b-carta`/`.b-fundo-carta`/`.b-papel`/
`.b-aprende` já estava portado e saiu da lista `FUTURO_P1` do teste —
mais as regras novas `.b-aprende i` (o negrito do perfil, que no
protótipo era estilo inline) e `.b-painel .b-perfil`.

**Textos PROPOSTA novos** (`bairro.elenco.*`): a tabela das sete cartas
já estava listada acima; entram agora também `ola` («Olá! Sou {quem}.»),
`emBreve` («Em breve»), `segueDinheiro` («vais poder seguir o meu
dinheiro pelo bairro.») e, por carta, o `ola` gramatical («a Inês»,
«o Rui, e esta é a Marta»…). Os nomes acessíveis («Inês, operária da
fábrica») derivam do nome+papel.

---

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

### Hotfix P1 — o veredicto do design, e o mapa publicado estava partido

O P1 foi para a main (via PR, autorizado pelo dono) e o deploy correu. A
auditoria de design ao mapa publicado devolveu **NÃO ACEITE**, com três
bloqueantes: as camadas do mapa empilhavam em fluxo, o CSS de interacção
estava escrito todo com classes que não existem no HTML, e o e2e não
media geometria. Nada disto apanhavam os testes antigos — passavam todos
sobre uma página de ~20 000px de altura. Este hotfix
(`v5/hotfix-p1-rebase`, sobre o `fae9ce8`) é a correcção.

**1 · O empilhamento.** `bairro.css` nunca recebeu o
`.b-camada { position: absolute }` — os oito SVG de 3600×2500 seguiam o
fluxo do documento, um debaixo do outro (o marcador da TSU ficava a
y≈10 800). O fix traz também
`#b-cFundo > *, #b-cFrente > * { pointer-events: visiblePainted }`, sem o
qual as camadas interiores comiam o rato. (A primeira versão pôs o
`visiblePainted` em `#b-cA`/`#b-cB`, que não existem no HTML gerado: o
hover dos edifícios morreu, e a medição no browser apanhou-o antes do
commit.)

**2 · As classes CSS↔HTML.** O CSS escrevia `.b-ed`, `.b-pin`,
`.b-sombra-d`, `.pin.b-on`, `.b-amb-off`…; o HTML usa `ed`, `pin`,
`sombra-d`, `pin on`, `amb-off` — sem o prefixo. 16 seletores
renomados; os keyframes `b-*` ficam, esses são legítimos. Para isto não
voltar a acontecer, o novo `src/app/_bairro/bairro-css.test.ts` varre os
seletores de classe do CSS e exige que cada um exista no HTML gerado, no
código cliente, no conjunto `ESTADOS` ou na allowlist `FUTURO_P1` — as
classes dos blocos de P2/P3 (painel do cartão, cena, cartas) ainda não
têm HTML; saem da allowlist quando chegarem.

**3 · O e2e passa a medir geometria.** Cinco testes novos em
`bairro.spec.ts`: as 8 camadas no mesmo y (a 1440 e a 375), altura do
documento <4000px, o pin da Fábrica dentro da janela no desktop e no
telemóvel, e o hover a levantar o edifício. Detalhe que custou uma ronda:
o CSS levanta os **filhos** de `.ed`, não o `.ed` — medir o próprio
grupo nunca muda; o teste compara a caixa do `.ed > *` antes/depois do
hover.

**As quatro decisões do veredicto, aplicadas:**

- **Tema claro por omissão.** `data-theme="light"` no JSX e no
  `themeInit`. A armadilha estava no `ThemeToggle.tsx`: o
  `useLayoutEffect` tinha fallback `?? "dark"` — na hidratação flipava o
  atributo e as transições Tailwind do cabeçalho disparavam em carga. Era
  esta a causa da falha e2e que se arrastava. Fallback agora `light`;
  comentário M-16 actualizado.
- **O interruptor sai da home.** Novo `InterruptorDeTema.tsx` (cliente;
  `usePathname() === "/"` devolve `null`). O `SiteHeader` mantém-se
  servidor: pôr `"use client"` nele quebra o build — `loadFontes()` lê o
  sistema de ficheiros.
- **Contraste.** A isenção do `.b-mundo` fica restrita a fora dos pins
  (`el.closest(".b-mundo") && !el.closest(".pin")`); o `addStyleTag` que
  matava transições no teste de contraste saiu — escondia o problema do
  tema.
- **Transição de tema.** Só no bloco `html[data-theme-anim] body *`
  (~linha 3706), posto pelo toggle ao clicar (400ms), nunca no load. A
  regra `body { transition }` que eu tinha acrescentado foi removida:
  era duplicada e disparava em carga.

**Não bloqueia (fica para P4):** o enquadramento desktop corta o marcador
mais alto; o HTML da home nos 130,8 KB gzip provisórios.

**Confirmação local sobre o `fae9ce8`:** 618 testes unitários verdes,
213 e2e verdes (build `--webpack`, porta 3199), typecheck e lint limpos,
`validate:data` 74 séries em dia, orçamento JS da home 187,9 KB gzip
(limite 350). Medição directa no browser: 8 camadas no mesmo y, 13 pins
na faixa 452–876, altura do documento 1810px, violadores de contraste no
load: 0.

### O HTML da home medido — plano para decisão do dono (antes do P4)

Medição sobre o build do deploy (`out/index.html` de `6afb9f9`):
**131,0 KB gzip** (raw 1,19 MB). Dissecado por blocos com
`scripts/_dieta-html.mjs` (versionado; correr após cada build):

| bloco | raw | gzip |
|---|---|---|
| `.b-mundo` no DOM (o mapa) | 426 178 | 48 530 |
| payload RSC (3 scripts `__next_f`) | 718 097 | 75 010 |
| — **dos quais: o mapa REPETIDO no flight** | 448 276 | **≈ 53 268** |
| `<style>` do bairro | 1 387 | 376 |
| resto da página (hero, header, footer) | 40 282 | 7 138 |

**A página é o mapa duas vezes.** `HomeBairro` (servidor) calcula
`mundoBairro()` e passa o HTML **como prop** ao `<Bairro>` (cliente) —
o Next embarca props no payload de hidratação, com escapes `\\"` e
`\n` que gonfiam a string (por isso pesa mais que o próprio DOM). O React
nunca usa essa string para criar nada: `dangerouslySetInnerHTML` já tem
o mapa pintado. São ~53 KB gzip transportados à toa — **40% do ficheiro**.

**O plano, por ordem de rendimento:**

1. **Conserto do flight (recomendado): −53 KB → ~78 KB gzip.** O
   `<Bairro>` deixa de receber `html` por prop e passa a receber só os
   marcadores (pequenos), calculando `mundoBairro(montarMapa(…))`
   localmente. No SSR do componente cliente os builders correm no
   servidor — **o first paint sem JavaScript mantém-se**, a promessa V5
   fica intacta; na hidratação o cliente recalcula a mesma string
   (builders verificados: zero `Math.random`/`Date`, zero `fs` —
   determinísticos, sem mismatch). Custo: ~15–20 KB gzip de JS no bundle
   (planta/iso/mundo/personagens passam ao cliente; hoje estamos em
   188 KB de 350). Risco baixo: os testes de geometria e o
   `bairro-css.test.ts` vigiam exactamente isto. Esforço: pequeno-médio.
2. **Aparo fino: −5,5 KB adicionais.** Arredondar coordenadas a inteiro
   (−4,5 KB; ficam 5 575 de 18 222 números com décimas — os
   `matrix(.8944 .4472 …)` do isométrico NÃO se tocam) e aparar os
   `viewBox` das nuvens (`44.800000000000004`). Pode ir no mesmo PR.
3. **Não fazer:** marcadores servidos à parte (poupam 1,2 KB — os 13
   pins inteiros pesam menos que uma foto; uma segunda requisição e
   complexidade por isso não paga) e tirar soltos/nuvens (−1,5 KB,
   quebraria o ambiente sem JS). Os candidatos do enunciado original
   («marcadores só no ecrã grande? SVG à parte?») são os que MENOS
   rendem — os números mandam recusá-los.

Com 1+2: **~73 KB gzip**, dentro dos 80 KB do pack (§4), sem cortar um
milímetro de desenho. A decisão é do dono; o medidor fica no repo para
confirmar cada passo.

### Acabamento P1 — o enquadramento inicial medido (desktop cortava o TSU; telemóvel escondia o Euribor)

A re-auditoria a produção deixou dois defeitos de enquadramento, ambos de
CAUSAS DIFERENTES e ambos de câmara:

- **Desktop:** a cadeia de subidas do `arrumarPinos` empurra o pin da
  Segurança Social para topo = −172 unidades do mundo — e o
  `enquadrar()` partia de constantes, sem saber onde estava o tecto.
  Medido no main: cortado −45,7 px a 1920, −40,1 a 1440, −35,6 a 1280.
- **Telemóvel:** a vista w=820 centrada no «perto» mostra 9 de 13 pins —
  e o Banco (Euribor), essencial, fica fora (x=1155 da vista 182–1002).

**O conserto é medir:** a cadeia de arrumação separou-se em duas fases —
`repartirPinos()` (pura: onde cada âncora VAI ficar) e a escrita no DOM —
e o novo `vistaInicial()` (puro, exportado) usa as caixas pós-cadeia para
escolher a vista: no computador, os 13 inteiros com 12 px de folga em
cima e 2 nos lados; no telemóvel, parte do «perto» do protótipo e alarga
ATÉ os essenciais (Salário bruto, Chega à conta, Inflação, Euribor)
caberem — a 390/375 a vista vai a w≈910 (fonte efectiva ~13,7–14,2 px,
acima dos 11 px exigidos). Um piso de legibilidade impede o alargamento
de derrubar a fonte abaixo de 11 px (ecrãs intermédios: encaixa só o
topo, o resto fica ao arrasto). As âncoras viajam do servidor por prop
(`pinosDaCamera`, 13 objectos pequenos); os `data-x/y/w` do HTML e o
prop saem da mesma `larguraPin()` (iso.ts) — um número, um sítio.

O enquadramento por omissão do CSS (sem JS) recalculou-se com a MESMA
`vistaInicial()` — referencial 1440 (desktop) e 375 (telemóvel) — e os
testes de acoplamento em `mundo.test.ts` conferem CSS↔câmara por ela.
O fixture dos marcadores actualizou-se para o formato real de hoje
(«1 500,00 €», não «1 500 €»): as larguras das placas alimentam a cadeia.

e2e nova: 3 viewport de computador (13 pins inteiros, folgas do dono) e
2 de telemóvel (essenciais dentro, fonte ≥11 px) — falharam os 5 no main
antes do conserto. **O peso do HTML da home não mudou**: 131,24 KB gzip
(+0,23 KB, os 13 objectos do prop).
### P4 — o conserto do flight: a home deixou de ser o mapa duas vezes

O plano do §«O HTML da home medido» executou-se
(`v5/p4-flight`): o `<Bairro>` (cliente) passa a CALCULAR o mapa —
`mundoBairro(montarMapa(marcadores))` num `useMemo` — em vez de o
receber pronto por prop. O servidor só manda os 14 números já formatados
(`d.marcadores`); o `reflexo` e o `<style>` das animações (metro/barcos)
saem da mesma conta, dentro do componente. No build estático o SSR corre
esse código NO SERVIDOR: o mapa segue no HTML sem JavaScript (e2e sem JS
verde, 13 pins + 11 edifícios), e na hidratação o browser repete a
mesma conta determinística — zero avisos de hidratação (e2e novo).

**Os números** (`scripts/_dieta-html.mjs`, antes → depois):

| | antes | depois |
|---|---|---|
| HTML da home (gzip) | 127,9 KB | **62,8 KB** (−65,1) |
| payload RSC (gzip) | ≈53 KB com o mapa | **8,6 KB, sem o mapa** |
| JS inicial da home | 187,9 KB | 211,0 KB (+23,1; limite 350) |
| construção do mapa | 0 ms (não corria) | 4,89 ms ×4 CPU ≈ **19,6 ms** (≤30: sem idle) |

> **Nota (2026-10-06):** os gzip desta tabela foram medidos com o
> `_dieta-html.mjs` da altura, que usava o default do `gzipSync` (nível 6).
> Ao nível do CDN (nível 5 + correção de zlib) cada número é ~2–3 % maior —
> são folgas de dezenas de KB, não de bytes. A medida passou a ser uma só,
> em `scripts/_medida-cdn.mjs`, usada pelo gate e por todos os medidores de
> peso; ver `MEDICAO-V5.md`.
| load→pintura estável (CPU 4×) | — | 942 ms, zero avisos |

O custo do JS (+23 KB gzip) são os builders a entrar no cliente —
`planta/iso/mundo/personagens`, como o plano previa. A troca: −65 KB de
HTML por +23 KB de JS, e a promessa «sem JS vê-se o bairro inteiro»
intacta. A regra dos 30 ms do dono mediu-se com
`scripts/_tempo-mundo.mjs` (os builders são puros: a mesma engine V8 de
Node dá o número do browser) — não chegou perto do limite, não houve
necessidade de `requestIdleCallback`.

**Vigilância nova:** `scripts/_gate-html.mjs` corre no CI depois do
build (e `gate-html.test.ts` repete-o em Vitest): o HTML ≤80 KB gzip, o
payload RSC SEM `b-camada`, 13 pins + 11 edifícios no HTML estático. Os
três falhavam no main antes do conserto (127,9 KB; mapa no flight). A
mensagem do gate aponta o dedo a quem voltar a passar HTML grande por
prop.

**O aparo fino de coordenadas tentou-se e NÃO ENTRA** (PR #28, fechado
sem fundir): a `f1` passou a inteiro e uma rede final arredondava tudo o
que escapava — o mapa perdia 7,9 KB gzip. A prova de pixels correcta
(main vs. aparo, 1440/390, dia/noite, 1×/zoom 8×) mostrou **nenhum fio
de luz** mas deslocação sub-píxel das arestas em todo o lado — no
telemóvel (escala 0,48) meio píxel do mundo é um píxel inteiro no ecrã e
34 % dos píxeis diferem. A condição «diff limpo ou não entra» falhou: a
décima fica. Nota de método para a próxima: a primeira prova veio
«limpa» porque a captura do «depois» correu contra a build antiga — as
duas builds têm de estar servidas de sítios distintos, e o `data-x/y/w`
dos pins é medida da câmara, não desenho.

### P1-gente — a gente do bairro no mapa

O mapa publicado tinha 3 pessoas (a fila da Segurança Social); o
protótipo tem a fila, as 8 personagens do elenco, um pescador no cais e
dois miúdos na ponte. Portado o `colocar()` do `mapa.tpl.html` para
`planta.ts`: cada figura leva os pés a `Pt(i, j)` (terreno como
argumento, como sempre) e a escala do protótipo (`ESC = 0,36` nas
camadas; os miúdos levam a deles). `mundo.ts` só distribui —
`avenida → #b-movA`, `cais → #b-movB` (o `colocar()` escolhia por
`j > 8,7`; aqui a escolha fica escrita na tabela), `ceu → #b-gCeu`,
à frente dos miúdos, o `nadador()` que já lá estava.

| quem | i | j | espelho | camada |
|---|---|---|---|---|
| Inês | 1,79 | 3,78 | — | movA (porta da fábrica) |
| Rui | 9,15 | 3,80 | — | movA (banco) |
| Marta | 9,50 | 3,82 | virada | movA (banco) |
| Pedro | 5,00 | 3,85 | — | movA (meio do passeio) |
| Sr. Manuel | 0,67 | 8,78 | virado | movB (mercearia) |
| D. Arminda | 3,30 | 8,85 | — | movB (praça) |
| Gonçalo | 9,49 | 8,80 | — | movB (escola) |
| Diana | 10,09 | 8,78 | virada | movB (escola) |
| pescador + cana | 4,35 | 10,52 | virado | movB (beira do cais) |
| miúdo | 14,80 | 12,55 | — | gCeu (guarda da ponte, z=20) |
| miúda | 14,80 | 13,35 | — | gCeu (idem) |

Contagem final no HTML: 14 `.pessoa` (3 fila + 8 elenco + pescador +
2 miúdos), 8 `data-pessoa`, 10 `.vizinho`, 1 `.b-nadador` — iguala o
protótipo ao nível do mapa (as figuras das cenas ficam nas cenas).

**Contrato cumprido:** cada personagem do ELENCO sai com
`data-pessoa="<chave>"` dentro de `.pessoa`; passantes, pescador e
miúdos levam `.pessoa` sem `data-pessoa`. O Pedro percorre a Avenida e
regressa; a D. Arminda sobe às escadas, segue aos Correios e volta; os
miúdos saltam da ponte, mergulham e regressam, com salpicos. Estas
animações seguem a mesma pausa por visibilidade/interseção do ambiente e
são restauradas no cleanup. O e2e verifica as figuras e a geometria
inicial; a fidelidade temporal continua a exigir validação visual no
browser.

**Conserto apanhado de raspão:** `ambiente.ts` procurava `.b-brazo-n`
mas `mundo.ts` emite `.b-braço-n` — o braço do nadador nunca animava.
Corrigido o selector; `ambiente.test.ts` já esperava a classe acentuada.

**Peso:** home 67,8 → **72,5 KB gzip** (+4,7; limite 80). A deduplicação
`<symbol>/<use>` não foi precisa — nenhuma figura foi cortada.

## P2a–P2c · As cenas — ✅ CONCLUÍDO (em `main`)

### P2a — as quatro primeiras cenas: Fábrica, Finanças, Banco, Mercearia

Porta de `cenaSalario` (mapa.tpl.html), `cena-financas.js`,
`cena-banco.js` e `cena-mercearia.js` para `src/app/_bairro/cenas/`,
dentro da moldura `<CenaDePerto>` (o `cenaBase`). O que a casa obriga e
como ficou:

- **Chunks por cena:** o `<Bairro>` só pede a cena com `next/dynamic`
  quando se entra no edifício (registry em `cenas/registry.ts`); o CSS
  de conteúdo (`bairro-cenas.css`) viaja no chunk, não na home. O e2e
  prova que nenhum pedido de cena acontece no load.
- **Dados por props, séries compactas:** `dadosCenas()` corre no
  servidor e manda números crus + fontes; as séries vão como
  `{ inicio, v }` e o cliente reconstrói os meses (`cenas/utils.ts`) —
  a mesma economia que as `coordenadas` da câmara. Nenhum JSON de
  `data/` chega ao cliente.
- **Contas pelo motor, sempre:** as gavetas do IRS
  (`cenas/irs-gavetas.ts`) são testadas CONTRA `impostoPorEscaloes` (o
  motor de /irs e /salario) e o rodapé da cena leva o IRS anual pronto
  de `cenarios-salario.json`; a prestação do Banco é sempre
  `simularPrestacao()` (método francês); o IVA vem de `iva.json`; na
  Mercearia nenhum preço em euros é inventado — tudo são razões entre
  índices ECOICOP.
- **Fábrica = coreografia no mapa:** as moedas voam nas camadas
  `b-movA/b-movB` com GSAP por dynamic import (o mesmo de
  `ligarAmbiente`); sem GSAP (reduced-motion), a cena escreve DIRETO o
  estado final no contador — que passa a mostrar CÊNTIMOS exatos
  (1 166,83 €, e não o 1 167 arredondado do protótipo).
- **Acessibilidade:** o foco entra no título da cena e volta ao
  edifício ao fechar; Escape fecha; o URL leva a âncora (`/#banco`),
  `hashchange` abre, Voltar fecha. As falas estão em `aria-live`.
- **A nit do #27 aplicada:** `montarMapa(marcadores)` corre UMA vez no
  `<Bairro>`; o reflexo reutiliza o mesmo mapa.

**Os números:** home 63,2 → **67,3 KB gzip** (+4,1 KB: os dados das
quatro cenas no flight, séries compactas — limite 80 KB ok, gate verde);
JS inicial 211,0 → **213,2 KB** (o registry; as cenas ficam fora do
bundle inicial — limite 350 KB ok).

**Allowlist FUTURO_P1 encolheu de 17 para 6 classes:** as onze do painel
e da moldura de cena (b-painel, b-quem, b-fala, b-acoes, b-fechar,
b-fonte, b-btn, b-claro, b-cena, b-cena-arte, b-cena-texto) aterram em
JSX e saem da lista; fica `b-confirma` (a cena da SS, P2b) e o grupo das
cartas (P1-4).

**Textos PROPOSTA (para o dono rever antes de lançar):** toda a copy das
quatro cenas vive em `src/app/_bairro/cenas/textos.ts` — portada do
protótipo, com os números a entrar por parâmetro já formatados. Nada
está em mensagem final sem essa revisão.

**Revisão do dono, 2026-10-01 (copy das quatro cenas P2a):** lida e
aprovada com três alterações, já em `textos.ts`:
(1) a retenção mensal do IRS passa a dizer-se «adiantamento que se acerta
na declaração anual» (Fábrica e nota da Finanças), porque o IRS retido por
mês e o imposto final por ano não batem e o leitor faz a conta;
(2) o IVA reduzido deixa de ser «o que é essencial» e passa a «os alimentos
básicos da lista I do Código do IVA»;
(3) três textos que estavam escritos dentro dos componentes (a falha de
dados da Fábrica e dois `aria-label`) foram para `textos.ts`, para ficarem
na lista que o dono revê.

### P2b — Correios, Bomba, Segurança Social

Porta de `cena-correios.js`, `cena-bomba.js` e `cenaSegSocial`
(cenas-bairro.js) para `src/app/_bairro/cenas/`, no mesmo molde da P2a:
`CenaDePerto`, interior em `<svg viewBox="0 0 640 470">` gerado no
servidor, gráfico na coluna do texto (`.b-corpo`), dados por props.
Ficheiros novos: `dados-p2b.ts` (servidor), `textos-p2b.ts` (copy
PROPOSTA), `correios-arte.ts`, `bomba-arte.ts`, `segsocial-arte.ts`,
`CenaCorreios.tsx`, `CenaBomba.tsx`, `CenaSegSocial.tsx`. Em
`registry.ts`/`dados.ts`/`com-cena.ts`/`Bairro.tsx` só se acrescentaram
linhas — a P2c mantém as suas. O cartão «em breve» sai dos três
edifícios.

**Contas e dados (regra nº1):**

- **Correios → /poupanca.** Os 10 000 € são exemplo e dizem-se exemplo.
  O passado é medido: poder de compra = `IHPC(2020-08) / IHPC(hoje)`
  (série `cp00`, a mesma data-base da Mercearia). O futuro é HIPÓTESE
  dita como hipótese: `trajetoriaColchao` e `trajetoriaCA` do motor
  `poupanca.ts`, com taxa, prémios de permanência, vigência e garantia
  de `data/fiscal/ca.json` e retenção de `capitais.json`. Sliders de
  anos e de inflação refazem a trajetória no cliente.
- **Bomba → /precos.** Decomposição por `decomporCombustivel` no
  servidor (o cliente não vê `iva.json`): ISP e carbono de
  `data/fiscal/isp.json` (portaria e data na fonte), IVA normal sobre
  produto+ISP+carbono — a cena mostra o IVA a incidir sobre impostos.
  O gráfico usa as séries diárias DGEG (`pmd-gasolina95-diario`,
  `pmd-gasoleo-diario`) amostradas 1 ponto/semana como no protótipo; a
  copy diz a primeira data real da série (jan 2017), nunca «desde 2017»
  escrito à mão. O atestar é um exemplo de 50 litros.
- **Segurança Social → /salario.** O recibo usa a mesma linha de
  `cenarios-salario.json` da cena da Fábrica — 165,00 € (11 %) +
  356,25 € (TSU 23,75 %) = 521,25 € sobre 1 500 €; teste golden
  compara os dois. O Pedro sai de `simularIndependente(1500×12)`:
  21,4 % sobre 70 % do faturado (mínimo 1,5×IAS), regras de
  `catb.json`. Nada reimplementado no componente.

**Animações:** GSAP só por `carregarGsap()`; cada pilha/camada mata o
tween anterior e um bilhete de geração invalida callbacks atrasados (o
defeito do contador da Fábrica não se repete). Em reduced-motion o
estado final é escrito direto e o chunk não é pedido — o e2e prova-o.

**Textos PROPOSTA (para o dono rever antes de lançar):** toda a copy
das três cenas vive em `src/app/_bairro/cenas/textos-p2b.ts`, com os
números a entrar por parâmetro já formatados. Inclui as falas de cada
passo, o painel «como ler o gráfico», as legendas das camadas do litro,
o comparativo Inês/Pedro, os `aria-label` dos gráficos e as chamadas
para /poupanca, /precos e /salario. Nada publica sem essa revisão.

**Divergências anotadas (protótipo → produto):**

1. O protótipo mostrava a inflação futura como barra de «confiança»;
   aqui é slider («se a inflação fosse, por ano…») — mesma informação,
   sem fingir previsão.
2. Na Bomba, o gráfico DGEG mostra o preço, e a legenda diz que a parte
   de imposto por dia não está no gráfico (o repo só guarda o ISP em
   vigor hoje) — dito ao leitor, não escondido.
3. A mini-pessoa das cenas ganhou `.braco-d` para o aceno da senha — o
   braço direito faltava na miniatura do P2a.

**Os números:** home → **71,8 KB gzip** (limite 80 KB, gate verde); as
três cenas viajam em `next/dynamic`, fora do JS inicial.

### P2c — Casa da Inês, Pastelaria, Quiosque, Escola

Porta de `cenaCasa`, `cenaPastelaria`, `cenaQuiosque` e `cenaEscola`
(`cenas-bairro.js`) e do desenhador `graficoLinhas` (`cena-base.js`).
Mesmo molde da P2a: `CenaDePerto` + interior em `svg` gerado no
componente + dados por props; os chunks só descem ao entrar no
edifício. Para não colidir com a P2b (correu em paralelo): dados em
`dados-p2c.ts`, copy em `textos-p2c.ts`, arte em `*-arte.ts` próprios;
nos partilhados (`dados.ts`, `registry.ts`, `com-cena.ts`,
`Bairro.tsx`) só linhas acrescentadas.

- **`src/lib/viz/grafico-linhas.ts`** — o gráfico reutilizável: função
  pura (sem DOM, sem JSON), devolve `{ svg, texto }` com o `<dl
  class="b-sr">` escondido a dizer os mesmos números. Falhas na série
  QUEBRAM a linha (pen up); série vazia não desenha e o equivalente diz
  «—»; todas vazias → sem gráfico de zeros. As três cenas com gráfico
  usam-no. Os gráficos da P2a ficam como estão — refactorizá-los fica
  como proposta, não como facto.
- **Casa → `/casa`.** Os meses de trabalho vêm de
  `casa-em-salarios.json` (hpi ÷ custo do trabalho, 2015 = 100; último:
  ~192). A nota «não é o salário de ninguém» está na cena
  (`casaNota`). A pilha de recibos cresce por manipulação directa do
  SVG — com GSAP só se `motionActiva()`, e um bilhete de geração anula
  callbacks atrasados (a lição do contador da Fábrica); depois do
  passo 2 a pilha FICA no valor real.
- **Pastelaria → `/inflacao`.** «Comer fora» é o IHPC CP11 real;
  «comer em casa» o CP01 — nenhuma série inventada. O café de 2 € em
  ago 2020 é EXEMPLO e a cena diz-o (também no passo 2, onde o «hoje»
  aparece). O IVA sai de `iva.json` escolhido pelos exemplos da taxa
  («restauração» → intermédia; «pão…» → reduzida): dos 3,22 €, 0,37 €
  são IVA.
- **Quiosque → `/trabalho` e `/dados`.** O Jornal do Bairro mostra seis
  linhas — desemprego PT, jovens (razão ao total), PIB homólogo,
  inflação, confiança e SMN — cada uma com a SUA data e fonte. Falta de
  dado → «—» e a linha diz que a fonte falhou. A lição do denominador
  («20,1 % dos jovens ≠ 20,1 % de todos os jovens») ficou intacta.
- **Escola → `/aprender`.** Os minis são desenhos próprios
  (`escola-arte.mini`) — o truque é o eixo batoteiro, coisa que o
  `grafico-linhas` não deixa fazer por princípio. A lição das palavras
  usa os termos REAIS do glossário (`ipc-ihpc`, `taxa-real`,
  `escalao-irs`, `spread`, `tsu`), cada um ligado à cena onde vive por
  âncora e a `/aprender/[slug]`.

**Textos PROPOSTA:** toda a copy está em `src/app/_bairro/cenas/
textos-p2c.ts`, portada do protótipo — falas, perguntas, juízos do
palpite, legendas, placas, botões e `aria-label`s. Números entram por
parâmetro. Nada disto está revisto — a lista é a desta secção até o
dono a ler.

**Divergências e dúvidas numeradas para o dono:**

1. **«Homólogo» não existe no glossário do site.** O protótipo tinha
   seis palavras na terceira lição; a nossa tem cinco — homólogo
   aprende-se na lição 2 (o gráfico) mas não tem termo nem definição
   oficiais, e inventar uma definição violaria a regra nº1 do texto.
   Se quiser a palavra no glossário, a definição é sua.
2. **`taxa-real` liga a `/#correios`** (o poder de compra mora na cena
   dos Correios, da P2b — já fundida, a âncora abre de facto).
3. **A Pilha no passo 3 fica no valor real** (192), não volta aos 100
   da pergunta — voltar atrás esquecia a resposta que a cena acabou de
   dar.
4. **A fonte do Quiosque agrega** («Eurostat · desemprego (une_rt_m),
   PIB e confiança; INE/DR · salário mínimo em vigor desde jan 2026»)
   porque cada LINHA já leva a sua data; fonte por linha no rodapé
   seria ilegível. Se preferir fonte por linha, diz.

## P3 · A pele V5 nas 13 rotas — ✅ CONCLUÍDO (em `main`)

### P3a — tokens + cabeçalho/navegação/rodapé (ramo `v5/p3-pele-a`)

**O que entrou.** `data-pele="v5"` passou para o `<html>` — a pele vale
no site inteiro. Cabeçalho, navegação, ticker, rodapé, skip-link e
interruptor de tema vestem o contrato do protótipo: papel/tinta, traço
grosso, pílulas com sombra dura (o gesto físico de `.btn`: sobe ao
pairar, afunda ao premir), Archivo em todo o chrome. O grupo/separador
activo usa o `.btn.ligado` do protótipo (pílula invertida); o indicador
partilhado `nav-ind` (view-transition) manteve-se, agora amarelo.

**Decisões tomadas (a rever):**

1. **`data-pele` no `<html>`, não nos elementos do chrome.** Se o
   atributo ficasse no `<header>`/`<footer>`, cada um re-declarava os
   tokens claros no próprio elemento e em `dark` o chrome nunca
   anoitecia — `[data-pele][data-theme="dark"]` só dispara quando os
   dois atributos estão no MESMO elemento. No `<html>` a paleta da
   noite chega a todo o chrome; a home resgata-se sozinha porque o
   `.b5` leva `data-pele` próprio e re-declara os tokens claros para a
   sua sub-árvore.
2. **`:root:has(...)` passou a testar `.b5`, não `data-pele`.** Com o
   atributo no `<html>` a regra antiga disparava em todas as rotas e
   o escuro morria no site inteiro.
3. **`--linha` tem dois sentidos e precisou de uma fronteira.** Na pele
   é a cor do fio; nas rotas V4 é o contador de escalonamento escrito
   inline (`style={{ "--linha": i }}`). O reset `#conteudo { --linha:
   initial }` devolve o fallback `0` às rotas sem tocar nos ficheiros
   delas; o fio fica cor no chrome e no mapa (o `.b5` re-declara-a).
   Em P3b, quando as rotas migrarem, esta fronteira sai — fica apontado
   aqui para não esquecer.
4. **Na home em `dark`, o chrome anoitece e o mapa fica a papel.** O
   interruptor passa a ter efeito visível na home (só no chrome — o
   contrato «o mapa nunca escurece» mantém-se). É a leitura que me
   parece certa de «escuro = a noite do bairro», mas é produto: se o
   dono preferir o chrome claro na home em `dark`, força-se
   `:root:has(.b5)` também sobre os tokens V5.
5. **`InterruptorDeTema` desapareceu.** Existia só para esconder o
   toggle na home; em P3 o toggle fica visível em todo o lado, por isso
   o `SiteHeader` usa o `ThemeToggle` directamente e o ficheiro saiu.
6. **Strings do toggle passaram para `messages/pt.json`** (`tema.*`) —
   estavam escritas dentro do componente.
7. **Nas rotas V4 em `dark`, o chrome fica azul-noite V5 sobre o chão
   V4.** É o preço de fasear a pele — resolve-se em P3b quando as rotas
   migrarem. Se a mistura incomodar antes disso, diz.

**Teste novo:** `e2e/pele-chrome.spec.ts` — falhou 7/10 na base (sem
`data-pele`, sem pílulas, sem toggle na home); os 3 que já passavam são
trincos de regressão do tema (persistência e sem-flash já existiam).

**Ficou para P3b/P3c:** rotas com tokens V5 + ligações aos edifícios;
`/estilo` com o contrato V5; saída de Source Serif/Space Grotesk/Space
Mono e dos tokens V4 sem uso; a decisão de ligação para `/impostos`,
`/metodologia` e `/sobre` (em aberto, por propor em P3b).

### P3b · grupo 1 — as rotas de dinheiro (ramo `v5/p3-pele-b1`)

**O que entrou.** As seis rotas de dinheiro — `/salario`, `/irs`,
`/impostos`, `/poupanca`, `/credito`, `/casa` — vestem a pele V5 e
ganham no topo a ligação de volta ao edifício: «← Voltar ao bairro:
Fábrica» etc., âncoras `/#fabrica`, `/#financas` (irs e impostos),
`/#correios`, `/#banco`, `/#casa`. Os grupos 2 e 3 ficam a V4 até aos
PRs seguintes; a home não recebeu uma linha de HTML.

**Como funciona.** Cada rota embrulha o conteúdo num `<div
class="rt5">` e o `globals.css` ganha um bloco com escopo `.rt5`: os
tokens V4 (`--floor`, `--ink`, `--accent`, `--line`, o raio, as
sombras, a fonte) passam a apontar para os V5 — o componente não sabe
que mudou de pele, lê os mesmos nomes. Por cima do remapeamento vão as
pílulas: a ligação de volta (`.lnk-edificio`, variante azul-2), a
«pergunta seguinte» e o `<summary>` do detalhe vestem o `.btn` do
protótipo (traço grosso, sombra dura, o gesto físico de sobe/afunda).

**Decisões tomadas (a rever):**

1. **`Pagina` ganhou a prop `edificio?: { href; titulo }`.** A ligação
   mora no componente comum, não em seis páginas — quem não a passar
   (`/metodologia`, `/sobre`, e as rotas por migrar) não mostra nada.
   O texto «Voltar ao bairro» é a fórmula do protótipo e está em
   `messages/pt.json` (`pagina.voltarBairro`) — PROPOSTA, como sempre.
2. **O `--linha` recupera o sentido da pele dentro do `.rt5`.** A
   fronteira de P3a (`#conteudo { --linha: initial }`) continua a
   proteger as rotas por migrar; dentro do `.rt5` o `--linha` volta a
   ser a cor do fio. O escalonamento não quebra: quem escreve o
   contador inline ganha sempre à herança; quem lia `var(--linha, 0)`
   passa a ler uma cor, o `calc()` invalida-se e o delay cai a 0 —
   o mesmo efeito do reset, sem `animation-delay` partido. A fronteira
   só se apaga quando TODAS as rotas estiverem migradas (fim da P3b).
3. **Chão a cor chapada — a grelha milimetrada e o grão saem nas rotas
   migradas** (`:root:has(.rt5) body`: a especificidade empata com a
   regra V4 e ganha por vir depois no ficheiro).
4. **As cores semânticas do protótipo falham AA em texto pequeno.**
   `#e2412a` mede 4.18:1 e `#0c8f5c` 4.1:1 sobre papel — o smoke de
   contraste apanhou-o em `/credito`. Nas rotas migradas os tokens
   V4 de texto (`--accent`, `--accent-ink`, `--up`, `--down`, `--keep`)
   passam por `-txt`: a mesma família escurecida até 4.5+ (`#c73a1d` /
   `#0a7a4f` em claro; em escuro voltam aos valores do protótipo, que
   lá passam). A regra da casa ganhou ao protótipo — se o dono quiser
   vermelho em vez de vermelho-escuro, só em tamanho ≥18px/negrito.
5. **`--font-editorial` passa a Archivo nas rotas migradas** — a
   frase-resposta V3 («Da tua empresa saem…») deixa de ser Source
   Serif. O mono V4 fica nos meta/breadcrumbs — fora disto ficava
   artifício a mais para o protótipo; decisão para rever.
6. **Home intacta.** O gate mede 79,3 KB gzip — nada foi acrescentado
   ao HTML da home; a pele vive no chunk CSS partilhado.

**Teste novo:** `e2e/pele-rotas.spec.ts` — 14 casos: cada rota do
grupo 1 tem `.rt5`, chão V5 e a âncora certa nos dois temas; a home
não tem `.rt5` nem ligações; as rotas dos grupos 2 e 3 continuam
sem pele.

### P3b · grupo 2 — preços e trabalho (ramo `v5/p3-pele-b2`)

**O que entrou.** As quatro rotas de preços e trabalho — `/inflacao`,
`/precos`, `/trabalho`, `/dados` — vestem a pele V5 com o mesmo gesto
do grupo 1 (`<div className="rt5">` + `edificio` no `<Pagina>`) e
ganham a ligação de volta: «← Voltar ao bairro: Mercearia do Manuel»
(`/#mercearia`), «Bomba de gasolina» (`/#bomba`) e «Quiosque da
praça» (`/#quiosque`, no `/trabalho` e no `/dados` — o primeiro
edifício partilhado por duas rotas). O grupo 3 fica a V4 até ao PR
seguinte; a home não recebeu uma linha de HTML.

**Decisões tomadas (a rever):**

1. **Quase zero CSS novo — mas o smoke de contraste abriu a boca.**
   Os ticks dos eixos do `<LineChart>` (`fill="var(--color-muted)""
   em atributo) resolvem à raiz (`#8f8878`) e falham AA sobre o chão-
   noite dentro do `.rt5` (4.31:1) — o audit chumbou `/inflacao` e
   `/precos` em `dark`, como o deploy parte. O grupo 1 escapou porque
   nenhuma rota dele desenha `LineChart`. Fix de duas linhas: os ticks
   passam a `fill="var(--muted)"`, que dentro do `.rt5` é o `--suave`
   (5.6:1 nos dois temas) e fora dele resolve ao mesmo de antes.
   O bloco `.rt5` em si não cresceu.
2. **O `/dados` não tem cartão-instrumento** (só células
   `<Instrumento>`, sem `.leitura`) — no e2e a mobília V5 prova-se
   aí na pílula do detalhe (papel + Archivo) em vez de no cartão.
   O `cartao` do teste é por rota, `null` no `/dados`.
3. **Títulos dos edifícios vêm de `messages/pt.json`**
   (`bairro.edificios.*.titulo`), como no grupo 1 — «Mercearia do
   Manuel», «Bomba de gasolina», «Quiosque da praça», não alcunhas
   inventadas na rota.

**Teste novo:** `e2e/pele-rotas.spec.ts` — mais 8 casos (4 rotas ×
2 temas); o trinco das «rotas por migrar» passa a cobrir só o grupo
3 (`/aprender` sem `.rt5`, `/metodologia` sem ligações). Total 22.

### P3b · grupo 3 — aprender, meta e /estilo (ramo `v5/p3-pele-b3`)

**O que entrou.** As últimas cinco rotas vestem `.rt5` e a migração
fica completa — já nenhuma rota usa a pele V4. As duas do glossário
ganham a ligação «← Voltar ao bairro: Escola» (`/#escola`);
`/metodologia`, `/sobre` e `/estilo` não têm edifício e ficam sem
ligação (decisão do dono para as duas primeiras; `/estilo` segue a
mesma regra — não há edifício que a represente).

**Decisões tomadas (a rever):**

1. **`/estilo` vestiu a pele mas a copy continua a descrever a
   direção «Observatório» V4** (Archivo expandido, Space Grotesk,
   Source Serif, Space Mono). Migrar a página é visual; a reescrita
   da referência viva para a linguagem do bairro é editorial do dono
   — fica registado aqui como dívida de copy.
2. **Colisão de sessões, resolvida:** o `_lettering` chumbava main
   (espaços normais no `fonte` do `isp.json`); este ramo trazia o mesmo
   remendo U+202F que o #49 — ao fazer rebase sobre o main com o #49
   fundido, o hunk caiu como idêntico. O #52, de outra sessão, cobre só
   `/aprender` e `/metodologia`; este PR é o grupo 3 completo.
3. **O teste dos slugs usa `/aprender/euribor`** (termo estável no
   glossário) em vez de iterar `generateStaticParams`.

**Prova.** `pele-rotas.spec.ts` cobre as três camadas: grupos 1 e 2
inalterados, grupo 3 (5 rotas × claro/escuro + ligações/ausência
delas), home sem `.rt5` nem `.lnk-edificio`. Audit completo verde —
o `_lettering` era a última falha conhecida de main.

### P3c — as fontes, os tokens mortos e a `/estilo` escrita (ramo `v5/p3-pele-c`)

Fecha a dívida que a P3b registou no ponto 1: `/estilo` já não descreve
a direção «Observatório», e as três fontes V4 saíram do site.

**1. Fontes — de cinco para duas.** `layout.tsx` carregava cinco
`next/font`; ficam só **Archivo** e **Caveat**. Antes de apagar cada
uma, cada `--font-*` foi procurado no CSS e no TSX:

| token | origem V4 | destino V5 |
| --- | --- | --- |
| `--font-sans` | Space Grotesk | `var(--font-archivo), "Arial", sans-serif` |
| `--font-editorial` | Source Serif 4 | o mesmo Archivo do `--font-sans` |
| `--font-grotesk` | Space Grotesk | idem `--font-sans` |
| `--font-serif` | Source Serif 4 | idem `--font-sans` |
| `--font-space` | Space Mono | monoespaçada do sistema |
| `--font-mao` | Caveat | **mantida** (gráficos e quadro da escola) |

`--font-editorial` dobrou para o Archivo por decisão editorial, não por
economia: o `--font-editorial` só era lido em `src/lib/pontos/tela.ts`
(`lerCores()`, para medir a altura de um texto). Com ele a desenhar
em Archivo — como o `.rt5` já fazia — a medição passa a bater certo
com o que se vê. Era uma divergência latente.

**Monoespaçada: a decisão que a P3b deixou em aberto.** Não há `@font-face`
de monoespaçada em V5. Seria preciso *trazer* uma (≈ 20 KB por peso e
estilo) para substituir uma fonte que só servia o talão e o recibo.
Resolve-se com a pilha do sistema — `ui-monospace`,
`SFMono-Regular`, Menlo, Monaco, Consolas, `Liberation Mono`,
`Courier New` — que é o que a casa já usa no terminal. O talão fica
monoespaçado em qualquer máquina, sem custar um pedido de rede.

**Prova (o CSS construído, não o fonte).** O detector por `class=` não
serve: o Tailwind só emite o que é usado, e `/estilo` monta tokens por
template literal. A prova fiável é o CSS emitido:

```
ANTES:  8 declarações  font-family de Source Serif 4 / Space Grotesk / Space Mono
DEPOIS: 0
```

E o `out/estilo.html` servido não menciona nenhuma delas. O
`e2e/fontes-v4.spec.ts` novo fixa isto: o CSS servido não as nomeia,
`document.fonts` só tem `Archivo` e `Caveat`, e cinco rotas
(`/`, `/salario`, `/dados`, `/metodologia`, `/sobre`) são vigiadas por
`page.on("request")` à caça de `.woff2`.

**2. Tokens V4 apagados (31 linhas de token).** A prova de «sem uso» tem de ser
o CSS construído, não o `grep` — aFont apaga o que ninguém pede:

| apagado | onde | porquê morreu |
| --- | --- | --- |
| `--accent-t`, `--keep-t`, `--mark-t` | 2 temas, 6 linhas | substituídos pelas rampas `--seq`/`--seqb`/`--dink` |
| `--text-svg-mini` | `:root` | nenhum utilitário emitido |
| `--text-display-xl` (+companheiro `--line-height`) e `--text-talao-hero-lg` | `@theme` | a escala tem `--text-display-2xl` (3,75rem) por cima e `--text-talao-hero` (1,875rem) para o talão |
| 21 aliases `@theme` (16 `--color-*`, 4 `--radius-*`, `--shadow-dura`) | `@theme inline` | o V5 lê o token cru, não o utilitário |

**Ficaram, e porque:**

- `--seq-1..4`, `--seqb-1..4`, `--dink-1..4` — usados **por template
  literal**, tanto em `/estilo` (`var(--color-${rampa}-${i+1})`) como em
  `src/lib/viz/cores.ts` (`corSeq`, `corDink`, `corSerie`,
  `corQuantil`). O `grep` não os vê; apagá-los partia todos os gráficos.
- `--papel-fica-tinta`, todos os `--raio-*` e `--elev-*`,
  `--sombra-duda`→`--sombra-dura` — `var()` vivo.
- `--radius-instrumento`, `--radius-controlo`, `--shadow-raised`,
  `--shadow-overlay`, `--text-talao-hero`, `--text-talao-numero`,
  `--text-display-xs` — utilitários que o Tailwind **emite** no build.
  O script de tokensMortos dá-os como mortos; o build desmente-o.

**3. Componentes V4.** Apagados os que **nada** referencia:
`_home/EscolhePergunta.tsx`, `_home/portas-previews.tsx`,
`_home/portas.css` (1 108 linhas, zero referências em lado nenhum).

Ficam para o P4, listados no PR com o último commit:

| ficheiro | último commit | quem o referencia |
| --- | --- | --- |
| `_home/HeroMoeda.tsx` | `9b1a121` (23-09) | só o próprio teste |
| `_home/HeroMoedaCliente.tsx` | `856ea04` (24-09) | só o próprio teste |
| `_home/hero-moeda.css` | `44c7df7` (24-09) | importado pelos dois de cima |
| `_home/hero-moeda.test.tsx` | `9b1a121` (23-09) | — |

Não foram apagados porque a casa diz «apagar em P4» e porque têm
teste vivo: apagá-los agora seria apagar o que o P4 tem de decidir.

**4. `/estilo` reescrita.** A intro passou a «o contrato visual «O
Bairro», claro por omissão»; os rótulos que diziam «Source Serif 4»,
«Space Grotesk» e «Space Mono» dizem agora «Archivo» e «monoespaçada
do sistema». A secção nova (`data-contrato-v5`) mostra: dez tokens de
cor lidos por `var(--token)`, a tipografia (heróico, mão, monoespaçada),
a forma (`.pil-nav` ×2 e o cartão com `--traco`/`--raio-cartao`/
`--sombra-dura`), dois gráficos com `aria-label`, o talão, e a noite do
bairro com um `<button data-theme-toggle>` a sério.

**AA — uma falha real, encontrada pelo audit.** A amostra amarela
nascia com a tinta do tema, que anoitece: o audit mediu **1,37:1** em
escuro. O `--amarelo` é superfície clara **nos dois temas**, por isso
leva sempre `color: #16130f`. Componente corrigido, não regra do
audit afrouxada.

**Lettering — a especificação tem de ser exemplar.** O `_lettering`
apanhou os números do meu excerto monoespaçado e do talão com espaço
normal antes do `€`. Passaram por `comUnidade()` de `@/lib/format`
(U+202F), que é a ponte da casa — e é o que uma página que **é** a
especificação deve mostrar.

**5. Copy — PROPOSTA.** 23 chaves novas em `messages/pt.json`, todas
por rever:

| chave | texto |
| --- | --- |
| `estilo.titulo` | Contrato visual «O Bairro» |
| `estilo.nota` | O que o protótipo mostra é o que vai para produção. Onde esta página e o protótipo divergirem, ganha o protótipo; onde a página e as regras da casa divergirem, ganha a casa. |
| `estilo.cor` | Cor |
| `estilo.corNota` | Cada cor tem um nome e um sítio. O verde é o que fica contigo, o vermelho é o que sai, o azul é neutro e informa. Nenhuma cor decora. |
| `estilo.tipografia` | Tipografia |
| `estilo.tipografiaNota` | Uma família para tudo, uma mão para os gráficos, e a monoespaçada do sistema para o talão e o recibo. Não há fonte editorial. |
| `estilo.arquivoEixo` | O eixo da largura |
| `estilo.arquivoEixoNota` | O mesmo Archivo aperta a manchete e alarga o número. É assim que um título se distingue de um corpo — não é outra fonte. |
| `estilo.mao` | Caveat — a mão |
| `estilo.maoNota` | Só nos gráficos e no quadro da escola. Nunca num número que a pessoa precise de ler já. |
| `estilo.mono` | Monoespaçada do sistema |
| `estilo.monoNota` | O talão e o recibo. Não descarrega nada. |
| `estilo.forma` | Forma |
| `estilo.pilha` | Botão em pílula |
| `estilo.pilhaNota` | Traço de 3 px em tinta preta e sombra dura 3px 4px. Sobe ao pairar, afunda ao premir — o gesto é o mesmo de quem carrega num botão de plástico. |
| `estilo.cartao` | Cartão |
| `estilo.cartaoNota` | Raio de 22 px, traço de tinta, a mesma sombra dura. Nada de vidro, nada de gradiente, nada de sombra difusa. |
| `estilo.grafico` | Gráfico |
| `estilo.graficoNota` | Toda a figura tem um equivalente textual e é legível nos dois temas. As séries que recuam de contexto usam a família de tinta, não cor. |
| `estilo.papel` | O papel |
| `estilo.papelNota` | O talão é um objecto físico: não muda de cor quando se apaga a luz. O verde é o papel do que fica contigo, o vermelho o do que sai. |
| `estilo.noite` | A noite do bairro |
| `estilo.noiteNota` | O tema escuro não é um inverso: é o céu (#141a33) sobre o papel das janelas (#1d2442). O mesmo azul, verde e vermelho, medidos para passarem em AA sobre a noite. |

**Peso (medido nos dois builds completos, `out/`):**

| | antes | depois | Δ |
| --- | --- | --- | --- |
| fontes (`.woff2`) | 588,7 KB / 22 ficheiros | 424,3 KB / 7 ficheiros | **−164,4 KB** |
| CSS | 132,1 KB | 125,8 KB | **−6,3 KB** |

## P4 · Qualidade e lançamento — 🟡 PARCIALMENTE FEITO

**Feito e em `main`:** os dados das cenas fora do flight
(`public/cenas/*.json`, abaixo), o `_gate-html.mjs` no CI, o `audit` no CI,
a medição em `docs/MEDICAO-V5.md`, a revisão de copy gerada em
`docs/REVISAO-COPY-V5.md`.

**Falta:** (1) o dono rever a copy; (2) o PR de lançamento e o merge, que
é decisão dele; (3) a decisão sobre os componentes V4 que sobraram
(`_home/HeroMoeda*`, `hero-moeda.css`) — a lista está no fim da P3c.

### P4 — os dados das cenas saem do payload da home — ✅ CONCLUÍDO

Os dados das cenas viajavam na prop `cenas` do `<Bairro>`: o Next
embarcava-os no flight (`self.__next_f`) da home — ~19 KB raw de séries
e tabelas pagos por quem nunca abre um edifício.

Decisão: um ficheiro estático por cena — `public/cenas/<id>.json`,
escrito no `npm run derive` pelo passo `scripts/derive/cenas.ts`, que
chama a MESMA `dadosCenas()` do servidor (nenhuma lógica copiada). O
cliente (`CenaViva` no `Bairro.tsx`) faz `fetch("/cenas/<id>.json")` ao
abrir, com cache por id; os ficheiros vão commitados como a
`public/api/` e a ingest diária actualiza-os no mesmo gesto.

Enquanto o json não chega — ou se falhar — a moldura `CenaDePerto`
abre na mesma, sem desenho (`semDesenho`), com Escape/× a funcionar e
a falha honesta em vez de zeros. Duas asneiras do JSON registadas:
não tem NaN (o gerador falha alto se uma série trouxer um buraco, em
vez de escrever `null` que a aritmética leria como 0) e não tem
`undefined` (nenhum campo de `CenasDados` o usa — verificado).

Copy PROPOSTA nova (em `cenas/textos.ts`, para o dono rever):
- `aCarregar` = «A ir buscar os números…»
- `falhaAoCarregar` = «Os números desta cena não chegaram. Fecha e tenta
  outra vez.»

Medido (`scripts/_dieta-html.mjs`, home): payload RSC 17 184 →
**9 088 B gzip**; home 78 246 → **70 099 B gzip**.

### P4 — metadados e partilha em todas as rotas (ramo `v5/p4-seo`)

**O que entrou.**

O `og:image` que o site anunciava não existia. O `head` dizia
`https://aocentimo.pt/opengraph-image?222b691790b2fa33` — e com
`output: "export"` essa rota vira um ficheiro **sem extensão**
(`out/<rota>/opengraph-image`, 45 KB). O GitHub Pages serve-o como
`application/octet-stream`, e nenhum crawler de partilha abre um
`octet-stream`: as metas eram perfeitas e a imagem era inacessível.
Havia catorze desses cartões (a raiz mais treze por rota), **632 KB no
`out/`**, todos do mesmo desenho de palavra-marca e nenhum deles aberto
por quem fosse partilhar a página.

| | antes | depois |
| --- | --- | --- |
| `og:image` | `/opengraph-image?hash` (sem extensão) | `/og-bairro.png` (PNG servido) |
| cartões no `out/` | 14 ficheiros, 632 KB | 1 ficheiro, 74,2 KB |
| `manifest.webmanifest` | não existia | `src/app/manifest.ts` |
| `Organization` na home | não existia | no mesmo `@graph` do `WebSite` |
| `BreadcrumbList` | não existia | 34 páginas com «Voltar ao bairro» |
| home (gate de 80 KB gzip) | 72,1 KB | **72,4 KB** |

**Decisões tomadas (a rever).**

1. **Um cartão só, tirado do mapa.** `public/og-bairro.png`, 1200×630,
   gerado por `scripts/_og-bairro.mjs` (Playwright sobre o `out/`, tema
   claro, hora «Dia», com os treze marcadores à vista). As catorze metas
   de `opengraph-image.tsx` saíram com ele, e `src/lib/og.tsx` ficou sem
   consumidores — 95 linhas apagadas. *O que se perde:* cada rota tinha o
   seu cartão com o nome da secção escrito. *O que se ganha:* o único
   cartão que o GitHub Pages consegue servir.

   O `og:title`/`og:description` **continuam por rota** — é o texto que
   distingue a partilha, e esse é barato. Não são escritos à mão no
   bloco: o Next herda-os do `title` já com o template aplicado, para
   que o separador e o feed não possam divergir.

2. **A copy saiu dos componentes para `messages/pt.json`.** Chave nova
   `seo`, com `titulo` e `descricao` das catorze rotas. Treze eram
   verbatim o que já lá estava; **uma é nova**:
   - `seo.rotas.sobre.descricao` — «O que é o AO CÊNTIMO, porquê existe
     e quem o faz: um projeto pessoal, sem publicidade nem
     rastreamento, com o código e os dados abertos.» (PROPOSTA — as
     treze outras já estavam publicadas no site.)

   O `layout.tsx` deixa de escrever o título e a descrição à mão: lê
   `m.meta.title` / `m.meta.description`, que já lá estavam no `pt.json`
   desde sempre e **não eram lidos por ninguém** — as strings estavam
   duplicadas dentro do componente.

3. **As âncoras da cena partilham o cartão do site.** `/#banco` é o mesmo
   documento que `/`: mesmo `canonical`, mesma imagem, nenhuma rota nova.
   Um cartão por cena seria uma imagem por URL, e o mapa não muda de
   figura quando o `_hash` muda.

4. **As migalhas seguem a «Voltar ao bairro».** O `BreadcrumbList` é
   emitido pelo próprio `Pagina`, condicionado ao `edificio` — que é o
   mesmo campo que desenha o «Voltar ao bairro». São **34 páginas** — as
   11 rotas com edifício mais os 23 termos (`/aprender` conta uma vez, o
   seu índice). `/metodologia`, `/sobre` e `/estilo` não têm edifício e
   por isso não têm degraus: uma migalha sem caminho não é migalha. Os
   nomes dos degraus saem de `m.nav`, que já rotula cada secção — nada de
   escrever «Salário» outra vez.

5. **`/sobre` ganhou descrição.** Tinha 37 caracteres; o tecto da casa é
   50. Era a única das catorze fora da medida.

**Prova.**

`e2e/seo.spec.ts`, oito testes: as catorze rotas com título único,
descrição entre 50 e 160, canonical absoluto igual à rota e `og:image`
absoluto **que responde 200 e vem como `image/png`**; os 23 termos com o
seu canonical e a mesma imagem; o PNG com a assinatura, a medida lida do
IHDR (1200×630) e o peso abaixo de 250 KB; o sitemap com as 15 rotas e os
23 termos, **cada URL pedida e respondida**, e sem qualquer `#` na lista;
`robots.txt`, `manifest.webmanifest` e os ícones que ele aponta; as
âncoras a partilhar o cartão da home; a home com **um só** bloco de
dados estruturados e um `WebSite` e uma `Organization` que não sejam
duplicados; e as migalhas presentes nas páginas com «Voltar ao bairro» e
ausentes nas outras.

Os 386 e2e e os 734 unitários verdes, e o `audit` com zero falhas AA.

**Uma divergência com o pedido, para o dono decidir.** O pedido dizia
«as 14 rotas e as 23 páginas». O sitemap tem **15** rotas: a lista do
AGENTS também tem catorze, mas a home conta. Ficam as catorze de
conteúdo mais a home, e `/estilo` lá está — é indexável de propósito
(«peça de portefólio, ligada do rodapé», está escrito no código). Tirá-la
do sitemap para chegar às catorze seria decidir contra uma nota do
próprio ficheiro; por isso ficou, e o teste conta o que há, não um número
mágico.

**A lista final de textos PROPOSTA saiu deste ficheiro.** Vive em
**`docs/REVISAO-COPY-V5.md`** — uma tabela só, gerada por
`node scripts/_revisao-copy.mjs` a partir de `cenas/textos.ts`,
`textos-p2b.ts`, `textos-p2c.ts`, `messages/pt.json` e deste registo, com
as 3 propostas de `docs/AUDITORIA-CENAS-V5.md` §2.2 no fim. As frases com
um número escrito à mão dentro do texto vêm marcadas com ⚠️: é o ponto que
mais merece atenção na revisão. Não lançar sem ela.

## Revisão final da copy — fechada a 2026-10-06

O dono aprovou a copy PROPOSTA em bloco, depois da triagem (os 9 pontos aplicados no #68). A decisão vive no gerador, `scripts/_revisao-copy.mjs` (a tabela é gerada, uma aprovação escrita à mão perdia-se na regeneração), e a tabela passa a dizer «aprovado 2026-10-06» em cada frase. Das três propostas da auditoria: P1 («quase o dobro») foi retirada no #68; P2 (os 50 litros da Bomba como exemplo) aplica-se agora («Imagina que o Pedro vai atestar…»); P3 (a fonte do `irs-2026.json`) fica em aberto, por ser metadado e não copy do site. Copy nova daqui em diante volta a ser PROPOSTA até o dono a rever.

## 2026-10-07 · a paridade das cenas volta à copy aprovada

A passagem de paridade com a maquete (156bed7) mexeu em frases já
aprovadas a 2026-10-06 (`c8cc7a5`). Foram repostas palavra por palavra:
`finQuem`, `banQuem`, `mercQuem`, `finNotaRodape` (volta a frase do
adiantamento), `finBtnGrafico`, `mercBtnIva`, `mercIvaTexto` (volta a
«lista I do Código do IVA»), `casaFala2` (sem «quase o dobro», retirado no
#68), `casaExplica`, `pastFala3`, `escPerguntaCurta`, `escNotaIndices`, e as
fontes das cenas. A Escola volta aos cinco termos do glossário real (P2c,
divergência 1: sem definição de «homólogo» inventada).

Fica da paridade o que não é copy: animações, destaques (`<b>`, `.b-r`,
`.b-a`) sobre as mesmas palavras, formatos dos números, e duas correções
de dados (a subida da Pastelaria mede-se desde ago 2020, como a frase diz;
a inflação dos Correios a 0,1 pp). A comparação das frases geradas pelo
`_revisao-copy.mjs` contra `c8cc7a5` dá zero diferenças.

**PROPOSTA (falta aprovação do dono):** a tabela dos escalões nas
Finanças, da maquete — `finTabelaResumo` «Ver a tabela dos escalões»,
`finTabelaEscalao` «Escalão», `finTabelaRendimento` «Rendimento
coletável», `finTabelaTaxa` «Taxa», `finTabelaFaixa` «{de} a {ate}»,
`finTabelaAcima` «acima de {de}».
