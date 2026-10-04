# NOTAS — sessões D do PACK DADOS V5

> Estado de execução das sessões D-01 a D-07 do
> [`docs/PACK-DADOS-V5.md`](../PACK-DADOS-V5.md). Escrito a **2026-09-30**
> para que uma sessão nova apanhe o fio sem repetir a pesquisa.
>
> Regra de cada sessão, do pack: branch própria a partir de `origin/main`,
> gates verdes, commit, push da branch e PR para `main` com relatório de três
> partes. **Nunca se faz merge — o dono revê.**

## O que está feito

| Sessão | Branch | PR | Estado |
|---|---|---|---|
| Passo 0 — trazer o pack a `main` | — | commit `dc9918a` | ✅ em `main` |
| **D-01** · Juro dos depósitos a prazo | `v5/dados-d01-depositos` | [#2](https://github.com/braindeadpt/aocentimo/pull/2) | ✅ gates verdes, à espera de revisão |
| **D-06** · Preços em euros — só investigação | `v5/dados-d06-precos-investigacao` | [#3](https://github.com/braindeadpt/aocentimo/pull/3) | ✅ gates verdes |
| **D-04** · Conta à ordem e serviços mínimos | `v5/dados-d04-conta` | [#4](https://github.com/braindeadpt/aocentimo/pull/4) | ✅ gates verdes |
| **D-05** · Cartões de crédito | `v5/dados-d05-cartoes` | [#5](https://github.com/braindeadpt/aocentimo/pull/5) | ✅ gates verdes |

O pack **não está** em `referencias/V5/` como se pensava: vive em
`docs/PACK-DADOS-V5.md`, e estava só nas branches `v5/design` e `v5/producao`.
O passo 0 trouxe-o para `main`.

## O que falta

| Sessão | Branch a criar | Entrega |
|---|---|---|
| **D-07** · Certificados do Tesouro | `v5/dados-d07-ct` | `data/fiscal/ct.json` + `ct()` em `src/lib/engines/poupanca.ts` |
| **D-02** · IMI | `v5/dados-d02-imi` | `data/fiscal/imi-2026.json` + `src/lib/engines/imi.ts` |
| **D-03** · ISV e IUC | `v5/dados-d03-carro` | `isv-2026.json` + `iuc-2026.json` + dois motores |

São as três mais pesadas: D-02 e D-03 involve ler a lei, gravar tabelas com
vários valores e escrever motores com testes golden. **D-07 é a mais barata
das três** — o `ca.json` já existe e dá o padrão.

Ordem sugerida quando retomares: **D-07 → D-02 → D-03**.

## Pistas de pesquisa (poupam muito tempo)

Isto foi o que custou mais tempo nas sessões feitas. Reutilizar.

**APIs que respondem a `curl` sem autenticação:**

- **BPstat** — `https://bpstat.bportugal.pt/api/domains/?lang=PT` lista os 76
  domínios. `…/api/series/?domain_ids=<id>&lang=PT` lista as séries (com
  `per_page=200&page=N`), e `…/api/series/?series_ids=<id>` devolve o título
  oficial em PT. `…/api/observations/?series_ids=<id>&lang=PT` devolve as
  observações — **mas sem o título**, que vem no `/series/`.
  Não existe `/api/series/search/`: dá 404.
  Os IDs a usar são os **do `id`**, não os do `version_id`.
- **O pack aponta para o domínio errado:** os depósitos a prazo estão no domínio
  **21** («Taxas de juro»), não no 206 («Depósitos», que é de emigrantes).
  As TAEG são do domínio 209.

**Páginas que exigem browser** (o `curl` não passa):

- **Diário da República consolidado** — precisa de JavaScript:
  `https://diariodarepublica.pt/dr/legislacao-consolidada/decreto-lei/<ano>-<id>`.
  Abrir no browser e ler `document.body.innerText` dá o articulado completo.
  - DL 27-C/2000 (serviços mínimos bancários): `2000-106398173`
  - DL 133/2009 (crédito aos consumidores): `2009-34518975`
- **Banco de Portugal** — atrás de Cloudflare, o `curl` devolve 403. O browser
  passa. O **Portal do Cliente Bancário** é a melhor fonte para o que o BdP
  diz em linguagem clara, e tem conteúdo escondido atrás de accordions que só
  aparecem depois de um clique. A página das FAQ é
  `https://clientebancario.bportugal.pt/pt-pt/perguntas-frequentes`.

**A DGAEP publica o valor do IAS**, que é o número que o DL 27-C/2000 precisa:

- `https://www.dgaep.gov.pt/index.cfm?OBJID=3E74CF19-DA87-4B8F-81E2-51E0649AAA9F`
- 2026: **€ 537,13**, pela Portaria n.º 480-A/2025/1, de 30 de dezembro.

## Três conclusões que já custaram pesquisa — não repetir

1. **Não existe valor agregado de comissões bancárias no BdP.** Varredura a
   todos os 76 domínios do BPstat, feita na D-04. O mais perto é a série
   12504523, *«Rendimentos de serviços e comissões líquidos - M€»*, que é o
   produto de comissões do sistema bancário inteiro — outra grandeza, não um
   preço ao consumidor. Vale para cartões (D-05) e para contas (D-04). O que
   existe é o Comparador de Comissões, banco a banco, que o pack proíbe.

2. **A prestação mínima do cartão não é legal.** É condição do contrato. A
   Diretiva (UE) 2023/2225 **não** fixa um reembolso mínimo: só exige
   informar o consumidor do montante mínimo, quando exista. O prazo para
   adotar e publicar as medidas foi **20 de novembro de 2025**; aplicam-se
   a partir de **20 de novembro de 2026**. À data da recolha não foi
   encontrada transposição para Portugal. Escrever uma percentagem mínima
   «legal» é escrever uma regra que não existe. *(Corrigido em 2026-09-30
   após auditoria: a nota original dava 20 de novembro de 2026 como prazo
   de transposição e atribuía à diretiva um reembolso mínimo.)*

3. **O Observatório de Preços Agroalimentar tem o que a D-06 procurava** —
   preços médios ao consumidor em €/kg e €/l, 20 produtos, de 4 em 4 semanas,
   em tabelas HTML (sem API), em `/setor/<produto>/`.
   **A armadilha:** a primeira linha da tabela traz cabeçalhos de ano
   errados («2023 / 2022 / 2023»); o período real vem na linha seguinte,
   «Período (4 semanas)». Um parser que leia a linha dos anos grava 2023 num
   número de 2026. A D-06 não ingeriu nada — a decisão é do dono.

## Aviso prático: o directório de trabalho é partilhado

Outra sessão usa **o mesmo checkout** e troca de branch a meio. Já aconteceu
duas vezes, e uma vez o trabalho da D-01 foi escrito na branch de outra
sessão.

Antes de começar uma sessão:

```bash
git fetch origin
git rev-parse --abbrev-ref HEAD   # tem de ser a branch desta sessão
git status --porcelain           # nada alheio antes de começar
```

Depois de cada `npm run derive` ou `npm run ingest`, confirmar que a branch
continua a ser a correcta antes de commitar. Para mudar de sessão a meio de
um trabalho: `git stash push -u` com **todos** os caminhos tocados
(incluindo `public/api/`, que o `derive` regenera — esquecê-lo faz o
`git switch` abortar) e depois `git stash pop`.