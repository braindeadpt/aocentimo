# Prompt — 2.ª auditoria independente do PACK DADOS V5

> Para colar numa sessão nova de uma LLM, noutra máquina. A 1.ª auditoria (2026-09-30)
> correu os testes, verificou o que dava para verificar sem fontes novas e corrigiu três
> erros. Esta 2.ª auditoria trata do que a 1.ª **não conseguiu** provar. Ela só conta se
> for feita de novo, nas fontes, por quem não confia em nada do que está escrito aqui.

```
És auditor independente do repo AO CÊNTIMO (literacia financeira para Portugal). Lê
AGENTS.md, data/fiscal/README.md e docs/AUDITORIA-DADOS-V5.md. Carrega a skill literacia-pt.

REGRA ACIMA DE TODAS: nunca inventar dados. O teu trabalho é tentar ENCONTRAR ERROS.
Um número está errado até leres o artigo de lei ou a fonte oficial que o sustenta. Não
confies em nada do que está nos JSON, nas notas (docs/historico/NOTAS-DADOS-V5.md) nem neste prompt.
Se não conseguires abrir ou ler uma fonte, diz «NÃO CONSEGUI» — nunca «confirmado»
por ser plausível ou por memória. Trabalha só com leitura até teres o relatório pronto.

Git: git fetch && git switch -c v5/auditoria-2-dados origin/main. Só esse ramo. Nunca
push para main, sem force-push, sem git config. Só corriges um valor se tiveres o artigo
ou a fonte aberto e citado; a correção vai no teu ramo, num PR para main, com o texto
oficial em citação. O dono faz o merge.

Como ler as fontes (aprendido à custa de tempo):
- O Diário da República consolidado (diariodarepublica.pt/dr/legislacao-consolidada/...)
  PRECISA de JavaScript: curl e WebFetch devolvem páginas vazias. Abre num browser e lê
  com document.body.innerText, depois de esperar alguns segundos pelo carregamento.
- O EUR-Lex (eur-lex.europa.eu/legal-content/PT/TXT/?uri=CELEX:...) também só funciona
  em browser.
- Algumas tabelas não aparecem no texto do DR (os coeficientes da categoria B do IUC vêm
  vazios): nesses casos usa o Portal das Finanças (info.portaldasfinancas.gov.pt, códigos
  tributários) e diz qual usaste.
- Para cada item, guarda: URL, data e hora de acesso, e o trecho LITERAL lido.

TAREFAS (por esta ordem; cada uma acaba com um veredicto)

A · Transcrições à mão (o risco maior). Releia, artigo a artigo, e compare números com
  números (faz um script que extrai as tabelas do texto do DR e compara com o JSON; não
  confies nos olhos):
  1. data/fiscal/isv-2026.json: tabelaA (cilindrada, ambiental gasolina/gasóleo, NEDC e
     WLTP) e tabelaB — art. 7.º do Código do ISV; tabela C — art. 10.º; tabela D — art. 11.º;
     agravamento do gasóleo, mínimo de 100 €, isenções (arts. 53.º e 54.º) e os limites de CO2.
  2. data/fiscal/iuc-2026.json: categoria A (art. 9.º, as três colunas de matrícula) e
     categoria B (art. 10.º: cilindrada, CO2 com os limites NEDC e WLTP lado a lado,
     adicional de CO2, coeficientes do n.º 3).
  3. data/fiscal/imi-2026.json: art. 112.º (taxas), 112.º-A (30/70/140 €), 112.º n.os 3, 6, 7 e 8
     (devolutos, áreas, degradados, arrendados) e art. 120.º (prestações e meses).
  Cada número diferente é um achado, mesmo de uma casa decimal.

B · Afirmações negativas (repete a pesquisa; só se prova assim):
  1. cartoes.json → anuidadeMedia.existe = false: varre de novo os domínios do BPstat
     (lista-os pela documentação da API, em bpstat.bportugal.pt) à procura de QUALQUER
     série de preços, comissões ou anuidades de cartões. Procura também nas estatísticas e
     relatórios do Banco de Portugal e no Portal do Cliente Bancário.
  2. cartoes.json → prestacaoMinima.haRegraLegal = false: lê o DL 133/2009 consolidado, os
     avisos e instruções do Banco de Portugal sobre crédito renovável e cartões, e a
     Diretiva (UE) 2023/2225 (texto completo). Existe alguma regra LEGAL de prestação ou
     percentagem mínima em Portugal hoje? Indica o artigo.
  3. Existe um valor agregado oficial de comissões de manutenção da conta à ordem? (Varrer o
     BPstat, os relatórios de mercados bancários de retalho do BdP, o Portal do Cliente
     Bancário.) O ficheiro comissoes-bancarias.json não existe de propósito.
  4. imi-2026.json só tem o Porto: existe uma lista oficial pública de TODAS as taxas de IMI
     por município para 2025/2026 (AT, dados abertos, DGAL, Portal das Finanças)? Se existir,
     diz onde, em que formato, e se dá para ingerir sem autenticação.

C · Factos de 2026 (podem estar para lá do que a tua memória sabe; vai às fontes):
  1. ct.json: a «série 5» de Certificados do Tesouro. Confirma na ficha técnica do IGCP as
     10 taxas por ano, os mínimos/máximos, a regra do resgate e a RCM 141-A/2026 (DR
     127/2026, 3 de julho). Confirma que a CTPV ficou suspensa e desde quando.
  2. isv-2026.json → alteracaoLoe2026: confirma no art. 82.º da Lei n.º 73-A/2025 o que mudou
     no art. 8.º do ISV quanto aos plug-in (25 % até 80 g/km em Euro 6e-bis).
  3. iuc-2026.json → cobrancas e ultimaAlteracaoTaxas: confirma o que a LOE 2026 alterou no
     IUC, incluindo o novo regime de pagamento (fevereiro, e duas prestações acima de 100 €).
  4. ca.json: taxa e prémios dos Certificados de Aforro em vigor, vs ficha técnica do IGCP.

D · A linha suspeita do ISV. Em isv-2026.json → taxasIntermedias.regra, a taxa de 60 % vem
  com a designação «Híbrido (não plug-in)» e a condição «autonomia em modo elétrico
  superior a 50 km e emissões oficiais inferiores a 50 gCO2/km», que é a definição de um
  plug-in. Lê o art. 8.º, n.º 1 do Código do ISV (texto consolidado) e diz, alínea a alínea:
  o que a lei diz de facto, e se o JSON e o comentário de src/lib/engines/carro.ts
  (60 / 25 / 40) o reproduzem. Se o motor aplica uma taxa a quem a lei não a dá, diz
  com um exemplo numérico, e propõe o teste golden que o teria apanhado.

E · Confere as três correções feitas a 2026-09-30 (não assumas que estão certas):
  1. Dir. (UE) 2023/2225, art. 48.º, n.º 1: adotar e publicar até 20-11-2025, aplicar a
     partir de 20-11-2026. E: a diretiva não fixa reembolso mínimo para cartões?
  2. servicos-minimos.json: a Lei n.º 24/2023 foi publicada no DR n.º 103/2023, Série I, de
     2023-05-29, e o art. 6.º alterou o art. 3.º do DL 27-C/2000, com efeitos desde 2023-08-27?
     Diz também a data da própria lei (a da assinatura/promulgação).
  3. Duas frases que ficaram por corrigir, confirma e propõe texto: (a) servicos-minimos.json,
     campo «nota», manda «ver a nota» de comissoes-bancarias.json, que não existe;
     (b) ct.json → seriesSuspostas.ctpc.nota diz «Nunca mais se subscreveu» depois de 2017,
     mas o mesmo bloco diz que a suspensão é de 2021-09-10.

F · Motores. Escolhe 5 casos por motor (imi.ts, carro.ts, cartao.ts) que NÃO estejam já nos
  testes, calcula-os à mão com os artigos que leste, e compara com o motor. Inclui: um ISV
  de gasóleo WLTP a 160 e a 161 g/km (fronteira de escalão), um IUC categoria B com
  matrícula de 2008 (coeficiente 1,05) e CO2 acima do último escalão, um IMI no limite
  de 100 € e de 500 € das prestações. Qualquer diferença é um bug do motor.

ENTREGA — um ficheiro docs/AUDITORIA-2-RESULTADOS-DADOS-V5.md, com:
1. Um quadro: item | veredicto (CONFIRMADO / ERRADO / NÃO CONSEGUI) | prova (URL + trecho literal + data de acesso).
2. Os erros, por gravidade (número errado num escalão > frase errada > estilo), cada um com a correção proposta em diff.
3. O que continua por provar e porquê (o que exigiria autenticação, OCR, ou um humano).
4. Uma frase final: «o pack está / não está em condições de sustentar as cenas do Banco,
   das Finanças, da Bomba e dos Correios», com a razão.
Corrige só o que o teu quadro marcar como ERRADO e que tenhas provado; o PR leva o
relatório e as correções, com os gates verdes: npm run lint && npm run typecheck &&
npm run test:unit && npm run validate:data && npm run build
```

## Nota para o dono

- Esta auditoria é melhor feita por uma LLM **com browser** (o DR e o EUR-Lex não abrem sem JavaScript).
- O que uma LLM não prova sozinha: a deliberação do IMI Familiar do Porto (PDF digitalizado, sem OCR) e
  a tabela de coeficientes do IUC que não renderiza no DR. Se o relatório disser «NÃO CONSEGUI» nesses
  pontos, a verificação fica a cargo de uma pessoa, numa consulta à AT ou ao município.
- Antes de as cenas dependerem destes números (IMI, ISV, IUC), convém esperar pelo quadro desta auditoria.
