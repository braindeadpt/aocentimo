# NOTAS-NOITE — registo do pack da noite

Registo contínuo das 22 tarefas do PACK-NOITE: dúvidas, hipóteses
conservadoras, copy proposta a rever, medições. Ordem: M-01 → M-22.

---

## M-01 · matéria (rasgo determinista, papel, perfuração, sombra)

**Entregue**

- `src/lib/materia.ts` — PRNG mulberry32 próprio (`prng`), semente estável
  derivada de valor (`sementeDe`), rasgo por pontos (`arestaRasgadaPts` /
  `arestaRasgada`), silhueta fechada (`pecaRasgada`), furos regulares
  (`furos`), sombra por peça (`sombraPeca`), profundidade útil
  (`profundidadeRasgo`). Coordenadas a 1 casa decimal; `-0` normalizado.
- `src/components/Papel.tsx` — `PapelDefs`: superfície em camadas
  (base + tom + fibra + espessura) por `<pattern>` e gradientes — sem
  `feTurbulence`/`feGaussianBlur` na tinta (re-pintam por frame).
- `src/components/PecaPapel.tsx` — pedaço arrancado completo: silhueta
  rasgada nas duas pontas, furos por **máscara** (o fundo da página vê-se
  — demonstrado com a faixa torrada por trás em `/estilo`), sombra
  derivada de ângulo+altura.
- `src/lib/materia.test.ts` — 17 testes: determinismo, limites, forma,
  espaçamento de máquina, variação de sombra.
- `/estilo` — secção "Matéria — papel, rasgo, perfuração" com demos
  vivas: rasgo a 100 %/400 %, perfuração com fundo a ver-se, queda com
  sombras por peça, regras escritas.
- `globals.css` — `--talao-paper`/`--talao-ink` subiram de `.talao` para
  `:root` (a matéria vive fora do talão). Papel fixo nos dois temas por
  decisão: é o mesmo objecto físico.

**Decisões / hipóteses conservadoras**

- Rasgo em cima **e** em baixo por defeito (`rasgoTopo`/`rasgoFundo`
  permitem desligar) — um pedaço arrancado da fita separa-se nas duas
  pontas; laterais rectas porque são as bordas da fita cortada à máquina.
- Filtros CSS de sombra só em elementos estáticos; o que anima usa
  transform/opacity (orçamento escrito no cabeçalho de `materia.ts`).
- Sobreposição de .5px entre formas adjacentes para eliminar costuras
  de subpixel (arredondamento a 1 decimal cria folgas de renderização).

**Screenshots** — `.screenshots/M-01/`: antes/depois × {dark,light} ×
{1440,375} + zoom da secção.

**Copy a rever pelo dono** — secção "Matéria" em `/estilo`: texto de
abertura ("A linguagem material do site é o talão…") e as cinco regras
da lista final.

**Incerteza** — nenhuma pendente.

---

## M-02 · gramática de movimento

**Entregue**

- Gramática escrita em `docs/PRODUTO.md` §Motion e demonstrada em
  `/estilo` (tabelas de tokens ao vivo + MotionDemo).
- Quatro durações: `--dur-micro` 120ms (responde), `--dur-curta` 320ms
  (muda de estado), `--dur-media` 600ms (explica), `--dur-longa` 1200ms
  (orquestra). Três curvas + linear: `--ease-entra`, `--ease-sai`,
  `--ease-rasgo`, `--ease-lin` (só o ticker). Um escalonamento:
  `--stagger` 90ms.
- Varredura completa: os tokens antigos (`--dur-res/mov/in`, `--ease`)
  e TODOS os literais (0.15s, 0.25s, 0.28s, 0.45s, 0.8s, 60/90/110/130/
  140ms, duration-300, cubic-bezier avulsos, 55s) substituídos pelos
  tokens. `Spark atraso` passou de ms a índice de stagger (callers
  0/1/2/3).
- Reduced-motion reforçado: kill universal `animation:none !important`
  — uma animação nova nasce coberta, não precisa de opt-out listado.
  Overrides explícitos dos estados armados por JS (`.spark-armed`
  repõe dashoffset/área no estado final).
- Teste e2e novo: percorre TODAS as rotas derivadas com
  `reducedMotion:'reduce'` e falha se algum elemento tiver
  animation-name≠none ou transition-duration>0.

**Decisões**

- O escalar `--stagger` é o mesmo para irmãos e para os dígitos do
  odómetro (já era 90ms — confirmou a escolha).
- O ciclo do ticker (`--dur-ticker` 55s) é velocidade de loop contínuo,
  fora da escala — documentado como tal.
- Atrasos inline passaram a `calc(i * var(--stagger))` — o token fica
  na casca CSS, os componentes passam só o índice.

**Mutação** — sem `animation:none` universal, o teste falha com
`ticker-scroll`, `kin-up`, `fluxo-cresce` na home. Restaurado.

**Copy a rever** — texto da secção "Movimento — a gramática" em
`/estilo` e a tabela §Motion de PRODUTO.md.

**Screenshots** — `.screenshots/M-02/depois-*` (o "antes" é o estado
de `/estilo` nos shots de M-01).
