# data/fiscal — regras fiscais versionadas

Regras fiscais e contributivas em JSON, **nunca** hardcoded em componentes ou
motores. Cada ficheiro tem `vigencia`, `fonte` e `fonteUrl` — a fonte é
legislativa/oficial (DR, AT, OE, IGCP, Código do IVA).

## Ficheiros

| Ficheiro | Conteúdo | Fonte típica |
|---|---|---|
| `irs-YYYY.json` | Escalões, deduções, mínimo de existência, sobretaxa — um ficheiro por ano fiscal | OE / CIRS |
| `retencao-YYYY.json` | Tabelas de retenção na fonte mensais (continente, trabalho dependente) | Despacho AT anual (DR) |
| `ss.json` | TSU trabalhador (11 %) e entidade (23,75 %) | Código dos Regimes Contributivos |
| `iva.json` | Taxas reduzida/intermédia/normal + exemplos | CIVA |
| `isp.json` | ISP e taxa de carbono por litro | Portarias semanais |
| `ca.json` | CA Série F: taxa base, prémios de permanência (`de`/`ate`/`pp`) | IGCP |
| `capitais.json` | Retenção liberatória sobre rendimentos de capitais | CIRS art. 71.º-72.º |
| `smn.json` | Salário mínimo nacional | DR |
| `imt-YYYY.json` | IMT por escalões (HPP/secundária), IMT Jovem, IS de aquisição e crédito, registos | Ofício Circulado AT anual |
| `irs-jovem.json` | Isenção por ano de gozo, limite 55×IAS, regras do regime | CIRS art. 12.º-B |
| `desemprego.json` | % RR, limites IAS, tabela de duração, majoração/redução | DL 220/2006 + Guia Seg. Social |
| `subsidio-alimentacao.json` | Limites isentos por dia (dinheiro/cartão) | Portaria anual AP + CIRS art. 2.º |
| `deducoes-YYYY.json` | Deduções à coleta por categoria + limite global do art. 78.º | CIRS arts. 78.º-84.º / AT |
| `ppr.json` | Dedução à coleta por idade (20 %, tetos) + tributação no resgate | EBF art. 21.º |
| `catb.json` | Recibos verdes: coeficiente 0,75, SS 21,4 % sobre rendimento relevante, retenção | CIRS + Código Contributivo |
| `mais-valias.json` | Taxa autónoma, exclusões por detenção, cripto ≥365 dias, imóveis 50 % | CIRS arts. 10.º, 43.º, 72.º |

## Regras

- **Entrada só por PR manual** com fonte legislativa — nunca scraped
  automaticamente (ver §9 do plano).
- Valores com vigência declarada; ficheiros novos por ano fiscal, nunca
  editar anos passados (são histórico).
- Motores leem os valores destes ficheiros; se um valor falta, o motor falha
  — nunca assume.
- Campos usados em cálculo são numéricos e estruturados; texto humano
  (`anos`, `nota`) é só para apresentação.
