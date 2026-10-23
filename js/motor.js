// Motor de periodización y de comparación entre lo planeado y lo registrado.
// No toca el DOM: recibe datos y devuelve datos.
import { r25, lunes, parse, fmt } from './util.js';
import { ejDe, MARCAS, SALTOS } from './ejercicios.js';

export const ENFOQUES = { fuerza: 'Fuerza (powerlifting)', hipertrofia: 'Hipertrofia', potencia: 'Potencia y pliometría', mixto: 'Mixto: fuerza + saltos' };
export const NIVEL = ['Principiante', 'Intermedio', 'Avanzado'];

// Fases por enfoque: peso relativo en el ciclo, %1RM, reps (inicio→fin), RPE, volumen relativo,
// vt = tendencia del volumen dentro del bloque (baja cuando sube la intensidad; se mantiene o sube si el volumen es el objetivo)
// plyo.f = fracción del tope de contactos para esa intensidad de salto
export const FASES = {
  fuerza: [
    { n: 'Acumulación', obj: 'Mucho trabajo con pesos moderados para construir la base.', w: .4, int: [65, 75], reps: [10, 6], rpe: [7, 8], vol: 1, vt: [1, 1], plyo: { f: .6, i: 'baja' } },
    { n: 'Transmutación', obj: 'Convertir esa base en fuerza: menos reps, más kilos.', w: .35, int: [75, 85], reps: [6, 3], rpe: [7.5, 8.5], vol: .85, vt: [1, .85], plyo: { f: .6, i: 'media' } },
    { n: 'Realización', obj: 'Pico de fuerza con poco volumen y test de 1RM al final.', w: .25, int: [85, 95], reps: [3, 1], rpe: [8.5, 9.5], vol: .6, vt: [1, .8], plyo: { f: .4, i: 'media' }, test: true }],
  hipertrofia: [
    { n: 'Acumulación', obj: 'Mucho volumen en rangos de 8 a 15 reps, cerca del fallo técnico.', w: .4, int: [60, 72], reps: [15, 8], rpe: [7, 8.5], vol: 1, vt: [1, 1], plyo: null },
    { n: 'Intensificación', obj: 'Subir cargas para que el mismo volumen vuelva a ser estímulo.', w: .3, int: [72, 82], reps: [8, 5], rpe: [8, 9], vol: .85, vt: [1, .9], plyo: null },
    { n: 'Sobrecarga', obj: 'Volumen máximo tolerable antes de la descarga.', w: .3, int: [65, 75], reps: [12, 8], rpe: [8, 9], vol: 1.12, vt: [.92, 1], plyo: null }],
  potencia: [
    { n: 'Base de fuerza', obj: 'Fuerza general y aprender a aterrizar bien.', w: .3, int: [70, 80], reps: [8, 5], rpe: [7, 8], vol: .95, vt: [1, 1], plyo: { f: .9, i: 'baja' } },
    { n: 'Fuerza máxima', obj: 'Subir el techo de fuerza que después se transfiere al salto.', w: .3, int: [80, 90], reps: [5, 3], rpe: [8, 9], vol: .8, vt: [1, .85], plyo: { f: .9, i: 'media' } },
    { n: 'Potencia', obj: 'Transferir fuerza a velocidad: contrastes y saltos intensos.', w: .25, int: [75, 85], reps: [4, 2], rpe: [7, 8], vol: .7, vt: [1, .8], plyo: { f: 1, i: 'alta' } },
    { n: 'Realización', obj: 'Llegar fresco y medir saltos y fuerza.', w: .15, int: [80, 90], reps: [3, 1], rpe: [7.5, 8.5], vol: .5, vt: [1, .8], plyo: { f: .6, i: 'alta' }, test: true }],
  mixto: [
    { n: 'Acumulación', obj: 'Volumen y masa muscular útil, con saltos de técnica.', w: .35, int: [65, 75], reps: [12, 6], rpe: [7, 8], vol: 1, vt: [1, 1], plyo: { f: .7, i: 'baja' } },
    { n: 'Fuerza', obj: 'Fuerza máxima acompañada de saltos de calidad.', w: .35, int: [78, 88], reps: [6, 3], rpe: [8, 9], vol: .82, vt: [1, .85], plyo: { f: .8, i: 'media' } },
    { n: 'Potencia', obj: 'Velocidad, saltos intensos y test final.', w: .3, int: [80, 90], reps: [3, 1], rpe: [7.5, 9], vol: .6, vt: [1, .8], plyo: { f: .9, i: 'alta' }, test: true }]
};
const PLYO_IF = { baja: 1, media: .75, alta: .45 }; // a más intensidad de salto, menos contactos

