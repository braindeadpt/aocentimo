# 2.ª auditoria independente — PACK DADOS V5 (resultados)

> Feita a **2026-09-30** (21:00–23:00, hora de Lisboa, WEST) por auditor
> independente — LLM com browser — sobre `main` = `1996890`. Item a item do
> [`docs/PROMPT-AUDITORIA-2-DADOS-V5.md`](PROMPT-AUDITORIA-2-DADOS-V5.md)
> (secções **C**, **D**, **E** e **F**), nas fontes, com veredicto e prova
> literal. Corrigiu-se **só** o que o quadro marcou ERRADO e que foi provado
> com o artigo ou a fonte oficial aberta e citada.

**Resumo: 9 CONFIRMADOS, 3 ERRADOS provados (todos corrigidos neste PR, com
testes), 4 por provar.** O erro mais grave não era um número de tabela: era um
regime de pagamento do IUC que **não existe em diploma nenhum** e que o
calendário mostrava ao utilizador como prazo de fevereiro de 2026.

---

## 1. Quadro de veredictos

| Item | Veredicto | Prova (URL + trecho literal + acesso) |
|---|---|---|
| **C1** · `ct.json` série 5 | **CONFIRMADO** | Ficha IGCP: «Informação atualizada em 16 Julho 2026»; «criados pela RCM 141-A/2026, de 3 de julho (DR 127/2026, Suplemento da Série I de 2026-07-03)»; taxas «1.º ano - 2,35 % … 10.º ano - 3,35 %»; «Não há capitalização de juros»; convenção «30/360»; resgate «perda total dos juros decorridos desde o último vencimento de juros»; mín/máx «1.000 / 1.000.000 unidades». RCM no DR: n.º 5 alíneas a)–j) = mesmas 10 taxas. — igcp.pt/pt/ficha-tecnica-certificados-do-tesouro-serie-5-0 e diariodarepublica.pt/dr/detalhe/resolucao-conselho-ministros/141-a-2026-1144096133, 2026-09-30 |
| **C1b** · CTPV suspensa | **CONFIRMADO** | RCM 141-A/2026, n.º 16: «Determinar a suspensão de novas subscrições de CTPV, criados pela Resolução do Conselho de Ministros n.º 131-B/2021, de 10 de setembro, a partir da data de entrada em vigor da presente resolução.»; n.º 17: «entra em vigor no dia 6 de julho de 2026» → **suspensa desde 2026-07-06**, como diz o `ct.json` |
| **C2** · `alteracaoLoe2026` | **CONFIRMADO** | LOE 2026, art. 82.º (DR 250/2025 Supl., Série I de 2025-12-30): «Os artigos 8.º e 52.º do Código do Imposto sobre Veículos … passam a ter a seguinte redação»; alínea d) do art. 8.º: «25 %, aos automóveis ligeiros de passageiros equipados com motores híbridos plug-in, … autonomia mínima, no modo elétrico, de 50 km e emissões oficiais inferiores a 50 gCO₂/km ou, quando homologados de acordo com a norma de emissões 'Euro 6e-bis', nos termos do Regulamento (UE) 2023/443 …, a 80 gCO₂/km». Nota: o art. 82.º altera **também** o art. 52.º do CISV (isenções de IPSS/desporto) — o `isv-2026.json` não regista essa segunda alteração, sem efeito no motor — diariodarepublica.pt/dr/detalhe/lei/73-a-2025-993270096, 2026-09-30 |
| **C3** · `cobrancas` + `ultimaAlteracaoTaxas` | **ERRADO → corrigido** | A LOE 2026 **não toca no Código do IUC**: a lista completa dos 200+ artigos contém um só com «IUC» — o 94.º, «Mantém-se em vigor o adicional de imposto único de circulação». E a frase «alterou apenas o artigo 7.º … com efeitos a partir de 2027-01-01» não está na LOE. Quem altera o código é o **Decreto-Lei n.º 161/2026, de 4 de agosto** (autorização da Lei n.º 27/2026): «entra em vigor no dia seguinte ao da sua publicação e produz efeitos a partir de 1 de janeiro de 2027»; o pagamento passa a ser em **abril** («a) Numa única prestação, no mês de abril, quando o montante seja igual ou inferior a 100 €; b) Em duas prestações, nos meses de abril e outubro, quando o montante seja superior a 100 € e igual ou inferior a 500 €; c) Em três prestações, nos meses de abril, julho e outubro, quando o montante seja superior a 500 €»); em 2027 há regime transitório (outubro; julho+outubro acima de 500 €). «Fevereiro» não está em diploma nenhum — diariodarepublica.pt/dr/detalhe/decreto-lei/161-2026-1154275218, 2026-09-30 |
| **C4** · `ca.json` Série F | **CONFIRMADO** | Simulador IGCP, subscrição 30-09-2026, Continente: «30/09/2026 · Taxa Bruta · 28,000% · F · 1,800% · 0,000% · **2,500%** · 09/2026 - 11/2026» — taxa no cap de 2,50 %, prémio 0 % no 1.º ano. Ficha técnica: «A taxa base não poderá ser superior a 2,50 % nem inferior a 0 %»; prémios «0,25 % - do 2º ao 5º ano; 0,50 % - do 6º ao 9º; 1,00 % - no 10º e 11º; 1,50 % - no 12º e 13º; 1,75% - no 14.º e 15º»; «Capitalização automática dos juros vencidos»; reembolso no «15º aniversário». CTPC (mesma página do site): «encontra-se suspensa desde 10 de setembro 2021», criados pela «RCM nº 157-D/2017, de 27 de outubro de 2017», prémio «40% do crescimento médio real do PIB … máximo de 1,2%» — tudo como em `ca.json` — igcp.pt/pt/aforristas/produtos-de-aforro/certificados-de-aforro e …/ficha-tecnica-certificados-de-aforro-serie-f, 2026-09-30 |
| **D** · `taxasIntermedias.regra` (60 % «Híbrido (não plug-in)») | **CONFIRMADO** | Art. 8.º n.º 1 do CISV consolidado (Lei 22-A/2007), alínea a alínea: **a)** «60 %, aos automóveis ligeiros de passageiros que se apresentem equipados com motores híbridos, preparados para o consumo, no seu sistema de propulsão, quer de energia elétrica ou solar quer de gasolina ou de gasóleo, **desde que apresentem uma autonomia em modo elétrico superior a 50 km e emissões oficiais inferiores a 50 gCO₂/km**»; **b)** 40 % mistos >2500 kg, 7 lugares, sem 4×4; **c)** 40 % gás natural exclusivo; **d)** 25 % plug-in (50 km e <50 gCO₂/km; ou 80 gCO₂/km em Euro 6e-bis — redação da LOE 2026); **e)** 25 % plug-in matriculados noutro EM entre 2015 e 2020 com autonomia ≥25 km; n.º 2 revogado; n.º 3 — 50 % da tabela B para mercadorias de caixa aberta com 4×4. A condição da alínea a) é **literalmente** a que o JSON grava: o legislador exige a um híbrido *não* ligável à rede a mesma autonomia e emissões que a alínea d) exige a um plug-in (só se distingam pela bateria carregável). A «suspeita» era legítima — e a lei está mesmo do lado do JSON. A designação «(não plug-in)» é interpretação nossa e está correta: o plug-in tem regra própria na d). O comentário de `carro.ts` foi reescrito para citar a base legal — diariodarepublica.pt/dr/legislacao-consolidada/lei/2007-34445975, 2026-09-30 |
| **E1** · Dir. (UE) 2023/2225, art. 48.º | **CONFIRMADO** | EUR-Lex, CELEX 32023L2225, art. 48.º: «1. Os Estados-Membros devem adotar e publicar, até 20 de novembro de 2025, as disposições legislativas, regulamentares e administrativas necessárias … Os Estados-Membros devem aplicar essas disposições a partir de 20 de novembro de 2026.» Quanto a reembolso mínimo: varrido o texto, o único «montante mínimo a pagar» está no **art. 24.º** (extratos de facilidades de descoberto): «h) Se for caso disso, o montante mínimo a pagar pelo consumidor» — informar, não fixar. **Não há reembolso mínimo imposto pela diretiva para cartões**, como diz o `cartoes.json` — eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:32023L2225, 2026-09-30 |
| **E2** · Lei n.º 24/2023 | **CONFIRMADO** | DR detalhe: «Lei n.º 24/2023, de 29 de maio» — e o consolidado do DL 27-C/2000 lista «Lei n.º 24/2023 - Diário da República n.º 103/2023, Série I de 2023-05-29». Art. 6.º: «O artigo 3.º do Decreto-Lei n.º 27-C/2000, de 10 de março, passa a ter a seguinte redação» (n.º 2: «48 transferências interbancárias, por cada ano civil … 5 transferências, por cada mês, com o limite de 30 euros …»). Datas da própria lei: «Aprovada em 14 de abril de 2023. — O Presidente da Assembleia da República, Augusto Santos Silva. Promulgada em 18 de maio de 2023. — O Presidente da República, Marcelo Rebelo de Sousa.»; entrada em vigor: «3 - O disposto nos artigos 2.º, 3.º e 6.º entra em vigor 90 dias após a publicação» → 29-05-2023 + 90 dias = **2023-08-27**, como diz o `servicos-minimos.json` — diariodarepublica.pt/dr/detalhe/lei/24-2023-213650800, 2026-09-30 |
| **E3a** · `servicos-minimos.json` → nota | **ERRADO → corrigido** | O campo «nota» mandava «ver comissoes-bancarias.json», ficheiro que não existe. Onde a razão está de facto: `cartoes.json → anuidadeMedia` (varrimento BPstat + Comparador de Comissões). Ver diff 4 |
| **E3b** · `ct.json` → ctpc.nota | **ERRADO → corrigido** | A nota dizia «Subscreveu-se em 2017 … Nunca mais se subscreveu» sem dizer quando fechou; a mesma ficha IGCP diz «encontra-se suspensa desde 10 de setembro 2021». Texto novo liga as duas datas e cita a RCM 157-D/2017 (DR 208/2017, 1.º Supl.). Ver diff 3 |
| **F** · 15 casos novos (5 por motor) | **CONFIRMADO (14/15 à primeira; 1 corrigido)** | Tabela no §3. Um bug de fronteira apanhado fora dos casos, pela leitura da lei; um artefacto de mensagem de erro; zero diferenças de aritmética — ver §3 |

