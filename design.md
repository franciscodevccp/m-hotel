# design.md — Sistema de diseño · M Motel

Este documento manda sobre cualquier instinto "por defecto". El objetivo es una sola cosa: que se vea como una marca real, cara y sensual — **nunca** como una demo genérica de IA.

---

## 1. Dirección estética

**Concepto: editorial nocturno.** Piensa en una revista de lujo adults-only (referencia mental: Casa Cook, fotografía editorial sobre fondo oscuro) cruzada con la discreción de un hotel boutique. Íntimo, cinematográfico, sofisticado, sensual sin ser vulgar.

Principios:
- **Oscuro y atmosférico**, no un dashboard negro plano. Capas, profundidad, grano sutil, viñeta, un brillo cálido detrás de los titulares.
- **Editorial**: tipografía grande con serif de alto contraste, mucho aire, asimetría, imágenes a sangre (full-bleed).
- **Restraint de lujo**: una paleta dominante (casi negro + un dorado champagne) con un acento sensual (oxblood/vino) usado con cuentagotas. Nada de arcoíris.
- **Discreción**: es un motel de paso. El tono transmite privacidad y elegancia, jamás algo morboso o chillón.
- **El motor de reserva se siente parte de la marca**, con la misma tipografía, color y espaciado que el resto del sitio.

Lo que alguien tiene que recordar al salir: *"se veía caro y de buen gusto"*.

---

## 2. Color (tokens)

Definir en `globals.css` como variables CSS y mapear a Tailwind. Usar tono cálido en los oscuros, no negros azulados (el azulado se ve frío y "tech genérico").

```css
:root {
  /* Fondos en capas */
  --bg:        #0B0A0C;  /* base, casi negro cálido */
  --surface:   #16141A;  /* superficies elevadas */
  --surface-2: #211C26;  /* tarjetas, modales */

  /* Líneas y bordes: SIEMPRE hairlines translúcidas, nunca grises sólidos */
  --line:      rgba(244, 241, 236, 0.08);
  --line-strong: rgba(244, 241, 236, 0.16);

  /* Texto: blanco cálido, NUNCA #FFFFFF puro */
  --text:      #F4F1EC;
  --text-muted:#A79F97;
  --text-dim:  #6F685F;

  /* Acento primario: dorado champagne */
  --gold:      #C9A24A;
  --gold-soft: #E4C77E;  /* highlights / degradado del acento */

  /* Acento sensual secundario (uso mínimo: categoría BLACK, glows, estados) */
  --wine:      #7A2233;

  /* Estados (versión apagada, elegante — no semáforos saturados) */
  --ok:        #7C9A6B;
  --busy:      #B25A4E;
  --clean:     #C9A24A;
  --maint:     #8A837D;
}
```

Reglas de color:
- Dorado = acento, no relleno. Va en líneas finas, subrayados, el CTA principal, números clave. Si todo brilla, nada brilla.
- Oxblood/vino con cuentagotas: glow en hover de tarjetas premium, badge de categoría BLACK, detalles. No lo conviertas en color principal.
- **Prohibido**: morado, índigo, azul eléctrico, turquesa, degradados arcoíris. Son el sello de la IA.
- Degradados permitidos solo si son oscuros y cálidos (negro → café muy oscuro, o radial de un dorado tenue al 6% de opacidad detrás de un titular).

---

## 3. Tipografía

Cargar con `next/font/google`. Emparejar un serif editorial con un grotesk refinado.

- **Display (titulares):** `Fraunces` — serif editorial de alto contraste, con carácter. Usar pesos 300–600, ejes opsz altos para los titulares grandes. Es el alma de la marca.
- **Texto / UI:** `Hanken Grotesk` — sans humanista, limpia y cálida. Pesos 400–600.
- **Cifras (precios, horas):** misma `Hanken Grotesk` con `font-variant-numeric: tabular-nums` para que los precios queden alineados. (Opcional: un mono discreto tipo `Geist Mono` solo para los chips de precio si se quiere un toque más "preciso"; si se usa, con moderación.)

```ts
// src/app/layout.tsx
import { Fraunces, Hanken_Grotesk } from "next/font/google";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const hanken   = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
```

Jerarquía (ejemplo, ajustable):
- Display XL (hero): Fraunces, `clamp(3rem, 8vw, 6.5rem)`, peso 300–400, `letter-spacing: -0.02em`, `line-height: 0.95`.
- H2 sección: Fraunces, `clamp(1.8rem, 4vw, 3rem)`.
- Labels / kicker: Hanken, mayúsculas, `0.75rem`, `letter-spacing: 0.22em`, color `--text-muted`. (Las "small caps espaciadas" son clave del look editorial.)
- Cuerpo: Hanken, `1rem–1.125rem`, `line-height: 1.6`, color `--text-muted` para párrafos largos y `--text` para lo importante.

