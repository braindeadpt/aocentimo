# Auditoria — PACK DADOS V5

Brief para rever, de forma independente, o trabalho das sete sessões do
PACK DADOS V5 que está em `main`. Escrito para uma LLM (ou pessoa) que não
esteve na sessão e que não deve confiar no que está escrito aqui sem ir
ver à fonte.

**Regra que vale mais do que todas as outras deste repositório: nunca
inventar dados.** Se um número não está numa fonte oficial legível, não
está no `data/`. A presunção de erro é que um número está errado até que se
vá ver a lei; o que se pede à auditoria é exactamente o contrário do
habitual — tentar encontrar o erro.

---

## 1. O que foi feito

Sete sessões, cada uma em branch própria, hoje fundidas em `main` por
`v5/integracao-dados` (18 commits a partir de `429f381`).

| Sessão | O que entra | Fonte |
|---|---|---|
| D-01 | Juro dos depósitos a prazo (BPstat, domínio 21) + derivado `deposito-real` | BPstat API |
| D-06 | Só investigação: onde estão os preços ao consumidor | Observatório de Preços Agroalimentar |
| D-04 | Serviços mínimos bancários | DL 27-C/2000 |
| D-05 | Regras legais dos cartões | DL 133/2009 + Regulamento (UE) 2015/751 |
| D-07 | Certificados do Tesouro, série 5 | IGCP |
| D-03 | ISV e IUC | Lei 22-A/2007 (CISV e CIUC) |
| D-02 | IMI | CIMI, DL 287/2003 |

Mais o `SLA_POR_SERIE` no watchdog, que é infraestrutura, não dados.

Ficheiros a rever, em `data/fiscal/`: `servicos-minimos.json`, `cartoes.json`,
`ct.json`, `imi-2026.json`, `isv-2026.json`, `iuc-2026.json`.
Motores: `src/lib/engines/imi.ts`, `carro.ts`, `cartao.ts`, `poupanca.ts`.
Testes: `imi.test.ts`, `carro.test.ts`, `engines.test.ts`.

---

## 2. Como verificar

```bash
npm run lint && npm run typecheck && npm run test:unit \
  && npm run validate:data && npm run build
```

Estado esperado no momento da escrita: lint 0 erros (1 aviso pré-existente
em `postcss.config.mjs`), typecheck limpo, **471 testes**, `validate:data` com
**74 séries** em dia, build OK.

Para a fidelidade à fonte, por cada `data/fiscal/*.json`:

```bash
node -e "const d=require('./data/fiscal/isv-2026.json');
  console.log(d.fonteUrl, '\n', d.fonte)"
```

O Diário da República consolidado **precisa de JavaScript** — não serve
`curl`, tem de ser aberto em browser e lido por `document.body.innerText`.
Nas tabelas do ISV, atenção a dois detalhes que custaram tempo:

- As tabelas de CO2 têm **colunas NEDC e WLTP lado a lado na mesma linha**.
  Os limites *superiores* são diferentes, e os *inferiores* também
  (NEDC 120/180/250 contra WLTP 140/205/260 g/km, na categoria B do IUC).
  Gravar um único par de limites manda um veículo para o escalão errado.
- NEDC e WLTP **não se convertem** entre si. Cada um tem tabela própria.

---

## 3. Onde é mais provável estar o erro

**Os números transcritos à mão.** Toda a tabela A e B do ISV, as tabelas
das categorias A e B do IUC, as deduções familiares e os limites das
prestações foram lidos de texto extraído do browser e digitados no JSON.
Um dígito trocado num número destes é invisível numa revisão de código e
errado no ficheiro. **É aqui que a auditoria deve gastar o esforço.**

**As afirmações negativas.** Vários ficheiros affirmam que um valor *não*
existe. São afirmações mais difíceis de verificar do que as positivas, e
mais fáceis de deixar passar:

- `cartoes.json` diz `anuidadeMedia.existe: false`.
- `cartoes.json` diz `haRegraLegal: false` para a prestação mínima.
- `servicos-minimos.json` não tem `comissoes-bancarias.json`, porque se
  varrem os 76 domínios do BPstat e não há valor agregado de comissões.
- `imi-2026.json` só tem o Porto, e diz porquê no próprio ficheiro.

**As três correções ao material de origem.** Cada uma alterou o que o
plano dizia, e cada uma deve ser conferida contra a fonte:

