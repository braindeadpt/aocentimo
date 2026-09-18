# PLANO MASTER — Literacia Financeira PT

> **Estado: HISTÓRICO — este documento não é contrato de trabalho.**
>
> Escrito em 2026-09-16; última alteração em git 2026-09-17.
> Declaração original, hoje caduca: «Documento canónico de planeamento.
> Estado: aprovado para desenho, pré-implementação. Última revisão:
> 2026-09-16.»
>
> Decisão central: o plano master do produto — visão, fontes oficiais,
> arquitetura «dados como código», motores puros e roadmap por fases.
>
> Superado por: decisão do dono de 2026-09-17 — direção escuro-por-omissão
> «instrumento vivo», que substitui o §9 («light-first papel»); e pelo
> código real, que revogou partes dos §§4–7 — o hosting é export estático
> (`output: "export"`, não Vercel/ISR), os gráficos são SVG à medida (não
> ECharts), o glossário é TS tipado (não MDX), as strings vivem em
> `messages/pt.json` via `src/lib/messages.ts` (não next-intl) e as rotas
> reais incluem `/casa`, `/irs`, `/trabalho` e `/dados`, que aqui não
> existem.
>
> Porquê: o entendimento do produto passou de «observatório documental em
> papel» para «instrumento vivo de leitura do próprio dinheiro» — e a stack
> executada divergiu da planeada em pontos que este texto continua a
> afirmar.
>
> O que permanece verdade: a regra nº1, os princípios de produto (§2), as
> fontes oficiais (§5), o modelo de dados (§6) e os motores puros (§8)
> descrevem o sistema construído — lêem-se como registo, não como contrato.
>
> Direção em vigor: decisão do dono de 2026-09-17 — escuro por omissão,
> «instrumento vivo»; o talão de `/salario` é o único artefacto de papel.
> O documento canónico que a regista está a ser escrito.

---

## 1. Visão

Site público e gratuito de literacia financeira para Portugal que responde, com
dados oficiais e simuladores rigorosos, às perguntas que nenhum site português
responde hoje de forma integrada:

- Para onde vai o meu salário? (bruto → líquido, SS, IRS, custo para a empresa)
- Quanto subiu o que eu compro? (inflação por categoria e produto, em % e em €)
- Quanto do preço é imposto? (IVA, ISP, cascata ISP+IVA, taxas na fatura)
- O que é a Euribor e porque subiu a minha prestação? (spread, TAN, MTIC, TAEG)
- Onde rende mais o meu dinheiro? (Certificados de Aforro vs depósitos vs inflação)

**Fio condutor:** seguir 1 € do salário bruto até ao fim do mês e mostrar quem
fica com o quê — Estado, banco, seguradora, supermercado.

**Posicionamento:** observatório + calculadoras de referência. Não é agregador de
notícias, não é comparador comercial, não dá conselhos financeiros. Afirmação de
produto: *"único em Portugal"* — hoje não existe um site que cruze inflação
oficial, decomposição fiscal de preços, carga salarial e juros de crédito/poupança
num só lugar com fontes citadas.

---

## 2. Princípios não negociáveis

1. **Nunca inventar números.** Se uma fonte falha, mostra-se a falha (`—`,
   "indisponível", aviso de série atrasada) — nunca um valor inventado.
2. **Cada número tem fonte + data.** Todo o dado exibido carrega fonte oficial
   clicável e timestamp da série/recolha.
3. **Neutralidade.** Factos e aritmética, não opinião política. "A carga fiscal
   é X%" é facto; "é justa" é opinião do leitor.
4. **Linguagem simples.** O público-alvo não sabe o que é a Euribor. Cada termo
   técnico tem glossário próprio com exemplo numérico.
5. **PT-PT europeu.** Nunca "usuário", "tela", "você", "portfólio" (é portefólio).
6. **Sem aconselhamento.** Disclaimer permanente; conteúdo fiscal remete para
   contabilista certificado quando aplicável.
7. **Regras fiscais versionadas por ano.** Um escalão de 2024 ≠ 2026; o site
   mostra sempre "regras em vigor em [ano]" com entrada em vigor.

---

## 3. Identidade & naming

