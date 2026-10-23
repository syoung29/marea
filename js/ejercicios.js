// Base de ejercicios. Cada uno tiene un id fijo para poder registrar y comparar su historia.
// g = grupo de movimiento · t = cómo se registra:
//   carga (kg × reps) · lastre (kg extra × reps, 0 = peso corporal) · salto / lanzamiento (reps + marca opcional) · tiempo (segundos)
// base = básico con 1RM propio · rel = [básico, fracción]: sus kilos se sugieren a partir de ese 1RM
export const GRUPOS = {
  pierna: 'Pierna', bisagra: 'Cadena posterior', empuje: 'Empuje', traccion: 'Tracción',
  olimpicos: 'Olímpicos', saltos: 'Saltos', lanzamientos: 'Lanzamientos', core: 'Core'
};

export const EJERCICIOS = [
  { id: 'sentadilla', n: 'Sentadilla', g: 'pierna', t: 'carga', base: true },
  { id: 'sentadilla_frontal', n: 'Sentadilla frontal', g: 'pierna', t: 'carga', rel: ['sentadilla', .82] },
  { id: 'bulgara', n: 'Sentadilla búlgara', g: 'pierna', t: 'carga' },
  { id: 'zancadas', n: 'Zancadas', g: 'pierna', t: 'carga' },
  { id: 'prensa', n: 'Prensa', g: 'pierna', t: 'carga' },
  { id: 'hack', n: 'Sentadilla hack', g: 'pierna', t: 'carga' },
  { id: 'ext_cuadriceps', n: 'Extensión de cuádriceps', g: 'pierna', t: 'carga' },
  { id: 'step_up', n: 'Step up', g: 'pierna', t: 'carga' },
  { id: 'gemelos', n: 'Gemelos', g: 'pierna', t: 'carga' },

  { id: 'muerto', n: 'Peso muerto', g: 'bisagra', t: 'carga', base: true },
  { id: 'rumano', n: 'Peso muerto rumano', g: 'bisagra', t: 'carga', rel: ['muerto', .7] },
  { id: 'sumo', n: 'Peso muerto sumo', g: 'bisagra', t: 'carga', rel: ['muerto', .95] },
  { id: 'hip_thrust', n: 'Hip thrust', g: 'bisagra', t: 'carga' },
  { id: 'curl_isquios', n: 'Curl de isquiotibiales', g: 'bisagra', t: 'carga' },
  { id: 'nordico', n: 'Curl nórdico', g: 'bisagra', t: 'lastre' },
  { id: 'espinales', n: 'Espinales con peso', g: 'bisagra', t: 'carga' },
  { id: 'good_morning', n: 'Good morning', g: 'bisagra', t: 'carga', rel: ['sentadilla', .45] },

  { id: 'banca', n: 'Press banca', g: 'empuje', t: 'carga', base: true },
  { id: 'inclinado', n: 'Press inclinado con barra', g: 'empuje', t: 'carga', rel: ['banca', .82] },
  { id: 'press_mancuernas', n: 'Press con mancuernas', g: 'empuje', t: 'carga' },
  { id: 'inclinado_mancuernas', n: 'Press inclinado con mancuernas', g: 'empuje', t: 'carga' },
  { id: 'militar', n: 'Press militar', g: 'empuje', t: 'carga', base: true },
  { id: 'press_hombro_mancuernas', n: 'Press de hombro con mancuernas', g: 'empuje', t: 'carga' },
  { id: 'fondos', n: 'Fondos con lastre', g: 'empuje', t: 'lastre' },
  { id: 'flexiones', n: 'Flexiones', g: 'empuje', t: 'lastre' },
  { id: 'laterales', n: 'Elevaciones laterales', g: 'empuje', t: 'carga' },
  { id: 'aperturas', n: 'Aperturas / pec deck', g: 'empuje', t: 'carga' },
  { id: 'triceps', n: 'Extensión de tríceps', g: 'empuje', t: 'carga' },

  { id: 'dominadas', n: 'Dominadas con lastre', g: 'traccion', t: 'lastre', base: true },
  { id: 'remo_barra', n: 'Remo con barra', g: 'traccion', t: 'carga' },
  { id: 'remo_mancuerna', n: 'Remo con mancuerna', g: 'traccion', t: 'carga' },
  { id: 'jalon', n: 'Jalón al pecho', g: 'traccion', t: 'carga' },
  { id: 'remo_polea', n: 'Remo en polea', g: 'traccion', t: 'carga' },
  { id: 'face_pull', n: 'Face pull', g: 'traccion', t: 'carga' },
  { id: 'biceps', n: 'Curl de bíceps', g: 'traccion', t: 'carga' },
  { id: 'pullover', n: 'Pullover', g: 'traccion', t: 'carga' },

  { id: 'cargada', n: 'Cargada (clean)', g: 'olimpicos', t: 'carga', base: true },
  { id: 'arranque', n: 'Arranque (snatch)', g: 'olimpicos', t: 'carga', base: true },
  { id: 'cargada_colgante', n: 'Cargada colgante', g: 'olimpicos', t: 'carga', rel: ['cargada', .9] },
  { id: 'arranque_colgante', n: 'Arranque colgante', g: 'olimpicos', t: 'carga', rel: ['arranque', .9] },
  { id: 'envion', n: 'Envión (jerk)', g: 'olimpicos', t: 'carga', rel: ['cargada', .95] },
  { id: 'push_press', n: 'Push press', g: 'olimpicos', t: 'carga', rel: ['militar', 1.2] },

  { id: 'cmj', n: 'Salto vertical (CMJ)', g: 'saltos', t: 'salto', marca: 'cm', base: true },
  { id: 'largo', n: 'Salto en largo', g: 'saltos', t: 'salto', marca: 'cm', base: true },
  { id: 'salto_cajon', n: 'Salto al cajón', g: 'saltos', t: 'salto', marca: 'cm' },
  { id: 'salto_una_pierna', n: 'Salto a una pierna', g: 'saltos', t: 'salto', marca: 'cm' },
  { id: 'squat_jump', n: 'Squat jump', g: 'saltos', t: 'salto', marca: 'cm' },
  { id: 'drop_jump', n: 'Drop jump', g: 'saltos', t: 'salto' },
  { id: 'vallas', n: 'Saltos de vallas', g: 'saltos', t: 'salto' },
  { id: 'bounds', n: 'Multisaltos (bounds)', g: 'saltos', t: 'salto', marca: 'm' },
  { id: 'pogo', n: 'Pogo', g: 'saltos', t: 'salto' },

  { id: 'lanz_vertical', n: 'Lanzamiento de balón vertical', g: 'lanzamientos', t: 'lanzamiento', marca: 'm' },
  { id: 'lanz_horizontal', n: 'Lanzamiento de balón horizontal', g: 'lanzamientos', t: 'lanzamiento', marca: 'm' },
  { id: 'lanz_rotacional', n: 'Lanzamiento rotacional', g: 'lanzamientos', t: 'lanzamiento', marca: 'm' },
  { id: 'slam', n: 'Slam de balón', g: 'lanzamientos', t: 'lanzamiento' },

  { id: 'plancha', n: 'Plancha', g: 'core', t: 'tiempo' },
  { id: 'rueda', n: 'Rueda abdominal', g: 'core', t: 'lastre' },
  { id: 'elev_piernas', n: 'Elevación de piernas colgado', g: 'core', t: 'lastre' },
  { id: 'pallof', n: 'Pallof press', g: 'core', t: 'carga' }
];
const EJ = Object.fromEntries(EJERCICIOS.map(e => [e.id, e]));

// Ejercicios creados por la persona (se guardan en su estado)
let propios = [];
export const registrarPropios = l => { propios = l || []; };
export const ejDe = id => EJ[id] || propios.find(e => e.id === id) || { id, n: 'Ejercicio borrado', g: 'core', t: 'carga' };
export const todos = () => [...EJERCICIOS, ...propios];

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
  olimpicos: 'cargada_colgante', saltos: 'drop_jump', lanzamientos: 'lanz_rotacional', core: 'plancha'
};
