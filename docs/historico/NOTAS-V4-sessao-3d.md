# NOTAS V4 — sessão 3D · O país e Aprender

> Ficheiro de trabalho da sessão 3D (worktree `aocentimo-sessao-3d`,
> branch `v4/o-pais`). Rotas: `/dados` `/aprender` `/aprender/[slug]`
> `/metodologia` `/sobre`. Registo de decisões, hipóteses conservadoras,
> copy a rever e gates. Não é contrato — o contrato é `docs/PRODUTO.md`.

## 3D-01 · /dados — «Como está Portugal hoje?» (2026-09-23)

**Feito.** A página migrada para `<Pagina>` com os três níveis
(`src/app/dados/page.tsx`).

- **Nível 1** — quatro leituras do país (IHPC homóloga, Euribor 12M,
  TAEG crédito pessoal com o teto de usura ao lado, taxa oficial dos
  Certificados de Aforro F), cada uma com fonte + data e estado de
  frescura; a frase simples fica em 19 palavras («A inflação está em
  3,6 % e a Euribor de um ano em 2,95 % — cada número com fonte e
  data.»). Cada leitura traz o equivalente textual («últimos 24 pontos
  entre …; último …»).
- **Nível 2** — o país em leituras por tema (PIB Eurostat, desemprego,
  preços DGEG, Euribor, TAEG vs teto) com janela temporal 1A/5A/Máx —
  codificações diferentes por tema, sem grelha de cartões iguais — e o
  calendário fiscal como `<AnelPontos>` de 12 meses. A próxima
  obrigação (out 2026) é destacada no anel e dita em texto («out 2026
  próximo prazo» + a lista textual do ano no equivalente).
- **O que ainda não conseguimos** — o painel das comissões bancárias
  mantém o peso: o BdP publica o comparador de ~200 instituições só na
  aplicação web, sem ficheiro/API estável; aponta para lá em vez de
  dados de segunda mão.
- **Nível 3** — `<details>` fechados por omissão: API aberta
  (`/api/index.json` e endpoints), fontes e frescura por série,
  legislação fiscal vigente (irs-2026, tabelas de retenção, IUC/IMI…).
- Não duplica os cartões do «Hoje em Portugal» da home — a home resume,
  aqui cada série ganha história, fonte e calendário.
- `fmtTrim()` local faz a ponte `YYYY-Tn` → `fmtPeriodo()` («3.º trim.
  2026»), sem períodos crus ao utilizador.

**Decisões (conservadoras):**

- Quatro leituras no nível 1 (o spec permite três ou quatro): IHPC,
  Euribor, TAEG e CA cobrem preços + dinheiro + crédito + poupança —
  uma por pergunta implícita, nenhuma decorativa.
- A TAEG aparece sempre ao lado do teto legal de usura — uma taxa sem
  escala é um número órfão.
- O anel fiscal mostra só obrigações de contribuintes singulares no
  continente; os prazos de empresas ficam fora (público-alvo).

## 3D-02 · /aprender e /aprender/[slug] (2026-09-23)

**Feito.** O glossário reorganizado pelas quatro perguntas e cada termo
com a estrutura `<Pagina>`.

- `src/app/aprender/conteudo.ts` (novo, só da rota) — `GRUPO_DE`
  atribui cada termo a uma pergunta **por decisão editorial explícita**
  (não derivada — onde um termo mora é leitura, não dado); `FRASE`
  (nível 1 ≤ ~25 palavras, todas verificadas: máx. 25); `EXEMPLO` para
  os 18 termos sem `exemplo` no glossário; `FICHA` com legislação/fonte
  por termo apontando para os `data/fiscal/*.json` reais e fontes
  oficiais (BPstat, Portal do Cliente Bancário, AT, DR, IGCP,
  Seg. Social). Termos que são conceitos (taxa real, salário real)
  dizem-no: «conceito, não lei» — a honestidade vale para a
  bibliografia.
- `src/app/aprender/PesquisaGlossario.tsx` (novo, `"use client"`) —
  pesquisa por subcadeia normalizada (NFD, sem acentos/maiúsculas) em
  memória sobre ~23 termos. **Zero dependências.** SSR serve a lista
  completa — sem JS lê-se tudo; o campo só filtra depois de hidratar.
  Contagem viva (`role="status"`), estado vazio com saída para
  sugestão via `/sobre`.
