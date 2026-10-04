# AO CÊNTIMO — produto e sistema

> **Estado: VIGENTE — este documento é a verdade única do produto.**
> Criado em 2026-09-18. Direction V3 «Ledger» (2026-09-21), actualizada em
> 2026-09-22 para integrar a direcção V4 «o cêntimo como unidade».
> **Reescrito a 2026-10-04 para a V5 «O Bairro»**, que é o que está em
> produção: a §2 passou a descrever a direcção vigente e as §3–§6 (V3 e V4)
> foram **arquivadas em `docs/historico/PRODUTO-V3-V4.md`** com nota de
> leitura. O que da V3/V4 sobreviveu — Regra nº1, a unidade, os três níveis,
> a letra — está marcado aqui como **[subsiste]** e manda igual.
> Onde este texto e o código divergirem, **o código manda** e o texto
> corrige-se — a verdade vive em `src/app/globals.css` e em `/estilo`.
>
> Substitui, como contrato, os três planos históricos:
> `PLANO-LITERACIA-FINANCEIRA.md`, `PLANO-REDESIGN-BRUTO.md` e
> `PLANO-DESIGN-V2.md` — ficam como registo do que foi planeado e do que
> sobreviveu. O porquê de cada mudança está datado em `DECISOES.md`.
>
> **Regra de leitura deste ficheiro.** §1 (o que é), §2 (a direcção
> vigente), §6b (o bairro), §7 (intocável), §8 (regras de produto) e
> §10–§11 (rotas, stack, referência viva) são **contrato**. As secções
> marcadas **[arquivada]** são registo do que se planeou: dizem o que se
> pensou na altura, não o que o site faz. Nenhuma delas pode ser usada
> para justificar uma decisão nova.

---

## 1. O que é

Site público e gratuito de literacia financeira para Portugal. Responde,
com dados oficiais e simuladores rigorosos, às perguntas que nenhum site
português cruza num só lugar: para onde vai o salário (bruto → líquido,
SS, IRS, custo para a empresa), quanto subiu o que se compra (inflação
por categoria), quanto do preço é imposto (IVA, ISP, cascata), o que é a
Euribor e porque subiu a prestação, onde rende a poupança.

Não é agregador de notícias, não é comparador comercial, não dá conselhos.
Read-only: sem contas, sem tracking, sem cookies, sem input pessoal.

**Público: dos 12 anos aos profissionais.** O nível 1 de cada página
lê-se sem saber nada; o nível 3 satisfaz um jornalista (ver §5).

## 2. Direcção vigente — «O Bairro» (V5)

Decisão do dono de **2026-09-30** (ver `docs/DECISOES.md`), depois do veredicto
de design sobre a P1: a home deixou de ser uma página de perguntas e passou
a ser **um mapa**. É o bairro do Porto visto de cima, desenhado a cartoon,
em que cada edifício é uma das perguntas que o site já fazia.

O que a V5 **não** muda: o que o site ensina, os dados, os motores, as
regras fiscais, a PT-PT, a read-only. Muda **por onde se entra** e **como
se apresenta**.

### 2.1 Por onde se entra

- **A home é o mapa.** `/` não é uma lista de cartões nem um hero: é o
  bairro. Os valores dos marcadores chegam no HTML do servidor — sem
  JavaScript vê-se o bairro inteiro e os números.
- **Onze edifícios = onze cenas.** Cada edifício é uma cena curta por
  **âncora** (`/#financas`), nunca uma rota nova. As cenas vivem em
  `next/dynamic` e só descem ao entrar no edifício — o bundle inicial da
  home não traz nenhuma.
- **As personagens são perfis económicos, não mascotes.** Sete cartas
  (Inês, Diana, Pedro, Sr. Manuel, Dona Arminda, Gonçalo, Rui e Marta)
  cada uma com uma relação diferente com o dinheiro: conta de outrem,
  função pública, recibos verdes, pequeno empresário, reformada,
  primeiro trabalho, crédito à habitação. Tocar numa carta leva a câmara
  até à personagem no mapa.
- **Cada rota VOLTA ao bairro.** De `/salario` vê-se «← Voltar ao bairro:
  Fábrica» (`/#fabrica`). A navegação é um ciclo, não uma escada.

O mapa completo dos onze edifícios — cada `data-id`, a cena que abre e a
rota onde se aprofunda — está em **§6b.1**.

### 2.2 Claro por omissão; o escuro é «a noite do bairro»

O tema vive em `<html data-theme>`, inicializado pelo script inlinede `src/app/layout.tsx`: **escolha guardada → claro**. Omissão: claro,
desde
o veredicto de design sobre a P1: a home do bairro é uma página de papel e
não tem tema — estranho era o site nascer escuro e a home clarear sozinha.
Quem prefere escuro usa o toggle (persistido, visível em todo o site).

O escuro **não é um inverso**: é a noite do bairro. Fundo `#141a33` (o céu
sobre o Porto), papel `#1d2442`, tinta `#f4efe4`, azul `#8da2ff`, verde
`#3fc48a`, vermelho `#ff7a5c`, amarelo igual. Todos medidos para passarem
em AA sobre a noite (ver `docs/AUDITORIA-CENAS-V5.md` e o `--verde-fundo`
que nasceu de uma falha real).

Uma excepção deliberada, escrita no código: **na home, o mapa nunca
escurece.** O chrome anoitece, o mapa fica a papel — é uma folha de mapa
em cima da mesa, não um ecrã.

### 2.3 Tipografia — duas fontes

**Archivo** (com o eixo de largura) para tudo. **Caveat** só nas anotações
à mão nos gráficos e no quadro da escola. O talão e o recibo em
**monoespaçada do sistema** (`ui-monospace`, `SFMono-Regular`, Menlo,
Monaco, Consolas, `Liberation Mono`, `Courier New`) — não descarrega nada
e o talão fica monoespaçado em qualquer máquina.

As três fontes da V4 (**Space Grotesk**, **Source Serif**, **Space
Mono**) saíram do `layout.tsx` na P3c. O `--font-editorial` dobrou para o
Archivo por decisão editorial: só era lido em `src/lib/pontos/tela.ts`
para medir a altura de um texto, e com ele a desenhar em Archivo a medição
bate certo com o que se vê.

### 2.4 Forma

Traço de 2,5 a 3,5 px em `--tinta`; botões em pílula com sombra dura
`3px 4px 0 var(--tinta)`; cartões com raio 18–24 px e a mesma sombra.
Nada de gradientes de fundo, vidro, roxo ou sombras difusas.

### 2.5 O que sobrevive da V3/V4 — [subsiste]

Estas regras não foram revogadas pela V5. Continuam a mandar, e o bairro
foi construído por cima delas:

- **[subsiste] Regra nº1** — nunca inventar dados (§8.1).
- **[subsiste] Fonte + data visíveis** em cada número (§8.2).
- **[subsiste] PT-PT europeu**, sem «usuário/você» (§8.3).
- **[subsiste] Cor com significado** — verde = o que fica contigo,
  vermelho = o que sai, azul = neutro/informa; ▲/▼ nas variações. Nunca
  decoração.
- **[subsiste] Um equivalente textual por figura** e AA nos dois temas.
- **[subsiste] O cêntimo como unidade** — 1 ponto = 1 cêntimo onde há
  partes de um todo em dinheiro (`CampoCentimos`, que sobreviveu como
  herói de `/salario`, `/trabalho`, `/impostos`, `/poupanca` e do
  `e2e/campo-centimos.spec.ts`).
- **[subsiste] Isométrico = estrutura, pontos = quantidade.** Nunca o
  contrário.
- **[subsiste] Letra fina** — o fino U+202F entre número e unidade, o
  menos U+2212, aspas «…», reticências «…» (§6, [arquivada] mas o
  `_lettering` continua a correr no CI).
- **[subsiste] Copy curto e afirmativo**, uma ideia por peça.

O texto **completo** da V3 (as dez regras «Ledger») e da V4 (a unidade, os
três níveis, o catálogo de codificações, o sistema visual, a coreografia,
o inventário de motion) foi para **`docs/historico/PRODUTO-V3-V4.md`**, com
nota de leitura. Está lá porque explica o porquê de muita coisa que
funciona; não se actualiza e não se cumpre.

## 3. ~~A linguagem V3 «Ledger» — dez regras~~ [arquivada]

> **Esta secção e as §4–§6 são registo, não contrato.** Foram o sistema
> visual da V3/V4, entre 2026-09-18 e 2026-09-30. O texto íntegro, com
> tabelas e inventários, está em **`docs/historico/PRODUTO-V3-V4.md`**.
> Fica aqui um sumário porque explica decisões que ainda mandam; **onde
> este texto e o código divergirem, ganha o código e ganha a §2.**

Adoptada em 2026-09-21 a partir das referências do dono; o texto completo
e as decisões extraídas ficam em `docs/DIRECAO-V3.md` (documento de
registo — **integrada neste PRODUTO.md a 2026-09-22**). As dez regras:

1. **Cartão = objecto completo.** Cabeçalho (breadcrumb mono · estado),
   corpo com UMA ideia, rodapé com fonte + acções («ver →», «JSON»).
   Nunca células coladas de grelha.
2. **Uma cor de sinal** por cartão; tudo o resto em cinzentos quentes.
3. **Gráfico = uma frase.** O insight escreve-se no gráfico com linha de
   chamada tracejada; a área entre duas séries é hachurada (codifica uma
   diferença, não enfeita); a comparação em cinzento por baixo.
4. **Foco = impressão.** O cartão focado inverte para papel e a anotação
   desenha-se — o observatório imprime a leitura quando lhe pegas.
5. **Controlos físicos.** Inputs de valor são réguas com traços de
   unidade, marcador «agora» e presets em pílula; toggles com nó. Nunca
   `<input type=range>` com cara de browser.
6. **Explosão isométrica de traço fino** para composições — na V4 fica
   reservada à **estrutura** (ver §4 e §6).
7. **Números contam, nunca nascem.** Odometer do valor anterior; acima da
   dobra, SSR final.
