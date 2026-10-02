import { dadosBairro, linhaSalario } from "@/lib/bairro/dados";
import { fmtEUR0 } from "@/lib/format";
import { ELENCO, pessoa } from "@/lib/bairro/personagens";
import { dadosCenas } from "./cenas/dados";
import { temCena } from "./cenas/com-cena";
import { pinosDaCamera } from "@/lib/bairro/mundo";
import { Pcom } from "@/lib/bairro/iso";
import {
  ENQUADRAMENTOS,
  GAIVOTAS,
  PONTOS_ANIMACAO,
  PontosDeEcran,
  TERRENO,
} from "@/lib/bairro/planta";
import { m, t } from "@/lib/messages";
import { SITE_URL } from "@/lib/site";
import { Bairro, type Hora, type InfoEdificio } from "./Bairro";
import { Cartas, type CartaDados } from "./Cartas";

/**
 * A home do bairro (P1-1). O SERVIDOR monta tudo:
 *
 *   1. `dadosBairro()` lê `data/` e formata os números (Regra nº1);
 *   2. `planta.ts` desenha o bairro com esses números nos marcadores;
 *   3. `mundo.ts` embrulha isso nas camadas, com o céu e as peças soltas;
 *   4. `page.tsx` entrega o HTML ao `<Bairro>`, que só vai ligar a câmara.
 *
 * É esta ordem que faz o mapa e os números chegarem ao utilizador sem
 * uma linha de JavaScript. Nenhum componente de cliente vê `data/` nem
 * `messages/pt.json`: os dados chegam por props, como a casa manda.
 */
export default function HomeBairro() {
  const d = dadosBairro();
  // os dados das cenas montam-se no servidor e viajam numa prop — os
  // JSON de data/ nunca chegam ao cliente (AGENTS.md), as séries viajam
  // compactas (o cliente reconstrói os meses)
  const cenas = dadosCenas();
  const Pt = Pcom(TERRENO);

  
  // os dois pontos de enquadramento vêm da planta, calculados aqui (o
  // cliente não pode importar a planta — arrastaria o desenho inteiro)
  const [px, py] = ENQUADRAMENTOS.perto;
  const { x: lx, y: ly } = ENQUADRAMENTOS.longe;

  // as três gaivotas: centro, raio em x, raio em y e o período da volta.
  // Vêm prontas como números pelo mesmo motivo do enquadramento — o
  // cliente anima as órbitas mas não sabe onde fica o rio.
  const gaivotas = GAIVOTAS.map(([i, j, rx, ry, dur]) => [Pt(i, j), rx, ry, dur] as const);
  const pontos = PontosDeEcran();

  // a hora do dia com que o mapa nasce. No build é sempre a do servidor —
  // uma página estática não sabe a hora de quem a abre. Por isso o
  // primeiro efeito do `<Bairro>` (P1-2) passa a hora a que for quando a
  // página carrega no browser; ver `horaDoServidor()`.
  const horaInicial = horaDoServidor();

  const edificios: InfoEdificio[] = Object.entries(m.bairro.edificios).map(
    ([id, info]) => ({
      id,
      titulo: info.titulo,
      pergunta: info.pergunta,
      // P2a: quatro cenas são vivas — Fábrica, Finanças, Banco, Mercearia
      viva: temCena(id),
      extra: extraDe(id, d.marcadores),
      fonte: "",
    })
  );

  // as sete cartas do elenco (P1-4) — montadas AQUI, no servidor: as
  // figuras são `pessoa(ELENCO[·])`, as mesmas que o mapa desenha, e os
  // números saem de data/derived via linhaSalario() já formatados —
  // o «1 500 € brutos viram 1 167 €» da Inês nunca se escreve à mão
  const cartas = cartasDoElenco(linhaSalario());

  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AO CÊNTIMO",
    url: SITE_URL,
    inLanguage: "pt-PT",
    description:
      "Literacia financeira para Portugal — cada edifício do bairro responde a uma pergunta sobre dinheiro, com os números de hoje, cada um com fonte e data.",
  };

  return (
    <div data-pele="v5" className="b5 mx-auto max-w-[1240px] px-5">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />

      {/* O logótipo e a navegação NÃO são repetidos aqui: o cabeçalho do
          site (layout.tsx) já os traz, com o tema e a data de edição. O
          protótipo tinha-os no seu cabeçalho porque era uma página
          sozinha; aqui seriam dois logótipos na mesma tela. A distinção
          está anotada em docs/NOTAS-V5.md. */}
      <header className="b-cab">
        <span className="b-independente">
          <b>{m.bairro.selo.independente1}</b> {m.bairro.selo.independente2}
        </span>
      </header>

      <div className="b-intro">
        <h1>
          {m.bairro.h1a} <span>{m.bairro.h1b}</span>
        </h1>
        <p>{m.bairro.intro}</p>
      </div>

      <Bairro
        marcadores={d.marcadores}
        cenas={cenas}
        edificios={edificios}
        entrada={{ entrar: m.bairro.cartao.entrar, breve: m.bairro.cartao.breve }}
        horas={[m.bairro.hora.dia, m.bairro.hora.tarde, m.bairro.hora.noite]}
        zoom={{
          mais: m.bairro.zoom.mais,
          menos: m.bairro.zoom.menos,
          tudo: m.bairro.zoom.tudo,
        }}
        dica={
          <>
            {m.bairro.dica.arrasta} <em>{m.bairro.dica.fabrica}</em>
          </>
        }
        descricao={m.bairro.mapa.descricao}
        rotuloHora={m.bairro.mapa.rotuloHora}
        enquadramentos={{ perto: [px, py], longe: [lx, ly] }}
        pinos={pinosDaCamera(d.mapa)}
        coordenadas={PONTOS_ANIMACAO}
        pontos={pontos}
        gaivotas={gaivotas}
        horaInicial={horaInicial}
      />

      <main id="conteudo-bairro">
        <section className="b-elenco" aria-labelledby="tElenco">
          <span className="b-etiqueta">{m.bairro.elenco.etiqueta}</span>
          <h2 id="tElenco">{m.bairro.elenco.h2}</h2>
          <p className="b-lead">{m.bairro.elenco.lead}</p>
          <Cartas cartas={cartas} />
        </section>
        <p className="b-notas">
          <b>{m.bairro.elenco.notas}</b> {d.fontes.join(" · ")}
        </p>
      </main>
    </div>
  );
}

