# NOTAS-V4 — sessão 3A «O que ganhas»

Rotas: `/salario` · `/irs` · `/trabalho` · branch `v4/o-que-ganhas` ·
porta 3103 (estática/e2e) e 3003 (dev).

## Estado por tarefa

### 3A-01 · /salario — «Quanto vais receber mesmo?» — FEITO

- `contexto.tsx` (ProvedorSalario): estado partilhado pelos três
  níveis. O motor fiscal fica fora do first-load — `import()`
  dinâmico quando um controlo sai do perfil canónico (decisão do dono,
  S1-09); enquanto carrega mostra-se a última linha calculada.
- Nível 1 (`RespostaSalario`): `Cartao` com régua do bruto na zona de
  medição + líquido canónico (1 166,83 €) como `NumHero`; `FraseSalario`
  = «Da tua empresa saem {custo}; chegam-te {líquido} — {n} cêntimos
  de cada euro.»
- Nível 2 (`ExploraSalario`): controlos físicos (segmentado +
  contadores locais, sem selects), o talão de vencimento com
  reimpressão linha a linha e carimbo neutro «Não retido» ao IRS zero,
  o custo total em `CampoCentimos` montes (substitui a explosão
  isométrica), o dia da liberdade fiscal em `AnelPontos` de 365 dias
  calculado de `pesoEstado`.
- Nível 3 (`ConfirmaSalario`): ano a 14 vs 12 meses + porque há dois
  líquidos, efetiva vs marginal (+ ligação à tabela canónica em /irs),
  mecânica, legislação e fontes — tudo em `PaginaDetalhe` fechado.
- Saíram: `CalculadoraSalario.tsx` (apagado), cascata de barras,
  explosão isométrica, os 4 KPIs soltos (integrados no nível 3).
- Seguinte → /irs «E no fim do ano, recebes ou pagas?»

### 3A-02 · /irs — «Subir de escalão faz-te perder dinheiro?» — FEITO

- Hidratação #418: `_hydra-check.mjs` limpo nas três rotas (1440/375,
  dark/light) — não reapareceu.
- Nível 1 (`RespostaIrs` + `contexto`): resposta direta «Não — só a
  parte acima do limite paga a taxa nova» + `Cartao` com os nove
  recipientes que enchem (M-16 portado para dentro do Cartao; o antigo
  `EscaloesEnchem.tsx` apagado), régua de rendimento coletável que abre
  no coletável do cenário canónico (16 413 € ← bruto 1 500 € calculado
  no servidor por `simularSalario`), e o desmentido do mito em números
  (valor riscado vs coleta real).
- Nível 2 (`ExploraIrs`): `SimuladorAcerto` (nota de liquidação com o
  reembolso/a pagar como `NumHero` carimbado — o pré-existente M-16)
  e `SimuladorIrsJovem` refeito: `BarraTracos` de 10 anos (1 traço = 1
  ano; vividos a neutro, ano de gozo a marca, restantes a vago) +
  régua do bruto na grelha canónica + contador do ano de gozo.
- Nível 3: tabela canónica dos nove escalões (as outras páginas ligam
  para aqui), amostra da retenção na fonte, deduções à coleta,
  legislação e fontes.
- Seguinte → /trabalho «E se ficares sem trabalho?»

### 3A-03 · /trabalho — «Se ficares sem trabalho, quanto recebes e por
quanto tempo?» — FEITO (completado nesta sessão)

- `contexto.tsx` (ProvedorTrabalho): bruto/idade/descontos/majoração +
  `simularDesemprego` partilhados; `meses` e `temCorte` derivados.
- Nível 1 (`RespostaTrabalho`): `Cartao` com régua do salário (grelha
  canónica, marcador SMN) + mensalidade `NumHero` «996,81 €/mês» +
  duração; `FraseTrabalho` = valor + meses + degrau numa frase.
  Estado inelegível mostra a razão, nunca zero às cegas.
- Nível 2 (`ExploraTrabalho`, novo): contadores de idade/descontos +
  interruptor de majoração; a «Declaração de desemprego» (talão da
  M-18) prova a mensalidade — a linha do tempo de pilares saiu daqui
  porque a contagem dos meses passou para a `BarraTracos`
  (redundância é defeito); `MesesSubsidio`: `BarraTracos` 1 traço = 1
  mês — seis primeiros a «fica», do 7.º em diante a «marca» (o degrau
  de −10 % lê-se na cor e na nota); recibos verdes com
  `SimuladorIndependente` refeito.
- Codificação dos recibos verdes — decisão: `CampoCentimos` montes
  («de cada euro que faturas, N cêntimos ficam-te»). Justificação pelo
  catálogo: partilha de um todo em dinheiro é campo de cêntimos; a
  cascata saía de /salario por contar a mesma história pior, e não é
  peça do catálogo V4. A faturação virou régua (controlo físico).
