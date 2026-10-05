"use client";

/**
 * `<Bairro>` — o mapa vivo (P1-1 do PACK V5 PRODUÇÃO, §2.2).
 *
 * Este componente NÃO desenha o mapa. O SVG é montado no servidor
 * (`mundoBairro()`, em `src/lib/bairro/mundo.ts`) e chega aqui como a
 * prop `html`, entrando por `dangerouslySetInnerHTML` — sem JavaScript
 * vê-se o bairro inteiro e os números de hoje, que é o que o pack exige.
 *
 * É SEGURO porque não há texto de utilizador em lado nenhum: o SVG vem
 * do código (`iso.ts`, `planta.ts`) e os números de `data/`, já
 * formatados pelo servidor. O teste `mundo.test.ts` vigia a promessa.
 *
 * O que este componente liga, POR ESTA ORDEM (é a ordem do protótipo, e
 * a ordem em que se nota):
 *
 *   1. a câmara — arrastar, roda, pinça, os três botões de zoom;
 *   2. o cartão ao passar num edifício (e ao focá-lo pelo teclado);
 *   3. a hora do dia — dia, fim de tarde, noite: o céu, o sol, as
 *      estrelas e as janelas acesas;
 *   4. os marcadores a tamanho constante, sem se sobreporem;
 *   5. a animação ambiente — e só esta. Entra em P1-2.
 *
 * A cena de cada edifício entra em P1-3; aqui, em P1-1, o mapa já está,
 * com os números, a passar-se e a deixar-se passear.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PausaAmbiente } from "@/components/PausaAmbiente";
import { motionActiva, carregarGsap, type MotorGsap } from "@/lib/motion/gsap";
import { EVT_PERSONAGEM, type EscolhaPersonagem } from "./personagem";
import { drenarEscolhas, janela } from "./ponte-cartas";
import { Camera, arrumarPinos, type Enquadramentos, type MarcadorVivo, type PinoPlanta } from "./camara";
import { ligarAmbiente } from "./ambiente";
import { mundoBairro, reflexos } from "@/lib/bairro/mundo";
import { montarMapa, type MarcadoresBairro } from "@/lib/bairro/planta";
import { CENAS } from "./cenas/registry";
import { temCena } from "./cenas/com-cena";
import {
  cancelarEspeculativo,
  pedirCena,
  prefetearCena,
  prefetearEmOciosidade,
} from "./cenas/prefetch";
import type { CenasDados } from "./cenas/dados";
import CenaDePerto from "./cenas/CenaDePerto";
import { aCarregar, falhaAoCarregar } from "./cenas/textos";
import "./bairro.css";

/** As três horas do dia. */
export type Hora = "dia" | "tarde" | "noite";

/** Um edifício, do ponto de vista de quem o quer abrir. */
export interface InfoEdificio {
  id: string;
  titulo: string;
  pergunta: string;
  /** `true` quando a cena existe; `false` quando o cartão diz «em breve». */
  viva: boolean;
  /** Uma linha extra com o número de hoje, já formatado pelo servidor. */
  extra?: string;
  /** A fonte desse número. */
  fonte?: string;
}

