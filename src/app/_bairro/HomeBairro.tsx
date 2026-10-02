import { dadosBairro } from "@/lib/bairro/dados";
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
  // os dados das cenas já NÃO viajam na prop: são ficheiros estáticos
  // public/cenas/<id>.json escritos no derive pela mesma dadosCenas(),
  // e o browser só os pede ao entrar no edifício (P4 — dieta do payload)
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
          {/* as sete cartas entram em P1-4 */}
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