8. **Sem teatro de scroll.** Os cartões entram com
   `IntersectionObserver` + `--stagger`; a narrativa vive dentro deles.
9. **Copy curto e afirmativo.** Uma frase por insight; metodologia em
   footnote ou `/metodologia`.
10. **Três níveis tipográficos apenas:** kicker mono caixa-alta, display
    Archivo, serifada para a frase-insight.

Anti-padrões V3 (somam-se à lista negra de §9): mostradores de agulha,
grelhas de cartões idênticos, moedas/ícones a rolar com scroll, anotações
sem linha de chamada ou mais de uma por gráfico, qualquer animação cuja
ausência não se note. Verificação de movimento: nenhuma animação se
aprova por screenshot — grava-se vídeo (`scripts/_video.mjs`) e revêem-se
os fotogramas antes do commit.

## 4. ~~A direcção V4 — «o cêntimo como unidade»~~ [arquivada]

Do relatório `referencias/V4/00-RELATORIO.md` (2026-09-22).
**V4 = V3 «Ledger» + a unidade + a arquitectura.** Não substitui a V3:
completa-a.

### A unidade: 1 ponto = 1 cêntimo

Partes de um todo em dinheiro desenham-se em **pontos contáveis**: de cada
euro, 100 pontos; os que saem (TSU, IRS, SS, IVA…) e os que ficam. É o
nome do produto feito sistema; uma criança conta pontos, um profissional
lê a proporção exacta (arredondamento pelo maior resto — os pontos somam
sempre o total e o texto diz o valor com casas decimais). O movimento é a
explicação: os pontos voam de onde estão para quem os leva.

**Unidades contáveis** são a codificação principal de quantidade na V4:
pontos para dinheiro, traços para contagens e limites («1 traço = x»,
com a unidade escrita no cartão).

**Regra de ouro:** *isométrico = estrutura (o que é); pontos = quantidade
(quanto é).* Nunca o contrário — um diagrama isométrico nunca dimensiona
peças por valor.

### A arquitectura: três níveis em todas as páginas de conteúdo

| Nível | Para quem | O que tem |
|---|---|---|
| **1 · A resposta** | toda a gente, incluindo 12 anos | a pergunta (h1), UM instrumento, UMA frase simples com o número (≤ 25 palavras, sem jargão) |
| **2 · Explora** | quem quer mexer | os controlos (réguas, presets), cenários, a visualização própria da página |
| **3 · Confirma** | profissionais, jornalistas | tabelas, legislação, fórmulas, fontes, JSON — em `<details>` fechado por omissão |

Cada página termina com **a pergunta seguinte**, para ninguém chegar a um
beco. Os níveis têm marcação semântica coerente (landmarks/headings):
cada nível é uma `<section aria-labelledby>` — o nível 1 é etiquetado
pelo h1 da página (a pergunta é o nome da secção), os níveis 2 e 3 têm
h2 próprio («Explora», «Confirma»).

**Implementação partilhada (S1-06, congelada):** `Pagina` +
`PaginaDetalhe` (o `<details>` fechado por omissão do nível 3) e
`Cartao` — a anatomia Ledger fixa que todo o cartão-instrumento
partilha: cabeçalho (breadcrumb mono · meta · selo de estado), corpo
com UMA ideia, controlos opcionais, rodapé (fonte + «ver →» + «JSON»).
O `Leitura` nasce sobre `Cartao`; o orbe de estado (S1-08) monta-se no
selo sem mudar a API (`estado` + `estadoRotulo` — o estado existe
sempre em texto). Em dev, `Pagina` avisa na consola se o nível 1 tiver
mais de um instrumento ou a frase mais de ~25 palavras — nunca falha
o build.

### A história canónica do euro

Uma só história do salário, contada da mesma maneira em todo o site
(implementação única: `src/lib/canonico.ts` — quem mostra estes números
consome de lá, nunca recalcula):

1. **Começa no custo total para a empresa** — bruto + TSU patronal. É o
   facto revelador: a empresa paga mais do que o salário que o
   trabalhador vê no contrato.
2. **Desce pelos cortes** — TSU da entidade, IRS retido, Seg. Social do
   trabalhador.
3. **O «líquido» é o do recibo** — o valor mensal com a retenção na
   fonte real das tabelas em vigor. O ano canónico é esse recibo × 12.

O caso-base é solteiro(a), sem dependentes, continente, sem subsídio de
alimentação, bruto de referência 1 500 €/mês (`BRUTO_CANONICO`).

**A grelha canónica (S1-09).** O motor fiscal fica no servidor/build.
Para as réguas de salário no cliente, `npm run derive` gera
`data/derived/cenarios-salario.json`: o salário mínimo em vigor e
depois **múltiplos exactos de 50 € até 6 000 €** (103 pontos —
inclui sempre os redondos como 1 500 €). Cada linha traz bruto, custo
empresa, TSU entidade, SS, IRS retido, líquido, tabela de retenção,
a repartição em cêntimos por euro de custo (pontos inteiros, Σ=100) e
a simulação anual a 14 meses — tudo saído do motor, nunca inventado.
A régua (`Regua` com `pontos`) só pára nestes valores: **nunca se
interpola um número que o motor não calculou.** No perfil canónico o
cliente lê a linha da tabela; perfis fora do caso-base (casado,
dependentes, subs. alimentação, IRS Jovem — dimensões não tabeláveis,
como o bruto livre do cônjuge) pedem o motor por `import()` dinâmico —
fora do first-load, e enquanto carrega o recibo mostra o último valor
calculado (DECISOES 2026-09-23).

**Outras leituras não se misturam.** A média a 14 meses (duodécimos) e a
estimativa de IRS anual (liquidação) são representações diferentes —
cada uma vive na sua página, com uma frase a explicar a diferença
(`/salario` tem as duas). Nenhum cartão fora delas as usa como
«líquido».

### A navegação: quatro perguntas + Aprender

Substitui a lista de itens soltos (implementação: sessão S1-07 da V4;
hoje a nav é uma lista plana — o alvo é):

| Pergunta | Páginas |
|---|---|
| **O que ganhas** | Salário · IRS · Trabalho |
| **O que pagas** | Impostos · Preços · Inflação |
| **O banco** | Crédito · Casa · Poupança |
| **O país** | Dados |
| **Aprender** | glossário e micro-demonstrações |

## 5. ~~O catálogo de codificações~~ [arquivada]

Conjunto fechado: cada tipo de dado tem a sua forma, e cada gráfico é
diferente por razão — não por acaso. Componentes marcados *(a construir)*
são fundação partilhada da V4 (sessões S1-04/S1-05) e congelam depois
de construídos.

| Codificação | Quando se usa | Quando NÃO se usa | Componente |
|---|---|---|---|
| **Campo de cêntimos** (pontos) | partes de um todo em dinheiro (1 ponto = 1 cêntimo) | estrutura sem quantidade; séries temporais; totais que não se repartem | `CampoCentimos` + `src/lib/pontos` (S1-04 — congelado) |
| **Linha anotada** | série temporal com UM facto a assinalar (chamada + insight escrito) | partes de um todo; comparações instantâneas sem tempo | `Leitura`, `LineChart`, `Spark` |
| **Haltere** | antes ● — ○ agora, por categoria, sobre grelha pontilhada | mais de dois pontos no tempo; série contínua | `Haltere` (S1-05 — congelado) |
| **Barra de traços** | contagem, limite, duração — «1 traço = x» com a unidade escrita no cartão | dinheiro contínuo; proporções de um todo | `BarraTracos` (S1-05 — congelado) |
| **Recipientes** | escalões e bandas que enchem por ordem | série temporal; parte-todo fora de escalões | `EscaloesEnchem` (`/irs`) |
| **Papel** | documentos oficiais: recibo, talão, escritura, caderneta, nota de liquidação | chrome do instrumento; decoração; qualquer peça que troque de cor com o tema | `PecaPapel`, `Papel` |
| **Isométrico de traço** | **estrutura** — o que compõe algo, em camadas com linha de chamada | **nunca quantidade** — nenhuma prop de valor dimensiona camadas | `Isometrico` (S1-05 — congelado; o molde `EuroExplodido` saiu na S4, sem uso) |
| **Anel de pontos** | ciclos (ex.: os 12 meses), número ao centro | progressão linear; parte-todo | `AnelPontos` (S1-05 — congelado) |
| **Régua** | todo o input numérico (traços de unidade, marcador «agora», presets) | como saída/leitura — é controlo, não visualização | `Regua` |

O **orbe de estado** (`OrbeEstado`, *a construir, S1-08*) é o selo de
frescura tornado objecto: pequeno desenho de pontos cuja **forma** diz o
estado (em dia = calmo e cheio; a recolher = em rotação; atrasado =
esburacado). O estado existe sempre também em texto.

## 6. ~~Sistema visual (V4)~~ [arquivada]

Lido do código (`src/app/globals.css`, `src/app/estilo`) — não de planos.

> **[arquivada] Esta secção descreve o sistema visual da V4.** O que está
> em produção é a §2 (contrato visual «O Bairro») e a §6b. Duas coisas da
> §6 continuam a valer porque têm implementação viva: a **letra** (§6
> «Lettering», com o `_lettering` a correr no CI) e o **campo de cêntimos**
> (o `CampoCentimos` como herói das rotas de dinheiro). O resto — elevação
> em quatro níveis, tokens `--accent`/`--keep`/`--mark`, a escala
> `--text-*`, o `Leitura`/`Cartao`/`OrbeEstado` da V4, o inventário de
> motion — é registo.

### Elevação — quatro níveis, um instrumento

| Token | Nível | Uso |
|---|---|---|
| `floor` | 0 | fundo da página — o único nível com textura |
| `panel` | 1 | bloco de conteúdo — a chapa onde as coisas se montam |
| `raised` | 2 | resultado — o que o instrumento devolve (`shadow-raised`) |
| `overlay` | 3 | menu, tooltip — acima de tudo (`shadow-overlay`) |

