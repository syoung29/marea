# Cómo planifica Marea

Marea no usa inteligencia artificial ni servicios externos: todo sale de reglas fijas y cálculos que corren en el teléfono, a partir de tus datos (marcas, peso, años entrenando, cómo recuperás, días, enfoque y objetivos) y de lo que vas registrando. Este documento explica en qué principios de entrenamiento se basa cada regla y dónde está en el código.

## 1. Tu nivel

- **Fuerza relativa:** cada 1RM se divide por tu peso corporal y se compara con una referencia (sentadilla 1,5×, banca 1,0×, peso muerto 1,8×, press militar 0,65×, cargada 1,2×, arranque 0,95×; dominadas: peso + lastre sobre peso, 1,45×). Saltos: CMJ 55 cm, salto en largo 260 cm. En mujeres las referencias se ajustan (×0,72 fuerza, ×0,8 saltos y dominadas).
- **Nivel por marca:** menos de 0,8 de la referencia = principiante; hasta 1,15 = intermedio; más = avanzado. Con menos de 1 año entrenando sos principiante; con menos de 2, no más que intermedio.
- **Nivel global:** promedio ponderado. Lo que querés mejorar (ejercicio o grupo) pesa el doble. Saltos y olímpicos cuentan de lleno solo en potencia y mixto.
- Código: `nivel()` en `js/motor.js`.

## 2. Cómo se arma el ciclo

**Periodización por bloques.** El ciclo encadena fases con un objetivo cada una: acumulación (volumen con pesos moderados), transformación o fuerza (menos repeticiones, más kilos) y realización (poco volumen para llegar fresco y medir). En potencia se agrega una fase de potencia: velocidad y saltos intensos. Es el modelo de bloques secuenciales descripto por Issurin.

**Carga y descarga.**
- Cada bloque tiene semanas de carga seguidas de 1 semana de descarga: 5 si sos principiante, 4 si sos intermedio, 3 si sos avanzado.
- Con buena recuperación (4–5) se suma una semana; con mala (1–2) se resta una.
- Cuanto más fuerte sos, más fatiga genera cada semana y antes conviene descargar.
- La descarga baja el volumen a la mitad y la intensidad unos 7 puntos, que es la forma más común de descargar según el consenso de entrenadores.

**Dentro de un bloque.** La intensidad (% del 1RM) sube semana a semana y las repeticiones bajan. El volumen se mantiene en acumulación y baja cuando sube la intensidad; en sobrecarga de hipertrofia sube, porque ahí el objetivo es el volumen.

**Competencias.** Si cargás una fecha, el ciclo se arma hacia atrás para que la última semana sea la de la competencia.

Código: `generar()` y `FASES` en `js/motor.js`.

## 3. Qué toca en cada ejercicio

Cada ejercicio tiene una **función**, y de eso depende su esquema (`rol()` y `objetivoEj()` en `js/motor.js`):

| Función | Ejemplos | Esquema |
|---|---|---|
| Potencia | saltos, lanzamientos | Contactos por semana según tu nivel; menos contactos cuanto más intensos. Series cortas, de 8 como máximo |
| Olímpico | cargada, arranque | 5 × 1–3, rápidos, 70–90% |
| Principal | sentadilla, banca, peso muerto, militar, dominadas con lastre | Lo que dice la fase: % del 1RM, repeticiones y RPE de la semana |
| Secundario | variantes y compuestos (frontal, rumano, remo, landmine) | 3 series de 2 repeticiones más que el principal, hasta RPE 8,5 |
| Accesorio | aislados (cuádriceps, isquios, hombro, bíceps, tríceps…) | 3 × 10–13, o 12–15 en acumulación e hipertrofia, a RPE 8 |
| Core | plancha, Pallof, rueda | 3 × 30 s o 3 × 10–13 |

- **Kilos sugeridos:** en los principales se calculan con tu 1RM y el % de la semana. En las variantes se usa la fracción del básico (por ejemplo, la sentadilla frontal ≈ 82% de la sentadilla) y el % que corresponde a esas repeticiones y RPE, con la fórmula de Epley al revés.
- **Esquema propio:** si en Rutina escribís un esquema (por ejemplo 4x6), se usa ese; los kilos se calculan para esas repeticiones al RPE de la semana. En descarga, la mitad de las series.
- **Fase de potencia:** los saltos se hacen en contraste, 1 serie justo después de cada serie pesada del básico del día. Aprovecha la potenciación posactivación (Seitz y Haff).

