// Marea: interfaz. Estado, pantallas, primeros pasos, modales y eventos.
import { $, $$, esc, r25, clone, iso, parse, lunes, addD, fd, fmt, nid } from './util.js';
import { GRUPOS, TIPOS, MARCAS, SALTOS, EXTRA_GRUPO, ejDe, todos, registrarPropios } from './ejercicios.js';
import {
  ENFOQUES, NIVEL, generar, elegirComp, proyeccion, veredicto, objetivoEj, rpeTxt, rendimientoSemana, veredictoSemana,
  sugerirDescarga, records, puntosLift, puntosSalto, cambios, promedioGrupo, ultimaEntrada, mejorSerie
} from './motor.js';
import { kilo, escena, act, decir, conectarKilo, iniciarMascotas, rodarEscena, vueltaDisco, REDUCE } from './mascotas.js';

const LS = 'marea.datos';
const nombreDe = k => ejDe(k).n;
const corto = k => nombreDe(k).replace(/ \(.*\)/, '');
const TIPO = { carga: 'Carga', descarga: 'Descarga', test: 'Test' };
const tipoTxt = (plan, w) => w.tipo === 'test' && plan.comp ? 'Competencia' : TIPO[w.tipo];
const esPlio = e => { const t = ejDe(e).t; return t === 'salto' || t === 'lanzamiento'; };

const AYUDA = {
  rm: ['1RM', 'Tu repetición máxima: el peso más alto que podés levantar una sola vez con buena técnica. Marea calcula los kilos de cada semana como un porcentaje de tu 1RM. En dominadas con lastre, es el lastre máximo para una repetición.'],
  rpe: ['RPE', 'Qué tan dura fue una serie, del 1 al 10. RPE 8 = te quedaban unas 2 repeticiones. RPE 10 = no podías hacer ni una más. Si el RPE se te va arriba del objetivo, bajá un poco el peso.'],
  contactos: ['Contactos', 'Cada vez que los pies tocan el piso en un salto (o cada lanzamiento) cuenta como un contacto. Sirve para dosificar la pliometría: a saltos más intensos, menos contactos.'],
  intensidad: ['Intensidad', 'Qué tan pesado es el trabajo, como porcentaje de tu 1RM. 80% de un 1RM de 100 kg son 80 kg.'],
  descarga: ['Descarga', 'Una semana más liviana, con menos series y menos peso, para recuperarte y consolidar lo entrenado. Sin descargas la fatiga se acumula y el progreso se frena.'],
  fase: ['Fases', 'El ciclo se divide en fases con objetivos distintos. Acumulación: mucho trabajo con pesos moderados. Fuerza: menos repeticiones y más kilos. Potencia: velocidad y saltos intensos. Realización o test: poco volumen para llegar fresco y medir.'],
  bloque: ['Bloque', 'Un paquete de semanas de carga seguido de una semana de descarga. El ciclo encadena varios bloques.'],
  proyeccion: ['Proyección', 'Lo que estimo que vas a levantar al cierre del ciclo si seguís el plan. Avanza más lento cuanto más cerca estás de tu techo. Después del primer ciclo, se ajusta con tus datos reales.'],
  trabajo: ['Trabajo semanal', 'Cuánto entrenás en la semana: series por repeticiones. Las barras altas son semanas con mucho trabajo; las bajas, descargas.']
};
const ay = t => `<button class="q" type="button" data-act="ayuda" data-t="${t}" aria-label="¿Qué significa ${esc(AYUDA[t][0])}?">?</button>`;

/* ================= RUTINA SUGERIDA ================= */
// [nombre, ejercicios, ¿día de pierna? (ahí van los saltos y olímpicos)]
const SPLITS = {
  2: [['Cuerpo completo A', ['sentadilla', 'banca', 'remo_barra'], 1], ['Cuerpo completo B', ['muerto', 'militar', 'dominadas'], 1]],
  3: [['Cuerpo completo A', ['sentadilla', 'banca', 'remo_barra'], 1], ['Cuerpo completo B', ['muerto', 'militar', 'dominadas'], 0], ['Cuerpo completo C', ['sentadilla_frontal', 'inclinado_mancuernas', 'hip_thrust'], 1]],
  4: [['Pierna · fuerza', ['sentadilla', 'zancadas', 'curl_isquios'], 1], ['Torso · fuerza', ['banca', 'remo_barra', 'fondos'], 0], ['Pierna · bisagra', ['muerto', 'hip_thrust', 'gemelos'], 1], ['Torso · volumen', ['militar', 'dominadas', 'inclinado_mancuernas'], 0]],
  5: [['Pierna · fuerza', ['sentadilla', 'zancadas', 'curl_isquios'], 1], ['Empuje', ['banca', 'militar', 'fondos'], 0], ['Tirón', ['muerto', 'remo_barra', 'dominadas'], 0], ['Pierna · potencia', ['sentadilla_frontal', 'hip_thrust', 'gemelos'], 1], ['Torso · volumen', ['inclinado_mancuernas', 'remo_mancuerna', 'laterales'], 0]],
  6: [['Empuje A', ['banca', 'inclinado_mancuernas', 'fondos'], 0], ['Tirón A', ['muerto', 'remo_barra', 'biceps'], 0], ['Pierna A', ['sentadilla', 'zancadas', 'curl_isquios'], 1], ['Empuje B', ['militar', 'inclinado', 'laterales'], 0], ['Tirón B', ['dominadas', 'remo_mancuerna', 'face_pull'], 0], ['Pierna B', ['sentadilla_frontal', 'hip_thrust', 'gemelos'], 1]]
};
function rutinaBase(p, objetivos = []) {
  const pot = p.enfoque === 'potencia' || p.enfoque === 'mixto', item = e => ({ id: nid('i'), e });
  const tiene = k => p.rm[k] > 0 || !!(p.nose || {})[k];
  const r = (SPLITS[p.dias] || SPLITS[4]).map(([nombre, ejs, pierna]) => ({ id: nid('s'), nombre, pierna: !!pierna, items: ejs.map(item) }));
  const piernas = r.filter(s => s.pierna);
  if (p.enfoque !== 'hipertrofia' && piernas.length) {
    const plio = pot ? [['cmj', 'lanz_vertical'], ['largo', 'lanz_horizontal']] : [['salto_cajon'], ['salto_cajon']];
    piernas.forEach((s, i) => s.items.unshift(...plio[i % 2].map(item)));
  }
  const trasSaltos = (s, e) => { const i = s.items.findIndex(x => !esPlio(x.e)); s.items.splice(i < 0 ? s.items.length : i, 0, item(e)); };
  if (pot && piernas.length) {
    if (tiene('cargada')) trasSaltos(piernas[0], 'cargada');
    if (tiene('arranque')) trasSaltos(piernas[1] || piernas[0], 'arranque');
  }
  const menosCargada = () => [...r].sort((a, b) => a.items.length - b.items.length)[0];
  objetivos.filter(o => o.tipo === 'grupo').forEach(o => {
    const e = EXTRA_GRUPO[o.grupo]; if (!e || r.some(s => s.items.some(i => i.e === e))) return;
    (r.find(s => s.items.some(i => ejDe(i.e).g === o.grupo)) || menosCargada()).items.push(item(e));
  });
  objetivos.filter(o => o.tipo === 'ej').forEach(o => { if (!r.some(s => s.items.some(i => i.e === o.clave))) menosCargada().items.push(item(o.clave)); });
  r.forEach(s => delete s.pierna);
  return r;
}

/* ================= ESTADO Y GUARDADO ================= */
let state = null, saludado = false;
const ui = { view: 'onb', tab: 'semana', wk: null, planSel: null, open: null, paso: 0, draft: null, descartados: new Set(), celebrar: null, justCreated: false };

const nuevoCiclo = (p, objetivos, inicio) => ({ id: nid('c'), inicio: iso(inicio), comp: elegirComp(p, inicio), snap: clone({ perfil: p, objetivos }), overrides: {}, logs: {}, saltos: [], inicioRM: { ...p.rm, ...p.salto }, cierre: null });
const inicioDe = cuando => { const b = lunes(new Date()); return cuando === 'este' ? b : addD(b, 7); };
function crearPlan(p, objetivos, cuando) {
  state = { v: 3, ejemplo: false, perfil: p, objetivos, rutina: rutinaBase(p, objetivos), rutinaModo: 'auto', propios: [], ciclos: [nuevoCiclo(p, objetivos, inicioDe(cuando))] };
}
function ejemplo() {
  const perfil = { nombre: '', edad: 24, sexo: 'm', peso: 78, altura: 178, experiencia: 1.5, enfoque: 'potencia', dias: 4, recuperacion: 3, duracion: 20, carga: 0,
    rm: { sentadilla: 130, banca: 95, muerto: 160, militar: 60, dominadas: 15, cargada: 85 }, salto: { cmj: 48, largo: 245 }, nose: {}, competencias: [] };
  const objetivos = [{ tipo: 'ej', clave: 'sentadilla', objetivo: 140 }, { tipo: 'grupo', grupo: 'traccion' }, { tipo: 'ej', clave: 'cmj', objetivo: 52 }];
  const ini = addD(lunes(new Date()), -35), comp = { nombre: 'Torneo de ejemplo', fecha: iso(addD(ini, 19 * 7 + 5)) };
  perfil.competencias = [comp];
  const rutina = rutinaBase(perfil, objetivos);
  const cy = { ...nuevoCiclo(perfil, objetivos, ini), comp };
  const plan = generar(cy, [cy]);
  for (let wi = 0; wi < 5; wi++) {
    const w = plan.weeks[wi]; cy.logs[wi] = {};
    rutina.forEach((s, j) => {
      const nP = s.items.filter(i => esPlio(i.e)).length, ej = {};
      s.items.forEach((it, q) => {
        const d = ejDe(it.e), o = objetivoEj(plan, w, it.e, nP); let sets;
        if (esPlio(it.e)) sets = Array.from({ length: o.sets }, () => ({ reps: o.reps, marca: d.marca === 'cm' ? (it.e === 'largo' ? 245 : 47) + wi * .5 : d.marca === 'm' ? 8 + wi * .1 : null }));
        else if (d.t === 'tiempo') sets = [{ seg: 30 }, { seg: 30 }, { seg: 35 }];
        else if (o.conRM) sets = Array.from({ length: o.sets }, (_, i) => ({ kg: o.kg + (wi > 1 && i === 0 && w.tipo === 'carga' ? 2.5 : 0), reps: o.reps }));
        else { const kg = d.t === 'lastre' ? 0 : 20 + 5 * q + 2.5 * wi; sets = [{ kg, reps: 10 }, { kg, reps: 10 }, { kg, reps: 9 }]; }
        ej[it.id] = { e: it.e, s: sets };
      });
      cy.logs[wi][s.id] = { fecha: iso(addD(ini, wi * 7 + j * 2)), ej };
    });
  }
  return { v: 3, ejemplo: true, perfil, objetivos, rutina, rutinaModo: 'auto', propios: [], ciclos: [cy] };
}
function migrar(s) {
  s.perfil.nose = s.perfil.nose || {}; s.propios = s.propios || []; s.rutinaModo = s.rutinaModo || 'auto';
  s.objetivos = (s.objetivos || []).map(o => o.tipo ? o : { tipo: 'ej', clave: o.clave, objetivo: o.objetivo });
  if (!s.rutina) s.rutina = rutinaBase(s.perfil, s.objetivos);
  s.ciclos.forEach(cy => { cy.logs = cy.logs || {}; cy.saltos = cy.saltos || []; cy.inicioRM = cy.inicioRM || { ...cy.snap.perfil.rm, ...cy.snap.perfil.salto }; });
  return s;
}
function setSave(msg) { $('#saveState').textContent = msg || (state.ejemplo ? (ui.view === 'onb' ? 'Todavía no guardaste nada' : 'Ejemplo: no se guarda nada') : 'Guardado en este dispositivo'); }
function persist() {
  if (state.ejemplo) return;
  try { localStorage.setItem(LS, JSON.stringify(state)); setSave(); }
  catch (e) { setSave('No se pudo guardar: el dispositivo no tiene lugar'); }
}
const activo = () => state.ciclos[state.ciclos.length - 1];
const planDe = cy => generar(cy, state.ciclos);
function semanaActual(cy, plan) {
  const d = Math.floor((lunes(new Date()) - parse(cy.inicio)) / (7 * 864e5));
  return { raw: d, c: Math.max(0, Math.min(plan.weeks.length - 1, d)) };
}

