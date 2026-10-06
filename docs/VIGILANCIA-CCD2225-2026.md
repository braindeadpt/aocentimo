# Vigilância — transposição da Diretiva (UE) 2023/2225 em Portugal

> Preparado a **2026-09-30** no fecho da 2.ª auditoria
> ([`AUDITORIA-2-RESULTADOS-DADOS-V5.md`](AUDITORIA-2-RESULTADOS-DADOS-V5.md),
> item E1). Este documento é o plano do que fazer quando Portugal transpuser a
> Diretiva (UE) 2023/2225 (crédito ao consumo, «CC2») — e o que fazer na data
> de aplicação mesmo que a transposição não tenha chegado. Regra que não
> cede: **nada se escreve no pack antes de o diploma estar aberto e citado.**

## O essencial

| Data | O quê | Fonte |
|---|---|---|
| 18-10-2023 | Diretiva (UE) 2023/2225 adotada | EUR-Lex, CELEX:32023L2225 |
| 20-11-2025 | Fim do prazo para os EM adotarem e publicarem as medidas (art. 48.º, n.º 1) | idem |
| **20-11-2026** | **Data de aplicação**: os EM aplicam as disposições transpostas a partir desta data (art. 48.º, n.º 1); a Dir. 2008/48/CE é revogada na mesma data (art. 47.º) | idem |
| 20-11-2026 | **Mas**: a 2008/48/CE continua a reger os contratos em vigor nessa data até à sua cessação (art. 47.º, n.º 2) — com exceções no n.º 3 | idem |

Transição de Portugal ainda não encontrada a 2026-09-30 (afirmação negativa, a
re-verificar — é para isso que serve esta vigilância).

## Como a vigilância corre (já montada neste PR)

- **Sinal primário**: a **consulta SPARQL ao Cellar**
  (`https://publications.europa.eu/webapi/rdf/sparql`), o repositório do
  Serviço das Publicações da UE onde vivem as medidas nacionais de
  transposição (works `cdm:measure_national_implementing`) — a **mesma fonte**
  que alimenta a tabela «National transposition» do EUR-Lex, mas acessível a um
  cliente simples (sem browser, sem cookies): a página NIM do EUR-Lex está
  atrás de um **AWS WAF** e responde 202/503 (ver «Riscos conhecidos» e a
  [auditoria](AUDITORIA-VIGILANCIA-V5.md)). A consulta resolve o work da
  diretiva a partir do CELEX (o `resource/celex/32023L2225` redireciona para o
  `cellar/<uuid>` — o UUID não está fixo no código) e filtra as medidas por
  país (`…/authority/country/PRT`): 0 medidas = sem transposição publicada;
  ≥ 1 = há diploma, com tipo de ato, referência nacional, datas e ligação.
- **Detetor**: `scripts/ingest/ccd2225.ts` + `ccd2225-cli.ts`. Guarda o estado
  em `data/meta/ccd2225-vigilia.json` e distingue três fins:
  `0` ok sem medidas · `2` **ALARME** (0 → n medidas) · `1` falha honesta.
  A política de leitura deste e dos outros monitores está em
  [`AUDITORIA-VIGILANCIA-V5.md`](AUDITORIA-VIGILANCIA-V5.md): 4 leituras com
  20 s de intervalo, cobrindo erros de rede/HTTP **e** respostas que não sejam
  SPARQL JSON (página de bloqueio, erro do endpoint) — e uma resposta válida
  com **zero resultados é resposta**: é assim que se lê «Portugal sem
  medidas». Nunca se lê «0 medidas» de um corpo que não veio.
- **Agenda**: `.github/workflows/ccd2225-watch.yml` — segundas, 07:23 UTC
  (`workflow_dispatch` para correr à mão). Com medida nova, abre/comenta issue
  «CC2 (Dir. 2023/2225): transposição detetada» e comita o estado novo.
- **Estado semente**: Portugal com 0 medidas, lido na página NIM do EUR-Lex a
  2026-09-30 (antes da mudança de fonte). A resposta real do Cellar à consulta
  de Portugal (0 medidas, capturada a 2026-10-06) é a fixture de teste
  `scripts/ingest/ccd2225.fixture-sparql.json`; o caso de Portugal transposto
  (sintético, com a forma real das linhas do Cellar) é
  `scripts/ingest/ccd2225.fixture-sparql-pt.json`.

## Checklist quando o alarme disparar (ou a 01-11-2026, o que chegar primeiro)

1. **Identificar o diploma.** O `data/meta/ccd2225-vigilia.json` (campo
   `ligacoes`) traz o tipo de ato, a referência nacional e o link EUR-Lex do
   CELEX nacional de cada medida de Portugal; confirmar no DR (diploma
   original ou alteração ao DL 133/2009) e citar o artigo que transpõe cada
   preceito. Guardar URL + trecho + data (regra da casa). O consolidado do
   DL 133/2009 passa a ter modificações datadas de 2026 — é aí que se lê o
   texto novo.
