import type { ReactNode } from "react";
import Link from "next/link";
import { Icone, IconeEmblema, type NomeIcone } from "@/components/Icone";
import type { EstadoOrbe } from "@/components/OrbeEstado";
import { ivaContido } from "@/lib/engines/impostos";
import { simularPrestacao } from "@/lib/engines/prestacao";
import { fmtEUR, fmtEUR0, fmtPct } from "@/lib/format";
import { m, t } from "@/lib/messages";
import "./portas.css";
import {
  PreviewBanco,
  PreviewIva,
  PreviewOrbes,
  PreviewRecibo,
  type PortaPrestacao,
  type PortaRecibo,
} from "./portas-previews";

/**
 * «Escolhe a tua pergunta» (S2-03) — a entrada da home para o resto
 * do site: as quatro perguntas da navegação como quatro cartões-porta,
 * cada um com uma mini-prévia viva da página a que abre:
 *
 *   O que ganhas → /salario   · o recibo em miniatura (imprime linha a linha)
 *   O que pagas  → /impostos  · o talão com o IVA a separar-se p/ o cupão
 *   O banco      → /credito   · juro e capital a trocar de peso
 *   O país       → /dados     · a grelha de orbes de estado das séries
 *
 * A mecânica (vídeo de referência 2) é CSS puro em portas.css — em
 * repouso são quatro painéis de instrumento iguais em compostura; ao
 * passar o rato ou focar por teclado o cartão inverte para papel
 * (vars --pq-*, a mesma técnica das --l-* do .leitura) e a prévia
 * anima. Sem JS funciona tudo; em reduced-motion a inversão é
 * instantânea e nada anima.
 *
 * Componente de servidor: os motores (ivaContido, simularPrestacao)
 * correm aqui no build; ao cliente chega só markup. Os rótulos das
 * perguntas vêm de m.nav — os cartões são a navegação, não uma
 * paráfrase dela. A copy própria vive em m.home.portas.
 */

export interface EscolhePerguntaProps {
  /** o cenário canónico resumido — cenarioCanonico() + a tabela de
      retenção da linha de data/derived/cenarios-salario.json */
  recibo: PortaRecibo;
  /** as três taxas do continente, por nome — de data/fiscal/iva.json
      (Reduzida / Intermédia / Normal); nunca escritas à mão */
  ivaTaxas: { reduzida: number; intermedia: number; normal: number };
  /** o crédito canónico da miniatura — os mesmos defeitos do
      simulador de /credito (200 000 € · 30 anos · spread 1 %); a
      Euribor é a 3M mais recente do painel — null = série não
      recolhida (regra nº1: diz-se a falha, não se inventa) */
  prestacao: {
    capital: number;
    meses: number;
    euribor: number | null;
    spread: number;
  };
  /** estado real das séries de data/derived/painel.json, por id —
      ex.: Object.fromEntries(painel.series.map(s => [s.id, s.estado])) */
  estados: Record<string, EstadoOrbe>;
}