**Prohibido**: Inter, Roboto, Arial, Helvetica, fuentes del sistema, y **Space Grotesk** (clichés de IA). No uses una sola fuente para todo.

---

## 4. Espaciado, grilla y forma

- Escala de espaciado generosa basada en múltiplos de 4/8. Las secciones respiran: padding vertical grande (`clamp(5rem, 12vh, 9rem)`).
- **Negative space como decisión activa.** Mejor un titular grande con mucho aire que rellenar.
- Grilla de 12 columnas con quiebres asimétricos (ej. contenido a 7 columnas alineado a la izquierda, imagen a 5 a la derecha desbordando el margen).
- **Radios pequeños**: 2–6px máximo. Nada de `rounded-2xl` por todos lados (eso grita IA). Algunos elementos pueden ir a 0px (cuadrado editorial).
- **Bordes**: hairlines de `--line`, de 1px. Líneas finas dividiendo secciones, estilo revista. Nada de cajas con borde grueso.
- **Sombras**: casi nulas. En un tema oscuro la jerarquía se logra con luminosidad de superficie (`--surface` vs `--surface-2`) y hairlines, no con drop-shadows. Si hay sombra, que sea profunda y suave para "levantar" un modal, no una sombrita gris flotante.

---

## 5. Composición y layout

- Hero a pantalla completa: imagen oscura a sangre (o fondo generado oscuro), viñeta, titular serif enorme alineado a un costado, un único CTA elegante ("Reservar"). Un kicker en small caps arriba ("Limache · Atención 24/7").
- Secciones tipo editorial: alterna texto/imagen, usa números grandes para las cifras (4.3★, 198 reseñas, 20 habitaciones, 24/7).
- Tarjetas de categoría: **altas**, formato retrato, imagen ocupando casi todo, abajo el nombre en serif, los m² en small caps y "desde $XX.000" con el dorado. Hover: zoom lento de la imagen + una línea dorada que se dibuja. Nada de tarjeta cuadrada con sombrita.
- Footer sobrio: dirección (Av. Palmira Romano Sur 196-A, Limache), WhatsApp, hairline dorada arriba.

---

## 6. Componentes clave (estilo)

- **Botón primario (CTA):** fondo dorado o borde dorado sobre oscuro, texto en mayúsculas espaciadas, sin bordes redondos exagerados (radius ~4px o pill fino y elegante), transición suave de fondo en hover. Un solo CTA primario por vista.
- **Botón secundario:** "ghost" con hairline `--line-strong`, texto claro.
- **Chip de duración (3h / 6h / 12h):** pieza central del booking. Recuadro con hairline; al seleccionar, borde y texto dorados + fondo `--surface-2`. Muestra duración y precio. **Usar chips, no selectores nativos tipo ruleta** (los spinners nativos se sienten baratos y se pelean con el mobile).
- **Toggle día (Entre semana / Fin de semana y festivos):** dos segmentos; el activo en dorado. Cambiar este toggle recalcula todos los precios.
- **Badge de categoría:** small caps; BLACK lleva el detalle oxblood.
- **Resumen de reserva (sticky):** panel lateral (o sheet inferior en mobile) que muestra categoría, día, bloque, hora estimada de término y total. Siempre visible durante el flujo.
- **Tablero de habitaciones (admin):** grilla de las 20 habitaciones como celdas; el estado se comunica con un punto/borde de color apagado + etiqueta, no con bloques saturados. Limpio, denso pero legible.
- **Tabla de caja (admin):** filas con hairlines, montos en tabular-nums alineados a la derecha, totales del turno destacados en dorado.

---

## 7. Movimiento

- **Carga de página orquestada**: un solo reveal escalonado (opacidad + `translateY(12px)` → 0), 600–900ms, `ease-out`, con `animation-delay` incremental entre elementos del hero. Esto da más clase que mil micro-animaciones sueltas.
- **Hover**: en tarjetas, zoom de imagen a `scale(1.03)` y línea dorada que aparece. Suave (250–400ms).
- **Transiciones de paso** en el booking: fade/slide corto entre pasos.
- **Scroll**: suave. Opcional, reveals al entrar en viewport (sutiles).
- Evitar: rebotes tipo "spring" en todo, animaciones rápidas y nerviosas, parpadeos. La marca es lenta y sensual, no hiperactiva.

---

## 8. Textura y atmósfera