No claro a elevação é sombra subtil (a superfície recua). No escuro é
luz: luminância crescente na rampa + um fio de 1 px na aresta superior —
sombra não se vê no escuro. `--recess` marca cavidades (`.field`).

Regras: textura só no `floor`; `panel`/`raised`/`overlay` nunca têm
textura; `overlay` não leva texto `muted` — só `ink`/`ink2`; o grão é
global (o vidro do instrumento); `.blueprint` (pontos) não é um nível —
é textura de zona de medição, atrás de diagramas.

### Cor — semântica, não decoração

| Token | Papel |
|---|---|
| `accent` / `accent-ink` | vermelhão-sinal — **só** o dinheiro que sai |
| `keep` | verde — **só** o que fica contigo (líquido, positivo) |
| `mark` | ocre/torrado — marcador funcional: fonte, citação, anel de foco |
| `up` / `down` | variação — sempre com ▲/▼, nunca só cor; `Delta` tem estado neutro |
| `warn` | aviso |
| `ink` / `ink2` / `muted` | tinta — `muted` passa AA nos dois temas |
| `line` / `line2` | hairline / regra, borda de campo |

Regra V4: **bruto e custo total são neutros** — nem `accent` nem `keep`.
Nunca três cores semânticas no mesmo cartão (regra V3-2). Nos montes de
pontos: sai = `accent`, fica = `keep`, neutro = cinzento.

Regra 4B-01 (decisão do dono, 24.09.2026): **o vermelhão só existe no
dinheiro que sai** — nada de `accent` no chrome. Nav (activo, hover),
hovers de links, `::selection`, banda e polegar da `Regua`, selo
«próximo» e barras de referência são `mark`/`ink`. O ocre falha AA em
texto pequeno (3,5:1): aí a regra é **tinta + sublinhado `mark`**.
No `Leitura` a linha principal é `--l-ink`; só veste `--l-accent`
quando a série É dinheiro que sai (`sai` → `.leitura-sai`).

### Marca — o logótipo em contornos (decisão do dono, 22.09.2026)

O logótipo são os **contornos reais da Archivo** (instância wdth 125 ·
wght 800, a fonte que o site já serve): `<Logo>` e `<LogoMark>` em
`src/components/Logo.tsx` são SVG de dois e três `<path>` — vetor puro,
sem fonte, sem `clipPath`, certo antes do CSS de texto e sem JavaScript.
O C de CÊNTIMO é o sinal de cêntimo cortado por uma **haste contínua**
(opção A aprovada; a interrompida e a variante moeda ficaram de fora).

Regras de uso:

- **Cor.** A tinta é `currentColor` (≡ `--ink` no contexto); a haste é
  **sempre `--keep`** — nunca `--accent`, nunca a cor da tinta. O símbolo
  é fixo nos dois temas: azulejo `#1B1811`, C `#F2ECDD`, haste `#63D6A4`
  a sangrar de ponta a ponta, raio 22 %.
- **Medida.** A altura CSS é a do SVG (do topo ao fim da haste); a
  capitular é **63,95 %** dela. Cabeçalho: 20,6 px de capitular no
  telemóvel, 24,8 px no computador.
- **Mestres.** `normal` ≥ 20 px de capitular (a fenda do C tem 1 px
  exato); `pequeno` entre 12 e 20 px (sem fenda, haste mais grossa,
  espaçamento aberto); abaixo de 12 px ou em espaço quadrado, **símbolo**.
- **Área de proteção.** Espaço livre à volta da palavra igual à altura
  das capitulares (x): nada entra aí — nem texto, nem arestas de painel.
- **Proibições.** Haste noutra cor; haste sem recorte (barra pousada por
  cima do C); esticar ou redesenhar as letras — os paths vêm da fonte e
  não se editam à mão (regeneram-se do gerador, mínimo 2 casas decimais).

Ícones: `icon.svg` = grelha de 32; `icon1.png`/`icon2.png` = 16/32 px
rasterizados dos desenhos próprios de cada grelha; `apple-icon.png` e
`favicon.ico` (16+32) saem do azulejo e das grelhas de favicon. A imagem
OG usa a palavra em contornos — nunca texto com a fonte.

### O ¢ como símbolo da casa — onde pode e não pode aparecer

O ¢ desenhado (o C com haste) é **marca**, não ícone nem carácter de
texto. Regra fixa (1B-01):

- **PODE** aparecer como `LogoMark`/azulejo onde a casa assina:
  favicons e `icon.svg`, `apple-icon`, manifest, imagem OG e cartões de
  partilha, o cabeçalho/rodapé onde já vive o logótipo, a página
  `/estilo` e o `/sobre` (contextos de marca).
- **PODE** aparecer como **marcador do selo «1 ponto = 1 cêntimo»** —
  o azulejo pequeno ao lado da legenda dos campos de pontos
  (`CampoCentimos` e famílias de pontos), porque ali a unidade *é* o
  cêntimo. É a única posição funcional permitida fora da marca.
- **NUNCA** como ícone de menu/acção — esses são os traços do conjunto
  fechado (`Icone`), e o ¢ não entra nele.
- **NUNCA** junto de um número nem como unidade — escreve-se
  «cêntimos» ou «c» («63,2 c»), nunca «63,2 ¢».
- **NUNCA** como marcador de lista, ornamento de fundo, marca de água,
  nem recolorido — a haste é sempre `--keep` (ver §6 «Marca») e o
  azulejo tem a sua paleta fixa.

### Ícones — conjunto fechado de traço próprio (1B-01)

Um sistema de símbolos, não uma biblioteca: **25 desenhos à mão** na
grelha **20×20**, traço **1,5 px**, terminações e juntas redondas, sem
preenchimentos, em `currentColor`. Iconografia stock é proibida e o
conjunto é fechado — `<Icone nome>` falha num nome fora da lista.

| Família | Nomes |
|---|---|
| páginas (um por pergunta) | `salario` `irs` `trabalho` `impostos` `precos` `inflacao` `credito` `casa` `poupanca` `dados` `aprender` |
| acções | `ver` `json` `copiar-ligacao` `repor` `abrir` (chevron, roda 180° no estado aberto) `menu` `pesquisa` `sol` `lua` |
| estado (a família do `OrbeEstado`, em pontos de traço) | `em-dia` `a-recolher` `atrasado` `aviso` `informacao` |

Regras:

- **Acessibilidade.** `aria-hidden` por omissão — o significado mora no
  texto ao lado. Ícones de acção vivem **sempre** dentro de
  `<button>`/`<a>` com nome acessível próprio (`aria-label` ou texto
  visível); a prop `rotulo` existe só para o caso raro de um ícone
  sozinho com significado próprio (`role="img"`).
- **Movimento (tipo 2).** Ao passar/focar o controlo que o envolve, o
  traço desenha-se **uma vez** (`stroke-dashoffset` sobre
  `pathLength=1`, `--dur-micro`, passo de ~22 ms por traço) — CSS puro,
  sem JS; em `prefers-reduced-motion` nasce já desenhado.
- **`<IconeEmblema>`** é o ícone dentro do **quadrado de contorno
  tracejado** da referência (raio pormenor), para o cabeçalho dos
  cartões `Cartao` — monta-se com a prop `icone` e desenha-se com a
  inversão para papel no foco/à passagem.
- Um nome novo entra só por tarefa de fundação — nunca ad hoc numa
  página; a folha completa com as regras vive em `/estilo` §Ícones.

### Raio com significado (V4 — substitui o «radius 0 em todo o lado»)

| Token | Valor | Significado |
|---|---|---|
| `--raio-papel` | 0 | papel — é cortado, não arredondado (talões, recibos, `.field`) |
| `--raio-pormenor` | 2 px (= instrumento ÷ 7) | aresta mínima de peça maquinada — carimbo, trilho, gauge |
| `--raio-instrumento` | 14 px | o objecto completo — cartão Leitura, resultado, overlay |
| `--raio-controlo` | 999 px (pílula) | o que se carrega — `.botao`, `.chip`, `.interruptor`, `.segmentado`, marcadores |

O raio diz a matéria da peça. Geometria de desenho (`rx`/`ry` de svg,
círculos) não é raio de objecto — fica fora da escala por natureza. Os
utilitários Tailwind `rounded-papel/pormenor/instrumento/controlo`
apontam para estes tokens; nenhum `border-radius` literal existe fora
deles.

### Tipografia — escala fechada (S1-03)

Sete papéis e nada mais: **kicker, rótulo, corpo, insight, número de
leitura, número herói, título**. Cada degrau é um token `--text-*` em
`@theme` (gera o utilitário `text-*`); a escala por omissão do Tailwind
está fechada (`--text-*: initial`). Nada escreve um `font-size` fora
destes tokens — os únicos `font-size` relativos que restam são razões
`em` dentro do mesmo registo (`.num-unit`, `.num-sign`, `.regua-un`).

| Papel | Token(s) | Registo |
|---|---|---|
| kicker | `--text-micro` (9.6) · `--text-mini` (10) · `--text-kicker-sm` (10.4) · `--text-kicker` (11) | mono, caixa-alta, muted por defeito |
| rótulo | `--text-rotulo` (12) · `--text-nota` (13) | rótulos/readouts; `.footnote` |
| corpo | `--text-corpo-sm` (14) · `--text-corpo` (15.2) | Space Grotesk — `.body-copy`, `.field`, tabelas |
| insight | `--text-grande` (18) · `--text-insight` (19) | Source Serif — `.lede`, `.leitura-insight` |
| número de leitura | `--text-numero` (22) | `.num-read`, Space Mono tabular |
| número herói | `--text-valor` · `--text-valor-amplo` · `--text-hero-sm` · `--text-hero` (clamps fluidos) | `.leitura-valor`, `.num-hero` — Archivo `tnum` |
| título | ver abaixo — só dois estilos | Archivo `wdth` |

Escada partilhada de display — `text-display-xs → 3xl` (20 · 24 · 30 ·
36 · 48 · 60 · 72 px): h2 de secção/capítulo, stats e números grandes
usam-na com `.font-display` ou `.num`; não é um terceiro estilo de
título, são degraus.

