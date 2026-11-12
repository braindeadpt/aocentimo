import Link from "next/link";
import { loadFontes } from "@/lib/data";
import { fmtData } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteNav } from "@/components/SiteNav";

const ISO_SERIE = /^\d{4}-\d{2}(?:-\d{2})?$/;
const chaveIso = (s: string) => (s.length === 7 ? `${s}-00` : s);

/** Data máxima real entre as séries estatísticas ingeridas (exclui regras
 *  fiscais anuais como `"2026"` que não são leituras diárias/mensais). */
export function serieMaisRecente(
  fontes: readonly { id: string; serieAte: string }[]
): string | undefined {
  const estatisticas = fontes.filter(
    (f) => !f.id.startsWith("fiscal-") && ISO_SERIE.test(f.serieAte)
  );
  const candidatas = estatisticas.length
    ? estatisticas
    : fontes.filter((f) => ISO_SERIE.test(f.serieAte));
  return candidatas
    .map((f) => f.serieAte)
    .sort((a, b) => chaveIso(a).localeCompare(chaveIso(b)))
    .at(-1);
}

export function SiteHeader() {
  const fontes = loadFontes();
  const serieAte = serieMaisRecente(fontes);

  return (
    <header className="cab-v5">
      {/* fio de cabeçalho: meta de edição + tema. O interruptor fica
          visível em TODAS as rotas, home incluída (P3): em escuro o
          chrome passa à noite do bairro e só o mapa fica a papel. */}
      <div className="cab-fio">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-1.5">
          <span>
            {m.brand.kicker}
          </span>
          <span className="flex shrink-0 items-center gap-4">
            <span className="hidden sm:block">
              {serieAte ? t(m.brand.dataUntil, { date: fmtData(serieAte) }) : m.brand.edition}
            </span>
            <ThemeToggle rotulos={m.tema} />
          </span>
        </div>
      </div>

      {/* nome + navegação — o wrap só contém texto a 200 % (1.4.4);
          à dimensão normal cabe tudo numa linha e nada muda. */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 pb-3 pt-4">
        <Link href="/" aria-label={m.brand.name} className="inline-flex min-h-[44px] shrink-0 items-center transition-opacity hover:opacity-80">
          {/* capitular 20,6 px no telemóvel · 24,8 px no computador
              (a altura do SVG é a da haste; capitular = 63,95 %) */}
          <Logo className="h-[32.2px] md:h-[38.8px]" />
        </Link>
        <SiteNav rotulos={m.nav} />
      </div>
    </header>
  );
}
