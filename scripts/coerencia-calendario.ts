import calendarioJson from "@data/fiscal/calendario-2026.json";
import iucJson from "@data/fiscal/iuc-2026.json";
import imiJson from "@data/fiscal/imi-2026.json";

/**
 * Coerência calendário ↔ regras fiscais (o gate que o CI corre em todos os PRs
 * via `test:unit`). Nasceu de um erro apanhado na 2.ª auditoria: o calendário
 * de 2026 dizia que o IUC passava a pagar-se em fevereiro, quando o regime
 * (art. 7.º do CIUC) mantinha o mês da matrícula — e a página /dados mostrava
 * o prazo falso ao utilizador.
 *
 * Este teste não repele a fonte: é a FONTE que manda. Se o calendário afirma
 * um mês como prazo que as regras do imposto não sustentam, o CI falha e
 * alguém tem de reler o diploma antes de mostrar a data ao público.
 *
 * Quando o pack refrescar para 2027: atualizar os três imports e o ano em
 * `ANO_DAS_REGRAS` — o próprio teste reclama com instruções se houver
 * desalinhamento (violação «atualizar»).
 */

export interface PrazoCalendario {
  id: string;
  titulo: string;
  mes: string;
  descricao: string;
}

export interface Calendario {
  ano: number;
  prazos: PrazoCalendario[];
}

export interface IucRegras {
  ano: number;
  cobrancas: { regimeVigorEm2026?: string; regime?: string };
}

export interface ImiRegras {
  ano: number;
  prestacoes: { regras: { meses: number[] }[] };
}

/** Ano com que este ficheiro foi escrito — ver violação «atualizar». */
const ANO_DAS_REGRAS = 2026;

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

const MES_POR_NUMERO: Record<number, string> = {
  1: "janeiro",
  2: "fevereiro",
  3: "março",
  4: "abril",
  5: "maio",
  6: "junho",
  7: "julho",
  8: "agosto",
  9: "setembro",
  10: "outubro",
  11: "novembro",
  12: "dezembro",
};

const REGEX_MESES = new RegExp(`\\b(${MESES.join("|")})\\b`, "giu");

/** Meses mencionados num texto, em minúsculas e sem duplicados. */
export function mesesMencionados(texto: string): string[] {
  const encontrados = texto.match(REGEX_MESES) ?? [];
  return [...new Set(encontrados.map((m) => m.toLowerCase()))];
}

/**
 * Uma frase que menciona um mês afirma-o como prazo, a menos que o esteja a
 * negar, a adiar ou a remeter para o mês da matrícula (a única forma
 * correta de falar do IUC em 2026 — ver DL 161/2026 e iuc-2026.json).
 */
function fraseNegaOuAdiaOmes(frase: string): boolean {
  return (
    /mês da matrícula/i.test(frase) ||
    /\b(não|nunca)\b/i.test(frase) ||
    /\b(a partir de|só vale|só existem|só entra)\s+(em\s+)?20\d\d/i.test(frase)
  );
}

function frases(texto: string): string[] {
  return texto.split(/(?<=[.!?])\s+/).filter((f) => f.trim().length > 0);
}

/**
 * Verifica a coerência e devolve as violações (vazio = coerente).
 * Domínios sem regras no pack (irs, efatura…) são ignorados — o teste só
 * vigia o que tem JSON de fonte.
 */
export function verificarCoerencia(
  calendario: Calendario,
  iuc: IucRegras,
  imi: ImiRegras
): string[] {
  const violacoes: string[] = [];

  // ── anos alinhados ──────────────────────────────────────────────
  if (calendario.ano !== iuc.ano || calendario.ano !== imi.ano) {
    violacoes.push(
      `anos desalinhados: calendario=${calendario.ano}, iuc=${iuc.ano}, imi=${imi.ano} — o calendário não pode citar prazos de regras de outro ano`
    );
  }
  if (calendario.ano !== ANO_DAS_REGRAS) {
    violacoes.push(
      `o calendário é de ${calendario.ano} mas este teste importa as regras de ${ANO_DAS_REGRAS} — atualizar os imports de scripts/coerencia-calendario.ts e a constante ANO_DAS_REGRAS`
    );
  }

  const mesesImi = new Set(
    imi.prestacoes.regras.flatMap((r) => r.meses.map((m) => MES_POR_NUMERO[m]))
  );

  for (const prazo of calendario.prazos) {
    const dominio = prazo.id.replace(/-.*$/, "");

    // ── IMI: os meses afirmados têm de estar nas prestações do art. 120.º ──
    if (dominio === "imi") {
      for (const m of mesesMencionados(prazo.titulo)) {
        if (!mesesImi.has(m))
          violacoes.push(
            `imi («${prazo.id}»): o título afirma «${m}» como prazo, mas as prestações do imi-${calendario.ano}.json só cobrem ${[...mesesImi].join(", ")}`
          );
      }
      for (const m of mesesMencionados(prazo.descricao)) {
        if (!mesesImi.has(m))
          violacoes.push(
            `imi («${prazo.id}»): a descrição afirma «${m}» como prazo, mas as prestações do imi-${calendario.ano}.json só cobrem ${[...mesesImi].join(", ")}`
          );
      }
      const mesDoPrazo = MES_POR_NUMERO[parseInt(prazo.mes.slice(5, 7), 10)];
      if (mesDoPrazo && !mesesImi.has(mesDoPrazo)) {
        violacoes.push(
          `imi («${prazo.id}»): o mês do prazo (${prazo.mes} = ${mesDoPrazo}) não consta das prestações do imi-${calendario.ano}.json`
        );
      }
      continue;
    }

    // ── IUC: o regime de cobrança manda (ver cobrancas do iuc-2026.json) ──
    if (dominio === "iuc") {
      const regime = iuc.cobrancas.regimeVigorEm2026 ?? iuc.cobrancas.regime;
      if (!regime) {
        violacoes.push(
          `iuc («${prazo.id}»): iuc-${calendario.ano}.json não declara regime de cobrança (cobrancas.regimeVigorEm2026/regime) — reler o diploma antes de o calendário afirmar prazos`
        );
        continue;
      }
      if (regime === "mês da matrícula") {
        for (const m of mesesMencionados(prazo.titulo)) {
          violacoes.push(
            `iuc («${prazo.id}»): o título afirma «${m}» como prazo, mas o regime em vigor é o mês da matrícula — nenhum mês fixo é prazo do IUC`
          );
        }
        for (const frase of frases(`${prazo.titulo} ${prazo.descricao}`)) {
          if (mesesMencionados(frase).length === 0) continue;
          if (!fraseNegaOuAdiaOmes(frase)) {
            violacoes.push(
              `iuc («${prazo.id}»): a frase afirma meses («${frase.trim().slice(0, 90)}…») sem negar ou adiar — contradiz o regime do mês da matrícula`
            );
          }
        }
      } else {
        const mesesDoRegime = new Set(mesesMencionados(regime));
        for (const m of mesesMencionados(prazo.titulo)) {
          if (!mesesDoRegime.has(m))
            violacoes.push(
              `iuc («${prazo.id}»): o título afirma «${m}», que não está no regime declarado («${regime}») — alinhar com iuc-${calendario.ano}.json`
            );
        }
      }
    }
    // outros domínios (irs, efatura, …) não têm regras JSON no pack: ignorados
  }

  return violacoes;
}

/** A verificação do estado atual do pack — é isto que o CI corre. */
export function coerenciaAtual(): string[] {
  return verificarCoerencia(
    calendarioJson as unknown as Calendario,
    iucJson as unknown as IucRegras,
    imiJson as unknown as ImiRegras
  );
}
