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
  'var h=new Date().getHours();var c=h>=20||h<7?"b-noite":h>=18?"b-fim-tarde":"";' +
  's.classList.remove("b-noite","b-fim-tarde");if(c)s.classList.add(c);}catch(e){}})()';
