// Base de ejercicios. Cada uno tiene un id fijo para poder registrar y comparar su historia.
// g = grupo de movimiento · p = estilo de movimiento (los del mismo estilo son alternativas entre sí)
// t = cómo se registra: carga (kg × reps) · lastre (kg extra × reps, 0 = peso corporal)
//     salto / lanzamiento (reps + marca opcional) · tiempo (segundos)
// base = básico con 1RM propio · rel = [básico, fracción]: sus kilos se sugieren a partir de ese 1RM
export const GRUPOS = {
  pierna: 'Pierna', bisagra: 'Cadena posterior', empuje: 'Empuje', traccion: 'Tracción',
  olimpicos: 'Olímpicos', saltos: 'Saltos', lanzamientos: 'Lanzamientos', funcional: 'Funcionales', core: 'Core'
};

export const EJERCICIOS = [
  { id: 'sentadilla', n: 'Sentadilla', g: 'pierna', p: 'rodilla', t: 'carga', base: true },
  { id: 'sentadilla_frontal', n: 'Sentadilla frontal', g: 'pierna', p: 'rodilla', t: 'carga', rel: ['sentadilla', .82] },
  { id: 'bulgara', n: 'Sentadilla búlgara', g: 'pierna', p: 'rodilla-unilateral', t: 'carga' },
  { id: 'zancadas', n: 'Zancadas', g: 'pierna', p: 'rodilla-unilateral', t: 'carga' },
  { id: 'step_up', n: 'Step up', g: 'pierna', p: 'rodilla-unilateral', t: 'carga' },
  { id: 'prensa', n: 'Prensa', g: 'pierna', p: 'rodilla', t: 'carga' },
  { id: 'hack', n: 'Sentadilla hack', g: 'pierna', p: 'rodilla', t: 'carga' },
  { id: 'goblet', n: 'Sentadilla goblet', g: 'pierna', p: 'rodilla', t: 'carga' },
  { id: 'ext_cuadriceps', n: 'Extensión de cuádriceps', g: 'pierna', p: 'cuadriceps', t: 'carga' },
  { id: 'gemelos', n: 'Gemelos', g: 'pierna', p: 'gemelos', t: 'carga' },

  { id: 'muerto', n: 'Peso muerto', g: 'bisagra', p: 'cadera', t: 'carga', base: true },
  { id: 'rumano', n: 'Peso muerto rumano', g: 'bisagra', p: 'cadera', t: 'carga', rel: ['muerto', .7] },
  { id: 'sumo', n: 'Peso muerto sumo', g: 'bisagra', p: 'cadera', t: 'carga', rel: ['muerto', .95] },
  { id: 'good_morning', n: 'Good morning', g: 'bisagra', p: 'cadera', t: 'carga', rel: ['sentadilla', .45] },
  { id: 'hip_thrust', n: 'Hip thrust', g: 'bisagra', p: 'gluteo', t: 'carga' },
  { id: 'espinales', n: 'Espinales con peso', g: 'bisagra', p: 'gluteo', t: 'carga' },
  { id: 'curl_isquios', n: 'Curl de isquiotibiales', g: 'bisagra', p: 'isquios', t: 'carga' },
  { id: 'nordico', n: 'Curl nórdico', g: 'bisagra', p: 'isquios', t: 'lastre' },

  { id: 'banca', n: 'Press banca', g: 'empuje', p: 'empuje-horizontal', t: 'carga', base: true },
  { id: 'inclinado', n: 'Press inclinado con barra', g: 'empuje', p: 'empuje-horizontal', t: 'carga', rel: ['banca', .82] },
  { id: 'press_mancuernas', n: 'Press con mancuernas', g: 'empuje', p: 'empuje-horizontal', t: 'carga' },
  { id: 'inclinado_mancuernas', n: 'Press inclinado con mancuernas', g: 'empuje', p: 'empuje-horizontal', t: 'carga' },
  { id: 'fondos', n: 'Fondos con lastre', g: 'empuje', p: 'empuje-horizontal', t: 'lastre' },
  { id: 'flexiones', n: 'Flexiones', g: 'empuje', p: 'empuje-horizontal', t: 'lastre' },
  { id: 'militar', n: 'Press militar', g: 'empuje', p: 'empuje-vertical', t: 'carga', base: true },
  { id: 'press_hombro_mancuernas', n: 'Press de hombro con mancuernas', g: 'empuje', p: 'empuje-vertical', t: 'carga' },
  { id: 'laterales', n: 'Elevaciones laterales', g: 'empuje', p: 'hombro', t: 'carga' },
  { id: 'aperturas', n: 'Aperturas / pec deck', g: 'empuje', p: 'pecho', t: 'carga' },
  { id: 'triceps', n: 'Extensión de tríceps', g: 'empuje', p: 'triceps', t: 'carga' },

  { id: 'dominadas', n: 'Dominadas con lastre', g: 'traccion', p: 'traccion-vertical', t: 'lastre', base: true },
  { id: 'jalon', n: 'Jalón al pecho', g: 'traccion', p: 'traccion-vertical', t: 'carga' },
  { id: 'pullover', n: 'Pullover', g: 'traccion', p: 'traccion-vertical', t: 'carga' },
  { id: 'remo_barra', n: 'Remo con barra', g: 'traccion', p: 'traccion-horizontal', t: 'carga' },
  { id: 'remo_mancuerna', n: 'Remo con mancuerna', g: 'traccion', p: 'traccion-horizontal', t: 'carga' },
  { id: 'remo_polea', n: 'Remo en polea', g: 'traccion', p: 'traccion-horizontal', t: 'carga' },
  { id: 'face_pull', n: 'Face pull', g: 'traccion', p: 'hombro-posterior', t: 'carga' },
  { id: 'biceps', n: 'Curl de bíceps', g: 'traccion', p: 'biceps', t: 'carga' },

  { id: 'cargada', n: 'Cargada (clean)', g: 'olimpicos', p: 'olimpico-cargada', t: 'carga', base: true },
  { id: 'cargada_colgante', n: 'Cargada colgante', g: 'olimpicos', p: 'olimpico-cargada', t: 'carga', rel: ['cargada', .9] },
  { id: 'arranque', n: 'Arranque (snatch)', g: 'olimpicos', p: 'olimpico-arranque', t: 'carga', base: true },
  { id: 'arranque_colgante', n: 'Arranque colgante', g: 'olimpicos', p: 'olimpico-arranque', t: 'carga', rel: ['arranque', .9] },
  { id: 'envion', n: 'Envión (jerk)', g: 'olimpicos', p: 'olimpico-envion', t: 'carga', rel: ['cargada', .95] },
  { id: 'push_press', n: 'Push press', g: 'olimpicos', p: 'olimpico-envion', t: 'carga', rel: ['militar', 1.2] },

  { id: 'cmj', n: 'Salto vertical (CMJ)', g: 'saltos', p: 'salto-vertical', t: 'salto', marca: 'cm', base: true },
  { id: 'squat_jump', n: 'Squat jump', g: 'saltos', p: 'salto-vertical', t: 'salto', marca: 'cm' },
  { id: 'salto_cajon', n: 'Salto al cajón', g: 'saltos', p: 'salto-vertical', t: 'salto', marca: 'cm' },
  { id: 'drop_jump', n: 'Drop jump', g: 'saltos', p: 'salto-reactivo', t: 'salto' },
  { id: 'vallas', n: 'Saltos de vallas', g: 'saltos', p: 'salto-reactivo', t: 'salto' },
  { id: 'pogo', n: 'Pogo', g: 'saltos', p: 'salto-reactivo', t: 'salto' },
  { id: 'largo', n: 'Salto en largo', g: 'saltos', p: 'salto-horizontal', t: 'salto', marca: 'cm', base: true },
  { id: 'bounds', n: 'Multisaltos (bounds)', g: 'saltos', p: 'salto-horizontal', t: 'salto', marca: 'm' },
  { id: 'salto_una_pierna', n: 'Salto a una pierna', g: 'saltos', p: 'salto-horizontal', t: 'salto', marca: 'cm' },

  { id: 'lanz_vertical', n: 'Lanzamiento de balón vertical', g: 'lanzamientos', p: 'lanzamiento', t: 'lanzamiento', marca: 'm' },
  { id: 'lanz_horizontal', n: 'Lanzamiento de balón horizontal', g: 'lanzamientos', p: 'lanzamiento', t: 'lanzamiento', marca: 'm' },
  { id: 'lanz_rotacional', n: 'Lanzamiento rotacional', g: 'lanzamientos', p: 'lanzamiento-rotacional', t: 'lanzamiento', marca: 'm' },
  { id: 'slam', n: 'Slam de balón', g: 'lanzamientos', p: 'lanzamiento', t: 'lanzamiento' },

  { id: 'landmine_press', n: 'Landmine press', g: 'funcional', p: 'empuje-vertical', t: 'carga' },
  { id: 'landmine_rotacion', n: 'Rotación con barra (landmine)', g: 'funcional', p: 'rotacion', t: 'carga' },
  { id: 'landmine_sentadilla', n: 'Sentadilla landmine', g: 'funcional', p: 'rodilla', t: 'carga' },
  { id: 'zercher', n: 'Sentadilla Zercher', g: 'funcional', p: 'rodilla', t: 'carga', rel: ['sentadilla', .75] },
  { id: 'kb_swing', n: 'Swing con kettlebell', g: 'funcional', p: 'cadera', t: 'carga' },
  { id: 'peso_muerto_una_pierna', n: 'Peso muerto a una pierna', g: 'funcional', p: 'cadera', t: 'carga' },
  { id: 'get_up', n: 'Turkish get-up', g: 'funcional', p: 'estabilidad', t: 'carga' },
  { id: 'paseo_granjero', n: 'Paseo del granjero', g: 'funcional', p: 'acarreo', t: 'tiempo' },
  { id: 'trineo', n: 'Empuje de trineo', g: 'funcional', p: 'acarreo', t: 'tiempo' },
  { id: 'lenador', n: 'Leñador en polea', g: 'funcional', p: 'rotacion', t: 'carga' },

  { id: 'plancha', n: 'Plancha', g: 'core', p: 'antiextension', t: 'tiempo' },
  { id: 'rueda', n: 'Rueda abdominal', g: 'core', p: 'antiextension', t: 'lastre' },
  { id: 'copenhague', n: 'Plancha Copenhague', g: 'core', p: 'antiextension', t: 'tiempo' },
  { id: 'elev_piernas', n: 'Elevación de piernas colgado', g: 'core', p: 'flexion-tronco', t: 'lastre' },
  { id: 'pallof', n: 'Pallof press', g: 'core', p: 'rotacion', t: 'carga' }
];
const EJ = Object.fromEntries(EJERCICIOS.map(e => [e.id, e]));

