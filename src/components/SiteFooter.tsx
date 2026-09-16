import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-ink">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl tracking-wide text-ink">CÊNTIMO</p>
            <p className="footnote mt-3 max-w-sm">
              Literacia financeira para Portugal. Projeto pessoal, gratuito, sem
              publicidade e sem rastreamento. Cada número mostra a fonte e a
              data — quando uma fonte falha, mostramos a falha.
            </p>
          </div>
          <div className="text-sm text-ink2">
            <p className="num mb-3 text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              Índice
            </p>
            <ul className="space-y-1.5">
              <li><Link href="/metodologia" className="hover:text-accent">Metodologia e fontes</Link></li>
              <li><Link href="/sobre" className="hover:text-accent">Sobre</Link></li>
              <li><Link href="/estilo" className="hover:text-accent">Sistema de design</Link></li>
            </ul>
          </div>
          <div>
            <p className="num mb-3 text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              Aviso
            </p>
            <p className="footnote">
              Simuladores indicativos — não constituem aconselhamento
              financeiro, fiscal ou de crédito. Para decisões fiscais consulta
              um contabilista certificado.
            </p>
          </div>
        </div>
        <div className="rule mt-10 pt-4 flex flex-wrap items-baseline justify-between gap-3">
          <p className="num text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            {new Date().getFullYear()} · feito em Portugal
          </p>
          <p className="num text-[0.65rem] uppercase tracking-[0.16em] text-muted">
            eurostat · ine · bpstat · dgeg · at · igcp
          </p>
        </div>
      </div>
    </footer>
  );
}