// Referencias de fuerza relativa (× peso corporal, hombres; mujeres ×0,72). Dominadas: (peso + lastre) / peso.
const REF = { sentadilla: 1.5, banca: 1, muerto: 1.8, militar: .65, arranque: .95, cargada: 1.2, dominadas: 1.45 };
const REF_J = { cmj: 55, largo: 260 }; // cm (hombres; mujeres ×0,8)
const nivelDe = s => s < .8 ? 0 : s < 1.15 ? 1 : 2;

// Nivel por marca y global ponderado: objetivos (ejercicio o grupo) pesan doble;
// saltos y olímpicos cuentan de lleno solo en potencia y mixto
export function nivel(p, objetivos) {
  const f = p.sexo === 'f' ? .72 : 1, fj = p.sexo === 'f' ? .8 : 1, pot = p.enfoque === 'potencia' || p.enfoque === 'mixto';
  const metas = new Set(), grupos = new Set(), por = {};
  (objetivos || []).forEach(o => o.tipo === 'grupo' ? grupos.add(o.grupo) : metas.add(o.clave));
  for (const k in REF) {
    if (!(p.rm[k] > 0 && p.peso > 0)) continue;
    por[k] = { s: k === 'dominadas' ? (p.peso + p.rm[k]) / p.peso / (REF[k] * (p.sexo === 'f' ? .8 : 1)) : p.rm[k] / p.peso / (REF[k] * f) };
  }
  for (const k in REF_J) if (p.salto[k] > 0) por[k] = { s: p.salto[k] / (REF_J[k] * fj) };
  let sum = 0, wt = 0;
  for (const k in por) {
    const salto = k in REF_J, oli = k === 'arranque' || k === 'cargada';
    let w = pot ? 1 : salto ? 0 : oli ? .5 : 1;
    if (w && (metas.has(k) || grupos.has(ejDe(k).g))) w *= 2;
    por[k].n = nivelDe(por[k].s); por[k].w = w; sum += por[k].s * w; wt += w;
  }
  let n = nivelDe(wt ? sum / wt : .6);
  if (p.experiencia < 1) n = 0; else if (p.experiencia < 2 && n === 2) n = 1;
  return { n, por };
}
// Semanas de carga antes de cada descarga: menos cuanto más avanzado o peor recuperación
export function semanasCarga(n, rec) { let L = [5, 4, 3][n]; if (rec >= 4) L++; if (rec <= 2) L--; return Math.max(2, Math.min(6, L)); }

function semana(tipo, f, fi, bi, i, t, bump, n, p) {
  const lerp = (a, b) => a + (b - a) * t, ilo = f.int[0] + bump, ihi = f.int[1] + bump;
  let vol = f.vol * lerp(f.vt[0], f.vt[1]), int = Math.min(97, lerp(ilo, ihi)), reps = Math.round(lerp(f.reps[0], f.reps[1])), rpe = lerp(f.rpe[0], f.rpe[1]);
  const tope = [80, 100, 120][n];
  let plyo = f.plyo && p.enfoque !== 'hipertrofia' ? { c: Math.round(tope * PLYO_IF[f.plyo.i] * f.plyo.f / 5) * 5, i: f.plyo.i } : null;
  if (tipo === 'descarga') { vol = f.vol * .5; int = Math.max(55, ilo - 7); reps = Math.round((f.reps[0] + f.reps[1]) / 2); rpe = 6; if (plyo) plyo = { c: Math.round(tope * .4 / 5) * 5, i: 'baja' }; }
  if (tipo === 'test') { vol = f.vol * .4; int = 97; reps = 1; rpe = 9.5; if (plyo) plyo = { c: 30, i: 'test' }; }
  const sets = tipo === 'descarga' ? 2 : tipo === 'test' ? 1 : vol >= .9 ? 4 : 3;
  return { tipo, fase: fi, bloque: bi, pos: i, vol, int, reps, rpe, plyo, sets };
}

