/* ——— Base comum das cenas de perto ———
   A moldura (desenho à esquerda, conversa à direita) cria-se sozinha no palco; cada cena só dá o desenho e os passos.
   Na implementação, isto é um componente <CenaDePerto> e cada cena um conjunto de passos. */
function cenaBase(id, quem, rotuloArte) {
  let cena = document.getElementById("cena-" + id);
  if (!cena) {
    palco.insertAdjacentHTML("beforeend", `<div class="cena-perto" id="cena-${id}" hidden role="dialog" aria-modal="false" aria-labelledby="${id}-quem">
      <div class="cena-arte"><svg viewBox="0 0 640 470" role="img" aria-label="${rotuloArte}"></svg></div>
      <div class="cena-texto"><button class="fechar" type="button" aria-label="Voltar ao bairro">×</button><span class="quem" id="${id}-quem">${quem}</span>
        <p class="fala" aria-live="polite"></p><div class="corpo" style="display:grid;gap:12px"></div><div class="acoes"></div><span class="fonte"></span></div></div>`);
    cena = document.getElementById("cena-" + id);
  }
  const q = (s) => cena.querySelector(s);
  const api = {
    cena, arte: q(".cena-arte svg"),
    fala: (h) => { q(".fala").innerHTML = h; },
    corpo: (h) => { q(".corpo").innerHTML = h; return q(".corpo"); },
    fonte: (t) => { q(".fonte").textContent = t; },
    topo: () => { cena.scrollTop = 0; palco.scrollTop = 0; palco.scrollLeft = 0; },
    botoes(lista) { const a = q(".acoes"); a.innerHTML = ""; lista.forEach(([t, fn, claro]) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (claro ? " claro" : ""); b.textContent = t; b.onclick = fn; a.appendChild(b); }); },
    abrir(desenho) { cena.hidden = false; api.arte.innerHTML = desenho; q(".corpo").innerHTML = ""; if (temG) gsap.fromTo(cena, { opacity: 0, scale: .96 }, { opacity: 1, scale: 1, duration: .35, ease: "power2.out" }); },
    fechar() { cena.hidden = true; mapa.querySelectorAll(".ed.ativo").forEach((g) => g.classList.remove("ativo")); },
    // o funcionário chama a senha seguinte: o painel pisca e muda
    senha(painelId, nova, bracoSel, depois) {
      const p = cena.querySelector("#" + painelId);
      if (temG) { gsap.timeline().to(p, { opacity: 0, duration: .12, repeat: 3, yoyo: true }).add(() => { p.textContent = nova; }); if (bracoSel) gsap.timeline({ delay: .4 }).to(cena.querySelectorAll(bracoSel), { rotation: -150, transformOrigin: "50% 0%", duration: .25 }).to(cena.querySelectorAll(bracoSel), { rotation: 0, duration: .3, delay: .5 }); }
      else p.textContent = nova;
      setTimeout(depois, temG ? 900 : 0);
    },
    palpite(id2, min, max, passo, valor, fmt, rotulo) {
      const c = q(".corpo"); c.insertAdjacentHTML("beforeend", `<div class="palpite-linha"><output id="${id2}Out"></output><input type="range" id="${id2}" min="${min}" max="${max}" step="${passo}" value="${valor}" aria-label="${rotulo}"></div>`);
      const el = cena.querySelector("#" + id2); el.oninput = () => cena.querySelector("#" + id2 + "Out").textContent = fmt(+el.value); el.oninput(); return el;
    },
  };
  q(".fechar").onclick = api.fechar;
  cena.onkeydown = (e) => { if (e.key === "Escape") api.fechar(); };
  return api;
}
const juizoPalpite = (palpite, real, perto, quase) => { const d = Math.abs(palpite - real); return d <= perto ? "Acertaste em cheio!" : d <= quase ? "Quase!" : palpite < real ? "Mais do que pensavas!" : "Menos do que pensavas!"; };

/* ——— Um só desenhador de gráficos de linhas (tempo no eixo x) ———
   series: [{ pts: [{t, v}], cor, larg, traco, rotulo }] · y: { min, max, passo, fmt } · marcas: [{ s, k, texto, cor, dx, dy, ancora }] */