export interface PropsBairro {
  /**
   * Os números de hoje, JÁ FORMATADOS pelo servidor (`dadosBairro()`):
   * é tudo o que este componente precisa para montar o mapa. O desenho
   * em si é calculado AQUI — antes o html vinha pronto por prop e o
   * Next embarcava-o no payload de hidratação: o mapa inteiro viajava
   * duas vezes (DOM + flight), ~53 KB gzip à toa. Os builders são
   * determinísticos (zero `Math.random`/`Date`), por isso o servidor e
   * o browser chegam à mesma string sem mismatch.
   *
   * Este componente continua a NÃO importar `data/*.json` nem
   * `messages/pt.json`: o texto formatado chega por prop, como a casa
   * manda. E no SSR (build estático) é o SERVIDOR que o corre — o mapa
   * segue no HTML sem JavaScript.
   */
  marcadores: MarcadoresBairro;
  /** Os edifícios, com o texto de cada um (PROPOSTA, ver NOTAS-V5.md). */
  edificios: readonly InfoEdificio[];
  /** O que o cartão escreve à última linha. */
  entrada: { entrar: string; breve: string };
  /** Rótulos dos três botões da hora do dia. */
  horas: readonly [string, string, string];
  /** Rótulos dos controlos de zoom. */
  zoom: { mais: string; menos: string; tudo: string };
  /** A dica que fica em baixo do mapa. */
  dica: React.ReactNode;
  /** A descrição do mapa para leitores de ecrã. */
  descricao: string;
  /** Rótulo do grupo dos botões da hora do dia. */
  rotuloHora: string;
  /** Onde a câmara enquadra ao arrancar: perto da fábrica, ou o bairro todo. */
  enquadramentos: Enquadramentos;
  /**
   * Os marcadores como a câmara os quer (âncora + largura da placa, em
   * unidades do mundo): o enquadramento inicial MEDe estas caixas em vez
   * de partir de constantes — foi assim que o pin da Segurança Social
   * nasceu cortado pelo topo. Vêm do servidor (`pinosDaCamera`), que é
   * quem sabe onde os edifícios estão.
   */
  pinos: readonly PinoPlanta[];
  /**
   * `P(i, j, z)` da planta em coordenadas de ecrã, por TABELA e não por
   * função: uma função de servidor não pode atravessar a fronteira para
   * um componente de cliente (o Next recusa o build), e o cliente também
   * não pode importar `planta.ts` — arrastaria o desenho inteiro para o
   * browser por causa de duas coordenadas.
   *
   * É uma lista de triplos `[i, j, z]`; o ponto correspondente está na
   * mesma posição da prop `pontos`.
   */
  coordenadas: readonly (readonly [number, number, number])[];
  /** Os pontos de ecrã correspondentes, na mesma ordem de `coordenadas`. */
  pontos: readonly (readonly [number, number])[];
  /** As três gaivotas: centro, raio em x, raio em y e período. */
  gaivotas: readonly (readonly [readonly [number, number], number, number, number])[];
  /**
   * A hora do dia com que o mapa nasce, já escolhida pelo servidor.
   * Derivá-la num `useEffect` seria tarde: o HTML chegaria com o céu do
   * dia e só depois mudaria para o da noite — um salto visível, e uma
   * hidratação que não bate certo com o servidor.
   */
  horaInicial: Hora;
  /**
   * Os dados das cenas NÃO viajam aqui (P4 — a dieta do payload): cada
   * uma é um ficheiro estático `/cenas/<id>.json`, gerado no derive pela
   * mesma `dadosCenas()` do servidor, e o `<CenaViva>` pede-o só quando
   * se entra no edifício. Quem nunca abre uma cena nunca paga o peso.
   */
  /** As cenas (P2+) e o painel «em breve». */
  children?: React.ReactNode;
  /** Chamado quando um edifício é escolhido. */
  aoEntrar?: (id: string) => void;
}

/** A classe de hora que o palco recebe. */
const CLASSE_HORA: Record<Hora, string> = {
  dia: "",
  tarde: "b-fim-tarde",
  noite: "b-noite",
};

