# Auditoria independente — CENAS DO BAIRRO V5 (as 11 cenas)

> Feita a **2026-10-02** (tarde, hora de Lisboa, WEST) por auditor
> independente — LLM com browser + curl — sobre
> `v5/auditoria-cenas` = `origin/main` @ `d20891f`.
> Lê-se em conjunto com [`docs/AUDITORIA-DADOS-V5.md`](AUDITORIA-DADOS-V5.md)
> e [`docs/AUDITORIA-2-RESULTADOS-DADOS-V5.md`](AUDITORIA-2-RESULTADOS-DADOS-V5.md).
> Skill `literacia-pt` carregada. Worktree próprio `../wt-auditoria`.

**Regra acima de todas: nunca inventar dados.** Cada veredicto abaixo ou
cita a fonte oficial aberta (URL + trecho literal + data de acesso) ou
diz `NÃO CONSEGUI`. Nenhum número foi confirmado "por ser plausível".

**Resumo: 63 CONFIRMADOS, 1 ERRADO provado (corrigido neste PR:
`data/fiscal/isp.json` desatualizado — a portaria citada já não está em
vigor), 4 NÃO CONSEGUI, 3 propostas de copy para o dono (não editadas).**
O erro não é de aritmética: é frescura — a Bomba mostrava à entrada de
outubro os ISP de 24 de agosto, já revogados pela portaria de 28 de
setembro. A decomposição do litro, o IVA sobre o ISP, as taxas de IVA,
as taxas da Segurança Social, os 9 escalões do IRS, o CA, as séries
Eurostat/BPstat/DGEG e as três negativas re-varridas batem com as fontes.

Método de leitura das fontes (conforme o brief): DR `detalhe` e Portal
das Finanças (listas do IVA) lidos em browser com espera de renderização;
DR consolidado e Portal das Finanças (artigos) lidos em browser via
`reactContainer.innerText`; BPstat e Eurostat por curl à API pública;
DGEG por curl à API `precoscombustiveis.dgeg.gov.pt`.

---

## 1. Quadro de veredictos

Legenda da prova: `URL — «trecho literal» — acesso 2026-10-02`.
"Onde" é `ficheiro:linha` na árvore auditada.

### 1.1 Bomba (o litro por dentro)

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| B1 | ISP gasolina 443,54 €/1000 L, com desconto de 53,98 €/1000 L, em vigor desde 24-08-2026 (Portaria 372-A/2026/1) | `data/fiscal/isp.json:8-11` → `dados-p2b.ts` (notaIsp) → `textos-p2b.ts` (`bmbNotaIsp`) | **CONFIRMADO para a sua vigência, MAS DESATUALIZADO** (ver E1) | https://diariodarepublica.pt/dr/detalhe/portaria/372-a-2026-1160679270 — «1 - A taxa do ISP aplicável, no continente, à gasolina com teor de chumbo igual ou inferior a 0,013 g por litro (…) é fixada no valor de 443,54 € por 1000 litros.» + «Os descontos (…) são de 81,61 € e de 53,98 € por 1000 litros, respetivamente [gasóleo e gasolina].» + «A presente portaria entra em vigor no dia 24 de agosto de 2026.» — acesso 2026-10-02 |
| B2 | ISP gasóleo 0,298 €/L em `isp.json` sob vigência 2026-08-24 | `data/fiscal/isp.json:12-15` | **ERRADO → corrigido** (ver E1) | A portaria citada (372-A/2026/1, art. 2.º n.º 3) fixou o gasóleo em **279,99 €/1000 L = 0,27999 €/L**, não 0,298 (valor que a própria nota do JSON admite ser «Referência maio/2026»). E a portaria em vigor a 2026-10-02 é outra (ver B1b) |
| B1b | A portaria em vigor à data da auditoria | `data/fiscal/isp.json:2` (`vigencia: 2026-08-24`) | **ERRADO (desatualizado) → corrigido** | https://diariodarepublica.pt/dr/detalhe/portaria/437-b-2026-1174266088 — «1 - (…) gasolina (…) é fixada no valor de 424,09 € por 1000 litros.» + «3 - (…) gasóleo (…) é fixada no valor de 261,31 € por 1000 litros.» + «Os descontos (…) são de 100,29 € e de 73,43 € por 1000 litros, respetivamente.» + «A presente portaria entra em vigor no dia 28 de setembro de 2026.» — acesso 2026-10-02. A 372-A foi revogada na cadeia semanal (270-A jun → 294-A jul → 345-C 14 ago → 372-A 21 ago → 432-A 18 set → **437-B 25 set**) |
| B3 | Taxa de carbono 0,159 €/L (gasolina) e 0,173 €/L (gasóleo) | `data/fiscal/isp.json:9,13` | **NÃO CONSEGUI** | As portarias do ISP lidas (372-A, 437-B) fixam só o ISP; a taxa de carbono vem de diploma separado e a fonte citada («impostos-combustiveis/AT») não foi aberta com valor legível nesta sessão. Não se mexeu (ver §3) |
| B4 | «O IVA calcula-se sobre o preço que já leva o ISP e a taxa de carbono: paga-se imposto sobre imposto» | `textos-p2b.ts:138-140` (`bmbIvaSobreImp`); motor `src/lib/engines/impostos.ts:30-44` | **CONFIRMADO** | CIVA consolidado, art. 16.º n.º 5 al. a) — https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/2008-34500675 — «O valor tributável (…) inclui: a) Os impostos, direitos, taxas e outras imposições, com excepção do próprio imposto sobre o valor acrescentado» — acesso 2026-10-02. A conta do motor (`iva = P − P/(1+t)`) é a inversão exata desta regra |
| B5 | «O ISP muda por portaria, às vezes todas as semanas» | `textos-p2b.ts:142-144` (`bmbNotaIsp`) | **CONFIRMADO** | Cadeia de portarias semanais lida no DR (ver B1b); a 372-A refere «o disposto na Portaria n.º 345-C/2026/1, de 14 de agosto» como «as taxas em vigor» na semana anterior |
| B6 | «O ISP e a taxa de carbono são valores fixos por litro; só o IVA acompanha o preço» | `textos-p2b.ts` (`bmbGraficoTexto`) | **CONFIRMADO** | As portarias fixam €/1000 L (valor absoluto); o IVA é percentagem sobre o preço (art. 16.º). A frase é a consequência aritmética direta |
| B7 | Preço médio nacional diário (DGEG) | `dados-p2b.ts` (`combustivel()`); `data/meta/sources.json` (pmd-*) | **CONFIRMADO** | https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/PMD?idsTiposComb=3201&dataIni=2026-09-28&dataFim=2026-10-02 — `{"Data":"2026-09-28","TipoCombustivel":"Gasolina simples 95","UnidadeMedida":"litro","NumPostos":1996,"PrecoMedio":"2,099 €",…}` — acesso 2026-10-02. Média diária por combustível em ~2000 postos: «média nacional» é descrição fiel |

