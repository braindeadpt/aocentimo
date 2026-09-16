import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line mt-20">
      <div className="mx-auto max-w-5xl px-5 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <p className="font-display text-lg text-ink">Cêntimo</p>
          <p className="footnote mt-2">
            Literacia financeira para Portugal. Projeto pessoal, gratuito e sem
            publicidade. Cada número mostra a fonte e a data.
          </p>
        </div>
        <div className="text-ink2 space-y-2">
          <p className="kicker">Site</p>
          <p><Link href="/metodologia" className="hover:text-ink">Metodologia e fontes</Link></p>
          <p><Link href="/sobre" className="hover:text-ink">Sobre</Link></p>
          <p><Link href="/estilo" className="hover:text-ink">Sistema de design</Link></p>
        </div>
        <div>
          <p className="kicker">Aviso</p>
          <p className="footnote mt-2">
            Os simuladores são indicativos e não constituem aconselhamento
            financeiro, fiscal ou de crédito. Para decisões fiscais consulta um
            contabilista certificado.
          </p>
        </div>
      </div>
    </footer>
  );
}