// Competencia más próxima entre 3 y 40 semanas desde el inicio: el ciclo se arma hacia atrás desde ahí
export function elegirComp(p, inicio) {
  const c = (p.competencias || []).filter(c => c.fecha).map(c => ({ nombre: c.nombre || 'Competencia', fecha: c.fecha, w: (lunes(parse(c.fecha)) - inicio) / (7 * 864e5) }))
    .filter(c => c.w >= 3 && c.w <= 40).sort((a, b) => a.w - b.w)[0];
  return c ? { nombre: c.nombre, fecha: c.fecha } : null;
}

export function generar(cy, ciclos = []) {
  const p = cy.snap.perfil, nv = nivel(p, cy.snap.objetivos), L = p.carga || semanasCarga(nv.n, p.recuperacion), fases = FASES[p.enfoque], F = fases.length;
  const cnt = fases.map(() => 0); let loads, Lb = L, aviso = null;
  const reparto = (M, desde) => {
    for (let i = desde; i < F; i++) cnt[i] = 1;
    const ws = fases.slice(desde).reduce((a, f) => a + f.w, 0); let rest = M - (F - desde);
    while (rest-- > 0) { let best = desde, bd = -1e9; for (let i = desde; i < F; i++) { const d = fases[i].w / ws * M - cnt[i]; if (d > bd) { bd = d; best = i; } } cnt[best]++; }
  };
  if (cy.comp) {
    const W = Math.floor((lunes(parse(cy.comp.fecha)) - parse(cy.inicio)) / (7 * 864e5)) + 1;
    while (Lb > 2 && Math.floor(W / (Lb + 1)) < F) Lb--;
    const M = Math.max(1, Math.floor(W / (Lb + 1))), desde = Math.max(0, F - M);
    reparto(M, desde);
    loads = Array(M).fill(Lb); for (let rem = W - M * (Lb + 1), k = 0; rem > 0; rem--, k++) loads[k % M]++;
    if (desde > 0) aviso = `No entran todas las fases antes de la competencia: el ciclo arranca en ${fases[desde].n}.`;
    if (Lb < L) aviso = (aviso ? aviso + ' ' : '') + `Acorté los bloques a ${Lb}+1 para llegar a tiempo.`;
  } else {
    const M = Math.max(F, Math.round(p.duracion / (L + 1))); reparto(M, 0); loads = Array(M).fill(L);
  }
  const weeks = [], blocks = [], ov = cy.overrides || {};
  fases.forEach((f, fi) => {
    for (let r = 0; r < cnt[fi]; r++) {
      const lb = loads[blocks.length];
      blocks.push({ fase: fi, nombre: f.n, rep: r, total: cnt[fi], start: weeks.length, len: lb + 1 });
      const bi = blocks.length - 1, bump = r * 2.5, last = fi === F - 1 && r === cnt[fi] - 1 && (f.test || cy.comp);
      for (let i = 0; i < lb; i++) weeks.push(semana(ov[weeks.length] || 'carga', f, fi, bi, i, lb > 1 ? i / (lb - 1) : 1, bump, nv.n, p));
      weeks.push(semana(last ? 'test' : 'descarga', f, fi, bi, lb, 1, bump, nv.n, p));
    }
  });
  return { nivel: nv.n, niv: nv, L: Lb, weeks, blocks, fases, p, objetivos: cy.snap.objetivos || [], comp: cy.comp || null, aviso, hist: tasasPrevias(cy, ciclos) };
}