**Títulos — só dois.** O eixo `wdth` do Archivo é o instrumento
expressivo que os separa:

| Estilo | Archivo | Uso |
|---|---|---|
| `.titulo-pagina` | expandido, `wdth` 125, caixa-alta | um por página — a manchete institucional |
| `.titulo-hero` | condensado, `wdth` 75 | só o herói da home — o monumento |

Sub-escalas fora do cromado mas dentro do sistema: `--text-svg-*`
(texto dentro de viewBox — unidades do desenho, escalam com o svg) e
`--text-talao-*` (o talão é um documento de impressora térmica —
typesetting próprio). Impressão usa `--text-impressao` (pt de papel,
não rem). O cartão de partilha (`og:image`) deixou de ser raster gerado
em runtime: é `public/og-bairro.png`, 1200×630, tirado do mapa da home
em «Dia» com os marcadores à vista (`scripts/_og-bairro.mjs`). A escala
tipográfica do cartão deixou de ser código — passa a ser o desenho.

### Lettering — número, sinal e unidade (1B-02)

Três contratos, uma peça:

- **A ponte é o FINO** — U+202F (NBSP estreita) entre número e
  unidade-símbolo (`€`, `%`, `c`, `p.p.`, `€/L`, `€/kWh`, `/mês`) e no
  agrupamento de milhares: «1 856 €», «3,6 %», «63,2 c». Nunca espaço
  normal nem NBSP largo — o `Intl` é normalizado em `src/lib/format.ts`
  (`FINO`, `MENOS`, `comUnidade(numero, unidade)` — unidade vazia
  devolve o número só). O FINO não entra em dados de máquina: paths e
  `viewBox` de SVG, fontes de canvas e fórmulas guardam espaços
  normais.
- **O menos é verdadeiro** — U+2212 em valores negativos e deltas
  («−1 856,00 €», «−5,2 %»), nunca hífen ASCII. `−`/`+` são membros
  semânticos da linha (`.num-sign`), herdam a cor — nunca decoração.
- **A composição é o `<Valor>`** — `src/components/Valor.tsx`: sinal +
  número (string ou apresentador `TweenNum`/`Odometer`) + unidade em
  `.num-unit` (~45 % do tamanho, mesma linha de base, tinta atenuada —
  elemento próprio, não nota de rodapé). `NumHero`, `Leitura`, o hero
  de `/salario` e as demos da `/estilo` compõem por ele;
  ninguém concatena `" €"`/`" %"` à mão. No sr-only, o `texto` do
  apresentador leva o número e a unidade visível completa o anúncio.

Lettering PT-PT: aspas «…» (não `"…"` nem `&ldquo;`), reticências «…»
(U+2026, não `...`), `hyphens: auto` só no corpo (`text-wrap: pretty`),
nunca em títulos (`text-wrap: balance`). O tracking é por papel —
tokens `--tracking-*` em `@theme`, sem literais em CSS. O `wdth` do
Archivo é a expressão dos títulos (125/75, estática): peso cinético no
herói interactivo foi rejeitado — animar `wght`/`wdth` por input
quebraria a estabilidade dos `tabular-nums`. Auditoria:
`scripts/_lettering.mjs` corre no `npm run audit` sobre o `out/`
exportado — falha em hífen numérico, espaço largo junto a unidade,
aspas erradas e `...` (atributos, `<code>` e geometria SVG de fora).

### Botões e controlos — um sistema, todos os estados (1B-03)

Não há «um botão primário» e avulsos à volta — há **um** sistema com a
mesma física: pílula de `--raio-controlo`, alvo ≥44 px, pressão
`scale(.97)` em `--dur-micro` com `--ease-entra`, foco pelo anel
torrado global (3 px `--mark` + offset). Seis peças, uma gramática:

- **`Botao`** — a acção: `primario` (pílula de tinta cheia), `secundario`
  (contorno), `terciario` (texto), `icone` (quadrado ≥44×44 do conjunto
  fechado, `ariaLabel` obrigatório). Com `href` é uma ligação com a cara
  do sistema — a semântica fica certa (CTA navega, acção é `<button>`).
- **`Interruptor`** — o toggle: `<button role="switch">`, nó que desliza
  num trilho; o estado lê-se na posição do nó + trilho cheio + nota —
  nunca só cor.
- **`Chip`** — a escolha rápida/preset: `aria-pressed` + pílula cheia +
  quadrado-marca (três canais). É a peça dos presets da `Regua`.
- **`Segmentado`** — uma pílula dividida, um seleccionado:
  `radiogroup` de rádios-botão com tabindex itinerante — setas movem
  foco e selecção, Home/End aos extremos, opções desactivadas salta-se.
  É o controlo das janelas temporais («1A · 5A · Máx»).
- **`BotaoCopiar`** — copiar ligação/JSON: nota «Copiado»/«Não copiado»
  junto ao botão num `role="status"` permanente; caminhos relativos vão
  para a clipboard como URL absoluta; falhar diz falhado, nunca finge.
- **`Regua`** — o input numérico físico: range nativo transparente
  sobre o desenho (teclado/AT nativos, um só slider), presets em
  `Chip`, e **ressalto de encaixe** — o corpo do polegar dá um pulso
  contido (`--dur-micro` + `--ease-rasgo`) a cada snap da grelha no
  arrasto e ao aterrar no fim da transição.

Regras duras dos estados:

- **Desactivado nunca é morto.** `aria-disabled` (o controlo fica
  focável — `disabled` esconderia a razão) + `razao` obrigatória que
  viaja em `title` e **dentro do nome acessível** (texto escondido no
  rótulo/nota visível; `aria-description` não é suportado nestes
  roles). Desactivado sem razão é aviso em dev em todas as peças.
- **A carregar diz-se.** `aCarregar` troca o ícone pelo mini-orbe
  `OrbeEstado` (a família dos selos — não se inventa spinner) e o
  rótulo diz o que se passa («A calcular…»); `aria-busy` +
  `aria-disabled` cortam a repetição do gesto.
- **A dica é por âncora.** Onde já existia tooltip (as células do
  quadro de frescura) a `.dica` resolve-se por CSS anchor positioning
  (`anchor-name` por célula via `--qa`, `position-try-fallbacks:
  flip-block` vira-a à borda). A dica é **irmã** da âncora dentro de
  `.dica-alvo` — um posicionado não se ancora a um elemento da sua
  cadeia de containing block. Sem suporte cai no absoluto clássico.
- Os estilos vivem em `globals.css` (`.botao-*`, `.chip`,
  `.interruptor`, `.segmentado`, `.copiado-nota`, `.dica`,
  `.regua-encaixa`); o sistema `.btn`/`.regua-pill` antigo saiu.
  Reduced-motion corta pressão, deslize e ressalto — o estado final já
  está no lugar.

### Estados partilhados — cada estado tem desenho e texto (1B-05)

A regra nº 1 tem cara: **fonte falha → a falha mostra-se, nunca um
número inventado** — e nunca um buraco na grelha nem um «—» sem
explicação. Quatro peças partilhadas, cada uma com desenho + texto:

- **`EstadoVazio`** — VAZIO / FONTE INDISPONÍVEL. A mecânica
  isométrica de traço fino da referência «Nothing on the schedule
  yet» na gramática do `Isometrico`: as placas que chegaram sólidas e
  a peça em falta só a tracejado, com a sua linha de chamada — o
  contorno do que devia lá estar (ilustração fixa, decorativa; não é
  o `Isometrico` porque este mede camadas por estrutura). Selo =
  orbe `atrasada` + «fonte indisponível». A frase é honesta e
  completa: `titulo` (o que falhou) + `falha` (o que aconteceu) +
  `desde` (último dado conhecido, já formatado) + `fonte` (nome + url
  oficial, abre em separador novo). `compacto` para dentro de
  figuras. Regra dura: **o slot nunca desaparece** — nas grelhas de
  `Leitura` (home, /precos, /inflacao, /dados) e nos instrumentos de
  página (/trabalho, /casa, /credito) a fonte em falta renderiza o
  `EstadoVazio` no lugar, com `role="status"`. O `EmptyState` dos
  gráficos delega nele.
- **`ACarregar`** — a espera real: o mini-orbe `a-recolher` do
  `OrbeEstado` (não se inventa spinner) + o rótulo do que se passa,
  num `role="status"`. Num site estático quase nada carrega — usa-se
  só onde há espera real; o `aCarregar` do `Botao` consome-o.
- **`ZeroInformativo`** — o zero como informação: quando uma parte
  vale zero de verdade diz-se e vê-se — «0 € — não te toca». Desenho:
  o **ponto oco** (o cêntimo que não existe — a mesma leitura do
  campo: uma parte a 0 não tem pontos) + valor já formatado + nota
  (`"não te toca"` por omissão, `null` omite). Ligado no IRS ao
  salário mínimo: talão (carimbo neutro «Não retido» — não há corte),
  ano a 14 meses e `CampoCentimos` (uma parte a 0 não tem pontos — a
  mesma leitura do ponto oco).
- **O limite da `Regua`** — o erro de interacção que não é erro:
  quando a tentativa é para lá do fim (seta no extremo, PageUp que
  transborda, preset/pedido fora da gama, dedo para lá da pista) o
  valor nunca sai — e a nota aparece **no lugar do rótulo do
  extremo**, junto ao polegar que aí está encostado: «limite — 920 €
  · {razão}». Tinta discreta, **nunca vermelho** — não é erro, é a
  régua a fazer o dela. O mesmo texto anuncia-se num live region
  sr-only (`role="status"`, nonce rearma a cada insistência de
  teclado); a razão por lado chega por `limites={{min,max}}`. Sai na
  próxima paragem interior.

### Painel — composição de dashboards (1B-06)

O `Painel` é a grelha onde vivem os conjuntos de leituras — o «Hoje
em Portugal» da home e «O país, em leituras» de /dados. As regras são
de composição, não de cartão:

