#!/usr/bin/env node
/**
 * Medição do site PUBLICADO (https://aocentimo.pt).
 *
 * Só leitura: nada escreve no repositório para além do relatório que
 * aponta em `--saida`. Nada aqui é uma optimização — é o instrumento.
 *
 *   node scripts/_medir-publicado.mjs lh      --saida /tmp/lh.json
 *   node scripts/_medir-publicado.mjs cenas   --saida /tmp/cenas.json
 *   node scripts/_medir-publicado.mjs html    --saida /tmp/html.json
 *   node scripts/_medir-publicado.mjs axe     --saida /tmp/axe.json
 *
 * Notas de portabilidade (medidas nesta máquina, macOS):
 *  - `lighthouse` e `axe-core` são ferramentas, NÃO dependências do
 *    projecto. Resolve-as por(require.resolve) e, se não as encontrar,
 *    aceita `--lighthouse <cli.js>` e `--axe <axe.min.js>`.
 *  - O Chrome instalado pode ser x64 sob Rosetta e dar timeout no
 *    Lighthouse; `--chrome` aponta para um Chromium arm64.
 */

import { createRequire } from 'node:module'
import { writeFileSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { chromium } from 'playwright'

const BASE = process.env.BASE ?? 'https://aocentimo.pt'
const require_ = createRequire(import.meta.url)

const ROTAS = [
  '/',
  '/salario',
  '/irs',
  '/credito',
  '/poupanca',
  '/inflacao',
  '/precos',
  '/trabalho',
  '/dados',
  '/aprender',
]

const CENAS = [
  'banco',
  'bomba',
  'casa',
  'correios',
  'escola',
  'fabrica',
  'financas',
  'mercearia',
  'pastelaria',
  'quiosque',
  'segsocial',
]

function arg(nome, def) {
  const i = process.argv.indexOf(`--${nome}`)
  return i === -1 ? def : process.argv[i + 1]
}
const SAIDA = arg('saida', '/tmp/medicao.json')
const CORRIDAS = Number(arg('corridas', '3'))

function localiza(modulo, flag) {
  const explicito = arg(flag, null)
  if (explicito) return resolve(explicito)
  return require_.resolve(modulo)
}

/* ------------------------------------------------------------------ (1) */

async function lh() {
  const cli = localiza('lighthouse/cli/index.js', 'lighthouse')
  const alvo = arg('rotas', null)
  const rotas = alvo ? alvo.split(',') : ROTAS
  const runs = []
  for (const rota of rotas) {
    for (let n = 1; n <= CORRIDAS; n++) {
      const ficheiro = `/tmp/lh-${rota.replaceAll('/', '_') || '_home'}-${n}.json`
      console.error(`lh ${rota} #${n} …`)
      execFileSync(
        process.execPath,
        [
          cli,
          `${BASE}${rota}`,
          '--output=json',
          `--output-path=${ficheiro}`,
          '--throttling-method=simulate',
          '--only-categories=performance,accessibility',
          '--chrome-flags=--headless=new',
          '--quiet',
        ],
        { stdio: ['ignore', 'ignore', 'inherit'], env: process.env },
      )
      runs.push({ rota, n, ...resume(ficheiro) })
    }
  }
  return { quando: new Date().toISOString(), rotas, runs }
}

function resumoCena(ficheiro, id) {
  const r = JSON.parse(readFileSync(ficheiro, 'utf8'))
  const itens = r.audits['network-requests']?.details?.items ?? []
  const cena = itens.find((i) => i.url.endsWith(`/cenas/${id}.json`))
  const m = (k) => Math.round(r.audits[k]?.numericValue ?? -1)
  return {
    lcp: m('largest-contentful-paint'),
    fcp: m('first-contentful-paint'),
    cls: r.audits['cumulative-layout-shift']?.numericValue,
    tbt: m('total-blocking-time'),
    cenaJson: cena ? { bytes: cena.transferSize, ms: Math.round(cena.networkEndTime) } : null,
    cenaJsonPedido: cena ? Math.round(cena.networkRequestTime) : null,
    chunks: itens.filter((i) => i.resourceType === 'Script').length,
    peso: Math.round(itens.reduce((s, i) => s + (i.transferSize ?? 0), 0) / 1024),
  }
}

async function lhCenas() {
  const cli = localiza('lighthouse/cli/index.js', 'lighthouse')
  const alvo = arg('cenas', null)
  const lista = alvo ? alvo.split(',') : CENAS
  const runs = []
  for (const id of lista) {
    for (let n = 1; n <= CORRIDAS; n++) {
      const ficheiro = `/tmp/lhc-${id}-${n}.json`
      console.error(`lh #${id} #${n} …`)
      execFileSync(
        process.execPath,
        [
          cli,
          `${BASE}/#${id}`,
          '--output=json',
          `--output-path=${ficheiro}`,
          '--throttling-method=simulate',
          '--only-categories=performance',
          '--chrome-flags=--headless=new',
          '--quiet',
        ],
        { stdio: ['ignore', 'ignore', 'inherit'], env: process.env },
      )
      runs.push({ id, n, ...resumoCena(ficheiro, id) })
    }
  }
  return { quando: new Date().toISOString(), cenas: runs }
}

function resume(ficheiro) {
  const r = JSON.parse(readFileSync(ficheiro, 'utf8'))
  const a = r.audits
  const itens = r.audits['network-requests']?.details?.items ?? []
  // O Lighthouse usa resourceType capitalizado (Document, Script, …)
  const bytes = (tipo) =>
    itens
      .filter((i) => i.resourceType === tipo && i.transferSize != null)
      .reduce((s, i) => s + i.transferSize, 0)
  const js = bytes('Script')
  const m = (k) => a[k]?.numericValue
  const bd = a['lcp-breakdown-insight']?.details?.items ?? []
  const fases = Object.fromEntries(
    (bd.find((i) => i.type === 'table')?.items ?? []).map((i) => [i.subpart, Math.round(i.duration)]),
  )
  return {
    lcp: Math.round(m('largest-contentful-paint')),
    cls: m('cumulative-layout-shift'),
    tbt: Math.round(m('total-blocking-time')),
    fcp: Math.round(m('first-contentful-paint')),
    si: Math.round(m('speed-index')),
    peso: Math.round(itens.reduce((s, i) => s + (i.transferSize ?? 0), 0) / 1024),
    js: Math.round(js / 1024),
    html: Math.round(bytes('Document') / 1024),
    css: Math.round(bytes('Stylesheet') / 1024),
    fontes: Math.round(bytes('Font') / 1024),
    imagens: Math.round(bytes('Image') / 1024),
    nFontes: itens.filter((i) => i.resourceType === 'Font').length,
    pedidos: itens.length,
    lcpFases: fases,
    lcpEl: bd.find((i) => i.type === 'node')?.nodeLabel ?? null,
    acessibilidade: a['color-contrast']?.score ?? null,
  }
}

/* ------------------------------------------------------------------ (2) */

const LENTO = { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 }

async function cenas(navegador) {
  const alvo = arg('cenas', null)
  const lista = alvo ? alvo.split(',') : CENAS
  const saida = []
  for (const id of lista) {
    const medidas = []
    for (let n = 1; n <= CORRIDAS; n++) {
      // Contexto novo por corrida: sem cache HTTP nem de disco herdada,
      // senão a 2.ª e 3.ª medem o site já guardado.
      const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } })
      const page = await ctx.newPage()
      const cdp = await ctx.newCDPSession(page)
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', { ...LENTO, connectionType: 'cellular4g' })
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

      const pedidos = []
      page.on('request', (r) => {
        const u = r.url()
        if (/\/cenas\/|\/_next\/static\/chunks\/.*\.js/.test(u)) pedidos.push({ t: Date.now(), u: u.replace(BASE, '') })
      })
      const paints = []
      page.on('response', async (r) => {
        const u = r.url().replace(BASE, '')
        if (!/\/cenas\/|\/_next\/static\/chunks\/.*\.js/.test(u)) return
        let tam = 0
        try {
          const h = r.headers()
          tam = Number(h['content-length'] ?? 0) || (await r.body()).length
        } catch {}
        paints.push({ t: Date.now(), ev: u.startsWith('/cenas/') ? 'json' : 'chunk', u, tam })
      })

      let cls = 0
      await page.exposeFunction('__cls', (v) => { cls += v })
      await page.addInitScript(() => {
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls(e.value)
        }).observe({ type: 'layout-shift', buffered: true })
      })

      const t0 = Date.now()
      // `commit` resolve assim que o navegador aceita a navegação; a
      // medição tem de começar aqui, não depois do `load` — estrangulado a
      // 1,6 Mbps o `load` só chega ~15 s e perde a cena inteira.
      await page.goto(`${BASE}/#${id}`, { waitUntil: 'commit' })
      // Sondar do Node em vez de um MutationObserver na página: sob CPU 4×
      // o observer, a forçar layout a cada mutação, passa de 30 s sem ver
      // o conteúdo. A sondagem é discreta e não depende do event loop da
      // página estrangulada.
      let carateres = 0
      let tDesenho = -1
      let onde = null
      while (Date.now() - t0 < 60000) {
        // A fábrica desenha o painel dela em `.b-painel`; as outras 10
        // cenas usam a moldura `.b-cena` da CenaDePerto. Medir só uma
        // delas dá «a cena não abre» numa cena que abre.
        const st = await page.evaluate(() => {
          for (const sel of ['div.b-cena', '.b-painel']) {
            const el = document.querySelector(sel)
            const n = el?.innerText?.trim().length ?? 0
            if (n > 80) return { n, sel }
          }
          return { n: 0, sel: null }
        })
        if (st.n > 80) { carateres = st.n; onde = st.sel; tDesenho = Date.now() - t0; break }
        await page.waitForTimeout(250)
      }
      if (tDesenho === -1) tDesenho = Date.now() - t0
      await page.waitForLoadState('load').catch(() => {})

      const fps = await page.evaluate(() => {
        const p = performance.getEntriesByType('paint')
        const f = p.find((x) => x.name === 'first-contentful-paint')
        return { fcp: Math.round(f?.startTime ?? -1), lcp: Math.round(performance.getEntriesByType('largest-contentful-paint').pop()?.startTime ?? -1) }
      })

      medidas.push({
        n,
        tDesenho,
        carateres,
        onde,
        fcp: fps.fcp,
        lcpReal: fps.lcp,
        cls: Number(cls.toFixed(5)),
        pedidos: pedidos.map((p) => ({ ...p, ms: p.t - t0 })),
        eventos: paints.map((p) => ({ ...p, ms: p.t - t0 })),
      })
      console.error(`cena ${id} #${n}: ${tDesenho} ms (${carateres} car.)`)
      await page.close()
      await ctx.close()
    }
    saida.push({ id, medidas })
  }
  return { quando: new Date().toISOString(), cenas: saida }
}