// Ejercicios creados por la persona (se guardan en su estado)
let propios = [];
export const registrarPropios = l => { propios = l || []; };
export const ejDe = id => EJ[id] || propios.find(e => e.id === id) || { id, n: 'Ejercicio borrado', g: 'core', t: 'carga' };
export const todos = () => [...EJERCICIOS, ...propios];

// Alternativas para cambiar un ejercicio solo por hoy: primero los del mismo estilo, después los del mismo grupo
// que se registran igual (así las series cargadas siguen teniendo sentido)
export function alternativas(id) {
  const d = ejDe(id), resto = todos().filter(e => e.id !== id && e.t === d.t);
  const estilo = d.p ? resto.filter(e => e.p === d.p) : [];
  const grupo = resto.filter(e => e.g === d.g && !estilo.includes(e));
  return { estilo, grupo };
}

export const TIPOS = {
  carga: 'Con peso (kg × reps)', lastre: 'Peso corporal o lastre', salto: 'Salto', lanzamiento: 'Lanzamiento', tiempo: 'Por tiempo'
};

// Marcas que se piden al empezar: básicos con 1RM y saltos de referencia
export const MARCAS = ['sentadilla', 'banca', 'muerto', 'militar', 'dominadas', 'arranque', 'cargada'];
export const SALTOS = ['cmj', 'largo'];
export const esLevantamiento = k => MARCAS.includes(k);
export const esSaltoBase = k => SALTOS.includes(k);

// Ejercicio extra que suma la rutina sugerida cuando el objetivo es mejorar un grupo
export const EXTRA_GRUPO = {
  pierna: 'bulgara', bisagra: 'rumano', empuje: 'press_mancuernas', traccion: 'remo_polea',
  olimpicos: 'cargada_colgante', saltos: 'drop_jump', lanzamientos: 'lanz_rotacional', funcional: 'landmine_press', core: 'plancha'
};