Nome final: **AO CÊNTIMO** — «seguimos o teu dinheiro ao cêntimo». O projeto
cresceu para além do salário (impostos, inflação, crédito, casa, poupança,
preços) e a unidade que atravessa todos os módulos é o cêntimo. Domínio de
lançamento: `aocentimo.js.org` (subdomínio comunitário gratuito para projetos
open source no GitHub Pages). `aocentimo.eu.org` pedido em paralelo como
zona DNS própria futura.

Marca: o C do wordmark é o sinal de cêntimo — ¢ — cortado por uma haste
verde («o que é teu»). Histórico: começou como **BRUTO** (o conceito
«ganho X brutos», a primeira palavra do pipeline) — o nome mudou quando o
âmbito alargou.

Tagline: *"Seguimos o teu dinheiro ao cêntimo."*

Decisão final de nome: **fechada — AO CÊNTIMO** (2026).

---

## 4. Arquitetura técnica

### 4.1 Decisões

| Camada | Escolha | Porquê |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SEO (literacia vive de pesquisa Google), ISR, portfolio-standard |
| Hosting | **Vercel free tier** | €0, deploy por push, ISR sem servidor gerido |
| Base de dados | **Nenhuma — "dados como código"** | Séries são read-only e pequenas; JSON versionado na repo é auditável, grátis, sem downtime |
| Pipeline | **GitHub Actions cron** → fetch → validar → commit → deploy | Automação total, custo €0 (minutos gratuitos chegam) |
| Regras fiscais | **JSON manuais versionados por ano** em `data/fiscal/` | Não há API para OE/escalões; input humano anual é correto e defensável |
| Gráficos | **Apache ECharts** | Melhor para séries financeiras densas (brush, tooltip rico, export) |
| Estilo | **Tailwind CSS 4 + design tokens** (CSS custom props) | Velocidade + tokens próprios para não parecer template |
| Conteúdo | **MDX** para glossário/artigos | Autor único, versionado em git |
| i18n | **PT-PT apenas** (strings em `messages/pt.json` via next-intl) | Futuro-proof sem custo presente; EN só se fizer sentido |
| Testes | **Vitest** (motores + parsers) + **Playwright** (smoke) + **zod** (contratos de dados) | Ver §11 |
| Lint | ESLint + Prettier + TypeScript strict | — |

### 4.2 Porque não Supabase

Projeto pessoal + "tudo grátis" + máxima automação: uma BD adiciona estado,
custo de manutenção e o free tier pausa projetos inativos. Todos os dados são
read-only e derivados de fontes públicas — o pipeline regenera-os. Se no futuro
houver contas de utilizador ou dados gerados pelo site (ex. monitor de preços
próprio com milhões de pontos), reavaliar — nessa altura Supabase volta à mesa.

### 4.3 Estrutura de pastas (alvo)

```
├── docs/                        # este plano + decisões (ADR)
├── .agents/skills/              # skills canónicas (junctions em .devin/.claude/.github)
├── src/
│   ├── app/                     # App Router, rotas do §7
│   ├── components/              # UI + charts + simuladores
│   ├── lib/
│   │   ├── engines/             # irs.ts, seg-social.ts, prestacao.ts, taeg.ts (puros, testados)
│   │   ├── data/                # loaders tipados (zod) sobre data/
│   │   └── format.ts            # €, %, datas PT-PT
│   └── content/                 # MDX: glossário, artigos
├── data/
│   ├── sources/                 # séries brutas ingeridas (eurostat/, dgeg/, bpstat/, igcp/)
│   ├── derived/                 # variações calculadas, agregados
│   ├── fiscal/                  # irs-2025.json, irs-2026.json, iva.json, ss.json, tsu.json...
│   └── meta/sources.json        # fonte, url, fetchedAt, freshness por dataset
├── scripts/
│   ├── ingest/                  # eurostat.ts, dgeg.ts, bpstat.ts, igcp.ts
│   ├── derive/                  # variações, cabazes, poder de compra
│   └── validate/                # contratos zod + freshness report
├── messages/pt.json
└── .github/workflows/           # ingest-daily.yml, ingest-monthly.yml, ci.yml
```

---

## 5. Fontes de dados — endpoints exatos

### 5.1 Eurostat (núcleo da inflação)