---

## 2. Erros, por gravidade, com a correção aplicada

Ordem: facto errado que chegava ao utilizador > número errado na fronteira de
um escalão > frase errada > estilo/diagnóstico.

### 2.1 · ERRADO (facto com efeito no site) — o regime de pagamento do IUC de 2026 foi inventado

`iuc-2026.json → cobrancas` e `calendario-2026.json → iuc-1/iuc-2` afirmavam
«Novo em 2026: o IUC deixa o mês da matrícula … fevereiro e outubro». **Não há
diploma que diga isso.** O que existe:

- A **LOE 2026 (Lei 73-A/2025) não altera o Código do IUC** — verificado artigo
  a artigo na lista completa do articulado (única menção: art. 94.º, que
  mantém o adicional do gasóleo).
- O **DL 161/2026, de 4 de agosto** altera o código (base tributável +
  pagamento) mas «produz efeitos a partir de 1 de janeiro de 2027», com
  pagamento em **abril** (e não fevereiro) e um regime transitório próprio em
  2027 (outubro; julho+outubro acima de 500 €).
- Em 2026 vale o art. 7.º como sempre esteve: **pagamento no mês da matrícula**.

A página `/dados` consume o calendário e mostraria fevereiro como prazo do IUC.

```diff
--- data/fiscal/iuc-2026.json (cobrancas)
-  "nota": "Em 2026 o IUC deixou de ser pago no mês da matrícula: ou se paga
-   tudo em fevereiro, ou, acima de 100 €, se divide em duas prestções
-   (fevereiro e outubro). Ver data/fiscal/calendario-2026.json."
+  "regimeVigorEm2026": "mês da matrícula",
+  "nota": "Em 2026 o IUC continua a pagar-se no mês da matrícula, como sempre
+   esteve no art. 7.º do código. O novo regime — liquidação anual centralizada
+   por contribuinte, a pagar em abril (uma prestação até 100 €; abril e outubro
+   de 100 € a 500 €; abril, julho e outubro acima de 500 €) — foi criado pelo
+   Decreto-Lei n.º 161/2026, de 4 de agosto, e produz efeitos apenas a partir
+   de 2027-01-01; em 2027 há ainda um regime transitório (outubro, ou julho e
+   outubro acima de 500 €). As datas de fevereiro que circularam para 2026
+   nunca estiveram em diploma algum."

--- data/fiscal/iuc-2026.json (ultimaAlteracaoTaxas.nota)
-  "… A LOE 2026 (Lei n.º 73-A/2025) não alterou as taxas do IUC — alterou
-   apenas o artigo 7.º (base tributável) do IUC, com efeitos a partir de
-   2027-01-01."
+  "… A LOE 2026 (Lei n.º 73-A/2025) não altera o Código do IUC em artigo
+   nenhum — o único artigo que toca no IUC é o 94.º, que se limita a manter o
+   adicional do gasóleo. Quem altera o código é o Decreto-Lei n.º 161/2026, de
+   4 de agosto (autorização legislativa da Lei n.º 27/2026): muda a base
+   tributável e o regime de pagamento, mas produz efeitos apenas a partir de
+   2027-01-01."

--- data/fiscal/calendario-2026.json (iuc-1)
-  "titulo": "IUC — 1.ª prestação (ou total se ≤ 100 €)"
-  "descricao": "Novo em 2026: o IUC deixa o mês da matrícula. Até 100 €
-   paga-se tudo em fevereiro; acima disso podes dividir — fevereiro e outubro."
+  "titulo": "IUC — pagamento no mês da matrícula (ou total se ≤ 100 €)"
+  "descricao": "Em 2026 o IUC continua a pagar-se no mês da matrícula — não há
+   mudança em fevereiro. O novo regime (pagamento em abril, com prestações) só
+   vale a partir de 2027. Se a tua matrícula não é em fevereiro, o teu IUC não
+   vence neste mês."
  (iuc-2, idem: «Em 2026 não há 2.ª prestação de IUC … As duas prestações
   (abril e outubro) só existem a partir de 2027, para liquidações entre
   100 € e 500 €»; fonte e nota do calendário actualizadas com o DL 161/2026.)
```

