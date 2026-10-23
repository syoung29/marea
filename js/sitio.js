// Página de presentación: escena animada, Kilo en las tarjetas y Disco de paseo
import { escena, kilo, iniciarMascotas, conectarKilo, decir, rodarEscena, vueltaDisco } from './mascotas.js';

// Abierta desde la pantalla de inicio (instalada): directo a la app
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) location.replace('/app/');

const hero = document.getElementById('hero');
if (hero) hero.outerHTML = escena({
  tall: true, label: 'Marea', eyebrow: 'Gratis · sin registrarte',
  titulo: 'Entrená en mareas',
  sub: 'Cargá lo que levantás. Marea arma tus semanas de carga y descarga y te dice cómo vas.', tipo: 'carga'
});
document.querySelectorAll('[data-kilo]').forEach(el => { el.innerHTML = kilo('', el.dataset.kilo); });

iniciarMascotas();
conectarKilo(['Probala: es gratis y no hace falta registrarse.', 'Tus datos quedan en tu teléfono, no en un servidor.', 'Si no sabés tu 1RM, lo calculo con tus primeros entrenamientos.']);
setTimeout(() => decir('¡Hola! Soy Kilo, y él es Disco.', 5000), 800);
setTimeout(rodarEscena, 1800);
setTimeout(vueltaDisco, 9000);

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('/sw.js').catch(() => {});
