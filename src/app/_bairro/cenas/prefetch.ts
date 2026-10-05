"use client";

/**
 * O prefetch das cenas — o que faz a cena abrir sooner sem que a home
 * carregue mais nada no arranque (PACK §2.3: o bundle inicial da home
 * não traz nenhuma cena, e a home em repouso não pede nada).
 *
 * A medição (docs/MEDICAO-V5.md, secção 2) mostrou que o tempo até à
 * cena NÃO depende do tamanho dos dados: o `/cenas/bomba.json` (8 KB)
 * saía 1,3 s depois de o texto já estar no ecrã e ~330 ms depois do
 * `load`. O que custava era o MOMENTO do pedido, não os bytes.
 *
 * Três intenções, por ordem de certeza:
 *
 *   1. **âncora** (`/#banco`): quem abre um link para uma cena quer
 *      essa cena. O pedido do JSON sai no arranque do módulo, antes de
 *      o React hidratar — o `dynamic()` do chunk segue-se, e o JSON
 *      deixa de esperar pelo chunk (era o que media 1,3 s);
 *   2. **pairar, focar ou tocar** num edifício: o rato já está no
 *      edifício, o clique é questão de tempo;
 *   3. **ociosidade**: passados alguns segundos sem ninguém mexer,
 *      UM edifício à vista de cada vez — nunca os onze de uma vez, e
 *      cancela-se à primeira intenção de verdade.
 *
 * O que NÃO acontece: com `navigator.connection.saveData` não se
 * pré-carrega nada (quem pediu para poupardata não quer que se lhe
 * despejem 70 KB de JS), e com `prefers-reduced-motion` o prefetch
 * especulativo (pairar e ociosidade) fica de fora — a intenção
 * deliberada (foco de teclado, toque, âncora) continua, porque não
 * tem animação nenhuma.
 *
 * A falha continua a ser honesta: um prefetch que falha não escreve
 * nada no cache e a cena mostra «—» quando for aberta.
 */
import { reduzido } from "@/lib/motion/gsap";
import { temCena } from "./com-cena";
import { importarCena } from "./registry";

/** Um pedido a caminho. Guarda o `AbortController` só enquanto voa. */
interface Pedido {
  promessa: Promise<unknown>;
  ctrl: AbortController | null;
}

/**
 * Os dados de cada cena moram em `/cenas/<id>.json` — ficheiros
 * estáticos escritos no derive pela mesma `dadosCenas()` que antes
 * alimentava a prop. O cache é por id: voltar a entrar na mesma cena
 * não repete o pedido; uma falha NÃO fica em cache, para a próxima
 * tentar de verdade.
 */
const pedidos = new Map<string, Pedido>();

/** O `fetch` de `/cenas/<id>.json`, com cache por id e cancelável. */
export function pedirCena(id: string): Promise<unknown> {
  const guardado = pedidos.get(id);
  if (guardado) return guardado.promessa;

  const ctrl = new AbortController();
  const promessa = fetch(`/cenas/${id}.json`, { signal: ctrl.signal })
    .then((r) => {
      if (!r.ok) throw new Error(`cenas/${id}: HTTP ${r.status}`);
      return r.json() as Promise<unknown>;
    })
    .then(
      (v) => {
        // deixou de voar: o abort já não serve de nada, e o próximo
        // pedido tem de ser um pedido novo
        const e = pedidos.get(id);
        if (e) e.ctrl = null;
        return v;
      },
      (e: unknown) => {
        // falhou (ou foi cancelado): sai do cache para a próxima
        // tentar de verdade — a cena mostra a falha honesta, «—»
        if (pedidos.get(id)?.promessa === promessa) pedidos.delete(id);
        throw e;
      }
    );
  pedidos.set(id, { promessa, ctrl });
  return promessa;
}

/** Cancela um prefetch a meio (a intenção foi outra). Não toca em dados já lidos. */
export function cancelarPedido(id: string): void {
  const p = pedidos.get(id);
  if (!p?.ctrl) return;
  p.ctrl.abort();
  pedidos.delete(id);
}

/** `true` quando o browser diz para não gastar dados (regra da casa: quem pede poupa). */
export function podePrecarregar(): boolean {
  if (typeof navigator === "undefined") return false;
  const ligacao = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return !ligacao?.saveData;
}

/**
 * Aquece uma cena: o JSON e o chunk. Idempotente e sem resultados — quem
 * quer os dados chama `pedirCena()` e recebe a mesma promessa.
 */
export function prefetearCena(id: string): void {
  if (!temCena(id) || !podePrecarregar()) return;
  pedirCena(id).catch(() => {});
  importarCena(id)?.catch(() => {});
}

/**
 * A âncora é a intenção mais forte que existe — quem abre `/#banco` quer
 * o banco. Este corre no arranque do MÓDULO (quando o chunk da página é
 * avaliado), antes de o React hidratar: o efeito do `<Bairro>` só corre
 * depois da primeira pintura, e o chunk da cena vinha a ser o último
 * pedido. Idempotente: quem chama outra vez não refaz nada.
 */
export function prefetearAncora(): void {
  if (typeof window === "undefined") return;
  const id = window.location.hash.replace("#", "");
  if (id && temCena(id)) prefetearCena(id);
}

/* ————— o prefetch especulativo ————— */

/**
 * Os edifícios que a FILA DE OCIOSIDADE está a aquecer. Vão a cache
 * como os outros, mas são canceláveis: à primeira intenção de verdade o
 * que interessa é o edifício que se está a mirar, e um pedido a meio
 * para o outro é banda gasta.
 */
const especulativos = new Set<string>();

/** Só se pode especular: banda sobrada e movimento pedido. */
function podeEspecular(): boolean {
  return podePrecarregar() && !reduzido();
}

/** Um edifício em cada passo de ociosidade, no máximo `limite`. */
export function prefetearEmOciosidade(
  alvos: readonly string[],
  limite = 3,
  esperaMs = 4000
): void {
  if (!podeEspecular() || alvos.length === 0) return;
  const quantos = Math.min(limite, alvos.length);
  let i = 0;

  const passo = () => {
    if (i >= quantos) return;
    const id = alvos[i++];
    // a fila já não vale se alguém entretanto disse o que quer
    if (cancelada) return;
    especulativos.add(id);
    prefetearCena(id);
    if (i < quantos) agendar(passo, esperaMs);
  };
  agendar(passo, esperaMs);
}

let cancelada = false;

/** Cancela a fila de ociosidade (a intenção do utilizador ganha). */
export function cancelarEspeculativo( excepto?: string): void {
  cancelada = true;
  for (const id of especulativos) {
    if (id === excepto) continue;
    cancelarPedido(id);
  }
  especulativos.clear();
}

/**
 * Um passo de ociosidade: `requestIdleCallback` quando existe (é a
 * semântica certa — a página está livre), com um tecto em `esperaMs`
 * para não depender de o browser ter folga.
 */
function agendar(fn: () => void, esperaMs: number): void {
  const ric = (
    window as unknown as {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    }
  ).requestIdleCallback;
  if (ric) ric(fn, { timeout: esperaMs });
  else window.setTimeout(fn, esperaMs);
}

/**
 * O arranque. Uma linha, no topo do módulo de quem já está no browser:
 * se a URL traz uma âncora de cena, o JSON e o chunk saem agora — antes
 * da hidratação, antes do `load`, e sem esperar que o React monte o mapa
 * para só depois se lembrar de que havia uma cena para abrir.
 */
if (typeof window !== "undefined") prefetearAncora();