import Link from "next/link";
import { m } from "@/lib/messages";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="rodape-v5 mt-24">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            {/* capitular 20,6 px — a mesma medida do cabeçalho no telemóvel */}
            <Logo className="h-[32.2px]" />
            <p className="footnote mt-3 max-w-sm">{m.footer.blurb}</p>
          </div>
          <div className="text-corpo-sm">
            <p className="folha-titulo mb-3">
              {m.footer.indexTitle}
            </p>
            <ul className="space-y-1.5">
              <li><Link href="/metodologia">{m.footer.metodologia}</Link></li>
              <li><Link href="/sobre">{m.footer.sobre}</Link></li>
              <li><Link href="/estilo">{m.footer.estilo}</Link></li>
            </ul>
          </div>
          <div>
            <p className="folha-titulo mb-3">
              {m.footer.noticeTitle}
            </p>
            <p className="footnote">{m.footer.notice}</p>
          </div>
        </div>
        <div className="rule mt-10 pt-4 flex flex-wrap items-baseline justify-between gap-3">
          <p className="folha-titulo">
            {new Date().getFullYear()} · {m.footer.madeIn}
          </p>
          <p className="folha-titulo">
            {m.footer.sources}
          </p>
          <p className="footnote">{m.footer.direitos}</p>
        </div>
      </div>
    </footer>
  );
}