REST JSON-stat 2.0, gratuito, sem chave:
`https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{DATASET}?format=JSON&geo=PT&lang=PT&coicop=...`

| Dataset | Conteúdo | Frequência |
|---|---|---|
| `prc_hicp_midx` | IHPC índice (2015=100) | mensal |
| `prc_hicp_manr` | variação homóloga % | mensal |
| `prc_hicp_mmor` | variação mensal % | mensal |

Códigos COICOP a ingerir (granularidade de "produto" em índice):

```
CP00 total · CP01 alimentação · CP0111 pão/cereais · CP0112 carne
CP0113 peixe · CP0114 leite/queijo/ovos · CP0115 óleos e gorduras (azeite!)
CP0116 fruta · CP0117 legumes · CP0118 açúcar/doces
CP02 álcool/tabaco · CP03 vestuário · CP04 habitação/água/energia
CP045 eletricidade+gás · CP05 mobiliário · CP06 saúde · CP07 transportes
CP0722 combustíveis · CP08 comunicações · CP09 lazer · CP10 educação
CP11 restaurantes/hotéis · CP12 diversos
NRG energia (agregado) · FOOD alimentação (agregado)
TOT_X_NRG_FOOD subjacente
```

Bónus grátis: o mesmo endpoint com `geo=EA20` dá a média da Zona Euro para
comparar Portugal vs Europa sem custo extra.

### 5.2 INE — IPC nacional

`https://www.ine.pt/ine/json_indicador/pindica.jsp?op=2&varcd={CÓDIGO}&Dim1=T&lang=PT`

Códigos `varcd` a descobrir na Base de Dados do INE (Preços no consumidor) na
fase de ingestão — documentar cada código usado em `data/meta/sources.json`.
Uso: validação cruzada com Eurostat (IPC nacional ≠ IHPC; explicar a diferença
é conteúdo de literacia por si só).

### 5.3 Banco de Portugal — BPstat (Euribor e taxas)

API pública: `https://bpstat.bportugal.pt/api/v2/...` (domains/series, JSON).
Séries-alvo: Euribor 1M/3M/6M/12M, taxas de juro de novos créditos habitação,
taxas de depósitos. IDs das séries a validar na ingestão e registar em
`data/meta/sources.json`. Alternativa documentada: EMMI/euribor-ebf para
série oficial da Euribor.

### 5.4 DGEG — combustíveis em €/litro

Portal `precoscombustiveis.dgeg.gov.pt`: API JSON própria (alimenta o portal:
preços médios diários por combustível e por concelho/posto) + exportação CSV
nas "Estatísticas" (histórico semanal desde ~2004). Endpoints a validar na
fase de ingestão; registar em `sources.json`. É a única fonte com variação
**diária/semanal** real.

### 5.5 Fiscal — dados manuais versionados (por natureza)

Não há API para legislação. JSON por ano em `data/fiscal/`, compilados do
Diário da República / AT / OE, com `fonte`, `vigência` e `publicadoEm`:

| Ficheiro | Conteúdo |
|---|---|
| `irs-AAAA.json` | escalões art. 68.º CIRS + taxas, tabelas de retenção na fonte (simplificadas: solteiro/casado único/casado dois titulares, n.º dependentes), mínimo de existência, deduções específicas |
| `ss.json` | TSU trabalhador 11 %, entidade patronal 23,75 %, taxas especiais |
| `iva.json` | taxas 6/13/23 % + listas I/II por categoria de produto |
| `isp.json` | ISP por combustível (€/L) + carbono; base para a cascata ISP→IVA |
| `smn.json` | salário mínimo nacional por ano (série histórica) |
| `ca.json` | Certificados de Aforro: série, taxa base, prémios (fonte IGCP, mensal) |
| `capitais.json` | tributação rendimentos de capitais (28 %, englobamento) |

### 5.6 Complementares

- **IGCP** — taxas Certificados de Aforro / Tesouro (publicação mensal; scrape leve ou manual JSON)
- **ERSE** — tarifas reguladas eletricidade/gás (tarifários anuais; manual JSON)
- **Open Prices** (prices.openfoodfacts.org) — preços crowdsourced por produto; complemento, não base
- **APIs internas de supermercados** — Fase 3+ apenas, com avaliação ToS própria; nunca fonte principal