### 1.2 IVA — Mercearia e Pastelaria

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| V1 | Três taxas no continente: reduzida 6 %, intermédia 13 %, normal 23 % (art. 18.º do CIVA) | `data/fiscal/iva.json:8-22`; `textos.ts:178-181`; `glossario.ts:92-96` | **CONFIRMADO** | CIVA art. 18.º n.º 1 — DR consolidado — «a) Para as importações, transmissões de bens e prestações de serviços constantes da lista i anexa a este diploma, a taxa de 6 %; b) Para (…) lista ii (…), a taxa de 13 %; c) Para as restantes (…), a taxa de 23 %.» — acesso 2026-10-02 |
| V2 | Pão, leite, fruta e legumes na Lista I (reduzida) | `textos.ts:179`; `iva.json:12` | **CONFIRMADO** | Portal das Finanças, Listas do CIVA (LISTA I — bens sujeitos a taxa reduzida) — 1.1.5 «Pão»; 1.4.1 «Leite em natureza, concentrado, esterilizado, (…)»; 1.6 «Frutas, legumes e produtos hortícolas» — http://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/civa_rep/Pages/c-iva-listas.aspx — acesso 2026-10-02 |
| V3 | Conservas e vinho na intermédia | `textos.ts:179`; `iva.json:17` | **CONFIRMADO (com nuance, ver §2.3)** | LISTA II — 1.2 «Conservas de peixes e de moluscos»; **1.10 «Vinhos comuns.»** (posição 33350, depois do cabeçalho LISTA II em 31500 — é mesmo Lista II). A verba diz «vinhos comuns»; a cena escreve «o vinho» — abrangência aceitável dado o ressalva dos exemplos (V8) |
| V4 | «Tudo o que não está nas listas paga a normal» | `textos.ts:179`; `mercIvaNota` (`textos.ts:183-185`, art. 18.º) | **CONFIRMADO** | Art. 18.º n.º 1 al. c) (ver V1): «Para as restantes (…) a taxa de 23 %» |
| V5 | Restauração à intermédia; «no café, o IVA é 13 %: mais do dobro do pão» | `textos-p2c.ts:88-97`; `iva.json:17` («restauração»); `dados-p2c.ts` (`taxaDe(/restaura/i)`) | **CONFIRMADO** | LISTA II, 3.1 — «Prestações de serviços de alimentação e bebidas, com exclusão das bebidas alcoólicas e refrigerantes. (Redação da Lei n.º 82/2023, de 29 de dezembro)». Café servido não é alcoólico nem refrigerante → 13 %; 13 > 2×6, logo «mais do dobro» é aritmeticamente certo |
| V6 | Famílias ECOICOP 0111–0118 e rótulos (cereais, carne, peixe, leite, azeite, fruta, legumes, açúcar) | `dados.ts:186-195` (FAMILIAS) | **CONFIRMADO** | Eurostat `prc_hicp_minr`, dimensão coicop18 (ECOICOP v2), labels oficiais lidas na API a 2026-10-02: CP0111 «Cereals and cereal products», CP0112 «Live animals, and meat…», CP0113 «Fish and other seafood», CP0114 «Milk, other dairy products and eggs», CP0115 «Oils and fats», CP0116 «Fruits and nuts», CP0117 «Vegetables, tubers…», CP0118 «Sugar, confectionery and desserts»; CP01 «Food and non-alcoholic beverages»; CP11 «Restaurants and accommodation services» |
| V7 | «"Comer fora" é restaurantes e alojamento, onde entram os cafés **e também os hotéis**» | `textos-p2c.ts:84-86` (`pastNotaIndice`) | **CONFIRMADO** | O rótulo oficial do CP11 (ver V6) inclui alojamento; a cena declara a limitação em vez de a esconder |
| V8 | IVA em cada 10 € = 10·t/(1+t); «exemplos indicativos, as listas definem o enquadramento exato» | `CenaMercearia.tsx` (`ivaEm10`); `textos.ts:183-185`; `iva.json:24-27` | **CONFIRMADO** | A fórmula é a inversão do art. 16.º (ver B4); a ressalva existe no texto e no JSON |