### 2.2 · ERRADO (número na fronteira de uma regra) — IUC: adicional de CO2 negado a quem matriculou em 2017

`carro.ts` aplicava a taxa adicional do art. 10.º n.º 2 do CIUC só quando
`anoMatricula > 2017`. A lei: «cuja data da primeira matrícula … seja
**posterior a 1 de janeiro de 2017**» — quem matriculou a 20-06-2017 **paga**.
Com ano como único dado, a fronteira certa é `>= 2017`.

```diff
--- src/lib/engines/carro.ts
-  if (e.anoMatricula > 2017) {
+  // Art. 10.º n.º 2 do CIUC: a taxa adicional é devida quando a primeira
+  // matrícula é «posterior a 1 de janeiro de 2017» — ou seja, desde 2017.
+  // Com `> 2017`, um carro matriculado em junho de 2017 perdia a taxa que a
+  // lei lhe dá; a fronteira certa com o ano como único dado é `>= 2017`.
+  if (e.anoMatricula >= 2017) {
```

Exemplo numérico (o que o teste golden novo trava): ligeiro de mercadorias a
gasóleo, 2000 cm³, 230 gCO₂/km WLTP, matriculado em 2017 →
(127,35 + 212,04 + 31,77) × 1,15 = **426,83 €**; antes da correção saía
(127,35 + 212,04) × 1,15 = **390,30 €** — 36,53 € de IUC por ano a menos que a
lei manda cobrar. (Este caso não estava nos 15 do plano: foi a leitura do
artigo, não o caso 2018, que o apanhou.)