- **Três tamanhos, seis colunas.** S ocupa ⅓ (2 col), M ocupa ⅔
  (4 col), L a linha inteira. As linhas só existem em padrões que
  fecham exactamente — `{L}`, `{M+S}`, `{S+M}`, `{S+S+S}` — e o
  packing (`comporPainel`, DP sobre os tamanhos permitidos por
  cartão) escolhe a atribuição com menos desvios ao tamanho
  preferido. **Nenhum cartão fica órfão**: a grelha nunca devolve uma
  composição com a última linha por fechar — se nenhuma atribuição
  permitida fecha, devolve `null` e em dev o painel avisa. Abaixo de
  lg todos os cartões são linha inteira. Verificado em e2e com
  `getBoundingClientRect` a 1440/1024/768/375.
- **Vizinhança de codificações.** Cada cartão declara a sua
  `codificacao` — `linha · pontos · tracos · anel · isometrico` (o
  `EstadoVazio` conta como isométrico, que é a sua ilustração) — e
  **dois cartões seguidos nunca repetem** a mesma. A linha cansa; a
  alternância ensina. `validarVizinhanca` reprova no teste unitário
  sobre a configuração real e avisa em dev.
- **Comparação por omissão.** Todos os cartões com série comparam à
  **mediana de 10 anos**, dita em texto no insight do nível 1 —
  cartões com referência declarada diferente (UE27 no desemprego, o
  nível de 2015 na casa-vs-trabalho) mantêm a sua.
- **Janela temporal partilhada.** UM `Segmentado` por painel («1A ·
  5A · Máx») fatia todas as séries que a suportam (`janela: true`);
  «Máx» é a janela completa servida (~10 anos). A referência da
  mediana fica sempre; o que muda é o recorte desenhado — e as
  anotações são calculadas no servidor por janela, sobre a série já
  fatiada.
- **Frescura sempre à vista.** Todos os cartões nascem sobre o
  `Cartao` (ou o `EstadoVazio`): orbe + «leitura {período}» + fonte +
  acções — a mesma casca Ledger do `Leitura`, montada à mão para as
  outras codificações.
- **Sem dados inventados.** A configuração vem de builders servidor
  (`src/lib/paineis.ts`: `cartoesHome()`, `cartoesDados()`) que leem
  `data/`, derivados e motores — e quando a fonte falta o slot
  renderiza `EstadoVazio` com a fonte e o último dado conhecido.

O componente (`src/components/Painel.tsx`) é client e recebe só specs
serializáveis por props; a lógica pura (`src/lib/painel.ts`) é
determinista — SSR e hidratação compõem o mesmo. `--ei` vai na célula
e alimenta o escalonamento de entrada já existente dos corpos.

### Motion — gramática (M-02)

O site tem movimento porque o movimento **explica transformações** —
não porque fica bonito. Três tipos, e só dois existem:

1. **QUE EXPLICA** — a transformação dos dados acontece à vista: a fita
   rasga, a barra parte-se, a série desenha-se, os pontos voam para o seu
   monte, o número desliza do valor anterior para o novo.
2. **QUE RESPONDE** — hover, foco, o gráfico a reagir ao cursor.
3. **QUE DECORA** — lista negra. Não existe.

**Quatro durações. Só estas** — uma duração é um significado:

| Token | Valor | Significado |
|---|---|---|
| `--dur-micro` | 120ms | resposta ao toque (tipo 2) |
| `--dur-curta` | 320ms | mudança de estado — tema, painel, barra que reparte |
| `--dur-media` | 600ms | transformação explicada (tipo 1) |
| `--dur-longa` | 1200ms | sequência orquestrada — irmãos escalonados |

**Três curvas + linear:**

| Token | Uso |
|---|---|
| `--ease-entra` | o que chega — default |
| `--ease-sai` | o que parte |
| `--ease-rasgo` | o acto físico — elástica contida; só o rasgo |
| `--ease-lin` | só movimento contínuo (ticker); proibida em transições |

**Um escalonamento:** `--stagger` (90ms) entre irmãos — sempre o mesmo,
em cascatas, barras, sparks e odómetro.

**Orquestra de estado (M-09)** — quando um input muda, o que muda no
ecrã transita como uma coisa só: o número (`TweenNum`), a barra e a
cascata partilham o mesmo tempo — `--dur-curta` (320ms). O que é
revelação ou explicação (`--dur-media`, `--dur-longa`) não entra na
resposta ao input.

**Regra da dobra (precisa):** nada ENTRA com animação acima da dobra ao
carregar; o valor final está no HTML do servidor. Animação ambiente só
no herói da home: pausa fora do ecrã e com o separador escondido, e
desliga-se em `prefers-reduced-motion`. Abaixo da dobra, a entrada é
armada por JS (`useArmado`/`Spark`/`LineChart` seguem esta
regra). Nenhum estado de carregamento decorativo — não existem spinners
nem esqueletos; o SSR traz sempre o valor final.

**`prefers-reduced-motion` = estado final imediato**, nunca animação
atenuada — corta todas as transições e animações (`!important`,
universal — uma animação nova nasce coberta). O tipo 2 mantém-se:
hover/focus não são motion. O contrato tem teste e2e que percorre todas
as rotas e falha se algum elemento animar.

O número nunca espera pela animação — o valor final está no DOM desde o
primeiro paint, e nunca fica ilegível durante a transição.

**Verificação:** nenhuma animação se aprova por screenshot — cada peça
animada grava vídeo com `scripts/_video.mjs` e revêem-se os fotogramas
antes do commit (regra V3, permanente).

### Coreografia — inventário, assinatura e ritmo (1B-04)

**A transição-assinatura — «a pergunta voa».** O cartão «a pergunta
seguinte» do `<Pagina>` morfa no `h1` da página de destino: o texto
sai do cartão e assenta como título — a pergunta é literalmente a
mesma peça a atravessar a navegação. Implementado em
`src/components/Voo.tsx` (`LinkVoo` + `TituloPagina` + `VooLimpeza`):

- O clique simples no `LinkVoo` sela a rota alvo num marcador de
  módulo e dá `view-transition-name: pg-voo` ao próprio link —
  capturado no fotograma **velho**. Cliques modificados (novo
  separador, ctrl…) não selam.
- O `TituloPagina` (o `h1` de todas as páginas de conteúdo) lê o
  marcador na montagem — dentro da transição do layout: se a rota
  bate, o `h1` leva o mesmo nome — capturado no fotograma **novo**.
  O browser emparelha velho↔novo e morfa.
- O `VooLimpeza` (layout) apaga o marcador depois do commit — as
  navegações seguintes ficam limpas; uma salvaguarda de 4 s cobre
  navegações falhadas.
- **Nome único por fotograma** — por isso os nomes são inline e não
  regras CSS: a página velha só tem um `pg-voo` (o link) e a nova só
  tem um (o `h1`). `--dur-media` + `--ease-entra`: é uma
  transformação explicada, não um toque.
- **Fallback:** sem View Transitions a navegação é normal; em
  reduced-motion o corte global anula as animações dos pseudo-
  elementos — o conteúdo chega na mesma.
- Decisão registada: `<Link transitionTypes>` + `share` por tipo foi
  a primeira via — nesta versão (Next 16.3.5 / React 19.3) o tipo só
  se regista se já houver lanes de transition pendentes no root; com
  a página idle é descartado e o morph fica dependente de prefetch
  em voo. O marcador é determinístico — existe exactamente entre o
  clique e o commit. Coberto por `e2e/coreografia.spec.ts` (positivo
  e negativo: a nav para a mesma rota não dispara o voo).

**A entrada de grupo — um escalonamento, primitivas e não blocos.**
Abaixo da dobra, os grupos de cartões entram em sequência com a
convenção `--ei × --stagger`: cada cartão/filho recebe `--ei` (o seu
índice na grelha) e os seus atrasos derivam-se de
`calc(var(--ei) * var(--stagger))`. O que entra é a **primitiva
visual**, nunca um fade do bloco inteiro — a linha desenha-se, a
barra cresce, os pontos assentam, o número conta, a etiqueta entra
por último quando serve. Aplicado em `Cartao` (prop `entrada`),
`Leitura` (prop `entrada` → `--ei`), nas grelhas da home, `/precos`,
`/dados` e `/inflacao`, nas células-instrumento de `/dados` e nos
delays de `EuroBar`. Acima da dobra continua a regra M-02:
o valor final está no HTML, nada entra animado ao carregar.

**A pausa ambiente — nenhum fotograma fora da vista.** Animação
contínua só corre onde se vê e com o separador activo:

- `PausaAmbiente` (wrapper no `Ticker`): IntersectionObserver +
  `visibilitychange` → `.amb-off` congela `animation-play-state` de
  tudo o que vive dentro;
- `OrbeEstado`: o mesmo par de gatilhos → `.orbe-pausado`;
- `CampoCentimos` (canvas): o `CampoTela` corta o rAF fora do ecrã e
  com `document.hidden` — o motor pede frame a frame, sem frames não
  há desenho.
- Em `prefers-reduced-motion` nada disto corre — o estado final é
  imediato.

**Inventário** — cada peça animada, o que faz, quando corre:

