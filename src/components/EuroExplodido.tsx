"use client";

/**
 * EuroExplodido — «O TEU EURO» (R-02, Direcção V3 §6): o euro bruto
 * desmontado numa explosão isométrica — camadas wireframe afastadas
 * na vertical sobre um eixo tracejado, cada uma com a sua linha de
 * chamada até ao rótulo mono à direita. A metáfora é a da referência
 * (o vault em peças): «o euro desmontado», nunca a moeda a rolar.
 *
 * O desenho é o Explodido (partilhado com o CustoExplodido de
 * /salario desde R-05): desde R-07 as peças são EUROS REAIS DO MÊS —
 * os mesmos números que /salario mostra no recibo (165 € de SS,
 * 168 € de IRS, 1 167 € na conta…), já não cêntimos por euro. Os
 * valores são estáticos — os passos chegam do servidor.
 *
 * O cartão reusa a gramática .leitura: breadcrumb + corpo + rodapé,
 * inversão para papel em hover/focus-within via vars locais --l-*.
 * O svg é decorativo (aria-hidden) — o equivalente sempre visível é
 * a <ol data-euro-lista> com os mesmos passos e valores; hover/focus
 * num passo realça a peça e vice-versa.
 *
 * Montagem (só com .eu-on, via useArmado abaixo da dobra): cada peça
 * nasce ~40 px acima e converge para o stack (stagger 80 ms,
 * --ease-entra), as chamadas revelam-se depois por clip-path (o dash
 * "2 3" é semântico, não serve de truque de desenho) e os rótulos
 * assentam por último; os valores da lista contam (Odometer).
 * Reduced-motion = stack montado e legendado — o estado base é o
 * final e a inversão é instantânea (bloco global).
 */
import Link from "next/link";
import { Explodido, type PecaExplodida } from "@/components/Explodido";
import { Odometer } from "@/components/Odometer";
import { fmtEUR0 } from "@/lib/format";
import { useArmado } from "@/lib/useArmado";

export interface PassoEuro {
  id: string;
  rotulo: string;
  detalhe: string;
  /** euros por mês — o valor real do cenário, não cêntimos por euro */
  euros: number;
  /** corte (SS, IRS, impostos do gasóleo) → sinal «−» à casa */
  corte?: boolean;
  fonteNome: string;
  fonteUrl?: string;
}

export interface RotulosEuro {
  /** kicker da secção — «O TEU EURO» */
  titulo: string;
  /** nota à direita do kicker — o cenário simulado */
  nota: string;
  /** breadcrumb mono do cartão — «O TEU DINHEIRO / DECOMPOSIÇÃO · …» */
  breadcrumb: string;
  /** selo do lado direito do cabeçalho — «o Estado e os impostos
      levam {valor}/mês», já resolvido no servidor */
  meta: string;
  brutoRotulo: string;
  brutoDetalhe: string;
  /** kicker junto ao número grande — «ficam-te» */
  ficamTe: string;
  /** linha pequena por baixo do número — «por mês» */
  porMes: string;
  fontes: string;
  simulador: string;
}

export function EuroExplodido({
  passos,
  rotulos,
  bruto,
}: {
  passos: PassoEuro[];
  rotulos: RotulosEuro;
  /** o bruto do cenário, em €/mês — a placa-mãe do stack */
  bruto: number;
}) {
  const { ref, arm } = useArmado<HTMLElement>("euro:explodido");

  const fica = passos.find((p) => p.id === "fica") ?? passos[passos.length - 1];

  // o stack: a moeda-mãe no topo (fora da lista — é o todo, não um
  // passo), os passos por ordem, a base no fundo
  const pecas: PecaExplodida[] = [
    {
      id: "bruto",
      kind: "moeda",
      rotulo: rotulos.brutoRotulo,
      valorSvg: fmtEUR0(bruto),
      tom: "neutro", // o bruto não sai nem fica — é o ponto de partida
      detalhe: rotulos.brutoDetalhe,
    },
    ...passos.map<PecaExplodida>((p) => ({
      id: p.id,
      kind: p.id === "fica" ? "base" : p.id === "liquido" ? "disco" : "placa",
      rotulo: p.rotulo,
      valorSvg: `${p.corte ? "−" : ""}${fmtEUR0(p.euros)}`,
      valorLista: (
        <Odometer
          valor={p.euros}
          casas={0}
          prefixo={p.corte ? "−" : ""}
          sufixo=" €"
          dur={700}
        />
      ),
      // corte = sai do bolso (vermelho); tudo o resto é dinheiro que
      // fica contigo — líquido e «fica» verdes (S1-02)
      tom: p.corte ? "corte" : "fica",
      detalhe: p.detalhe,
    })),
  ];

  // as fontes dos passos, sem repetições, para o rodapé do cartão
  const fontes = passos.reduce<{ nome: string; url?: string }[]>((acc, p) => {
    if (!acc.some((f) => f.nome === p.fonteNome))
      acc.push({ nome: p.fonteNome, url: p.fonteUrl });
    return acc;
  }, []);

  return (
    <section aria-labelledby="euro-titulo" className="stack-sec">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3">
        <h2 id="euro-titulo" className="kicker">
          {rotulos.titulo}
        </h2>
        <p className="num text-right text-rotulo text-muted">{rotulos.nota}</p>
      </div>

      <article
        ref={ref}
        className={`leitura leitura-amplo eu-card mt-5 ${arm("eu-on")}`}
      >
        <header className="leitura-head">
          <p className="leitura-breadcrumb">{rotulos.breadcrumb}</p>
          {rotulos.meta && (
            <p className="leitura-meta num">
              <span>{rotulos.meta}</span>
            </p>
          )}
        </header>

        <div className="leitura-corpo">
          <Explodido
            nome="euro"
            pecas={pecas}
            numero={{
              kicker: rotulos.ficamTe,
              valor: fica ? `~${fmtEUR0(fica.euros)}` : "",
              pequeno: rotulos.porMes,
              compacto: true,
            }}
          />
        </div>

        <footer className="leitura-foot">
          <p className="leitura-fonte">
            {rotulos.fontes}:{" "}
            {fontes.map((f, i) => (
              <span key={f.nome}>
                {i > 0 && " · "}
                {f.url ? (
                  f.url.startsWith("/") ? (
                    <Link href={f.url} className="lq-link">
                      {f.nome}
                    </Link>
                  ) : (
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="lq-link"
                    >
                      {f.nome}
                    </a>
                  )
                ) : (
                  f.nome
                )}
              </span>
            ))}
          </p>
          <p className="leitura-acoes">
            <Link href="/salario" className="lq-link">
              {rotulos.simulador} →
            </Link>
          </p>
        </footer>
      </article>
    </section>
  );
}