### 2.3 · ERRADO (frase) — `ct.json`: «Nunca mais se subscreveu» sem dizer quando fechou

A ficha IGCP dos CTPC diz «encontra-se suspensa desde 10 de setembro 2021».
Ver diff no §1 (E3b): a nota agora liga 2017 (criação, RCM 157-D/2017, DR
208/2017, 1.º Supl.) a 2021-09-10 (última subscrição possível, RCM 131-B/2021).

### 2.4 · ERRADO (frase) — `servicos-minimos.json`: nota apontava para um ficheiro que não existe

«ver comissoes-bancarias.json, que não existe: ver a nota desse ficheiro» —
mandava o leitor para a nota de um ficheiro inexistente. Agora aponta para onde
a razão vive de facto (`cartoes.json → anuidadeMedia`).

### 2.5 · Corrigido (estilo/diagnóstico) — mensagem de erro do IMI truncava o intervalo legal

`imi.ts` escrevia «fora do intervalo legal 0.3 % – 0.4 %»: `toFixed(1)` sobre
`0.0045` arredonda a «0.0» por causa do float. A mensagem de um motor fiscal
tem de dizer 0,45 % — agora formata com duas casas e vírgula decimal, com teste
golden novo que trava a regressão.

### 2.6 · Corrigido (estilo) — comentário de `carro.ts` sobre as taxas intermédias

