// _lancamento.mjs — o portão de lançamento inteiro, por ordem, numa linha:
//
//   npm run lancamento
//   npm run lancamento -- --desde build     # retoma a partir de um passo
//   npm run lancamento -- --lista           # só mostra os passos
//
// Corre os MESMOS passos e pela MESMA ordem que o `.github/workflows/ci.yml`
// (o contrato «Qualidade» do AGENTS.md): lint → typecheck → unitários →
// derive → validate:data → build → orçamentos → gate do HTML → e2e →
// audit → dispositivos → fluidez. Pára no PRIMEIRO vermelho e diz alto
// qual foi, com o código de saída e o comando para o repetir sozinho —
// nada de deixar correr o resto e enterrar a falha no meio do ruído.
//
// O servidor estático do `out/` (porta 3100, a dos scripts da casa) é
// levantado aqui depois do build e partilhado pelo e2e (o webServer do
// playwright reutiliza-o fora do CI), pelo audit, pelos dispositivos e
// pela fluidez; morre no fim, corra bem ou mal. Se a 3100 já estiver
// ocupada, falha logo: testar o build de outra sessão é pior do que não
// testar.
import { spawn } from "node:child_process";
import { createConnection } from "node:net";

const PORTA = "3100";

/** Os passos, pela ordem do ci.yml. `servidor` = precisa do out/ servido. */
const PASSOS = [
  { id: "lint", cmd: "npm run lint" },
  { id: "typecheck", cmd: "npm run typecheck" },
  { id: "unitarios", cmd: "npm run test:unit" },
  { id: "derive", cmd: "npm run derive" },
  { id: "validate", cmd: "npm run validate:data" },
  { id: "build", cmd: "npm run build" },
  { id: "orcamentos", cmd: "node scripts/_orcamentos.mjs" },
  { id: "gate-html", cmd: "node scripts/_gate-html.mjs" },
  { id: "e2e", cmd: "npm run test:e2e", servidor: true },
  { id: "audit", cmd: "npm run audit", servidor: true },
  { id: "dispositivos", cmd: "node scripts/_dispositivos.mjs", servidor: true },
  { id: "fluidez", cmd: `node scripts/_fluidez.mjs ${PORTA} /`, servidor: true },
];

const args = process.argv.slice(2);
if (args.includes("--lista")) {
  PASSOS.forEach((p, i) => console.log(`${String(i + 1).padStart(2)}. ${p.id.padEnd(13)} ${p.cmd}`));
  process.exit(0);
}
const iDesde = args.indexOf("--desde");
const desde = iDesde >= 0 ? args[iDesde + 1] : null;
const inicio = desde ? PASSOS.findIndex((p) => p.id === desde) : 0;
if (inicio < 0) {
  console.error(`✗ passo desconhecido: «${desde}». Passos: ${PASSOS.map((p) => p.id).join(", ")}`);
  process.exit(2);
}

const ocupada = (porta) =>
  new Promise((res) => {
    const s = createConnection({ port: Number(porta), host: "127.0.0.1" });
    s.once("connect", () => (s.destroy(), res(true)));
    s.once("error", () => res(false));
  });

const correr = (cmd, env = {}) =>
  new Promise((res) => {
    const filho = spawn(cmd, { shell: true, stdio: "inherit", env: { ...process.env, ...env } });
    filho.on("exit", (codigo, sinal) => res(codigo ?? (sinal ? 128 : 1)));
  });

const seg = (ms) => `${(ms / 1000).toFixed(0)} s`;

let servidor = null;
const matarServidor = () => {
  if (servidor && servidor.exitCode === null) servidor.kill();
  servidor = null;
};
process.on("exit", matarServidor);
for (const sinal of ["SIGINT", "SIGTERM"])
  process.on(sinal, () => {
    matarServidor();
    process.exit(130);
  });

async function levantarServidor() {
  if (await ocupada(PORTA)) {
    falhar("servidor", `a porta ${PORTA} já está ocupada — outro servidor serviria um build que não é este. Fecha-o e repete.`, 1);
  }
  servidor = spawn("node", ["scripts/_serve-static.mjs"], {
    stdio: "ignore",
    env: { ...process.env, PORTA },
  });
  for (let k = 0; k < 50; k++) {
    if (await ocupada(PORTA)) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  falhar("servidor", `o _serve-static não abriu a porta ${PORTA} em 5 s`, 1);
}

function falhar(id, porque, codigo) {
  const linha = "✗".repeat(64);
  console.error(`\n${linha}\n✗ LANÇAMENTO PARADO no passo «${id}» — ${porque}`);
  const passo = PASSOS.find((p) => p.id === id);
  if (passo) {
    console.error(`✗ repetir só este passo:   ${passo.cmd}${passo.servidor ? `   (com o out/ servido na ${PORTA})` : ""}`);
    console.error(`✗ retomar daqui:           npm run lancamento -- --desde ${id}`);
  }
  console.error(`${linha}\n`);
  matarServidor();
  process.exit(codigo || 1);
}

const t0 = Date.now();
const feitos = [];
for (const passo of PASSOS.slice(inicio)) {
  if (passo.servidor && !servidor) await levantarServidor();
  console.log(`\n▶ [${PASSOS.indexOf(passo) + 1}/${PASSOS.length}] ${passo.id} — ${passo.cmd}`);
  const t = Date.now();
  const codigo = await correr(passo.cmd);
  if (codigo !== 0) falhar(passo.id, `saiu com o código ${codigo} ao fim de ${seg(Date.now() - t)}`, codigo);
  feitos.push(`${passo.id} ${seg(Date.now() - t)}`);
}
matarServidor();
console.log(`\n✓ LANÇAMENTO VERDE — ${feitos.length} passos em ${seg(Date.now() - t0)}: ${feitos.join(" · ")}`);
