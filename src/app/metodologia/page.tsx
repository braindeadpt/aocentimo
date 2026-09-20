import type { Metadata } from "next";
import { ALT_FEED } from "@/lib/meta";
import { loadFontes, loadFreshness } from "@/lib/data";
import { fmtData } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodologia e fontes",
  description:
    "De onde vêm os números do AO CÊNTIMO: fontes oficiais, frequência de atualização e limitações dos simuladores.",
  alternates: { canonical: "/metodologia", types: ALT_FEED },
};

const FONTES_FIXAS = [
  {
    nome: "Eurostat — IHPC",
    uso: "Índice de preços por categoria COICOP (mensal)",
    url: "https://ec.europa.eu/eurostat",
    nota: "API pública, recolha automática mensal via pipeline",
  },
  {
    nome: "INE — IPC",
    uso: "Índice nacional (validação cruzada)",
    url: "https://www.ine.pt",
    nota: "O IPC nacional difere do IHPC — metodologia distinta",
  },
  {
    nome: "Banco de Portugal — BPstat",
    uso: "Euribor média mensal (1, 3, 6 e 12 meses)",
    url: "https://bpstat.bportugal.pt",
    nota: "API pública, recolha automática diária — as médias mensais são as que os bancos aplicam às prestações",
  },
  {
    nome: "DGEG",
    uso: "Preço médio nacional de combustíveis (€/litro, diário)",
    url: "https://precoscombustiveis.dgeg.gov.pt",
    nota: "API pública do portal, recolha automática diária (incremental desde 2017)",
  },
  {
    nome: "AT / Diário da República",
    uso: "Escalões de IRS, retenções, IVA, ISP, deduções",
    url: "https://info.portaldasfinancas.gov.pt",
    nota: "Regras versionadas por ano em data/fiscal/ — revistas manualmente a cada OE",
  },
  {
    nome: "IGCP",
    uso: "Certificados de Aforro — taxas e fichas técnicas",
    url: "https://www.igcp.pt",
    nota: "Taxas mensais das séries em vigor",
  },
];

/** Índice do período que contém uma data/rótulo — série e esperado podem
 *  vir em convenções diferentes ("2026-08", "2026-09-30", "2026"). */
function periodoIndex(iso: string, frequencia: string): number | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!Number.isFinite(y)) return null;
  const mm = m || 1;
  const dd = d || 1;
  switch (frequencia) {
    case "anual":
      return y;
    case "diaria":
      return Math.round(Date.UTC(y, mm - 1, dd) / 86_400_000);
    case "trimestral":
      return y * 4 + Math.floor((mm - 1) / 3);
    case "semestral":
      return y * 2 + Math.floor((mm - 1) / 6);
    default:
      return y * 12 + (mm - 1); // mensal
  }
}

/** Folga da série em períodos próprios — quanto o `serieAte` já passou
 *  o `esperadoAte` do SLA. 0 = no limite: a próxima publicação decide. */
function folgaPeriodos(s: {
  serieAte: string;
  esperadoAte: string;
  frequencia: string;
}): number | null {
  if (!s.esperadoAte || s.esperadoAte === "—") return null;
  const a = periodoIndex(s.serieAte, s.frequencia);
  const b = periodoIndex(s.esperadoAte, s.frequencia);
  if (a === null || b === null) return null;
  return a - b;
}

const UN_FOLGA: Record<string, [string, string]> = {
  mensal: ["mês", "meses"],
  diaria: ["dia", "dias"],
  anual: ["ano", "anos"],
  trimestral: ["trimestre", "trimestres"],
  semestral: ["semestre", "semestres"],
};