- `src/app/aprender/page.tsx` — `<Pagina>`: nível 1 = o mapa das quatro
  perguntas como instrumento (âncoras `ap-*` com contagens); nível 2 =
  pesquisa + lista completa, cada termo com definição e **exemplo**
  (`exemploDe`, não só `t.exemplo` — a frase do índice promete um
  exemplo por termo); nível 3 = «Como está feito este glossário» +
  «Falta um termo?». `faqPage` JSON-LD derivado do glossário.
- `src/app/aprender/[slug]/page.tsx` — `generateStaticParams` para os
  23 termos (`dynamicParams = false`); nível 1 = frase simples +
  exemplo com números (com `TermoRef` inline onde o exemplo menciona
  outros termos); nível 2 = `<MicroDemo>` (M-19) com a legenda
  `demo.alt` sempre visível — quem aprende lê o desenho E a frase;
  nível 3 = definição completa, legislação/fonte (`<Source>`) e termos
  relacionados. Pergunta seguinte percorre o glossário; no último termo
  cai em `/metodologia`. `definedTerm` JSON-LD por termo.
- `TextoComTermos` liga cada menção literal a outro termo via
  `mencoesEm()` — uma ligação por termo (o primeiro encontro chega).
  **Os relacionados não são escritos à mão**: nascem das menções
  literais — uma relação inventada seria um dado inventado.
- Todas as 23 rotas respondem 200; três `section.pg-nivel`, detalhes
  fechados, um `.pg-seguinte-lnk` em cada.

**Decisões (conservadoras):**

- «O país» fica com um só termo (IPC/IHPC): os números do país não são
  vocabulário, são dados — vivem em `/dados`. A `notaVazio` fica pronta
  se o grupo voltar a zero.
- O exemplo usa valores editoriais quando ilustra o conceito
  (mesmo estatuto de `demos.ts`); quando cita valores em vigor (IAS
  537,13 €; dedução específica 4 587,09 € = 8,54 × IAS; mínimo de
  existência 12 880 € = 14 × SMN; TSU 11 % + 23,75 %) os números saem
  dos `data/fiscal/` reais — verificados contra `irs-2026.json` e
  `ss.json`.
- `TermoRef` continua igual (componente congelado): só /aprender o usa,
  e continua a funcionar — ligação tracejada + definição ao foco.
- Categoria de cada termo segue a pergunta que o leitor faz, não a
  lei: «escalão de IRS» vive em «O que ganhas», «IVA» e «ISP» em «O que
  pagas», «IPC/IHPC» em «O país».

## 3D-03 · /metodologia e /sobre (2026-09-23)

**Feito.** Já estavam na linguagem V4 — verificado, não reescrito.

- `/metodologia` — o quadro vivo de frescura com `<OrbeEstado>` por
  série, ordenado por urgência (a que está mais perto do limite
  primeiro — `.qcell-limite` marca-a) e as «Limitações honestas» no
  fim. Cada célula tem o orbe + o estado em texto.
- `/sobre` — a página mais contida do site, como pedido: quem faz,
  porquê, contacto (GitHub Issues) e repositório, sem instrumento nem
  animação. As promessas cumprem-se — os links existem e são reais.
- `/estilo` intocado — é da Sessão 1/4.

## 3D-04 · Coerência da faixa (2026-09-23)

**Feito.** `e2e/sessao-3d.spec.ts` (novo, ~140 linhas) — **escrito, não
corrido** (o e2e é gate pesado da sessão principal).

- Três níveis (`section.pg-nivel` = 3, `details.pg-detalhe` sem `open`,
  `.pg-seguinte-lnk` com href) em `/dados`, `/aprender` e **todas** as
  rotas `/aprender/[slug]` — a lista deriva de `GLOSSARIO`, nunca
  escrita à mão.
- `visitaLimpa()` regista `pageerror` por rota e falha no fim — zero
  erros de página.
- `/aprender`: as quatro âncoras `ap-{ganhas,pagas,banco,pais}`, um
  link por termo, e a pesquisa («tsu» filtra, texto absurdo esvazia).
- `[slug]` (amostra `deducao-coleta`, `isp`, `euribor`, `taxa-real` —
  os quatro grupos, todos com menções literais confirmadas):
  `figure.mdemo` no nível 2, ficha no nível 3 e glossário inline
  dentro dos detalhes.
- `/metodologia`: `.quadro-vivo .qcell` > 0, um svg (orbe) por célula,
  «Limitações honestas» visível. `/sobre`: repositório e contacto
  reais.

### Percurso aos 12 anos — o que se percebe e o que fica a rever

