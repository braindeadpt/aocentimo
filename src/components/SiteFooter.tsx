import Link from "next/link";
import { m } from "@/lib/messages";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-ink">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo className="text-display-md" />
            <p className="footnote mt-3 max-w-sm">{m.footer.blurb}</p>
          </div>
          <div className="text-corpo-sm text-ink2">
            <p className="kicker-sm mb-3">
              {m.footer.indexTitle}
            </p>
            <ul className="space-y-1.5">
              <li><Link href="/metodologia" className="hover:text-accent">{m.footer.metodologia}</Link></li>
              <li><Link href="/sobre" className="hover:text-accent">{m.footer.sobre}</Link></li>
              <li><Link href="/estilo" className="hover:text-accent">{m.footer.estilo}</Link></li>
            </ul>
          </div>
          <div>
            <p className="kicker-sm mb-3">
              {m.footer.noticeTitle}
            </p>
            <p className="footnote">{m.footer.notice}</p>
          </div>
        </div>
        <div className="rule mt-10 pt-4 flex flex-wrap items-baseline justify-between gap-3">
          <p className="kicker-sm">
            {new Date().getFullYear()} · {m.footer.madeIn}
          </p>
          <p className="kicker-sm">
            {m.footer.sources}
          </p>
        </div>
      </div>
    </footer>
  );
}