- Nível 3: regras do DL 220/2006 com a tabela de duração
  (idade × meses de descontos + acréscimo), limites em IAS, o que a
  simulação simplifica, o dado do país (Leitura do desemprego PT vs
  UE27 preservada dentro de `PaginaDetalhe`, com `EstadoVazio` na
  falha) e fontes.
- `SimuladorDesemprego.tsx` apagado — o conteúdo vive agora em
  `ExploraTrabalho`/`RespostaTrabalho`.
- Seguinte → /impostos «E do que ganhas, quanto volta ao Estado quando
  gastas?»

### 3A-04 · Coerência da faixa — FEITO

- Cenário canónico: 1 500 € brutos nas três páginas — /salario dá
  líquido 1 166,83 €, /irs abre no coletável 16 413 € do mesmo bruto
  (calculado pelo motor no servidor), /trabalho abre com mensalidade
  996,81 €/mês por ~15 meses.
- Frases de nível 1 lidas «aos 14 anos»: /salario e /trabalho sem
  jargão; /irs usa «coletáveis» — o mínimo necessário, explicado na
  descrição da régua («o bruto menos a dedução específica e o mínimo
  de existência»). Se o dono preferir outra formula, é copy dele.
- `e2e/sessao-3a.spec.ts`: por rota — três níveis (h1 + Explora +
  Confirma como landmarks), UM instrumento + UMA frase, `.num-hero` no
  HTML sem JS (contexto `javaScriptEnabled: false`), detalhes fechados
  por omissão que abrem, pergunta seguinte navega, zero pageerror.
- Testes existentes ajustados à UI nova (só nas minhas rotas):
  - `e2e/smoke.spec.ts`: «calculadora de salário» e «talão carimba o
    domínio» — a régua é `input[range]`, move-se por teclado; «Líquido
    anual»/taxas agora dentro de `PaginaDetalhe` — o teste abre-os.
  - «a explosão do custo em /salario…» → reescrito como «o custo em
    /salario é um campo de cêntimos e reage à régua» (a explosão saiu
    por decisão do ficheiro de sessão).
  - «motor fiscal lazy» — `#situacao`/`#dep` já não existem: sai-se do
    canónico via `radio «Casado(a) · 2»` + botão «Dependentes — mais».
  - «simuladores novos»: idade em /trabalho é contador — clique no
    botão «— mais» em vez de `fill`.
  - `e2e/estados.spec.ts`: «/salario ao mínimo» — a cascata e a
    explosão saíram; as verificações do zero passaram para o
    `CampoCentimos` («0 c» na parte do IRS) e para o detalhe «O ano
    inteiro» aberto.
- Suite e2e NÃO corrida (é da sessão principal).

## Verificações corridas

- `npm run lint` ✓ (0 erros; 1 aviso pré-existente em postcss.config)
- `npm run typecheck` ✓ · `npm run test:unit` ✓ (353) ·
  `npm run validate:data` ✓
- `_hydra-check.mjs` nas três rotas × 1440/375 × dark/light: sem
  erros, sem warnings (nem o aviso de frase > 25 palavras).
- Screenshots 1440+375 full-page das três rotas em `.shots/3a-*.png`;
  vídeo das peças animadas (campo de cêntimos, anel, barra de traços,
  reimpressão do talão) em `.videos/`, fotogramas revistos em
  `.shots/3a-*-video-sheet.png`.
- Sem `build` nem `test:e2e` — gates pesados são da sessão principal.

## Decisões e pendências

- Strings novas hardcoded em PT-PT dentro dos componentes cliente das
  minhas rotas (padrão seguido: client components não leem pt.json; só
  as chaves existentes `m.salario.*`/`m.regua.*`/`m.pagina.*` foram
  usadas via props do servidor). Não acrescentei chaves a pt.json.
- `BarraTracos` do degrau: os meses 7+ usam tom «marca» (torrado =
  marco/limite) — «fica» para os seis primeiros. Alternativa seria
  dois tons de verde; a marca lê melhor o degrau.
- Motor em /irs: import estático no cliente (`contexto` e
  simuladores) — já era assim antes da sessão (os simuladores já
  viviam na página); o lazy-load é decisão específica de /salario.
- `pedidos/sessao-3a.md`: limpeza proposta — `Cascata`,
  `CustoExplodido` e o CSS `.decl-*` ficaram sem consumidores.
- Pendente para a sessão principal: `npm run build` + `test:e2e`
  completos; o sweep de overflow a 375 px e o audit lettering correm lá.
