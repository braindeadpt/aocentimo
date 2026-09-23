"use client";

import { useState } from "react";
import Link from "next/link";

export interface TermoLista {
  slug: string;
  termo: string;
  definicao: string;
  exemplo?: string;
}

export interface GrupoLista {
  id: string;
  rotulo: string;
  termos: TermoLista[];
  /** nota honesta para o grupo sem termos (ex.: «O país» aponta para
      /dados) — omitida esconde o grupo vazio */
  notaVazio?: string;
}

export interface TextosPesquisa {
  rotulo: string;
  placeholder: string;
  /** template «{n} de {total} termos» */
  contagem: string;
  /** template «Nenhum termo corresponde a «{q}».» */
  vazio: string;
  vazioNota: string;
}

/** comparação sem acentos nem maiúsculas — «iva» encontra «IVA»,
 *  «inflacao» encontra «inflação»; nenhuma dependência de pesquisa */
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * PesquisaGlossario — o índice do glossário com pesquisa por texto.
 * SSR serve a lista completa (sem JS lê-se tudo na mesma — o campo só
 * filtra depois de hidratar); a filtragem é subcadeia normalizada,
 * calculada em memória sobre ~23 termos — sem biblioteca de pesquisa.
 */
export function PesquisaGlossario({
  grupos,
  total,
  textos,
}: {
  grupos: GrupoLista[];
  total: number;
  textos: TextosPesquisa;
}) {
  const [q, setQ] = useState("");
  const nq = norm(q.trim());

  const filtrados = grupos
    .map((g) => ({
      ...g,
      termos: nq
        ? g.termos.filter((t) =>
            norm(`${t.termo} ${t.definicao} ${t.exemplo ?? ""}`).includes(nq)
          )
        : g.termos,
    }))
    .filter((g) => g.termos.length > 0 || (g.notaVazio && !nq));
  const n = filtrados.reduce((acc, g) => acc + g.termos.length, 0);

  return (
    <div>
      <div role="search" className="max-w-md">
        <label htmlFor="pesquisa-glossario" className="kicker-xs mb-2 block">
          {textos.rotulo}
        </label>
        <input
          id="pesquisa-glossario"
          type="search"
          className="field"
          placeholder={textos.placeholder}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <p
          role="status"
          className="num mt-2 text-rotulo text-muted"
        >
          {textos.contagem
            .replace("{n}", String(n))
            .replace("{total}", String(total))}
        </p>
      </div>

      {n === 0 && (
        <div className="mt-6 border border-line bg-panel px-5 py-5">
          <p className="text-corpo-sm text-ink2">
            {textos.vazio.replace("{q}", q.trim())}
          </p>
          <p className="footnote mt-2">
            <Link
              href="/sobre"
              className="underline decoration-line2 underline-offset-2"
            >
              {textos.vazioNota}
            </Link>
          </p>
        </div>
      )}

      {filtrados.map((g) => (
        <section
          key={g.id}
          id={`ap-${g.id}`}
          aria-label={g.rotulo}
          className="mt-10 scroll-mt-24"
        >
          <h3 className="kicker border-b border-line pb-2">{g.rotulo}</h3>
          {g.termos.length === 0 ? (
            <p className="footnote mt-3">{g.notaVazio}</p>
          ) : (
            <ul className="divide-y divide-line">
              {g.termos.map((t) => (
                <li
                  key={t.slug}
                  className="grid gap-1 py-5 md:grid-cols-[200px_1fr] md:gap-8"
                >
                  <p className="font-display text-display-xs text-ink">
                    <Link
                      href={`/aprender/${t.slug}`}
                      className="underline decoration-dashed decoration-line2 underline-offset-4 hover:decoration-mark"
                    >
                      {t.termo}
                    </Link>
                  </p>
                  <div className="body-copy">
                    <p className="text-corpo-sm">{t.definicao}</p>
                    {t.exemplo && (
                      <p className="footnote mt-1.5">
                        <span className="text-muted">Exemplo — </span>
                        {t.exemplo}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
