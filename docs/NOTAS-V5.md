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
miúdos levam `.pessoa` sem `data-pessoa`. Nenhum JavaScript novo por
pessoa; o movimento é o CSS que já existia.

**Duas divergências deliberadas (estáticas):** no protótipo o Pedro e
a D. Arminda são PASSEADOS por código (ele anda o passeio, ela vai aos
correios) e os miúdos saltam da ponte em loop — aqui nascem e ficam nas
posições iniciais, porque «o movimento é só o que o protótipo já faz em
CSS» e andar gente por JS era fora de âmbito. Se o dono quiser o passeio
animado, é trabalho do ambiente, não do mapa.

**Conserto apanhado de raspão:** `ambiente.ts` procurava `.b-brazo-n`
mas `mundo.ts` emite `.b-braço-n` — o braço do nadador nunca animava.
Corrigido o selector; `ambiente.test.ts` já esperava a classe acentuada.

**Peso:** home 67,8 → **72,5 KB gzip** (+4,7; limite 80). A deduplicação
`<symbol>/<use>` não foi precisa — nenhuma figura foi cortada.

## P2a–P2c · As cenas

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

_(P2c — Casa, Pastelaria, Quiosque, Escola — fica para a sessão
seguinte.)_

## P3 · A pele V5 nas 13 rotas

_(por preencher)_

## P4 · Qualidade e lançamento

_(por preencher — a lista final de textos PROPOSTA é a que o dono revê
antes do lançamento. Não lançar sem essa revisão.)_