export function Bairro({
  marcadores,
  edificios,
  entrada,
  horas,
  zoom,
  dica,
  descricao,
  rotuloHora,
  enquadramentos,
  pinos,
  horaInicial,
  coordenadas,
  pontos,
  gaivotas,
  children,
  aoEntrar,
}: PropsBairro) {
  const janelaRef = useRef<HTMLDivElement>(null);
  const mundoRef = useRef<HTMLDivElement>(null);
  const palcoRef = useRef<HTMLElement>(null);
  const camaraRef = useRef<Camera | null>(null);
  const cartaoRef = useRef<HTMLDivElement>(null);

  const [hora, setHora] = useState<Hora>(horaInicial);
  const [cartaoAberto, setCartaoAberto] = useState<string | null>(null);
  /** A cena aberta (P2a): o id do edifício, ou `null`. */
  const [cenaAberta, setCenaAberta] = useState<string | null>(null);
  /** A carta escolhida no elenco (P1-4), ou `null`. */
  const [personagem, setPersonagem] = useState<EscolhaPersonagem | null>(null);

  // O mapa calcula-se aqui (e no servidor, no SSR do build). A mesma
  // entrada dá sempre a mesma saída — os builders não têm relógio nem
  // dados nem aleatório — por isso o HTML do servidor e a hidratação
  // batem certo. `montarMapa` + `mundoBairro` já eram o caminho do
  // servidor; a fronteira é que os cortava em dois.
  // o mapa calcula-se UMA vez: montarMapa alimenta o mundo e o reflexo
  // (a nit da revisão do #27 — a mesma conta não corre duas vezes)
  const mapa = useMemo(() => montarMapa(marcadores), [marcadores]);
  const { html, css } = useMemo(() => mundoBairro(mapa), [mapa]);
  const reflexo = useMemo(() => reflexos(mapa), [mapa]);



  // o mapa é grande; não vale a pena refazer a tabela a cada render
  const porId = useMemo(() => new Map(edificios.map((e) => [e.id, e])), [edificios]);

  /* ————— a câmara ————— */
  useEffect(() => {
    const janela = janelaRef.current;
    const mundo = mundoRef.current;
    if (!janela || !mundo) return;

    const camara = new Camera(janela, mundo, {
      // os marcadores acompanham a escala: sem isto, a afastar ficavam
      // ilegíveis e a aproximar tapavam o edifício
      aoMudar: () => {
        const gs = mundo.querySelectorAll<SVGGElement>(".pin");
        if (gs.length === 0) return;
        const pinos: MarcadorVivo[] = [...gs].map((g) => ({
          g,
          x: Number(g.dataset.x ?? 0),
          y: Number(g.dataset.y ?? 0),
          w: Number(g.dataset.w ?? 0),
          guia: g.querySelector<SVGPathElement>(".guia"),
        }));
        arrumarPinos(janela, pinos);
      },
    });
    camara.defEnquadrar(enquadramentos);
    camara.defPinos([...pinos]);
    camaraRef.current = camara;
    const desligar = camara.ligar();
    // o sinal para os e2e: o mapa está VIVO (ouvintes ligados) — o e2e
    // que carrega Enter num edifício espera por este atributo, em vez de
    // apostar no timing da hidratação
    mundo.dataset.vivo = "1";

    // o reflexo no Douro só pode entrar depois das camadas existirem:
    // precisa do clipPath e da máscara, que vivem no cenário
    const alvo = mundo.querySelector("#reflexos");
    if (alvo) alvo.innerHTML = reflexo;

    return () => {
      desligar();
      camaraRef.current = null;
    };
  }, [reflexo, enquadramentos, pinos]);

  /* ————— a animação ambiente (P1-2) ————— */
  useEffect(() => {
    const mundo = mundoRef.current;
    if (!mundo) return;

    // `ligarAmbiente` é assíncrono (pede o GSAP por dynamic import) e pode
    // desistir a meio — o separador pode ter fechado, o componente pode
    // ter desmontado. A-bandeira garante que a limpeza não corre sobre um
    // mundo que já não é este.
    let vivo = true;
    let limpar: (() => void) | undefined;

    ligarAmbiente(mundo, { coordenadas, pontos, gaivotas }).then((f) => {
      if (vivo) limpar = f;
      else f();
    });

    return () => {
      vivo = false;
      limpar?.();
    };
  }, [coordenadas, pontos, gaivotas]);

  /* ————— o cartão segue o edifício ————— */
  const posCartao = useCallback((alvo: Element | null) => {
    const cartao = cartaoRef.current;
    const palco = palcoRef.current;
    if (!cartao || !palco || !alvo) return;
    const r = alvo.getBoundingClientRect();
    const rp = palco.getBoundingClientRect();
    cartao.style.left = `${r.left + r.width / 2 - rp.left}px`;
    cartao.style.top = `${Math.max(110, r.top - rp.top)}px`;
  }, []);

  const mostrarCartao = useCallback(
    (id: string) => {
      setCartaoAberto(id);
      posCartao(mundoRef.current?.querySelector(`.ed[data-id="${id}"]`) ?? null);
      // o marcador do edifício acende com o cartão
      for (const p of mundoRef.current?.querySelectorAll(".pin") ?? []) {
        p.classList.toggle("on", p.getAttribute("data-id") === id);
      }
    },
    [posCartao]
  );

  const esconderCartao = useCallback(() => {
    setCartaoAberto(null);
    for (const p of mundoRef.current?.querySelectorAll(".pin") ?? []) {
      p.classList.remove("on");
    }
  }, []);

  const entrar = useCallback(
    (id: string) => {
      // um arrasto de câmara não é um clique: sem esta guarda, o mapa
      // abria um edifício sempre que se passeava o dedo
      if (camaraRef.current?.foiArrasto) return;
      esconderCartao();
      const mundo = mundoRef.current;
      const g = mundo?.querySelector(`.ed[data-id="${id}"]`) ?? null;
      if (mundo) {
        for (const outro of mundo.querySelectorAll(".ed")) {
          outro.classList.toggle("b-ativo", outro === g);
        }
      }
      // P2a: quem tem cena abre-a; o resto continua no cartão «em breve»
      if (temCena(id)) {
        setCenaAberta(id);
        // o URL conta onde se está: abrir link abre a cena, Voltar fecha
        try {
          history.pushState(null, "", `#${id}`);
        } catch {
          /* em file:// ou sandbox, a cena abre na mesma */
        }
      }
      aoEntrar?.(id);
    },
    [aoEntrar, esconderCartao]
  );

  const fecharCena = useCallback(() => {
    setCenaAberta(null);
    // devolve o foco ao edifício que abriu a cena (PACK §2.3) — no frame
    // seguinte, depois do React desmontar a cena: focar antes podia ser
    // anulado quando o nó com foco saía do DOM na mesma batida
    const g = mundoRef.current?.querySelector(`.ed[data-id="${cenaAberta}"]`);
    requestAnimationFrame(() => (g as HTMLElement | null)?.focus?.());
    try {
      const url = new URL(window.location.href);
      url.hash = "";
      history.replaceState(null, "", url.pathname + url.search);
    } catch {
      /* sem history, a cena fecha na mesma */
    }
  }, [cenaAberta]);

  /* o Voltar do browser fecha a cena — a âncora é o estado do URL */
  useEffect(() => {
    if (!cenaAberta) return;
    const aoVoltar = () => setCenaAberta(null);
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, [cenaAberta]);

  /*
   * A âncora é o estado do URL (PACK §2.3): abre no load E em qualquer
   * `hashchange` — um link dentro da página para /#banco abre a cena
   * sem recarregar. O fechar (replaceState) e o entrar (pushState) não
   * disparam `hashchange`, por isso não há eco.
   *
   * O `prefetearCena()` vem ANTES do `setCenaAberta()`: o JSON passa a
   * voar enquanto o chunk da cena ainda vai a caminho, em vez de esperar
   * que o React monte a cena para só depois ir buscar os dados. (O módulo
   * `prefetch` já tratou desta âncora no arranque do browser; aqui
   * fica o `hashchange` e a garantia para quem chega por outro caminho.)
   */
  useEffect(() => {
    const ler = () => {
      const id = window.location.hash.replace("#", "");
      if (id && temCena(id)) {
        prefetearCena(id);
        setCenaAberta(id);
      }
    };
    ler();
    window.addEventListener("hashchange", ler);
    return () => window.removeEventListener("hashchange", ler);
  }, []);

  /*
   * O prefetch em intenção: ao pairar, ao focar pelo teclado ou ao
   * tocar num edifício, o JSON e o chunk desse edifício já vão a
   * caminho. Custa zero ao utilizador que nunca pairar — e à primeira
   * intenção de verdade a fila de ociosidade sai (o que interessa é o
   * edifício que se está a mirar, não aquele que estava à vista).
   */
  const pretender = useCallback((id: string) => {
    // o que interessa é o edifício que se está a mirar: a fila de
    // ociosidade sai, e o que dela estiver a meio de voar também — mas
    // NÃO o pedido deste mesmo edifício, que já nos serve
    cancelarEspeculativo(id);
    prefetearCena(id);
  }, []);

  useEdificios(mundoRef, porId, entrar, mostrarCartao, esconderCartao, pretender);

  /*
   * E, se ninguém fizer nada, os edifícios QUE ESTÃO À VISTA entram um
   * a um quando a página fica ociosa — nunca os onze de uma vez, e
   * nunca antes do `load` mais alguns segundos (a regra do #38: a home
   * em repouso não pede nada a nenhuma cena).
   */
  useEffect(() => {
    const janelaEl = janelaRef.current;
    const mundo = mundoRef.current;
    if (!janelaEl || !mundo) return;
    let vivo = true;

    const medir = () => {
      if (!vivo) return;
      const r = janelaEl.getBoundingClientRect();
      // o edifício mais «à vista» primeiro: quantos pixels seus caem
      // dentro da janela do mapa
      const visiveis = [...mundo.querySelectorAll<SVGGElement>(".ed")]
        .map((g) => {
          const b = g.getBoundingClientRect();
          const dx = Math.max(0, Math.min(b.right, r.right) - Math.max(b.left, r.left));
          const dy = Math.max(0, Math.min(b.bottom, r.bottom) - Math.max(b.top, r.top));
          return { id: g.getAttribute("data-id"), dentro: dx * dy };
        })
        .filter((e) => e.id && e.dentro > 0)
        .sort((a, b) => b.dentro - a.dentro)
        .map((e) => e.id as string);
      prefetearEmOciosidade(visiveis);
    };

    const quandoIdle = () => {
      if (!vivo) return;
      const ric = (
        window as unknown as {
          requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
        }
      ).requestIdleCallback;
      if (ric) ric(medir, { timeout: 4000 });
      else window.setTimeout(medir, 4000);
    };

    // só depois do load: o `requestIdleCallback` sem espera encontra
    // folga no meio do arranque e dispararia o prefetch cedo demais
    if (document.readyState === "complete") window.setTimeout(quandoIdle, 4000);
    else window.addEventListener("load", () => window.setTimeout(quandoIdle, 4000), { once: true });
    return () => {
      vivo = false;
      cancelarEspeculativo();
    };
  }, []);

  /* ————— as cartas: «Escolhe a tua personagem» (P1-4) —————
     A secção vive fora do palco, no <main> do servidor — não pode
     passar funções a este componente. A ponte é um CustomEvent na
     janela: a carta anuncia, o bairro faz o resto. */

  /**
   * A câmara vai ao centro da caixa do `[data-pessoa]` — o contrato com
   * a sessão «gente no mapa». Se a figura ainda não existir (a gente
   * pode ainda não ter fundido), o clique fica-se pelo scroll e pelo
   * painel: nunca falha.
   */
  const voarParaPersonagem = useCallback(async (chave: string) => {
    const mundo = mundoRef.current;
    const camara = camaraRef.current;
    if (!mundo || !camara) return;

    // o deslize só existe com movimento activo; em reduced-motion o
    // GSAP nem é pedido — ir() salta para a vista final, que é o estado
    // certo para quem pede menos movimento
    let gsap: MotorGsap["gsap"] | null = null;
    if (motionActiva()) {
      try {
        ({ gsap } = await carregarGsap());
      } catch {
        /* sem rede, salta na mesma */
      }
      if (!mundoRef.current) return;
      camara.ligarGsap(gsap);
    }

    const alvo = mundo.querySelector(`[data-pessoa="${chave}"]`);
    if (!(alvo instanceof SVGGraphicsElement)) return;

    try {
      const janela = janelaRef.current;
      if (!janela) return;
      // o painel da personagem pode ainda não estar pintado (o estado
      // React só entra no DOM no frame seguinte, e em reduced-motion
      // não houve await de GSAP que deixasse o React correr) — mede-se
      // depois de um frame
      if (!palcoRef.current?.querySelector(".b-painel")) {
        await new Promise<void>((res) => requestAnimationFrame(() => res()));
        if (!mundoRef.current) return;
      }

      // o centro da figura em unidades do MUNDO, recuperado do ecrã:
      // a vista actual diz que faixa do mundo a janela mostra e o rect
      // da figura diz onde ela está em px — getCTM não serve, devolve
      // px do viewport da camada SVG, não unidades do mundo
      const jr = janela.getBoundingClientRect();
      const fr = alvo.getBoundingClientRect();
      const vista = camara.atual;
      if (jr.width <= 0 || vista.w <= 0) return;
      const sCur = jr.width / vista.w;
      const ecx = vista.x + (fr.left + fr.width / 2 - jr.left) / sCur;
      const ecy = vista.y + (fr.top + fr.height / 2 - jr.top) / sCur;

      // a figura pousa na faixa que o painel não tapa — a conta da
      // Fábrica: no telemóvel o painel fica em cima e o alvo desce; no
      // desktop fica à esquerda e o alvo vai para a faixa da direita
      const FOLGA = 14;
      const w = 560;
      const razao = jr.height / jr.width;
      const s = jr.width / w;
      const pr = palcoRef.current
        ?.querySelector(".b-painel")
        ?.getBoundingClientRect();
      let cx = ecx;
      let cy = ecy;
      if (pr && jr.width <= 700) {
        const topo = pr.bottom - jr.top + FOLGA;
        const livre = Math.max(80, jr.height - topo - FOLGA);
        cy = ecy - (topo + livre / 2) / s + (w * razao) / 2;
      } else if (pr) {
        const livreE = pr.right - jr.left + FOLGA;
        const livreW = Math.max(200, jr.width - livreE - FOLGA);
        cx = ecx + w / 2 - (livreE + livreW / 2) / s;
      } else if (jr.width > 700) {
        cx = ecx + (560 * 0.2) / s;
      }
      camara.ir(cx, cy, w, 1.1);
      // o aceno quando a câmara lá chega — só com GSAP; sem ele o
      // estado final já está parado e certo
      if (gsap) {
        const marta =
          chave === "rui"
            ? mundo.querySelector('[data-pessoa="marta"]')
            : null;
        window.setTimeout(() => {
          acenar(gsap, alvo);
          if (marta instanceof SVGGraphicsElement) acenar(gsap, marta);
        }, 900);
      }
    } catch {
      /* getBBox falha em figuras escondidas — o painel já abriu */
    }
  }, []);

  useEffect(() => {
    const aplicar = (d: EscolhaPersonagem) => {
      if (!d?.chave) return;
      esconderCartao();
      // se uma cena estava aberta, o painel da personagem substitui-a —
      // e a âncora sai do URL, como no fechar normal
      if (cenaAberta) {
        setCenaAberta(null);
        try {
          const url = new URL(window.location.href);
          url.hash = "";
          history.replaceState(null, "", url.pathname + url.search);
        } catch {
          /* sem history, a cena fecha na mesma */
        }
      }
      setPersonagem(d);
      palcoRef.current?.scrollIntoView({
        block: "start",
        behavior: motionActiva() ? "smooth" : "auto",
      });
      void voarParaPersonagem(d.chave);
    };
    const aoEscolher = (e: Event) =>
      aplicar((e as CustomEvent<EscolhaPersonagem>).detail);
    window.addEventListener(EVT_PERSONAGEM, aoEscolher);
    // uma carta pode ter sido tocada ANTES de este efeito correr — o
    // toque vai ao vazio se não a servirmos aqui (medido a 40× de CPU)
    drenarEscolhas(aplicar, janela());
    return () => window.removeEventListener(EVT_PERSONAGEM, aoEscolher);
  }, [cenaAberta, esconderCartao, voarParaPersonagem]);

  const fecharPersonagem = useCallback(() => {
    if (!personagem) return;
    setPersonagem(null);
    // devolve o foco à carta que abriu o painel
    document
      .querySelector<HTMLElement>(`.b-carta[data-k="${personagem.chave}"]`)
      ?.focus();
  }, [personagem]);

  const info = cartaoAberto ? (porId.get(cartaoAberto) ?? null) : null;

  return (
    <PausaAmbiente>
      <section ref={palcoRef} className={`b-palco ${CLASSE_HORA[hora]}`}>
        {/* As animações do elétrico/barcos/metro têm coordenadas
            calculadas (nascem com o mapa) — por isso o <style> vive aqui,
            dentro do componente que as calcula, e não no servidor. */}
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="b-janela" ref={janelaRef}>
          <div
            ref={mundoRef}
            className="b-mundo"
            role="img"
            aria-label={descricao}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        <div className="b-controlos" role="group" aria-label={rotuloHora}>
          {(["dia", "tarde", "noite"] as const).map((h, k) => (
            <button
              key={h}
              type="button"
              className="b-ctl"
              aria-pressed={hora === h}
              onClick={() => setHora(h)}
            >
              {horas[k]}
            </button>
          ))}
        </div>

        <div className="b-zoom" role="group" aria-label={zoom.tudo}>
          <button
            type="button"
            className="b-ctl"
            aria-label={zoom.mais}
            onClick={() => camaraRef.current?.zoom(1.4)}
          >
            +
          </button>
          <button
            type="button"
            className="b-ctl"
            aria-label={zoom.menos}
            onClick={() => camaraRef.current?.zoom(1 / 1.4)}
          >
            −
          </button>
          <button
            type="button"
            className="b-ctl"
            aria-label={zoom.tudo}
            onClick={() => camaraRef.current?.tudo()}
          >
            ⤢
          </button>
        </div>

        <p className="b-dica">{dica}</p>

        <div
          ref={cartaoRef}
          className={`b-cartao ${info ? "b-on" : ""}`}
          aria-hidden="true"
        >
          {info && (
            <>
              <b>{info.titulo}</b>
              <span>{info.pergunta}</span>
              <em>{info.viva ? entrada.entrar : entrada.breve}</em>
            </>
          )}
        </div>

        {children}

        {/* ————— o painel da personagem escolhida (P1-4) ————— */}
        {personagem && (
          <PainelPersonagem p={personagem} aoFechar={fecharPersonagem} />
        )}

        {/* ————— a cena do edifício aberto (P2a) —————
            O componente chega por `next/dynamic` (o chunk só descarrega
            ao entrar); a Fábrica recebe as refs porque anima o mapa. */}
        {cenaAberta && CENAS[cenaAberta] && (
          <CenaViva
            key={cenaAberta}
            id={cenaAberta}
            titulo={porId.get(cenaAberta)?.titulo ?? cenaAberta}
            mundoRef={mundoRef}
            camaraRef={camaraRef}
            aoFechar={fecharCena}
          />
        )}
      </section>
    </PausaAmbiente>
  );
}

/**
 * O despachante das cenas: vai buscar o json, escolhe o componente certo
 * e passa-lhe os dados. Enquanto o json não chega — ou se falhar — a
 * moldura abre na mesma, com o título do edifício, o Escape e o × a
 * funcionarem, e a falha honesta em vez de zeros (regra nº1).
 */
function CenaViva({
  id,
  titulo,
  mundoRef,
  camaraRef,
  aoFechar,
}: {
  id: string;
  titulo: string;
  mundoRef: React.RefObject<HTMLDivElement | null>;
  camaraRef: React.MutableRefObject<Camera | null>;
  aoFechar: () => void;
}) {
  const [dados, setDados] = useState<unknown>(null);
  const [falhou, setFalhou] = useState(false);

  // o `key={id}` no pai monta um CenaViva novo por cena — o estado nasce
  // sempre «a carregar», sem resets síncronos dentro do efeito
  useEffect(() => {
    let vivo = true;
    pedirCena(id).then(
      (v) => vivo && setDados(v),
      () => vivo && setFalhou(true)
    );
    return () => {
      vivo = false;
    };
  }, [id]);

  if (falhou || dados === null)
    return (
      <CenaDePerto quem={titulo} fonte="—" aoFechar={aoFechar} semDesenho>
        <p className="b-fala">{falhou ? falhaAoCarregar : aCarregar}</p>
      </CenaDePerto>
    );

  const Cena = CENAS[id];
  if (!Cena) return null;
  const D = dados as CenasDados[keyof CenasDados];
  // a câmara vai à cena pela REF (a regra `react-hooks/refs` proíbe ler
  // `.current` durante o render): a cena só a toca dentro dos efeitos
  if (id === "fabrica")
    return (
      <Cena
        D={D}
        mundoRef={mundoRef}
        camaraRef={camaraRef as unknown as React.MutableRefObject<{
          ir: (cx: number, cy: number, w: number, dur?: number, desvio?: number) => void;
          atual: { x: number; y: number; w: number; h: number };
        } | null>}
        aoFechar={aoFechar}
      />
    );
  return <Cena D={D} aoFechar={aoFechar} />;
}

/**
 * O painel «Olá! Sou …» (P1-4) — a mesma moldura `.b-painel` que as
 * cenas usam: título, fala, o perfil a negrito e o Fechar. Fecha por
 * Escape e pelo ×, e o foco volta à carta — tratado no `aoFechar`.
 */
function PainelPersonagem({
  p,
  aoFechar,
}: {
  p: EscolhaPersonagem;
  aoFechar: () => void;
}) {
  const quemRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    // preventScroll: o scroll até ao palco já corre (aoEscolher); o
    // scroll-para-o-foco do browser cancelava-o e o ecrã ficava a meio
    quemRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div className="b-painel" role="dialog" aria-labelledby="b-quem-personagem">
      <button
        type="button"
        className="b-fechar"
        aria-label={p.fechar}
        onClick={aoFechar}
      >
        ×
      </button>
      <span
        className="b-quem"
        id="b-quem-personagem"
        tabIndex={-1}
        ref={quemRef}
      >
        {p.quem}
      </span>
      {/* HTML do servidor — texto de messages/pt.json, nunca input do
          utilizador; o realce .b-a do «Em breve» já vem dentro */}
      <p className="b-fala" dangerouslySetInnerHTML={{ __html: p.fala }} />
      <p className="b-perfil">{p.extra}</p>
      <div className="b-acoes">
        <button type="button" className="b-btn b-claro" onClick={aoFechar}>
          {p.fechar}
        </button>
      </div>
    </div>
  );
}

