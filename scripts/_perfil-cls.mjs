// Perfil do CLS da home — atribui cada deslocamento à sua causa, com prova.
//
// Por que existe: o CLS da home mede 0,0438 no browser real sob 1,6 Mbps
// (e ~0,006 no Lighthouse móvel). Este script captura cada entrada
// `layout-shift` com as SUAS FONTES (`sources`: nó, rect antes e depois,
// tempo), cronometra a chegada das fontes (`document.fonts`) e segue as
// rects dos blocos principais ao longo do tempo. Assim atribui-se o CLS a
// um elemento concreto em vez de o adivinhar.
//
// Variantes (desligam um suspeito de cada vez):
//   original          — como está
//   sem-js            — JavaScript desligado
//   bloq-fontes       — todas as woff2 abortadas
//   bloq-fonte-intro  — só /fonts/Archivo-intro.woff2 (= ArchivoMeio, 116%)
//   bloq-fonte-base   — só o Archivo base
//   sem-transicoes    — transition/animation desligadas
//
// Corre contra a página PUBLICADA (é lá que o CLS aparece; uma página
// local não o reproduz), com rede a 1,6 Mbps/150 ms e CPU a 4× — a mesma
// configuração da volta de medição. O Chromium empacotado é usado por
// omissão: com `CANAL=chrome` alguns runs ficam «pendurados».
//
// Uso:
//   node scripts/_perfil-cls.mjs --url https://aocentimo.pt/ [--corridas n] [--so variante]
//
// Env: CPU (default 4), SEM_REDE=1 (sem throttle de rede), CANAL=chrome.

import { chromium } from 'playwright'

const URL = (() => {
  const i = process.argv.indexOf('--url')
  return i >= 0 ? process.argv[i + 1] : 'https://aocentimo.pt/'
})()
const N = (() => {
  const i = process.argv.indexOf('--corridas')
  return i >= 0 ? Number(process.argv[i + 1]) : 3
})()
const SO = (() => {
  const i = process.argv.indexOf('--so')
  return i >= 0 ? process.argv[i + 1] : null
})()
const CPU = Number(process.env.CPU || 4)
const LENTO = process.env.SEM_REDE ? null : { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 }

const VARIANTES = {
  original: {},
  'sem-js': { semJs: true },
  'bloq-fontes': { bloquearFontes: true },
  'bloq-fonte-intro': { bloquear: '**/Archivo-intro.woff2' },
  'bloq-fonte-base': { bloquear: '**/Archivo_base*.woff2' },
  'sem-transicoes': { css: '*,*::before,*::after{transition:none !important;animation:none !important}' },
  // correcções candidatas (o @font-face mais tarde substitui o original)
  'fix-134': { css: '@font-face{font-family:"ArchivoMeio Fallback";src:local(Arial);ascent-override:100.68%;descent-override:89.33%;line-gap-override:0%;size-adjust:134.25%}' },
  'fd-block': { css: '@font-face{font-family:"ArchivoMeio";src:url("/fonts/Archivo-intro.woff2") format("woff2");font-weight:400 900;font-style:normal;font-display:block}' },
  'fd-optional': { css: '@font-face{font-family:"ArchivoMeio";src:url("/fonts/Archivo-intro.woff2") format("woff2");font-weight:400 900;font-style:normal;font-display:optional}' },
}