## 4. La rutina sugerida

Antes de armarla, Marea pregunta (paso «Armemos tu rutina», o Rutina → Cambiar respuestas):

| Pregunta | Qué cambia |
|---|---|
| Cómo la querés encarar (pocos y pesados, equilibrada, variada) | Tope de ejercicios por día (5 como máximo en «pocos y pesados»; uno más en «variada») |
| Duración de la sesión y descanso entre series | Cuántas series entran: minutos × 60 / (40 s por serie + descanso). Dividido por ~3,2 series por ejercicio da el tope (entre 4 y 8) |
| Qué te gusta hacer | Suma ejercicios de ese estilo (swing y landmine, búlgara, prensa, olímpicos) y los prefiere al reemplazar |
| Con qué equipo contás | Solo se usan ejercicios posibles; lo que no se puede se cambia por otro del mismo estilo |
| Otro deporte y cuántos días | De equipo o de saltos 2+ días: un solo salto por día de pierna y 30% menos contactos. Raqueta o combate: lanzamiento rotacional y Pallof. Resistencia: gemelos. 3+ días: bloques de carga una semana más cortos (desde el ciclo siguiente) |
| Molestias (rodilla, hombro, espalda baja) | Se evitan los ejercicios que más cargan esa zona y se reemplazan por otros del mismo estilo. Con molestia de rodilla, saltos al cajón en vez de reactivos |

Lo sumado por prevención o por objetivo no se recorta; lo sumado por gusto solo se reemplaza por algo del mismo estilo. La pestaña Rutina muestra **por qué** quedó así cada cosa, incluido lo que quedó afuera por tiempo.

Reglas que aplica `armarRutina()` en `js/app.js`:

1. **División según tus días:** cuerpo completo con 2–3 días; torso/pierna con 4; empuje, tirón y pierna con 5–6.
2. **Pliometría en los días de pierna:** salto vertical un día y horizontal otro, para no repetir el mismo estímulo intenso en días seguidos. En potencia y mixto se suma un lanzamiento de tren superior.
3. **Orden de la sesión:** potencia, olímpicos, principales, secundarios, accesorios y core. Lo explosivo y lo técnico va primero, con el sistema nervioso fresco.
4. **Prevención de lesiones:**
   - curl nórdico (isquios) y plancha Copenhague (aductores) si saltás o corrés, porque los dos tienen evidencia de reducir lesiones en deportistas;
   - face pull para equilibrar tanto press.
5. **Lo que querés mejorar:** un ejercicio extra de ese grupo, más los ejercicios puntuales que elegiste.
6. **Tope de 7 ejercicios por sesión.** Si sobran, salen primero los accesorios que no son objetivo.

**Revisión de tu rutina** (`revisarRutina()`): cuenta las series semanales por grupo y los contactos de salto, y avisa si pasa alguna de estas cosas:

- hay saltos después de ejercicios pesados;
- una sesión pasa de 24 series;
- la tracción tiene menos del 75% de las series de empuje;
- buscás potencia y no tenés saltos, o tenés demasiados para tu nivel;
- un patrón básico aparece un solo día con 4 o más días de entrenamiento (en fuerza conviene entrenarlo 2 veces por semana);
- un grupo que querés mejorar tiene menos series que el promedio de los demás.

## 5. Cómo se compara lo que hacés con el plan

- Por cada básico, Marea toma tu mejor serie del día y la convierte en 1RM estimado con Epley: kg × (1 + reps / 30).
- **Se compara con lo planeado usando el mismo cálculo.** Si hacés justo los kilos y las repeticiones sugeridos, da 100% y tu 1RM estimado queda igual. Así una serie a RPE 7 no aparece como "bajaste".
- **Si anotás el RPE real**, entran las repeticiones que te quedaban (repeticiones en reserva = 10 − RPE). Mismos kilos con RPE más alto que el objetivo = estás algo por debajo. Las semanas de descarga no cuentan.