### 5.7 Verdades incómodas a mostrar no site (metodologia)

- Inflação oficial = **índice**, não ticket de caixa; cabaz oficial ≠ o teu cabaz.
- Sem dados oficiais diários/semanais de bens essenciais — só combustíveis.
- IPC nacional (INE) ≠ IHPC (Eurostat) — explicar no glossário.

---

## 6. Modelo de dados

Formato canónico de qualquer série ingerida (`data/sources/**/*.json`):

```json
{
  "meta": {
    "id": "hicp-pt-cp0115",
    "fonte": "Eurostat",
    "dataset": "prc_hicp_midx",
    "url": "https://ec.europa.eu/eurostat/api/...",
    "unidade": "indice_2015_100",
    "recolhidoEm": "2026-09-16T04:00:00Z",
    "serieAte": "2026-08"
  },
  "series": [{ "t": "2020-01", "v": 101.3 }]
}
```

Derivados calculados no pipeline (não na fonte): variação mensal/homóloga/
12-meses/acumulada desde data-base, equivalente em poder de compra, peso do
imposto por produto. Tudo validado por zod no ingest e no build.

`data/meta/sources.json` alimenta o selo de frescura: cada página mostra
"dados até {mês}, fonte {X}, atualizado em {data}".

---

## 7. Módulos & rotas

| Rota | Job |
|---|---|
| `/` | "O teu euro, seguido": hero com os 4 números do mês (inflação, Euribor, SMN, gasóleo) + entrada para cada módulo + 3 leituras curtas |
| `/inflacao` | IPC/IHPC por categoria com drill-down COICOP, gráficos longos, comparador PT vs Zona Euro, **calculadora de poder de compra** ("1000 € em 2015 = ?") |
| `/precos` | Combustíveis em €/L (diário/semanal/mensal/anual) + decomposição do preço (custo+ISP+IVA); placeholders honestos para o resto |
| `/impostos` | IVA por produto ("deste litro de leite, X cêntimos são IVA"), cascata ISP+IVA na gasolina, taxas escondidas na fatura de eletricidade |
| `/salario` | **Calculadora bruto→líquido** (SS 11 %, retenção, escalões, subsídios 14 meses, casado/dependentes), custo total para a empresa (TSU 23,75 %), escalões visualizados, carga efetiva vs marginal |
| `/credito` | Euribor histórica interativa, o que é spread/TAN/TAEG/MTIC, **simulador de prestação** (sistema francês), impacto de ±1 % na Euribor |
| `/poupanca` | Certificados de Aforro (séries e taxas), depósitos vs CA vs inflação, tributação 28 %, comparador "10 000 € a 10 anos" |
| `/aprender` + `/aprender/[slug]` | Glossário (~40 termos) + artigos MDX do autor |
| `/metodologia` | Fontes, frescura, limitações, licenças — transparência total |
| `/sobre` | Autor, propósito, contacto |

Futuro (fora do MVP): monitor próprio de preços de supermercado, comparador
de portefólio fiscal, newsletter.

---

## 8. Simuladores — especificação matemática

### 8.1 Salário líquido (`engines/irs.ts`)

- Inputs: bruto mensal, estado civil, titulares, dependentes, subsídios (14 ou duodécimos), ano fiscal.
- Pipeline: bruto ×14 → retenção na fonte mensal (tabela do JSON do ano) → SS 11 % → líquido mensal/anual.
- Vistas: waterfall bruto→líquido; custo para a empresa = bruto ×1,2375; taxa efetiva vs marginal; posição nos escalões; comparação "se ganhasses +100 €".
- Casos golden de teste validados contra simulador oficial (Dr. Finanças/AT) — ver §11.

### 8.2 Prestação crédito habitação (`engines/prestacao.ts`)

- Sistema francês: `P = C · i / (1 − (1+i)^−n)`, `i = (Euribor + spread)/12`.
- Inputs: capital, prazo, Euribor (prazo 3M/6M/12M) ou TAN direta, spread.
- Outputs: prestação, juro total, MTIC, tabela de amortização, cenário Euribor ±1 p.p.

### 8.3 Comparação de poupança (`engines/poupanca.ts`)