/* ------------------------------------------------------------------ (3) */

function html() {
  const n = Number(arg('vezes', '3'))
  const leituras = []
  for (let i = 0; i < n; i++) {
    const out = execFileSync(
      'curl',
      ['-s', '-H', 'Accept-Encoding: gzip', '-o', '/dev/null',
       '-w', '%{size_download} %{time_starttransfer} %{time_total} %{http_code}',
       `${BASE}/`],
      { encoding: 'utf8' },
    )
    const [bytes, ttfb, total, code] = out.split(' ')
    leituras.push({ quando: new Date().toISOString(), bytes: Number(bytes), ttfb: Number(ttfb), total: Number(total), code: Number(code) })
  }
  const cab = execFileSync('curl', ['-sI', `${BASE}/`], { encoding: 'utf8' })
  const compressao = /content-encoding:\s*(\S+)/i.exec(cab)?.[1] ?? null
  const raw = execFileSync('curl', ['-sI', '-H', 'Accept-Encoding: identity', `${BASE}/`], { encoding: 'utf8' })
  return {
    quando: new Date().toISOString(),
    leituras,
    bytesGzip: leituras[0]?.bytes ?? null,
    bytesRaw: Number(/content-length:\s*(\d+)/i.exec(raw)?.[1] ?? 0),
    contentEncoding: compressao,
    etag: /etag:\s*(\S+)/i.exec(cab)?.[1] ?? null,
    lastModified: /last-modified:\s*(.+)/i.exec(cab)?.[1]?.trim() ?? null,
    cacheControl: /cache-control:\s*(.+)/i.exec(cab)?.[1]?.trim() ?? null,
    edge: /x-github-edge-region:\s*(\S+)/i.exec(cab)?.[1] ?? null,
  }
}

