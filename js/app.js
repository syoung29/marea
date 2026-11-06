// Marea: interfaz. Estado, pantallas, primeros pasos, modales y eventos.
import { $, $$, esc, r25, clone, iso, parse, lunes, addD, fd, fmt, nid } from './util.js';
import { GRUPOS, TIPOS, MARCAS, SALTOS, EXTRA_GRUPO, ejDe, todos, registrarPropios, alternativas, EQUIPO, disponible } from './ejercicios.js';
import {
  ENFOQUES, NIVEL, generar, elegirComp, proyeccion, veredicto, objetivoEj, rpeTxt, rendimientoSemana, veredictoSemana,
  sugerirDescarga, records, puntosLift, puntosSalto, cambios, promedioGrupo, ultimaEntrada, mejorSerie, proyeccionAjustada, ajustesBaja, rol, ROLES, revisarRutina
} from './motor.js';
import { kilo, escena, act, decir, conectarKilo, iniciarMascotas, rodarEscena, vueltaDisco, REDUCE } from './mascotas.js';

const LS = 'marea.datos';
// Perfiles (modo desarrollador): cada uno se guarda en su propia clave. El primero, «principal», usa la clave de siempre.
const LS_IDX = 'marea.perfiles', LS_ACT = 'marea.activo', LS_DEV = 'marea.dev';
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };
const lsDel = k => { try { localStorage.removeItem(k); } catch (e) { /* sin acceso: no hay nada que borrar */ } };
const claveDe = id => id === 'principal' ? LS : `${LS}.${id}`;
let perfilId = lsGet(LS_ACT) || 'principal', dev = lsGet(LS_DEV) === '1';
function indicePerfiles() {
  let l; try { l = JSON.parse(lsGet(LS_IDX) || '[]'); } catch (e) { l = []; }
  if (!l.some(x => x.id === 'principal')) l.unshift({ id: 'principal', nombre: 'Principal' });
  return l;
}
const guardarIndice = l => lsSet(LS_IDX, JSON.stringify(l));
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
  trabajo: ['Trabajo semanal', 'Cuánto entrenás en la semana: series por repeticiones. Las barras altas son semanas con mucho trabajo; las bajas, descargas.'],
  esfuerzo: ['Esfuerzo en saltos', 'Si no podés medir la altura o la distancia, anotá cómo salieron: suave (técnica, sin buscar altura), fuerte (casi a tope) o máximo (cada salto a todo). Así controlás que la intensidad sea la de la semana: en las de intensidad baja, la mayoría debería ser suave.'],
  medir: ['Medir saltos sin equipos', 'Salto vertical: parado al lado de una pared, marcá con tiza o cinta lo más alto que llegás con el brazo estirado; después saltá y tocá la pared lo más alto que puedas. La diferencia es tu salto. Salto al cajón: anotá la altura del cajón más alto que pasás bien. Salto en largo: medí con una cinta o contá baldosas (suelen medir 30, 40 o 60 cm). También hay apps que calculan la altura con un video en cámara lenta.']
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
// Rutina sugerida: reglas de programación aplicadas a tus datos (ver docs/metodologia.md)
const ORDEN_ROL = { potencia: 0, olimpico: 1, principal: 2, secundario: 3, accesorio: 4, core: 5 };
// Lo que se pregunta para armar la rutina (paso «Tu rutina» y «Cambiar respuestas»)
const ENCARES = {
  basicos: ['Pocos ejercicios, pesados', 'Los básicos y poco más. Sesiones cortas y concentradas.'],
  equilibrado: ['Equilibrada', 'Básicos, secundarios y algunos accesorios.'],
  variado: ['Variada', 'Más ejercicios distintos y más trabajo accesorio.']
};
const GUSTOS = { barra: 'Básicos con barra', saltos: 'Saltos y pliometría', olimpicos: 'Olímpicos', mancuernas: 'Mancuernas y unilaterales', maquinas: 'Máquinas y poleas', funcional: 'Funcionales (kettlebell, landmine, trineo)' };
const DEPORTES = { ninguno: 'No hago otro deporte', equipo: 'De equipo (fútbol, rugby, básquet, hockey…)', raqueta: 'Raqueta (tenis, pádel…)', combate: 'Combate', resistencia: 'Resistencia (correr, ciclismo, natación)', salto: 'Saltos o velocidad (atletismo, vóley)' };
const MOLESTIAS = { rodilla: 'Rodilla', hombro: 'Hombro', espalda: 'Espalda baja' };
const DESCANSOS = { poco: ['Poco (1 min o menos)', 60], normal: ['Normal (unos 2 min)', 120], mucho: ['Mucho (3 min o más)', 180] };
// Ejercicios que cargan una zona con molestias: se reemplazan por una alternativa del mismo estilo
const EVITAR = {
  rodilla: ['drop_jump', 'bounds', 'vallas', 'salto_una_pierna', 'zancadas', 'sentadilla_frontal', 'step_up'],
  hombro: ['militar', 'push_press', 'fondos', 'envion', 'arranque', 'arranque_colgante', 'inclinado'],
  espalda: ['good_morning', 'remo_barra', 'sumo', 'slam', 'zercher', 'espinales']
};
const prefsDe = p => ({ encare: 'equilibrado', gustos: [], equipo: Object.keys(EQUIPO), duracion: 60, descanso: 'normal', deporte: 'ninguno', deporteDias: 0, molestias: [], ...(p.prefs || {}) });

