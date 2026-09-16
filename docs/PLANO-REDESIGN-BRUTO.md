# PLANO — REDESIGN TOTAL BRUTO

v0.1 · 2026-09-16 · Estado: **proposta para aprovação** — nenhum código executado.
Documento irmão de `PLANO-LITERACIA-FINANCEIRA.md` (que fica como histórico).
Síntese de 3 auditorias paralelas: inventário técnico, mercado PT, direcção visual.

---

## 1. Decisões tomadas

| Decisão | Escolha |
|---|---|
| Nome | **BRUTO** (resolve a inconsistência BRUTO-vs-Cêntimo a favor de BRUTO; renomear `package.json`, UI, docs) |
| Âmbito | **Redesign total do zero** — o que existe serve de referência, não de base |
| Direcção visual | **C — "A Conta"** (quente, cívica, humana) |
| Logotipo | **C1 — "O Nível"**: U recipiente cheio a ~62% (o que fica do custo total do trabalho: bruto + TSU empresa). Ficheiros em `docs/brand/` |
| Referências | Nenhuma das sugeridas; apropriadas: Our World in Data, USAFacts, GOV.UK DS, The Pudding, FT Visual, Qonto, Pacifica |
| Rebuild | **Nesta pasta** — motores e dados fiscais preservam-se; "do zero" = design/interface/estrutura |
| MVP | **Os 6 simuladores** do §6 |
| Gráficos | **À medida** (SVG próprio, sem ECharts) — nível FT/The Pudding, motion dinâmico mas com propósito |
| Analytics | **Nenhuma** — zero tracking, zero cookies, zero banners |
| Euribor | **Diária** — pipeline diária §9, painéis na fase de dados vivos |
| Editorial | Revisão do dono; **PT-PT 100% correcto**, zero brasileirismos |
| Domínio | `bruto.pt` aparenta livre (RDAP 404) — registo é acção do dono (~10 €/ano) |
| Hosting | **Grátis** — ver §12.1 |

## 2. Posicionamento

> **"Não vendemos nada, por isso não precisamos de te ligar."**

O único player de escala em Portugal sem intermediação de crédito, sem paywall,
sem registo. Cada número com fonte + data. O concorrente mais próximo
(`simula.pt`, one-man show com AdSense) valida a tese — o BRUTO ganha em
escala, design e cobertura.

Diferenciação estrutural: os oficiais (BdP, CMVM, Todos Contam) têm dados mas
UX de 2010 e estão fragmentados por supervisor; os comerciais (Doutor
Finanças, ComparaJá) são funis de lead. O cidadão vive salário → IRS →
prestação → poupança junto; ninguém liga as peças.

## 3. Identidade — direcção C "A Conta"

### Paleta

| Papel | Hex | Regra |
|---|---|---|
| Fundo | `#FAF7EE` | areia/papel |
| Superfície | `#FFFFFF` + borda `#EAE4D4` | cards limpos |
| Tinta | `#221F19` | texto |
| Secundário | `#6B6455` | texto secundário |
| Acento primário | `#7E2B1E` | oxblood — assinatura, "o que sai" |
| Acento secundário | `#2F5D46` | verde-pinheiro — **reservado ao que é teu** (líquido, positivo) |
| Micro-acento | `#C99A2E` | torrado — marcador de fonte/citação, nunca decoração (≤5% ecrã) |
| Aviso | `#B07E17` | |
| Dark | fundo `#1A1713` · superfície `#242019` · texto `#F0E9DA` · ox→`#CE7A5E` · verde→sálvia | |

### Tipografia

- **Display:** Archivo (eixo `wdth` expandido, peso 800) — manchete, não SaaS
- **Texto:** Source Serif 4 — voz de revista para conteúdo explicativo
- **Dados:** Space Mono — "recibo", números com charme; `tnum` sempre em tabelas

### Regras de cor (escritas, não negociáveis)

1. Verde só para "o teu dinheiro" — nunca como decoração nem fundo genérico.
2. Amarelo/torrado só como marcador funcional (fonte, citação, foco).
3. Verde e vermelho nunca saturados em contacto directo.
4. Bandeira é evocada, nunca citada (verde-floresta + oxblood + torrado = Portugal sem o trauma da identidade 2023).

### Logotipo — 3 conceitos (decisão pendente)

