import type { Metadata } from "next";
import { loadFontes, loadFreshness } from "@/lib/data";
import { fmtData } from "@/lib/format";

export const metadata: Metadata = {
  title: "Metodologia e fontes",
  description:
    "De onde vêm os números do AO CÊNTIMO: fontes oficiais, frequência de atualização e limitações dos simuladores.",
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

export default function MetodologiaPage() {
  const fontes = loadFontes();
  const frescura = loadFreshness();
  const porId = new Map(frescura?.series.map((s) => [s.id, s]) ?? []);

  return (
    <div className="mx-auto max-w-5xl px-5 pt-14">
      <p className="kicker">Transparência</p>
      <h1 className="font-display text-4xl md:text-6xl tracking-wide mt-2 uppercase">
        Metodologia e fontes
      </h1>
      <p className="lede mt-5">
        Nenhum número neste site é inventado. Cada dado tem fonte oficial,
        data da série e data de recolha — e quando uma fonte falha, mostramos
        a falha em vez de um valor fabricado.
      </p>

      <section className="mt-12">
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

      <section className="mt-12">
        <h2 className="font-display text-2xl mb-6">Estado dos dados</h2>
        {fontes.length === 0 ? (
          <p className="footnote">Pipeline ainda não executada.</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b-2 border-ink">
                <th scope="col" className="py-2 pr-4 font-medium">Série</th>
                <th scope="col" className="py-2 pr-4 font-medium">Fonte</th>
                <th scope="col" className="py-2 pr-4 font-medium">Dados até</th>
                <th scope="col" className="py-2 pr-4 font-medium">Recolhido</th>
                <th scope="col" className="py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="num text-ink2">
              {fontes.map((f) => {
                const s = porId.get(f.id);
                return (
                  <tr key={f.id} className="border-b border-line">
                    <td className="py-2 pr-4">{f.id}</td>
                    <td className="py-2 pr-4">{f.fonte}</td>
                    <td className="py-2 pr-4">{fmtData(f.serieAte)}</td>
                    <td className="py-2 pr-4">{fmtData(f.recolhidoEm.slice(0, 10))}</td>
                    <td className="py-2">
                      {!s ? (
                        <span className="text-muted">—</span>
                      ) : s.estado === "atrasada" ? (
                        <span className="text-up">
                          atrasada {s.atrasoPeriodos} {s.frequencia === "mensal" ? "mês" : "período"}
                          {s.atrasoPeriodos !== 1 ? "es" : ""} — esperado {fmtData(s.esperadoAte)}
                        </span>
                      ) : (
                        <span className="text-muted">em dia</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
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

      <section className="mt-12 max-w-2xl space-y-4 text-ink2 text-[0.95rem] leading-relaxed pb-8">
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