### 1.3 Segurança Social + IAS + recibos verdes

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| S1 | 11 % trabalhador, 23,75 % entidade patronal | `data/fiscal/ss.json:7-14`; `textos-p2b.ts` (`ssReciboSS`, `ssReciboTsu`); `glossario.ts:80-84` | **CONFIRMADO** | Código Contributivo, art. 53.º — DR consolidado https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2009-34514575 — «A taxa contributiva global do regime geral (…) é de 34,75 %, cabendo 23,75 % à entidade empregadora e 11 % ao trabalhador» — acesso 2026-10-02. (Também: gov.pt «Entidade Empregadora: 23,75 %. Trabalhador: 11 %») |
| S2 | Recibos verdes: 21,4 % sobre 70 % do faturado (rendimento relevante) | `data/fiscal/catb.json:12-18`; `textos-p2b.ts:216-230`; `glossario.ts` (`rendimento-relevante`) | **CONFIRMADO** | Art. 168.º n.º 1: «A taxa contributiva a cargo dos trabalhadores independentes é fixada em 21,4 %.» Art. 162.º n.º 1 al. a): «70 % do valor total de prestação de serviços» — DR consolidado — acesso 2026-10-02. 0,7×0,214 = 14,98 % ≈ «≈ 15 % do bruto» do JSON: aritmética certa |
| S3 | Base mínima 1,5×IAS = 805,70 €/mês (2026) | `catb.json:17`; `textos-p2b.ts:230` | **CONFIRMADO** | Código Contributivo: «a base de incidência mensal corresponde ao duodécimo do lucro tributável, com o limite mínimo de 1,5 vezes o valor do IAS» + seg-social.pt: «limite mínimo de 1,5 vezes o valor do IAS (805,70 €)». 1,5×537,13 = 805,695 → 805,70: aritmética certa |
| S4 | IAS 2026 = 537,13 € (Portaria 480-A/2025/1, 30 dez) | `data/fiscal/irs-2026.json` (`ias`); `servicos-minimos.json` | **CONFIRMADO** | DR: «Portaria n.º 480-A/2025/1, de 30 de dezembro — O valor do IAS para o ano de 2026 é de € 537,13.» + DGAEP: «2026, Portaria n.º 480-A/2025/1, de 30 de dezembro. € 537,13; 2025, Portaria n.º 6-B/2025/1, de 6 de janeiro, € 522,50» — acesso 2026-10-02 |
| S5 | Isenção nos primeiros 12 meses | `catb.json:16`; `textos-p2b.ts:217,230` | **CONFIRMADO (com nuance)** | Art. 145.º n.º 1: «No caso de primeiro enquadramento no regime dos trabalhadores independentes, este só produz efeitos no primeiro dia do 12.º mês posterior ao do início de atividade.» — i.e. ~11 meses completos + mês de início; «primeiros 12 meses» é a formulação corrente (também CGD/guias). Nuance registada, sem efeito no valor |
| S6 | Clientes retêm 23 % (art. 151.º); 11,5 % outros | `catb.json:19-23`; `textos-p2b.ts:230` | **CONFIRMADO** | CIRS art. 101.º n.º 1: «b) 23 %, tratando-se de rendimentos decorrentes das atividades profissionais especificamente previstas na tabela a que se refere o artigo 151.º; c) 11,5 %, tratando-se de rendimentos da categoria B refer[…]` — DR consolidado — acesso 2026-10-02 |
| S7 | Apuramento trimestral da SS (a cena mostra média anual) | `textos-p2b.ts:230` | **CONFIRMADO** | Art. 162.º n.º 1: rendimento relevante «determinado com base nos rendimentos obtidos nos três meses imediatamente anteriores ao mês da declaração trimestral». A cena declara a simplificação («aqui mostra-se a média anual») |
| S8 | O dinheiro «vai para um bolo comum que paga pensões, desemprego, doença, parentais» | `textos-p2b.ts` (`ssBolo`) | **CONFIRMADO (qualitativa)** | Descrição genérica do sistema previdencial repartitivo; sem número afirmado. Consistente com o elenco de eventualidades do Código Contributivo |

### 1.4 IRS 2026 — Finanças e Fábrica

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| R1–R9 | Os 9 escalões e taxas (8 342×12,5 % … 86 634×44,6 % … 48 %) e taxas médias | `data/fiscal/irs-2026.json:26-36` → `dados.ts:100-140` | **CONFIRMADO (os 9, um a um)** | CIRS art. 68.º n.º 1, redação em vigor — DR consolidado — «Até 8 342 → 12,50 / 12,500; De mais de 8 342 até 12 587 → 15,70 / 13,579; … até 17 838 → 21,20 / 15,823; … até 23 089 → 24,10 / 17,705; … até 29 397 → 31,10 / 20,579; … até 43 090 → 34,90 / 25,130; … até 46 566 → 43,10 / 26,472; … até 86 634 → 44,60 / 34,856; Superior a 86 634 → 48,00» — «Alterado pelo/a Artigo 71.º do/a Lei n.º 73-A/2025 (…) em vigor a partir de 2026-01-01» — acesso 2026-10-02. Batem todos com o JSON (médias incluídas) |
| R10 | Dedução específica 4 587,09 € = 8,54×IAS | `irs-2026.json:9-10`; `dados.ts`; `glossario.ts:62-66` | **CONFIRMADO** | CIRS art. 25.º n.º 1 al. a): «Aos rendimentos brutos da categoria A deduzem-se (…) a) 8,54 vezes o valor do IAS» — acesso 2026-10-02. 8,54×537,13 = 4 587,0902 → 4 587,09: aritmética certa. (Corroboram: Montepio 2026-01 «4 587,09 euros»; PwC Guia Fiscal 2026) |
| R11 | Mecânica das gavetas (só o excedente paga a taxa seguinte; subir nunca tira) | `textos.ts:53-70`; `glossario.ts:49-54` | **CONFIRMADO** | Art. 68.º n.º 2: «O quantitativo do rendimento coletável, quando superior a 8059 €, é dividido em duas partes (…) uma (…) à qual se aplica a taxa da coluna B (…) outra, igual ao excedente, a que se aplica a taxa da coluna A respeitante ao escalão imediatamente superior.» O exemplo do glossário (15 000 €, primeiros 8 342 € a 12,5 %) usa os limites do R1: certo |
| R12 | Mínimo de existência protege até 12 880 € (= 14×RMMG) | `irs-2026.json:13-20`; `glossario.ts:68-72`; `textos.ts` (`finNotaRodape`, qualitativo) | **CONFIRMADO** | CIRS art. 70.º n.º 1 (redação atual): «O valor de referência do mínimo de existência é igual ao maior valor entre 12 880 € e 1,5 × 14 × IAS.» — acesso 2026-10-02. 14×920 = 12 880; 1,5×14×537,13 = 11 279,73 < 12 880 → 12 880: aritmética e fórmula do JSON certas. (Nota: o consolidado mostra ainda o texto pré-2016 de 8 500 € no painel de alterações — é histórico, não vigência) |
| R13 | «O que se retém todos os meses é um adiantamento: o valor final acerta-se na declaração anual» | `textos.ts:76-78` (`finNotaRodape`); `textos.ts` (`fabFalaIrs`) | **CONFIRMADO** | CIRS art. 99.º: «São obrigadas a reter o imposto no momento do seu pagamento (…) as entidades devedoras: a) De rendimentos de trabalho dependente (…)» + desenho do sistema (tabelas mensais do Despacho AT — `data/fiscal/retencao-2026.json` — vs liquidação anual). Para cat. B/E o Código diz literalmente «pagamento por conta» (art. 101.º n.º 10) |
| R14 | Deduções à coleta baixam o imposto (nota de rodapé) | `textos.ts:76-78` | **CONFIRMADO (qualitativa)** | CIRS arts. 78.º e seguintes; valores em `data/fiscal/deducoes-2026.json`. A cena não cita valores |

### 1.5 Banco — Euribor, prestação, spread

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| F1 | Prestação pelo método francês P = C·i/(1−(1+i)^−n) | `src/lib/engines/prestacao.ts:13-38` → `banco-arte.ts:34-36` | **CONFIRMADO** | Identidade matemática padrão do sistema francês (prestação constante); implementação inspecionada (i = TAN/12, n = meses, caso i=0 tratado) + testes golden `engines.test.ts:35-55` verdes |
| F2 | Spread do exemplo declarado como exemplo; «Só a Euribor é um dado real (BPstat)» | `textos.ts:96-97` (`banNotaExemplo`); `CenaBanco.tsx:27` (EX 150 000 €/30 a/spread 1) | **CONFIRMADO** | Leitura do código: o aviso existe e o exemplo é parametrizável na cena. (Avaliação de conformidade com a regra n.º 1, não afirmação factual) |
| F3 | Série Euribor 12M do BPstat (id e título) | `dados.ts:150-162`; `data/meta/sources.json` (euribor-12m-mensal) | **CONFIRMADO** | BPstat API — https://bpstat.bportugal.pt/api/series/?series_ids=13168437&lang=PT — domínios [22] (Mercado monetário); membros: «Taxas de juro / Banco Central Europeu / Área Euro / 1 ano / EURIBOR / Percentagem / Média / Mensal / Taxa de juro de referência» — acesso 2026-10-02. «Euribor a 12 meses, média mensal» é o título oficial por extenso |
| F4 | «A taxa revê-se de 3, 6 ou 12 em 12 meses» | `textos.ts` (`banNotaGrafico`) | **CONFIRMADO** | BdP/BPstat: «Este gráfico mostra o peso de cada um dos indexantes – Euribor a 3, 6 ou 12 meses e outros indexantes – no stock de empréstimos para habitação» (bpstat.bportugal.pt/conteudos/noticias/1814) — acesso 2026-10-02 |
| F5 | «Imposto do Selo, seguros e comissões não estão incluídos» | `textos.ts` (`banNotaGrafico`) | **CONFIRMADO** | Declaração de âmbito da simulação, verdadeira por construção (o motor só soma capital+juros) |
| F6 | Euribor: prazos «1 semana a 12 meses» | `glossario.ts:10-15` | **CONFIRMADO** | Prazos Euribor publicados: 1 semana, 1, 3, 6 e 12 meses (euribor-rates.eu; «five different maturities, ranging from one week to 12 months»). O BPstat serve 1M/3M/6M/12M mensais (`sources.json`) |

### 1.6 Correios — Certificados de Aforro

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| C1 | Taxa 2,50 % em set/2026 (cap); agosto 2,474 % | `data/fiscal/ca.json:9-10` | **CONFIRMADO (auditoria-2, não reaberto)** | Auditoria-2 C4 (2026-09-30): simulador IGCP «30/09/2026 · Taxa Bruta · (…) **2,500 %**» + ficha «não poderá ser superior a 2,50 % nem inferior a 0 %». O cap de 2,50 % foi re-confirmado nesta sessão na ficha (ver C2) |
| C2 | Base = média Euribor 3M dos 10 dias úteis anteriores, arredondada ao milésimo, [0 %; 2,50 %] | `ca.json:11` | **CONFIRMADO** | IGCP, Ficha Técnica Série F — https://www.igcp.pt/pt/aforristas/produtos-de-aforro/certificados-de-aforro/ficha-tecnica-certificados-de-aforro-serie-f — «E3 em que E3 é a média dos valores da Euribor a três meses observados nos dez dias úteis anteriores, sendo o resultado arredondado à terceira casa decimal. A taxa base não poderá ser superior a 2,50 % nem inferior a 0 %.» — acesso 2026-10-02 |
| C3 | Prémios 0,25 / 0,50 / 1,00 / 1,50 / 1,75 do 2.º ao 15.º ano | `ca.json:14-20` → `dados-p2b.ts` | **CONFIRMADO** | Mesma ficha: «0,25 % - do 2º ao 5º ano; 0,50 % - do 6º ao 9º ano; 1,00 % - no 10º e 11º ano; 1,50 % - no 12º e 13º ano; 1,75% - no 14.º e 15º ano.» Logo «mais um prémio a partir do 2.º ano» (`textos-p2b.ts:58-60`) é certo |
| C4 | 15 anos; juros trimestrais capitalizados; reembolso no 15.º aniversário; capital garantido | `ca.json`; `textos-p2b.ts:67-71` | **CONFIRMADO** | Mesma ficha: «Prazos: 15 anos»; «Capitalização automática dos juros vencidos (líquido de IRS)»; «Reembolso de capital e juros capitalizados, no 15º aniversário»; «Garantia da totalidade do capital»; «Série F criada pela Portaria 149-A/2023, de 2 de junho» |
| C5 | Retenção de 28 % sobre os juros (2,5 % → 1,8 % líquidos) | `capitais.json:6-9`; `textos-p2b.ts:58-66`; `glossario.ts:110-114` | **CONFIRMADO** | CIRS art. 71.º n.º 1: «Estão sujeitos a retenção na fonte a título definitivo, à taxa liberatória de 28 %: a) Os rendimentos de capitais obtidos em território português…» — acesso 2026-10-02. 2,5×(1−0,28) = 1,8: aritmética certa |
| C6 | CTPV/CTPC suspensa (bloco `ctpc` do JSON) | `ca.json:26-45` | **CONFIRMADO (auditoria-2, fora das cenas)** | Auditoria-2 C1b + C4: RCM 141-A/2026 n.º 16–17; ficha IGCP «suspensa desde 10 de setembro 2021». As cenas não citam CTPV; não reaberto |

### 1.7 Casa, Quiosque, Escola, glossário

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| H1 | Casa: HPI `prc_hpi_q` ÷ custo do trabalho `ei_lmlc_q` (B-S), 2015 = 100 | `dados-p2c.ts` (`dadosCasaP2c`); `data/derived/casa-em-salarios.json` (meta) | **CONFIRMADO** | Ambos os datasets vivos a 2026-10-02: `prc_hpi_q` — label «House price index - quarterly data»; `ei_lmlc_q` — label «Labour cost index, nominal value - quarterly data» (chamada com `indic=LM-LCI-TOT&nace_r2=B-S`). Último ponto da razão: 2026-Q1 = 191,65 (consistente com `serieAte: 2026-03-31`) |
| H2 | «Hoje custa [~192] meses: quase o dobro» | `textos-p2c.ts:40-41` | **CONFIRMADO hoje, FRÁGIL amanhã → proposta P1** | 191,65/100 = 1,92×: «quase o dobro» é fiel. Mas está hardcoded; se a série passar 2,0× a frase mente. Proposta no §2.3 (não editada — copy do dono) |
| H3 | Desemprego: séries `une_rt_m` (PT total, jovens <25, UE27); «conta só quem procura…» | `dados-p2c.ts`; `textos-p2c.ts:139-141` | **CONFIRMADO** | `une_rt_m` viva: label «Unemployment by sex and age - monthly data» (`age=TOTAL` / `Y_LT25`, `unit=PC_ACT` = % da população ativa, `s_adj=SA`) — acesso 2026-10-02. A definição da cena é a definição OIT/Eurostat (sem trabalho + disponível + à procura ÷ ativos; inativos como estudantes fora) |
| H4 | PIB: «produziu X mais/menos do que no mesmo trimestre do ano anterior» | `textos-p2c.ts:125-128`; `dados-p2c.ts` | **CONFIRMADO** | `namq_10_gdp` (`B1GQ`, `CLV_PCH_SM`, `SCA`) viva a 2026-10-02: variação homóloga de volumes encadeados, corrigida de sazonalidade e calendário — exatamente «mesmo trimestre do ano anterior» |
| H5 | Confiança: «0 seria empate»; pessimistas vs otimistas | `textos-p2c.ts:131-134` | **CONFIRMADO** | `ei_bsco_m` (`BS-CSMCI`, `BAL`, `SA`) viva: saldos de respostas (balance statistic) — 0 = neutralidade. Leitura fiel |
| H6 | SMN 920 € (2026, continente) e 505 € (2015) | `data/fiscal/smn.json`; `textos-p2c.ts:135-136` | **CONFIRMADO (o que as cenas mostram)** | 2026: DR «Decreto-Lei n.º 139/2025 (…) determina o aumento da RMMG para € 920,00, com efeitos a partir de 1 de janeiro de 2026» + DGERT «fixou o valor da RMMG em €920». 2015: DGERT/DGAEP «2015, €505,00» (DL 144/2014). Os 966/980 € das ilhas (diplomas regionais, não lidos) **não aparecem nas cenas** — ver §3. Acesso 2026-10-02 |
| H7 | Inflação homóloga do cp00; cadeia vs homóloga | `dados-p2c.ts`; `textos-p2c.ts` (Escola) | **CONFIRMADO** | Definições padrão aplicadas às séries vivas `cp00`/`cp01` (`prc_hicp_minr`); «a inflação das notícias é quase sempre a homóloga» é prática editorial corrente do Eurostat/INE |
| H8 | Glossário ligado na Escola: ipc-ihpc, taxa-real, escalao-irs, spread, tsu | `dados-p2c.ts` (`gloss`); `src/content/glossario.ts` | **CONFIRMADO** | ipc-ihpc: «O IHPC não inclui custos de habitação própria» — Banque de France/Eurostat: «The HICP does not take account of owner-occupied housing costs» (índice OOH separado). taxa-real/escalao-irs/spread/tsu: definições e exemplos sem números falsos (o exemplo do spread é ordem de grandeza correta). Ver também R11, S1, F2 |
| H9 | Dedução à coleta / limite global / PPR e restantes termos do glossário | `glossario.ts` | **Fora do âmbito das cenas** | Não são citados nas 11 cenas (só via `/aprender`). Não verificados; não contam como pendência das cenas |

### 1.8 Negativas da auditoria-2 (re-tentadas)

| # | Afirmação | Onde | Veredicto | Prova |
|---|---|---|---|---|
| N1 | Nenhum valor oficial agregado de comissões/anuidade de cartões no BPstat | `data/fiscal/cartoes.json` (`anuidadeMedia`) | **CONFIRMADO (varrimento novo 2026-10-02, limites no §3)** | 76 domínios confirmados hoje (`/api/domains`, `len = 76`). Varrimento integral dos domínios onde tal série viveria — 8 «Sistemas e instrumentos de pagamento» (399 séries), 20 «Informação sobre o sistema bancário» (49/49), 209 «Crédito aos consumidores» (121) = 520 séries únicas: **0 séries de preços/comissões/anuidade**; cartões só em volumes (SICOI), TAEG e stocks (ex.: 13168964 TAEG cartões). Primeiras 100 séries dos outros 73 domínios: só falsos positivos («Comissão Europeia», CMVM, «papel e cartão»). Única série com «comissões»: 12504523 «Rendimentos de serviços e comissões líquidos» (proveito agregado do sistema, M€ — não preço ao consumidor), como já registado em 2026-09-30 |
| N2 | Nenhuma regra legal de prestação mínima nos cartões | `data/fiscal/cartoes.json` (`prestacaoMinima`) | **CONFIRMADO (auditoria-2 E1, re-verificação da transposição pendente)** | EUR-Lex 32023L2225, art. 48.º (prazos 20-11-2025/20-11-2026) + art. 24.º (só informar o mínimo) — lido em 2026-09-30. A transposição PT tem de ser re-verificada antes de 20-11-2026 (ver §3) |
| N3 | Nenhuma lista pública oficial de taxas de IMI por município | `data/fiscal/imi-2026.json` (`municipios.nota`) | **NÃO CONSEGUI** | Tentativa 2026-10-02: a pesquisa só devolve agregadores comerciais (Doutor Finanças, Idealista, APFN) e o gov.pt a remeter para o Portal das Finanças autenticado. Não se encontrou lista oficial legível sem autenticação — mas «não encontrar» não prova inexistência. Mantém-se o `NÃO CONSEGUI` (ver §3) |

---

## 2. Erros, por gravidade, com a correção aplicada

### 2.1 ALTA — `isp.json` desatualizado: a Bomba mostrava ISP revogado (único ERRADO com prova)

A cena diz «Valores em vigor desde 24 de agosto». A 2026-10-02 está em
vigor a Portaria 437-B/2026/1 (desde 28 de setembro), com valores
**diferentes nos dois combustíveis**. Além disso o gasóleo nunca esteve
certo sob a vigência declarada: o JSON trazia 0,298 €/L («referência
maio/2026») quando a própria portaria citada fixara 0,27999 €/L.
Num depósito de 50 L de gasóleo ao preço DGEG de ~2 €/L, o erro do ISP
era de ~1,80 € só na camada do ISP — e a vigência falsa dizia ao
utilizador que aqueles eram «os valores em vigor».

```diff
--- data/fiscal/isp.json
-  "vigencia": "2026-08-24",
-  "fonte": "Portaria n.º 372-A/2026/1, de 21 de agosto (taxas efetivas com desconto extraordinário); taxa de carbono e valores de referência via impostos-combustiveis/AT",
-  "fonteUrl": "https://diariodarepublica.pt",
-  "nota": "O ISP é revisto por portaria, por vezes semanalmente (mecanismo de desconto extraordinário em vigor desde 2026). Valores indicativos — confirmar a portaria da semana.",
+  "vigencia": "2026-09-28",
+  "fonte": "Portaria n.º 437-B/2026/1, de 25 de setembro (taxas efetivas com desconto extraordinário); taxa de carbono e valores de referência via impostos-combustiveis/AT",
+  "fonteUrl": "https://diariodarepublica.pt/dr/detalhe/portaria/437-b-2026-1174266088",
+  "nota": "O ISP é revisto por portaria, por vezes semanalmente (mecanismo de desconto extraordinário em vigor desde 2026). Valores indicativos — confirmar a portaria da semana. Cadeia recente: 270-A jun → 294-A jul → 345-C 14 ago → 372-A 21 ago → 432-A 18 set → 437-B 25 set.",
   "gasolina95": {
-    "ispELitro": 0.44354,
+    "ispELitro": 0.42409,
     "carbonoELitro": 0.159,
-    "nota": "Portaria 372-A/2026/1 fixou ISP em 443,54 €/1000 L, já com desconto de 53,98 €/1000 L"
+    "nota": "Portaria 437-B/2026/1 fixou ISP em 424,09 €/1000 L, já com desconto de 73,43 €/1000 L (art. 2.º n.º 1; em vigor 28 set 2026)"
   },
   "gasoleo": {
-    "ispELitro": 0.298,
+    "ispELitro": 0.26131,
     "carbonoELitro": 0.173,
-    "nota": "Referência maio/2026; na semana de 24/08 o desconto extraordinário era 81,61 €/1000 L"
+    "nota": "Portaria 437-B/2026/1 fixou ISP em 261,31 €/1000 L, já com desconto de 100,29 €/1000 L (art. 2.º n.º 3; em vigor 28 set 2026). O valor anterior (0,298) era referência de maio/2026, não o da portaria citada"
   }
