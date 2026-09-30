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

- **Sinal primário**: a página «National transposition» do EUR-Lex
  (`https://eur-lex.europa.eu/legal-content/PT/NIM/?uri=CELEX:32023L2225`),
  que é HTML server-side — ao contrário do DR consolidado, que só abre com
  JavaScript. O bloco de Portugal tem ids estáveis (`PRT_numOfNims`,
  `PRT_transposition`); «Number of measures: 0» = sem transposição publicada;
  ≥ 1 = há diploma, com data e ligação, no mesmo bloco.
- **Detetor**: `scripts/ingest/ccd2225.ts` + `ccd2225-cli.ts`. Guarda o estado
  em `data/meta/ccd2225-vigilia.json` e distingue três fins:
  `0` ok sem medidas · `2` **ALARME** (0 → n medidas) · `1` falha honesta.
  O EUR-Lex responde por vezes «202» com corpo vazio (documento em preparação)
  — isso é indisponibilidade, **nunca** «0 medidas»; o detetor repete 4× e
  falha alto se persistir.
- **Agenda**: `.github/workflows/ccd2225-watch.yml` — segundas, 07:23 UTC
  (`workflow_dispatch` para correr à mão). Com medida nova, abre/comenta issue
  «CC2 (Dir. 2023/2225): transposição detetada» e comita o estado novo.
- **Estado semente**: captura real do NIM a 2026-09-30 (Portugal a 0 medidas),
  guardada como fixture de teste `scripts/ingest/ccd2225.fixture.html`.

## Checklist quando o alarme disparar (ou a 01-11-2026, o que chegar primeiro)

1. **Identificar o diploma.** No NIM, abrir a ligação da medida de Portugal;
   confirmar no DR (diploma original ou alteração ao DL 133/2009) e citar o
   artigo que transpõe cada preceito. Guardar URL + trecho + data (regra da
   casa). O consolidado do DL 133/2009 passa a ter modificações datadas de
   2026 — é aí que se lê o texto novo.
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

- **EUR-Lex em fila (202 com corpo vazio)** — aconteceu a 2026-09-30 em PT e
  EN durante vários minutos. O detetor trata-o como falha honesta (exit 1) e o
  workflow abre issue de falha sem nunca inferir «não transposto».
- **O NIM pode atrasar** a publicação das medidas nacionais. Contra-pondos: o
  alerta dispara em segundas; a checklist manda confirmar no DR antes de
  escrever qualquer coisa no pack.
- **O DR consolidado não abre sem browser** — por isso a confirmação final é
  sempre humana (ou com browser), com o NIM apenas a fazer de despertador.