/**
 * O aceno do protótipo (`acenar` no mapa.tpl.html): o braço direito
 * sobe, abana três vezes e volta. A carta do casal acena nos dois —
 * Rui e Marta são `.pessoa` separadas no mapa.
 */
function acenar(gsap: MotorGsap["gsap"], figura: SVGGraphicsElement): void {
  const braco = figura.querySelector(".braco-d");
  if (!braco) return;
  gsap
    .timeline()
    .to(braco, {
      rotation: -150,
      transformOrigin: "50% 0%",
      duration: 0.25,
    })
    .to(braco, { rotation: -120, duration: 0.15, yoyo: true, repeat: 3 })
    .to(braco, { rotation: 0, duration: 0.3 });
}

/* ————————————————————— os onze edifícios ————————————————————— */

/**
 * Os eventos dos onze edifícios chegam por DELEGAÇÃO, num contentor só:
 * um `pointerover`, um `focusin` e um `click` em vez de 33 ouvintes.
 *
 * A delegação também resolve um problema prático: os edifícios são
 * desenhados pelo servidor e o React nunca os «vê» — um `onClick` no
 * contentor é a única forma de os tornar interactivos sem os voltar a
 * desenhar como componentes. E o mapa tem milhares de nós: uma árvore de
 * React seria o oposto do que este mapa é.
 *
 * Os callbacks vão por `ref` para não religar os ouvintes a cada render —
 * são mudados muitas vezes por segundo enquanto o rato passeia o mapa.
 */