```

Os testes que tocam o ISP (`p2b-dados.test.ts:86-95,127`,
`engines.test.ts:657`) comparam contra o JSON ou passam argumentos
explícitos — nenhum crava os valores antigos; seguem o dado sem mexer.
`lint`, `typecheck`, `test:unit`, `validate:data`, `build` corridos
(ver §4). Nada mais em `data/` foi tocado.

### 2.2 Propostas de copy para o dono (NÃO editadas — a copy é do dono)

**P1 · `textos-p2c.ts:40-41` — «quase o dobro» hardcoded.** Hoje é
verdade (191,65 → 1,92×). Proposta: parametrizar o advérbio pela razão
(ex.: <1,9 «quase o dobro»; 1,9–2,1 «o dobro»; >2,1 «mais do dobro») ou
trocar por «cerca do dobro». Risco: a série é trimestral e sobe depressa.

**P2 · Bomba, 50 litros sem «exemplo».** `dados-p2b.ts` diz «O depósito
do exemplo — 50 litros, dito no texto como exemplo», mas `bmbFala1`
diz só «O Pedro vai atestar: 50 litros». Proposta: «O Pedro vai
atestar: imagina 50 litros» ou nota «(exemplo)» no `bmbDeposito`.
(Hábito da casa: Dona Arminda e café+pastel dizem «exemplo»; o depósito
devia dizer também.)

**P3 · `irs-2026.json` fonte.** Diz «redação da Lei n.º 73-A/2025
(OE2026)»; o preciso é «art. 71.º da Lei n.º 73-A/2025». Metadados, não
valor — fica como proposta, não se editou.

### 2.3 Nota sem erro — «vinhos comuns»

A verba da Lista II é «1.10 - Vinhos comuns.». A cena escreve «o vinho».
Não se marca erro: a própria cena e o JSON ressalvam que os exemplos
são indicativos e que as listas definem o enquadramento exato (V8), e a
leitura corrente do comércio é a da verba. Regista-se para que o dono
decida se quer «vinho corrente» no texto.

---

## 3. O que continua por provar — e porquê

| Ponto | Porque não fechou |
|---|---|
| Taxa de carbono 0,159 / 0,173 €/L | As portarias do ISP não a fixam; vem de diploma separado e a fonte citada não abriu com valor legível. Não se tocou no valor: inventar ou «confirmar por plausibilidade» violaria a regra n.º 1. Se a AT publicar tabela, é uma linha do JSON |
| IMI: lista pública de taxas por município (N3) | Só agregadores comerciais + Portal autenticado. Provar a negativa exigiria conta AT ou declaração oficial de inexistência — fora do alcance desta sessão |
| Transposição da Diretiva (UE) 2023/2225 | Confirmada a ausência a 2026-09-30 (E1); tem de ser **re-verificada antes de 20-11-2026** (data de aplicação). Marcador para o watchdog, não erro de hoje |
| SMN Açores/Madeira (966/980 €), dedução por dependente 726 € («confirmar OE2026»), `naoAplicaAcimaPorTitular` 16 543,60 €, transcrição integral ISV/IUC | Não são copy das cenas (as cenas mostram continente + 2015; o resto é motor/metadata). Fora do âmbito; o 726 € já vem auto-sinalizado no JSON |
| Domínios BPstat além das primeiras 100 séries (32 domínios com `next=True`) | O varrimento integral cobriu os domínios 8+20+209 (520 séries, 0 comissões) e as primeiras 100 dos restantes. Uma série de comissões fora destes seria semanticamente surpreendente, mas a prova total exigiria paginar ~30+ domínios grandes (MIR incluído) |
| Taxa CA de setembro/2026 (2,500 %) | Confirmada pela auditoria-2 a 30-09-2026; a ficha lida hoje confirma o mecanismo e o cap, não o valor do mês. O `validate:data`/`watchdog` vigia a série |

---

## 4. Gates e entrega

- `lint`, `typecheck`, `test:unit`, `validate:data` (com
  `git checkout -- data/meta/freshness.json` depois), `build`: **verdes**
  (corridos na worktree antes do push; detalhe no PR).
- Mudança em `data/`: só `data/fiscal/isp.json` (E1). Nenhuma cena
  (`textos*`, `dados*`, `*-arte*`, `Cena*`) foi editada — a copy é do
  dono (§2.2).
- PR para `main`, sem merge, sem force-push, sem `-i`, sem `git config`.
  CI verde exigido no último commit.

## 5. Fontes por item (índice rápido)

ISP: DR 372-A/2026 (https://diariodarepublica.pt/dr/detalhe/portaria/372-a-2026-1160679270),
DR 437-B/2026 (https://diariodarepublica.pt/dr/detalhe/portaria/437-b-2026-1174266088).
CIVA/CIRS/Código Contributivo: DR consolidado
(decreto-lei/2008-34500675, lei/2014-70048167, lei/2009-34514575) +
Portal das Finanças (listas CIVA, c-iva-listas.aspx).
IAS: DR 480-A/2025 + DGAEP. SMN: DR 139/2025 + DGERT/DGAEP.
CA: IGCP ficha Série F.
Séries: BPstat API (`/api/series`, `/api/observations`, `/api/domains`),
Eurostat API (`prc_hicp_minr`, `une_rt_m`, `prc_hpi_q`, `namq_10_gdp`,
`ei_bsco_m`, `ei_lmlc_q`), DGEG API (`PrecoComb/PMD`).
Todos os acessos: **2026-10-02** (exceto C1/C6/N2, auditoria-2 de
2026-09-30, assinalados).
