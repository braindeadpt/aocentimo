# NOTAS V4 — sessão 3B «O que pagas»

> Ficheiro só desta sessão (worktree `aocentimo-sessao-3b`, branch
> `v4/o-que-pagas`). Rotas: `/impostos` `/precos` `/inflacao`.
> Gates corridos: lint · typecheck · test:unit · validate:data —
> todos verdes (o lint traz 1 aviso pré-existente em
> `postcss.config.mjs`, intocado). SEM build/e2e — gates pesados são
> da sessão principal.

## Estado por tarefa

### 3B-01 · /impostos — «Quanto do que compras é imposto?» — FEITA

( herdada do agente anterior, revista e verificada )

- Nível 1: `CampoCabaz` (novo) — `Cartao` + `CampoCentimos` que nasce
  em «montes» (a resposta está no HTML sem JS) com `Segmentado`
  «A moeda / Os cêntimos» para correr a coreografia a pedido.
  Os cêntimos de IVA saem do `CABAZ` partilhado (`cabaz.ts`, módulo
  puro — mesmo cabaz que o talão edita). Rotulado «CABAZ DE EXEMPLO»
  no breadcrumb + «preços de exemplo» na meta — nunca média nacional.
- Nível 2: `TalaoCompras` (fica; cabaz extraído para `cabaz.ts`,
  `scrubAria` passa a vir por prop — client components não leem `m`)
  + `LitroFuel` (novo): `Segmentado` gasóleo/gasolina troca as DUAS
  peças de uma vez — `Isometrico` (estrutura: litro→IVA→ISP→carbono→
  produto, IVA visivelmente sobre ISP) + `CampoCentimos` em montes
  (quantidade real, `total = cêntimos do litro`, 1 ponto = 1 cêntimo)
  com `NumHero` do peso dos impostos. Valores pré-calculados no
  servidor por `decomporCombustivel()` — motor fora do cliente.
- `CalculadoraIva` e `DecomposicaoFuel` apagados (substituídos pelas
  peças novas; zero referências restantes).
- Nível 3: três `PaginaDetalhe` — taxas CIVA, portarias ISP/carbono,
  fórmulas + cascata «IVA sobre ISP».
- Seguinte → `/precos` ✓.
- Verificado: sem overflow a 1440/375 nos dois temas, 5 camadas iso +
  lista, 315 pontos no HTML (100 cabaz + ~215 litro), 2 equivalentes
  (um por figura), zero pageerror, zero avisos `Pagina`.

### 3B-02 · /precos — «Quanto custa encher o depósito hoje?» — FEITA

( herdada, revista e verificada )

- Nível 1: odómetro de bomba (`Odometer`, valor final no SSR) — 50 L
  de gasóleo ao PMD de hoje + frase com a variação semanal.
- Nível 2: `LineChart` das três séries diárias DGEG desde jan 2021
  com o evento «Desconto extraordinário do ISP» (fonte + data em
  `data/fiscal/eventos.json`, alvo `combustiveis`) + `Haltere`
  «semana passada ● ○ hoje» por combustível (`formato="litro"`).
- Nível 3: série completa em números (início/mín/máx/último por
  combustível), portarias ISP, metodologia DGEG («porque não há
  preços de supermercado» — honesto).
- Seguinte → `/inflacao` ✓.

### 3B-03 · /inflacao — «Quanto mais caro está o que compras?» — FEITA

( feita nesta sessão — a página estava no formato antigo )

- Reescrita sobre `<Pagina>` (`rota="/inflacao"` activa a aterragem
  do voo).
- Nível 1: `PoderDeCompra` refactorizado — a máquina do tempo passa a
  viver num `Cartao` (breadcrumb INFLAÇÃO / A MÁQUINA DO TEMPO ·
  EUROSTAT, orbe, fonte) e o `<select>` de anos virou `Regua` com
  `pontos` = anos exactos da série + `marcadorAgora` «hoje» no último
  ano. O campo «O valor» ficou (não se removeu função). A frase do
  nível 1 traz a taxa homóloga: «Em ago 2026, os preços estavam
  3,6 % mais caros do que um ano antes.»
- Nível 2: `Haltere` das 12 divisões ECOICOP (CP01–CP12, as que a
  ingestão traz) — taxa homóloga de há um ano ● ○ agora, `formato
  ="pct1"`, `bomSubir=false`, ordenado pela maior subida; é a figura
  principal no lugar da tabela. `LineChart` homóloga (janela 10 anos)
  índice geral vs alimentação (CP01) vs energia (NRG) com a faixa
  «IVA zero no cabaz essencial» (evento `ihpc` com fonte/data).