| | Conceito | Metáfora |
|---|---|---|
| C1 | **O Nível** — U recipiente cheio a ~62% (o que fica do custo total do trabalho: bruto + TSU empresa 23,75%, salário médio ~1.700 € — verificado no motor) | líquido = o que fica (recomendado) |
| C2 | **O Corte** — O anel com fatia retirada + fragmento oxblood | o que sai em impostos |
| C3 | **O Copo** — O anel com nível de enchimento | o que fica é teu |

Ficheiros: `docs/brand/logo-c*.svg` + preview `docs/brand/bruto-logo-concepts.html`.
Regra: um motivo só, executado bem — não usar C1 e C3 em simultâneo.

### Anti-padrões banidos

Gradientes fintech, roxo-AI, glassmorphism, stock "pessoas felizes com moedas",
renders 3D de cartões, bandeira literal, dashboards SaaS genéricos,
scroll-jacking, animações que atrasam o número.

## 4. Inventário — manter / corrigir / refazer

| Área | Veredicto | Acção |
|---|---|---|
| `engines/irs.ts` | Manter | Revalidar gate do mínimo de existência; adicionar retenção na fonte |
| `engines/prestacao.ts` | Manter | Base para o motor TAEG/MTIC |
| `engines/poupanca.ts` | **Corrigir** | Modelo de imposto inconsistente; CA capitaliza trimestralmente; prémios de permanência não aplicados; default 0,28 hardcoded |
| `engines/impostos.ts` | Manter | Default IVA 0,23 → ler de `data/fiscal` |
| Motores SS + TAEG | **Criar** | Contrato lista 6 motores, existem 4 |
| `data/fiscal/` | Manter | Adicionar tabelas de retenção, `capitais.json`, README |
| `data/sources/` | Manter | Só Eurostat — acrescentar DGEG, BPstat, INE, IGCP |
| `data/derived/` + `scripts/derive/` | **Criar** | Previsto no contrato, nunca implementado |
| Freshness watchdog | **Criar** | Séries com 9 meses de atraso passam em silêncio — inaceitável |
| `messages/pt.json` + next-intl | **Criar** | Todo o copy está hardcoded em JSX |
| `public/` | **Criar** | Favicon, sitemap, robots, OG, JSON-LD |
| Workflows CI | Corrigir | e2e fora do CI; `ingest-daily` corre um no-op |
| Qualidade PT-PT | Manter | Zero brasileirismos — referência de qualidade a preservar |
| Componentes `EuroBar`, `Figure`, `Delta` | Refinar | A assinatura visual certa — redesenhar no novo sistema |
| Testes | Expandir | Motores bem cobertos; falta `data.ts`, parser ingest, e2e no CI |

## 5. Arquitectura de informação

```
/                     home editorial — "quanto fica do teu bruto"
/salario              bruto → líquido 2026 (o termo mais pesquisado em PT)
/casa                 crédito habitação + custo total de compra (IMT, IS)
/poupanca             CA Série F vs CTPC vs depósitos — líquido de impostos
/irs                  escalões, retenção, IRS Jovem, simulador anual
/impostos             IVA, ISP/combustível, IMI
/inflacao             poder de compra, dados INE/Eurostat
/trabalho             subsídio desemprego, recibos verdes (fase 2)
/dados                painéis vivos: Euribor, taxa base CA, usura, IAS/SMN
/aprender             glossário + guias (TAEG, MTIC, TAN, duodécimos…)
/metodologia          fontes, vigências, estado dos dados — a promessa
/sobre                quem faz, porquê grátis, sem conflitos
```

## 6. Roadmap de simuladores

**MVP (Fase 3):** salário bruto→líquido completo (tabelas retenção, duodécimos,
subs. alimentação, Açores/Madeira, custo empregador) · crédito habitação
(prestação + amortização + MTIC/TAEG + stress Euribor) · custo total de
comprar casa (IMT + IMT Jovem + IS + registos) · CA vs CTPC vs depósitos ·
IRS Jovem · subsídio de desemprego.

**Fase 4:** IRS anual completo · mais-valias · PPR · recibos verdes ·
salário em termos reais.

**Fase 5:** painéis de dados vivos (Euribor diária/média, taxa base CA,
taxas máximas de usura) · comparador de comissões BdP · calendário fiscal.