export function useEdificios(
  mundo: React.RefObject<HTMLDivElement | null>,
  porId: Map<string, InfoEdificio>,
  aoEntrar: (id: string) => void,
  aoMostrar: (id: string) => void,
  aoEsconder: () => void,
  aoPretender: (id: string) => void
): void {
  const mostrar = useRef(aoMostrar);
  const esconder = useRef(aoEsconder);
  const entrar = useRef(aoEntrar);
  const pretender = useRef(aoPretender);
  // os callbacks mudam muitas vezes por segundo enquanto o rato passeia o
  // mapa; escrever a ref num efeito (e não no render) é o que a regra
  // `react-hooks/refs` da casa pede — o valor chega ao ouvinte no
  //_effectivo_ do commit, e não durante a renderização
  useEffect(() => {
    mostrar.current = aoMostrar;
    esconder.current = aoEsconder;
    entrar.current = aoEntrar;
    pretender.current = aoPretender;
  });

  useEffect(() => {
    const raiz = mundo.current;
    if (!raiz) return;

    const edDe = (alvo: EventTarget | null): Element | null =>
      alvo instanceof Element ? alvo.closest<Element>(".ed") : null;
    const idDe = (g: Element | null): string | null => {
      const id = g?.getAttribute("data-id") ?? null;
      return id && porId.has(id) ? id : null;
    };

    const aoClicar = (e: Event) => {
      const id = idDe(edDe(e.target));
      if (id) {
        pretender.current(id);
        entrar.current(id);
      }
    };
    const aoPassar = (e: Event) => {
      const id = idDe(edDe(e.target));
      if (id) {
        // a intenção mais barata que há: o rato JÁ está no edifício
        mostrar.current(id);
        pretender.current(id);
      } else esconder.current();
    };
    // o toque vem antes do clique (e antes de qualquer `pointerover`
    //fiável num ecrã táctil): aquecer já aqui dá ao JSON e ao chunk a
    // distância do gesto
    const aoTocar = (e: Event) => {
      const id = idDe(edDe(e.target));
      if (id) pretender.current(id);
    };
    const aoSair = (e: Event) => {
      // só esconde quando o rato sai mesmo do edifício, não de um filho
      const g = edDe(e.target);
      const related = (e as PointerEvent).relatedTarget;
      if (g && related instanceof Node && g.contains(related)) return;
      esconder.current();
    };
    const aoFocar = (e: Event) => {
      const id = idDe(edDe(e.target));
      if (id) {
        mostrar.current(id);
        pretender.current(id);
      }
    };
    const aoPerderFoco = (e: Event) => {
      const related = (e as FocusEvent).relatedTarget;
      if (related instanceof Node && raiz.contains(related)) return;
      esconder.current();
    };
    const aoTeclar = (e: Event) => {
      const k = (e as KeyboardEvent).key;
      if (k !== "Enter" && k !== " ") return;
      const id = idDe(edDe(e.target));
      if (!id) return;
      e.preventDefault();
      entrar.current(id);
    };

    raiz.addEventListener("click", aoClicar);
    raiz.addEventListener("pointerover", aoPassar);
    raiz.addEventListener("pointerout", aoSair);
    raiz.addEventListener("focusin", aoFocar);
    raiz.addEventListener("focusout", aoPerderFoco);
    raiz.addEventListener("touchstart", aoTocar, { passive: true });
    raiz.addEventListener("keydown", aoTeclar);
    return () => {
      raiz.removeEventListener("click", aoClicar);
      raiz.removeEventListener("pointerover", aoPassar);
      raiz.removeEventListener("pointerout", aoSair);
      raiz.removeEventListener("focusin", aoFocar);
      raiz.removeEventListener("focusout", aoPerderFoco);
      raiz.removeEventListener("touchstart", aoTocar);
      raiz.removeEventListener("keydown", aoTeclar);
    };
  }, [mundo, porId]);
}
