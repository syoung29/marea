# Marea

App para planificar semanas de carga y descarga y registrar lo que levantás. Arma el ciclo según tu enfoque, tus marcas y tus objetivos, y semana a semana compara lo que cargás con lo planeado.

Es una app web instalable (PWA): funciona en el navegador, se instala en el iPhone como cualquier app y abre sin conexión. No necesita instalar nada para desarrollarla.

## Probarla en la compu

Abrí PowerShell en esta carpeta y corré:

```
powershell -ExecutionPolicy Bypass -File tools\servidor.ps1
```

Después entrá a http://localhost:8765. Para cortarlo, Ctrl+C.

(Abrir `index.html` con doble clic no alcanza: la app necesita un servidor, aunque sea local.)

## Publicarla gratis e instalarla en el iPhone

1. Entrá a https://app.netlify.com/drop (te pide crear una cuenta gratuita).
2. Arrastrá esta carpeta entera. En unos segundos te da una dirección del tipo `https://algo.netlify.app`.
3. En el iPhone, abrí esa dirección en **Safari**, tocá **Compartir** → **Agregar a inicio**.
4. Listo: queda el ícono de Kilo en la pantalla de inicio y abre a pantalla completa.

Cada vez que cambies algo, volvé a arrastrar la carpeta en Netlify (en el mismo sitio) y subí el número de `CACHE` en `sw.js` (por ejemplo `marea-v2`) para que el teléfono tome la versión nueva.

## Dónde quedan tus datos

Todo se guarda en el dispositivo (no hay cuentas todavía). Desde la pestaña **Plan → Tus datos** podés descargar un respaldo y restaurarlo en otro teléfono. Conviene hacerlo de vez en cuando.

## Cómo está organizado

| Archivo | Qué hace |
|---|---|
| `index.html` | La página y los permisos para instalarla |
| `css/app.css` | Colores, tipografías y animaciones |
| `js/ejercicios.js` | Base de ejercicios: grupos, cómo se registra cada uno y cuáles se calculan con tu 1RM |
| `js/motor.js` | El algoritmo: fases, carga y descarga, proyecciones, comparación con lo planeado |
| `js/mascotas.js` | Kilo, Disco y la escena de mareas |
| `js/app.js` | Pantallas, primeros pasos, registro y guardado |
| `sw.js` | Guarda la app para que abra sin conexión |
| `tools/` | Servidor local y generador de íconos |

Para sumar un ejercicio a la base, agregalo en `js/ejercicios.js` con un `id` nuevo (no cambies los existentes: el historial se guarda con ese `id`).

## Próximos pasos

- **Cuentas y sincronización:** una base de datos en la nube (por ejemplo Supabase, que tiene plan gratuito) para tener tus datos en el teléfono y la compu, y que tu entrenador vea tu plan.
- **App Store:** envolver esta misma app con Capacitor. Para publicarla en la App Store hace falta una cuenta de desarrollador de Apple (USD 99 por año) y compilarla en una Mac o en un servicio de compilación en la nube.
- **Más adelante:** enfoques por deporte y ajuste por edad.