// Arma la rutina sugerida con reglas de programación y tus respuestas. Devuelve la rutina y el porqué de cada decisión.
function armarRutina(p, objetivos = []) {
  const pr = prefsDe(p), razones = [];
  const pot = p.enfoque === 'potencia' || p.enfoque === 'mixto', hip = p.enfoque === 'hipertrofia', item = e => ({ id: nid('i'), e });
  const tiene = k => p.rm[k] > 0 || !!(p.nose || {})[k], gusta = g => pr.gustos.includes(g);
  const deporteSalta = (pr.deporte === 'equipo' || pr.deporte === 'salto') && pr.deporteDias >= 2;
  const r = (SPLITS[p.dias] || SPLITS[4]).map(([nombre, ejs, pierna]) => ({ id: nid('s'), nombre, pierna: !!pierna, items: ejs.map(item) }));
  const piernas = r.filter(s => s.pierna), torsos = r.filter(s => !s.pierna);
  const metas = new Set(objetivos.filter(o => o.tipo === 'ej').map(o => o.clave)), fijos = new Set();
  const poner = (s, e) => { if (s && !s.items.some(i => i.e === e)) s.items.push(item(e)); };
  razones.push(`${p.dias} días: ${p.dias <= 3 ? 'cuerpo completo, así cada básico se entrena más de una vez por semana' : p.dias === 4 ? 'torso y pierna alternados, dos veces cada uno' : 'empuje, tirón y pierna'}.`);

  // 1. Pliometría al principio de los días de pierna; vertical y horizontal en días distintos
  if (!hip && piernas.length && (pot || gusta('saltos') || p.enfoque === 'fuerza')) {
    let plio = pot ? [['cmj', 'lanz_vertical'], ['largo', 'salto_una_pierna']] : [['salto_cajon'], ['largo']];
    if (deporteSalta) { plio = plio.map(l => l.slice(0, 1)); razones.push(`Ya saltás y corrés ${pr.deporteDias} días en tu deporte: un solo salto por día de pierna y menos contactos.`); }
    if (pr.molestias.includes('rodilla')) { plio = plio.map(l => l.map(e => e === 'salto_una_pierna' ? 'salto_cajon' : e)); razones.push('Por la rodilla: saltos al cajón (caés más bajo) en vez de saltos a una pierna o reactivos.'); }
    piernas.forEach((s, i) => plio[i % 2].forEach(e => poner(s, e)));
    if (pot && torsos.length) poner(torsos[0], pr.deporte === 'raqueta' || pr.deporte === 'combate' ? 'lanz_rotacional' : 'lanz_horizontal');
    razones.push('Saltos y lanzamientos al principio de la sesión: piden el sistema nervioso fresco.');
  }
  // 2. Olímpicos: si los hacés, si marcaste «No sé» o si te gustan
  if ((pot || gusta('olimpicos')) && piernas.length) {
    if (tiene('cargada')) poner(piernas[0], 'cargada'); else if (gusta('olimpicos')) poner(piernas[0], 'cargada_colgante');
    if (tiene('arranque')) poner(piernas[1] || piernas[0], 'arranque');
  }
  // 3. Prevención de lesiones según enfoque y deporte
  // Lo que se suma por prevención o por gusto queda marcado: el porqué se arma al final, con lo que realmente entró
  const sumar = (s, e, por) => { if (s && !s.items.some(i => i.e === e)) { const it = item(e); it.por = por; s.items.push(it); } };
  if (pot || pr.deporte === 'equipo' || pr.deporte === 'salto') { sumar(piernas[0] || r[0], 'nordico', 'prevencion'); sumar(piernas[1] || piernas[0] || r[0], 'copenhague', 'prevencion'); ['nordico', 'copenhague'].forEach(e => fijos.add(e)); }
  if (!hip || ['raqueta', 'combate', 'resistencia'].includes(pr.deporte)) sumar(torsos[torsos.length - 1] || r[r.length - 1], 'face_pull', 'prevencion');
  if (pr.deporte === 'resistencia') sumar(piernas[0] || r[0], 'gemelos', 'prevencion');
  if (pr.deporte === 'raqueta' || pr.deporte === 'combate') sumar(torsos[0] || r[0], 'pallof', 'prevencion');
  if (pr.molestias.includes('hombro')) { sumar(torsos[torsos.length - 1] || r[r.length - 1], 'face_pull', 'prevencion'); fijos.add('face_pull'); }
  if (hip) { torsos.forEach((s, i) => sumar(s, ['laterales', 'triceps', 'biceps', 'aperturas'][i % 4], 'hipertrofia')); piernas.forEach(s => sumar(s, 'ext_cuadriceps', 'hipertrofia')); }
  // 4. Lo que te gusta hacer
  if (gusta('funcional')) { sumar(piernas[0] || r[0], 'kb_swing', 'gusto'); sumar(torsos[0] || r[0], 'landmine_press', 'gusto'); }
  if (gusta('mancuernas')) sumar(piernas[piernas.length - 1] || r[0], 'bulgara', 'gusto');
  if (gusta('maquinas')) sumar(piernas[0] || r[0], 'prensa', 'gusto');
  // 5. Lo que querés mejorar
  const menosCargada = () => [...r].sort((a, b) => a.items.length - b.items.length)[0];
  objetivos.filter(o => o.tipo === 'grupo').forEach(o => {
    const e = EXTRA_GRUPO[o.grupo]; if (!e || r.some(s => s.items.some(i => i.e === e))) return;
    (r.find(s => s.items.some(i => ejDe(i.e).g === o.grupo)) || menosCargada()).items.push(item(e));
    metas.add(e); razones.push(`Querés mejorar ${(GRUPOS[o.grupo] || o.grupo).toLowerCase()}: sumé ${corto(e).toLowerCase()}.`);
  });
  objetivos.filter(o => o.tipo === 'ej').forEach(o => { if (!r.some(s => s.items.some(i => i.e === o.clave))) menosCargada().items.push(item(o.clave)); });
  // 6. Equipo y molestias: lo que no podés hacer se cambia por algo del mismo estilo (preferí lo que te gusta)
  const evitar = new Set(pr.molestias.flatMap(m => EVITAR[m] || []));
  const apto = e => disponible(ejDe(e), pr.equipo) && !evitar.has(e);
  const gustoDe = d => (gusta('barra') && d.eq.includes('barra') ? 1 : 0) + (gusta('mancuernas') && (d.eq.includes('mancuernas') || /unilateral/.test(d.p || '')) ? 1 : 0)
    + (gusta('maquinas') && (d.eq.includes('maquina') || d.eq.includes('polea')) ? 1 : 0) + (gusta('funcional') && d.g === 'funcional' ? 1 : 0) + (gusta('olimpicos') && d.g === 'olimpicos' ? 1 : 0);
  const cambios = [];
  r.forEach(s => {
    // Lo que ya quedó en la sesión (aptos y reemplazos ya elegidos), para no repetir un ejercicio en el mismo día
    const usados = new Set(s.items.filter(it => apto(it.e)).map(it => it.e));
    s.items = s.items.map(it => {
      if (apto(it.e)) return it;
      // Primero algo del mismo estilo (otro press para un press) y recién después del mismo grupo; dentro de cada uno, lo que te gusta
      const alt = alternativas(it.e), porGusto = l => l.filter(x => apto(x.id) && !usados.has(x.id)).sort((a, b) => gustoDe(b) - gustoDe(a));
      // Lo sumado por gusto solo se reemplaza por algo del mismo estilo; si no hay, se saca
      const cand = [...porGusto(alt.estilo), ...(it.por === 'gusto' ? [] : porGusto(alt.grupo))][0];
      const motivo = evitar.has(it.e) ? 'molestia' : 'equipo';
      if (cand) { usados.add(cand.id); cambios.push(`${corto(it.e)} → ${corto(cand.id)} (${motivo})`); }
      else cambios.push(`${corto(it.e)}: sin reemplazo posible, lo saqué (${motivo})`);
      return cand ? { ...it, e: cand.id } : null;
    }).filter(Boolean);
  });
  if (cambios.length) razones.push(`Cambios por equipo o molestias: ${cambios.join('; ')}.`);
  if (pr.molestias.length) razones.push('Si algo duele al entrenar, frená y consultá: Marea no reemplaza a un profesional.');
  // 7. Cuántos ejercicios entran: duración, descanso y cómo la querés encarar
  const seriesQueEntran = Math.floor(pr.duracion * 60 / (40 + DESCANSOS[pr.descanso][1]));
  let tope = Math.max(4, Math.min(8, Math.round(seriesQueEntran / 3.2)));
  if (pr.encare === 'basicos') tope = Math.min(tope, 5); else if (pr.encare === 'variado') tope = Math.min(8, tope + 1);
  razones.push(`Sesiones de ${pr.duracion} min descansando ${DESCANSOS[pr.descanso][0].toLowerCase()}: entran unas ${seriesQueEntran} series, así que hasta ${tope} ejercicios por día (${ENCARES[pr.encare][0].toLowerCase()}).`);
  if (pr.deporteDias >= 3) razones.push(`Con ${pr.deporteDias} días de deporte, los bloques de carga son una semana más cortos para que descanses.`);
  // 8. Orden por función y recorte: salen primero accesorios y core que no sean objetivo ni prevención; después secundarios
  const afuera = [];
  r.forEach(s => {
    s.items.sort((a, b) => ORDEN_ROL[rol(ejDe(a.e))] - ORDEN_ROL[rol(ejDe(b.e))]);
    [['accesorio', 'core'], ['secundario']].forEach(roles => {
      for (let i = s.items.length - 1; s.items.length > tope && i >= 0; i--) {
        const e = s.items[i].e; if (roles.includes(rol(ejDe(e))) && !metas.has(e) && !fijos.has(e)) afuera.push(...s.items.splice(i, 1));
      }
    });
    delete s.pierna;
  });
  // El porqué de lo sumado, con lo que quedó en la rutina final
  const quedaron = por => [...new Set(r.flatMap(s => s.items.filter(it => it.por === por).map(it => corto(it.e).toLowerCase())))];
  if (quedaron('prevencion').length) razones.push(`Prevención de lesiones: ${quedaron('prevencion').join(', ')}${pot || pr.deporte !== 'ninguno' ? ' (isquios y aductores son los más castigados al saltar y esprintar)' : ''}.`);
  if (quedaron('gusto').length) razones.push(`Por lo que te gusta hacer: ${quedaron('gusto').join(', ')}.`);
  if (quedaron('hipertrofia').length) razones.push(`Hipertrofia: accesorios para sumar volumen a cada músculo (${quedaron('hipertrofia').join(', ')}).`);
  if (afuera.length) razones.push(`Por tiempo quedaron afuera: ${[...new Set(afuera.map(it => corto(it.e).toLowerCase()))].join(', ')}. Si un día te sobra, sumalos.`);
  r.forEach(s => s.items.forEach(it => delete it.por));
  return { rutina: r, razones };
}
const rutinaBase = (p, objetivos = []) => armarRutina(p, objetivos).rutina;

/* ================= ESTADO Y GUARDADO ================= */
let state = null, saludado = false;
const ui = { view: 'onb', tab: 'semana', wk: null, planSel: null, open: null, paso: 0, draft: null, descartados: new Set(), swaps: {}, celebrar: null, justCreated: false };

const nuevoCiclo = (p, objetivos, inicio) => ({ id: nid('c'), inicio: iso(inicio), comp: elegirComp(p, inicio), snap: clone({ perfil: p, objetivos }), overrides: {}, logs: {}, saltos: [], inicioRM: { ...p.rm, ...p.salto }, cierre: null });
const inicioDe = cuando => { const b = lunes(new Date()); return cuando === 'este' ? b : addD(b, 7); };
function crearPlan(p, objetivos, cuando) {
  state = { v: 3, ejemplo: false, perfil: p, objetivos, rutina: rutinaBase(p, objetivos), rutinaModo: 'auto', propios: [], recordatorio: { dias: [], hora: '18:00' }, rutinas: [], notas: [], ciclos: [nuevoCiclo(p, objetivos, inicioDe(cuando))] };
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
  return { v: 3, ejemplo: true, perfil, objetivos, rutina, rutinaModo: 'auto', propios: [], recordatorio: { dias: [], hora: '18:00' }, rutinas: [], notas: [], ciclos: [cy] };
}
function migrar(s) {
  s.perfil.nose = s.perfil.nose || {}; s.propios = s.propios || []; s.rutinaModo = s.rutinaModo || 'auto';
  s.recordatorio = s.recordatorio || { dias: [], hora: '18:00' }; s.rutinas = s.rutinas || []; s.notas = s.notas || [];
  s.objetivos = (s.objetivos || []).map(o => o.tipo ? o : { tipo: 'ej', clave: o.clave, objetivo: o.objetivo });
  if (!s.rutina) s.rutina = rutinaBase(s.perfil, s.objetivos);
  s.ciclos.forEach(cy => { cy.logs = cy.logs || {}; cy.saltos = cy.saltos || []; cy.inicioRM = cy.inicioRM || { ...cy.snap.perfil.rm, ...cy.snap.perfil.salto }; });
  return s;
}
function setSave(msg) { $('#saveState').textContent = msg || (state.ejemplo ? (ui.view === 'onb' ? 'Todavía no guardaste nada' : 'Ejemplo: no se guarda nada') : 'Guardado en este dispositivo'); }
function persist() {
  if (state.ejemplo) return;
  if (!lsSet(claveDe(perfilId), JSON.stringify(state))) return setSave('No se pudo guardar: el dispositivo no tiene lugar');
  setSave();
  // El nombre del perfil sigue al nombre que cargaste en tus datos
  const idx = indicePerfiles(), yo = idx.find(x => x.id === perfilId);
  if (yo && state.perfil.nombre && yo.nombre !== state.perfil.nombre && perfilId !== 'principal') { yo.nombre = state.perfil.nombre; guardarIndice(idx); }
}
// Cambia de perfil: guarda el actual y carga el otro (o arranca los primeros pasos si está vacío)
function usarPerfil(id) { persist(); cargarPerfil(id); }
const activo = () => state.ciclos[state.ciclos.length - 1];
const planDe = cy => generar(cy, state.ciclos);
function semanaActual(cy, plan) {
  const d = Math.floor((lunes(new Date()) - parse(cy.inicio)) / (7 * 864e5));
  return { raw: d, c: Math.max(0, Math.min(plan.weeks.length - 1, d)) };
}