**Si cambiás la rutina, el seguimiento no se reinicia:** todo se guarda por ejercicio, no por rutina. El mismo ejercicio conserva su historial en cualquier rutina. Las variantes con relación conocida (frontal ≈ 82% de la sentadilla, rumano ≈ 70% del peso muerto, inclinado ≈ 82% de la banca, colgantes ≈ 90% de su olímpico…) cuentan como **equivalentes** del básico: su serie se convierte al 1RM del básico y aparece en su gráfico con un punto hueco. Los ejercicios sin relación conocida (por ejemplo, press con mancuernas frente a banca) llevan su propio historial y suman al progreso de su grupo. Los entrenamientos cargados con una rutina anterior siguen viéndose en su semana.

## 6. Las correcciones cuando vas por debajo (o por encima)

Hay cuatro mecanismos, de más rápido a más lento:

1. **En el momento:** al guardar un entrenamiento te dice si quedaste arriba, en línea o abajo de lo planeado. En línea es entre 95% y 100%.
2. **Descarga anticipada:** si una semana de carga quedás por debajo del 90%, o dos seguidas por debajo del 95%, te sugiere adelantar la descarga. Rendir menos varias sesiones seguidas suele ser fatiga acumulada, no falta de fuerza.
3. **Ajustar el 1RM:**
   - Si en 2 o 3 de tus últimas semanas de carga un básico quedó siempre por debajo del 95%, te ofrece bajar ese 1RM al promedio de lo que estimaron tus series. Así las cargas vuelven a ser alcanzables.
   - Al revés, si una serie estima un 1RM al menos 2,5 kg más alto que el tuyo, te ofrece subirlo.
   - En los dos casos decidís vos, y las cargas de las semanas siguientes se recalculan.
4. **La proyección al cierre se corrige:**
   - Compara tu 1RM estimado de las últimas 2 semanas con datos contra tu 1RM actual, y mueve la proyección en esa proporción.
   - Con 1 semana de datos pesa un tercio; desde 3 semanas, completo.
   - Hacer lo planeado no la cambia. Venir 10% abajo la baja ~10%; venir arriba la sube. El ajuste está limitado a ±20–25%.
   - Cuando está corregida, dice "con lo que llevás".

**La proyección base** (`proyeccion()`):
- Supone una mejora mensual que es menor cuanto más cerca estás de tu techo: ~4,5% al mes lejos de la referencia, ~1,9% cerca y ~0,6% muy por encima. Es una estimación conservadora.
- Los saltos mejoran más lento que la fuerza. La hipertrofia mejora poco los saltos.
- Después del primer ciclo, la tasa se mezcla mitad y mitad con lo que mejoraste de verdad en el ciclo anterior.

## Lo que todavía no tiene en cuenta

- La edad y el sexo más allá de las referencias de fuerza relativa.
- El deporte que practicás: hoy los enfoques son fuerza, hipertrofia, potencia y mixto.
- Los días concretos de la semana: no sabe si dos sesiones intensas caen en días seguidos.

## Referencias principales

- Haff GG, Triplett NT (eds.). *Essentials of Strength Training and Conditioning*, 4.ª ed. NSCA, Human Kinetics, 2016.
- Issurin VB. New horizons for the methodology and physiology of training periodization. *Sports Medicine*, 2010.
- Chu DA, Myer GD. *Plyometrics*. Human Kinetics, 2013.
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass. *Journal of Sports Sciences*, 2017.
- Zourdos MC et al. Novel resistance training–specific RPE scale measuring repetitions in reserve. *Journal of Strength and Conditioning Research*, 2016.
- Helms ER et al. Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training. *Strength and Conditioning Journal*, 2016.
- Suchomel TJ, Nimphius S, Stone MH. The importance of muscular strength in athletic performance. *Sports Medicine*, 2016.
- Seitz LB, Haff GG. Factors modulating post-activation potentiation of jump, sprint, throw, and upper-body ballistic performances: a systematic review with meta-analysis. *Sports Medicine*, 2016.
- van der Horst N et al. The preventive effect of the Nordic hamstring exercise on hamstring injuries in amateur soccer players. *American Journal of Sports Medicine*, 2015.
- Harøy J et al. The Adductor Strengthening Programme prevents groin problems among male football players. *British Journal of Sports Medicine*, 2019.
- Bell L et al. Integrating deloading into strength and physique sports training programmes: an international Delphi consensus approach. *Sports Medicine – Open*, 2023.

Las cifras concretas (referencias de fuerza, tasas de mejora, umbrales de 90% y 95%) son decisiones de diseño de Marea a partir de estos principios, no valores sacados de un estudio puntual. Se pueden calibrar con el uso.
