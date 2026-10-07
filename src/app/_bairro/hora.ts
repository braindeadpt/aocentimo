/**
 * A hora do dia do bairro — noite antes das 7 e a partir das 20, fim de
 * tarde das 18 às 20, dia o resto (a regra do protótipo).
 *
 * Vive à parte porque corre em TRÊS sítios: no servidor (o HTML do build),
 * no script em linha que corrige o céu antes da primeira pintura, e no
 * `<Bairro>` depois de hidratar. A home é um export estático: a hora do
 * build fica congelada no HTML — a do runner do CI, em UTC — e sem esta
 * correcção quem abrisse o site de dia via o bairro de noite (e vice-
 * versa) até carregar num botão. Auditoria de 2026-10-06.
 */
export type Hora = "dia" | "tarde" | "noite";

export function horaDe(h: number): Hora {
  if (h >= 20 || h < 7) return "noite";
  return h >= 18 ? "tarde" : "dia";
}

/**
 * A hora que o mapa mostra, por ordem de prioridade:
 *   1. o que a pessoa clicou (Dia / Fim de tarde / Noite);
 *   2. senão, o tema escuro é «a noite do bairro» → noite;
 *   3. senão, a hora do relógio de quem abre a página.
 * Trocar o tema esquece o clique (o `<Bairro>` repõe `escolha` a null), porque
 * quem carrega no botão do tema espera que o mundo mude com ele.
 */
export function horaEfetiva(o: {
  escolha: Hora | null;
  escuro: boolean;
  horaLocal: Hora;
}): Hora {
  return o.escolha ?? (o.escuro ? "noite" : o.horaLocal);
}

/** O tema está escuro? Lê o atributo que o script do layout põe no <html>. */
export function temaEscuro(): boolean {
  return document.documentElement.dataset.theme === "dark";
}

/** Avisa quando o tema muda (o interruptor muda o atributo, não o React). */
export function subscreverTema(avisar: () => void): () => void {
  const o = new MutationObserver(avisar);
  o.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => o.disconnect();
}

/** A classe que o palco recebe por hora. */
export const CLASSE_HORA: Record<Hora, string> = {
  dia: "",
  tarde: "b-fim-tarde",
  noite: "b-noite",
};

/**
 * O script em linha, logo a seguir à abertura do `<section class="b-palco">`:
 * acerta a classe pela hora LOCAL de quem abre a página antes de o browser
 * pintar o mapa. A mesma regra de `horaDe`, escrita à mão em ES5 porque
 * corre antes de qualquer bundle (o teste em hora.test.ts confere as duas).
 */
export const SCRIPT_HORA =
  '(function(){try{var s=document.currentScript&&document.currentScript.parentNode;if(!s)return;' +
  'var h=new Date().getHours();var d=document.documentElement;var e=d&&d.dataset&&d.dataset.theme==="dark";' +
  'var c=e||h>=20||h<7?"b-noite":h>=18?"b-fim-tarde":"";' +
  's.classList.remove("b-noite","b-fim-tarde");if(c)s.classList.add(c);}catch(e){}})()';