- Juro composto com tributação 28 % sobre rendimentos (ou englobamento).
- "Real vs nominal": deflacionar pela inflação observada (IHPC) — *"o teu depósito a 1,5 % com inflação a 3 % perde X €/ano de poder de compra"*.

### 8.4 Decomposição de preço (`engines/impostos.ts`)

- Gasóleo/gasolina: preço s/ IVA − ISP − biocombustíveis/distribuição → % imposto total; cascata "IVA cobrado sobre ISP".
- Bens: preço / (1+IVA) → parcela imposto.

Todos os motores são **funções puras sem dependências de UI** — testáveis em
isolamento, reutilizáveis em scripts.

---

## 9. Direção de design — "sem cara de IA"

Referência estética: **broadsheet financeiro português moderno** — o cruzamento
de um jornal de economia com um documento de referência. A antítese do
"dashboard SaaS roxo escuro com cards idênticos".

| Eixo | Direção |
|---|---|
| Tema | **Light-first "papel"** (ex. fundo `#faf8f4`, tinta `#17130c`) + dark opcional depois |
| Tipografia | Display serifada com carácter (ex. Fraunces ou Source Serif 4) para títulos; sans de trabalho para corpo; **mono tabular para todos os números** (`tabular-nums` obrigatório) |
| Cor | Tinta + 1 acento (proposta: verde-garrafa `#14532d` ou bordô `#7f1d3a`); semáforo só para variações (▲ coral / ▼ teal, sempre com símbolo, nunca só cor) |
| Layout | Editorial: grelha assimétrica, números de figura, notas de rodapé com fontes, colunas estreitas de leitura, tabelas com regras finas — nunca grelha de cards 3×n idênticos |
| Motion | Mínimo e significativo: count-up em números ao entrar em viewport, transição em gráficos ao mudar período. `prefers-reduced-motion` respeitado sempre |
| Anti-padrões proibidos | gradientes de hero, glassmorphism, emoji-bullets, cards com sombra grossa, copy genérica ("descobre", "potencia"), iconografia stock |

Skills a carregar durante o build: `frontend-design`, `frontend-ui-engineering`,
`web-design-guidelines`, `vercel-react-best-practices`,
`vercel-composition-patterns`, `animate`/`improve-animations`,
`vercel-react-view-transitions`, GSAP apenas se houver storytelling scroll.

Living reference: página `/estilo` interna com todos os componentes (como o
`/estilo` do CLAREZA) — também serve como peça de portfólio.

---

## 10. Pipeline de automação

```
GitHub Actions
├── ingest-daily.yml    (cron 06:00)  → DGEG combustíveis, Euribor (BPstat)
├── ingest-monthly.yml  (cron dia 13) → Eurostat HICP, INE, IGCP CA
└── cada workflow:
      1. fetch → normalizar → 2. validar zod (falha = não commita + issue)
      3. calcular derivados → 4. escrever JSON → 5. commit "data: ..."
      6. Vercel rebuild via push
```

- **Freshness watchdog**: no fim de cada ingest, `sources.json` compara
  `serieAte` com o esperado; série atrasada → badge "série atrasada" no site
  (regra nº1) + GitHub Issue automática.