// Mejora mensual esperada según qué tan cerca está la marca de su techo (marca relativa / referencia):
// 0,6 → ~4,5%/mes · 1,0 → ~1,9% · 1,5 → ~0,6%. Estimación propia y conservadora; se calibra con el ciclo anterior.
const tasaMensual = s => Math.min(.05, Math.max(.004, .045 * Math.exp(-2.2 * (s - .6))));
function tasasPrevias(cy, ciclos) {
  const out = {}, i = ciclos.indexOf(cy), prev = i > 0 ? ciclos[i - 1] : null;
  if (!prev || !prev.cierre) return out;
  const c = prev.cierre, meses = (c.semanas || 16) / 4.33;
  for (const k in c.despues) if (c.antes[k] > 0 && c.despues[k] > 0) out[k] = (c.despues[k] / c.antes[k] - 1) / meses;
  return out;
}
export function proyeccion(plan, k) {
  const p = plan.p, isJ = SALTOS.includes(k), now = isJ ? p.salto[k] : p.rm[k];
  if (!(now > 0)) return null;
  const s = plan.niv.por[k] ? plan.niv.por[k].s : 1;
  let r = tasaMensual(s) * (isJ ? .7 : 1);
  if (isJ && p.enfoque === 'hipertrofia') r *= .2; if (!isJ && p.enfoque === 'hipertrofia') r *= .7; if (isJ && p.enfoque === 'fuerza') r *= .5;
  const obs = plan.hist[k], cal = obs != null; if (cal) r = .5 * r + .5 * Math.max(0, obs);
  const g = r * plan.weeks.length / 4.33;
  if (k === 'dominadas') { const tot = p.peso + now, proj = tot * (1 + g) - p.peso; return { now, proj, rate: (proj - now) / now, unit: 'kg', cal }; }
  return { now, proj: now * (1 + g), rate: g, unit: isJ ? 'cm' : 'kg', cal };
}
export function veredicto(pr, obj) {
  const need = obj / pr.now - 1;
  if (need <= 0) return ['Ya lo superás', 'v-ok'];
  const ratio = need / pr.rate;
  if (ratio <= 1) return ['Alcanzable en este ciclo', 'v-ok'];
  if (ratio <= 1.8) return ['Exigente: hay que clavar el plan', 'v-hard'];
  return ['Necesita ~' + Math.ceil(ratio) + ' ciclos', 'v-far'];
}

/* ---------- Lo que toca y lo que hiciste ---------- */
export const e1 = (kg, reps) => kg * (1 + reps / 30); // 1RM estimado (Epley)
export const rpeTxt = w => (Math.round(w.rpe * 2) / 2).toLocaleString('es');

// Qué toca esta semana en un ejercicio. nPlyo = cuántos saltos/lanzamientos hay en la sesión (se reparten los contactos)
export function objetivoEj(plan, w, ejId, nPlyo = 1) {
  const d = ejDe(ejId), p = plan.p;
  if (d.t === 'salto' || d.t === 'lanzamiento') {
    if (w.tipo === 'test' && d.marca) return { texto: 'Test: 3 intentos, anotá la mejor marca', sets: 3, reps: 1 };
    if (!w.plyo) return { texto: '3 × 5, rápidos y con buena técnica', sets: 3, reps: 5 };
    // Series cortas (máximo 8 saltos) para que cada uno salga con calidad; si hay más contactos, más series
    const tot = w.plyo.c / Math.max(1, nPlyo), reps = Math.min(8, Math.max(3, Math.round(tot / 3)));
    const sets = w.tipo === 'descarga' ? 2 : Math.max(2, Math.min(6, Math.round(tot / reps)));
    return { texto: `${sets} × ${reps} · intensidad ${w.plyo.i}`, sets, reps };
  }
  if (d.t === 'tiempo') { const sets = w.tipo === 'descarga' ? 2 : 3; return { texto: `${sets} × 30 s`, sets, seg: 30 }; }
  const baseK = d.base ? d.id : d.rel ? d.rel[0] : null, frac = d.rel ? d.rel[1] : 1, rm = baseK ? p.rm[baseK] : 0;
  const lastre = d.t === 'lastre', oli = d.g === 'olimpicos';
  if (w.tipo === 'test') {
    if (!d.base) return { texto: 'Opcional y liviano', sets: 2, reps: 8 };
    if (!(rm > 0)) return { texto: 'Test: subí de a poco hasta un máximo con buena técnica', sets: 5, reps: 1 };
    const pr = r25(proyeccion(plan, baseK).proj);
    return { texto: `Test: aproximaciones (50%×5, 70%×3, 85%×1, 92%×1) y un intento a ${fmt(pr, 'kg')}${lastre ? ' de lastre' : ''}`, sets: 5, reps: 1, kg: pr };
  }
  // Olímpicos: series cortas y rápidas, nunca más de 3 repeticiones
  const sets = oli ? (w.tipo === 'descarga' ? 3 : 5) : w.sets, reps = oli ? Math.min(w.reps, w.tipo === 'descarga' ? 2 : 3) : w.reps;
  const pct = (oli ? Math.min(.9, Math.max(.7, w.int / 100 + .1)) : w.int / 100) * frac;
  if (baseK && rm > 0) {
    // Con lastre, el porcentaje se aplica sobre peso corporal + lastre
    const kg = lastre ? Math.max(0, r25((p.peso + rm) * pct - p.peso)) : r25(rm * pct);
    const con = lastre ? (kg > 0 ? `${fmt(kg, 'kg')} de lastre` : 'peso corporal') : fmt(kg, 'kg');
    return { texto: `${sets} × ${reps} con ${con}`, sets, reps, kg, pct, conRM: true };
  }
  if (d.base) return { texto: `${sets} × ${reps} a RPE ${rpeTxt(w)}. Con lo que levantes calculo tu 1RM`, sets, reps, pct };
  return { texto: `${sets} × ${reps} a RPE ${rpeTxt(w)}`, sets, reps };
}