O comentário resumia «60 para híbrido elegível, 25 para plug-in, 40 para gás
natural» sem a condição legal que torna o 60 % elegível. Reescrito com a
condição da alínea a) — que a auditoria confirmou ser literal do art. 8.º n.º 1
(o JSON estava certo; a «suspeita» de que a condição seria de plug-in não se
confirma no texto da lei).

### 2.7 · Nota de ambiente — `.preview-scratch/` fora do lint

Os chunks minificados de um build da sessão vizinha em `.preview-scratch/`
(ignorado pelo git) entravam no `eslint .` e partiam o gate com erros de JS
minificado. Adicionado ao `ignores` do `eslint.config.mjs`. Não é dado nem
código de produto.

---

## 3. Item F — 15 casos novos, calculados à mão e comparados com os motores

Casos escolhidos fora dos já cobertos pelos testes existentes. Cálculo à mão
pelos artigos lidos (art. 7.º/8.º/11.º CISV; art. 9.º/10.º CIUC; art. 112.º/120.º
CIMI; mecânica de juros do cartão). Fontes: DR consolidado e Portal das
Finanças, 2026-09-30.

**IMI** (`imi.ts`):

| Caso | À mão | Motor | Veredicto |
|---|---|---|---|
| 100,01 € em prestações | 2 × (50,01 + 50,00), maio+nov | `[50.01, 50]` | ✔ |
| 500,00 € (fronteira) | 2 prestações («até 500 €») | `[250, 250]` | ✔ |
| 500,01 € (fronteira) | 3 prestações, maio+ago+nov | `[166.67 ×3]` | ✔ |
| Porto, VPT 100 000 € | 324,00 → 2 × 162 | 324, 2×162 | ✔ |
| Porto degradado + 3 dependentes | 388,80 − 140 + 116,64 = 365,44 | 365,44 | ✔ |

Achado lateral: a mensagem de erro do intervalo legal dizia «0.4 %» — corrigido
(§2.5). (Nota: a taxa dos rústicos, 0,8 %, está fora do âmbito do motor, que é
só para prédios urbanos — o motor recusa-a e deve recusar.)

**ISV** (`carro.ts` — `isv`):

| Caso | À mão | Motor | Veredicto |
|---|---|---|---|
| Gasóleo 1900 cm³, 160 g/km WLTP | 4 464,12 + (160×160,81−21 176,06 = 4 553,54) + 500 = **9 517,66** | 9 517,66 | ✔ |
| Gasóleo 1900 cm³, **161** g/km WLTP | 4 464,12 + (161×221,69−29 227,38 = 6 464,71) + 500 = **11 428,83** | 11 428,83 | ✔ |
| — salto no escalão | +1 g/km custa **1 911,17 €** | igual | ✔ |
| Gasolina 1500 cm³, 236 g/km WLTP | 2 220,12 + (236×233,81−41 910,96 = 13 268,20) = 15 488,32 | 15 488,32 | ✔ |
| Gasolina 1600 cm³, 110 g/km **NEDC** | 2 781,12 + (110×8,09−750,99 = 138,91) = 2 920,03 | 2 920,03 | ✔ |
| Usado UE 6,5 anos (redução 60 %) + taxa intermédia 60 % | 1 789,59 → −60 % (1 073,75) → ×0,6 = 429,50 | 429,50 | ✔ (as duas percentagens comutam) |

**IUC** (`carro.ts` — `iuc`):

