# CLAUDE.md — M Motel · Maqueta de venta

> Este archivo es el punto de entrada. Léelo completo antes de tocar código.
> Detalles en: `design.md` (diseño), `scope.md` (alcance + datos + modelo) y `structure.md` (estructura de carpetas).

## Qué es esto

Maqueta (demo) **de venta** de un sistema para **M Motel**, un motel de paso para parejas en Limache, Chile. NO es producción. Es una demo navegable para mostrarle al cliente (Rodrigo, de Inversiones M) cómo se vería y operaría su futuro sistema.

El cliente hoy:
- Ya opera con un software de gestión interno (de un tercero) que le funciona.
- Su hoyo real es **no tener reserva online**: hoy reserva solo por WhatsApp y teléfono.
- Le duele el **descuadre de caja**: tiene reseñas malas por cobros dobles / cobros de menos.

Por eso esta demo vende dos cosas:
1. **Reserva online 24/7** de cara al cliente (lo que no tiene).
2. Un **panel admin** con tablero de habitaciones y control de caja/turnos (refuerza el gancho de los cobros).

## Objetivo de la maqueta

Que al verla, el cliente diga "esto lo quiero". Tiene que verse **cara, discreta y a medida de M Motel**, no un sistema genérico. La calidad visual es el 80% del valor de esta demo: si parece plantilla, perdimos.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** (v4, configuración CSS-first en `globals.css`)
- **React state** para todo (sin backend)
- `next/font/google` para tipografías
- Animaciones: CSS + (opcional) `motion` si se instala

**Sin base de datos. Sin backend real. Sin pasarela de pago real. Sin auth real.**

## Comandos

```bash
pnpm dev     # desarrollo
pnpm build   # build de producción (debe pasar sin errores ni warnings de tipos)
pnpm lint    # lint
```

**Gestor de paquetes: siempre `pnpm`.** Nunca `npm` ni `yarn`, ni en comandos ni en
documentación. Si un documento del proyecto menciona `npm`, corrígelo a `pnpm`.

## Reglas críticas (no negociables)

1. **Cero base de datos y cero API real.** Todos los datos salen de archivos mock en `src/data/` (ver `scope.md`). El estado de la sesión vive en React (Context o estado local). Se permite `localStorage` solo para que la demo "recuerde" cosas entre recargas; nunca como excusa para inventar un backend.
2. **Cero estética de IA.** Esta es la regla más importante. Seguir `design.md` al pie de la letra: nada de degradados morados/azules, nada de Inter/Roboto/Arial/Space Grotesk, nada de tarjetas redonditas flotando con sombra suave, nada de emojis en la UI, nada de "Bienvenido a tu solución todo en uno". Si dudas si algo se ve genérico, se ve genérico: rehazlo.
3. **Todo el copy de la UI en español neutro**, tono adulto, elegante y discreto. Sin signos de exclamación gritones, sin tono publicitario barato, sin modismos regionales (se conservan solo los términos locales propios del negocio: RUT, CLP, boleta). Ver ejemplos en `design.md`.
4. **No inventes features.** El alcance está cerrado en `scope.md`. Si falta algo, déjalo como placeholder visual coherente, no improvises módulos nuevos.
5. **Datos reales de M Motel.** Las 5 categorías, sus 21 habitaciones numeradas (1 a 21) y sus precios por bloque de horas son datos reales (en `scope.md`). Úsalos tal cual, no los inventes.
6. **El booking debe sentirse nativo a la marca.** El flujo de reserva usa la misma paleta, tipografía y espaciado que el resto. Nada de motor de reservas "pegado" con otro estilo.

## Convenciones de código

- Server Components por defecto. `"use client"` solo en componentes con interactividad (flujo de reserva, tablero admin, toggles).
- Componentes reutilizables en `src/components/`; lógica/datos en `src/lib/` y `src/data/`. Ver `structure.md`.
- Tipos compartidos en `src/types/`.
- Precios y reglas de tarifa centralizados en `src/lib/pricing.ts` (única fuente de verdad).
- Formatear montos en CLP con separador de miles (`$45.000`), nunca decimales.

## Cómo trabajar este proyecto

Construye en este orden y muéstrame avances:
1. Tokens de diseño (`globals.css`) + tipografías + layout base. Que el "esqueleto" ya se vea M antes de meter contenido.
2. Landing pública.
3. Flujo de reserva completo (categoría → día → bloque → datos → resumen → confirmación).
4. Panel admin (login mock → dashboard → habitaciones → caja/turnos → reservas).

Antes de dar algo por listo, pregúntate: ¿esto se ve como una marca premium real, o como una demo de IA? Solo lo primero es aceptable.