- **Grano de película**: overlay con ruido SVG a baja opacidad (~3–5%) sobre el fondo. Da textura de fotografía analógica y mata el aspecto "plano digital".
- **Viñeta** radial oscura en los bordes del hero.
- **Glow cálido**: un radial muy tenue de `--gold-soft` (5–8% opacidad) detrás de titulares clave.
- Hairlines doradas como separadores ocasionales.

---

## 9. Imágenes y placeholders

Ya hay fotos reales de M. Se usan en el inicio; donde falte una foto específica por categoría, va un placeholder elegante "Imagen próximamente" (nunca una caja gris rota).

Archivos (dejar en `public/images/`):
- `hero.webp` — exterior nocturno con el letrero "M" y "ZONA BLACK". **Es el hero.** Va a sangre en la portada, con degradado oscuro de abajo→arriba + grano, para que el titular serif se lea encima. (Es de baja resolución; el tratamiento oscuro + grano lo disimula y queda intencional. En producción, pedir una toma en mayor resolución.)
- `experiencia-1.webp`, `experiencia-2.webp`, `experiencia-3.webp` — **separar el collage `imagenes.webp` en 3 imágenes individuales** (dos son habitaciones cálidas, la tercera es el jacuzzi con dos copas). Van en una sección "Experiencia M" tipo galería editorial. La del jacuzzi con copas es la mejor: úsala como pieza principal de esa sección.
- `habitacion.webp` — habitación con luz roja y jacuzzi. Imagen de apoyo en una sección, oscurecida un punto. No es la más pulida; no la pongas como protagonista.

Tratamiento de todas las fotos:
- Bajar exposición / oscurecer un punto y darles un grade cálido, para que conversen entre sí y con el fondo.
- Overlay oscuro + grano encima. Coherencia ante todo.
- Nada de stock brillante o diurno: si se ve alegre, no es M.

**Placeholder "Imagen próximamente"** (para las 4 tarjetas de categoría y detalles de habitación donde aún no hay foto):
- Superficie `--surface-2` con grano y un duotono/degradado oscuro muy sutil (con profundidad, NO gris plano).
- Hairline del color de acento (1px) alrededor.
- Al centro, un monograma "M" fino o una línea mínima, y debajo la etiqueta en small caps espaciadas "Imagen próximamente" en `--text-dim`.
- Mismo aspect ratio que tendrá la foto real (retrato 3:4 en las tarjetas), para que el layout no salte al reemplazarla.
- Debe verse como una placa "coming soon" de lookbook de moda: intencional y elegante, jamás una caja de imagen rota.

---

## 10. LISTA NEGRA — cero estética de IA

Si aparece cualquiera de estas, está mal y se rehace:
- Degradados morado→azul / índigo (el tell #1 de la IA).
- Inter / Roboto / Arial / fuentes del sistema / Space Grotesk.
- Blanco puro `#FFFFFF` como texto sobre negro (usar `--text` cálido).
- Tarjetas muy redondeadas con sombra suave "flotando" en grilla.
- Todo centrado en una sola columna con un "blob" de degradado de fondo.
- Emojis en la UI.
- Copy genérico: "Bienvenido a…", "Tu solución todo en uno", "Reserva fácil, rápida y segura", signos de exclamación por todos lados.
- Paleta multicolor sin jerarquía.
- El look por defecto de shadcn sin tocar.
- Iconos por todos lados rellenando espacio. Mejor tipografía y aire.

---

## 11. Tono de copy (español de Chile)

Adulto, elegante, breve, discreto. Habla de privacidad, comodidad, momentos, escapada. Nunca morboso ni publicitario barato.

Bien:
- Kicker hero: "Limache · Atención 24/7"
- Hero: "Un espacio íntimo, pensado para ustedes dos."
- CTA: "Reservar" / "Ver disponibilidad"
- Categoría: "Categoría BLACK — 29 m²" · "Desde $55.000"
- Confirmación: "Tu reserva está lista. Te confirmamos por WhatsApp."

Evitar:
- "¡Bienvenido a M Motel, la mejor experiencia de tu vida!"
- "Reserva fácil, rápida y segura 🔥"
- Cualquier cosa con tono de aviso de clasificados.

---

## 12. Accesibilidad mínima

- Contraste suficiente del texto sobre los fondos oscuros (cuidar `--text-muted` en cuerpos largos).
- Estados de foco visibles (anillo dorado fino), no eliminarlos.
- Targets táctiles cómodos en mobile (los chips y botones, ≥44px de alto).
- Mobile-first: el flujo de reserva tiene que ser impecable en celular (la mayoría del tráfico de un motel entra por el teléfono).
