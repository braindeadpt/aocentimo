// Perfil do LCP da home — atribui o atraso a cada suspeito.
//
// Por que existe: o LCP da home (2 684 ms contra a meta de 2 500 ms) não
// se explica por um recurso — o elemento é o texto da intro (`lcpLoadTime`
// 0). Este script serve o `out/` local (TTFB ~0, estável) e mede o FCP e o
// LCP da MESMA página sob variantes que desligam UM suspeito de cada vez:
//
//   original          — como está
//   intro-sem-fonte   — a intro sem a fonte da casa (mede o custo do swap)
//   bloq-fontes       — todas as woff2 abortadas
//   cv-hidden         — o contentor do mapa não é pintado (tecto do ganho)
//   sem-mapa          — o bloco do mapa sai do HTML (tecto absoluto)
//   sem-js            — JavaScript desligado (piso do FCP)
//
// O que muda entre variantes é SÓ o custo de CPU/parse/layout: a rede e o
// TTFB do CDN medem-se à parte (`_medir-publicado.mjs real`) e não entram
// aqui. A CPU fica a 1× DE PROPÓSITO: `Emulation.setCPUThrottlingRate` a 4
// faz o parser estancar neste Chromium headless (a página fica «pendurada»),
// por isso o sinal lê-se no DELTA entre variantes, não no valor absoluto.
//
// Uso:
//   PORTA=3123 node scripts/_serve-static.mjs &
//   node scripts/_perfil-lcp.mjs --url http://localhost:3123/ [--corridas n] [--so variante]
//
// Env: CPU (default 1), SETTLE (default 11000 ms)

import { chromium } from 'playwright'

const URL = (() => {
  const i = process.argv.indexOf('--url')
  return i >= 0 ? process.argv[i + 1] : 'http://localhost:3100/'
})()
const CPU = Number(process.env.CPU || 1)
const SETTLE = Number(process.env.SETTLE || 11_000)
const N = (() => {
  const i = process.argv.indexOf('--corridas')
  return i >= 0 ? Number(process.argv[i + 1]) : 3
})()
const SO = (() => {
  const i = process.argv.indexOf('--so')
  return i >= 0 ? process.argv[i + 1] : null
})()

/** variante -> como a construir. */
const VARIANTES = {
  original: {},
  'intro-sem-fonte': { css: '.b-intro h1,.b-intro p{font-family:Arial,sans-serif !important}' },
  'bloq-fontes': { bloquearFontes: true },
  'cv-hidden': { css: '.amb{content-visibility:hidden}' },
  'sem-mapa': { removerMapa: true },
  'sem-js': { semJs: true },
}

const SONDAR = `
  window.__lcp = null;
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__lcp = { t: Math.round(e.startTime), el: e.element ? (e.element.tagName + (e.element.className ? '.' + String(e.element.className).slice(0,26) : '')) : null };
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  window.__lt = 0;
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt += e.duration; }).observe({ type: 'longtask', buffered: true });
  } catch {}
  true;
`

const LEITURA = `
  (() => {
    const nt = performance.getEntriesByType('navigation')[0] || {};
    const fcp = Math.round((performance.getEntriesByName('first-contentful-paint')[0]?.startTime) ?? -1);
    return {
      fcp,
      lcp: window.__lcp?.t ?? -1,
      lcpEl: window.__lcp?.el ?? null,
      longTasksMs: Math.round(window.__lt || 0),
      dcl: Math.round(nt.domContentLoadedEventEnd ?? -1),
      load: Math.round(nt.loadEventEnd ?? -1),
      nos: document.getElementsByTagName('*').length,
    };
  })()
`

/** Extrai o bloco do mapa (o `.amb` que precede o `.b-palco`) do HTML. */
function removerMapa(html) {
  const pal = html.indexOf('<section class="b-palco')
  const a = pal >= 0 ? html.lastIndexOf('<div class="amb"', pal) : -1
  const b = html.indexOf('<div id="conteudo-bairro"')
  if (a < 0 || b < 0 || b <= a) return html
  return html.slice(0, a) + '<div class="amb"><!-- mapa removido --></div>' + html.slice(b)
}

async function umaCorrida(browser, v) {
  const opts = { viewport: { width: 412, height: 823 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  if (v.semJs) opts.javaScriptEnabled = false
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
  if (!v.semJs) await page.addInitScript(SONDAR)
  if (v.css) {
    await page.route('**/*.css', async (route) => {
      const resp = await route.fetch()
      const body = (await resp.text()) + '\n' + v.css + '\n'
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'text/css; charset=utf-8' } })
    })
  }
  if (v.bloquearFontes) await page.route('**/*.woff2', (route) => route.abort())
  if (v.removerMapa) {
    await page.route(URL, async (route) => {
      const resp = await route.fetch()
      const body = removerMapa(await resp.text())
      await route.fulfill({ response: resp, body, headers: { ...resp.headers(), 'content-type': 'text/html; charset=utf-8' } })
    })
  }
  try {
    await page.goto(URL, { waitUntil: 'commit', timeout: 30_000 })
  } catch (e) {
    console.error(`    (goto: ${e.name})`)
  }
  await page.waitForTimeout(SETTLE)
  const r = await page.evaluate(LEITURA)
  await ctx.close()
  return r
}

function mediana(xs) {
  const a = [...xs].sort((p, q) => p - q)
  return a.length ? a[Math.floor(a.length / 2)] : -1
}

const browser = await chromium.launch({ channel: 'chrome' })
const out = {}
for (const [nome, v] of Object.entries(VARIANTES)) {
  if (SO && nome !== SO) continue
  const rs = []
  for (let i = 0; i < N; i++) {
    const r = await umaCorrida(browser, v)
    rs.push(r)
    console.log(`  ${nome} #${i + 1}: fcp ${r.fcp} lcp ${r.lcp} dcl ${r.dcl} load ${r.load} lt ${r.longTasksMs} nos=${r.nos} (${r.lcpEl})`)
  }
  out[nome] = {
    fcp: mediana(rs.map((r) => r.fcp)),
    lcp: mediana(rs.map((r) => r.lcp)),
    dcl: mediana(rs.map((r) => r.dcl)),
    load: mediana(rs.map((r) => r.load)),
    longTasksMs: mediana(rs.map((r) => r.longTasksMs)),
    nos: mediana(rs.map((r) => r.nos)),
    lcpEl: rs.map((r) => r.lcpEl).find(Boolean) || null,
  }
}
await browser.close()
console.log('\nvariante           fcp    lcp    dcl   load  longTasks    nos')
for (const [nome, o] of Object.entries(out)) {
  console.log(
    `${nome.padEnd(17)} ${String(o.fcp).padStart(5)} ${String(o.lcp).padStart(6)} ${String(o.dcl).padStart(6)} ${String(o.load).padStart(6)} ${String(o.longTasksMs).padStart(9)} ${String(o.nos).padStart(6)}`
  )
}
console.log('\n' + JSON.stringify(out, null, 2))
