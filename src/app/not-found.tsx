import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-24">
      <p className="kicker">Erro 404</p>
      <h1 className="titulo-pagina">
        Este euro
        <br />
        não existe.
      </h1>
      <p className="lede mt-6">
        A página que procuras não está nos nossos registos — ou mudou de
        sítio. O índice tem tudo o que publicámos.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Voltar ao início
        </Link>
        <Link href="/dados" className="btn">
          Ver os dados
        </Link>
      </div>
    </div>
  );
}