// A sonda: guarda cada layout-shift com as fontes; amostra as rects dos
// blocos principais; cronometra a chegada das fontes.
const SONDAR = `
  window.__shifts = [];
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__shifts.push({
          v: e.value, t: Math.round(e.startTime),
          s: (e.sources || []).map((s) => {
            const n = s.node;
            const d = n ? ((n.tagName || '?') + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' && n.className ? '.' + n.className.trim().split(/\\s+/).slice(0, 3).join('.') : '')) : '(sem-no)';
            const rr = (r) => r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null;
            return { d, prev: rr(s.previousRect), cur: rr(s.currentRect) };
          }),
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  window.__fontes = { ready: -1, loadingdone: [] };
  try {
    document.fonts.ready.then(() => { window.__fontes.ready = Math.round(performance.now()); });
    document.fonts.addEventListener('loadingdone', () => { window.__fontes.loadingdone.push(Math.round(performance.now())); });
  } catch {}
  window.__rects = [];
  window.__amostrar = () => {
    const r = {};
    for (const sel of ['.b-intro', '.b-intro h1', '.b-janela', '.b-mundo', '.b-elenco']) {
      const el = document.querySelector(sel);
      if (el) { const b = el.getBoundingClientRect(); r[sel] = [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; }
    }
    window.__rects.push({ t: Math.round(performance.now()), r });
  };
  try { setInterval(window.__amostrar, 200); window.__amostrar(); } catch {}
  true;
`

const LEITURA = `
  (() => {
    const shifts = window.__shifts || [];
    const total = shifts.reduce((a, e) => a + e.v, 0);
    let status = [];
    try { status = [...document.fonts].map((f) => [f.family, f.status]); } catch {}
    return { cls: Number(total.toFixed(5)), shifts, rects: window.__rects || [], fontes: { ...(window.__fontes || {}), status } };
  })()
`

async function umaCorrida(browser, v) {
  const opts = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  if (v.semJs) opts.javaScriptEnabled = false
  const ctx = await browser.newContext(opts)
  const page = await ctx.newPage()
  const cdp = await ctx.newCDPSession(page)
  if (LENTO) {
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', { ...LENTO, connectionType: 'cellular4g' })
  }
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
  if (v.bloquear) await page.route(v.bloquear, (route) => route.abort())
  // atrasa a chegada das fontes: reproduz localmente o swap tardio que só
  // aparece no site publicado sob rede lenta (ATRASO_FONTE em ms)
  if (process.env.ATRASO_FONTE) {
    const ms = Number(process.env.ATRASO_FONTE)
    await page.route('**/*.woff2', async (route) => {
      await new Promise((r) => setTimeout(r, ms))
      await route.continue()
    })
  }
  try {
    await page.goto(URL, { waitUntil: 'commit', timeout: 30_000 })
  } catch (e) {
    console.error(`    (goto: ${e.name})`)
  }
  await page.waitForTimeout(12_000)
  const r = await page.evaluate(LEITURA)
  await ctx.close()
  return r
}

const browser = await chromium.launch(process.env.CANAL ? { channel: process.env.CANAL } : {})
for (const [nome, v] of Object.entries(VARIANTES)) {
  if (SO && nome !== SO) continue
  const cls = []
  let exemplo = null
  for (let i = 0; i < N; i++) {
    const r = await umaCorrida(browser, v)
    cls.push(r.cls)
    if (!exemplo && r.shifts.length) exemplo = r
    const f = r.fontes || {}
    console.log(`   ${nome} #${i + 1}: CLS ${r.cls} · fontes.ready ${f.ready} · loadingdone ${JSON.stringify(f.loadingdone)}`)
  }
  console.log(`\n=== ${nome}: CLS = ${cls.join(' / ')}`)
  if (exemplo) {
    for (const s of exemplo.shifts) {
      for (const x of s.s) console.log(`   t=${s.t} v=${s.v.toFixed(5)} ${x.d}  ${JSON.stringify(x.prev)} -> ${JSON.stringify(x.cur)}`)
    }
    const h1 = exemplo.rects.map((p) => [p.t, p.r['.b-intro h1']?.[3], p.r['.b-janela']?.[3]]).filter((x) => x[1] != null)
    if (h1.length) {
      const primo = h1[0]
      const ultimo = h1[h1.length - 1]
      console.log(`   prova: h1 ${primo[1]} -> ${ultimo[1]} px · .b-janela ${primo[2]} -> ${ultimo[2]} px`)
    }
  }
  if (exemplo?.fontes) console.log(`   fontes: ${JSON.stringify(exemplo.fontes.status)}`)
}
await browser.close()
