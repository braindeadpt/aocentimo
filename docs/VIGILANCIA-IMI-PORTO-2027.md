# Vigilância — IMI Familiar do Porto (deliberação de taxas para 2027)

> Preparado a **2026-10-01** no fecho do varrimento das tabelas. Fecha o laço
> que ficou aberto no §4-A da
> [`AUDITORIA-2-RESULTADOS-DADOS-V5.md`](AUDITORIA-2-RESULTADOS-DADOS-V5.md):
> a recomendação da Assembleia Municipal do Porto de 2026-04-27 aponta para os
> escalões máximos do IMI Familiar «para vigorar no próximo ano fiscal» — mas
> **recomendação não é deliberação de taxas**. A deliberação formal, que é a
> que se grava no pack, deve sair entre novembro e dezembro de 2026. Regra que
> não cede: **nada se escreve no pack antes do PDF da deliberação estar aberto
> e citado.**

## O essencial

| Data | O quê | Fonte/Estado |
|---|---|---|
| 27-04-2026 | **Recomendação** NUD/289978/2026/CMP ao Executivo: adotar os escalões máximos — 30,00 € (1 dependente), 70,00 € (2), 140,00 € (3 ou mais) — «para vigorar no próximo ano fiscal». Aprovada por maioria (8 a favor, 3 contra, 33 abstenções). Lida por OCR do PDF digitalizado | §4-A da auditoria |
| — | Tectos legais do art. 112.º-A do CIMI (Lei n.º 56/2023): 30/70/140 € — **já estão no pack**; o que falta é a deliberação do Porto que os ative | `data/fiscal/imi-2026.json → imiFamiliar` |
| **Nov–Dez 2026** | **O que se espera apanhar**: proposta do Executivo + deliberação da AM de fixação das taxas do IMI para 2027. Padrão do ciclo anterior: sessão ordinária de 19-12-2025 aprovou a taxa de 0,324 % (minuta no BME, `P40_ID=154026`) | esta vigilância |
| **até 31-12-2026** | As deliberações comunicadas à AT «para vigorar no ano seguinte» (art. 112.º n.º 14 do CIMI) — é isto que faz a deliberação de dez/2026 valer no IMI de 2027 | AT, CIMI art. 112.º n.º 14 |
| 2027 | Se confirmada: criar `data/fiscal/imi-2027.json` (ver § «O que atualizar») e o IMI Familiar de 30/70/140 € passa a estar ativo no Porto | § abaixo |

A janela nov/dez não é arbitraria: por força do n.º 14 do art. 112.º, o que a
AM não deliberar e comunicar até 31 de dezembro não muda o IMI do ano
seguinte. E sem deliberação municipal **não há dedução** — o tecto legal, por
si, não deduz nada a ninguém.

## Como a vigilância corre (já montada no PR)