function graficoLinhas(o) {
  const G = { x0: 56, x1: 500, y0: 250, y1: o.topo || 22 };
  const ts = [...new Set(o.series.flatMap((s) => s.pts.map((p) => p.t)))].sort(), n = ts.length, ix = new Map(ts.map((t, k) => [t, k]));
  const x = (t) => G.x0 + (G.x1 - G.x0) * ix.get(t) / (n - 1), y = (v) => G.y0 - (G.y0 - G.y1) * (v - o.y.min) / (o.y.max - o.y.min);
  let s = "";
  for (let v = o.y.min; v <= o.y.max + 1e-9; v += o.y.passo) s += `<path d="M${G.x0} ${y(v).toFixed(1)} H${G.x1}" stroke="currentColor" stroke-opacity="${o.y.realce === v ? .55 : .1}" ${o.y.realce === v ? 'stroke-dasharray="3 3"' : ""}/><text x="${G.x0 - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="11" fill="#6e675e" font-weight="${o.y.realce === v ? 800 : 400}">${o.y.fmt(v)}</text>`;
  let anoV = ""; ts.forEach((t) => { const a = t.slice(0, 4); if (a !== anoV && (+a - (o.anoPasso ? 0 : 1)) % (o.anoPasso || 1) === 0) s += `<text x="${x(t).toFixed(1)}" y="${G.y0 + 18}" text-anchor="middle" font-size="11" fill="#6e675e">${a}</text><path d="M${x(t).toFixed(1)} ${G.y0} v4" stroke="currentColor" stroke-opacity=".5"/>`; anoV = a; });
  if (o.faixa) { const [a, b] = o.faixa; s += `<path d="${o.series[a].pts.map((p, k) => `${k ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")} ${o.series[b].pts.slice().reverse().map((p) => `L${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")} Z" fill="${o.faixaCor || "#ffc62b"}" fill-opacity=".35"/>`; }
  o.series.forEach((se) => { s += `<path d="${se.pts.map((p, k) => `${k ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")}" fill="none" stroke="${se.cor}" stroke-width="${se.larg || 2.8}" ${se.traco ? `stroke-dasharray="${se.traco}"` : ""} stroke-linejoin="round"/>`; });
  s += `<path d="M${G.x0} ${G.y0} H${G.x1}" stroke="#16130f" stroke-width="2"/>`;
  let lx = G.x0 + 6; o.series.forEach((se) => { if (!se.rotulo) return; s += `<text x="${lx}" y="${G.y1 - 4}" font-family="Caveat" font-weight="700" font-size="18" fill="${se.corTexto || se.cor}">${se.rotulo}</text>`; lx += se.rotulo.length * 7.2 + 18; });
  (o.marcas || []).forEach((m) => { const p = o.series[m.s].pts[m.k < 0 ? o.series[m.s].pts.length + m.k : m.k]; const px = x(p.t), py = y(p.v);
    s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="5.5" fill="${m.cor}" stroke="#16130f" stroke-width="2"/><text x="${(px + (m.dx ?? 8)).toFixed(1)}" y="${(py + (m.dy ?? 4)).toFixed(1)}" text-anchor="${m.ancora || "start"}" font-family="Caveat" font-weight="700" font-size="18" fill="${m.corTexto || "#16130f"}" stroke="#fff" stroke-width="4" paint-order="stroke">${m.texto}</text>`; });
  return `<svg class="grafico-irs" viewBox="0 0 520 ${o.alto || 280}" role="img" aria-label="${o.aria}" font-family="Archivo">${s}</svg>`;
}
// muda a base de uma série para 100 num dado período
const rebase = (pts, t0) => { const b = pts.find((p) => p.t === t0).v; return pts.map((p) => ({ t: p.t, v: p.v / b * 100 })); };
// desenho de um interior genérico: parede, chão, placa do sítio
function paredeChao(corParede, corChao, placa, corPlaca = "#16130f", corTexto = "#fff") {
  return `<rect x="0" y="0" width="640" height="410" fill="${corParede}"/><rect x="0" y="410" width="640" height="60" fill="${corChao}" stroke="${K}" stroke-width="2.6"/>
    <rect x="${320 - placa.length * 7 - 24}" y="16" width="${placa.length * 14 + 48}" height="34" rx="6" fill="${corPlaca}" stroke="${K}" stroke-width="2.6"/><text x="320" y="40" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="17" letter-spacing=".06em" fill="${corTexto}">${placa}</text>`;
}