export function EscolhePergunta({
  recibo,
  ivaTaxas,
  prestacao,
  estados,
}: EscolhePerguntaProps) {
  const s = m.home.portas;
  // «O que pagas» — o mini-cabaz de m.home.portas com as taxas reais
  // de iva.json, decomposto pelo motor (iva contido no preço final);
  // item.taxa é a chave do JSON («reduzida»/«intermedia»/«normal»)
  const linhasIva = s.pagas.cabaz.map((item) => {
    const taxa = ivaTaxas[item.taxa as keyof typeof ivaTaxas];
    const r = ivaContido(item.preco, taxa);
    return { nome: item.nome, preco: item.preco, taxa, iva: r.iva, semIva: r.semIva };
  });
  const total = linhasIva.reduce((a, l) => a + l.preco, 0);
  const totalIva = linhasIva.reduce((a, l) => a + l.iva, 0);

  // «O banco» — o plano do motor; a miniatura mostra os extremos
  // reais (1.ª e última prestação), nunca valores interpolados
  const prest: PortaPrestacao | null =
    prestacao.euribor === null
      ? null
      : (() => {
          const r = simularPrestacao(
            prestacao.capital,
            prestacao.meses,
            (prestacao.euribor as number) / 100,
            prestacao.spread / 100
          );
          return {
            valor: r.prestacao,
            capital: prestacao.capital,
            meses: prestacao.meses,
            tan: r.tan * 100,
            primeiro: r.linhas[0],
            ultimo: r.linhas[r.linhas.length - 1],
          };
        })();

  // «O país» — os estados reais do painel sobre as seis leituras
  // escolhidas; série desconhecida cai honestamente em «sem SLA»
  const orbes = s.pais.orbes.map((o) => {
    const estado = estados[o.id] ?? "sem-sla";
    return { ...o, estado, estadoRotulo: s.pais.estados[estado] };
  });

  const cartoes: {
    href: string;
    icone: NomeIcone;
    pergunta: string;
    crumb: string;
    frase: string;
    previa: ReactNode;
  }[] = [
    {
      href: "/salario",
      icone: "salario",
      pergunta: m.nav.grupoGanhas,
      crumb: [m.nav.salario, m.nav.irs, m.nav.trabalho].join(" · "),
      frase: t(s.ganhas.frase, {
        bruto: fmtEUR0(recibo.bruto),
        liquido: fmtEUR(recibo.liquido),
      }),
      previa: <PreviewRecibo d={recibo} s={s.ganhas.recibo} />,
    },
    {
      href: "/impostos",
      icone: "impostos",
      pergunta: m.nav.grupoPagas,
      crumb: [m.nav.impostos, m.nav.precos, m.nav.inflacao].join(" · "),
      frase: t(s.pagas.frase, {
        total: fmtEUR(total),
        iva: fmtEUR(totalIva),
      }),
      previa: (
        <PreviewIva
          linhas={linhasIva}
          total={total}
          totalIva={totalIva}
          s={s.pagas.talao}
        />
      ),
    },
    {
      href: "/credito",
      icone: "credito",
      pergunta: m.nav.grupoBanco,
      crumb: [m.nav.credito, m.nav.casa, m.nav.poupanca].join(" · "),
      frase: prest
        ? t(s.banco.frase, {
            pesoJuro: fmtPct(prest.primeiro.juro / prest.valor, 0),
          })
        : s.banco.fraseSemSerie,
      previa: <PreviewBanco d={prest} s={s.banco} />,
    },
    {
      href: "/dados",
      icone: "dados",
      pergunta: m.nav.grupoPais,
      crumb: m.nav.dados,
      frase: t(s.pais.frase, { n: orbes.length }),
      previa: <PreviewOrbes series={orbes} />,
    },
  ];

  return (
    <section aria-labelledby="pq-titulo" className="stack-cap">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-ink pb-3">
        <h2
          id="pq-titulo"
          className="font-display text-display-sm tracking-manchete-xl md:text-display-md"
        >
          {s.titulo}
        </h2>
        <p className="num text-rotulo text-muted">{s.nota}</p>
      </div>
      <ul className="pq-grelha mt-6">
        {cartoes.map((c) => (
          <li key={c.href} className="pq-item">
            <Link href={c.href} className="pq-porta" aria-label={c.pergunta}>
              <span className="pq-topo">
                <IconeEmblema nome={c.icone} />
                <span className="pq-crumb">{c.crumb}</span>
              </span>
              <span className="pq-pergunta">{c.pergunta}</span>
              <span className="pq-frase">{c.frase}</span>
              {/* a mini-prévia é a figura do cartão — a frase acima é o
                  seu equivalente textual com os números-chave */}
              <div className="pq-previa" aria-hidden="true">
                {c.previa}
              </div>
              <span className="pq-pe">
                <span className="pq-rota">{c.href}</span>
                <span className="pq-ver">
                  {s.ver}
                  <Icone nome="ver" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