## 7. Fases de execução

| Fase | Conteúdo | Critério de aceitação |
|---|---|---|
| **0 — Fundações** | Repo limpo ou refactor in-place (decisão técnica); tokens da direcção C em `globals.css`; fonts self-hosted; `messages/pt.json`; `public/` com logo escolhido; rename Cêntimo→BRUTO | `lint+typecheck+build` verde; zero "Cêntimo" no repo |
| **1 — Shell + Home** | Header/nav/footer, home editorial, design system base (botões, cards, `Figure`, `EuroBar`, `Stat`, tabelas de dados) | Review visual aprovada; e2e smoke; a11y AA |
| **2 — Dados + motores** | Fix poupança; motores SS + TAEG; defaults fiscais fora do código; `data/derived/` + `scripts/derive/`; freshness watchdog com falha visível | Testes unitários verdes; nenhum número sem fonte+vigência; watchdog falha ruidosamente em dados velhos |
| **3 — MVP simuladores** | Os 6 simuladores do §6 com golden tests fiscais + **"Explica-me o recibo"** (waterfall custo-total→líquido como peça-assinatura) + **dia da liberdade fiscal** | Cada simulador: resultado com fonte+data inline; casos limite testados; mobile-first |
| **4 — Conteúdo** | Glossário, guias, metodologia, IRS anual + **comparador temporal** (salário em euros de hoje) + **partilha como imagem** (cartões OG por simulação) | Revisão editorial do dono (copy nunca publicado sem revisão) |
| **5 — Dados vivos + polish** | Ingest DGEG/BPstat/IGCP; painéis; `ingest:daily` real; e2e no CI + **API pública** (`/api/*.json`) + **RSS de mudanças fiscais** + **relatório imprimível** | Pipeline verde ponta-a-ponta; `npm run ci` = contrato completo |
| **6 — Pós-MVP** | **Verificador de recibo real** (precisa das tabelas de retenção completas) | Backlog — só depois do lançamento público |

Gate entre fases: **revisão tua obrigatória**. Nada passa sem aprovação.

## 8. Verificação permanente

- `lint && typecheck && test:unit && build && test:e2e` — o contrato de merge
- Dados: freshness watchdog falha CI e mostra estado em `/metodologia`
- Regra nº1 intacta: fonte falha → mostra falha, nunca número inventado
- `prefers-reduced-motion`: todos os valores renderizam no estado final

## 9. Pipeline de dados — fontes, APIs e crons

Matriz fonte → endpoint → frequência → destino. Regra: cada fonte produz
JSON em `data/sources/<fonte>/`, os derivados são calculados por
`scripts/derive/` para `data/derived/`, e o freshness watchdog falha
(ruidosamente, no CI e em `/metodologia`) se uma série envelhecer além do SLA.

| Fonte | Dados | Endpoint/método | Frequência | Workflow | SLA freshness |
|---|---|---|---|---|---|
| Eurostat | HICP/IPC 26 séries COICOP | JSON-stat 2.0 API | Mensal (~dia 15–18) | `ingest-monthly` | 45 dias |
| INE | IPC nacional | API INE | Mensal | `ingest-monthly` | 45 dias |
| BPstat (BdP) | Euribor diária + médias mensais, taxas juro depósitos/crédito | API pública BPstat | Diária | `ingest-daily` | 3 dias |
| DGEG | Preços combustíveis (gasolina95, gasóleo, GPL) | API DGEG | Semanal (2.ª feira) | `ingest-daily` (check) | 10 dias |
| IGCP | Taxa base CA Série F, CTPC | Ficha técnica mensal (semi-manual → JSON curado) | Mensal | `ingest-monthly` + curadoria | 40 dias |
| BdP | Taxas máximas de usura (crédito consumo) | Tabela trimestral publicada | Trimestral | `ingest-quarterly` | 100 dias |
| AT | Tabelas de retenção na fonte | PDF do Despacho → JSON curado em `data/fiscal/` | Anual + actualizações | Manual (PR com fonte) | Vigência declarada |
| OE/DR | SMN, IAS, escalões, deduções | Lei → `data/fiscal/*.json` curado | Anual | Manual (PR com fonte) | Vigência declarada |
| BdP preçários | Comissões bancárias (~200 instituições) | API comparador BdP | Trimestral | Fase 5 | 100 dias |