- **Intervenção LLM pontual** (modelo gitops): tarefas futuras descritas em
  `docs/TAREFAS-*.md` ou Issues; um agente LLM pega nelas (ex. "saiu OE-2027,
  criar irs-2027.json a partir do DR anexado") — o único input manual recorrente
  é a revisão fiscal anual.
- **Rollback grátis**: dados são commits — `git revert` resolve qualquer
  ingest corrupta.

---

## 11. Testes & qualidade — definição de "nota 10"

| Camada | O quê |
|---|---|
| Motores | Vitest, casos golden com valores de referência (ex. salário 1 500 € solteiro 2026 → líquido esperado calculado e verificado manualmente contra tabelas AT publicadas) |
| Ingest | Contratos zod por fonte; snapshot tests de normalização; falha de fonte = erro explícito, nunca dado inventado |
| Dados | Teste de frescura: CI falha se `serieAte` atrasar >N dias sem flag |
| E2E | Playwright smoke: rotas principais renderizam, calculadora dá output, freshness badge presente |
| Gates | `lint && typecheck && test:unit && build && test:e2e` verdes antes de merge; CI em `.github/workflows/ci.yml` |
| A11y | AA contraste, foco visível, `prefers-reduced-motion`, tabelas semânticas |
| Perf | Lighthouse ≥95 mobile nas páginas de dados; ECharts lazy-loaded |

---

## 12. SEO & descoberta (literalmente o público-alvo está no Google)

- Títulos/meta em PT-PT que correspondem às pesquisas reais:
  "calcular salário líquido 2026", "quanto pago de IRS", "o que é spread",
  "certificados de aforro rendimento".
- JSON-LD: `Dataset` nas páginas de dados, `FAQPage` no glossário.
- OG images geradas com o número do mês (partilhável: "a inflação dos
  alimentos é X%").
- sitemap.xml + robots + RSS leve das séries atualizadas.

---

## 13. Legal & ética

- Disclaimer fixo: simuladores indicativos, não constituem aconselhamento
  financeiro, fiscal ou de crédito; regras fiscais podem ter exceções
  (situações pessoais específicas → profissional).
- Cada número cita fonte e data; metodologia pública.
- Scraping de supermercados (se alguma vez): avaliação ToS própria, robô
  educado, nunca contornar medidas técnicas; fonte oficial sempre preferida.
- Licença: código MIT (portfólio); dados mantêm licença da fonte (Eurostat/INE
  permitem reutilização com citação — verificar termos no momento da ingestão).

---

## 14. Roadmap

| Fase | Conteúdo | Critério de saída |
|---|---|---|
| **0 — Fundação** | repo, Next.js+TS+Tailwind, tokens/design base, CI, `/estilo`, loaders zod, `sources.json` | CI verde, design tokens vivos |
| **1 — MVP** | `/salario` (calculadora completa + escalões), `/inflacao` (Eurostat top ~15 COICOP), `/aprender` (10 termos), `/metodologia`, home simples | Números reais ao vivo, testes golden IRS |
| **2 — Dinheiro & banco** | `/credito` (Euribor BPstat + simulador), `/poupanca` (CA), `/impostos` (IVA + cascata ISP), combustíveis diário | Pipeline diário a correr sozinho ≥2 semanas |
| **3 — Profundidade** | drill-down COICOP completo, PT vs Zona Euro, cabaz/produto (Open Prices ou monitor próprio com decisão ToS), artigos editoriais | Cobertura editorial + histórico próprio acumulando |
| **4 — Polimento** | OG dinâmicas, RSS, dark mode, EN opcional, `/estilo` público | Peça de portfólio final |

Backlog detalhado por fase será extraído para issues quando a implementação
começar.

---

## 15. Riscos & mitigações

| Risco | Mitigação |
|---|---|
| Endpoint Eurostat/DGEG muda ou falha | validação zod + freshness watchdog + badge de falha; rollback via git |
| Regras fiscais erradas | JSON revisto manualmente, casos golden contra tabelas oficiais, disclaimer |
| Site parecer gerado por IA | direção editorial explícita (§9), `/estilo`, revisão contra `web-design-guidelines` |
| Custo sair de €0 | arquitetura sem servidor/BD; se tráfego rebentar free tier → static export + GitHub Pages/Cloudflare |
| Abandono de manutenção | automação total; único input manual é anual e documentado em `data/fiscal/README` |

---

## 16. Decisões tomadas vs abertas

**Tomadas:** site público · stack Next.js+TS+Tailwind · dados-como-código em
vez de BD · GitHub Actions · Vercel · PT-PT primeiro · ECharts · motores fiscais
puros com testes golden · MDX editorial.

**Abertas:**
1. Nome final + domínio (§3)
2. Cor de acento / direção tipográfica final — decidir com 2–3 mockups da home
   na Fase 0
3. Tabelas de retenção na fonte: alcance exato do simulador (começar por
   solteiro/casado/dependentes; ilhas e situações especiais fora do MVP)
4. Monitor próprio de supermercados: decisão ToS na Fase 3

---

## 17. Próximo passo concreto

Fase 0: `create-next-app`, tokens de design, 2–3 mockups da home para fixar
nome+cor+tipografia, CI, e primeiro loader zod a puxar `prc_hicp_midx` real
para provar o pipeline de ponta a ponta.
