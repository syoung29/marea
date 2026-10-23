// Kilo (la pesa rusa) y Disco (el disco de pesas): dibujo, escena de mareas y comportamiento
import { $, $$, esc } from './util.js';

export const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

// mood: happy | sleep (descarga) | focus (test, con vincha)
export function kilo(cls = '', mood = 'happy', id = '') {
  const eyes = mood === 'sleep'
    ? `<path d="M36 55q4 3 8 0M56 55q4 3 8 0" fill="none" stroke="var(--kilo-eye)" stroke-width="2.2" stroke-linecap="round"/>`
    : `<g class="k-eyes"><ellipse cx="40" cy="54" rx="3.6" ry="4.6" fill="var(--kilo-eye)"/><ellipse cx="60" cy="54" rx="3.6" ry="4.6" fill="var(--kilo-eye)"/></g>`;
  const mouth = mood === 'sleep' ? `<ellipse cx="50" cy="65" rx="2.2" ry="2.6" fill="var(--kilo-eye)"/>`
    : mood === 'focus' ? `<path d="M45 65h10" stroke="var(--kilo-eye)" stroke-width="2.2" stroke-linecap="round"/>`
    : `<path d="M45 63q5 4 10 0" fill="none" stroke="var(--kilo-eye)" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<svg class="kilo-svg ${cls} ${mood === 'sleep' ? 'nap' : ''}" ${id ? `id="${id}" role="img" aria-label="Kilo, la mascota. Tocalo para un consejo"` : 'aria-hidden="true"'} viewBox="0 0 100 90">
    <g class="k-body">
      <path d="M32 40c0-22 36-22 36 0" fill="none" stroke="var(--kilo)" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="38" cy="86" rx="7" ry="3.5" fill="var(--kilo)"/><ellipse cx="62" cy="86" rx="7" ry="3.5" fill="var(--kilo)"/>
      <ellipse cx="22" cy="64" rx="5" ry="8.5" fill="var(--kilo)" transform="rotate(22 22 64)"/>
      <g class="k-arm"><ellipse cx="79" cy="64" rx="5" ry="8.5" fill="var(--kilo)" transform="rotate(-22 79 64)"/></g>
      <ellipse cx="50" cy="60" rx="30" ry="26" fill="var(--kilo)"/>
      ${mood === 'focus' ? `<path d="M23 47q27 -10 54 0" fill="none" stroke="var(--load)" stroke-width="5" stroke-linecap="round"/>` : ''}
      <g class="k-look">${eyes}<circle cx="32" cy="62" r="4" fill="var(--load)" opacity=".45"/><circle cx="68" cy="62" r="4" fill="var(--load)" opacity=".45"/>${mouth}</g>
    </g>
    ${mood === 'sleep' ? `<text class="k-z" x="76" y="30">z</text><text class="k-z z2" x="83" y="20">z</text>` : ''}
  </svg>`;
}
export const disco = () => `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="var(--load)"/><circle cx="20" cy="20" r="12.5" fill="none" stroke="var(--kilo)" stroke-opacity=".22" stroke-width="1.6"/><circle cx="20" cy="20" r="4.2" fill="var(--sky2)"/><circle cx="14.5" cy="12.5" r="1.8" fill="var(--kilo)"/><circle cx="25.5" cy="12.5" r="1.8" fill="var(--kilo)"/><path d="M15.5 27.5q4.5 3 9 0" fill="none" stroke="var(--kilo)" stroke-width="1.6" stroke-linecap="round"/></svg>`;

function ola(y, a, lam) { let d = `M0 ${y} Q ${lam / 4} ${y - a} ${lam / 2} ${y}`; for (let x = lam / 2; x < 2400; x += lam / 2) d += ` T ${x + lam / 2} ${y}`; return d + ' V 200 H 0 Z'; }
// La marea sube en semanas de carga, baja en descarga y está alta en el test
export function escena(o) {
  const off = { carga: 0, descarga: 16, test: -12 }[o.tipo || 'carga'], mood = o.tipo === 'descarga' ? 'sleep' : o.tipo === 'test' ? 'focus' : 'happy';
  const lvl = ((200 - (172 + off)) / 200 * 100).toFixed(1);
  return `<section class="scene ${o.tall ? 'tall' : ''}" style="--lvl:${lvl}%" aria-label="${esc(o.label || 'Resumen')}">
    <svg class="waves" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true"><g transform="translate(0 ${off})">
      <path class="w3" d="${ola(126, 9, 600)}"/><path class="w2" d="${ola(142, 8, 400)}"/><path class="w1" d="${ola(157, 7, 300)}"/></g></svg>
    <div class="spray" aria-hidden="true">${[14, 29, 46, 63, 80].map((x, i) => `<i style="left:${x}%;animation-delay:${i * 1.4}s"></i>`).join('')}</div>
    <div class="scene-txt">${o.eyebrow ? `<div class="eyebrow">${o.eyebrow}</div>` : ''}<h1>${o.titulo}</h1>${o.sub ? `<p>${o.sub}</p>` : ''}</div>
    <div class="disco scene-disco" id="disco">${disco()}</div>
    <div class="float-kilo">${kilo('', mood, 'kilo')}</div>
    <svg class="waves front" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true"><g transform="translate(0 ${off})"><path class="w0" d="${ola(172, 6, 240)}"/></g></svg>
    <div class="bubble" id="bubble" role="status"></div>
  </section>`;
}

