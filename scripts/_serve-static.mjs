// servidor estático mínimo para o `out/` — o `npx serve` morre a meio
// do e2e nesta máquina; este não faz nada além de ler ficheiros
import { join } from "node:path";
import { servirEstatico, urlBase } from "./_estatico.mjs";

const srv = await servirEstatico(join(process.cwd(), "out"), Number(process.env.PORTA ?? 3100));
console.log(`static ${urlBase(srv)}`);
