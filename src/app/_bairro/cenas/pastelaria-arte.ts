/**
 * O interior da Pastelaria — porta do desenho de `cenaPastelaria()` do
 * protótipo. A vitrine com pastéis de nata e bolas de Berlim, a máquina
 * de café com vapor, a empregada ao balcão e o quadro de ardósia com o
 * preço de antes e de hoje.
 */
import { pessoa } from "@/lib/bairro/personagens";
import { K, paredeChao } from "./p2c-arte-base";

/**
 * O interior. O quadro recebe duas linhas: a de «antes» (o exemplo em
 * T0) e a de «hoje» — escrita só no passo 2, por manipulação directa
 * como no protótipo (`#pastHoje`).
 */
export function interiorPastelaria(placa: string, tituloQuadro: string, linhaAntes: string): string {
  let s = `<defs><pattern id="b-pastAz" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff0f4"/><circle cx="8" cy="8" r="3.2" fill="none" stroke="#e2412a" stroke-width="1.2"/></pattern></defs>`;
  s += paredeChao("url(#b-pastAz)", "#e4dccb", placa, "#e2412a");
  // o quadro de ardósia com os preços
  s += `<g><rect x="60" y="70" width="200" height="120" rx="6" fill="#26332c" stroke="#8a5a2b" stroke-width="8"/><text x="160" y="100" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="22" fill="#fff">${tituloQuadro}</text>
    <text x="160" y="134" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="20" fill="#cfe6d6">${linhaAntes}</text><text id="pastHoje" x="160" y="170" text-anchor="middle" font-family="Caveat" font-weight="700" font-size="26" fill="#ffd34d">hoje: ?</text></g>`;
  // a máquina de café com o vapor
  s += `<g><rect x="430" y="150" width="130" height="110" rx="8" fill="#b9c1c9" stroke="${K}" stroke-width="3"/><rect x="444" y="164" width="102" height="30" rx="4" fill="#26282b"/><path d="M460 200 v20 M530 200 v20" stroke="${K}" stroke-width="5"/><rect x="452" y="226" width="20" height="18" rx="3" fill="#fff" stroke="${K}" stroke-width="2"/><rect x="520" y="226" width="20" height="18" rx="3" fill="#fff" stroke="${K}" stroke-width="2"/><path class="vapor" d="M462 220 q-6 -10 0 -18 q6 -8 0 -16" fill="none" stroke="#fff" stroke-width="2.4" opacity=".8"/></g>`;
  // a empregada atrás do balcão
  s += `<g id="pastEmp" transform="translate(330 330) scale(1.02)">${pessoa({ pele: "d", cabelo: "rabo", corCabelo: "#1d1410", roupa: "#fff", calcas: "#2b3a55", avental: "#e2412a" })}</g>`;
  // a vitrine: pastéis de nata e bolas de Berlim
  s += `<rect x="60" y="290" width="520" height="120" fill="#f3e6cf" stroke="${K}" stroke-width="3"/><rect x="80" y="244" width="480" height="60" rx="6" fill="#dff2fb" fill-opacity=".6" stroke="${K}" stroke-width="2.6"/>`;
  for (let k = 0; k < 6; k++)
    s += `<g transform="translate(${110 + k * 44} 290)"><ellipse cx="0" cy="-10" rx="16" ry="9" fill="#e9b24c" stroke="${K}" stroke-width="2"/><ellipse cx="0" cy="-12" rx="11" ry="5" fill="#f7d774" stroke="${K}" stroke-width="1.4"/><circle cx="-3" cy="-13" r="1.8" fill="#8a4a2b"/><circle cx="4" cy="-11" r="1.5" fill="#8a4a2b"/></g>`;
  for (let k = 0; k < 4; k++)
    s += `<g transform="translate(${390 + k * 40} 290)"><ellipse cx="0" cy="-12" rx="16" ry="12" fill="#e9b24c" stroke="${K}" stroke-width="2"/><path d="M-14 -12 h28" stroke="#fff6e3" stroke-width="4"/></g>`;
  // a chávena no balcão
  s += `<g><rect x="590" y="366" width="36" height="24" rx="3" fill="#fff" stroke="${K}" stroke-width="2"/><path d="M626 372 q10 0 8 10 q-2 6 -8 6" fill="none" stroke="${K}" stroke-width="2"/><ellipse cx="608" cy="392" rx="24" ry="5" fill="#fff" stroke="${K}" stroke-width="2"/></g>`;
  return s;
}
