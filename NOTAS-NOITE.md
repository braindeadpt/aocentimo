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
