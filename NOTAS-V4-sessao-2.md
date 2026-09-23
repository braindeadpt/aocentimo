# NOTAS-V4 — Sessão 2 (home)

Worktree `aocentimo-sessao-2` · branch `v4/home` · porta 3102.
Brief: `referencias/V4/02-SESSAO-2-HOME.md`.

## Ordem da home (S2-04)

herói (moeda) → «Hoje em Portugal» → «Escolhe a tua pergunta» →
faixa final. Nada mais. Um h1, secções com h2.

## S2-01 — herói «a moeda de 100 cêntimos»

- `src/app/_home/HeroMoeda.tsx` (servidor) + `HeroMoedaCliente.tsx`
  (cliente) + `hero-moeda.css` co-localizado (importado pelo wrapper —
  decisão do dono: sem CSS novo em `globals.css`).
- Reaproveita `CampoCentimos`: estado inicial `moeda`, revelado
  `montes`; quatro partes (TSU da empresa · IRS retido · Segurança
  Social · o que chega à conta) da grelha canónica
  (`data/derived/cenarios-salario.json`, 103 pontos — S1-09).
- h1 SSR puro com o custo canónico (LCP, sem animação de entrada);
  `<details>` com a resposta completa sem JS; equivalente textual
  único via `equivalente` do campo + `data-cc-equivalente`.
- Palpite por `Regua` (0–100 c); bruto por `Regua` com `pontos` na
  grelha canónica — nunca interpola. Ao mínimo (920 €) o IRS fica a
  0 e o rótulo diz «não te toca» (`home.hero.zero`).
- O veredicto só fala depois de os montes assentarem — detectado por
  MutationObserver sobre `.cc-rot.on` (pedido de API pública registado
  em `pedidos/sessao-2.md`).

## S2-02 — «Hoje em Portugal»

- `cartoesHome()` em `src/lib/paineis.ts` revisto: inflação linha
  anotada (pico + mediana 10 anos) · desemprego `tracos` («de cada 100
  pessoas ativas» — 1 traço = 1 pessoa, nunca pontos) · Euribor 12M
  linha anotada com o evento BCE mais recente da janela
  (`data/fiscal/eventos.json`, fallback = mínimo factual) · gasóleo
  `pontos` = odómetro do dia + haltere a 30 dias (só com ponto real a
  25–45 dias — senão falha honesta) · PIB linha (mínimo COVID) ·
  habitação `tracos` (trimestres seguidos).
- `painel.desemprego100` e `painel.delta30dias` novos em `pt.json`;
  `painel.isoGasoleo` removido.

## S2-03 — «Escolhe a tua pergunta»

- `src/app/_home/EscolhePergunta.tsx` + `portas-previews.tsx` +
  `portas.css` co-localizado. Quatro cartões-porta (`/salario`,
  `/impostos`, `/credito`, `/dados`) com rótulos de `m.nav` — nunca
  paráfrase da navegação.
- Mini-prévias com dados reais do build: recibo canónico · talão com
  IVA real (`iva.json` + `ivaContido`) · prestação real
  (`simularPrestacao`, defeitos de /credito: 200 000 € · 30 anos ·
  spread 1 % · Euribor 3M mais recente; falha da série = frase
  honesta) · grelha de orbes com o estado real de `painel.json`.
- Inversão para papel em CSS puro (`--pq-*`, técnica das `--l-*` do
  `.leitura`): foco sempre, hover só onde hover existe; reduced-motion
  corta tudo — estado base é o final.

## Integração (orquestrador)

- `page.tsx` reescrito: quatro blocos, JSON-LD mantido, faixa final
  = manifesto curto + ligações a `/metodologia` e `/api/index.json`.
- Strings provisórias (`*.strings.ts`) migradas para `pt.json` sob
  `home.hero`/`home.portas` e os ficheiros apagados; nenhum componente
  cliente importa `pt.json` nem `data/*.json` — tudo por props.
- CSS importado nos wrappers servidores (`import "./hero-moeda.css"`,
  `import "./portas.css"`).
- Teste obsoleto do `smoke.spec.ts` (explosão do euro na home)
  substituído pelo contrato de ordem da home V4.

## Copy nova — PROPOSTA, a rever pelo dono

Todo o texto novo de `home.hero` e `home.portas` (incl. frases dos
cartões, veredictos do palpite e equivalentes textuais) é proposta da
sessão — a publicação editorial fica com o dono do repo.

## S2-05 — decisões do dono sobre a copy (23.09.2026)

De `referencias/V4/REVISAO-COPY-SESSAO-2.md`, aplicadas:

- **«O banco»**: «capital — fica teu» → «capital — abate à dívida»; a
  cor do capital passa a neutra (`--pq-ink2`) — `--keep` é só para o
  que fica contigo e `--accent` fica do juro. `--pq-keep` ficou sem
  uso e foi removida da folha.
- **«O que pagas»**: o cabaz com preços inventados saiu — a Regra nº1
  não tolera exemplos sem fonte. O talão passa a 1 L de gasóleo + 1 L
  de gasolina 95 ao PMD do dia (DGEG, `pmd-gasoleo-diario` /
  `pmd-gasolina95-diario`), IVA a 23 % (Continente, de `iva.json`)
  separado do preço por `ivaContido`, com fonte e data carimbadas
  (`{fonte} · {quando}` — se as datas das duas séries divergirem, o
  talão mostra as duas). Série em falha → frase honesta (`falhou` /
  `fraseSemSerie`), nunca um número. A frase da porta —
  «Num litro de gasóleo a {preco}, {iva} são IVA — o talão separa o
  imposto do preço» — é **PROPOSTA** (sugestão da própria revisão).
- **Recibo**: «SEG. SOCIAL 11 %» com espaço fino U+202F (lettering 1B-02).
- **Estados**: «sem SLA» → «sem prazo», só em `home.portas` — o
  `semSla` partilhado fica para a Sessão 4.
- Todo o resto da copy da sessão: **aprovado** pelo dono.
