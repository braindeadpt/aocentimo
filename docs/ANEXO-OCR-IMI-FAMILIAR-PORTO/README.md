# Anexo — prova arquivada do OCR: recomendação NUD/289978/2026/CMP (IMI Familiar do Porto, 2026)

> Este directório arquiva a **prova física** citada no §4-A da
> [`AUDITORIA-2-RESULTADOS-DADOS-V5.md`](../AUDITORIA-2-RESULTADOS-DADOS-V5.md)
> e na nota de `data/fiscal/imi-2026.json → imiFamiliar`: a leitura por OCR do
> PDF digitalizado da recomendação da Assembleia Municipal do Porto de
> 2026-04-27 sobre o IMI Familiar. Feito a 2026-09-30 (~22:20–23:35, hora de
> Lisboa). O documento oficial não tem texto embutido (PDF digitalizado, 0
> caracteres extraíveis); sem OCR não há citação literal — por isso a prova
> completa fica aqui, no repositório.

## O que está aqui

| Ficheiro | O quê | SHA-256 |
|---|---|---|
| `NUD-289978-2026-CMP.pdf` | O PDF oficial baixado do site da CMP (3 páginas, 236 KB, PDF 1.4 — o original, sem alterações) | `1cd7f9de…c39bb4aae` |
| `pagina-1.png` … `pagina-3.png` | Rasterização das 3 páginas, usada como entrada do OCR (2145×3033 px, pdfjs-dist escala 3 sobre fundo branco) | `b9cbaaab…`, `02eaaaaa…`, `b2ddd916…` |
| `ocr-transcript.txt` | **Transcript integral e cru do OCR** — exatamente o que o tesseract devolveu, incluindo as gralhas (ver abaixo) | `f909806f…f1980` |
| `run-ocr.cjs` | O script que produziu tudo (pdfjs-dist 6.3 + tesseract.js 7.0, modelo `por` LSTM) — reprodutível | — |

## Proveniência

- **Documento**: recomendação «Para a aplicação da redução da taxa de IMI
  para agregados familiares com dependentes (IMI Familiar) em 2026 – Incentivo
  à natalidade e à fixação de População no Porto», apresentada pelo Grupo
  Municipal CHEGA; `NUD/289978/2026/CMP`; deliberada em Sessão Ordinária de
  27 de abril de 2026.
- **Origem do PDF**: site da Câmara Municipal do Porto (portal de
  participação/deliberações), baixado a 2026-09-30 durante a 2.ª auditoria. A
  recomendação tem página própria com o PDF digitalizado; o `imi-2026.json →
  imiFamiliar.nota` cita-a como fonte da pista para 2027.
- **Método** (`run-ocr.cjs`): pdfjs-dist renderiza cada página a escala 3 em
  canvas branco (as PNG deste directório) → tesseract.js 7.0.0, idioma `por`,
  LSTM, uma corrida por página, sem pós-processamento — o transcript é
  **cru**, para se poder auditar a leitura contra as imagens.

## O que o transcript diz (o essencial, com as gralhas do OCR marcadas)

- Pág. 2 — o ponto decisivo: «a Assembleia Municipal do Porto, reunida em
  sessão de 27/04/2026, delibera recomendar ao Executivo Municipal que: …
  Apresente uma proposta de fixação das taxas de IMI … para vigorar no próximo
  ana» [**sic** — «ano»] «fiscal. … Adote, os escalões máximos de dedução
  permitidos por lei, ou seja: 30,00€ para familias com 1 dependente;
  70,00€ para famílias com 2 dependentes; 140,00€ para famílias com 3 ou mais
  dependentes».
- Pág. 3 — a deliberação: «Aprovada, por maioria, com 8 votos a favor (3 IL +
  3 CH + 2 FA), 3 votos contra (2 CDU + 1 B.E.) e 33 abstenções (15 PS + 13
  PPD/PSD + 3 CDS-PP + 2 L). Deliberada em Sessão Ordinária de 27 de abril de
  2026.»

## Gralhas conhecidas do OCR (não corrigir no transcript — é cru)

«Ilmposto» (pág. 1, 1.ª linha do corpo), «3, A evolução» (vírgula por ponto),
«2.5 M» (milhões), «ana fiscal» (pág. 2), «TIMI Familiar» (pág. 3), «a ha
Assembleia» (pág. 3, assinatura ilegível), rubricas/nomes parcialmente
ilegíveis nas assinaturas («Gonçalo SS», «Teresa Vilas Boas» — a 2.ª secretária
também assina como «A 2.ª Secretária»). As páginas rasterizadas são a prova
primária para resolver qualquer dúvida de leitura.

## Estado da prova e ligação à vigilância

Esta recomendação **não** é a deliberação de fixação de taxas — é o
antecedente que aponta para os escalões máximos «no próximo ano fiscal» (ver
§4-A da auditoria). A deliberação formal do IMI 2027 é o alvo da vigilância
montada em
[`docs/VIGILANCIA-IMI-PORTO-2027.md`](../VIGILANCIA-IMI-PORTO-2027.md) e do
detetor `scripts/ingest/imi-porto-2027.ts`; quando sair, a prova dela deve ser
arquivada da mesma forma.