| Peça · contexto | Acção | Gatilho | Tempo · curva | Pausa / RM | Dobra |
|---|---|---|---|---|---|
| Cross-fade de página (root) — todas | transição de vista | navegação SPA | `--dur-curta` · `entra` | RM corta | — |
| Indicador da nav (`nav-ind`) — header | morph partilhado | mudança de item activo | `--dur-curta` · `entra` | RM corta | acima |
| `Ticker` — faixa de dados, todas | marquee contínuo | ambiente | loop · `lin` | `amb-off` (IO+hidden), hover/focus; RM corta | acima |
| Voo da pergunta (`pg-voo`) — `Pagina`→`h1` | morph assinatura | clique no `LinkVoo` | `--dur-media` · `entra`/`sai` | RM corta | abaixo→acima |
| `nav-sheet` — nav mobile | sobe ao abrir | abrir folha | `--dur-curta` · `entra` | RM corta | acima |
| `CampoCentimos` — herói da home | moeda oscila em repouso; revelação palpite→montes | ambiente + interacção | rAF · coreografia `COREO` | rAF corta (IO+hidden); RM 1 frame; `data-pronto`/`data-assentou` públicos | **acima** — a única ambiente acima da dobra |
| `EscolhePergunta` — portas da home | inversão para papel + prévia viva | hover/focus | CSS puro | RM instantâneo | abaixo |
| `Leitura` ×N — painel «Hoje em Portugal» | spark+odómetro por cartão, em sequência | armada | `--ei×--stagger` | RM estado final | abaixo |
| `NumHero` — `/salario` `/irs` `/impostos` `/poupanca` `/credito` `/casa` `/trabalho` | número interpola | input/estado | `--dur-curta` | RM valor final | acima |
| `CampoCentimos` — `/salario` `/trabalho` `/impostos` `/poupanca` | pontos nascem em montes | armada + input | `--dur-media` | rAF pausa fora do ecrã; RM estado final | abaixo |
| `TweenNum` — `/salario` `/credito` | leituras interpolam | estado | `--dur-curta` | RM valor final | ambas |
| Talão `/salario`, `TalaoCompras` `/impostos`, `CadernetaAforro` `/poupanca` | papel assenta/entra | armada | `--dur-media` | RM estado final | abaixo |
| `LitroFuel` — `/impostos` | isométrico do litro + pontos | armada + input | `--dur-media` | RM estado final | abaixo |
| `SimuladorIrsJovem` `/irs`, `ComparadorPoupanca` `/poupanca`, `BarraTracos` `/trabalho` `/irs` | instrumentos de estado | armada + input | `--dur-curta` | RM estado final | abaixo |
| `JuroCapital` — `/credito` `/casa` | juro↔capital cresce | armada + input | `--dur-media` | RM estado final | abaixo |
| `LineChart` — `/credito` `/dados` | série desenha-se | armada (IO) | `--dur-media` | RM estado final | abaixo |
| `EuroBar` — `/casa` `/precos` `/estilo` | segmentos crescem | armada | `--ei×--stagger` | RM estado final | abaixo |
| `Leitura` ×N — home `/precos` `/dados` `/inflacao` `/casa` `/credito` `/poupanca` `/trabalho` | spark+odómetro por cartão, em sequência | armada | `--ei×--stagger` | RM estado final | abaixo |
| Células-instrumento — `/dados` | valores/mini-gráficos | armada | `--ei×--stagger` | RM estado final | abaixo |
| `Delta` — `/dados` `/inflacao` `/estilo` | ▲/▼ + cor | estado | `--dur-micro` | — | ambas |
| `OrbeEstado` — selo de estado | anel roda (a-recolher) | ambiente | loop · `lin` | `orbe-pausado` (IO+hidden); RM parado | ambas |
| `CampoCentimos` — `/estilo` (canvas) | moeda oscila; revelação moeda→pontos→montes | ambiente + interacção | rAF · coreografia `COREO` | rAF corta (IO+hidden); RM 1 frame | abaixo |
| `AnelPontos` `BarraTracos` `Haltere` `Isometrico` — `/estilo` | demos de gramática | armada | `--dur-media` | RM estado final | abaixo |
| `MicroDemo` — `/aprender` `…/[slug]` | mini-instrumento do termo | interacção | `--dur-curta` | RM estado final | abaixo |
| `MotionDemo` — `/estilo` | showcase de curvas | interacção | todos | RM estado final | abaixo |
| `Icone` — acções/estado | traço desenha-se | foco/passo | `--dur-micro` | RM corta | ambas |
| `useValorAnimado`→`Odometer`/`TweenNum` — transversal | dígitos rodam / número desliza | mudança de valor | `--dur-curta` | RM valor final | ambas |

O motor lazy de motion (GSAP via `carregarGsap()`) continua
intocável — a coreografia vive em CSS, rAF próprio e React; nenhuma
peça nova pede o chunk.

### Matéria — papel determinista (M-01)

As peças de papel nascem de `src/lib/materia.ts`: rasgo determinista
(irregular, nunca serrilhado), perfurações a sério (buracos que mostram
o fundo), sombra própria por peça. `PecaPapel` e `Papel` são as
primitivas.

### Motor de valores (M-03)

`useValorAnimado` é o único motor: interpola do valor anterior, nunca de
zero. `TweenNum` (texto) e `Odometer` (dígitos que rodam) são os dois
apresentadores; o contrato é SSR com valor final + `aria-live` num
só readout.

### Rampas sequenciais (M-04)

Séries ordinais usam `--seq-1…4` (azul-aço). Em SVG inline referem-se
sempre como `var(--seq-N)` directo — os aliases `--color-*` de
`@theme inline` só existem quando há utilidade Tailwind correspondente.
A rampa candidata `seqb` (âmbar escurecido) está desenhada em `/estilo`
à espera da decisão do dono (ver DECISOES.md — pergunta em aberto).

## 6b. A V5 — «O Bairro» (em produção)

> **Decisão do dono (2026-09-30):** o protótipo V5 «O Bairro» passa a
> produção. Plano de execução em `docs/PACK-V5-PRODUCAO.md`; registo de
> trabalho em `docs/NOTAS-V5.md`. **Estado: P0, P1, P2a–c, P3a–c e P4
> (dados das cenas) estão CONCLUÍDOS e em `main`** — a §6b é contrato
> vivo, não plano. O que sobra é a revisão de copy do dono
> (`docs/REVISAO-COPY-V5.md`) e o lançamento.

A V5 não troca o que o site ensina: troca **por onde se entra**. Em vez de
uma página de perguntas, a home é o bairro do Porto visto de cima, e cada
edifício é uma das perguntas de sempre. O conteúdo, os simuladores e as
regras de dado não mudam — muda a sala.

O protótipo em `design/prototipos/` é o contrato visual. Onde este produto
e o protótipo divergirem, ganha o protótipo; as regras da casa (Regra nº1,
acessibilidade, PT-PT) ganham sempre.

### 6b.1 Onde mora cada tema

Cada edifício tem um `data-id` que o liga à cena e ao e2e, e uma porta que
a câmara foca ao abrir.

| Edifício | `data-id` | Cena | Aprofunda em |
|---|---|---|---|
| Fábrica | `fabrica` | o salário da Inês, moedas pelas ruas | `/salario` |
| Segurança Social | `segsocial` | o recibo, a TSU, o Pedro a recibos verdes | `/salario` |
| Finanças | `financas` | o IRS em gavetas | `/irs` |
| Banco | `banco` | a prestação e a Euribor | `/credito` |
| Mercearia | `mercearia` | os essenciais e o IVA no talão | `/inflacao` |
| Correios | `correios` | a poupança e o poder de compra | `/poupanca` |
| Bomba | `bomba` | o litro por dentro | `/precos` |
| Casa da Inês | `casa` | meses de trabalho por uma casa | `/casa` |
| Pastelaria | `pastelaria` | comer fora e o IVA do café | `/inflacao` |
| Quiosque | `quiosque` | o país hoje | `/trabalho`, `/dados` |
| Escola | `escola` | ler gráficos e o glossário | `/aprender` |

As cenas abrem **por âncora** (`/#financas`), nunca por rota nova. Cada
página de conteúdo ganhou no topo a ligação de volta ao seu edifício
(«← Voltar ao bairro: Fábrica»), com os títulos dos edifícios em
`messages/pt.json` (`bairro.edificios.<chave>.titulo`). `/metodologia`,
`/sobre` e `/estilo` não têm edifício e ficam sem ligação — decisão do
dono.

### 6b.1b As sete personagens — perfis económicos

As cartas (`src/app/_bairro/Cartas.tsx`, dados em
`messages/pt.json:bairro.elenco.cartas.*`) não são mascotes: cada uma é um
regime de 수집 de dinheiro diferente, e é isso que a carta ensina.

| Personagem | Papel | Perfil económico | O que a carta ensina |
|---|---|---|---|
| Inês | Operária da fábrica | Conta de outrem · setor privado | Porque é que 1 500 € brutos viram 1 166,83 € |
| Diana | Professora | Função pública | Descontos diferentes para o mesmo salário |
| Pedro | Freelancer | Independente · recibos verdes | Segurança Social trimestral e IRS da categoria B |
| Sr. Manuel | Dono da mercearia | Pequeno empresário | O IVA que cobra, a TSU que paga, o lucro |
| Dona Arminda | Reformada | Pensão e poupança | Quanto rende a poupança e o IRS sobre a pensão |
| Gonçalo | Estudante, 16 anos | Mesada e primeiro trabalho | O primeiro recibo, o IRS Jovem, a primeira conta |
| Rui e Marta | Casal com crédito | Crédito à habitação | A prestação, a Euribor e quanto do salário ela come |

O número da Inês **não está escrito à mão**: compõe-se em `HomeBairro` com
`linhaSalario()` (a linha de `brutoRef` de `cenarios-salario.json`) e
`fmtEUR0`. O e2e lê o mesmo JSON e compara com o texto da página.

A ponte carta→mapa é um `CustomEvent` (`b:escolhe-personagem`) — as cartas
vivem no `<main>` do servidor e não podem receber uma função do `<Bairro>`
(cliente).

### 6b.2 O kit de desenho

TypeScript puro que devolve SVG em texto, em `src/lib/bairro/`:
`iso.ts` (motor isométrico e peças), `planta.ts` (a planta e o terreno),
`personagens.ts` (o esqueleto, o elenco e os passantes), `dados.ts`
(`dadosBairro()` — os números, lidos de `data/` no servidor).

Três invariantes do kit, que os testes fixam:

1. **Funções puras.** O terreno é um argumento, nunca um global. No
   protótipo, `definirTerreno()` e `lencoAtual` eram variáveis de módulo
   escritas e nunca limpas; em produção o mapa não pode depender da ordem
   de chamada.
2. **Os ids de padrões SVG levam `b-`**, para não colidirem com o resto do
   site.
