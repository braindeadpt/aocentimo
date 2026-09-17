import Link from "next/link";
import { loadFontes } from "@/lib/data";
import { fmtData } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteNav } from "@/components/SiteNav";

export function SiteHeader() {
  const fontes = loadFontes();
  const serieAte = fontes[0]?.serieAte;

  return (
    <header className="border-b-2 border-ink bg-paper">
      {/* fio de cabeçalho: meta de edição + tema */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-5 py-1.5">
          <span className="num text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            {m.brand.kicker}
          </span>
          <span className="flex items-center gap-4">
            <span className="num hidden text-[0.65rem] uppercase tracking-[0.16em] text-muted sm:block">
              {serieAte ? t(m.brand.dataUntil, { date: fmtData(serieAte) }) : m.brand.edition}
            </span>
            <ThemeToggle />
          </span>
        </div>
      </div>

      {/* nome + navegação */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 pb-3 pt-4">
        <Link href="/" aria-label={m.brand.name} className="block shrink-0 transition-opacity hover:opacity-80">
          <Logo className="text-4xl md:text-5xl" />
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
