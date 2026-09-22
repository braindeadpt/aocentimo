# NOTAS V4 — registo de trabalho da fundação

> Documento de trabalho local da V4 (sessões do plano em
> `referencias/V4/`). Dúvidas, hipóteses conservadoras e copy a rever,
> por tarefa. Não é contrato — o contrato é `docs/PRODUTO.md`.

## S1-01 · Uma só verdade nos documentos (2026-09-22)

**Feito.** PRODUTO.md reescrito como verdade única (V3 resumida em §3 com
referência a `DIRECAO-V3.md`; V4 em §4–§5: unidade, três níveis, quatro
perguntas, catálogo de codificações em tabela); DIRECAO-V3.md com
cabeçalho «integrada a 2026-09-22»; AGENTS.md com as rotas reais de
`src/app/` e a regra da dobra exacta; DECISOES.md com a entrada V4 e as
perguntas do relatório §7; SKILL.md com as regras visuais V4.

**Decisões tomadas (hipótese conservadora, a confirmar pelo dono):**

- **Componentes que não existem ainda** (`CampoCentimos`, `Haltere`,
  `BarraTracos`, `AnelPontos`, `Isometrico`, `OrbeEstado`, `Cartao`,
  `Pagina`) estão marcados «a construir, S1-xx» no catálogo do PRODUTO —
  o catálogo descreve o contrato, não o inventário.
- **Nav:** o código tem hoje uma lista plana de 11 itens
  (`SiteNav.tsx`); o PRODUTO regista as quatro perguntas como alvo V4
  (S1-07), com nota explícita de que ainda não está implementada — não
  se apagou a descrição do estado actual.
- **Rotas removidas dos docs** (`/emprego`, `/habitacao`, `/economia`):
  revertidas em 86a9830 e não existem em `src/app/`; saíram do AGENTS e
  do PRODUTO. As séries Eurostat associadas continuam no pipeline de
  dados (não se mexeu).
- **«radius 0 em todo o lado»** substituído pelo «raio com significado»
  (papel 0 · instrumento 14 px · controlos pílula) — o código já tinha
  cartões a 14 px; a regra antiga é que estava errada. Tokens formais
  (`--raio-*`) ficam para S1-03.
- **«Space Mono para todos os números»** corrigido para «heróis em
  Archivo tabular; mono só em rótulos/kickers/tabelas» — alinha o doc
  com a regra V4 e prepara o defeito C2 de S1-02. **Pendente:** verificar
  que a Archivo instalada tem `tnum` (S1-02 §2); se não tiver, propor
  alternativa.
- **Tabela de instrumentos → a11y** do PRODUTO antigo listava
  componentes revertidos (`Mostrador`, `Multiplos`, `Calendario`,
  `Barras`, `Declive`, `Catalogo`, `Glifo`, `Manchete`). Reescrita só
  com o que existe em `src/components/` hoje.

**Copy novo a rever pelo dono:** nenhum texto novo virado ao utilizador
— só documentação interna.

**Perguntas ao dono:** registadas em `docs/DECISOES.md` → «Perguntas ao
dono» (C7 vídeos de terceiros; moeda de pontos na home; história
canónica com TSU; protótipo da moeda).