3. **Nenhum desenho escreve `undefined` nem `NaN`.** O protótipo emitia
   `fill="undefined"` numa parede sem cor — o browser pintava-a a preto, sem
   erro na consola. Onde um valor falta, o que se escreve é a falha
   declarada («—»), nunca um zero.

O SVG entra na página com `dangerouslySetInnerHTML`. É seguro porque não
entra texto de utilizador: tudo vem do código e de `data/`, e há teste que
falha se algum valor não for número ou texto da casa.

### 6b.3 O contrato visual V5

Direção: o bairro do Porto em cartoon, claro, traço preto grosso, cores
chapadas, para dos 11 aos 50 anos. Mantêm-se da V4 a Regra nº1, a cor com
significado (verde = o que fica contigo · vermelho = o que sai · azul =
neutro) e ▲/▼ nas variações.

Tokens (claro, por omissão), copiados do protótipo:

| Token | Valor | Uso |
|---|---|---|
| `--papel` | `#ffffff` | fundo de cartões e cenas |
| `--chao` | `#f6f2ea` | fundo das páginas |
| `--tinta` | `#16130f` | texto e traço |
| `--tinta-2` | `#4a4540` | texto secundário |
| `--suave` | `#6e675e` | fontes, notas |
| `--linha` | `#e4e1da` | divisões |
| `--amarelo` / `--amarelo-2` | `#ffc62b` / `#fff1c2` | destaque, marcadores |
| `--azul` / `--azul-2` | `#2445d6` / `#dfe5ff` | informação, botões |
| `--verde` / `--verde-2` | `#0c8f5c` / `#d3f2e3` | o que fica |
| `--vermelho` / `--vermelho-2` | `#e2412a` / `#ffe1d9` | o que sai |

**Os tokens vivem em `[data-pele="v5"]`, não em `:root`.** Não é estilo: é
uma correcção. `--linha` já existia no sistema V4 com outro significado — é o
contador de escalonamento que `/salario`, `/impostos`, `/casa`, `/poupanca`
e `/trabalho` escrevem no elemento e que o escalonamento consome em `calc()`
com o fallback `var(--linha, 0)`. Declará-lo como cor em `:root`
invalidaria esses quatro `calc()` e pararia a animação de entrada dessas
rotas. Na P3a o atributo subiu para o `<html>` e a pele vale no site inteiro;
a fronteira que faltava ficou escrita como `#conteudo { --linha: initial }`.

**Tema escuro = a noite do bairro** (§2.2): fundo `#141a33`, papel
`#1d2442`, tinta `#f4efe4`, azul `#8da2ff`, verde `#3fc48a`, vermelho
`#ff7a5c`, amarelo igual — já medidos em AA pelo audit, não proposta.

**Cores semânticas: a casa ganhou ao protótipo.** `#e2412a` mede 4,18:1 e
`#0c8f5c` 4,1:1 sobre papel — reprovam AA em texto pequeno. Nas rotas com
a pele os tokens de texto passam por variantes `-txt`, a mesma família
escurecida até 4,5+ (`#c73a1d`, `#0a7a4f` no claro; em escuro voltam aos
valores do protótipo, que lá passam). **A regra da casa ganha sempre ao
protótipo** — se o dono quiser o vermelho do protótipo, só a partir de
18 px ou negrito.

Tipografia e forma: §2.3 e §2.4.

### 6b.4 A regra de motion do bairro

A regra da V4 («nada entra com animação acima da dobra») **continua a
mandar**, mas no bairro há uma excepção deliberate e escrita:

> **A animação ambiente é permitida no bairro** — é a home. Onde a V4 só
> tinha o herói da home, na V5 o mapa inteiro respira: o elétrico sobe e
> desce a Avenida, as gaivotas traçam órbitas sobre o rio, o nadador dá
> braçadas debaixo da ponte, os pombos ajeitam-se na Ribeira, o fumo sobe
> da fábrica, o brilho desliza sobre o Douro.

As regras que continuam, todas:

1. **Nas cenas anima-se o que ensina** — moedas, gavetas, camadas do
   litro, o quadro da Euribor. Nunca animação decorativa.
2. **O número certo está sempre no HTML do servidor.** A animação explica
   a transformação; não é o que traz o número.
3. **`prefers-reduced-motion` = estado final imediato**, nunca animação
   atenuada. Em `reduced-motion` a cena escreve **direto** o estado final
   (a Fábrica escreve CÊNTIMOS exatos, 1 166,83 €, e não o 1 167
   arredondado) e o chunk do GSAP **não é descarregado** — há e2e que o
   prova.
4. **GSAP só via `carregarGsap()`** (regra B-01). Nada importa `gsap`
   estaticamente.
5. **Pausa fora da vista.** Tudo o que é contínuo pára fora do ecrã e com
   o separador escondido (`PausaAmbiente`, IO + `visibilitychange`).
6. **O mapa nunca mexe no `viewBox`.** O mundo desenha-se uma vez em
   camadas SVG grandes; a câmara só as desloca e escala com `transform`
   CSS, e enquadra-se com `ResizeObserver`. Regras de desempenho
   obrigatórias em `design/prototipos/README.md`.

### 6b.5 O contrato de dados — cenas com JSON em `public/cenas`

Cada cena tem **um ficheiro de dados próprio**: `public/cenas/<id>.json`
(`fabrica`, `financas`, `banco`, `mercearia`, `correios`, `bomba`,
`segsocial`, `casa`, `pastelaria`, `quiosque`, `escola`).

**Quem escreve.** O `npm run derive`, pelo passo `scripts/derive/cenas.ts`,
que chama a MESMA `dadosCenas()` do servidor — nenhuma lógica está
duplicada. O gerador falha alto se uma série trouxer um buraco (nunca
escreve `null`, que a aritmética leria como 0) e o `CenasDados` não usa
`undefined` em campo nenhum.

**Quem lê.** O cliente (`CenaViva`, em `Bairro.tsx`) faz
`fetch("/cenas/<id>.json")` ao abrir, com cache por id. **Nenhum JSON de
`data/` chega ao cliente** — só números crus e fontes, via props.

**Porquê.** Antes os dados das cenas viajavam na prop `cenas` do `<Bairro>`:
o Next embarcava-os no flight (`self.__next_f`) da home — ~19 KB raw de
séries e tabelas pagos por quem nunca abre um edifício. Medido com
`scripts/_dieta-html.mjs`: payload RSC 17 184 → **9 088 B gzip**.

**Enquanto o JSON não chega (ou se falhar)** a moldura `CenaDePerto` abre
na mesma, sem desenho, com Escape/× a funcionar e a falha honesta em vez
de zeros.

**Os ficheiros são committados.** A ingestão diária faz
`git add data/ public/api/ public/cenas/` — o mesmo gesto que os dados, o
mesmo commit. Um `public/cenas` não committado é um bug de dado, não um
detalhe de higiene.

### 6b.6 As regras de qualidade que o bairro ensinou

Aprendidas na P1 e nas cenas, todas já no CI:

1. **Testes de geometria, não só de DOM.** O hotfix da P1 existiu porque
   os e2e antigos passavam todos sobre uma página de 20 000 px de altura
   sem ver um pixel do mapa. Agora `src/lib/bairro/*.test.ts` fixa a
   geometria (a projeção `P()`, a contagem de edifícios, cada edifício com
   `data-id`, os valores dos marcadores iguais aos de `data/`, o
   enquadramento do CSS amarrado à constante da câmara) e
   `e2e/bairro.spec.ts` mede em `getBoundingClientRect` a 1440/1024/768/375.
   **Uma asserção que não mede nada é uma asserção que não falha.**
2. **O `audit` corre no CI.** `_mega-audit` + `_overflow-sweep` + `_sweep` +
   `_lettering`, na mesma ordem do deploy, contra o `out/` que o `webServer`
   do Playwright já construiu. Foi o audit que chumbou `/inflacao` e
   `/precos` em `dark` (ticks do `LineChart` a 4,31:1) e que apanhou a
   amostra amarela da `/estilo` a 1,37:1. Nenhum dos dois era visível a olho.
3. **`_gate-html.mjs` é um gate, não um script.** Fica no CI depois do
   `build`: mede o HTML da home contra o tecto de 80 KB gzip **e verifica
   a promessa arquitectural** que tornou isso possível — o payload RSC não
   contém o SVG do mapa. Se alguém voltar a passar o mapa por prop, o gate
   aponta-lhe o dedo em vez de o deixar passar calado.
4. **A ingestão commita `public/cenas`.** §6b.5 — dado sem commit é dado
   que o próximo build não tem.
5. **O build é o portão, não o typecheck.** Uma função passada por prop a
   um client component passa o `tsc` limpo e é recusada pelo `next build`
   (*«Functions cannot be passed directly to Client Components»*). Os
   pontos viajam como **dados**, nunca como funções.
6. **A cópia é do dono.** Toda a copy vinda do protótipo é PROPOSTA e está
   em `docs/REVISAO-COPY-V5.md`, gerada por `node scripts/_revisao-copy.mjs`
   a partir das fontes de verdade — não escrita à mão, para não poder
   ficar desactualizada.

## 7. Intocável

- **O ¢** — o C do wordmark é o sinal de cêntimo desenhado (arco à
  cap-height + haste verde-keep); `LogoMark` é o ¢ sozinho. Fora do
  logótipo só onde a casa assina e no selo «1 ponto = 1 cêntimo» —
  regras completas em §6 «O ¢ como símbolo da casa».
- **O bairro** — o mapa é a home. Nenhuma rota nova sem entrada em §6b.1 e
  no `AGENTS.md`; as cenas abrem por âncora, nunca por URL nova.
- **O papel** — os documentos fiscais são peças físicas (recibo, talão,
  escritura, declaração, caderneta, nota de liquidação); o talão de
  `/salario` tem escala tipográfica própria (`talao-*`) porque é um
  documento, não chrome. Na V5 é o talão e o recibo, em monoespaçada do
  sistema.
- **A semântica das cores** — verde = fica contigo, vermelhão = sai,
  azul = neutro; ▲/▼ nas variações. Nunca decoração.