- **Sinais**: três páginas de deliberações do cm-porto.pt —
  [`/deliberacoes-minutas`](https://www.cm-porto.pt/deliberacoes-minutas),
  [`/deliberacoes-propostas`](https://www.cm-porto.pt/deliberacoes-propostas) e
  [`/deliberacoes-recomendacoes`](https://www.cm-porto.pt/deliberacoes-recomendacoes).
  Todas WordPress com HTML server-side (verificadas com curl a 2026-10-01;
  o porto.pt novo é Next.js e o BME exige sessão para pesquisar — por isso
  não são sinais automáticos, só confirmação manual).
- **Detetor**: `scripts/ingest/imi-porto-2027.ts` + `imi-porto-2027-cli.ts`.
  Extrai os documentos listados (blocos JSON embutidos + âncoras /files/),
  guarda o estado em `data/meta/imi-porto-2027-vigilia.json` e distingue três
  fins: `0` nada de novo · `2` **ALARME** (documento novo em qualquer página)
  · `1` falha honesta (rede/estrutura mudou).
- **O alarme é um despertador, não é dado.** O título das minutas é genérico
  («Minuta da Ata, N.ª Reunião…») — a fixação das taxas está DENTRO do PDF. O
  detetor destacou em `destacados` os novos cujo título menciona IMI/taxas
  (na semente de 2026-10-01: duas recomendações antigas sobre IMI), mas toda
  a minuta/proposta nova de nov/dez merece abertura manual. Nunca se infere
  o conteúdo de um PDF pelo nome do ficheiro.
- **Agenda**: `.github/workflows/imi-porto-2027-watch.yml` — segundas de
  novembro e segundas+quintas de dezembro, 07:23 UTC (`workflow_dispatch`
  para correr à mão). Documento novo abre/comenta a issue «IMI Porto 2027:
  documento novo da Assembleia Municipal» e comita o estado.
- **Estado semente**: captura real de 2026-10-01 (329 documentos listados nas
  três páginas, de 2018 a 2026) guardada como `data/meta/…-vigilia.json` e
  como fixture de teste `scripts/ingest/imi-porto-2027.fixture-minutas.html`.

## Checklist quando o alarme disparar (ou a 05-12-2026, o que chegar primeiro)

1. **Abrir o PDF novo** (a issue lista os novos; o estado completo está em
   `data/meta/imi-porto-2027-vigilia.json`). Procurar: «IMI», «fixação das
   taxas», «IMI Familiar», «dependentes». Guardar URL + trecho literal + data
   (regra da casa).
2. **Classificar o documento** — só um deles escreve números no pack:
   - **Deliberação da AM** (minuta de sessão com votação): é a que ativa a
     dedução e fixa as taxas → seguir no § abaixo.
   - **Proposta do Executivo** (na página de propostas ou como ponto da
     Câmara): ainda não basta — esperar a minuta da sessão da AM de dezembro.
   - **Recomendação** (como a de abril): só pista; a de 2026-04-27 já está
     registada na nota do `imi-2026.json → imiFamiliar`.
3. **Extrair literalmente**, se for a deliberação de taxas:
   - taxa do IMI urbano para 2027 (em 2025/2026 foi 0,324 %);
   - redução para habitação própria e permanente (15 %, via RIIMMP —
     confirmar se vem na mesma deliberação ou fica no regulamento);
   - majoração de prédios degradados (30 %);
   - **IMI Familiar**: aprovou os escalões máximos 30/70/140 €? valores
     menores? nada? (o silêncio também é resultado: sem deliberação, sem
     dedução ativa em 2027).
   - número de processo (padrão `NUD/…/2026/CMP`), data da sessão, votação,
     e a ligação do BME com `P40_ID` novo (é a `fonteUrl` do JSON).
4. **Comunicação à AT** (art. 112.º n.º 14): se o PDF ou a ata a mencionarem,
   citar; se não, registar «comunicação por confirmar» — a prova final é a
   nota de liquidação de 2027 e a página de taxas da AT (Portal das Finanças,
   que não é fetchável — confirmação manual em janeiro).
5. **Fazer o § abaixo**, correr os gates, abrir o PR citando o PDF, e fechar
   a issue com a referência ao PR.

## Se a deliberação NÃO sair (a fechar a 15-01-2027)

- Registar a ausência: sem deliberação comunicada até 31-12-2026, **não há
  IMI Familiar no Porto em 2027** — e o `imi-2027.json`, se entretanto for
  criado, não grava dedução ativa do Porto (a nota explica a razão legal).
- A taxa de 0,324 % **não se copia por inércia**: ou há prova (minuta,
  comunicação, liquidação) de que foi mantida, ou o campo fica sem prova e o
  motor recusa a taxa do Porto em 2027 — falhar alto, nunca assumir.
- Manter a vigilância a correr (o cron só atua em nov/dez; voltar a ativar
  em 2027 com o mesmo padrão para o IMI de 2028).

## O que atualizar no imi-2027.json (com a deliberação na mão)

O ficheiro **não existe ainda** — cria-se a partir do `imi-2026.json`, campo
a campo:

1. **Identidade**: `ano: 2027`, `anoImposto: 2026`, `vigencia: "2027-01-01"`.
   É a `vigencia` que faz o `scripts/derive/fiscal-fontes.ts` descobrir o
   ficheiro sozinho (readdir + `vigencia`); adicionar também
   `"imi-2027": "AT/DR — CIMI (DL 287/2003) — curado"` ao
   `NOME_POR_FICHEIRO` para a etiqueta da série `fiscal-imi-2027`.
2. **`porto`** (só com a redação literal citada — nunca por inércia):
   - `taxa`: a aprovada para 2027; se for a mesma de 0,324 %, citar na mesma
     («mantida, deliberação de DD-12-2026»);
   - `anoImposto: 2026`;
   - `reducaoHabitacaoPropriaPermanente`: 0,15 se a deliberação/RIIMMP a
     mantiver — e **recalcular** `taxaEfetivaHabitacaoPropriaPermanente =
     taxa × (1 − redução)` (com 0,324 %: 0,2754 %); nunca copiar sem conta;
   - `majoracaoPrediosDegradados`: 0,30 se confirmada;
   - `fonteUrl`/`fonte`/`redacaoLiteral`: da minuta de 2026 (BME com `P40_ID`
     novo) — o padrão da de 2025 é `bme.cm-porto.pt/apex/f?p=101:40:…`;
   - `nota`: nova, com o NUD, a data da sessão e a votação; verificar se a
     gralha «para o ano 2025» da minuta de dez/2025 se repete (e registar se
     registar).
3. **`imiFamiliar`** — a razão de ser desta vigilância:
   - `deducoes`: os valores **deliberados** pela AM (se forem os tectos:
     30/70/140 € com a designação «3 ou mais» na terceira linha, como hoje);
   - `nota`: substituir a nota da recomendação de abril pela da deliberação
     formal (NUD, data, votação), mantendo a recomendação como antecedente;
   - `base`/`mecanismo`/`condicoes`/`composicaoAgregado`: art. 112.º-A não
     muda por si — MAS reabrir o artigo no DR antes de gravar (a LOE 2027 ou
     outro diploma pode alterá-lo; se mudou, atualizar e citar).
4. **Não mexer**: `majoracoes`, `variacoesPorArea`, `arrendados` (só com
   deliberação expressa) e `prestacoes` (maio/agosto/novembro, art. 120.º —
   legal, não muda; o `scripts/coerencia-calendario.ts` volta a verificar
   contra o calendário).
5. **Não mexer no `imi-2026.json`**: o IMI de 2026 não muda retroativamente.
6. **Motor `src/lib/engines/imi.ts`**:
   - `import imi2027 from "@data/fiscal/imi-2027.json"` e
     `2027: imi2027 as RegrasImi` no `REGRAS_IMI`;
   - testes golden novos: VPT 100 000 € → 324,00 €, 2 × 162,00 € (maio+nov);
     com `imiFamiliar: true` + 3 dependentes → dedução 140 € → 184,00 €;
     com 5 dependentes → continua 140 € (a última linha prevalece);
     com `predioDegradado` + 3 dependentes → 324,00 − 140,00 + 97,20 =
     281,20 € (o caso da auditoria com VPT 120 000 deu 365,44 € — mesma
     mecânica);
   - o caso «município não deliberou» já está coberto: sem `imiFamiliar:
     true` na entrada, dedução 0 — e o motor nunca chuta tectos legais.
7. **Calendário**: `calendario-2027.json` (quando existir) com as prestações
   de maio/agosto/novembro — e o teste de coerência do CI cruza os meses.
8. **Gates + varrimento**: os números do IMI não estão no varrimento das
   tabelas (ISV/IUC) — os testes golden são o guarda; correr os 5 gates e
   citar o PDF no PR.

## Riscos conhecidos do sinal

- **O WordPress pode mudar de estrutura** — o detetor falha alto («página sem
  documentos reconhecíveis») e abre issue de falha; nunca infere «nada de
  novo» de uma página que não sabe ler.
- **As minutas atrasam**: a minuta assinada costuma sair semanas depois da
  sessão (no ciclo de 2026, a de 27-04 saiu meses depois). O cron de dezembro
  (seg+qui) cobre o atraso típico até ao prazo de 31-12; se a minuta não
  sair até lá, a deliberação não foi comunicada a tempo — registar na
  checklist do § anterior.
- **O detetor não lê PDFs** — deliberadamente: é um despertador como o NIM da
  CC2. A leitura, o trecho literal e a decisão são humanos.
- **A AT não é fetchável** (consulta de taxas por município exige
  autenticação/simulador por clique) — a confirmação final da comunicação é
  manual, em janeiro, no Portal das Finanças.
- **Ruído aceitável**: minutas/atas de sessões sem IMI disparam o alarme na
  mesma. O custo é abrir um PDF; o custo de uma deliberação perdida é o IMI
  errado durante um ano inteiro.