| Caso | À mão | Motor | Veredicto |
|---|---|---|---|
| Cat. B, 2000 cm³, **265** g/km WLTP (último escalão), matrícula **2008** (coef. 1,05) | (127,35 + 363,25) × 1,05 = **515,13** (sem adicional: 2008 < 2017) | 515,13 | ✔ |
| O mesmo com matrícula **2018** | (127,35 + 363,25 + 63,74) × 1,15 = **637,49** | 637,49 | ✔ |
| Cat. A, 3000 cm³, matrícula 1985 (coluna 1981–1989) | 79,72 | 79,72 | ✔ |
| Cat. A, 700 cm³, matrícula 1997 | 19,90 | 19,90 | ✔ |
| Cat. B, 2600 cm³, 240 g/km NEDC, 2016 | (435,84 + 212,04) × 1,15 = **745,06** | 745,06 | ✔ |

A fronteira 160/161 do gasóleo WLTP (escalão 151–160: 160,81/21 176,06;
escalão 161–170: 221,69/29 227,38) está certa no motor **e** nos números
gravados — os dois valores batem com o art. 7.º lido no DR.

**Cartão** (`cartao.ts`):

| Caso | Referência independente | Motor | Veredicto |
|---|---|---|---|
| 2 500 €, TAEG 21,5 %, 2 % + mínimo 15 € | mês 1: juros 40,90, paga 50 | idem | ✔ |
| 800 €, 18 %, 5 % | 238 meses, 307,65 € de juros | idem | ✔ |
| 1 000 €, **0 %**, 3 % | 284 meses, 0 € de juros | idem | ✔ |
| 3 000 €, 19,9 %, 3 % + mínimo 10 € | mês 1: juros 45,72, paga 90 | idem | ✔ |
| 500 €, 24 %, **4 % sem mínimo em euros** | não liquida (resíduo 0,37 € preso) | `liquidado:false`, 600 meses | ✔ (ver nota) |

Nota sobre o último caso: confirmei com uma simulação de referência escrita de
fora (sem tocar no motor) que o comportamento é idêntico ao cêntimo — quando a
prestação mínima é só uma percentagem, perto do fim o pagamento arredonda ao
cêntimo igual aos juros do mês e a dívida deixa de descer. O motor **erra
alto e diz que não liquida** em vez de inventar, como promete o seu comentário.
Não é bug de aritmética; é a consequência honesta de simular um contrato sem o
mínimo em euros que os contratos reais têm. Recomendação para as cenas do
Banco: chamar sempre `simularCartao` com `prestacaoMinimaEuros` do contrato;
sem ele, mostrar ao utilizador que a simulação não fecha.Golden tests novos neste PR: IUC 2017 paga adicional (§2.2) e mensagem de erro
 do IMI por inteiro (§2.5). Total: 473 testes, todos verdes.

### 4-A · RESOLVIDO por OCR — a deliberação do IMI Familiar do Porto 2026

> **Anexo arquivado:** a prova física desta leitura (PDF original, as 3
> páginas rasterizadas e o transcript integral do OCR) está em
> [`docs/ANEXO-OCR-IMI-FAMILIAR-PORTO/`](ANEXO-OCR-IMI-FAMILIAR-PORTO/README.md),
> com proveniência, método e hashes SHA-256.

O PDF digitalizado do município (3 páginas, zero texto embutido) foi lido com
tesseract (WASM, via npm, sem alterar as dependências do repo) —
`NUD/289978/2026/CMP`, do site da Câmara Municipal do Porto, baixado e lido a
2026-09-30. Trechos literais do OCR:

> «a Assembleia Municipal do Porto, reunida em sessão de 27/04/2026, delibera
> recomendar ao Executivo Municipal que: … Adote, os escalões máximos de
> dedução permitidos por lei, ou seja: 30,00€ para famílias com 1 dependente;
> 70,00€ para famílias com 2 dependentes; 140,00€ para famílias com 3 ou mais
> dependentes» — «para vigorar no próximo ano fiscal».
>
> «Deliberação: Aprovada, por maioria, com 8 votos a favor (3 IL + 3 CH + 2
> FA), 3 votos contra (2 CDU + 1 B.E.) e 33 abstenções (15 PS + 13 PPD/PSD + 3
> CDS-PP + 2 L). Deliberada em Sessão Ordinária de 27 de abril de 2026.»

Duas consequências:

1. **A dedução do Porto não entra no `imi-2026.json` como número ativo.** O
   documento é uma **recomendação** ao Executivo («delibera recomendar ao
   Executivo Municipal que: apresente uma proposta de fixação das taxas»), e a
   própria diz «para vigorar no próximo ano fiscal». O art. 112.º n.º 14 do
   CIMI (Portal das Finanças, lido a 2026-09-30) manda comunicar as deliberações
   à AT «para vigorarem no ano seguinte», até 31 de dezembro — por isso nada
   do que se decidiu em abril de 2026 muda o IMI de 2026. Os tectos legais
   30/70/140 € do art. 112.º-A já estão no pack, e o motor aplica-os quando
   `imiFamiliar: true`.
2. **Fica registada a pista para 2027:** se o Executivo seguir a recomendação,
   a proposta de taxas com os escalões máximos sai para o IMI de 2027. A nota
   do `imi-2026.json → imiFamiliar` ficou atualizada com a fonte, o NUD e a
   razão legal por que não se grava dedução ativa para 2026.

---

## 4. O que continua por provar — e porquê

| Ponto | Porque não fechou nesta auditoria |
|---|---|
| ~~IMI Familiar do Porto 2026~~ → **RESOLVIDO por OCR (ver §4-A)** | Era o único «NÃO CONSEGUI» desta auditoria. Fechado a 2026-09-30 com tesseract (WASM, npm) sobre o PDF digitalizado do município — ver §4-A |
| Transcrição integral das tabelas do ISV/IUC/IMI, número a número (item A do prompt interno) | Não era o âmbito desta encomenda (C–F). As tabelas **usadas** pelos 15 casos F e pelas fronteiras verificadas (160/161 gasóleo WLTP, último escalão CO2, coeficientes, prestações) bateram todas; o resto da transcrição continua à espera de um varrimento com script |
| «Não foi encontrada transposição da Dir. 2023/2225 para Portugal» (`cartoes.json`) | Afirmação negativa; exige repetir a varredura (DR, Portal do Cliente Bancário, EUR-Lex National transposition) próximo de 20-11-2026. As datas e a ausência de reembolso mínimo na diretiva estão provadas (E1); a ausência da transposição **hoje** não foi re-provada nesta sessão |
| Anuidade média de cartões / comissões agregadas (afirmações negativas do BPstat) | Repetição do varrimento aos 76 domínios não feita nesta sessão (fora do âmbito C–F); a 1.ª auditoria varreu e o registo está em `cartoes.json → anuidadeMedia` |
| Coeficientes do IUC no DR | Continuam a não renderizar no DOM do DR; provados pela via alternativa oficial (Portal das Finanças, `iuc10.aspx`), que é a fonte que o próprio `iuc-2026.json` declara em `fonteTabelaCoeficientes` |

---

## 5. Frase final

**O pack está em condições de sustentar as cenas do Banco, das Finanças, da
Bomba e dos Correios — com as correções deste PR aplicadas.** Não resta
nenhum «NÃO CONSEGUI» desta auditoria: a deliberação do IMI Familiar do Porto
foi lida por OCR (§4-A) e confirmou que não há dedução do Porto a gravar para
2026 — a recomendação de abril aponta para 2027.

Antes delas, não: o calendário dizia a meio da página `/dados` que o IUC
passava a pagar-se em fevereiro de 2026 — falso, e quem tem a matrícula em
janeiro e seguiu o calendário podia pagar em fevereiro, já fora do prazo, e
levar com a coima; o motor do IUC negava a taxa adicional a quem matriculou em
2017; e duas notas mandavam o leitor para sítios que não existem. O que ficou provado nas fontes — CT série 5 e CTPV (IGCP + RCM
141-A/2026), CA Série F (IGCP), art. 8.º do ISV alínea a alínea, art. 48.º da
Diretiva 2023/2225, Lei 24/2023 com as suas datas, regime do IUC no DL
161/2026 — bate com os JSON; os 15 casos F bateram com os motores ao cêntimo;
e os dois bugs apanhados têm agora teste golden que os teria travado. O que
fica em aberto está declarado no §4: a retranscrição integral das tabelas (item
A) espera um varrimento com script — o IMI Familiar do Porto foi fechado por
OCR no §4-A — e a transposição da diretiva do crédito ao consumo tem de ser
re-verificada antes de 20 de novembro de 2026.