- **O raio com significado** — na V5: papel cortado (0), cartão do bairro
  (18–24 px), controlo em pílula com sombra dura.
- **A unidade** — 1 ponto = 1 cêntimo; isométrico = estrutura, pontos =
  quantidade.
- **A noite** — o tema não é uma inversão: é «a noite do bairro» (§2.2), e o
  mapa nunca escurece.

## 8. Regras de produto — não mudaram

1. **Regra nº1: nunca inventar dados.** Fonte falha → mostra a falha
   (`—`, `EmptyState`, badge de série atrasada) — nunca um número
   plausível.
2. **Cada número tem fonte + data visíveis** (`Source` sob cada figura;
   `data/meta/sources.json` alimenta o selo de frescura).
3. **PT-PT europeu.** Proibido: usuário, tela, você, portfólio
   (portefólio), «descobre/potencia». Segunda pessoa do singular.
4. **Regras fiscais em `data/fiscal/*.json` por ano** com fonte e
   vigência — nunca hardcoded, entram por PR manual com fonte legislativa.
5. **Motores em `src/lib/engines/`** são funções puras testadas, sem UI;
   o motor fiscal não entra no bundle do cliente — os cenários chegam
   pré-calculados por props. As cenas do bairro usam **os mesmos motores**
   (`impostoPorEscaloes`, `simularPrestacao`, `decomporCombustivel`,
   `simularIndependente`, `trajetoriaColchao`): nada está reimplementado
   dentro de um componente, e há testes golden que comparam a cena com o
   resultado do motor.
6. **Sem aconselhamento financeiro** — disclaimer permanente.
7. **Copy é do dono.** Agentes propõem estrutura; não publicam texto sem
   revisão.

## 9. Lista negra

Gradientes de herói · roxo/violeta · glassmorphism · emoji como ícone ·
ilustração stock · sombra difusa grossa em tudo · paleta categórica em
séries ordinais · grelhas de cartões idênticos · scroll-jacking / secções
presas longas · fade-up genérico · mostradores de agulha · qualquer
animação que atrase a leitura de um número.

## 10. Stack, dados e rotas

Next.js App Router + TypeScript strict, Tailwind 4, `output:"export"`
(estático — serve-se `out/`, `next start` não funciona). Sem base de
dados: «dados como código» — `scripts/ingest` (Actions cron) →
`data/sources` + `data/derived`, validação zod, watchdog de frescura.
Gráficos SVG/Canvas à medida. Deploy: GitHub Pages, domínio
`aocentimo.pt`.

Gates antes de merge: `lint && typecheck && test:unit && validate:data &&
build && test:e2e`.

### Rotas (as que existem em `src/app/`)

`/` (home) · `/salario` `/irs` `/impostos` `/poupanca` `/credito`
`/casa` (dinheiro) · `/inflacao` `/precos` (preços) · `/trabalho`
`/dados` (país) · `/aprender` + `/aprender/[slug]` · `/metodologia`
`/estilo` `/sobre`.

### Instrumentos → uso → contrato a11y

| Componente | Uso | Contrato |
|---|---|---|
| `LineChart`/`Spark` | séries temporais | svg `aria-hidden` + equivalente (tabela sr-only); animam só abaixo da dobra ou em interacção |
| `Cartao` | anatomia Ledger de qualquer cartão | cabeçalho/corpo/controlos/rodapé; selo de estado sempre com texto; inversão para papel |
| `OrbeEstado` | selo de frescura — a forma diz o estado | disco cheio/anel oco/esburacado/anel em rotação; SVG aria-hidden + texto ao lado; rotação pára fora do ecrã |
| `Icone`/`IconeEmblema` | símbolos — páginas, acções, estado | conjunto fechado 20×20, traço 1,5; `aria-hidden` por omissão; acções sempre em controlo nomeado; desenham-se uma vez ao foco/passo |
| `Pagina`/`PaginaDetalhe` | template de três níveis das rotas de conteúdo | níveis = `section aria-labelledby`; confirma em `<details>` fechado |
| `Leitura` | cartão Ledger de leitura | insight escrito, anotação com chamada, fonte+estado no rodapé |
| `EuroBar`/`JuroCapital`/`CampoCentimos`/`Isometrico` | comparações e decomposições | equivalente textual único; SSR no estado final; `CampoCentimos` expõe `data-pronto` (entrega SSR→canvas) e `data-assentou` (montes assentados) |
| `PecaPapel`/`Papel` | documentos | paleta fixa de papel; rasgo determinista |
| `Regua` | input numérico | range nativo único (teclado/AT); traços + marcador «agora» + presets `Chip`; snap à grelha com ressalto contido |
| `Botao` | acção/ligação | 4 variantes (primário·secundário·terciário·ícone); `aria-disabled`+razão no nome; `aCarregar` = mini-orbe + `aria-busy` |
| `Interruptor` | on/off | `role="switch"` + `aria-checked`; estado na posição do nó, trilho e nota — nunca só cor |
| `Chip` | preset/escolha | `aria-pressed` + pílula cheia + marca (três canais) |
| `Segmentado` | escolha exclusiva | `radiogroup`; tabindex itinerante; setas seleccionam; desactivado salta-se com razão |
| `BotaoCopiar` | copiar URL/JSON | `role="status"` anuncia «Copiado»/«Não copiado»; relativo → URL absoluta |
| `Odometer`/`TweenNum`/`NumHero` | números | valor final no SSR; `aria-live` num só readout |
| `Delta` | variações | ▲/▼ + cor semântica; estado neutro existe |

Regra transversal: um equivalente por figura, `fmtPeriodo` para todos
os períodos (`2026-Q1`→«1.º trim. 2026»), fonte+data sempre visíveis,
container queries nos cartões (o cartão adapta-se ao seu espaço, não ao
ecrã — nunca dois rótulos sobrepostos).

### Séries e SLAs

Eurostat (mensal, watchdog em `scripts/derive/freshness.ts`):
IHPC CP00 + 12 divisões ECOICOP + agregados, desemprego
PT/UE27/jovem, HPI, LCI, PIB homólogo, confiança, electricidade.
BPstat (mensal): Euribor 1/3/6/12M + 8 TAEG. DGEG (diário):
PMD gasóleo/gasolina/GPL + electricidade doméstica. Derivados
(sem SLA próprio — herdam o pior estado dos inputs): `ca-base`,
`casa-em-salarios`, `desemprego-gap`, `hicp-resumo`, `painel`.
Estados: `em-dia` / `atrasada` / `sem-sla` — a falha mostra-se.

### Arquitectura de motion

Nada importa `gsap` estaticamente. `carregarGsap()` é um dynamic
import memoizado chamado só quando `motionActiva()` (não
reduced-motion) E há movimento legítimo (interacção, ou a animação
ambiente do bairro — que é a excepção documentada em §6b.4).
Durações/curvas lidas dos tokens CSS (`dur()`, `ease()`). Em
reduced-motion o chunk do GSAP **não é descarregado** — tem teste e2e
que percorre todas as rotas e intercepta os pedidos.

### Orçamento de performance (medido, `_js-por-rota` + `_sweep` + `_gate-html`)

- **HTML da home: tecto de 80 KB gzip** (`scripts/_gate-html.mjs`, gate
  do CI depois do build). Estado actual: **72,1 KB gzip** medido
  (2026-10-04), depois de o conserto do flight ter eliminado a segunda
  viagem do mapa — o payload RSC caiu de 17 184 para 9 088 B.
  `_dieta-html.mjs` mede o mesmo por blocos (o mapa são ~81 % do raw) e
  corre experimentos sobre uma cópia em memória, sem escrever nada.
- **JS inicial por rota: tecto de 350 KB gzip** na home, do pack §P1
  (`_js-por-rota.mjs` imprime KB *wire*; o tecto é gzip). Medido em
  2026-10-04: a home carrega **223,7 KB gzip** em 11 ficheiros
  (~608 KB wire) — dentro do tecto, mas o número subiu desde os 185,7 KB
  registados na P1 (o registry das cenas e o browser chrome das 11 cenas
  entraram depois). O registry **fica** dentro do inicial; **as onze cenas
  não** — viajam por `next/dynamic` e só descem ao entrar no edifício, e o
  e2e prova que nenhum pedido de cena acontece no load.
- **O mapa é HTML renderizado, não carga de hidratação.** É a promessa
  arquitectural que sustenta o tecto acima, e o `_gate-html` verifica-a:
  o SVG não pode aparecer no `self.__next_f`.
- **A planta não vai para o bundle do cliente.** Os pontos de
  enquadramento chegam prontos do servidor, em coordenadas de ecrã, por
  prop (`Enquadramentos { perto, longe }`). Verificado por `grep` nos
  chunks: zero vestígios.
- **A câmara mede o alvo em unidades do mundo, nunca `getCTM()`** —
  `getCTM()` devolve px do viewport da camada SVG e metia a personagem
  fora do mundo (defeito medido no build integrado).
- Fontes: **duas** (Archivo + Caveat), 424 KB / 7 ficheiros `.woff2`
  depois da P3c (eram 588,7 KB / 22 com as três da V4).
- Detalhe das últimas medições em `docs/MEDICAO-V5.md`.

## 11. Referência viva

`/estilo` — a referência viva do sistema. **Escrita na linguagem do bairro**
desde a P3c: a intro diz «o contrato visual «O Bairro», claro por omissão»,
os rótulos que diziam «Source Serif 4» e «Space Grotesk» dizem agora
«Archivo» e «monoespaçada do sistema», e há uma secção nova
(`data-contrato-v5`) com os dez tokens de cor lidos por `var(--token)`, a
tipografia, a forma, dois gráficos com `aria-label`, o talão e **a noite do
bairro com um toggle a sério**.

Uma página que **é** a especificação tem de ser exemplar no lettering: os
números passam por `comUnidade()` de `@/lib/format` (o fino U+202F), como
qualquer outra página. Quando o sistema mudar, `/estilo` e este documento
mudam juntos.