export default function MetodologiaPage() {
  const fontes = loadFontes();
  const frescura = loadFreshness();
  const porId = new Map(frescura?.series.map((s) => [s.id, s]) ?? []);

  // mural por urgência: atrasada → no limite → em dia → sem SLA → sem dados
  const celulas = fontes
    .map((f) => {
      const s = porId.get(f.id);
      const folga = s ? folgaPeriodos(s) : null;
      const [unS, unP] = UN_FOLGA[s?.frequencia ?? "mensal"] ?? ["período", "períodos"];
      const classe = !s
        ? "sem-sla"
        : s.estado === "atrasada"
          ? "atrasada"
          : s.estado === "sem-sla"
            ? "sem-sla"
            : folga === 0
              ? "no-limite"
              : "em-dia";
      const folgaTxt = !s
        ? "sem verificação"
        : s.estado === "atrasada"
          ? `−${s.atrasoPeriodos} ${s.atrasoPeriodos === 1 ? unS : unP}`
          : s.estado === "sem-sla"
            ? "sem SLA"
            : folga === 0
              ? "no limite"
              : `+${folga} ${folga === 1 ? unS : unP}`;
      const rank = { atrasada: 0, "no-limite": 1, "em-dia": 2, "sem-sla": 3 }[classe];
      return { id: f.id, fonte: f.fonte, serieAte: f.serieAte, classe, folgaTxt, rank };
    })
    .sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));

  const nLimite = celulas.filter((c) => c.classe === "no-limite").length;
  const nAtrasadas = celulas.filter((c) => c.classe === "atrasada").length;
  const nSemSla = celulas.filter((c) => c.classe === "sem-sla").length;
  const resumo = `${celulas.length} séries · ${celulas.length - nLimite - nAtrasadas - nSemSla} com folga · ${nLimite} no limite · ${nAtrasadas} atrasadas${nSemSla ? ` · ${nSemSla} sem SLA` : ""}`;

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Transparência</p>
      <h1 className="font-display text-3xl hyphens-auto sm:text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Metodologia e fontes
      </h1>
      <p className="lede mt-5">
        Nenhum número neste site é inventado. Cada dado tem fonte oficial,
        data da série e data de recolha — e quando uma fonte falha, mostramos
        a falha em vez de um valor fabricado.
      </p>

      <section className="stack-sec">
        <h2 className="font-display text-2xl mb-6">Fontes</h2>
        <div className="divide-y divide-line border-y border-line">
          {FONTES_FIXAS.map((f) => (
            <div key={f.nome} className="py-4 grid md:grid-cols-[260px_1fr] gap-2">
              <p className="font-medium text-ink text-sm">
                <a href={f.url} className="hover:text-accent underline decoration-line2 underline-offset-2">
                  {f.nome}
                </a>
              </p>
              <div className="text-sm text-ink2">
                <p>{f.uso}</p>
                <p className="footnote mt-1">{f.nota}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="stack-sec">
        <h2 className="font-display text-2xl mb-6">Estado dos dados</h2>
        {fontes.length === 0 ? (
          <p className="footnote">Pipeline ainda não executada.</p>
        ) : (
          <>
            {/* quadro vivo (M-19): a tabela cinzenta de 60 «em dia»
                torna-se mural — a margem de cada série vê-se, e o que
                está no fio (serieAte == esperadoAte) sobe para o topo */}
            <p className="footnote mb-3">
              <span className="serie-estado em-dia" aria-hidden /> em dia com
              folga ·{" "}
              <span className="serie-estado no-limite" aria-hidden /> em dia,
              no limite ·{" "}
              <span className="serie-estado atrasada" aria-hidden /> atrasada
              · <span className="serie-estado sem-sla" aria-hidden /> sem SLA
            </p>
            <p className="num text-sm text-ink2 mb-2">
              {resumo}
            </p>
            <ul className="quadro-vivo">
              {celulas.map((c) => (
                <li
                  key={c.id}
                  className={`qcell ${
                    c.classe === "atrasada"
                      ? "qcell-atrasada"
                      : c.classe === "no-limite"
                        ? "qcell-limite"
                        : ""
                  }`}
                  title={`${c.id} — ${c.fonte}`}
                >
                  <p className="qcell-id">{c.id}</p>
                  <p className="qcell-meta">
                    <span className={`serie-estado ${c.classe}`} aria-hidden />
                    {fmtData(c.serieAte)}
                    <span className="qcell-folga"> · {c.folgaTxt}</span>
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
        {frescura && (
          <p className="footnote mt-3">
            Frescura verificada {fmtData(frescura.verificadoEm.slice(0, 10))} pelo
            watchdog do pipeline: uma série falha quando a fonte já devia ter
            publicado o período seguinte e não publicou.
            {frescura.estado === "atrasado" && (
              <span className="text-up"> Há séries atrasadas.</span>
            )}
          </p>
        )}
      </section>

      <section className="body-copy stack-sec max-w-2xl space-y-4 pb-8">
        <h2 className="font-display text-2xl text-ink">Limitações honestas</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>A inflação oficial é um índice de cabaz médio — não o preço do teu cabaz.</li>
          <li>A retenção na fonte mensal segue as tabelas do Despacho n.º 233-A/2026 (continente, sem deficiência). Faltam deduções de saúde/educação, IRS Jovem, pensões e regimes especiais. Açores e Madeira têm regras próprias.</li>
          <li>O ISP muda por portaria, por vezes semanalmente — os valores mostrados têm data de vigência explícita.</li>
          <li>Simuladores não são aconselhamento. Para decisões fiscais, consulta um contabilista certificado.</li>
        </ul>
      </section>
    </div>
  );
}
