# NOTAS V4 — sessão 3C «O banco»

> Ficheiro só meu (regra 5 das sessões paralelas). Rotas: `/credito`,
> `/casa`, `/poupanca`. Branch `v4/o-banco`, worktree
> `aocentimo-sessao-3c`, porta 3105 / dev 3005.
>
> **Retomada:** o trabalho foi encontrado a meio (agente anterior morreu).
> O que existia estava sólido — migração das três páginas para `<Pagina>`
> com providers de contrato partilhado. Completei: orbes de frescura
> honestos, rótulo da pergunta seguinte conforme o spec, spec e2e,
> limpeza de warnings e estas notas.

## Estado por tarefa

### 3C-01 · /credito — «Quanto vais pagar ao banco, no total?» — FEITO

- **Nível 1**: `InstrumentoPrestacao` (Cartao + NumHero «899,21 €/mês»,
  meta TAN/Euribor/data, orbe de frescura real de `euribor-3m-mensal`) +
  `FrasePrestacao` («Pedes 200 000 €, devolves 323 714 € — 1,62× o que
  pediste.» — 13 palavras, rácio calculado pelo motor, não arredondado).
- **Nível 2**: réguas de capital (10 mil–1 M €), prazo (1–50 anos),
  Euribor (−0,5–7 %, marcador «agora 12M» + presets mediana-10-anos e
  ±0,5 p.p.) e spread. Euribor 3M vem do BPstat com a data no texto.
  `JuroCapital` (a troca de peso juro↔capital — já existia). Linha
  anotada da Euribor 3M desde 1994 com os eventos BCE com fonte
  (`data/fiscal/eventos.json`). Choque +1 p.p. como `Interruptor` — liga
  e TODA a resposta muda (herói, juros totais via TweenNum, mapa).
- **Nível 3**: `MapaAmortizacao` (plano mensal agregado por ano, com %
  de juro por ano), glossário Euribor/spread/TAN/TAEG/MTIC + fórmula do
  sistema francês, fontes e API.
- `CreditoProvider` (CreditoSim.tsx): UM contrato partilhado pelos três
  níveis — capital, anos, Euribor, spread, choque. `euribor: null` =
  fonte falhou → falha visível, nunca número inventado.
- Seguinte → `/casa` ✓.

### 3C-02 · /casa — «Quanto custa mesmo comprar esta casa?» — FEITO

- **Nível 1**: `InstrumentoEscritura` (NumHero do dinheiro do dia da
  escritura, meta IMT+selo, orbe `fiscal-imt-2026` — adicionei nesta
  retomada; antes não tinha selo) + `FraseEscritura` (24 palavras).
- **Nível 2**: escritura em papel (`talao`, arestas rasgadas, carimbo
  «simulação») com acreção animada — linhas imprimem uma a uma e a
  barra `.acre` empilha uma camada por custo ao mesmo ritmo. Réguas de
  preço/entrada/prazo/Euribor/spread, `Segmentado` para a finalidade,
  `Interruptor` IMT Jovem desactivado fora de HPP com a razão à vista.
  Painel «Todos os meses» com prestação + `JuroCapital`. A casa contra
  o salário: `Leitura` do derivado `casa-em-salarios` (razão de índices
  Eurostat, referência nível-2015) — substitui o antigo cartão HPI +
  footnote (menos redundância, mesma informação).
- **Nível 3**: tabelas IMT HPP e secundária, IMT Jovem, IS e registos,
  fontes.
- **Cor**: «Preço na placa» em tinta neutra (TINTA), nunca verde —
  verde (`--keep`) é só o capital que fica teu no JuroCapital. ✓
- `CasaProvider`: mesma compra nos três níveis; `entradaEf` grampeada
  ao preço; `euribor: null` = falha honesta (o fallback de 2,5 % que
  existia foi removido pelo agente anterior — correcto).
- Seguinte → `/poupanca` ✓.

### 3C-03 · /poupanca — «Onde rende mais o teu dinheiro — depois de
impostos e inflação?» — FEITO

- **Nível 1**: `InstrumentoTaxaReal` (NumHero da melhor taxa real
  líquida, meta com as três, orbe — mudei de literal `"em-dia"` para
  `estadoDe(fresh, "fiscal-ca")`, nunca frescura inventada) +
  `FraseTaxaReal` (melhor vs pior vs colchão — 24 palavras).
- **Nível 2**: `CampoCentimos` montes «De cada euro de juro, 28 cêntimos
  vão para o Estado» — calculado de `capitais.retencaoLiberatoria.taxa`,
  não literal ✓. `ComparadorPoupanca` — a divergência dos 4 destinos
  (cheio = nominal, tracejado = vale hoje; CA pára aos 15, CTPC aos 7 —
  a linha acaba onde o produto acaba). `CadernetaAforro` — papel,
  linhas ano a ano (juro entra / fisco retém), faixa nominal-vs-real.
  `Leitura` da taxa base CA (mantida do original).
- **Nível 3**: regras CA Série F (tabela de prémios), regras CTPC,
  retenção e englobamento, `SimuladorPpr`, `SimuladorMaisValias`, fontes.
- `PoupancaProvider`: taxas por props do servidor (client nunca importa
  `data/*.json`); inflação inicial = variação homóloga real do IHPC
  (`hicp-resumo`, 3,5 %); sem série → fallback 2 % documentado.
- Seguinte → `/dados` com o rótulo do spec: «E o país, como está?»
  (alterado de «De onde vêm todos estes números?» — ver pendências).