Crons (GitHub Actions): `ingest-daily` 06:00 UTC (Euribor + check DGEG) ·
`ingest-monthly` dia 14 (Eurostat, INE, IGCP, depósitos) ·
`ingest-quarterly` dia 10 do trimestre (usura, preçários) · `derive` corre
após cada ingest e em cada PR que toque `data/` · `validate` (zod schemas +
freshness) é gate de CI. Dados fiscais entram **sempre** por PR manual com
fonte legislativa — nunca scraped automaticamente.

## 10. Sistema UX — anatomia e padrões

**Padrão de simulador (o componente nuclear):**

```
inputs (esquerda/topo)  →  resultado em tempo real
                           ├─ número-herói (mono, grande)
                           ├─ breakdown visual (ver §11)
                           ├─ «o que não está incluído» — caixa de honestidade
                           └─ selo de evidência: fonte · vigência · link
```

- **Estado na URL** — cada simulação é partilhável por link (`?bruto=2050&...`),
  sem servidor, sem guardar nada do utilizador
- **Selo de evidência** — componente reutilizável `Source` que aparece sob
  cada número: `Fonte: Lei 73-A/2025 · vigente 2026 · atualizado 14 set`
- **Divergência de fontes** — quando fontes oficiais discordam (caso real:
  IMT Jovem 324.058€ vs 330.539€), mostramos ambas com datas — é conteúdo
  editorial, não bug
- **Glossário inline** — termos técnicos (TAEG, MTIC, duodécimos) com
  tooltip/sublinhado tracejado que expande definição
- **Anatomia de página**: eyebrow → manchete com número-herói → explicação
  1 frase → ferramenta → contexto em dados → FAQ → fontes
- **A11y**: AA; foco visível em torrado (precedente GOV.UK — o amarelo tem
  função); `prefers-reduced-motion` = estado final imediato; simuladores
  operáveis por teclado; anúncios de resultado via `aria-live`
- **Dark mode** completo (tokens já definidos)
- **Disclaimer** permanente no footer: "informação, não aconselhamento
  financeiro" + link `/metodologia`

## 11. Estratégia de gráficos — bespoke, não biblioteca

Decisão proposta: **remover ECharts** e construir ~5 componentes SVG próprios
estilizados ao sistema (o visual do ECharts é o "look genérico" que queremos
evitar; ~1 MB de bundle por gráficos que usamos a 10%). Referência de
qualidade: FT Visual / The Pudding — gráficos que *são* o design.

| Componente | Uso | Nota |
|---|---|---|
| `Waterfall` | **Assinatura do site**: bruto → descontos → líquido | Cascata em degraus; oxblood = sai, verde = fica; literalmente o logotipo em gráfico |
| `AmortChart` | Plano de amortização CH (capital vs juros no tempo) | Área/barras empilhadas com cursor e eventos (revisão Euribor) |
| `LineChart` | Inflação, Euribor, séries temporais | Eixo temporal real, marcas de eventos legislativos |
| `Donut`/`Level` | Percentagens | Reusa o motivo do logotipo (C1/C3: nível; C2: corte) — sistema coerente |
| `BarCompare` | CA vs CTPC vs depósitos, comissões | Líquido de imposto sempre destacado em verde |

Princípios: tooltips discretos ao hover/focus; números em mono `tnum`;
cada gráfico termina com selo de evidência; impressão/PDF limpa
(`print-stylesheet`); zero decoração sem dados.

## 12. SEO, OG e distribuição

- **JSON-LD**: `FAQPage` em páginas explicativas, `Dataset` em `/dados`,
  `WebApplication` nos simuladores
- **OG images** por rota (MVP: estáticas com a marca; fase posterior: dinâmicas
  com número-herói da simulação partilhada)
- `sitemap.xml` + `robots.txt` + metadata por simulador optimizada para
  "simulador X 2026" (intenção de pesquisa dominante em PT)
- **Budgets de performance**: LCP < 2,5 s, CLS ≈ 0, JS first-load < 150 KB
  em páginas de conteúdo; fonts self-hosted com subset
- Sem cookies, sem tracking de utilizador → sem banner de consentimento

### 12.1 Hosting grátis — arquitectura estática

