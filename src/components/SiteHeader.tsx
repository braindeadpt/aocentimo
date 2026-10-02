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
    <header className="cab-v5">
      {/* fio de cabeçalho: meta de edição + tema. O interruptor fica
          visível em TODAS as rotas, home incluída (P3): em escuro o
          chrome passa à noite do bairro e só o mapa fica a papel. */}
      <div className="cab-fio">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-5 py-1.5">
          <span>
            {m.brand.kicker}
          </span>
          <span className="flex items-center gap-4">
            <span className="hidden sm:block">
              {serieAte ? t(m.brand.dataUntil, { date: fmtData(serieAte) }) : m.brand.edition}
            </span>
            <ThemeToggle />
          </span>
        </div>
      </div>

      {/* nome + navegação */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 pb-3 pt-4">
        <Link href="/" aria-label={m.brand.name} className="block shrink-0 transition-opacity hover:opacity-80">
          {/* capitular 20,6 px no telemóvel · 24,8 px no computador
              (a altura do SVG é a da haste; capitular = 63,95 %) */}
          <Logo className="h-[32.2px] md:h-[38.8px]" />
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
