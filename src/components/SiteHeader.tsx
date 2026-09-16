import Link from "next/link";
import { loadFontes } from "@/lib/data";
import { fmtData } from "@/lib/format";

const NAV = [
  ["Salário", "/salario"],
  ["Impostos", "/impostos"],
  ["Inflação", "/inflacao"],
  ["Crédito", "/credito"],
  ["Poupança", "/poupanca"],
  ["Preços", "/precos"],
  ["Aprender", "/aprender"],
];

export function SiteHeader() {
  const fontes = loadFontes();
  const serieAte = fontes[0]?.serieAte;

  return (
    <header className="border-b-2 border-ink bg-paper">
      {/* fio de cabeçalho: meta de edição */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-5 py-1.5">
          <span className="num text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            Literacia monetária · Portugal
          </span>
          <span className="num hidden text-[0.65rem] uppercase tracking-[0.16em] text-muted sm:block">
            {serieAte ? `dados até ${fmtData(serieAte)}` : "edição contínua"}
          </span>
        </div>
      </div>

      {/* nome + navegação */}
      <div className="mx-auto flex max-w-6xl items-end justify-between px-5 pb-3 pt-4">
        <Link
          href="/"
          className="font-display text-4xl leading-none tracking-wide text-ink transition-colors hover:text-accent md:text-5xl"
        >
          CÊNTIMO
        </Link>
        <nav className="hidden items-baseline gap-5 md:flex">
          {NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="num text-[0.72rem] uppercase tracking-[0.12em] text-ink2 transition-colors hover:text-accent"
            >
              {label}
            </Link>
          ))}
        </nav>
        <details className="relative md:hidden">
          <summary className="num cursor-pointer list-none text-[0.72rem] uppercase tracking-[0.12em] text-ink2">
            Índice
          </summary>
          <nav className="absolute right-0 top-7 z-50 flex w-44 flex-col border border-ink bg-surface">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="border-b border-line px-4 py-2.5 text-sm text-ink2 last:border-0 hover:bg-paper"
              >
                {label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