O site é 100% read-only e "dados como código" → **build 100% estático**
(`output: 'export'` no Next.js): cada página é HTML gerado no build, os
simuladores correm no browser, os dados vêm de JSON empacotado. Zero
servidor = zero custo e zero superfície de ataque.

| Opção | Custo | Notas |
|---|---|---|
| **Vercel Hobby** (recomendado) | 0 € | Feito para Next.js; preview automático por PR; CDN global. Limite: uso não-comercial — o BRUTO é gratuito, compatível |
| Cloudflare Pages | 0 € | Banda ilimitada; precisa adapter p/ Next ou export estático |
| GitHub Pages | 0 € | Só estático; domínio `*.github.io` ou custom com DNS |

Recomendação: **Vercel Hobby** para começar (zero fricção, previews por PR),
mantendo o build exportável para migrar a qualquer momento sem custo.
Os crons de dados correm em GitHub Actions (grátis: ~2.000 min/mês em repo
privado, ilimitado em público) — independente do hosting.

### 12.2 Motion — dinâmico com propósito

Pedido do dono: "quanto mais dinâmico melhor" — interpretado dentro da
direcção C: motion **significativo**, não decorativo. O número nunca espera
pela animação.

- **Contadores**: valores contam ao entrar no viewport (mono, `tnum`)
- **O nível do logo** enche no primeiro load da home
- **Waterfall** cascateia degrau a degrau ao interagir com o simulador
- **View transitions** entre páginas (nativo, leve)
- **Scroll-driven** só onde conta uma história (ex.: "um ano de inflação")
- Física subtil em sliders/inputs (spring contido), nunca elástico de brinquedo
- `prefers-reduced-motion` → tudo instantâneo no estado final

Stack provável: CSS + View Transitions nativas; GSAP apenas para sequências
complexas (ScrollTrigger no máximo 1-2 momentos editoriais).

## 13. Estado das decisões — fechadas

Todas as questões resolvidas em 2026-09-16 (ver tabela §1):

- ✅ Logo C1 "O Nível" (62% do custo total do trabalho)
- ✅ Rebuild nesta pasta · MVP = 6 simuladores · gráficos à medida
- ✅ Analytics: nenhuma · Euribor diária na fase de dados vivos
- ✅ Editorial: revisão do dono, PT-PT 100% correcto
- ✅ Hosting: Vercel Hobby (0 €), build estático exportável
- ⏳ Acção do dono: registar `bruto.pt` num registador (não é algo que
  um agente deva fazer — é um activo teu)

## 14. Ideias extra — **aprovadas** e distribuídas pelas fases

Aprovadas pelo dono em 2026-09-16; já integradas na tabela §7.

1. **"Explica-me o recibo"** — anatomia interactiva de um recibo de vencimento:
   cada linha expande-se com explicação. O waterfall custo-total → líquido é
   o gráfico-assinatura. *Impacto altíssimo, esforço médio — candidato a entrar
   no MVP da home.*
2. **O teu "dia da liberdade fiscal"** — a partir de que dia do ano trabalhas
   para ti e não para o Estado (custo total → data no calendário). Formato
   viral, números verificados pelo motor. *Impacto alto, esforço baixo.*
3. **Partilha como imagem** — cada simulação gera um cartão OG com os teus
   números ("bruto 2.000 € → líquido 1.499 €"). Alcance orgânico sem tracking.
   *Impacto alto, esforço médio.*
4. **API pública gratuita** — `data/` exposto como JSON estático
   (`bruto.pt/api/irs/2026.json`). Jornalistas e devs passam a citar o BRUTO
   como fonte primária. *Impacto alto em autoridade, esforço baixo.*
5. **Feed RSS de mudanças** — Euribor, taxa base CA, escalões: cada alteração
   de dados gera entrada RSS. "Alertas" sem contas nem emails. *Compatível
   com read-only; esforço médio.*
6. **Comparador temporal** — "o teu salário de 2020 em euros de hoje"
   (inflação + escalões por ano). *Esforço médio.*
7. **Verificador de recibo** — introduzes os valores do teu recibo real e
   verificamos se a retenção está correcta. *Impacto alto, esforço alto —
   fase tardia.*
8. **Relatório imprimível** — cada simulação exporta um "extracto" em
   formato ledger, fiel à identidade. *Esforço médio.*