- Nível 3: cinco `PaginaDetalhe` — tabela completa por categoria (as
  12 divisões + subcategorias e agregados, como estava), a base do
  índice (derivada de `meta.unidade`, como pedido), IHPC vs IPC, «O
  teu salário em termos reais» (`SalarioReal` desceu para aqui — ver
  decisões), metodologia + «o que o índice não mede».
- Saíram: o herói `Leitura` da homóloga e a grelha de 3 divisões —
  redundantes com o haltere e a linha anotada (REDUNDÂNCIA É
  DEFEITO). A mediana de 10 anos ficou no insight do cartão da home,
  não nesta página.
- Seguinte → `/credito` «E o dinheiro emprestado, quanto custa?» ✓.
- **Bug apanhado e corrigido:** `fmtPct` espera fracção (×100) e
  `homologa` devolve pontos percentuais — a frase saía «355,2 %».
  Trocado por `comUnidade(fmtNum(v,1), "%")` (o registo «valor já em
  %» de `viz/formatos`).

### 3B-04 · Coerência da faixa — FEITA

- Releitura a-14-anos: nível 1 legível sem saber IVA/ISP/IHPC —
  /impostos «…são IVA — o resto é o preço real das coisas» (o IVA é
  o tema da página e explica-se no talão), /precos e /inflacao sem
  jargão. Frases ≤ 25 palavras (sem avisos `Pagina` no dev server).
- Valores ilustrativos marcados: cabaz «DE EXEMPLO» no breadcrumb +
  meta + carimbo SIMULAÇÃO no talão.
- `e2e/sessao-3b.spec.ts` escrito (não corrido — a suite faz build
  próprio): 3 níveis + detalhes fechados + pageerror por rota;
  herói no HTML sem JS (100 pontos do cabaz, equivalente, iso-lista,
  talão RESUMO IVA, odómetro, haltere ×12); régua de anos funciona.

## Decisões tomadas (conservadoras, a confirmar)

- **`SalarioReal` desceu ao nível 3** (`PaginaDetalhe` «O teu salário
  em termos reais») — não está enumerado no brief e é a terceira
  variação da mesma história de deflação na página; mantém-se o
  simulador, não se apagou. Se preferirem apagar, é tirar o detalhe.
- **Haltere ordenado pela taxa homóloga actual** (`agora` desc) —
  «a maior subida» lido como «quem está mais caro agora».
- **«12 divisões» = CP01–CP12** — as que o ingest traz
  (`scripts/ingest/eurostat.ts`); ECOICOP 2018 tem CP13 (cuidado
  pessoal/diversos) mas não existe na série — não se inventou.
- **Rótulos PT das divisões** — os JSON não trazem título; nomes
  curtos escritos à mão no estilo da página antiga (CP12 = «Seguros
  e serviços financeiros», o nome ECOICOP 2018).
- **Linha anotada em taxa homóloga + janela 10 anos** — coerente com
  o haltere (que mede a homóloga) e com a convenção da casa; o evento
  IVA-zero cai dentro da janela. Energia = NRG (agregado Eurostat),
  não CP045.
- **`PoderDeCompra` manteve o campo «O valor»** — o brief pede a
  régua de anos; o input de euros é função existente e ficou na zona
  de controlos do cartão.
- **Energia no haltere é CP04** («Habitação, água e energia») — a
  divisão ECOICOP, não o agregado NRG da linha.

## Pendências / perguntas ao dono

- Screenshots e fotogramas em `.shots/` (gitignored): topo/meio/fim
  das três rotas a 1440 e 375, dois temas; frames da transição
  moeda→montes, do isométrico armado e da troca gasóleo→gasolina.
  Vídeo gravado em `%TEMP%/aoc3b/videos` (fora do worktree).
- `data/meta/freshness.json` regenerado pelo `validate:data`
  (só timestamp) — revertido para manter a árvore limpa.
- Copy novo a rever: frases de nível 1 das três rotas; rótulos das
  12 divisões ECOICOP; detalhes «IHPC ou IPC — qual é qual», «A base
  do índice», «O que o índice não mede»; rótulo da régua «O ano de
  partida — janeiro» e marcador «hoje»; nota do haltere.
- `SalarioReal` importa `engines/deflator` no cliente — herdado de
  main, não mexi; pode precisar do tratamento «motor lazy» do dono.
- E2E não corrido aqui (build pesado é da sessão principal) — o spec
  foi escrito contra o markup real servido pelo dev server.