Percorrido o glossário inteiro renderizado. Cada frase de nível 1 lê-se
sem saber outro termo — **depois de três correcções feitas nesta
sessão**:

- `deducao-especifica`: «…8,54 vezes o IAS» → «…cerca de 4 587 € por
  ano» — IAS é sigla sem glossário; o número concreto lê-se melhor e é
  real (`irs-2026.json` → `deducaoEspecificaFixa`).
- `mtic`: «quanto a casa custa» → «quanto o crédito custa» — o MTIC
  aplica-se a qualquer crédito, não só à casa.
- `iva`: «13 % na restauração» → «13 % nos restaurantes» — registo
  falado.

**Ainda difícil (registado, não mexido — copy do dono):**

- `euribor`: «crédito de taxa variável» pressupõe saber o que é taxa
  variável. Alternativa se o dono quiser: «no crédito em que a taxa
  muda».
- `retencao-capitais` usa «fisco»; `ppr` usa «resgate»; `englobamento`
  usa «mais-valias» no exemplo — palavras adultas, todas explicadas na
  definição completa (nível 3).
- `rendimento-relevante` pressupõe saber o que é «faturar» como
  independente — o exemplo (10 000 € → conta 7 000 €) resolve na
  prática.
- As siglas-próprias (TAEG, TAN, MTIC, IHPC…) são o objecto da página —
  cada frase diz o que a sigla é, não a expande letra a letra.

**Copy novo a rever pelo dono:** todo o `conteudo.ts` (`FRASE`,
`EXEMPLO`, `FICHA`, `GRUPO_DE`), as 20 chaves novas de `m.aprender.*` em
`messages/pt.json`, os títulos «O que é «X»?» e o copy dos detalhes
«Como está feito este glossário» / «Falta um termo?».

**Perguntas ao dono:**

- `FRASE`/`EXEMPLO`/`FICHA` vivem em `conteudo.ts` da rota — se fizerem
  sentido como campos do `Termo` (ex.: `t.frase`, `t.ficha`), mudam-se
  para `src/content/glossario.ts` sem custo; ficaram na rota para não
  tocar no conteúdo partilhado.
- «O país» tem um só termo — há mais vocabulário estatístico a
  acrescentar (deflação? PIB per capita?) ou fica assim por decisão?
- O link «Falta um termo?» aponta para `/sobre` (contacto por Issues) —
  suficiente, ou quererás um mailto/template de issue?

## Verificação visual (2026-09-23)

Screenshots via `.shots/_shots-3d.mjs` (ficheiro ignorado) contra o dev
server em :3006 — 1440 e 375 px, claro e escuro, topo e fundo:

- `/dados`, `/aprender`, `/aprender/{euribor,escalao-irs,ipc-ihpc,tsu}`,
  `/metodologia`, `/sobre` — todos renderizados sem `pageerror` nem
  aviso de hidratação (verificado também em browser real:
  `/inflacao` `/precos` `/aprender` `/aprender/euribor` `/dados` limpos).
- Sem peças animadas novas nesta sessão → sem vídeo `_video.mjs`
  necessário (as micro-demos são CSS puro; `MicroDemo` não usa GSAP).

## Gates (2026-09-23)

- `npm run lint` — verde; 1 warning pré-existente
  (`postcss.config.mjs` import/no-anonymous-default-export), fora das
  minhas rotas, não mexido.
- `npm run typecheck` — verde.
- `npm run test:unit` — 27 ficheiros, 353 testes, verde.
- `npm run validate:data` — verde; 68 séries em dia.
  **Efeito colateral:** o gate reescreve `data/meta/freshness.json`
  (só o `verificadoEm`) — diff visível mas gerado, não editorial.
- `npm run build` e `npm run test:e2e` — **não corridos**: gates
  pesados da sessão principal (regra da sessão).

## Estado do worktree

Modificados: `src/app/dados/page.tsx`, `src/app/aprender/page.tsx`,
`src/app/aprender/[slug]/page.tsx`, `messages/pt.json` (só o namespace
`aprender`), `data/meta/freshness.json` (carimbo do gate).
Novos: `src/app/aprender/conteudo.ts`,
`src/app/aprender/PesquisaGlossario.tsx`, `e2e/sessao-3d.spec.ts`,
`NOTAS-V4-sessao-3d.md`.
Zero alterações a `globals.css`, componentes partilhados, `/estilo`,
`referencias/` — e zero commits. Nada foi feito no repo principal.