/* ================= RENDER ================= */
function renderTabs() {
  const t = $('#tabs'); t.hidden = ui.view === 'onb';
  t.innerHTML = [['semana', 'Semana'], ['progreso', 'Progreso'], ['plan', 'Plan'], ['rutina', 'Rutina']].map(([k, n]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${n}</button>`).join('');
}
function render() {
  registrarPropios(state.propios);
  renderTabs();
  $('#foot').hidden = state.ejemplo || ui.view === 'onb';
  if (ui.view === 'onb') return renderOnb();
  const cy = activo(), plan = planDe(cy), { raw, c } = semanaActual(cy, plan);
  if (ui.wk == null || ui.wk >= plan.weeks.length) ui.wk = c;
  const html = { semana: renderSemana, progreso: renderProgreso, plan: renderPlan, rutina: renderRutina }[ui.tab](plan, cy, raw, c);
  $('#main').innerHTML = (state.ejemplo ? `<div class="banner"><span><b>Estás viendo un ejemplo</b> con entrenamientos ya cargados.</span><button class="btn small primary" data-act="onb">Crear mi plan</button></div>` : '') + html;
  setSave();
  const w = plan.weeks[c];
  conectarKilo(state.ejemplo ? ['Esto es un ejemplo. Cuando quieras, armamos el tuyo.'] : TIPS[w.tipo]);
  if (ui.tab !== 'semana') return;
  // Kilo habla solo cuando hay algo que decir: el saludo al abrir y los festejos
  if (ui.celebrar) { const m = ui.celebrar; ui.celebrar = null; setTimeout(() => { act($('#kilo'), 'hop', 950); decir(m, 6000); rodarEscena(); }, 350); }
  else if (!saludado) {
    saludado = true;
    const h = new Date().getHours(), nom = state.ejemplo ? '' : (state.perfil.nombre || '');
    const txt = ui.justCreated ? `¡Tu plan está listo${nom ? ', ' + nom : ''}! Arrancamos por la semana 1.` : `${h < 12 ? '¡Buen día' : h < 20 ? '¡Buenas tardes' : '¡Buenas noches'}${nom ? ', ' + nom : ''}! ${TIPS[w.tipo][0]}`;
    ui.justCreated = false;
    setTimeout(() => decir(txt, 6500), 700);
  }
}
const TIPS = {
  carga: ['Cargá tus series al terminar: con eso comparo contra el plan.', 'Si el RPE se te va arriba del objetivo, bajá 2,5 kg. No pasa nada.', 'Saltos primero, pesas después: los saltos piden frescura.'],
  descarga: ['Semana de descarga: misma técnica, menos series. Acá se consolida lo entrenado.', 'Esta semana no busques récords.'],
  test: ['Semana de test. Calentá bien y elegí intentos que sepas que salen.', 'Anotá tus marcas: con eso armo la próxima vuelta.']
};

/* ---------- Semana ---------- */
function renderSemana(plan, cy, raw, c) {
  const N = plan.weeks.length, wi = ui.wk, w = plan.weeks[wi], f = plan.fases[w.fase], ini = parse(cy.inicio), wc = plan.weeks[c];
  const h = new Date().getHours(), nom = state.ejemplo ? '' : (state.perfil.nombre || '');
  const sub = raw < 0 ? `Arrancás el ${fd(ini)}. Ya podés mirar la semana 1.` : raw >= N ? 'Terminaste el ciclo. Cerralo en Plan para arrancar el próximo.' : `Semana ${c + 1} de ${N} · ${tipoTxt(plan, wc)} · ${plan.fases[wc.fase].n}`;
  const ver = veredictoSemana(plan, cy, wi), sug = sugerirDescarga(plan, cy, wi) && !(cy.overrides || {})[wi + 1];
  const recs = records(plan, cy).filter(r => !ui.descartados.has(r.k + r.v));
  const logs = (cy.logs || {})[wi] || {}, hechos = state.rutina.filter(s => logs[s.id]).length;
  const futura = wi > c || raw < 0, ov = (cy.overrides || {})[wi];
  let goal;
  if (w.tipo === 'descarga') goal = [['Series', `${w.sets} por ejercicio`, ''], ['Intensidad', `~${Math.round(w.int)}% 1RM`, 'intensidad'], ['RPE', '6', 'rpe']];
  else if (w.tipo === 'test') goal = [['Básicos', 'Test de 1RM', 'rm'], ['Resto', 'Liviano u opcional', '']];
  else goal = [['Intensidad', `${Math.round(w.int)}% 1RM`, 'intensidad'], ['Esquema', `${w.sets} × ${w.reps}`, ''], ['RPE objetivo', rpeTxt(w), 'rpe']];
  if (w.plyo) goal.push(['Saltos', `${w.plyo.c} contactos`, 'contactos']);
  return `
  ${escena({ label: 'Tu semana', eyebrow: `Ciclo ${state.ciclos.length} · ${esc(ENFOQUES[plan.p.enfoque])}`, titulo: `${h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches'}${nom ? ', ' + esc(nom) : ''}`, sub, tipo: wc.tipo })}
  ${haciaDonde(plan, cy)}
  ${recs.length ? `<div class="banner rec"><span>Con lo que cargaste, subió tu 1RM estimado: ${recs.map(r => `<b>${esc(corto(r.k))}</b> <span class="num">${plan.p.rm[r.k] > 0 ? fmt(plan.p.rm[r.k], 'kg') + ' → ' : ''}${fmt(r.v, 'kg')}</span>`).join(' · ')}. ¿Lo actualizo? Las cargas sugeridas se recalculan.</span><span class="row"><button class="btn small ghost" data-act="descartar" data-id="${recs.map(r => r.k + r.v).join(',')}">Ahora no</button><button class="btn small primary" data-act="usarRM" data-rs="${recs.map(r => r.k + ':' + r.v).join(',')}">Actualizar</button></span></div>` : ''}
  ${sug ? `<div class="banner warn"><span>Esta semana quedaste por debajo de lo planeado. Conviene <b>adelantar la descarga a la semana ${wi + 2}</b>.</span><button class="btn small" data-act="adelantar" data-i="${wi + 1}">Adelantar descarga</button></div>` : ''}
  <section class="card" aria-label="Semana seleccionada">
    <div class="week-head">
      <button class="icon-btn" data-act="wk" data-d="-1" ${wi === 0 ? 'disabled' : ''} aria-label="Semana anterior">‹</button>
      <div class="mid">
        <div class="row" style="gap:8px"><h2>Semana ${wi + 1} de ${N}</h2><span class="pill ${w.tipo}">${tipoTxt(plan, w)}</span>${w.tipo === 'descarga' ? ay('descarga') : ''}${wi === c && raw >= 0 && raw < N ? '<span class="note">esta semana</span>' : ''}</div>
        <span class="note">${esc(f.n)} · ${fd(addD(ini, wi * 7))} – ${fd(addD(ini, wi * 7 + 6))} · ${hechos} de ${state.rutina.length} entrenamientos cargados</span>
      </div>
      <button class="icon-btn" data-act="wk" data-d="1" ${wi === N - 1 ? 'disabled' : ''} aria-label="Semana siguiente">›</button>
    </div>
    <dl class="week-goal">${goal.map(([a, b, t]) => `<div><dt>${a} ${t ? ay(t) : ''}</dt><dd>${b}</dd></div>`).join('')}</dl>
    <div class="row" style="margin-top:12px;justify-content:space-between">
      ${ver ? `<span class="tag ${ver.cls}">${ver.txt}</span>` : `<span class="note">${hechos ? 'Esta semana no tiene comparación con el plan.' : 'Cuando cargues entrenamientos, te muestro cómo vas contra lo planeado.'}</span>`}
      ${futura && w.tipo !== 'test' && !state.ejemplo && (ov || w.tipo === 'carga') ? `<button class="btn small ghost" data-act="toggleDes" data-i="${wi}">${ov ? 'Volver a semana de carga' : 'Convertir en descarga'}</button>` : ''}
    </div>
  </section>
  <div class="stack" style="gap:10px">${state.rutina.length ? state.rutina.map((s, i) => sesion(plan, cy, wi, s, i)).join('') : '<p class="note">No tenés entrenamientos en tu rutina. Agregalos en la pestaña Rutina.</p>'}</div>`;
}
// Hacia dónde vamos: proyección al cierre de lo que más importa, siempre a la vista
function haciaDonde(plan, cy) {
  const obj = plan.objetivos || [], ejObj = obj.filter(o => o.tipo === 'ej'), grupos = obj.filter(o => o.tipo === 'grupo');
  // Primero lo que elegiste mejorar; después todo lo que cargaste con marca inicial (o con «No sé»)
  const metas = ejObj.map(o => o.clave).filter(k => MARCAS.includes(k) || SALTOS.includes(k));
  const keys = [...new Set([...metas, ...MARCAS.filter(k => plan.p.rm[k] > 0 || plan.p.nose[k]), ...SALTOS.filter(k => plan.p.salto[k] > 0 || plan.p.nose[k])])];
  const fin = addD(parse(cy.inicio), plan.weeks.length * 7 - 1);
  const items = keys.map(k => {
    const isJ = SALTOS.includes(k), unit = isJ ? 'cm' : 'kg', pr = proyeccion(plan, k), goal = (ejObj.find(o => o.clave === k) || {}).objetivo || 0;
    const start = (cy.inicioRM || {})[k] || 0, pts = isJ ? puntosSalto(cy, k) : puntosLift(plan, cy, k), now = pts.length ? Math.max(...pts.map(p => p.v)) : start;
    if (!pr && !pts.length) return `<div class="dest"><b>${esc(corto(k))}</b><span class="note">Lo calculo con tus primeros entrenamientos</span></div>`;
    const proj = pr ? pr.proj : now, meta = Math.max(goal, proj), fill = meta > start && start > 0 ? Math.max(0, Math.min(1, (now - start) / (meta - start))) : 0;
    const red = v => unit === 'kg' ? r25(v) : Math.round(v);
    return `<div class="dest"><div class="dest-top"><b>${esc(corto(k))}</b><span class="num">${fmt(red(now), '')} → <b>${fmt(red(goal || proj), unit)}</b></span></div>
      <div class="track"><div class="fill" style="width:${fill * 100}%"></div></div>
      <span class="note">${goal ? `Objetivo · proyección ${fmt(red(proj), unit)}` : 'Proyección al cierre'}</span></div>`;
  }).join('');
  const chips = grupos.map(o => { const pm = promedioGrupo(plan, cy, o.grupo); return `<span class="chip">${esc(GRUPOS[o.grupo])} · <b>${pm == null ? 'sin datos aún' : (pm >= 0 ? '+' : '') + pm.toFixed(1) + '%'}</b></span>`; }).join('');
  if (!items && !chips) return '';
  return `<section class="card" aria-label="Hacia dónde vamos"><div class="eyebrow">Hacia dónde vamos ${ay('proyeccion')}</div>
    <h2 style="margin:4px 0 12px">Al cierre del ciclo · ${fd(fin)}</h2><div class="dests">${items}</div>
    ${chips ? `<div class="chips" style="margin-top:12px"><span class="note">Grupos que querés mejorar:</span>${chips}</div>` : ''}</section>`;
}
const serieTxt = (d, x) => d.t === 'salto' || d.t === 'lanzamiento' ? `${x.reps}${x.marca ? ' · ' + x.marca.toLocaleString('es') + ' ' + d.marca : ''}` : d.t === 'tiempo' ? `${x.seg} s` : d.t === 'lastre' ? `${x.kg ? '+' + x.kg.toLocaleString('es') : 'PC'}×${x.reps}` : `${(x.kg || 0).toLocaleString('es')}×${x.reps}`;
function mejorTxt(en, peso) {
  const d = ejDe(en.e);
  if (d.t === 'salto' || d.t === 'lanzamiento') { const m = Math.max(0, ...en.s.map(x => x.marca || 0)); return m ? `${m.toLocaleString('es')} ${d.marca}` : `${en.s.length} series`; }
  if (d.t === 'tiempo') return `${Math.max(...en.s.map(x => x.seg))} s`;
  const t = mejorSerie(en, peso); return t ? serieTxt(d, t) : '';
}
function setRow(d, sid, iid, i, x, o, prevKg) {
  const id = `${sid}-${iid}-${i}`;
  const inp = (f, val, ph, lbl, step, mode) => `<input class="in" id="${f}-${id}" type="number" inputmode="${mode}" step="${step}" min="0" data-f="${f}" value="${val ?? ''}" placeholder="${ph ?? ''}" aria-label="${lbl}, serie ${i + 1}">`;
  if (d.t === 'salto' || d.t === 'lanzamiento') return `<div class="set"><span class="set-i">${i + 1}</span>${inp('reps', x ? x.reps : '', o.reps, 'Repeticiones', 1, 'numeric')}<span>reps</span>${d.marca ? inp('marca', x && x.marca ? x.marca : '', '', `Marca en ${d.marca}`, .5, 'decimal') + `<span>${d.marca}</span>` : ''}</div>`;
  if (d.t === 'tiempo') return `<div class="set"><span class="set-i">${i + 1}</span>${inp('seg', x ? x.seg : '', o.seg || 30, 'Segundos', 5, 'numeric')}<span>seg</span></div>`;
  const ph = o.conRM ? o.kg : prevKg != null ? prevKg : d.t === 'lastre' ? 0 : 'kg';
  return `<div class="set"><span class="set-i">${i + 1}</span>${inp('kg', x && x.kg != null ? x.kg : '', ph, d.t === 'lastre' ? 'Kilos de lastre' : 'Kilos', .5, 'decimal')}<span>${d.t === 'lastre' ? 'kg lastre ×' : 'kg ×'}</span>${inp('reps', x && x.reps ? x.reps : '', o.reps, 'Repeticiones', 1, 'numeric')}<span>reps</span></div>`;
}
function sesion(plan, cy, wi, s, i) {
  const w = plan.weeks[wi], lg = ((cy.logs || {})[wi] || {})[s.id], open = ui.open === s.id, done = !!lg, P = plan.p.peso || 0;
  const nP = s.items.filter(it => esPlio(it.e)).length;
  const head = `<button class="ses-head" data-act="abrir" data-s="${s.id}" aria-expanded="${open}">
    <span class="ses-n">${done ? '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9.5l3.2 3L14 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : i + 1}</span>
    <span style="min-width:0"><b>${esc(s.nombre)}</b><span class="note">${s.items.map(it => esc(corto(it.e))).join(' · ') || 'Sin ejercicios: agregalos en Rutina'}</span></span>
    <span class="ses-st">${done ? 'Cargado · ' + fd(parse(lg.fecha)) : open ? '' : 'Cargar'}</span></button>`;
  if (!open) {
    if (!done) return `<article class="ses">${head}</article>`;
    const rend = rendimientoSemana(plan, cy, wi).filter(r => r.sid === s.id);
    return `<article class="ses done">${head}<div class="ses-body">${Object.keys(lg.ej).map(id => {
      const en = lg.ej[id], d = ejDe(en.e), r = rend.find(x => x.id === id);
      const tag = r && r.ratio != null ? (r.ratio >= 1.005 ? `<span class="tag t-up">+${Math.round((r.ratio - 1) * 100) || 1}% vs plan</span>` : r.ratio >= .95 ? '<span class="tag t-mid">en el plan</span>' : `<span class="tag t-down">−${Math.round((1 - r.ratio) * 100)}% vs plan</span>`) : '';
      return `<div class="sum-row"><span>${esc(corto(en.e))} ${tag}</span><span class="num">${en.s.map(x => serieTxt(d, x)).join('  ')}</span></div>`;
    }).join('')}</div></article>`;
  }
  return `<article class="ses ${done ? 'done' : ''}">${head}
    <form class="ses-body ses-form" data-s="${s.id}" data-w="${wi}" novalidate>
      ${w.plyo && nP ? `<p class="note" style="padding-top:12px">Saltos y lanzamientos primero, frescos: <b style="color:var(--ink)">${w.plyo.c} contactos</b> en total ${ay('contactos')}</p>` : ''}
      ${s.items.map(it => {
        const d = ejDe(it.e), o = objetivoEj(plan, w, it.e, nP), prev = ultimaEntrada(cy, it.e, wi), cur = lg && lg.ej[it.id] ? lg.ej[it.id].s : [];
        const prevKg = prev && (d.t === 'carga' || d.t === 'lastre') ? (mejorSerie(prev, P) || {}).kg : null, n = Math.max(cur.length, o.sets || 3);
        return `<div class="ex" data-i="${it.id}"><div class="ex-head"><b>${esc(d.n)}</b><span class="note">${o.texto}</span></div>
          ${prev ? `<span class="note">La última vez: ${mejorTxt(prev, P)}</span>` : ''}
          <div class="sets">${Array.from({ length: n }, (_, k) => setRow(d, s.id, it.id, k, cur[k], o, prevKg)).join('')}</div>
          <div><button type="button" class="btn small ghost" data-act="addSet">+ Serie</button></div></div>`;
      }).join('')}
      <p class="err" hidden></p>
      <div class="row"><button class="btn primary" type="submit">Guardar entrenamiento</button><button type="button" class="btn" data-act="rellenar">Completar con lo sugerido</button><button type="button" class="btn ghost" data-act="abrir" data-s="${s.id}">Cancelar</button></div>
    </form></article>`;
}
function leerSets(div, d) {
  const rows = [...div.querySelectorAll('.set')], v = (r, f) => { const el = r.querySelector(`[data-f="${f}"]`); return el ? el.value.trim() : ''; };
  if (d.t === 'salto' || d.t === 'lanzamiento') return rows.map(r => ({ reps: parseInt(v(r, 'reps')) || 0, marca: parseFloat(v(r, 'marca')) || null })).filter(x => x.reps > 0);
  if (d.t === 'tiempo') return rows.map(r => ({ seg: parseInt(v(r, 'seg')) || 0 })).filter(x => x.seg > 0);
  if (d.t === 'lastre') return rows.map(r => ({ kg: parseFloat(v(r, 'kg')) || 0, reps: parseInt(v(r, 'reps')) || 0 })).filter(x => x.reps > 0);
  // Con peso: la serie cuenta si tiene reps y algún peso escrito
  return rows.map(r => { const k = v(r, 'kg'); return { kg: k === '' ? null : parseFloat(k) || 0, reps: parseInt(v(r, 'reps')) || 0 }; }).filter(x => x.reps > 0 && x.kg != null);
}

/* ---------- Progreso ---------- */
function niceStep(x) { const m = Math.pow(10, Math.floor(Math.log10(x))); const f = x / m; return (f < 1.5 ? 1 : f < 3.5 ? 2.5 : f < 7.5 ? 5 : 10) * m; }
function chartProg(o) {
  const W = 640, H = 210, l = 46, r = 30, t = 16, b = 26, pw = W - l - r, ph = H - t - b;
  const vals = [...o.pts.map(p => p.v), o.start, o.goal, o.projEnd].filter(v => v > 0);
  if (!vals.length) return '';
  let lo = Math.min(...vals), hi = Math.max(...vals); const pad = Math.max((hi - lo) * .15, hi * .03); lo = Math.max(0, lo - pad); hi += pad;
  const X = x => l + x / o.N * pw, Y = v => t + ph - (v - lo) / (hi - lo) * ph;
  let s = `<svg class="pchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label)}">`;
  o.deloads.forEach(i => { s += `<rect class="band" x="${X(i)}" y="${t}" width="${pw / o.N}" height="${ph}"/>`; });
  const st = niceStep((hi - lo) / 4);
  for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) s += `<line class="grid" x1="${l}" x2="${W - r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${l - 6}" y="${Y(v) + 4}" text-anchor="end">${Math.round(v * 10) / 10}</text>`;
  const every = o.N > 16 ? 2 : 1;
  for (let i = 0; i < o.N; i += every) s += `<text class="ax" x="${X(i + .5)}" y="${H - 8}" text-anchor="middle">${i + 1}</text>`;
  if (o.start > 0 && o.projEnd > 0) s += `<line class="proj" x1="${X(0)}" y1="${Y(o.start)}" x2="${X(o.N)}" y2="${Y(o.projEnd)}"/>`;
  if (o.goal > 0) s += `<line class="goal" x1="${l}" x2="${W - r}" y1="${Y(o.goal)}" y2="${Y(o.goal)}"/><text class="goal-t" x="${W - r}" y="${Y(o.goal) - 6}" text-anchor="end">Objetivo ${fmt(o.goal, o.unit)}</text>`;
  if (o.start > 0) s += `<circle class="start" cx="${X(0)}" cy="${Y(o.start)}" r="4"/>`;
  if (o.pts.length) {
    s += `<path class="real" d="${o.pts.map((p, i) => (i ? 'L' : 'M') + X(p.x).toFixed(1) + ' ' + Y(p.v).toFixed(1)).join(' ')}"/>`;
    o.pts.forEach(p => { s += `<circle class="real-d" cx="${X(p.x)}" cy="${Y(p.v)}" r="3.5"><title>${fmt(Math.round(p.v * 2) / 2, o.unit)}</title></circle>`; });
    const last = o.pts[o.pts.length - 1]; s += `<text class="last-t" x="${X(last.x)}" y="${Y(last.v) - 10}" text-anchor="middle">${Math.round(last.v * 2) / 2}</text>`;
  }
  return s + '</svg>';
}
function renderProgreso(plan, cy) {
  const N = plan.weeks.length, deloads = plan.weeks.map((w, i) => w.tipo !== 'carga' ? i : -1).filter(i => i >= 0);
  const obj = plan.objetivos || [], goals = Object.fromEntries(obj.filter(o => o.tipo === 'ej').map(o => [o.clave, o.objetivo || 0]));
  const enLogs = new Set(); for (const wi in cy.logs) for (const sid in cy.logs[wi]) for (const id in cy.logs[wi][sid].ej) enLogs.add(cy.logs[wi][sid].ej[id].e);
  const tarjeta = (k, unit, pts, start, extra = '') => {
    const pr = proyeccion(plan, k), best = pts.length ? Math.max(...pts.map(p => p.v)) : 0, goal = goals[k] || 0;
    const projEnd = pr ? (k === 'dominadas' || !start ? pr.proj : start * (1 + pr.rate)) : 0, cambio = start > 0 && best > 0 ? (best / start - 1) * 100 : null;
    const avance = goal > 0 && start > 0 && best > 0 ? Math.max(0, Math.min(1, (best - start) / (goal - start))) : null;
    return `<section class="card"><div class="pcard-head"><h2>${esc(corto(k))}</h2>${goal ? `<span class="note">Objetivo ${fmt(goal, unit)}</span>` : ''}</div>
      <dl class="stats"><div><dt>Al empezar</dt><dd>${start > 0 ? fmt(start, unit) : '—'}</dd></div><div><dt>${unit === 'kg' ? 'Mejor 1RM estimado' : 'Mejor marca'}</dt><dd>${best ? fmt(Math.round(best * 2) / 2, unit) : '—'}</dd></div>
      <div><dt>Cambio</dt><dd>${cambio == null ? '—' : (cambio >= 0 ? '+' : '') + cambio.toFixed(1) + '%'}</dd></div>${projEnd ? `<div><dt>Proyección</dt><dd>${fmt(unit === 'kg' ? r25(projEnd) : Math.round(projEnd), unit)}</dd></div>` : ''}</dl>
      ${avance != null ? `<div class="track" aria-label="Avance hacia el objetivo"><div class="fill" style="width:${avance * 100}%"></div></div><span class="note">${Math.round(avance * 100)}% del camino hacia tu objetivo</span>` : ''}
      ${pts.length || start ? chartProg({ N, pts, start, goal, projEnd, unit, deloads, label: `Progreso en ${nombreDe(k)}` }) : ''}
      ${pts.length ? '' : `<p class="note" style="margin-top:8px">Todavía no hay ${unit === 'kg' ? 'entrenamientos cargados' : 'mediciones'} de este ejercicio.</p>`}${extra}</section>`;
  };
  const lifts = MARCAS.filter(k => plan.p.rm[k] > 0 || enLogs.has(k) || goals[k] != null).sort((a, b) => (goals[b] != null) - (goals[a] != null))
    .map(k => tarjeta(k, 'kg', puntosLift(plan, cy, k), (cy.inicioRM || {})[k] || 0)).join('');
  const js = SALTOS.filter(k => plan.p.salto[k] > 0 || plan.p.nose[k] || enLogs.has(k) || goals[k] != null).map(k => tarjeta(k, 'cm', puntosSalto(cy, k), (cy.inicioRM || {})[k] || 0,
    state.ejemplo ? '' : `<form class="row salto-form" data-k="${k}" style="margin-top:10px" novalidate><input class="in" id="salto-${k}" type="number" inputmode="decimal" step="0.5" min="0" placeholder="cm" style="width:110px" aria-label="Nueva medición de ${esc(nombreDe(k))}"><button class="btn small" type="submit">Anotar medición</button></form>`)).join('');
  const P = plan.p.peso || 0;
  const grupos = obj.filter(o => o.tipo === 'grupo').map(o => {
    const c = cambios(plan, cy, o.grupo), pm = promedioGrupo(plan, cy, o.grupo);
    return `<section class="card"><div class="pcard-head"><h2>${esc(GRUPOS[o.grupo])}</h2><span class="tag ${pm == null ? 't-mid' : pm >= 0 ? 't-up' : 't-down'}">${pm == null ? 'sin datos aún' : (pm >= 0 ? '+' : '') + pm.toFixed(1) + '% promedio'}</span></div>
      ${c.length ? c.map(x => `<div class="sum-row"><span>${esc(corto(x.e))}</span><span class="num">${mejorTxt(x.firstEn, P)} → ${mejorTxt(x.lastEn, P)} · ${(x.cambio >= 0 ? '+' : '') + x.cambio.toFixed(1)}%</span></div>`).join('') : '<p class="note" style="margin-top:8px">Cuando cargues ejercicios de este grupo, acá ves cuánto mejoraste en cada uno.</p>'}</section>`;
  }).join('');
  const otros = cambios(plan, cy).filter(x => !MARCAS.includes(x.e) && !SALTOS.includes(x.e) && !obj.some(o => o.tipo === 'grupo' && o.grupo === ejDe(x.e).g));
  return `<section class="card"><div class="kilo-edge">${kilo('', 'focus')}</div><div class="eyebrow">Progreso del ciclo ${state.ciclos.length}</div>
    <h2 style="font-size:20px;margin-top:4px">Cómo vas</h2>
    <p class="note" style="margin-top:6px">Cada punto es tu 1RM ${ay('rm')} estimado según tu mejor serie del entrenamiento. Si hacés justo lo planeado, queda igual; si levantás más, sube. La línea punteada es la proyección al cierre del ciclo.</p>
    <div class="chart-legend" style="margin-top:10px"><span><b style="border-color:var(--load)"></b>Lo que levantaste</span><span><b style="border-color:var(--muted);border-top-style:dashed"></b>Proyección</span><span><b style="border-color:var(--accent);border-top-style:dotted"></b>Objetivo</span><span><b style="border-color:color-mix(in srgb,var(--deload) 40%,transparent);border-top-width:8px"></b>Descarga</span></div></section>
    ${grupos ? `<div class="cols">${grupos}</div>` : ''}
    <div class="cols">${lifts}${js}</div>
    ${otros.length ? `<section class="card"><h2>Otros ejercicios</h2><div class="tbl-wrap"><table><thead><tr><th>Ejercicio</th><th>Primera vez</th><th>Última</th><th>Cambio</th></tr></thead><tbody>
      ${otros.map(x => `<tr><td>${esc(corto(x.e))}</td><td class="num">${mejorTxt(x.firstEn, P)}</td><td class="num">${mejorTxt(x.lastEn, P)}</td><td class="num">${(x.cambio >= 0 ? '+' : '') + x.cambio.toFixed(1)}%</td></tr>`).join('')}</tbody></table></div></section>` : ''}`;
}

/* ---------- Plan ---------- */
function chart(plan, cur, raw, sel) {
  const n = plan.weeks.length, W = Math.max(560, n * 34 + 90), H = 262, l = 44, r = 46, t = 40, bt = 42, pw = W - l - r, ph = H - t - bt, bw = pw / n;
  const yV = v => t + ph - (v / 1.3) * ph, yI = v => t + ph - ((v - 50) / 50) * ph;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de trabajo e intensidad por semana">`;
  [0.25, .5, .75, 1, 1.25].forEach(v => { s += `<line class="grid" x1="${l}" x2="${W - r}" y1="${yV(v)}" y2="${yV(v)}"/>`; });
  [60, 70, 80, 90, 100].forEach(v => { s += `<text class="ax" x="${W - r + 6}" y="${yI(v) + 4}">${v}%</text>`; });
  s += `<text class="ax" x="${l - 6}" y="${t - 16}" text-anchor="end">Fases</text>`;
  plan.blocks.forEach(b => {
    const x = l + b.start * bw + 1, wd = b.len * bw - 2;
    s += `<rect class="${b.fase % 2 ? 'band-alt' : 'band-p'}" x="${x}" y="${t - 30}" width="${wd}" height="20" rx="6"/>`;
    const lbl = wd > 90 ? b.nombre + (b.total > 1 ? ' ' + (b.rep + 1) : '') : wd > 40 ? b.nombre.slice(0, 5) + '.' : '';
    s += `<text class="band-t" x="${x + 8}" y="${t - 16}">${esc(lbl)}</text>`;
  });
  plan.weeks.forEach((w, i) => {
    const x = l + i * bw + bw * .18, wd = bw * .64, y = yV(w.vol);
    s += `<rect class="bar-${w.tipo} ${raw >= 0 && i < cur ? 'past' : ''}" x="${x}" y="${y}" width="${wd}" height="${t + ph - y}" rx="4"/>`;
    if (n <= 26 || i % 2 === 0) s += `<text class="ax" x="${l + i * bw + bw / 2}" y="${t + ph + 16}" text-anchor="middle">${i + 1}</text>`;
  });
  const pts = plan.weeks.map((w, i) => [l + i * bw + bw / 2, yI(w.int)]);
  s += `<polyline class="int-line" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
  pts.forEach(p => { s += `<circle class="int-dot" cx="${p[0]}" cy="${p[1]}" r="3.2"/>`; });
  if (cur >= 0) s += `<text class="now-t" x="${l + cur * bw + bw / 2}" y="${t + ph + 32}" text-anchor="middle">hoy</text>`;
  s += `<rect class="sel" x="${l + sel * bw + 1}" y="${t - 6}" width="${bw - 2}" height="${ph + 12}" rx="6"/>`;
  plan.weeks.forEach((w, i) => { s += `<rect class="hit" data-act="verSemPlan" aria-label="Ver semana ${i + 1}" data-i="${i}" x="${l + i * bw}" y="${t - 30}" width="${bw}" height="${ph + 50}"><title>Semana ${i + 1}: ${tipoTxt(plan, w)}</title></rect>`; });
  let kd = '';
  // Kilo se para sobre la semana que estás mirando
  { const w = plan.weeks[sel]; kd = `<div class="kilo-ride" style="left:${(l + sel * bw + bw / 2) / W * 100}%;top:${yV(w.vol) / H * 100}%">${kilo('', w.tipo === 'descarga' ? 'sleep' : w.tipo === 'test' ? 'focus' : 'happy')}</div>`; }
  return s + '</svg>' + kd;
}
function renderPlan(plan, cy, raw, c) {
  const p = plan.p, N = plan.weeks.length, ini = parse(cy.inicio);
  const nextDes = plan.weeks.findIndex((x, i) => i > c && x.tipo !== 'carga');
  const fases = plan.fases.map((f, i) => ({ f, i, bs: plan.blocks.filter(b => b.fase === i) })).filter(x => x.bs.length);
  if (ui.planSel == null || ui.planSel >= N) ui.planSel = c;
  const si = ui.planSel, sw = plan.weeks[si], sf = plan.fases[sw.fase];
  const det = sw.tipo === 'test' ? [['Básicos', 'Test de 1RM'], ['Resto', 'Liviano u opcional']]
    : [['Intensidad', `${Math.round(sw.int)}% 1RM`], ['Esquema', `${sw.sets} × ${sw.reps}`], ['RPE', sw.tipo === 'descarga' ? '6' : rpeTxt(sw)]];
  if (sw.plyo) det.push(['Saltos', `${sw.plyo.c} contactos`]);
  return `<section class="card"><div class="kilo-edge">${kilo('', plan.weeks[c].tipo === 'descarga' ? 'sleep' : plan.weeks[c].tipo === 'test' ? 'focus' : 'happy')}</div><div class="eyebrow">Ciclo ${state.ciclos.length} · ${esc(ENFOQUES[p.enfoque])}</div>
    <h2 style="font-size:22px;margin:4px 0 14px">${N} semanas · ${fd(ini)} – ${fd(addD(ini, N * 7 - 1))}</h2>
    <div class="cols">
      <dl class="meta-list">
        <div><dt>Ritmo ${ay('bloque')}</dt><dd>${plan.L} semanas de carga + 1 de descarga</dd></div>
        <div><dt>Próxima descarga</dt><dd>${nextDes < 0 ? '—' : 'semana ' + (nextDes + 1)}</dd></div>
        <div><dt>Nivel estimado</dt><dd>${NIVEL[plan.nivel]}</dd></div>
      </dl>
      <dl class="meta-list">
        <div><dt>Fases ${ay('fase')}</dt><dd>${fases.map(x => x.f.n).join(' → ')}</dd></div>
        <div><dt>Días por semana</dt><dd>${p.dias}</dd></div>
        ${plan.comp ? `<div><dt>${esc(plan.comp.nombre)}</dt><dd>${fd(parse(plan.comp.fecha))}</dd></div>` : ''}
      </dl>
    </div>
    <div class="strip" style="margin-top:16px" aria-hidden="true">${plan.weeks.map((x, i) => `<i class="${x.tipo} ${raw >= 0 && i < c ? 'past' : ''} ${raw >= 0 && i === c && raw < N ? 'now' : ''}"></i>`).join('')}</div>
    <div class="row" style="margin-top:16px">
      ${state.ejemplo ? '' : `<button class="btn" data-act="perfil">Editar mis datos</button>`}
      <button class="btn" data-act="coach">Compartir con mi entrenador</button>
      ${state.ejemplo ? '' : `<button class="btn ${raw >= N - 1 ? 'primary' : ''}" data-act="cerrar">Cerrar ciclo y empezar otro</button>`}
    </div></section>
  <section class="card">
    <div class="chart-head"><div><div class="eyebrow">La marea del ciclo</div><h2>Cómo se reparte el trabajo semana a semana</h2></div>
      <div class="legend"><span><b style="background:var(--load)"></b>Carga</span><span><b style="background:var(--deload)"></b>Descarga</span><span><b style="background:var(--test)"></b>Test / competencia</span><span><b style="background:transparent;border:1.5px solid var(--ink);border-radius:50%"></b>Intensidad</span></div></div>
    <p class="note" style="margin-bottom:10px">Arriba, las fases del ciclo. Cada <b style="color:var(--ink)">barra</b> es cuánto trabajo toca esa semana ${ay('trabajo')} y cada <b style="color:var(--ink)">punto</b> qué tan pesado es, en % de tu 1RM ${ay('intensidad')}. Tocá una semana para ver qué tiene.</p>
    <div class="chart-wrap"><div class="chart-inner">${chart(plan, raw >= 0 && raw < N ? c : -1, raw, si)}</div></div>
    <div class="plan-sel" role="status">
      <div class="row" style="gap:8px"><b>Semana ${si + 1}</b><span class="pill ${sw.tipo}">${tipoTxt(plan, sw)}</span><span class="note">${esc(sf.n)} · ${fd(addD(ini, si * 7))} – ${fd(addD(ini, si * 7 + 6))}${si === c && raw >= 0 && raw < N ? ' · esta semana' : ''}</span></div>
      <dl class="week-goal" style="margin-top:10px">${det.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl>
      <div><button class="btn small" data-act="irSemana" data-i="${si}">Ver los entrenamientos de esta semana</button></div>
    </div>
    <div class="fases">${fases.map(x => `<div class="fase"><span class="fase-dot ${x.i % 2 ? 'alt' : ''}"></span><div><b>${esc(x.f.n)}</b> <span class="note">· semanas ${x.bs[0].start + 1}–${x.bs[x.bs.length - 1].start + x.bs[x.bs.length - 1].len}</span><p class="note">${esc(x.f.obj)}</p></div></div>`).join('')}</div>
    ${plan.comp ? `<p class="note" style="margin-top:8px">Armado hacia atrás desde ${esc(plan.comp.nombre)}. ${esc(plan.aviso || '')}</p>` : ''}
  </section>
  <div class="cols">
    <section class="card"><div class="eyebrow" style="margin-bottom:6px">Proyección al cierre ${ay('proyeccion')}</div>${objetivosHTML(plan)}</section>
    <section class="card"><div class="eyebrow" style="margin-bottom:10px">Por qué este plan</div>${porque(plan)}</section>
  </div>
  ${state.ciclos.length > 1 ? `<section class="card"><div class="eyebrow" style="margin-bottom:10px">Ciclos anteriores</div>${historial()}</section>` : ''}
  ${state.ejemplo ? '' : `<section class="card"><div class="eyebrow">Tus datos</div><p class="note" style="margin:6px 0 12px">Todo se guarda en este dispositivo. Descargá un respaldo de vez en cuando, y siempre antes de cambiar de teléfono.</p>
    <div class="row"><button class="btn" data-act="exportar">Descargar respaldo</button><label class="btn" for="importar">Restaurar un respaldo</label><input type="file" id="importar" accept="application/json,.json" hidden></div></section>`}`;
}
function objetivosHTML(plan) {
  const ejObj = (plan.objetivos || []).filter(o => o.tipo === 'ej' && (MARCAS.includes(o.clave) || SALTOS.includes(o.clave)));
  const list = [...ejObj, ...[...MARCAS.filter(k => plan.p.rm[k] > 0), ...SALTOS.filter(k => plan.p.salto[k] > 0)].filter(k => !ejObj.some(o => o.clave === k)).map(k => ({ clave: k }))];
  if (!list.length) return '<p class="note">Cuando cargues entrenamientos, aparecen tus proyecciones.</p>';
  return list.map(o => {
    const pr = proyeccion(plan, o.clave);
    if (!pr) return `<div class="goal"><div class="goal-top"><b>${esc(corto(o.clave))}</b><span class="note">sin marca todavía</span></div></div>`;
    const proj = fmt(pr.unit === 'kg' ? r25(pr.proj) : Math.round(pr.proj), pr.unit);
    if (!o.objetivo) return `<div class="goal"><div class="goal-top"><b>${esc(corto(o.clave))}</b><span class="num">${fmt(pr.now, pr.unit)} → ${proj}</span></div></div>`;
    const [txt, cls] = veredicto(pr, o.objetivo);
    return `<div class="goal"><div class="goal-top"><b>${esc(corto(o.clave))}</b><span class="num">${fmt(pr.now, pr.unit)} → ${fmt(o.objetivo, pr.unit)}</span></div>
      <div class="goal-top"><span class="note">Proyección: <span class="num">${proj}</span>${pr.cal ? ' · con tu historial' : ''}</span><span class="verdict ${cls}">${txt}</span></div></div>`;
  }).join('');
}
function porque(plan) {
  const p = plan.p, por = plan.niv.por, keys = Object.keys(por).filter(k => por[k].w > 0);
  const metas = (plan.objetivos || []).map(o => o.tipo === 'grupo' ? GRUPOS[o.grupo] : corto(o.clave));
  return `<div class="why">
    ${keys.length ? `<div class="chips">${keys.map(k => `<span class="chip">${esc(corto(k))} · <b>${NIVEL[por[k].n].toLowerCase()}</b></span>`).join('')}</div>` : ''}
    <p>Nivel global <b>${NIVEL[plan.nivel].toLowerCase()}</b>: promedio de tus marcas relativas a tu peso${metas.length ? `, con doble peso para lo que querés mejorar (${esc(metas.join(', '))})` : ''}${p.enfoque === 'potencia' || p.enfoque === 'mixto' ? '; los saltos y olímpicos cuentan' : ''}.</p>
    <p><b>Bloques de ${plan.L} semanas de carga + 1 de descarga</b> ${p.carga ? '(lo fijaste vos o tu entrenador)' : `según tu nivel y cómo recuperás (${p.recuperacion}/5)`}.</p>
    <p><b>${plan.fases.map(f => f.n).join(' → ')}</b>: cada fase prepara la siguiente. Cuando sube la intensidad bajan las series, salvo en acumulación y sobrecarga.</p>
    <p>Si quedás por debajo de lo planeado, te sugiero adelantar la descarga. Si quedás por encima, te ofrezco subir tu 1RM.</p></div>`;
}
function historial() {
  return `<div class="stack" style="gap:10px;font-size:14px">${state.ciclos.slice(0, -1).map((cy, i) => {
    const ch = cy.cierre, p = cy.snap.perfil;
    const deltas = ch ? [...MARCAS, ...SALTOS].filter(k => ch.antes[k] > 0 && ch.despues[k] > 0 && ch.antes[k] !== ch.despues[k]).map(k => { const d = (ch.despues[k] / ch.antes[k] - 1) * 100; return `${corto(k)} ${d > 0 ? '+' : ''}${d.toFixed(1)}%`; }).join(' · ') : '';
    return `<div><b>Ciclo ${i + 1}</b> <span class="note">· ${esc(ENFOQUES[p.enfoque])} · desde ${fd(parse(cy.inicio))}</span><div class="note">${deltas || 'Sin cambios registrados'}</div></div>`;
  }).join('')}</div>`;
}

/* ---------- Rutina ---------- */
const selEj = (id, val, label = 'Ejercicio') => `<select class="in" id="${id}" aria-label="${label}">${Object.entries(GRUPOS).map(([g, n]) => {
  const l = todos().filter(e => e.g === g); return l.length ? `<optgroup label="${esc(n)}">${l.map(e => `<option value="${e.id}" ${e.id === val ? 'selected' : ''}>${esc(e.n)}</option>`).join('')}</optgroup>` : '';
}).join('')}</select>`;
const itemRow = it => `<div class="rut-row" data-i="${it.id}">${selEj('re-' + it.id, it.e)}<button type="button" class="btn small ghost" data-act="quitarFila" data-sel=".rut-row">Quitar</button></div>`;
const sesBloque = s => `<div class="rut-s" data-s="${s.id}">
  <div class="row"><input class="in" id="rn-${s.id}" value="${esc(s.nombre)}" aria-label="Nombre del entrenamiento" style="flex:1;min-width:160px;font-weight:600">
    <button type="button" class="btn small ghost" data-act="quitarFila" data-sel=".rut-s">Quitar entrenamiento</button></div>
  <div class="rut-ex">${s.items.map(itemRow).join('')}</div>
  <div><button type="button" class="btn small" data-act="addEx">+ Ejercicio</button></div></div>`;
function renderRutina() {
  const auto = state.rutinaModo === 'auto';
  return `<section class="card"><div class="kilo-edge">${kilo()}</div><div class="eyebrow">Tu rutina</div>
    <h2 style="font-size:20px;margin:4px 0 12px">Tus entrenamientos de cada semana</h2>
    <div class="seg" role="group" aria-label="Quién arma la rutina"><button class="${auto ? 'on' : ''}" data-act="rutModo" data-v="auto">Sugerida</button><button class="${auto ? '' : 'on'}" data-act="rutModo" data-v="propia">Armada por mí</button></div>
    <p class="note" id="rutNota" style="margin-top:10px">${auto ? 'La armé según tus días, tu enfoque y lo que querés mejorar. Si cambiás algo, pasa a ser tuya.' : 'Elegí los ejercicios de la lista. Los cambios se guardan solos.'}
      Los básicos y sus variantes calculan los kilos con tu 1RM; el resto lo comparo con tu última vez.</p>
    <form id="rutForm" style="margin-top:8px" novalidate><div id="rutList">${state.rutina.map(sesBloque).join('')}</div></form>
    <div class="row" style="margin-top:16px"><button type="button" class="btn" data-act="addSes">+ Entrenamiento</button><button type="button" class="btn ghost" data-act="nuevoEj">Crear un ejercicio que no está en la lista</button></div>
  </section>`;
}
function guardarRutina() {
  state.rutina = $$('#rutList .rut-s').map(b => ({
    id: b.dataset.s, nombre: b.querySelector('[id^="rn-"]').value.trim() || 'Entrenamiento',
    items: [...b.querySelectorAll('.rut-row')].map(r => ({ id: r.dataset.i, e: r.querySelector('select').value }))
  }));
  state.rutinaModo = 'propia'; persist();
  $$('.seg [data-act="rutModo"]').forEach(b => b.classList.toggle('on', b.dataset.v === 'propia'));
  const nota = $('#rutNota'); if (nota) nota.firstChild.textContent = 'Elegí los ejercicios de la lista. Los cambios se guardan solos. ';
}

/* ================= PRIMEROS PASOS ================= */
const PASOS = ['bienvenida', 'vos', 'enfoque', 'marcas', 'objetivos', 'calendario', 'listo'];
const ENF_DESC = { fuerza: 'Subir tus 1RM en los básicos.', hipertrofia: 'Ganar masa muscular.', potencia: 'Saltar más alto y ser más explosivo.', mixto: 'Fuerza y saltos a la vez.' };
const nuevoDraft = () => ({ perfil: { nombre: '', sexo: 'm', edad: 0, peso: 0, altura: 0, experiencia: 0, enfoque: 'mixto', dias: 4, recuperacion: 3, duracion: 16, carga: 0, rm: {}, salto: {}, nose: {}, competencias: [] }, objetivos: [], modoObj: 'gen', inicio: 'proximo' });
const num = (id, label, val, step, unit) => `<label class="f">${label}${unit ? ` (${unit})` : ''}<input id="${id}" type="number" inputmode="decimal" step="${step || 1}" min="0" value="${val || ''}"></label>`;
const sel = (id, label, opts, val) => `<label class="f">${label}<select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${String(v) === String(val) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
const marcaLbl = k => k === 'dominadas' ? ['Dominada con lastre 1RM', 'kg de lastre'] : SALTOS.includes(k) ? [nombreDe(k), 'cm'] : [corto(k) + ' 1RM', 'kg'];
const markField = (k, val, ns) => {
  const id = (SALTOS.includes(k) ? 'f-j-' : 'f-rm-') + k, [lbl, u] = marcaLbl(k);
  return `<div class="mark"><label for="${id}">${lbl} (${u})</label><div class="mark-row">
    <input class="in" id="${id}" type="number" inputmode="decimal" step="${u === 'cm' ? 1 : 2.5}" min="0" value="${ns ? '' : val || ''}" ${ns ? 'disabled' : ''}>
    <label class="chk"><input type="checkbox" id="ns-${k}" data-ns="${id}" ${ns ? 'checked' : ''}>No sé</label></div></div>`;
};
const goalRow = o => `<div class="goal-row">${selEj('', o.clave)}<input type="number" step="0.5" min="0" value="${o.objetivo || ''}" placeholder="Marca (opcional)" aria-label="Marca objetivo (opcional)"><button class="btn small ghost" data-act="quitarFila" data-sel=".goal-row" type="button">Quitar</button></div>`;
const compRow = c => `<div class="goal-row comp-row"><input type="text" value="${esc(c.nombre)}" placeholder="Nombre" aria-label="Nombre de la competencia"><input type="date" value="${esc(c.fecha)}" aria-label="Fecha de la competencia"><button class="btn small ghost" data-act="quitarFila" data-sel=".goal-row" type="button">Quitar</button></div>`;
// Objetivos: grupos de movimientos y/o ejercicios puntuales (la marca es opcional)
const objetivosForm = objetivos => `
  <fieldset><legend>Grupos de movimientos</legend>
    <div class="chips">${Object.entries(GRUPOS).map(([g, n]) => `<label class="chip-sel"><input type="checkbox" name="grupoObj" value="${g}" ${objetivos.some(o => o.tipo === 'grupo' && o.grupo === g) ? 'checked' : ''}>${esc(n)}</label>`).join('')}</div>
    <p class="note">Por ejemplo, Tracción si querés mejorar dominadas, remos y todo lo que sea tirar, sin atarte a un ejercicio.</p></fieldset>
  <fieldset><legend>Ejercicios puntuales</legend>
    <div id="f-goals" style="display:grid;gap:8px">${objetivos.filter(o => o.tipo === 'ej').map(goalRow).join('')}</div>
    <div><button class="btn small" type="button" data-act="addObj">+ Ejercicio</button></div></fieldset>`;
const leerObjetivos = () => [
  ...$$('input[name="grupoObj"]:checked').map(c => ({ tipo: 'grupo', grupo: c.value })),
  ...$$('#f-goals .goal-row').map(r => { const v = parseFloat(r.querySelector('input').value); return { tipo: 'ej', clave: r.querySelector('select').value, objetivo: v > 0 ? v : null }; })
];
const leerComps = () => $$('#f-comps .comp-row').map(r => { const [a, b] = r.querySelectorAll('input'); return { nombre: a.value.trim(), fecha: b.value }; }).filter(c => c.fecha);

function leerPaso() {
  const d = ui.draft, p = d.perfil, g = id => document.getElementById(id), n = id => parseFloat(g(id).value) || 0;
  if (g('f-nombre')) { p.nombre = g('f-nombre').value.trim(); p.sexo = g('f-sexo').value; p.edad = n('f-edad'); p.peso = n('f-peso'); p.altura = n('f-altura'); p.experiencia = n('f-exp'); }
  const enf = document.querySelector('input[name="enf"]:checked'); if (enf) p.enfoque = enf.value;
  if (g('f-dias')) { p.dias = +g('f-dias').value; p.recuperacion = +g('f-rec').value; }
  if (g('f-rm-sentadilla')) {
    MARCAS.forEach(k => { const ns = g('ns-' + k).checked; p.nose[k] = ns; p.rm[k] = ns ? 0 : n('f-rm-' + k); });
    SALTOS.forEach(k => { const ns = g('ns-' + k).checked; p.nose[k] = ns; p.salto[k] = ns ? 0 : n('f-j-' + k); });
  }
  const mo = document.querySelector('input[name="modoObj"]:checked');
  if (mo) { d.modoObj = mo.value; d.objetivos = mo.value === 'esp' ? leerObjetivos() : []; }
  if (g('f-dur')) { p.duracion = +g('f-dur').value; p.carga = +g('f-carga').value || 0; d.inicio = g('f-inicio').value; p.competencias = leerComps(); }
}
function renderOnb() {
  const d = ui.draft, p = d.perfil, i = ui.paso, paso = PASOS[i];
  if (paso === 'bienvenida') {
    $('#main').innerHTML = `<div class="onb">
      ${escena({ tall: true, label: 'Bienvenida', eyebrow: 'Marea', titulo: 'Tu entrenamiento, en mareas', sub: 'Semanas de carga, semanas de descarga y un registro de todo lo que levantás.', tipo: 'carga' })}
      <section class="card onb-card"><div class="onb-body">
        <p style="font-size:16px">Contame cómo entrenás y qué querés lograr. Yo armo el ciclo y, semana a semana, comparo lo que levantás con lo planeado para avisarte cuándo subir y cuándo descargar.</p>
        <p class="note">Son 6 pasos cortos. Después podés cambiar todo.</p>
        <div class="row"><button class="btn primary" data-act="sig">Empezar</button><button class="btn ghost" data-act="verEjemplo">Ver un ejemplo primero</button></div>
      </div></section></div>`;
    setSave(); conectarKilo([]);
    // Un saludo y Disco pasa: después, silencio
    setTimeout(() => decir('¡Hola! Soy Kilo, y él es Disco.', 5200), 700);
    setTimeout(() => rodarEscena(), 1600);
    return;
  }
  let body, say;
  if (paso === 'vos') {
    say = 'Primero, vos. Con tu peso calculo qué tan fuerte sos en relación a tu cuerpo.';
    body = `<h2 class="onb-h">Sobre vos</h2><div class="fgrid">
      <label class="f">Nombre<input id="f-nombre" value="${esc(p.nombre)}" autocomplete="given-name"></label>
      ${sel('f-sexo', 'Sexo', [['m', 'Masculino'], ['f', 'Femenino']], p.sexo)}
      ${num('f-edad', 'Edad', p.edad)}${num('f-peso', 'Peso corporal', p.peso, .1, 'kg')}${num('f-altura', 'Altura', p.altura, 1, 'cm')}${num('f-exp', 'Años entrenando', p.experiencia, .5)}</div>`;
  } else if (paso === 'enfoque') {
    say = 'Esto define las fases del ciclo. Si dudás entre dos, elegí mixto.';
    body = `<h2 class="onb-h">¿Qué buscás?</h2>
      <div class="opts" role="radiogroup" aria-label="Enfoque">${Object.entries(ENFOQUES).map(([k, t]) => `<label class="opt"><input type="radio" name="enf" value="${k}" ${p.enfoque === k ? 'checked' : ''}><b>${esc(t)}</b><span>${ENF_DESC[k]}</span></label>`).join('')}</div>
      <div class="fgrid">${sel('f-dias', 'Días por semana', [2, 3, 4, 5, 6].map(x => [x, x + ' días']), p.dias)}${sel('f-rec', 'Cómo recuperás (sueño, estrés, trabajo)', [[1, '1 · muy mal'], [2, '2 · flojo'], [3, '3 · normal'], [4, '4 · bien'], [5, '5 · excelente']], p.recuperacion)}</div>`;
  } else if (paso === 'marcas') {
    say = 'Si hacés un ejercicio pero no sabés tu marca, tocá «No sé»: la calculo con tus primeros entrenamientos.';
    body = `<h2 class="onb-h">Tus marcas actuales ${ay('rm')}</h2>
      <p class="note">Vacío = no lo hago. «No sé» = lo hago pero no conozco mi marca. Si sabés una serie pesada reciente, tu 1RM es más o menos peso × (1 + reps/30).</p>
      <div class="fgrid">${MARCAS.map(k => markField(k, p.rm[k], p.nose[k])).join('')}${SALTOS.map(k => markField(k, p.salto[k], p.nose[k])).join('')}</div>`;
  } else if (paso === 'objetivos') {
    say = 'Podés ir a mejorar en general, o elegir grupos de movimientos y ejercicios puntuales.';
    body = `<h2 class="onb-h">¿Qué querés mejorar?</h2>
      <div class="opts" role="radiogroup" aria-label="Tipo de objetivo">${[['gen', 'Todo en general', 'Sigo todos tus ejercicios por igual.'], ['esp', 'Algo en particular', 'Un grupo (por ejemplo, tracción) o ejercicios puntuales. Eso pesa el doble en tu plan.']].map(([v, t, s]) => `<label class="opt"><input type="radio" name="modoObj" value="${v}" ${d.modoObj === v ? 'checked' : ''}><b>${t}</b><span>${s}</span></label>`).join('')}</div>
      <div id="goalsWrap" style="display:grid;gap:16px" ${d.modoObj === 'esp' ? '' : 'hidden'}>${objetivosForm(d.objetivos)}</div>`;
  } else if (paso === 'calendario') {
    say = 'Si tenés una competencia, armo el ciclo hacia atrás desde esa fecha.';
    const b = lunes(new Date());
    body = `<h2 class="onb-h">Calendario</h2>
      <div class="fgrid">${sel('f-inicio', 'Empezar', [['este', 'Esta semana (desde el ' + fd(b) + ')'], ['proximo', 'La semana que viene (' + fd(addD(b, 7)) + ')']], d.inicio)}
      ${sel('f-dur', 'Duración si no hay competencia', [8, 10, 12, 16, 20, 24].map(x => [x, x + ' semanas']), p.duracion)}
      ${sel('f-carga', 'Semanas de carga por bloque', [[0, 'Automático'], ...[2, 3, 4, 5, 6].map(x => [x, x + ' + 1 descarga'])], p.carga)}</div>
      <fieldset><legend>Competencias (opcional)</legend><div id="f-comps" style="display:grid;gap:8px">${(p.competencias.length ? p.competencias : [{ nombre: '', fecha: '' }]).map(compRow).join('')}</div>
      <div><button class="btn small" type="button" data-act="addComp">+ Competencia</button></div></fieldset>`;
  } else {
    say = '¡Listo! Así quedó tu ciclo. Tu rutina la ajustás después en la pestaña Rutina.';
    const ini = inicioDe(d.inicio), pl = generar({ inicio: iso(ini), comp: elegirComp(p, ini), snap: { perfil: p, objetivos: d.objetivos }, overrides: {} });
    body = `<h2 class="onb-h">Tu ciclo${p.nombre ? ', ' + esc(p.nombre) : ''}</h2>
      <dl class="meta-list">
        <div><dt>Nivel estimado</dt><dd>${NIVEL[pl.nivel]}</dd></div>
        <div><dt>Ritmo</dt><dd>${pl.L} carga + 1 descarga</dd></div>
        <div><dt>Duración</dt><dd>${pl.weeks.length} semanas · ${fd(ini)} – ${fd(addD(ini, pl.weeks.length * 7 - 1))}</dd></div>
        <div><dt>Fases</dt><dd>${pl.fases.filter((f, k) => pl.blocks.some(b => b.fase === k)).map(f => f.n).join(' → ')}</dd></div>
        ${pl.comp ? `<div><dt>Competencia</dt><dd>${esc(pl.comp.nombre)} · ${fd(parse(pl.comp.fecha))}</dd></div>` : ''}
      </dl>
      <div class="strip" aria-hidden="true">${pl.weeks.map(w => `<i class="${w.tipo}"></i>`).join('')}</div>
      ${pl.aviso ? `<p class="note">${esc(pl.aviso)}</p>` : ''}`;
  }
  $('#main').innerHTML = `<div class="onb"><section class="card onb-card" aria-label="Primeros pasos">
    <div class="onb-top"><div class="dots-prog" aria-hidden="true">${PASOS.slice(1).map((_, k) => `<i class="${k < i ? 'on' : ''}"></i>`).join('')}</div><span class="note">Paso ${i} de ${PASOS.length - 1}</span></div>
    <div class="onb-grid">
      <div class="onb-kilo">${kilo()}<div class="say" role="status">${say}</div></div>
      <form id="onbForm" class="onb-body" novalidate>${body}
        <p class="err" id="fErr" hidden></p>
        <div class="row"><button type="button" class="btn" data-act="atras">Atrás</button><button class="btn primary" type="submit">${paso === 'listo' ? 'Armar mi plan' : 'Siguiente'}</button></div>
      </form></div></section></div>`;
  setSave(); conectarKilo([]);
  setTimeout(() => act($('.onb-kilo .kilo-svg'), paso === 'listo' ? 'hop' : 'waving', 1900), 300);
}
function avanzarOnb() {
  leerPaso();
  const d = ui.draft, p = d.perfil, paso = PASOS[ui.paso], err = $('#fErr'), fail = m => { err.textContent = m; err.hidden = false; };
  if (paso === 'vos' && !(p.peso > 0)) return fail('Falta tu peso corporal: lo uso para estimar tu nivel.');
  if (paso === 'marcas' && ![...MARCAS, ...SALTOS].some(k => p.rm[k] > 0 || p.salto[k] > 0 || p.nose[k])) return fail('Cargá al menos una marca o marcá «No sé» en lo que hacés.');
  if (paso === 'objetivos' && d.modoObj === 'esp' && !d.objetivos.length) return fail('Elegí al menos un grupo o un ejercicio, o elegí «Todo en general».');
  if (paso === 'listo') {
    crearPlan(clone(p), clone(d.objetivos), d.inicio);
    ui.view = 'dash'; ui.tab = 'semana'; ui.wk = null; ui.justCreated = true; saludado = false;
    persist(); if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    scrollTo(0, 0); return render();
  }
  ui.paso++; render(); scrollTo(0, 0);
}

/* ================= MODALES ================= */
function openModal(html) {
  $('#modalRoot').innerHTML = `<div class="overlay" data-act="cerrarModal"><div class="modal-wrap"><div class="kilo-modal">${kilo()}</div><div class="modal" role="dialog" aria-modal="true">${html}</div></div></div>`;
  const f = $('#modalRoot input:not([type=hidden]),#modalRoot select,#modalRoot textarea,#modalRoot .modal button'); if (f) f.focus();
}
const closeModal = () => { $('#modalRoot').innerHTML = ''; };
function modalPerfil() {
  const p = state.perfil;
  openModal(`<h2 style="font-size:20px">Editar mis datos</h2>
  <form id="fPerfil" style="display:grid;gap:22px" novalidate>
   <fieldset><legend>Vos</legend><div class="fgrid">
    <label class="f">Nombre<input id="f-nombre" value="${esc(p.nombre)}" autocomplete="given-name"></label>
    ${sel('f-sexo', 'Sexo', [['m', 'Masculino'], ['f', 'Femenino']], p.sexo)}
    ${num('f-edad', 'Edad', p.edad)}${num('f-peso', 'Peso corporal', p.peso, .1, 'kg')}${num('f-altura', 'Altura', p.altura, 1, 'cm')}${num('f-exp', 'Años entrenando', p.experiencia, .5)}</div></fieldset>
   <fieldset><legend>Cómo entrenás</legend><div class="fgrid">
    ${sel('f-enfoque', 'Enfoque', Object.entries(ENFOQUES), p.enfoque)}
    ${sel('f-dias', 'Días por semana', [2, 3, 4, 5, 6].map(x => [x, x + ' días']), p.dias)}
    ${sel('f-rec', 'Cómo recuperás (sueño, estrés, trabajo)', [[1, '1 · muy mal'], [2, '2 · flojo'], [3, '3 · normal'], [4, '4 · bien'], [5, '5 · excelente']], p.recuperacion)}
    ${sel('f-dur', 'Duración del ciclo', [8, 10, 12, 16, 20, 24].map(x => [x, x + ' semanas']), p.duracion)}
    ${sel('f-carga', 'Semanas de carga por bloque', [[0, 'Automático'], ...[2, 3, 4, 5, 6].map(x => [x, x + ' + 1 descarga'])], p.carga || 0)}</div></fieldset>
   <fieldset><legend>Competencias</legend><div id="f-comps" style="display:grid;gap:8px">${(p.competencias || []).map(compRow).join('')}</div>
    <div><button class="btn small" type="button" data-act="addComp">+ Competencia</button></div></fieldset>
   <fieldset><legend>Marcas ${ay('rm')}</legend><div class="fgrid">${MARCAS.map(k => num('f-rm-' + k, ...marcaLbl(k).slice(0, 1), p.rm[k], 2.5, marcaLbl(k)[1])).join('')}${SALTOS.map(k => num('f-j-' + k, nombreDe(k), p.salto[k], 1, 'cm')).join('')}</div></fieldset>
   <div style="display:grid;gap:16px"><h3>Qué querés mejorar</h3>${objetivosForm(state.objetivos)}<p class="note">Sin nada elegido = mejorar todo en general.</p></div>
   <label class="chk"><input type="checkbox" id="f-regen" checked> Rehacer el ciclo actual con estos datos (mantiene la fecha de inicio y tus registros)</label>
   <p class="err" id="fErr" hidden></p>
   <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-act="cerrarModal">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div>
  </form>`);
}
function guardarPerfil() {
  const v = id => $('#' + id).value, n = id => parseFloat(v(id)) || 0;
  const p = { ...state.perfil, nombre: v('f-nombre').trim(), sexo: v('f-sexo'), edad: n('f-edad'), peso: n('f-peso'), altura: n('f-altura'), experiencia: n('f-exp'),
    enfoque: v('f-enfoque'), dias: +v('f-dias'), recuperacion: +v('f-rec'), duracion: +v('f-dur'), carga: +v('f-carga') || 0, rm: { ...state.perfil.rm }, salto: { ...state.perfil.salto }, nose: { ...state.perfil.nose }, competencias: leerComps() };
  MARCAS.forEach(k => { p.rm[k] = n('f-rm-' + k); if (p.rm[k] > 0) p.nose[k] = false; });
  SALTOS.forEach(k => { p.salto[k] = n('f-j-' + k); if (p.salto[k] > 0) p.nose[k] = false; });
  if (!(p.peso > 0)) { const err = $('#fErr'); err.textContent = 'Falta tu peso corporal: lo uso para estimar tu nivel.'; err.hidden = false; return; }
  const objetivos = leerObjetivos();
  state.perfil = p; state.objetivos = objetivos;
  if ($('#f-regen').checked) { const cy = activo(); cy.snap = clone({ perfil: p, objetivos }); cy.overrides = {}; cy.comp = elegirComp(p, parse(cy.inicio)); }
  if (state.rutinaModo === 'auto') state.rutina = rutinaBase(p, objetivos);
  closeModal(); persist(); render();
}
function modalCerrar() {
  const p = state.perfil, cy = activo(), plan = planDe(cy), recs = Object.fromEntries(records(plan, cy).map(r => [r.k, r.v]));
  const pr = k => proyeccion(plan, k);
  openModal(`<h2 style="font-size:20px">Cerrar ciclo ${state.ciclos.length}</h2>
  <p class="note">Anotá las marcas de tu test. Precargué lo mejor que registraste o la proyección: cambialo por lo que hiciste de verdad.</p>
  <form id="fCerrar" style="display:grid;gap:20px" novalidate>
   <fieldset><legend>Marcas nuevas</legend><div class="fgrid">
    ${MARCAS.filter(k => p.rm[k] > 0 || recs[k]).map(k => num('c-' + k, marcaLbl(k)[0], recs[k] || (pr(k) ? r25(pr(k).proj) : ''), 2.5, marcaLbl(k)[1])).join('')}
    ${SALTOS.filter(k => p.salto[k] > 0).map(k => num('c-' + k, nombreDe(k), Math.round(pr(k).proj), 1, 'cm')).join('')}</div></fieldset>
   <fieldset><legend>Próximo ciclo</legend><div class="fgrid">
    ${sel('c-enfoque', 'Enfoque', Object.entries(ENFOQUES), p.enfoque)}
    ${sel('c-dur', 'Duración', [8, 10, 12, 16, 20, 24].map(x => [x, x + ' semanas']), p.duracion)}</div></fieldset>
   <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-act="cerrarModal">Cancelar</button><button class="btn primary" type="submit">Empezar ciclo ${state.ciclos.length + 1}</button></div>
  </form>`);
}
function cerrarCiclo() {
  const p = state.perfil, cy = activo(), plan = planDe(cy), antes = { ...p.rm, ...p.salto }, np = clone(p);
  MARCAS.forEach(k => { const el = $('#c-' + k); if (el && +el.value > 0) { np.rm[k] = +el.value; np.nose[k] = false; } });
  SALTOS.forEach(k => { const el = $('#c-' + k); if (el && +el.value > 0) { np.salto[k] = +el.value; np.nose[k] = false; } });
  np.enfoque = $('#c-enfoque').value; np.duracion = +$('#c-dur').value;
  cy.cierre = { fecha: iso(new Date()), semanas: plan.weeks.length, antes, despues: { ...np.rm, ...np.salto } };
  const hoy = lunes(new Date()), inicio = new Date().getDay() === 1 ? hoy : addD(hoy, 7);
  state.perfil = np; state.ciclos.push(nuevoCiclo(np, state.objetivos, inicio));
  if (state.rutinaModo === 'auto') state.rutina = rutinaBase(np, state.objetivos);
  ui.wk = null; ui.tab = 'semana'; closeModal(); persist(); render();
}
function textoCoach() {
  const cy = activo(), plan = planDe(cy), p = plan.p, ini = parse(cy.inicio);
  const L = [`PLAN MAREA${p.nombre ? ' · ' + p.nombre : ''}`, `${ENFOQUES[p.enfoque]} · ${p.dias} días/semana · nivel ${NIVEL[plan.nivel].toLowerCase()} · ${plan.L} carga + 1 descarga`,
    `Marcas: ` + [...MARCAS.filter(k => p.rm[k] > 0).map(k => `${corto(k)} ${p.rm[k]} kg${k === 'dominadas' ? ' de lastre' : ''}`), ...SALTOS.filter(k => p.salto[k] > 0).map(k => `${nombreDe(k)} ${p.salto[k]} cm`)].join(', '),
    `Quiero mejorar: ` + ((plan.objetivos || []).map(o => o.tipo === 'grupo' ? GRUPOS[o.grupo] : corto(o.clave) + (o.objetivo ? ' ' + o.objetivo : '')).join(', ') || 'todo en general'), '',
    'RUTINA', ...state.rutina.map((s, i) => `  ${i + 1}. ${s.nombre}: ${s.items.map(it => corto(it.e)).join(', ')}`), ''];
  plan.blocks.forEach(b => {
    L.push(`${b.nombre.toUpperCase()}${b.total > 1 ? ' ' + (b.rep + 1) : ''} (semanas ${b.start + 1}–${b.start + b.len}) · ${plan.fases[b.fase].obj}`);
    for (let i = b.start; i < b.start + b.len; i++) { const w = plan.weeks[i]; L.push(`  S${i + 1} ${fd(addD(ini, i * 7))} · ${tipoTxt(plan, w)} · ${Math.round(w.int)}% 1RM · ${w.sets} × ${w.reps} · RPE ${rpeTxt(w)}${w.plyo ? ` · saltos ${w.plyo.c} contactos (${w.plyo.i})` : ''}`); }
  });
  return L.join('\n');
}
function modalCoach() {
  openModal(`<h2 style="font-size:20px">Para tu entrenador</h2>
   <p class="note">El plan completo en texto. Copialo y mandalo por donde hablen.</p>
   <textarea id="coachTxt" readonly aria-label="Plan en texto">${esc(textoCoach())}</textarea>
   <div class="row" style="justify-content:flex-end"><span class="note" id="copyMsg"></span><button class="btn" data-act="cerrarModal">Cerrar</button><button class="btn primary" data-act="copiar">Copiar</button></div>`);
}
function modalNuevoEj() {
  openModal(`<h2 style="font-size:20px">Crear un ejercicio</h2>
  <p class="note">Queda guardado en tu lista y lo podés usar en cualquier entrenamiento.</p>
  <form id="fNuevoEj" style="display:grid;gap:14px" novalidate>
    <label class="f">Nombre<input id="ne-n" maxlength="60"></label>
    <div class="fgrid">${sel('ne-g', 'Grupo', Object.entries(GRUPOS), 'core')}${sel('ne-t', 'Cómo se registra', Object.entries(TIPOS), 'carga')}</div>
    <p class="err" id="fErr" hidden></p>
    <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-act="cerrarModal">Cancelar</button><button class="btn primary" type="submit">Crear</button></div>
  </form>`);
}
function exportar() {
  const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `marea-respaldo-${iso(new Date())}.json`; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ================= EVENTOS ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, cy = activo();
  if (a === 'cerrarModal') { if (el.classList.contains('overlay') && e.target !== el) return; closeModal(); return; }
  if (a === 'ayuda') { const [t, d] = AYUDA[el.dataset.t]; openModal(`<h2 style="font-size:20px">${esc(t)}</h2><p>${esc(d)}</p><div class="row" style="justify-content:flex-end"><button class="btn primary" data-act="cerrarModal">Entendido</button></div>`); return; }
  if (a === 'tab') { ui.tab = el.dataset.t; ui.open = null; render(); return; }
  if (a === 'wk') { ui.wk += +el.dataset.d; ui.open = null; render(); return; }
  if (a === 'verSemPlan') { ui.planSel = +el.dataset.i; render(); return; }
  if (a === 'irSemana') { ui.wk = +el.dataset.i; ui.tab = 'semana'; ui.open = null; render(); scrollTo(0, 0); return; }
  if (a === 'abrir') {
    ui.open = ui.open === el.dataset.s ? null : el.dataset.s; render();
    if (ui.open) { const f = document.querySelector(`.ses-form[data-s="${ui.open}"]`); if (f) f.closest('.ses').scrollIntoView({ block: 'nearest', behavior: REDUCE ? 'auto' : 'smooth' }); }
    return;
  }
  if (a === 'addSet') {
    const ex = el.closest('.ex'), sets = ex.querySelector('.sets'), last = sets.lastElementChild, f = el.closest('.ses-form');
    const s = state.rutina.find(x => x.id === f.dataset.s), it = s.items.find(x => x.id === ex.dataset.i), ph = n => last ? (last.querySelector(`[data-f="${n}"]`) || {}).placeholder : '';
    const tmp = document.createElement('div'); tmp.innerHTML = setRow(ejDe(it.e), s.id, it.id, sets.children.length, null, { kg: ph('kg'), reps: ph('reps'), seg: ph('seg'), conRM: true }, null);
    sets.appendChild(tmp.firstElementChild); return;
  }
  if (a === 'rellenar') {
    el.closest('.ses-form').querySelectorAll('.set').forEach(r => {
      const kg = r.querySelector('[data-f=kg]'); if (kg && !kg.value && !/^[\d.]+$/.test(kg.placeholder)) return;
      r.querySelectorAll('input').forEach(i => { if (i.dataset.f !== 'marca' && !i.value && /^[\d.]+$/.test(i.placeholder)) i.value = i.placeholder; });
    });
    return;
  }
  if (a === 'usarRM') {
    el.dataset.rs.split(',').forEach(x => { const [k, v] = x.split(':'); state.perfil.rm[k] = +v; state.perfil.nose[k] = false; cy.snap.perfil.rm[k] = +v; });
    persist(); ui.celebrar = '¡Listo! Actualicé tus 1RM: las cargas sugeridas ya están recalculadas.'; render(); return;
  }
  if (a === 'descartar') { el.dataset.id.split(',').forEach(id => ui.descartados.add(id)); render(); return; }
  if (a === 'adelantar') { cy.overrides = cy.overrides || {}; cy.overrides[+el.dataset.i] = 'descarga'; persist(); render(); return; }
  if (a === 'toggleDes') { const i = +el.dataset.i; cy.overrides = cy.overrides || {}; if (cy.overrides[i]) delete cy.overrides[i]; else cy.overrides[i] = 'descarga'; persist(); render(); return; }
  if (a === 'perfil') return modalPerfil();
  if (a === 'cerrar') return modalCerrar();
  if (a === 'coach') return modalCoach();
  if (a === 'nuevoEj') return modalNuevoEj();
  if (a === 'exportar') return exportar();
  if (a === 'copiar') {
    const ta = $('#coachTxt');
    Promise.resolve().then(() => navigator.clipboard.writeText(ta.value)).then(() => { $('#copyMsg').textContent = 'Copiado'; }, () => { ta.select(); $('#copyMsg').textContent = 'Seleccioné el texto: copialo a mano'; });
    return;
  }
  if (a === 'addObj') { $('#f-goals').insertAdjacentHTML('beforeend', goalRow({ clave: 'sentadilla' })); return; }
  if (a === 'addComp') { $('#f-comps').insertAdjacentHTML('beforeend', compRow({ nombre: '', fecha: '' })); return; }
  if (a === 'quitarFila') { const enRutina = !!el.closest('#rutForm'); el.closest(el.dataset.sel).remove(); if (enRutina) guardarRutina(); return; }
  if (a === 'addEx') { el.closest('.rut-s').querySelector('.rut-ex').insertAdjacentHTML('beforeend', itemRow({ id: nid('i'), e: 'sentadilla' })); guardarRutina(); return; }
  if (a === 'addSes') { $('#rutList').insertAdjacentHTML('beforeend', sesBloque({ id: nid('s'), nombre: 'Entrenamiento ' + ($('#rutList').children.length + 1), items: [{ id: nid('i'), e: 'sentadilla' }] })); guardarRutina(); return; }
  if (a === 'rutModo') {
    if (el.dataset.v === state.rutinaModo) return;
    if (el.dataset.v === 'propia') { state.rutinaModo = 'propia'; persist(); render(); return; }
    return openModal(`<h2 style="font-size:20px">Volver a la rutina sugerida</h2><p class="note">Reemplaza tus entrenamientos por los que sugiero según tus datos. Tus registros anteriores no se borran.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-act="cerrarModal">Cancelar</button><button class="btn primary" data-act="rutAutoOk">Usar la sugerida</button></div>`);
  }
  if (a === 'rutAutoOk') { state.rutina = rutinaBase(state.perfil, state.objetivos); state.rutinaModo = 'auto'; persist(); closeModal(); render(); return; }
  if (a === 'onb') { ui.view = 'onb'; ui.paso = 1; ui.draft = nuevoDraft(); render(); scrollTo(0, 0); return; }
  if (a === 'sig') { ui.paso = 1; render(); scrollTo(0, 0); return; }
  if (a === 'verEjemplo') { state = ejemplo(); ui.view = 'dash'; ui.tab = 'semana'; ui.wk = null; saludado = false; render(); return; }
  if (a === 'atras') { leerPaso(); ui.paso--; render(); return; }
  if (a === 'reset') return openModal(`<h2 style="font-size:20px">Empezar de cero</h2>
    <p class="note">Se borran tu plan, tus ciclos, tu rutina y tus registros de este dispositivo. No se puede deshacer: si querés, descargá un respaldo antes desde la pestaña Plan.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn" data-act="cerrarModal">Cancelar</button><button class="btn primary" data-act="resetOk">Borrar todo</button></div>`);
  if (a === 'resetOk') {
    try { localStorage.removeItem(LS); } catch (err) { /* sin acceso al almacenamiento: no hay nada que borrar */ }
    state = ejemplo(); Object.assign(ui, { view: 'onb', paso: 0, draft: nuevoDraft(), wk: null, tab: 'semana', open: null }); saludado = false;
    closeModal(); render(); scrollTo(0, 0);
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.ns) { const inp = document.getElementById(t.dataset.ns); inp.disabled = t.checked; if (t.checked) inp.value = ''; }
  if (t.name === 'modoObj') { const w = $('#goalsWrap'); if (w) w.hidden = t.value !== 'esp'; }
  if (t.closest && t.closest('#rutForm')) guardarRutina();
  if (t.id === 'importar' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try { const s = JSON.parse(r.result); if (!s || !s.ciclos || !s.perfil) throw new Error('formato'); state = migrar(s); state.ejemplo = false; persist(); ui.wk = null; render(); decir('Listo, restauré tu respaldo.'); }
      catch (err) { openModal(`<h2 style="font-size:20px">No pude leer ese archivo</h2><p class="note">Elegí un respaldo descargado desde Marea (un archivo .json).</p><div class="row" style="justify-content:flex-end"><button class="btn primary" data-act="cerrarModal">Entendido</button></div>`); }
    };
    r.readAsText(t.files[0]);
  }
});
document.addEventListener('submit', e => {
  const f = e.target; e.preventDefault();
  if (f.id === 'onbForm') return avanzarOnb();
  if (f.id === 'fPerfil') return guardarPerfil();
  if (f.id === 'fCerrar') return cerrarCiclo();
  if (f.id === 'fNuevoEj') {
    const n = $('#ne-n').value.trim(); if (!n) { const err = $('#fErr'); err.textContent = 'Poné un nombre para el ejercicio.'; err.hidden = false; return; }
    const t = $('#ne-t').value;
    state.propios.push({ id: nid('p'), n, g: $('#ne-g').value, t, marca: t === 'salto' ? 'cm' : t === 'lanzamiento' ? 'm' : undefined });
    persist(); closeModal(); render(); return;
  }
  if (f.classList.contains('salto-form')) {
    const k = f.dataset.k, v = parseFloat(f.querySelector('input').value); if (!(v > 0)) return;
    const cy = activo(), { c } = semanaActual(cy, planDe(cy));
    cy.saltos.push({ k, wi: c, v, fecha: iso(new Date()) });
    if (!(state.perfil.salto[k] > 0)) { state.perfil.salto[k] = v; cy.snap.perfil.salto[k] = v; if (!(cy.inicioRM[k] > 0)) cy.inicioRM[k] = v; }
    persist(); render(); return;
  }
  if (f.classList.contains('ses-form')) {
    const cy = activo(), wi = +f.dataset.w, sid = f.dataset.s, s = state.rutina.find(x => x.id === sid), ej = {}; let n = 0;
    f.querySelectorAll('.ex').forEach(div => {
      const it = s.items.find(x => x.id === div.dataset.i); if (!it) return;
      const sets = leerSets(div, ejDe(it.e)); if (sets.length) { ej[it.id] = { e: it.e, s: sets }; n += sets.length; }
    });
    if (!n) { const er = f.querySelector('.err'); er.textContent = 'Cargá al menos una serie (con kilos y repeticiones; para peso corporal, 0 kg).'; er.hidden = false; return; }
    cy.logs[wi] = cy.logs[wi] || {}; cy.logs[wi][sid] = { fecha: iso(new Date()), ej };
    ui.open = null; persist();
    const plan = planDe(cy), r = rendimientoSemana(plan, cy, wi).filter(x => x.sid === sid && x.ratio != null);
    let msg = '¡Entrenamiento guardado!';
    if (r.length) {
      const m = r.reduce((a, x) => a + x.ratio, 0) / r.length, pc = Math.round((m - 1) * 100);
      msg = pc >= 1 ? `¡Guardado! Quedaste ${pc}% arriba de lo planeado.` : pc <= -5 ? `Guardado. Quedaste ${-pc}% abajo de lo planeado; si se repite, ajustamos.` : '¡Guardado! Justo en lo planeado.';
    }
    ui.celebrar = msg; render();
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalRoot').innerHTML) closeModal(); });

/* ================= ARRANQUE ================= */
state = ejemplo(); ui.draft = nuevoDraft();
try { const s = localStorage.getItem(LS); if (s) { state = migrar(JSON.parse(s)); ui.view = 'dash'; } } catch (e) { /* almacenamiento bloqueado: se usa el ejemplo */ }
iniciarMascotas();
render();
setTimeout(() => vueltaDisco(), 2500);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