1. A base tributável do ISV **não é o preço de venda ao público** — é a
   cilindrada e o CO2 do certificado de conformidade (art. 4.º do CISV).
   O plano partia do contrário.
2. O tecto dos serviços mínimos é **1 % do indexante dos apoios sociais**
   (5,37 € em 2026), não «índice average salário» como dizia o plano.
3. A prestação mínima do cartão **não é legal**, é contratual. A
   Diretiva (UE) 2023/2225 manda adotar e publicar as medidas até
   20-11-2025 e aplicá-las a partir de 20-11-2026 (art. 48.º, n.º 1), e
   **não** fixa um reembolso mínimo: só exige informar o consumidor do
   montante mínimo, quando exista. À data da recolha não foi encontrada
   transposição para Portugal. (Corrigido em 2026-09-30: o brief e o
   `cartoes.json` diziam que o prazo de transposição terminava em
   20-11-2026 e que a diretiva previa reembolso mínimo.)

---

## 4. O que está deliberadamente em falta

Nada disto é esquecimento. As decisões são do dono e estão registadas nos
ficheiros e nos PRs.

- **Preços ao consumidor: nada ingerido.** A D-06 documentou a fonte e não
  ingeriu, à espera de decisão. Faltam pão, massa, óleo e açúcar, e não
  foi encontrada licença de reutilização.
- **Comissões bancárias: não ingeridas.** A alternativa oficial encontrada
  é o Eurostat `nama_10_co3_p3`, código CP126, euros por habitante, com
  dados até 2022. Não ingerida.
- **IMI: só o Porto** entre 308 municípios. A consulta oficial da AT exige
  autenticação e o simulador é geográfico, por clique no mapa.
- **Não ingeridos por não lidos:** modelo de avaliação do VPT (arts. 7.º a
  46.º do CIMI), art. 112.º-B, AIMI, art. 11.º-A, categorias C a G do
  IUC, fórmula de usados do art. 11.º n.º 3 do ISV, isenções do ISV
  arts. 51.º a 63.º.

---

## 5. Dois desvios de processo que a auditoria deve saber

**Entrou-se em `main` sem revisão de PR.** O plano dizia «entrada só por PR
manual». As sete sessões abriram PR como previsto, mas foram fundidas
numa branch de integração e empurradas directamente para `main` por
instrução do dono. Os oito PRs (#2 a #6, #8 a #10) estão `closed`, não
`merged` — consequência de um `filter-branch` usado para reescrever as
mensagens dos commits. O código está todo em `main`.

**Os conflitos de merge foram resolvidos por script.** Cinco sessões
acrescentavam linhas ao mesmo sítio da mesma tabela. O script mantinha as
linhas dos dois lados e deduplicava a chave `cartoes`, que duas sessões
tinham registado em paralelo. A resolução é verificável: este trabalho
acrescentou seis entradas a `data/fiscal/README.md` (`servicos-minimos`,
`cartoes`, `ct`, `isv-YYYY`, `iuc-YYYY`, `imi-YYYY`) e seis a
`NOME_POR_FICHEIRO` — as mesmas, com o ano. A D-01 e a D-06 não entram aqui:
a primeira é ingestão do BPstat, a segunda só documentação.

---

## 6. O que uma auditoria não consegue fazer sozinha

Duas fontes exigem mais do que abrir um URL:

- **Os coeficientes da categoria B do IUC** (art. 10.º n.º 3) **não
  renderizam** na página do Diário da República — a tabela vem vazia no
  DOM, sem imagem. Foram lidos no Portal das Finanças, que é a mesma
  fonte oficial; o endereço está em `fonteTabelaCoeficientes`.
- **A deliberação do IMI Familiar do Porto de 2026** é um PDF de três
  páginas **digitalizado** (três imagens JPEG, zero blocos de texto). Não
  há OCR instalado. A minuta da sessão confirma que foi aprovada, mas não
  traz o valor da redução. O `ct.json` e o `imi-2026.json` não dependem
  dele para nenhum número em uso.

---

## 7. Se encontrar um erro

O padrão do repositório é: corrigir a fonte, não o número. Se um valor
está errado, a correção é reler o artigo e corrigir o JSON, com o artigo
citado. Se um motor calcula mal o que o JSON diz, o bug é no motor e o
teste golden é que devia tê-lo apanhado — vale a pena ver que o teste
falha antes de se mexer no número.
