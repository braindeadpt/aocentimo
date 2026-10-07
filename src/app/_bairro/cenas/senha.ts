/**
 * A senha seguinte — a porta do `cenaBase().senha()` do protótipo, que as
 * cenas P2a (Finanças, Banco) tinham deixado de fora: o painel pisca e
 * muda, o funcionário levanta o braço e, nas Finanças, o talão cai.
 *
 * Com `prefers-reduced-motion` (ou sem GSAP) o estado final entra logo:
 * o painel já diz a senha nova, o talão está à vista e o passo avança.
 */
import { carregarGsap, motionActiva } from "@/lib/motion/gsap";

export interface OpcoesSenha {
  /** O `<text>` do painel (`#finPainel`, `#banPainel`). */
  painel: string;
  /** A senha que passa a aparecer («A 023»). */
  nova: string;
  /** O braço que acena (`#finFunc .braco-d`). */
  braco?: string;
  /** O talão que cai (só as Finanças). */
  talao?: string;
  /** Quando o braço começa, em segundos (o protótipo: .4 no Banco, .5 nas Finanças). */
  atrasoBraco?: number;
}

export async function chamarSenha(raiz: Element | null | undefined, o: OpcoesSenha, depois: () => void): Promise<void> {
  const painel = raiz?.querySelector<SVGTextElement>(o.painel) ?? null;
  const talao = o.talao ? (raiz?.querySelector<SVGGElement>(o.talao) ?? null) : null;
  if (!raiz || !motionActiva()) {
    if (painel) painel.textContent = o.nova;
    if (talao) talao.setAttribute("opacity", "1");
    depois();
    return;
  }
  const { gsap } = await carregarGsap();
  if (talao) gsap.fromTo(talao, { opacity: 1, y: -30 }, { y: 0, duration: 0.5, ease: "back.out(2)" });
  if (painel)
    gsap
      .timeline()
      .to(painel, { opacity: 0, duration: 0.12, repeat: 3, yoyo: true })
      .add(() => {
        painel.textContent = o.nova;
      });
  const braco = o.braco ? raiz.querySelectorAll(o.braco) : null;
  if (braco?.length)
    gsap
      .timeline({ delay: o.atrasoBraco ?? 0.4 })
      .to(braco, { rotation: -150, transformOrigin: "50% 0%", duration: 0.25 })
      .to(braco, { rotation: 0, duration: 0.3, delay: 0.5 });
  gsap.delayedCall(0.9, depois);
}

/** «Ver outra vez»: o painel volta à senha de partida e o talão some. */
export function reporSenha(raiz: Element | null | undefined, painel: string, inicial: string, talao?: string): void {
  const p = raiz?.querySelector(painel);
  if (p) p.textContent = inicial;
  const t = talao ? raiz?.querySelector(talao) : null;
  if (t) {
    t.setAttribute("opacity", "0");
    (t as SVGGElement).style.opacity = "";
    (t as SVGGElement).style.transform = "";
  }
}