### 3C-04 · Coerência da faixa — FEITO

- **Mesma Euribor, mesma data**: `/credito` e `/casa` consomem
  `euribor-3m-mensal` (2026-08, 2,51 %). `/poupanca` não usa Euribor
  directa (CA vem de `ca.json`; o derivado `ca-base` usa Euribor 3M).
- **Leitura aos 14 anos**: as três frases do nível 1 lêem-se sem saber
  spread/TAEG/IMT (13/24/24 palavras — verificadas no HTML servido).
- **e2e**: `e2e/sessao-3c.spec.ts` escrito (não corrido — a suite é gate
  da sessão principal). Cobre: três níveis + UM h1 + um instrumento,
  herói no HTML sem JS + frase ≤25 palavras, detalhes fechados, zero
  pageerror/hidratação, pergunta seguinte da faixa, os 28 cêntimos do
  fisco no equivalente do `CampoCentimos`, e o choque +1 p.p. a mexer
  no herói. **Seletores validados manualmente contra o dev server**
  (sem correr a suite): `.pg-nivel`×3, `.pg-instrumento`, `.pg-frase`,
  `details.pg-detalhe` (3/5/6), `.pg-seguinte-lnk`, `role=switch`,
  `input[type=range]`, `[data-cc-equivalente]`.

## Gates leves (sessão)

- `lint` — 0 erros (1 warning pré-existente em postcss.config.mjs;
  removi os 5 warnings de imports não usados dos ficheiros da sessão).
- `typecheck` — limpo. `test:unit` — 353/353. `validate:data` — 68 séries
  em dia.
- Dev server 3005: as três rotas 200, zero `pageerror` com interacção
  (réguas + interruptores), zero warnings de `<Pagina>` na consola do
  servidor (instrumento único, frase ≤25).

## Verificação visual

- Screenshots: `.shots/3c/` — as três rotas a 1440/375, claro/escuro,
  topo+página inteira, + reduced-motion (geradas por `.ref/shots-3c.mjs`
  contra o dev server).
- Vídeo: `.videos/page@b99a….webm` + folha `sessao-3c-sheet.png`
  (`.ref/video-3c.mjs`): escritura a imprimir + acreção, choque +1 p.p.
  em /credito, divergência + caderneta em /poupanca. Movimento confirmado
  por diff de fotogramas (3,7–44 % de pixels mudados entre instantes;
  transições de página = ~100 %). Folha para revisão do dono.
- Scripts ficam em `.ref/` (gitignored) — não são matéria do commit.

## Decisões (hipótese conservadora, a confirmar pelo dono)

- **Régua da Euribor em /credito**: o valor inicial é a 3M (a mesma das
  outras páginas — coerência 3C-04), mas o marcador «agora» é a 12M
  (referência de contrato mais comum) e os presets são ±0,5 p.p. da 12M
  + a mediana de 10 anos do painel. Herdado do agente anterior — é
  honesto (rótulo diz «agora 12M»), mas o polegar e o marcador vivem em
  sítios diferentes; se confundir, troca-se o marcador para a 3M.
- **Euribor negativa permitida** (régua min −0,5 %) — histórico real.
- **«duas fontes quando divergem» (IMT Jovem)**: `imt-2026.json` só tem
  uma fonte (Ofício Circulado AT) — não há divergência nos dados para
  mostrar; o detalhe apresenta a nota editorial da Tabela II. Se houver
  uma segunda tabela oficial divergente, é dado a acrescentar em
  `data/fiscal/` (não inventei).
- **Estado do instrumento de /poupanca**: `fiscal-ca` como fonte
  principal (taxa CA); `fiscal-capitais` também existe se se preferir o
  imposto como referência do selo.
- **Inflação inicial de /poupanca**: variação homóloga do IHPC (3,5 %);
  sem série o cenário arranca em 2 % — a régua marca «agora» quando a
  série existe.
- **Rótulo da pergunta seguinte de /poupanca**: spec manda «E o país,
  como está?» — aplicado. NOTA: o h1 actual de `/dados` é «Os números,
  direto da fonte» e a sessão 3D planeia «Como está Portugal hoje?» —
  o rótulo não espelha o h1 de destino (o voo morfa à mesma); alinhar
  no fecho (Sessão 4).
- **copy inline vs `messages/pt.json`**: mantive o padrão das páginas —
  copy de rota vai inline nos componentes; `pt.json` só ganhou chaves da
  fundação partilhada (não mexi em nenhuma).

## Pendências / perguntas ao dono

- Revisar folha de contacto `.videos/sessao-3c-sheet.png` e screenshots
  `.shots/3c/` (não consigo ver imagens — verificação foi programática:
  pixéis mudam, zero erros, DOM correcto).
- Confirmar o marcador «agora 12M» na régua da Euribor (acima).
- Confirmar o rótulo «E o país, como está?» vs h1 real/planeado de
  `/dados`.
- `MapaAmortizacao` e tabelas usam `text-up`/`text-keep` para juro/
  capital — cor semântica + texto (o «%» por ano é texto, não só cor).
- `pedidos/` — não foi preciso: nenhuma API congelada precisou de
  mudança. Não criei `pedidos/sessao-3c.md` (a pasta não existe ainda —
  criar só se houver pedido real).
- Nada commitado (regra da sessão): árvore pronta em `git status`.

## Como continuar

```
cd aocentimo-sessao-3c
export PORTA=3105 && npm run dev -- -p 3005
npm run lint && npm run typecheck && npm run test:unit && npm run validate:data
```