/* ------------------------------------------------------------------ (4) */

async function axe(navegador) {
  const axePath = localiza('axe-core/axe.min.js', 'axe')
  const fs = await import('node:fs/promises')
  const fonte = await fs.readFile(axePath, 'utf8')
  const versao = JSON.parse(
    await fs.readFile(require_.resolve('axe-core/package.json', { paths: [dirname(axePath)] }), 'utf8'),
  ).version
  const alvos = [
    { nome: 'home', url: '/' },
    { nome: 'cena-aberta', url: '/#bomba' },
    ...['/salario', '/irs', '/impostos', '/poupanca', '/credito', '/casa', '/inflacao', '/precos', '/trabalho', '/dados', '/aprender', '/metodologia']
      .map((u) => ({ nome: u, url: u })),
  ]
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 } })
  const out = []
  for (const alvo of alvos) {
    const page = await ctx.newPage()
    await page.goto(`${BASE}${alvo.url}`, { waitUntil: 'load' })
    if (alvo.url.includes('#')) {
      await page.evaluate(() => new Promise((r) => {
        const el = document.querySelector('div.b-cena')
        if (!el) return r(null)
        const obs = new MutationObserver(() => {
          if (el.innerText.trim().length > 80) { obs.disconnect(); r(1) }
        })
        obs.observe(el, { childList: true, subtree: true, characterData: true })
        setTimeout(() => { obs.disconnect(); r(0) }, 8000)
      }))
    }
    await page.addScriptTag({ content: fonte })
    const r = await page.evaluate(async () => {
      const res = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] })
      return {
        violacoes: res.violations.map((v) => ({
          id: v.id,
          impacto: v.impact,
          ajuda: v.help,
          nodos: v.nodes.length,
          alvos: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        })),
        passes: res.passes.length,
        incompletos: res.incomplete.length,
      }
    })
    out.push({ ...alvo, ...r })
    console.error(`axe ${alvo.nome}: ${r.violacoes.length} violações`)
    await page.close()
  }
  await ctx.close()
  return { quando: new Date().toISOString(), axeCore: versao, alvos: out }
}

/* ------------------------------------------------------------------ main */

const cmd = process.argv[2]
let relatorio
if (cmd === 'lh') {
  relatorio = await lh()
} else if (cmd === 'lh-cenas') {
  relatorio = await lhCenas()
} else if (cmd === 'html') {
  relatorio = html()
} else if (cmd === 'cenas' || cmd === 'axe') {
  const exe = arg('chrome', process.env.CHROME_PATH ?? undefined)
  const navegador = await chromium.launch(exe ? { executablePath: exe } : {})
  relatorio = cmd === 'cenas' ? await cenas(navegador) : await axe(navegador)
  relatorio.carga = execFileSync('sysctl', ['-n', 'vm.loadavg'], { encoding: 'utf8' }).trim()
  await navegador.close()
} else {
  console.error('uso: _medir-publicado.mjs lh|lh-cenas|cenas|html|axe [--saida f] [--corridas n] [--chrome bin] [--rotas a,b] [--cenas a,b]')
  process.exit(1)
}

writeFileSync(SAIDA, JSON.stringify(relatorio, null, 2))
console.error(`escrito: ${SAIDA}`)