const total = (d, kg, peso) => d.t === 'lastre' ? peso + (kg || 0) : kg || 0;
// Serie más pesada (en 1RM estimado) de una entrada registrada
export function mejorSerie(en, peso) {
  const d = ejDe(en.e);
  return en.s.filter(x => x.reps > 0).reduce((b, x) => { const v = e1(total(d, x.kg, peso), x.reps); return !b || v > b.v ? { ...x, v } : b; }, null);
}
// 1RM que implica lo registrado según el mismo modelo del plan: hacer justo lo planeado = tu 1RM actual.
// Así una serie submáxima a RPE 7 no aparece como "bajaste". Las descargas no cuentan.
export function rmImplicito(plan, wi, en) {
  const d = ejDe(en.e); if (!d.base || (d.t !== 'carga' && d.t !== 'lastre')) return 0;
  const w = plan.weeks[wi]; if (!w || w.tipo === 'descarga') return 0;
  const P = plan.p.peso || 0, t = mejorSerie(en, P); if (!t || !(total(d, t.kg, P) > 0)) return 0;
  let tot;
  if (w.tipo === 'test') tot = t.reps === 1 ? total(d, t.kg, P) : t.v;
  else {
    const o = objetivoEj(plan, w, en.e); if (!o.pct) return 0;
    // Con 1RM conocido se compara contra los kilos sugeridos ya redondeados: hacer lo planeado = mismo 1RM, sin falsos -1%
    if (o.conRM) tot = total(d, plan.p.rm[en.e], P) * t.v / e1(total(d, o.kg, P), o.reps);
    else tot = t.v / (o.pct * (1 + o.reps / 30));
  }
  return d.t === 'lastre' ? tot - P : tot;
}
// Cada ejercicio registrado en la semana, con su relación contra lo planeado (solo con 1RM y en semanas de carga)
export function rendimientoSemana(plan, cy, wi) {
  const w = plan.weeks[wi], W = (cy.logs || {})[wi] || {}, out = [], P = plan.p.peso || 0;
  for (const sid in W) for (const id in W[sid].ej) {
    const en = W[sid].ej[id], d = ejDe(en.e); if (!en.s.length) continue;
    let ratio = null;
    if (w.tipo === 'carga' && (d.t === 'carga' || d.t === 'lastre')) {
      const o = objetivoEj(plan, w, en.e), t = mejorSerie(en, P);
      if (o.conRM && t) ratio = t.v / e1(total(d, o.kg, P), o.reps);
    }
    out.push({ sid, id, en, ratio });
  }
  return out;
}
export function veredictoSemana(plan, cy, wi) {
  const r = rendimientoSemana(plan, cy, wi).filter(x => x.ratio != null);
  if (!r.length) return null;
  const avg = r.reduce((a, x) => a + x.ratio, 0) / r.length;
  return { avg, cls: avg >= 1 ? 't-up' : avg >= .95 ? 't-mid' : 't-down', txt: avg >= 1.005 ? `${Math.round((avg - 1) * 100) || 1}% arriba de lo planeado` : avg >= .95 ? 'En línea con lo planeado' : `${Math.round((1 - avg) * 100)}% abajo de lo planeado` };
}
// Descarga anticipada: una semana muy por debajo o dos seguidas por debajo
export function sugerirDescarga(plan, cy, wi) {
  const w = plan.weeks[wi], next = plan.weeks[wi + 1];
  if (!next || next.tipo !== 'carga' || w.tipo !== 'carga') return false;
  const a = veredictoSemana(plan, cy, wi), b = wi > 0 && plan.weeks[wi - 1].tipo === 'carga' ? veredictoSemana(plan, cy, wi - 1) : null;
  return !!a && (a.avg < .9 || (a.avg < .95 && !!b && b.avg < .95));
}
const recorrer = (cy, fn) => {
  const L = cy.logs || {};
  Object.keys(L).map(Number).sort((a, b) => a - b).forEach(wi => {
    const ss = Object.values(L[wi]).sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);
    ss.forEach((lg, j) => fn(wi, lg, j, ss.length));
  });
};
// 1RM estimados que superan el registrado (o que no existía)
export function records(plan, cy) {
  const best = {};
  recorrer(cy, (wi, lg) => { for (const id in lg.ej) { const en = lg.ej[id], v = rmImplicito(plan, wi, en); if (v > (best[en.e] || 0)) best[en.e] = v; } });
  return Object.keys(best).map(k => ({ k, v: r25(best[k]) })).filter(r => r.v > 0 && MARCAS.includes(r.k) && (!(plan.p.rm[r.k] > 0) || r.v >= plan.p.rm[r.k] + 2.5));
}
export function puntosLift(plan, cy, k) {
  const pts = [];
  recorrer(cy, (wi, lg, j, n) => { let best = 0; for (const id in lg.ej) { const en = lg.ej[id]; if (en.e === k) best = Math.max(best, rmImplicito(plan, wi, en)); } if (best > 0) pts.push({ x: wi + (j + .5) / n, v: best }); });
  return pts;
}
export function puntosSalto(cy, k) {
  const pts = [];
  recorrer(cy, (wi, lg, j, n) => { let best = 0; for (const id in lg.ej) { const en = lg.ej[id]; if (en.e === k) en.s.forEach(x => { if (x.marca > best) best = x.marca; }); } if (best > 0) pts.push({ x: wi + (j + .5) / n, v: best }); });
  (cy.saltos || []).filter(x => x.k === k).forEach(x => pts.push({ x: x.wi + .5, v: x.v }));
  return pts.sort((a, b) => a.x - b.x);
}
// Valor comparable de una entrada: 1RM estimado (pesos), mejor marca (saltos/lanzamientos) o segundos
function valor(en, peso) {
  const d = ejDe(en.e);
  if (d.t === 'salto' || d.t === 'lanzamiento') { const m = Math.max(0, ...en.s.map(x => x.marca || 0)); return m || null; }
  if (d.t === 'tiempo') return Math.max(0, ...en.s.map(x => x.seg || 0)) || null;
  const t = mejorSerie(en, peso); return t && t.v > 0 ? t.v : null;
}
// Cambio por ejercicio entre la primera vez y la última, para todos los ejercicios de un grupo (o todos si no se pasa grupo)
export function cambios(plan, cy, grupo) {
  const r = {};
  recorrer(cy, (wi, lg) => {
    for (const id in lg.ej) {
      const en = lg.ej[id], d = ejDe(en.e); if (grupo && d.g !== grupo) continue;
      const v = valor(en, plan.p.peso || 0); if (v == null) continue;
      if (!r[en.e]) r[en.e] = { e: en.e, first: v, firstEn: en };
      r[en.e].last = v; r[en.e].lastEn = en;
    }
  });
  return Object.values(r).map(x => ({ ...x, cambio: x.first > 0 ? (x.last / x.first - 1) * 100 : 0 }));
}
export function promedioGrupo(plan, cy, g) {
  const c = cambios(plan, cy, g).filter(x => x.firstEn !== x.lastEn);
  return c.length ? c.reduce((a, x) => a + x.cambio, 0) / c.length : null;
}
// Última vez que se registró un ejercicio (por ejercicio, no por lugar en la rutina: sobrevive a cambios de rutina)
export function ultimaEntrada(cy, e, antes) {
  const L = cy.logs || {};
  for (let wi = antes - 1; wi >= 0; wi--) {
    const W = L[wi]; if (!W) continue;
    for (const sid in W) for (const id in W[sid].ej) { const en = W[sid].ej[id]; if (en.e === e && en.s.length) return en; }
  }
  return null;
}