2. **`data/fiscal/cartoes.json` — rever campo a campo:**
   - `prestacaoMinima.haRegraLegal` — a CC2 continua a **não fixar** reembolso
     mínimo (única referência: art. 24.º, alínea h) — informar, não fixar).
     Se a transposição portuguesa **criar** um mínimo legal (possível, é
     opção do transpositor), `haRegraLegal` passa a `true` **com o artigo
     citado**; se não criar, mantém-se `false`.
   - `prestacaoMinima.aMudar` — reescrever com o diploma: número, data de DR,
     data de vigor e o que concretamente muda no extrato/informação periódica.
   - `aMudar.cuidado` — manter a regra: enquanto não houver regra legal nova,
     nenhuma percentagem «legal» entra no site.
3. **Motor `src/lib/engines/cartao.ts` — o que muda (e o que não muda):**
   - A mecânica de simulação (juros mensais pela TAEG, mínimo = max(pct, €),
     última prestação apaga o resto) **não depende da diretiva** — não se toca.
   - Se existir regra legal nova de mínimo, o motor passa a poder recebê-la das
     regras (`cartoes.json`) em vez de só do contrato — e o comentário do
     `ParametrosCartao.prestacaoMinimaPct` («condição do contrato, não da
     lei») tem de ser reescrito com o artigo.
   - **Contratos antigos**: por força do art. 47.º, n.º 2, quem já tinha cartão
     a 20-11-2026 continua regido pela 2008/48/CE transposta (DL 133/2009) —
     qualquer UI deve poder mostrar os dois regimes. **Exceção** (art. 47.º,
     n.º 3): os arts. 23.º, 24.º (extratos, incluindo informar o «montante
     mínimo a pagar» quando exista), 25.º n.º 1 2.ª frase, 25.º n.º 2, 28.º e
     39.º aplicam-se logo a todos os contratos de duração indeterminada em
     vigor a 20-11-2026.
   - Testes golden novos para cada regra nova, com o exemplo do próprio
     diploma citado.
4. **`usuário`/`messages` e cenas do Banco** — só depois dos pontos anteriores:
   datas novas, «de onde vem o mínimo» (contrato vs lei), e o aviso de que os
   contratos antigos podem continuar no regime velho.
5. **Fechar a issue de alarme** com o PR que resolve, citando o diploma.

## Checklist para o dia 20-11-2026 SE a transposição não tiver aparecido

- A CC2 aplica-se como diretiva? **Não** — diretivas não têm efeito direto
  horizontal contra bancos; sem transposição, o regime nacional em vigor é o
  DL 133/2009. O site mantém «À data da recolha não foi encontrada transposição»
  com data nova de verificação.
- Registar a falha de transposição (Comissão pode abrir processo por falta de
  transposição — nota para o dono, não para o site).
- Re-verificar mensalmente até aparecer (mudar o cron do workflow para
  `23 7 1 * *` — 1.º de cada mês — ou deixar o semanal, que já cobre).

## Riscos conhecidos do sinal

- **O desafio do AWS WAF do EUR-Lex deixou de afetar o monitor.** A página NIM
  devolve às consultas sem browser «202 Accepted» + `x-amzn-waf-action:
  challenge` (corpo vazio ou página de desafio JS) e, com a origem em baixo,
  «503» ou timeout — medido a 2026-10-06 às 01:21 UTC, e já a responder 200 às
  04:05 UTC do mesmo dia: o bloqueio é intermitente (issue #75). Desde
  2026-10-06 o sinal primário é o SPARQL do Cellar, que respondeu 200 a todas
  as sondagens; a página NIM ficou só para conferência humana, no link da
  checklist.
- **Atraso do Cellar em relação ao EUR-Lex** — a fonte é a mesma, mas o
  registo da medida nacional pode aparecer no Cellar depois de a página NIM a
  mostrar (ou antes, se a indexação for ao contrário). O alarme dispara com
  ≥ 1 medida; a confirmação final é sempre humana, no NIM e no DR, como a
  checklist manda — nunca se escreve no pack a partir do JSON sozinho.
- **O Cellar arquiva medidas antigas sob esta diretiva** — a consulta de
  2026-10-06 devolveu 143 medidas de vários Estados-Membros, muitas delas atos
  de 2004–2018 (ex.: um `Zákon` checo de 2004 e um eslovaco de 2004), que o
  registo associa à diretiva de 2023. Ou seja: o alarme diz que **apareceu uma
  medida de Portugal**, não que seja a transposição de 2026. A checklist manda
  confirmar a data e o diploma no DR antes de escrever seja o que for no pack
  — e Portugal estava a 0 medidas nas duas fontes a 2026-10-06.
- **O NIM pode atrasar** a publicação das medidas nacionais. Contra-pondos: o
  alerta dispara em segundas; a checklist manda confirmar no DR antes de
  escrever qualquer coisa no pack.
- **O DR consolidado não abre sem browser** — por isso a confirmação final é
  sempre humana (ou com browser), com o NIM apenas a fazer de despertador.