export const act = (k, c, ms) => { if (!k || REDUCE) return; k.classList.remove(c); void k.getBoundingClientRect(); k.classList.add(c); setTimeout(() => k.classList.remove(c), ms); };
const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };

// Mirada: los Kilos despiertos siguen el puntero o el dedo; si no hay movimiento, miran a los costados solos
function lookAt(x, y) {
  $$('.kilo-svg:not(.nap)').forEach(k => {
    const r = k.getBoundingClientRect(); if (!r.width) return;
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height * .6), d = Math.hypot(dx, dy) || 1;
    k.style.setProperty('--lx', (dx / d * 3.2).toFixed(2)); k.style.setProperty('--ly', (dy / d * 2.2).toFixed(2));
  });
}
const lookAround = k => { k.style.setProperty('--lx', (Math.random() * 6.4 - 3.2).toFixed(1)); k.style.setProperty('--ly', (Math.random() * 3 - 1.5).toFixed(1)); };

// Disco cruza la escena y frena a saludar a Kilo
export function rodarEscena() {
  const d = $('#disco'); if (!d || REDUCE) return false;
  d.classList.remove('roll'); void d.offsetWidth; d.classList.add('roll');
  setTimeout(() => act($('#kilo'), 'waving', 1900), 4000);
  return true;
}
// Márgenes seguros del teléfono (barra de estado, borde inferior), medidos con un elemento invisible
function margenes() {
  const p = document.createElement('div');
  p.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(p); const c = getComputedStyle(p);
  const m = { t: parseFloat(c.paddingTop) || 0, r: parseFloat(c.paddingRight) || 0, b: parseFloat(c.paddingBottom) || 0, l: parseFloat(c.paddingLeft) || 0 };
  p.remove(); return m;
}
// Disco da una vuelta completa por el borde de la pantalla, rodando (gira según la distancia que avanza)
let vuelta = 0, ultimaVuelta = 0;
export function vueltaDisco() {
  if (REDUCE || vuelta) return;
  const el = document.createElement('div'); el.className = 'disco-tour'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = disco();
  document.body.appendChild(el);
  const T = 28, sep = 6, vel = 240, ins = margenes(), t0 = performance.now();
  ultimaVuelta = Date.now();
  const paso = now => {
    const x0 = ins.l + sep, y0 = ins.t + sep, w = innerWidth - ins.l - ins.r - 2 * sep - T, h = innerHeight - ins.t - ins.b - 2 * sep - T, P = 2 * (w + h);
    const d = (now - t0) / 1000 * vel;
    if (d >= P || w <= 0 || h <= 0) { el.remove(); vuelta = 0; return; }
    let x, y;
    if (d < w) { x = d; y = 0; } else if (d < w + h) { x = w; y = d - w; } else if (d < 2 * w + h) { x = w - (d - w - h); y = h; } else { x = 0; y = h - (d - 2 * w - h); }
    el.style.opacity = Math.min(1, d / 60, (P - d) / 60);
    el.style.transform = `translate(${x0 + x}px,${y0 + y}px) rotate(${d / (T / 2) * 57.3}deg)`;
    vuelta = requestAnimationFrame(paso);
  };
  vuelta = requestAnimationFrame(paso);
}
export function rodarDisco() {
  if (REDUCE) return;
  const d = $('#disco');
  if (d && visible(d.parentElement) && Math.random() < .5) { rodarEscena(); return; }
  if (Date.now() - ultimaVuelta > 40000) vueltaDisco();
}

let sayFn = () => {};
export const decir = (txt, ms) => sayFn(txt, ms);
// Conecta el Kilo de la escena actual: globito de texto y consejos al tocarlo. Habla solo cuando hay algo que decir.
export function conectarKilo(consejos = []) {
  const k = $('#kilo'), bub = $('#bubble');
  if (!k || !bub) { sayFn = () => {}; return; }
  let n = 0;
  sayFn = (txt, ms = 5600) => {
    const t = txt || consejos[n++ % Math.max(1, consejos.length)]; if (!t) return;
    bub.textContent = t; bub.classList.add('on'); act(k, 'waving', 1900);
    clearTimeout(sayFn.t); sayFn.t = setTimeout(() => bub.classList.remove('on'), ms);
  };
  k.onclick = () => sayFn();
}

let iniciado = false;
export function iniciarMascotas() {
  if (iniciado) return; iniciado = true;
  let raf = 0, quieto = 0;
  addEventListener('pointermove', e => {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; lookAt(e.clientX, e.clientY); });
    clearTimeout(quieto); quieto = setTimeout(() => $$('.kilo-svg').forEach(lookAround), 5000);
  }, { passive: true });
  addEventListener('pointerdown', e => lookAt(e.clientX, e.clientY), { passive: true });
  // Vida propia: cada tanto un Kilo visible saluda, salta o mira alrededor; Disco pasa rodando
  setInterval(() => {
    if (document.hidden || REDUCE) return;
    const ks = $$('.kilo-svg:not(.nap)').filter(visible); if (!ks.length) return;
    const k = ks[Math.floor(Math.random() * ks.length)], r = Math.random();
    if (r < .3) act(k, 'waving', 1900); else if (r < .5) act(k, 'hop', 950); else lookAround(k);
  }, 6000);
  setInterval(() => { if (!document.hidden) rodarDisco(); }, 15000);
}
