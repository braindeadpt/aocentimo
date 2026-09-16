import Link from "next/link";
import { loadFontes } from "@/lib/data";
import { fmtData } from "@/lib/format";
import { m, t } from "@/lib/messages";
import { Logo } from "@/components/Logo";

const NAV = [
  ["salario", "/salario"],
  ["impostos", "/impostos"],
  ["inflacao", "/inflacao"],
  ["credito", "/credito"],
  ["casa", "/casa"],
  ["irs", "/irs"],
  ["trabalho", "/trabalho"],
  ["poupanca", "/poupanca"],
  ["precos", "/precos"],
  ["dados", "/dados"],
  ["aprender", "/aprender"],
] as const;

export function SiteHeader() {
  const fontes = loadFontes();
  const serieAte = fontes[0]?.serieAte;

  return (
    <header className="border-b-2 border-ink bg-paper">
      {/* fio de cabeçalho: meta de edição */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-5 py-1.5">
          <span className="num text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            {m.brand.kicker}
          </span>
          <span className="num hidden text-[0.65rem] uppercase tracking-[0.16em] text-muted sm:block">
            {serieAte ? t(m.brand.dataUntil, { date: fmtData(serieAte) }) : m.brand.edition}
          </span>
        </div>
      </div>

      {/* nome + navegação */}
      <div className="mx-auto flex max-w-6xl items-end justify-between px-5 pb-3 pt-4">
        <Link href="/" aria-label={m.brand.name} className="block transition-opacity hover:opacity-80">
          <Logo className="h-9 w-auto md:h-11" />
        </Link>
        <nav className="hidden items-baseline gap-5 md:flex">
          {NAV.map(([key, href]) => (
            <Link
              key={href}
              href={href}
              className="num text-[0.72rem] uppercase tracking-[0.12em] text-ink2 transition-colors hover:text-accent"
            >
              {m.nav[key]}
            </Link>
          ))}
        </nav>
        <details className="relative md:hidden">
          <summary className="num cursor-pointer list-none text-[0.72rem] uppercase tracking-[0.12em] text-ink2">
            {m.nav.index}
          </summary>
          <nav className="absolute right-0 top-7 z-50 flex w-44 flex-col border border-ink bg-surface">
            {NAV.map(([key, href]) => (
              <Link
                key={href}
                href={href}
                className="border-b border-line px-4 py-2.5 text-sm text-ink2 last:border-0 hover:bg-paper"
              >
                {m.nav[key]}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