/* ================= RENDER ================= */
function renderTabs() {
  const t = $('#tabs'); t.hidden = ui.view === 'onb';
  if (!dev && ui.tab === 'dev') ui.tab = 'plan';
  t.innerHTML = [['semana', 'Semana'], ['progreso', 'Progreso'], ['plan', 'Plan'], ['rutina', 'Rutina'], ...(dev ? [['dev', 'Dev']] : [])].map(([k, n]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${n}</button>`).join('');
}
function render() {
  registrarPropios(state.propios);
  renderTabs();
  $('#foot').hidden = state.ejemplo || ui.view === 'onb';
  if (ui.view === 'onb') return renderOnb();
  const cy = activo(), plan = planDe(cy), { raw, c } = semanaActual(cy, plan);
  if (ui.wk == null || ui.wk >= plan.weeks.length) ui.wk = c;
  const html = { semana: renderSemana, progreso: renderProgreso, plan: renderPlan, rutina: renderRutina, dev: renderDev }[ui.tab](plan, cy, raw, c);
  $('#main').innerHTML = (ui.versionNueva ? `<div class="banner rec"><span><b>Hay una versión nueva de Marea.</b> Actualizá cuando termines lo que estás cargando.</span><button class="btn small primary" data-act="actualizarApp">Actualizar</button></div>` : '')
    + (state.ejemplo ? `<div class="banner"><span><b>Estás viendo un ejemplo</b> con entrenamientos ya cargados.</span><button class="btn small primary" data-act="onb">Crear mi plan</button></div>` : '') + html;
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
  const bajas = state.ejemplo ? [] : ajustesBaja(plan, cy, c).filter(r => !ui.descartados.has('b' + r.k + r.v));
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
  ${bajas.length ? `<div class="banner warn"><span>En tus últimas semanas de carga quedaste por debajo de lo planeado en ${bajas.map(r => `<b>${esc(corto(r.k))}</b> <span class="num">${fmt(plan.p.rm[r.k], 'kg')} → ${fmt(r.v, 'kg')}</span>`).join(' · ')}. ¿Ajusto tu 1RM? Las cargas quedan alcanzables y la proyección se recalcula.</span><span class="row"><button class="btn small ghost" data-act="descartar" data-id="${bajas.map(r => 'b' + r.k + r.v).join(',')}">Ahora no</button><button class="btn small primary" data-act="usarRM" data-rs="${bajas.map(r => r.k + ':' + r.v).join(',')}">Ajustar</button></span></div>` : ''}
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
  <div class="stack" style="gap:10px">${state.rutina.length ? state.rutina.map((s, i) => sesion(plan, cy, wi, s, i)).join('') : '<p class="note">No tenés entrenamientos en tu rutina. Agregalos en la pestaña Rutina.</p>'}${deOtraRutina(plan, cy, wi)}</div>`;
}
// Hacia dónde vamos: proyección al cierre de lo que más importa, siempre a la vista
function haciaDonde(plan, cy) {
  const obj = plan.objetivos || [], ejObj = obj.filter(o => o.tipo === 'ej'), grupos = obj.filter(o => o.tipo === 'grupo');
  // Primero lo que elegiste mejorar; después todo lo que cargaste con marca inicial (o con «No sé»)
  const metas = ejObj.map(o => o.clave).filter(k => MARCAS.includes(k) || SALTOS.includes(k));
  const keys = [...new Set([...metas, ...MARCAS.filter(k => plan.p.rm[k] > 0 || plan.p.nose[k]), ...SALTOS.filter(k => plan.p.salto[k] > 0 || plan.p.nose[k])])];
  const fin = addD(parse(cy.inicio), plan.weeks.length * 7 - 1);
  const items = keys.map(k => {
    const isJ = SALTOS.includes(k), unit = isJ ? 'cm' : 'kg', pr = proyeccionAjustada(plan, cy, k), goal = (ejObj.find(o => o.clave === k) || {}).objetivo || 0;
    const start = (cy.inicioRM || {})[k] || 0, pts = isJ ? puntosSalto(cy, k) : puntosLift(plan, cy, k), now = pts.length ? Math.max(...pts.map(p => p.v)) : start;
    if (!pr && !pts.length) return `<div class="dest"><b>${esc(corto(k))}</b><span class="note">Lo calculo con tus primeros entrenamientos</span></div>`;
    const proj = pr ? pr.proj : now, meta = Math.max(goal, proj), fill = meta > start && start > 0 ? Math.max(0, Math.min(1, (now - start) / (meta - start))) : 0;
    const red = v => unit === 'kg' ? r25(v) : Math.round(v);
    return `<div class="dest"><div class="dest-top"><b>${esc(corto(k))}</b><span class="num">${fmt(red(now), '')} → <b>${fmt(red(goal || proj), unit)}</b></span></div>
      <div class="track"><div class="fill" style="width:${fill * 100}%"></div></div>
      <span class="note">${goal ? `Objetivo · proyección ${fmt(red(proj), unit)}` : 'Proyección al cierre'}${pr && pr.ajustada ? ' · con lo que llevás' : ''}</span></div>`;
  }).join('');
  const chips = grupos.map(o => { const pm = promedioGrupo(plan, cy, o.grupo); return `<span class="chip">${esc(GRUPOS[o.grupo])} · <b>${pm == null ? 'sin datos aún' : (pm >= 0 ? '+' : '') + pm.toFixed(1) + '%'}</b></span>`; }).join('');
  if (!items && !chips) return '';
  return `<section class="card" aria-label="Hacia dónde vamos"><div class="eyebrow">Hacia dónde vamos ${ay('proyeccion')}</div>
    <h2 style="margin:4px 0 12px">Al cierre del ciclo · ${fd(fin)}</h2><div class="dests">${items}</div>
    ${chips ? `<div class="chips" style="margin-top:12px"><span class="note">Grupos que querés mejorar:</span>${chips}</div>` : ''}</section>`;
}
const serieTxt = (d, x) => d.t === 'salto' || d.t === 'lanzamiento' ? `${x.reps}${x.kg ? ' con ' + x.kg.toLocaleString('es') + ' kg' : ''}${x.marca ? ' · ' + x.marca.toLocaleString('es') + ' ' + d.marca : ''}` : d.t === 'tiempo' ? `${x.seg} s` : d.t === 'lastre' ? `${x.kg ? '+' + x.kg.toLocaleString('es') : 'PC'}×${x.reps}` : `${(x.kg || 0).toLocaleString('es')}×${x.reps}`;
function mejorTxt(en, peso) {
  const d = ejDe(en.e);
  if (d.t === 'salto' || d.t === 'lanzamiento') { const m = Math.max(0, ...en.s.map(x => x.marca || 0)); return m ? `${m.toLocaleString('es')} ${d.marca}` : `${en.s.length} series`; }
  if (d.t === 'tiempo') return `${Math.max(...en.s.map(x => x.seg))} s`;
  const t = mejorSerie(en, peso); return t ? serieTxt(d, t) : '';
}
const ESF = { suave: 'Suave', fuerte: 'Fuerte', maximo: 'Máximo' };
function setRow(d, sid, iid, i, x, o, prevKg) {
  const id = `${sid}-${iid}-${i}`;
  const inp = (f, val, ph, lbl, step, mode) => `<input class="in" id="${f}-${id}" type="number" inputmode="${mode}" step="${step}" min="0" data-f="${f}" value="${val ?? ''}" placeholder="${ph ?? ''}" aria-label="${lbl}, serie ${i + 1}">`;
  const del = `<button type="button" class="del-set" data-act="delSet" aria-label="Borrar serie ${i + 1}">×</button>`;
  // Lanzamientos: además de reps y marca, el peso del balón (opcional)
  const balon = d.t === 'lanzamiento' ? inp('kg', x && x.kg ? x.kg : '', prevKg != null ? prevKg : '', 'Kilos del balón (opcional)', .5, 'decimal') + '<span>kg</span>' : '';
  if (d.t === 'salto' || d.t === 'lanzamiento') return `<div class="set ${balon ? 'set-lanz' : ''}"><span class="set-i">${i + 1}</span>${inp('reps', x ? x.reps : '', o.reps, 'Repeticiones', 1, 'numeric')}<span>reps</span>${balon}${d.marca ? inp('marca', x && x.marca ? x.marca : '', '', `Marca en ${d.marca} (opcional)`, .5, 'decimal') + `<span>${d.marca}</span>` : ''}${del}</div>`;
  if (d.t === 'tiempo') return `<div class="set"><span class="set-i">${i + 1}</span>${inp('seg', x ? x.seg : '', o.seg || 30, 'Segundos', 5, 'numeric')}<span>seg</span>${del}</div>`;
  const ph = o.conRM ? o.kg : prevKg != null ? prevKg : d.t === 'lastre' ? 0 : 'kg';
  return `<div class="set"><span class="set-i">${i + 1}</span>${inp('kg', x && x.kg != null ? x.kg : '', ph, d.t === 'lastre' ? 'Kilos de lastre' : 'Kilos', .5, 'decimal')}<span>${d.t === 'lastre' ? 'kg lastre ×' : 'kg ×'}</span>${inp('reps', x && x.reps ? x.reps : '', o.reps, 'Repeticiones', 1, 'numeric')}<span>reps</span>${del}</div>`;
}
// Un ejercicio dentro del entrenamiento. Se puede cambiar solo por hoy (sin tocar la rutina) o marcar como no hecho.
const claveSwap = (wi, sid, iid) => `${wi}:${sid}:${iid}`;
function exBlock(plan, cy, wi, s, it, lg, nP) {
  const w = plan.weeks[wi], P = plan.p.peso || 0, guardado = lg && lg.ej[it.id];
  const e = ui.swaps[claveSwap(wi, s.id, it.id)] || (guardado ? guardado.e : it.e), d = ejDe(e), mismo = guardado && guardado.e === e;
  const o = objetivoEj(plan, w, e, nP, e === it.e ? it.esq : null), prev = ultimaEntrada(cy, e, wi), cur = mismo ? guardado.s : [];
  const prevKg = prev && (d.t === 'carga' || d.t === 'lastre') ? (mejorSerie(prev, P) || {}).kg : prev && d.t === 'lanzamiento' ? (prev.s.find(x => x.kg) || {}).kg ?? null : null, n = Math.max(cur.length, o.sets || 3);
  const skip = !!(guardado && guardado.skip), alt = alternativas(it.e), plio = d.t === 'salto' || d.t === 'lanzamiento';
  const opt = x => `<option value="${x.id}" ${x.id === e ? 'selected' : ''}>${esc(x.n)}</option>`;
  return `<div class="ex ${skip ? 'skip' : ''}" data-i="${it.id}" data-e="${e}">
    <div class="ex-head"><b>${esc(d.n)}${e !== it.e ? ` <span class="tag t-mid">en lugar de ${esc(corto(it.e))}</span>` : ''}</b><span class="note">${o.texto}</span></div>
    ${prev ? `<span class="note">La última vez: ${mejorTxt(prev, P)}</span>` : ''}
    <div class="ex-tools">
      <label class="chk"><input type="checkbox" data-skip ${skip ? 'checked' : ''}>No lo hice hoy</label>
      ${alt.estilo.length || alt.grupo.length ? `<label class="mini-f">Cambiar solo por hoy
        <select class="in in-sm" data-swap aria-label="Cambiar ${esc(d.n)} solo por hoy">
          <option value="${it.e}" ${e === it.e ? 'selected' : ''}>${esc(ejDe(it.e).n)} (tu rutina)</option>
          ${alt.estilo.length ? `<optgroup label="Del mismo estilo">${alt.estilo.map(opt).join('')}</optgroup>` : ''}
          ${alt.grupo.length ? `<optgroup label="Del mismo grupo">${alt.grupo.map(opt).join('')}</optgroup>` : ''}
        </select></label>` : ''}
    </div>
    <div class="sets">${Array.from({ length: n }, (_, k) => setRow(d, s.id, it.id, k, cur[k], o, prevKg)).join('')}</div>
    <div class="row ex-foot"><button type="button" class="btn small ghost" data-act="addSet">+ Serie</button>
      ${d.t === 'carga' || d.t === 'lastre' ? `<label class="mini-f">RPE promedio ${ay('rpe')}<select class="in in-sm" data-rpe aria-label="RPE promedio de ${esc(d.n)} (opcional)"><option value="">—</option>${[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(v => `<option value="${v}" ${mismo && +guardado.rpe === v ? 'selected' : ''}>${v.toLocaleString('es')}</option>`).join('')}</select></label>` : ''}
      ${plio ? `<label class="mini-f">Esfuerzo ${ay('esfuerzo')}<select class="in in-sm" data-esf aria-label="Esfuerzo en ${esc(d.n)} (opcional)"><option value="">—</option>${Object.entries(ESF).map(([k, t]) => `<option value="${k}" ${mismo && guardado.esf === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
      ${d.t === 'salto' && d.marca ? `<span class="mini-f">¿Sin cinta para medir? ${ay('medir')}</span>` : ''}
    </div></div>`;
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
      const en = lg.ej[id], d = ejDe(en.e), r = rend.find(x => x.id === id), it = s.items.find(x => x.id === id);
      const cambio = it && it.e !== en.e ? ` <span class="note">(en lugar de ${esc(corto(it.e))})</span>` : '';
      if (en.skip) return `<div class="sum-row"><span>${esc(corto(en.e))}${cambio}</span><span class="note">No lo hiciste</span></div>`;
      const tag = r && r.ratio != null ? (r.ratio >= 1.005 ? `<span class="tag t-up">+${Math.round((r.ratio - 1) * 100) || 1}% vs plan</span>` : r.ratio >= .95 ? '<span class="tag t-mid">en el plan</span>' : `<span class="tag t-down">−${Math.round((1 - r.ratio) * 100)}% vs plan</span>`) : '';
      const extra = en.rpe ? ` · RPE ${(+en.rpe).toLocaleString('es')}` : en.esf ? ` · ${ESF[en.esf].toLowerCase()}` : '';
      return `<div class="sum-row"><span>${esc(corto(en.e))}${cambio} ${tag}</span><span class="num">${en.s.map(x => serieTxt(d, x)).join('  ')}${extra}</span></div>`;
    }).join('')}</div></article>`;
  }
  return `<article class="ses ${done ? 'done' : ''}">${head}
    <form class="ses-body ses-form" data-s="${s.id}" data-w="${wi}" novalidate>
      ${w.plyo && nP ? `<p class="note" style="padding-top:12px">Saltos y lanzamientos primero, frescos: <b style="color:var(--ink)">${w.plyo.c} contactos</b> en total ${ay('contactos')}</p>` : ''}
      ${s.items.map(it => exBlock(plan, cy, wi, s, it, lg, nP)).join('')}
      <p class="err" hidden></p>
      <div class="row"><button class="btn primary" type="submit">Guardar entrenamiento</button><button type="button" class="btn" data-act="rellenar">Completar con lo sugerido</button><button type="button" class="btn ghost" data-act="abrir" data-s="${s.id}">Cancelar</button></div>
    </form></article>`;
}
function leerSets(div, d) {
  const rows = [...div.querySelectorAll('.set')], v = (r, f) => { const el = r.querySelector(`[data-f="${f}"]`); return el ? el.value.trim() : ''; };
  if (d.t === 'salto' || d.t === 'lanzamiento') return rows.map(r => { const x = { reps: parseInt(v(r, 'reps')) || 0, marca: parseFloat(v(r, 'marca')) || null }; const kg = parseFloat(v(r, 'kg')); if (kg > 0) x.kg = kg; return x; }).filter(x => x.reps > 0);
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
    o.pts.forEach(p => { s += `<circle class="${p.eq ? 'eq-d' : 'real-d'}" cx="${X(p.x)}" cy="${Y(p.v)}" r="3.5"><title>${fmt(Math.round(p.v * 2) / 2, o.unit)}${p.eq ? ' (equivalente de una variante)' : ''}</title></circle>`; });
    const last = o.pts[o.pts.length - 1]; s += `<text class="last-t" x="${X(last.x)}" y="${Y(last.v) - 10}" text-anchor="middle">${Math.round(last.v * 2) / 2}</text>`;
  }
  return s + '</svg>';
}
function renderProgreso(plan, cy) {
  const N = plan.weeks.length, deloads = plan.weeks.map((w, i) => w.tipo !== 'carga' ? i : -1).filter(i => i >= 0);
  const obj = plan.objetivos || [], goals = Object.fromEntries(obj.filter(o => o.tipo === 'ej').map(o => [o.clave, o.objetivo || 0]));
  const enLogs = new Set(); for (const wi in cy.logs) for (const sid in cy.logs[wi]) for (const id in cy.logs[wi][sid].ej) enLogs.add(cy.logs[wi][sid].ej[id].e);
  const tarjeta = (k, unit, pts, start, extra = '') => {
    const pr = proyeccionAjustada(plan, cy, k), best = pts.length ? Math.max(...pts.map(p => p.v)) : 0, goal = goals[k] || 0;
    const projEnd = pr ? (pr.ajustada || k === 'dominadas' || !start ? pr.proj : start * (1 + pr.rate)) : 0, cambio = start > 0 && best > 0 ? (best / start - 1) * 100 : null;
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
    <div class="chart-legend" style="margin-top:10px"><span><b style="border-color:var(--load)"></b>Lo que levantaste</span><span><i class="leyenda-eq"></i>Con una variante (equivalente)</span><span><b style="border-color:var(--muted);border-top-style:dashed"></b>Proyección</span><span><b style="border-color:var(--accent);border-top-style:dotted"></b>Objetivo</span><span><b style="border-color:color-mix(in srgb,var(--deload) 40%,transparent);border-top-width:8px"></b>Descarga</span></div></section>
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
    <section class="card"><div class="eyebrow" style="margin-bottom:6px">Proyección al cierre ${ay('proyeccion')}</div>${objetivosHTML(plan, cy)}</section>
    <section class="card"><div class="eyebrow" style="margin-bottom:10px">Por qué este plan</div>${porque(plan)}</section>
  </div>
  ${state.ciclos.length > 1 ? `<section class="card"><div class="eyebrow" style="margin-bottom:10px">Ciclos anteriores</div>${historial()}</section>` : ''}
  ${state.ejemplo ? '' : `<section class="card"><div class="eyebrow">Tus datos</div><p class="note" style="margin:6px 0 12px">Todo se guarda en este dispositivo. Descargá un respaldo de vez en cuando, y siempre antes de cambiar de teléfono.</p>
    <div class="row"><button class="btn" data-act="exportar">Descargar respaldo</button><label class="btn" for="importar">Restaurar un respaldo</label><input type="file" id="importar" accept="application/json,.json" hidden></div>
    <div class="row" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)"><span class="note" style="flex:1;min-width:200px">Modo desarrollador: varios perfiles, rutinas para comparar, notas y los números internos del algoritmo.</span><button class="btn small" data-act="devToggle">${dev ? 'Desactivar' : 'Activar'}</button></div></section>
  <section class="card" aria-labelledby="rec-t"><div class="eyebrow">Recordatorios</div>
    <h2 id="rec-t" style="margin:4px 0 6px">Que el teléfono te avise los días que entrenás</h2>
    <p class="note" style="margin-bottom:12px">Elegí los días y la hora. Se agregan al calendario de tu teléfono hasta el final del ciclo, con aviso a esa hora.</p>
    <div class="chips" role="group" aria-label="Días de entrenamiento">${DIAS.map(([k, n]) => `<label class="chip-sel"><input type="checkbox" name="diaRec" value="${k}" ${(state.recordatorio.dias || []).includes(k) ? 'checked' : ''}>${n}</label>`).join('')}</div>
    <div class="row" style="margin-top:12px;align-items:end"><label class="f" style="width:130px">Hora<input type="time" id="recHora" value="${esc(state.recordatorio.hora || '18:00')}"></label><button class="btn primary" data-act="recordatorios">Agregar al calendario</button></div>
    <p class="err" id="recErr" hidden></p>
    <p class="note" style="margin-top:10px">Si después cambiás los días, borrá del calendario los eventos «Marea» y volvé a agregarlos.</p></section>`}`;
}
const DIAS = [['MO', 'Lun'], ['TU', 'Mar'], ['WE', 'Mié'], ['TH', 'Jue'], ['FR', 'Vie'], ['SA', 'Sáb'], ['SU', 'Dom']];
// Recordatorios: un evento semanal en el calendario del teléfono (archivo .ics), los días elegidos y hasta el final del ciclo
function recordatorios() {
  const dias = $$('input[name="diaRec"]:checked').map(c => c.value), hora = $('#recHora').value || '18:00', err = $('#recErr');
  if (!dias.length) { err.textContent = 'Elegí al menos un día.'; err.hidden = false; return; }
  err.hidden = true; state.recordatorio = { dias, hora }; persist();
  const cy = activo(), plan = planDe(cy), ini = parse(cy.inicio), fin = addD(ini, plan.weeks.length * 7 - 1);
  const num = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }, pad = x => String(x).padStart(2, '0'), [h, m] = hora.split(':').map(Number);
  let d0 = new Date(Math.max(lunes(new Date()), ini)); while (!dias.some(x => num[x] === d0.getDay())) d0 = addD(d0, 1);
  const fecha = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`, ahora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Marea//Recordatorios//ES', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:marea-${cy.id}-${Date.now()}@marea`, `DTSTAMP:${ahora}`, `DTSTART:${fecha(d0)}T${pad(h)}${pad(m)}00`, 'DURATION:PT1H',
    `RRULE:FREQ=WEEKLY;BYDAY=${dias.join(',')};UNTIL=${fecha(fin)}T235959`,
    'SUMMARY:Marea: hoy toca entrenar', `DESCRIPTION:Abrí Marea para ver qué toca y cargar tus series.`, `URL:${location.origin}/app/`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hoy toca entrenar', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  // En iPhone, abrir el archivo directo muestra «Agregar al calendario»; en el resto se descarga
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) { location.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); a.download = 'marea-recordatorios.ics';
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  decir('Listo. Abrí el archivo para agregarlo a tu calendario.');
}
function objetivosHTML(plan, cy) {
  const ejObj = (plan.objetivos || []).filter(o => o.tipo === 'ej' && (MARCAS.includes(o.clave) || SALTOS.includes(o.clave)));
  const list = [...ejObj, ...[...MARCAS.filter(k => plan.p.rm[k] > 0), ...SALTOS.filter(k => plan.p.salto[k] > 0)].filter(k => !ejObj.some(o => o.clave === k)).map(k => ({ clave: k }))];
  if (!list.length) return '<p class="note">Cuando cargues entrenamientos, aparecen tus proyecciones.</p>';
  return list.map(o => {
    const pr = proyeccionAjustada(plan, cy, o.clave);
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
const esqTxt = esq => esq ? `${esq.sets}x${esq.reps}` : '';
const leerEsq = v => { const m = String(v || '').trim().match(/^(\d{1,2})\s*[x×*]\s*(\d{1,3})$/i); return m ? { sets: +m[1], reps: +m[2] } : null; };
const itemRow = it => `<div class="rut-row" data-i="${it.id}">${selEj('re-' + it.id, it.e)}
  <input class="in" id="rq-${it.id}" value="${esqTxt(it.esq)}" placeholder="auto" inputmode="text" aria-label="Esquema propio, por ejemplo 4x6 (vacío = automático)" title="Esquema propio: series x repeticiones (vacío = automático)">
  <button type="button" class="btn small ghost" data-act="quitarFila" data-sel=".rut-row">Quitar</button></div>`;
const sesBloque = s => `<div class="rut-s" data-s="${s.id}">
  <div class="row"><input class="in" id="rn-${s.id}" value="${esc(s.nombre)}" aria-label="Nombre del entrenamiento" style="flex:1;min-width:160px;font-weight:600">
    <button type="button" class="btn small ghost" data-act="quitarFila" data-sel=".rut-s">Quitar entrenamiento</button></div>
  <div class="rut-ex">${s.items.map(itemRow).join('')}</div>
  <div><button type="button" class="btn small" data-act="addEx">+ Ejercicio</button></div></div>`;
/* ---------- Dev ---------- */
const opciones = (obj, val) => Object.entries(obj).map(([v, t]) => `<option value="${v}" ${v === val ? 'selected' : ''}>${esc(t)}</option>`).join('');
function renderDev(plan, cy, raw, c) {
  const idx = indicePerfiles(), w = plan.weeks[c];
  const marcas = [...MARCAS.filter(k => plan.p.rm[k] > 0), ...SALTOS.filter(k => plan.p.salto[k] > 0)];
  const ultimas = plan.weeks.map((x, i) => i).filter(i => i <= c && plan.weeks[i].tipo === 'carga').slice(-3);
  const sugerencias = [...records(plan, cy).map(r => `subir ${corto(r.k)} a ${fmt(r.v, 'kg')}`), ...ajustesBaja(plan, cy, c).map(r => `bajar ${corto(r.k)} a ${fmt(r.v, 'kg')}`), sugerirDescarga(plan, cy, c) ? 'adelantar la descarga' : ''].filter(Boolean);
  return `<section class="card"><div class="kilo-edge">${kilo('', 'focus')}</div><div class="eyebrow">Modo desarrollador</div>
    <h2 style="font-size:20px;margin:4px 0 6px">Perfiles</h2>
    <p class="note">Cada perfil tiene su propio plan, rutina y registros. Sirven para probar cómo responde Marea a personas distintas.</p>
    <div class="dev-list">${idx.map(x => `<div class="dev-row"><span><b>${esc(x.nombre)}</b>${x.id === perfilId ? ' <span class="tag t-up">en uso</span>' : ''}</span>
      <span class="row">${x.id !== perfilId ? `<button class="btn small" data-act="perfilUsar" data-id="${x.id}">Usar</button>` : ''}${x.id !== 'principal' ? `<button class="btn small ghost" data-act="perfilBorrar" data-id="${x.id}">Borrar</button>` : ''}</span></div>`).join('')}</div>
    <div class="row" style="margin-top:12px"><button class="btn primary" data-act="perfilNuevo">+ Perfil nuevo</button><button class="btn ghost small" data-act="devToggle">Salir del modo desarrollador</button></div></section>

  <section class="card"><div class="eyebrow">Rutinas para comparar</div><h2 style="margin:4px 0 6px">Rutinas guardadas de este perfil</h2>
    <p class="note">Guardá la rutina actual o la sugerida y cambiá entre versiones. Los entrenamientos que ya cargaste no se borran: vuelven a verse si volvés a esa rutina.</p>
    <div class="row" style="margin-top:10px"><input class="in" id="rutNombre" placeholder="Nombre (por ejemplo: más saltos)" style="flex:1;min-width:180px"><button class="btn" data-act="rutGuardar">Guardar la actual</button><button class="btn" data-act="rutSugerida">Guardar la sugerida</button></div>
    <div class="dev-list">${(state.rutinas || []).map(r => `<div class="dev-row"><span><b>${esc(r.nombre)}</b> <span class="note">· ${r.rutina.length} entrenamientos · ${r.rutina.reduce((a, s) => a + s.items.length, 0)} ejercicios · ${fd(parse(r.fecha))}</span></span>
      <span class="row"><button class="btn small" data-act="rutUsar" data-id="${r.id}">Usar</button><button class="btn small ghost" data-act="rutBorrar" data-id="${r.id}">Borrar</button></span></div>`).join('') || '<p class="note">Todavía no guardaste ninguna.</p>'}</div></section>

  <section class="card"><div class="eyebrow">Notas</div><h2 style="margin:4px 0 10px">Lo que querés cambiar o probar</h2>
    <textarea class="in" id="notaTxt" rows="3" placeholder="Por ejemplo: en la semana 3 la sentadilla me quedó liviana" style="min-height:80px;font-family:inherit"></textarea>
    <div class="row" style="margin-top:8px"><button class="btn primary" data-act="notaAgregar">Agregar nota</button>${(state.notas || []).length ? '<button class="btn" data-act="notasCopiar">Copiar todas</button>' : ''}<span class="note" id="notasMsg"></span></div>
    <div class="dev-list">${(state.notas || []).slice().reverse().map(n => `<div class="dev-row"><span style="flex:1;min-width:200px"><span class="note">${fd(parse(n.fecha))} · semana ${n.semana}</span><br>${esc(n.texto)}</span><button class="btn small ghost" data-act="notaBorrar" data-id="${n.id}">Borrar</button></div>`).join('')}</div></section>

  <section class="card"><div class="eyebrow">Tus ejercicios</div><h2 style="margin:4px 0 10px">Ejercicios creados por vos</h2>
    ${state.propios.length ? state.propios.map(e => `<div class="dev-row propio" data-id="${e.id}"><input class="in" value="${esc(e.n)}" aria-label="Nombre del ejercicio"><select class="in" aria-label="Grupo">${opciones(GRUPOS, e.g)}</select><select class="in" aria-label="Cómo se registra">${opciones(TIPOS, e.t)}</select>
      <span class="row"><button class="btn small" data-act="propioGuardar" data-id="${e.id}">Guardar</button><button class="btn small ghost" data-act="propioBorrar" data-id="${e.id}">Borrar</button></span></div>`).join('') : '<p class="note">No creaste ninguno todavía.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn" data-act="nuevoEj">+ Crear ejercicio</button></div></section>

  <section class="card"><div class="eyebrow">Datos del motor</div><h2 style="margin:4px 0 10px">Lo que calcula Marea para este perfil</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Marca</th><th>Actual</th><th>Relativa</th><th>Nivel</th><th>Peso</th><th>Proyección</th><th>Con lo que llevás</th></tr></thead><tbody>
    ${marcas.map(k => { const por = plan.niv.por[k] || {}, pr = proyeccion(plan, k), pa = proyeccionAjustada(plan, cy, k), u = SALTOS.includes(k) ? 'cm' : 'kg';
      return `<tr><td>${esc(corto(k))}</td><td class="num">${fmt(SALTOS.includes(k) ? plan.p.salto[k] : plan.p.rm[k], u)}</td><td class="num">${por.s ? por.s.toFixed(2) : '—'}</td><td>${por.n != null ? NIVEL[por.n] : '—'}</td><td class="num">${por.w ?? '—'}</td><td class="num">${pr ? fmt(pr.proj, u) : '—'}</td><td class="num">${pa && pa.ajustada ? fmt(pa.proj, u) : 'igual'}</td></tr>`; }).join('')}
    </tbody></table></div>
    <dl class="meta-list" style="margin-top:14px">
      <div><dt>Nivel global</dt><dd>${NIVEL[plan.nivel]}</dd></div>
      <div><dt>Semanas de carga por bloque</dt><dd>${plan.L}</dd></div>
      <div><dt>Semana actual</dt><dd>${c + 1} · ${TIPO[w.tipo]} · ${Math.round(w.int)}% · ${w.sets}×${w.reps} · RPE ${rpeTxt(w)}${w.plyo ? ` · ${w.plyo.c} contactos` : ''}</dd></div>
      <div><dt>Últimas semanas de carga vs plan</dt><dd>${ultimas.map(i => { const v = veredictoSemana(plan, cy, i); return `S${i + 1}: ${v ? Math.round(v.avg * 100) + '%' : 'sin datos'}`; }).join(' · ') || '—'}</dd></div>
      <div><dt>Sugerencias activas</dt><dd>${sugerencias.join(' · ') || 'ninguna'}</dd></div>
    </dl></section>`;
}
// En los primeros pasos no hay pestañas: si existen otros perfiles con datos, se ofrece volver a ellos
function otrosPerfiles() {
  const version = ui.versionNueva ? `<div class="banner rec"><span><b>Hay una versión nueva de Marea.</b></span><button class="btn small primary" data-act="actualizarApp">Actualizar</button></div>` : '';
  const otros = indicePerfiles().filter(x => x.id !== perfilId && lsGet(claveDe(x.id)));
  if (!otros.length) return version;
  const nombre = x => { try { return JSON.parse(lsGet(claveDe(x.id))).perfil.nombre || x.nombre; } catch (e) { return x.nombre; } };
  return `<div class="banner"><span>Estás creando un perfil nuevo. Tus otros perfiles siguen guardados.</span>
    <span class="row">${otros.map(x => `<button class="btn small primary" data-act="perfilUsar" data-id="${x.id}">Volver a ${esc(nombre(x))}</button>`).join('')}</span></div>` + version;
}
// Carga un perfil sin guardar el actual (se usa al borrar el perfil en uso)
function cargarPerfil(id) {
  perfilId = id; lsSet(LS_ACT, id);
  const s = lsGet(claveDe(id));
  Object.assign(ui, { tab: dev ? 'dev' : 'semana', wk: null, open: null, planSel: null, swaps: {} }); saludado = false;
  if (s) { state = migrar(JSON.parse(s)); ui.view = 'dash'; }
  else { state = ejemplo(); ui.view = 'onb'; ui.paso = 1; ui.draft = nuevoDraft(); }
  render(); scrollTo(0, 0);
}
// Preguntas para armar la rutina (en los primeros pasos y en «Cambiar respuestas»)
const chipsSel = (name, obj, vals) => Object.entries(obj).map(([k, t]) => `<label class="chip-sel"><input type="checkbox" name="${name}" value="${k}" ${vals.includes(k) ? 'checked' : ''}>${esc(t)}</label>`).join('');
const prefsForm = pr => `
  <fieldset><legend>¿Cómo la querés encarar?</legend><div class="opts" role="radiogroup" aria-label="Cómo encarar la rutina">${Object.entries(ENCARES).map(([k, [t, s]]) => `<label class="opt"><input type="radio" name="prEnc" value="${k}" ${pr.encare === k ? 'checked' : ''}><b>${t}</b><span>${s}</span></label>`).join('')}</div></fieldset>
  <fieldset><legend>¿Qué te gusta hacer?</legend><div class="chips">${chipsSel('prGusto', GUSTOS, pr.gustos)}</div><p class="note">Lo que elijas lo sumo y lo prefiero cuando tengo que cambiar un ejercicio.</p></fieldset>
  <div class="fgrid">${sel('pr-dur', 'Duración de la sesión', [[45, '45 min'], [60, '1 hora'], [75, '1 h 15'], [90, '1 h 30 o más']], pr.duracion)}${sel('pr-desc', 'Descanso entre series', Object.entries(DESCANSOS).map(([k, [t]]) => [k, t]), pr.descanso)}</div>
  <div class="fgrid">${sel('pr-dep', '¿Hacés otro deporte?', Object.entries(DEPORTES), pr.deporte)}${sel('pr-depd', '¿Cuántos días por semana?', [0, 1, 2, 3, 4, 5, 6].map(x => [x, x ? x + (x === 1 ? ' día' : ' días') : '—']), pr.deporteDias)}</div>
  <fieldset><legend>¿Con qué contás?</legend><div class="chips">${chipsSel('prEq', EQUIPO, pr.equipo)}</div><p class="note">Destildá lo que no tenés: uso solo ejercicios que puedas hacer.</p></fieldset>
  <fieldset><legend>¿Alguna molestia?</legend><div class="chips">${chipsSel('prMol', MOLESTIAS, pr.molestias)}</div><p class="note">Evito y reemplazo los ejercicios que más cargan esa zona.</p></fieldset>`;
const leerPrefs = () => {
  const dep = $('#pr-dep').value;
  return {
    encare: (document.querySelector('input[name="prEnc"]:checked') || {}).value || 'equilibrado', gustos: $$('input[name="prGusto"]:checked').map(c => c.value),
    equipo: $$('input[name="prEq"]:checked').map(c => c.value), duracion: +$('#pr-dur').value, descanso: $('#pr-desc').value,
    deporte: dep, deporteDias: dep === 'ninguno' ? 0 : +$('#pr-depd').value, molestias: $$('input[name="prMol"]:checked').map(c => c.value)
  };
};
function porQueRutinaHTML() {
  const tiene = !!state.perfil.prefs, { razones } = armarRutina(state.perfil, state.objetivos);
  return `<section class="card" aria-labelledby="pq-t"><div class="eyebrow">Cómo armo tu rutina sugerida</div>
    <h2 id="pq-t" style="margin:4px 0 10px">${tiene ? 'Por qué queda así' : 'Contame cómo entrenás y la armo a tu medida'}</h2>
    ${tiene ? `${state.rutinaModo === 'propia' ? '<p class="note">Tu rutina actual la armaste vos. Esto es lo que haría la sugerida:</p>' : ''}<ul class="revision">${razones.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`
      : '<p class="note">Cuánto dura tu sesión, cuánto descansás, qué te gusta, con qué equipo contás, si hacés otro deporte y si tenés molestias cambian mucho la rutina.</p>'}
    <div class="row" style="margin-top:12px"><button class="btn ${tiene ? '' : 'primary'}" data-act="prefs">${tiene ? 'Cambiar respuestas' : 'Responder las preguntas'}</button></div></section>`;
}
function modalPrefs() {
  openModal(`<h2 style="font-size:20px">Armemos tu rutina</h2>
  <form id="fPrefs" style="display:grid;gap:18px" novalidate>${prefsForm(prefsDe(state.perfil))}
    <label class="chk" style="white-space:normal"><input type="checkbox" id="pr-aplicar" checked> Reemplazar mi rutina por la nueva sugerida${state.rutinaModo === 'propia' ? ' (la tuya queda guardada en las rutinas del modo desarrollador)' : ''}</label>
    <p class="note">El ritmo de carga y descarga se ajusta a tu deporte desde el próximo ciclo, para no desarmar el actual.</p>
    <div class="row" style="justify-content:flex-end"><button class="btn" type="button" data-act="cerrarModal">Cancelar</button><button class="btn primary" type="submit">Guardar</button></div>
  </form>`);
}
// Entrenamientos cargados con una rutina anterior: siguen contando y se ven en su semana
function deOtraRutina(plan, cy, wi) {
  const W = (cy.logs || {})[wi] || {}, ids = Object.keys(W).filter(sid => !state.rutina.some(s => s.id === sid));
  if (!ids.length) return '';
  return `<div class="eyebrow" style="margin-top:6px">Cargados con otra rutina</div>` + ids.map(sid => {
    const lg = W[sid], ens = Object.values(lg.ej);
    return `<article class="ses done"><div class="ses-head" style="cursor:default"><span class="ses-n"><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9.5l3.2 3L14 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span style="min-width:0"><b>Entrenamiento de otra rutina</b><span class="note">${ens.map(en => esc(corto(en.e))).join(' · ')}</span></span><span class="ses-st">Cargado · ${fd(parse(lg.fecha))}</span></div>
      <div class="ses-body">${ens.map(en => `<div class="sum-row"><span>${esc(corto(en.e))}</span>${en.skip ? '<span class="note">No lo hiciste</span>' : `<span class="num">${en.s.map(x => serieTxt(ejDe(en.e), x)).join('  ')}</span>`}</div>`).join('')}</div></article>`;
  }).join('');
}
function revisionHTML(plan) {
  const rv = revisarRutina(plan, state.rutina, state.objetivos);
  const chips = Object.entries(rv.series).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([g, v]) => `<span class="chip">${esc(GRUPOS[g] || g)} · <b>${v}</b></span>`).join('');
  return `<section class="card" aria-labelledby="rev-t"><div class="eyebrow">Revisión de tu rutina</div>
    <h2 id="rev-t" style="margin:4px 0 10px">Series por semana en una semana de carga</h2>
    <div class="chips">${chips}${rv.contactos ? `<span class="chip">Saltos y lanzamientos · <b>${rv.contactos}</b> ${ay('contactos')}</span>` : ''}</div>
    ${rv.msgs.length ? `<ul class="revision">${rv.msgs.map(m => `<li class="${m.cls}">${esc(m.t)}</li>`).join('')}</ul>` : '<p class="note" style="margin-top:10px">Está equilibrada: no encuentro nada para ajustar.</p>'}
  </section>`;
}
function renderRutina(plan) {
  const auto = state.rutinaModo === 'auto';
  return `${porQueRutinaHTML()}${revisionHTML(plan)}<section class="card"><div class="kilo-edge">${kilo()}</div><div class="eyebrow">Tu rutina</div>
    <h2 style="font-size:20px;margin:4px 0 12px">Tus entrenamientos de cada semana</h2>
    <div class="seg" role="group" aria-label="Quién arma la rutina"><button class="${auto ? 'on' : ''}" data-act="rutModo" data-v="auto">Sugerida</button><button class="${auto ? '' : 'on'}" data-act="rutModo" data-v="propia">Armada por mí</button></div>
    <p class="note" id="rutNota" style="margin-top:10px">${auto ? 'La armé según tus días, tu enfoque y lo que querés mejorar. Si cambiás algo, pasa a ser tuya.' : 'Elegí los ejercicios de la lista. Los cambios se guardan solos.'}
      Los básicos y sus variantes calculan los kilos con tu 1RM; el resto lo comparo con tu última vez.
      En la casilla «auto» podés fijar tu propio esquema (por ejemplo <b>4x6</b>); vacía, sigue la fase del ciclo.</p>
    <form id="rutForm" style="margin-top:8px" novalidate><div id="rutList">${state.rutina.map(sesBloque).join('')}</div></form>
    <div class="row" style="margin-top:16px"><button type="button" class="btn" data-act="addSes">+ Entrenamiento</button><button type="button" class="btn ghost" data-act="nuevoEj">Crear un ejercicio que no está en la lista</button></div>
  </section>`;
}
function guardarRutina() {
  state.rutina = $$('#rutList .rut-s').map(b => ({
    id: b.dataset.s, nombre: b.querySelector('[id^="rn-"]').value.trim() || 'Entrenamiento',
    items: [...b.querySelectorAll('.rut-row')].map(r => {
      const it = { id: r.dataset.i, e: r.querySelector('select').value }, esq = leerEsq(r.querySelector('[id^="rq-"]').value);
      if (esq) it.esq = esq;
      return it;
    })
  }));
  state.rutinaModo = 'propia'; persist();
  // La revisión se recalcula al toque, sin redibujar el formulario
  const rev = $('[aria-labelledby="rev-t"]'); if (rev) { const tmp = document.createElement('div'); tmp.innerHTML = revisionHTML(planDe(activo())); rev.replaceWith(tmp.firstElementChild); }
  $$('.seg [data-act="rutModo"]').forEach(b => b.classList.toggle('on', b.dataset.v === 'propia'));
  const nota = $('#rutNota'); if (nota) nota.firstChild.textContent = 'Elegí los ejercicios de la lista. Los cambios se guardan solos. ';
}

/* ================= PRIMEROS PASOS ================= */
const PASOS = ['bienvenida', 'vos', 'enfoque', 'marcas', 'objetivos', 'rutina', 'calendario', 'listo'];
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
  if (g('pr-dur')) p.prefs = leerPrefs();
}
function renderOnb() {
  const d = ui.draft, p = d.perfil, i = ui.paso, paso = PASOS[i];
  if (paso === 'bienvenida') {
    $('#main').innerHTML = `<div class="onb">${otrosPerfiles()}
      ${escena({ tall: true, label: 'Bienvenida', eyebrow: 'Marea', titulo: 'Tu entrenamiento, en mareas', sub: 'Semanas de carga, semanas de descarga y un registro de todo lo que levantás.', tipo: 'carga' })}
      <section class="card onb-card"><div class="onb-body">
        <p style="font-size:16px">Contame cómo entrenás y qué querés lograr. Yo armo el ciclo y, semana a semana, comparo lo que levantás con lo planeado para avisarte cuándo subir y cuándo descargar.</p>
        <p class="note">Son 7 pasos cortos. Después podés cambiar todo.</p>
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
  } else if (paso === 'rutina') {
    say = 'Con esto armo tu rutina: cuánto tiempo tenés, qué te gusta, qué equipo hay, si hacés otro deporte y si algo te molesta.';
    body = `<h2 class="onb-h">Armemos tu rutina</h2>${prefsForm(prefsDe(p))}`;
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
  $('#main').innerHTML = `<div class="onb">${otrosPerfiles()}<section class="card onb-card" aria-label="Primeros pasos">
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
    const ph = n => last ? (last.querySelector(`[data-f="${n}"]`) || {}).placeholder : '';
    const tmp = document.createElement('div'); tmp.innerHTML = setRow(ejDe(ex.dataset.e), f.dataset.s, ex.dataset.i, sets.children.length, null, { kg: ph('kg'), reps: ph('reps'), seg: ph('seg'), conRM: true }, null);
    sets.appendChild(tmp.firstElementChild); return;
  }
  if (a === 'delSet') {
    const sets = el.closest('.sets'); el.closest('.set').remove();
    [...sets.children].forEach((r, i) => { r.querySelector('.set-i').textContent = i + 1; });
    return;
  }
  if (a === 'rellenar') {
    el.closest('.ses-form').querySelectorAll('.ex:not(.skip) .set').forEach(r => {
      // Sin kilos sugeridos ni de la última vez no se puede completar esa serie (salvo lanzamientos: el balón es opcional)
      const kg = r.querySelector('[data-f=kg]'); if (kg && !r.classList.contains('set-lanz') && !kg.value && !/^[\d.]+$/.test(kg.placeholder)) return;
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
  if (a === 'prefs') return modalPrefs();
  if (a === 'cerrar') return modalCerrar();
  if (a === 'coach') return modalCoach();
  if (a === 'nuevoEj') return modalNuevoEj();
  if (a === 'exportar') return exportar();
  if (a === 'actualizarApp') { location.reload(); return; }
  // Modo desarrollador
  if (a === 'devToggle') { dev = !dev; lsSet(LS_DEV, dev ? '1' : '0'); ui.tab = dev ? 'dev' : 'plan'; render(); scrollTo(0, 0); return; }
  if (a === 'perfilUsar') return usarPerfil(el.dataset.id);
  if (a === 'perfilNuevo') { const idx = indicePerfiles(), id = nid('p'); idx.push({ id, nombre: 'Perfil ' + idx.length }); guardarIndice(idx); return usarPerfil(id); }
  if (a === 'perfilBorrar') {
    const p = indicePerfiles().find(x => x.id === el.dataset.id);
    return openModal(`<h2 style="font-size:20px">Borrar el perfil «${esc(p ? p.nombre : '')}»</h2><p class="note">Se borran su plan, su rutina y sus registros de este dispositivo. No se puede deshacer.</p>
      <div class="row" style="justify-content:flex-end"><button class="btn" data-act="cerrarModal">Cancelar</button><button class="btn primary" data-act="perfilBorrarOk" data-id="${el.dataset.id}">Borrar perfil</button></div>`);
  }
  if (a === 'perfilBorrarOk') {
    const id = el.dataset.id; lsDel(claveDe(id)); guardarIndice(indicePerfiles().filter(x => x.id !== id)); closeModal();
    if (id === perfilId) cargarPerfil('principal'); else render();
    return;
  }
  if (a === 'rutGuardar' || a === 'rutSugerida') {
    const sug = a === 'rutSugerida', nombre = $('#rutNombre').value.trim() || `${sug ? 'Sugerida' : 'Mi rutina'} · ${fd(new Date())}`;
    state.rutinas.push({ id: nid('r'), nombre, fecha: iso(new Date()), rutina: clone(sug ? rutinaBase(state.perfil, state.objetivos) : state.rutina) });
    persist(); render(); return;
  }
  if (a === 'rutUsar') {
    const r = state.rutinas.find(x => x.id === el.dataset.id); if (!r) return;
    // La rutina que estabas usando no se pierde: si no estaba guardada, se guarda como «Anterior»
    if (!state.rutinas.some(x => JSON.stringify(x.rutina) === JSON.stringify(state.rutina))) state.rutinas.push({ id: nid('r'), nombre: `Anterior · ${fd(new Date())}`, fecha: iso(new Date()), rutina: clone(state.rutina) });
    state.rutina = clone(r.rutina); state.rutinaModo = 'propia'; persist();
    ui.celebrar = `Ahora usás la rutina «${r.nombre}».`; ui.tab = 'semana'; render(); scrollTo(0, 0); return;
  }
  if (a === 'rutBorrar') { state.rutinas = state.rutinas.filter(x => x.id !== el.dataset.id); persist(); render(); return; }
  if (a === 'notaAgregar') {
    const t = $('#notaTxt').value.trim(); if (!t) return;
    state.notas.push({ id: nid('n'), fecha: iso(new Date()), semana: semanaActual(cy, planDe(cy)).c + 1, texto: t });
    persist(); render(); return;
  }
  if (a === 'notaBorrar') { state.notas = state.notas.filter(x => x.id !== el.dataset.id); persist(); render(); return; }
  if (a === 'notasCopiar') {
    const txt = state.notas.map(n => `${n.fecha} (semana ${n.semana}): ${n.texto}`).join('\n');
    Promise.resolve().then(() => navigator.clipboard.writeText(txt)).then(() => { $('#notasMsg').textContent = 'Copiadas'; }, () => { $('#notasMsg').textContent = 'No pude copiarlas en este navegador'; });
    return;
  }
  if (a === 'propioGuardar') {
    const e = state.propios.find(x => x.id === el.dataset.id), [n, g, t] = el.closest('.propio').querySelectorAll('input,select');
    Object.assign(e, { n: n.value.trim() || e.n, g: g.value, t: t.value, marca: t.value === 'salto' ? 'cm' : t.value === 'lanzamiento' ? 'm' : undefined });
    persist(); render(); return;
  }
  if (a === 'propioBorrar') { state.propios = state.propios.filter(x => x.id !== el.dataset.id); persist(); render(); return; }
  if (a === 'recordatorios') return recordatorios();
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
    lsDel(claveDe(perfilId));
    state = ejemplo(); Object.assign(ui, { view: 'onb', paso: 0, draft: nuevoDraft(), wk: null, tab: 'semana', open: null }); saludado = false;
    closeModal(); render(); scrollTo(0, 0);
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset && t.dataset.ns) { const inp = document.getElementById(t.dataset.ns); inp.disabled = t.checked; if (t.checked) inp.value = ''; }
  if (t.name === 'modoObj') { const w = $('#goalsWrap'); if (w) w.hidden = t.value !== 'esp'; }
  if (t.hasAttribute && t.hasAttribute('data-skip')) t.closest('.ex').classList.toggle('skip', t.checked);
  // Cambiar un ejercicio solo por hoy: se redibuja ese ejercicio con el nuevo, sin tocar la rutina ni lo ya escrito en los otros
  if (t.hasAttribute && t.hasAttribute('data-swap')) {
    const f = t.closest('.ses-form'), ex = t.closest('.ex'), cy = activo(), plan = planDe(cy), wi = +f.dataset.w;
    const s = state.rutina.find(x => x.id === f.dataset.s), it = s.items.find(x => x.id === ex.dataset.i), k = claveSwap(wi, s.id, it.id);
    if (t.value === it.e) ui.swaps[k] = it.e; else ui.swaps[k] = t.value;
    const lg = ((cy.logs || {})[wi] || {})[s.id], tmp = document.createElement('div');
    tmp.innerHTML = exBlock(plan, cy, wi, s, it, lg, s.items.filter(x => esPlio(x.e)).length);
    ex.replaceWith(tmp.firstElementChild);
  }
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
  if (f.id === 'fPrefs') {
    state.perfil.prefs = leerPrefs();
    if ($('#pr-aplicar').checked) {
      if (state.rutinaModo === 'propia') state.rutinas.push({ id: nid('r'), nombre: `Antes de cambiar respuestas · ${fd(new Date())}`, fecha: iso(new Date()), rutina: clone(state.rutina) });
      state.rutina = rutinaBase(state.perfil, state.objetivos); state.rutinaModo = 'auto';
    }
    persist(); closeModal(); ui.celebrar = null; render(); return;
  }
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
    let salteados = 0;
    f.querySelectorAll('.ex').forEach(div => {
      const it = s.items.find(x => x.id === div.dataset.i); if (!it) return;
      const e = div.dataset.e;
      if (div.querySelector('[data-skip]').checked) { ej[it.id] = { e, s: [], skip: true }; salteados++; return; }
      const sets = leerSets(div, ejDe(e)); if (!sets.length) return;
      const en = { e, s: sets }, rpe = div.querySelector('[data-rpe]'), esf = div.querySelector('[data-esf]');
      if (e === it.e && it.esq) en.esq = it.esq;
      if (rpe && rpe.value) en.rpe = +rpe.value;
      if (esf && esf.value) en.esf = esf.value;
      ej[it.id] = en; n += sets.length;
    });
    if (!n && !salteados) { const er = f.querySelector('.err'); er.textContent = 'Cargá al menos una serie (con kilos y repeticiones; para peso corporal, 0 kg) o marcá lo que no hiciste.'; er.hidden = false; return; }
    cy.logs[wi] = cy.logs[wi] || {}; cy.logs[wi][sid] = { fecha: iso(new Date()), ej };
    Object.keys(ui.swaps).forEach(k => { if (k.startsWith(`${wi}:${sid}:`)) delete ui.swaps[k]; });
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
try { const s = lsGet(claveDe(perfilId)); if (s) { state = migrar(JSON.parse(s)); ui.view = 'dash'; } } catch (e) { /* datos ilegibles: se usa el ejemplo */ }
iniciarMascotas();
render();
setTimeout(() => vueltaDisco(), 2500);
// Actualización automática. En el iPhone, la app instalada queda abierta en segundo plano y no recarga sola:
// cada vez que volvés a ella se busca una versión nueva; cuando se activa, se recarga, salvo que estés
// cargando un entrenamiento o con una ventana abierta (ahí aparece un aviso para que actualices al terminar).
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const habiaVersion = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register(new URL('../sw.js', import.meta.url)).then(reg => {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habiaVersion || ui.versionNueva) return;
    if (ui.open || $('#modalRoot').innerHTML || (ui.view === 'onb' && ui.paso > 0)) { ui.versionNueva = true; render(); }
    else location.reload();
  });
}
