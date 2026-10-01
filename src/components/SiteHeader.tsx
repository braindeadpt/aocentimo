import Link from "next/link";
import { loadFontes } from "@/lib/data";
import { fmtData } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { Logo } from "@/components/Logo";
import { InterruptorDeTema } from "@/components/InterruptorDeTema";
import { SiteNav } from "@/components/SiteNav";

export function SiteHeader() {
  const fontes = loadFontes();
  const serieAte = fontes[0]?.serieAte;

  return (
    <header className="border-b-2 border-ink bg-floor">
      {/* fio de cabeçalho: meta de edição + tema */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-5 py-1.5">
          <span className="kicker-sm">
            {m.brand.kicker}
          </span>
          <span className="flex items-center gap-4">
            <span className="kicker-sm hidden sm:block">
              {serieAte ? t(m.brand.dataUntil, { date: fmtData(serieAte) }) : m.brand.edition}
            </span>
            {/* O interruptor de tema esconde-se na home (veredicto do
                design sobre a P1): a home do bairro é uma página de papel
                e não tem tema — um botão que não muda nada à vista é uma
                promessa falsa. Volta em P3, quando a pele V5 chegar às
                outras rotas. O <InterruptorDeTema> é cliente porque sabe
                em que rota está; o header de servidor não pode. */}
            <InterruptorDeTema />
          </span>
        </div>
      </div>

      {/* nome + navegação */}
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 pb-3 pt-4">
        <Link href="/" aria-label={m.brand.name} className="block shrink-0 transition-opacity hover:opacity-80">
          {/* capitular 20,6 px no telemóvel · 24,8 px no computador
              (a altura do SVG é a da haste; capitular = 63,95 %) */}
          <Logo className="h-[32.2px] md:h-[38.8px]" />
        </Link>
        <SiteNav />
      </div>
    </header>
  );
}