/**
 * A hora do dia, no servidor: noite antes das 7 e depois das 20, fim de
 * tarde das 18 às 20, dia o resto. Mesma regra do protótipo.
 */
export function horaDoServidor(h: number = new Date().getHours()): Hora {
  if (h >= 20 || h < 7) return "noite";
  return h >= 18 ? "tarde" : "dia";
}

/**
 * A linha extra de cada edifício — o número de hoje, escrito pelo
 * servidor a partir de `data/`. Onde não há número, não há linha: melhor
 * uma frase a menos do que uma frase que inventa.
 */
function extraDe(
  id: string,
  mc: ReturnType<typeof dadosBairro>["marcadores"]
): string | undefined {
  const modelo = m.bairro.extra[id as keyof typeof m.bairro.extra];
  if (!modelo) return undefined;
  return t(modelo, {
    gasoleo: mc.gasoleoUn,
    gasolina: mc.gasolinaUn,
    euribor: mc.euribor,
    ca: mc.ca,
    inflacao: mc.inflacao,
    desemprego: mc.desemprego,
  });
}

/* ————————————————————— as sete cartas (P1-4) ————————————————————— */

/** A ordem e as cores do `CARTAS` do mapa.tpl.html — iguais às do
    protótipo, que é o contrato visual. */
const ORDEM_CARTAS = [
  "ines",
  "diana",
  "pedro",
  "manuel",
  "arminda",
  "goncalo",
  "rui",
] as const;
type ChaveCarta = (typeof ORDEM_CARTAS)[number];
const CORES_CARTAS: Record<ChaveCarta, string> = {
  ines: "#dfe5ff",
  diana: "#fff1c2",
  pedro: "#ffe1d9",
  manuel: "#d3f2e3",
  arminda: "#ffe1e6",
  goncalo: "#fff1c2",
  rui: "#dfe5ff",
};

/**
 * Monta as sete cartas no servidor: a figura é `pessoa(ELENCO[·])` — a
 * mesma que o mapa desenha, e a do casal junta o Rui e a Marta, como no
 * protótipo. O número da Inês vem de `linhaSalario()` (data/derived,
 * via fmtEUR0): se a linha faltar sai «—», nunca um número escrito à
 * mão. A fala do painel sai daqui já em HTML, com o realce do «Em
 * breve» — é texto de pt.json, seguro para dangerouslySetInnerHTML.
 */
function cartasDoElenco(ref: ReturnType<typeof linhaSalario>): CartaDados[] {
  const el = m.bairro.elenco;
  return ORDEM_CARTAS.map((k) => {
    const c = el.cartas[k];
    const aprende = t(c.aprende, {
      bruto: fmtEUR0(ref?.bruto ?? NaN),
      liquido: fmtEUR0(ref?.liquido ?? NaN),
    });
    const figura =
      k === "rui"
        ? `<g transform="translate(-18 0)">${pessoa(ELENCO.rui)}</g><g transform="translate(20 0)">${pessoa(ELENCO.marta)}</g>`
        : pessoa(ELENCO[k]);
    return {
      chave: k,
      nome: c.nome,
      papel: c.papel,
      acessivel: `${c.nome}, ${c.papel[0].toLowerCase()}${c.papel.slice(1)}`,
      perfil: c.perfil,
      aprende,
      cor: CORES_CARTAS[k],
      viewBox: k === "rui" ? "-60 -142 120 150" : "-42 -142 84 150",
      figura,
      painel: {
        chave: k,
        quem: `${c.nome} · ${c.papel}`,
        fala: `${t(el.ola, { quem: c.ola })} ${aprende} <span class="b-a">${el.emBreve}</span> ${el.segueDinheiro}`,
        extra: c.perfil,
        fechar: m.bairro.breve.fechar,
      },
    };
  });
}
