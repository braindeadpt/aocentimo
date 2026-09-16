import Link from "next/link";

const NAV = [
  ["Inflação", "/inflacao"],
  ["Salário", "/salario"],
  ["Impostos", "/impostos"],
  ["Crédito", "/credito"],
  ["Poupança", "/poupanca"],
  ["Preços", "/precos"],
  ["Aprender", "/aprender"],
];

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto max-w-5xl px-5 h-14 flex items-center justify-between gap-6">
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-ink hover:text-accent transition-colors"
        >
          Cêntimo
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-ink2">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="hover:text-ink transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <details className="md:hidden relative">
          <summary className="list-none cursor-pointer text-sm text-ink2 px-2 py-1">
            Menu
          </summary>
          <nav className="absolute right-0 top-8 w-44 bg-surface border border-line shadow-sm flex flex-col text-sm">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="px-4 py-2.5 hover:bg-paper text-ink2"
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
