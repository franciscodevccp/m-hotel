# structure.md — Estructura del proyecto · M Motel

Next.js 15 App Router con `src/`. Route groups para separar el sitio público del panel admin. Colocación: lo específico de una ruta vive junto a ella; lo compartido vive en `components/`, `lib/`, `data/`.

```
m-motel-demo/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # layout raíz: fuentes, <html>, grano/overlay global
│   │   ├── globals.css             # tokens de diseño (variables CSS) + base Tailwind v4
│   │   │
│   │   ├── (public)/               # route group: sitio público (no afecta la URL)
│   │   │   ├── layout.tsx          # header/footer público
│   │   │   ├── page.tsx            # Landing (/)
│   │   │   ├── reservar/
│   │   │   │   ├── page.tsx        # Flujo de reserva (/reservar)
│   │   │   │   └── _components/    # piezas solo del flujo (stepper, chips, resumen)
│   │   │   └── reserva/
│   │   │       └── confirmada/
│   │   │           └── page.tsx    # Confirmación (/reserva/confirmada)
│   │   │
│   │   └── (admin)/                # route group: panel admin
│   │       └── admin/
│   │           ├── layout.tsx      # shell del admin (sidebar/topbar)
│   │           ├── page.tsx        # Dashboard (/admin)
│   │           ├── login/page.tsx  # Login mock (/admin/login)
│   │           ├── habitaciones/page.tsx
│   │           ├── caja/page.tsx
│   │           ├── reservas/page.tsx
│   │           └── reportes/page.tsx   # opcional
│   │
│   ├── components/                 # compartido entre rutas
│   │   ├── ui/                     # primitivos: Button, Chip, Badge, SegmentedToggle, Stat
│   │   ├── public/                 # Hero, CategoryCard, ServiceList, SiteHeader, SiteFooter
│   │   └── admin/                  # RoomBoard, RoomCell, CashTable, ShiftSummary, AdminNav
│   │
│   ├── lib/
│   │   ├── pricing.ts              # ÚNICA fuente de verdad de tarifas y reglas de día
│   │   ├── format.ts               # formato CLP, fechas, horas
│   │   └── whatsapp.ts             # arma el link wa.me con el detalle de la reserva
│   │
│   ├── data/                       # datos mock (sin DB)
│   │   ├── categories.ts           # las 4 categorías + precios reales
│   │   ├── rooms.ts                # las 20 habitaciones + estados
│   │   ├── reservations.ts         # reservas de ejemplo
│   │   └── shifts.ts               # transacciones + turno con descuadre demo
│   │
│   ├── types/
│   │   └── index.ts                # tipos compartidos (ver scope.md)
│   │
│   └── hooks/                      # si hace falta (ej. useReservationFlow)
│
├── public/
│   ├── fonts/                      # solo si se usan fuentes locales (por defecto van por next/font)
│   └── images/                     # placeholders oscuros si se ocupan
│
├── CLAUDE.md
├── design.md
├── scope.md
├── structure.md
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Convenciones

- **Server Components por defecto.** `"use client"` solo donde hay interactividad real: el flujo de reserva, el tablero de habitaciones, la caja, los toggles. Las páginas estáticas (landing, secciones) idealmente quedan como Server Components.
- **Colocación**: componentes que solo usa una ruta van en su `_components/` (la `_` evita que se interprete como segmento de ruta). Lo reutilizable sube a `src/components/`.
- **Estado de la demo**: el flujo de reserva puede manejarse con estado local + Context si se comparte entre pasos. Para "recordar" entre recargas se permite `localStorage` (es una app real local, no un artifact). Sin servidor.
- **Naming**: componentes en `PascalCase.tsx`, utilidades y datos en `camelCase.ts`. Rutas en minúscula/kebab (`/reservar`, `/admin/caja`).
- **Tarifas**: cualquier precio que se muestre sale de `lib/pricing.ts` leyendo `data/categories.ts`. Nunca hardcodear un precio suelto en un componente.
- **Tailwind v4**: los tokens de color/tipografía se definen como variables CSS en `globals.css` y se exponen al tema con `@theme inline`. Usar las variables (`bg-[var(--surface)]` o utilidades del tema), no hex sueltos en el markup.
- **Tipos**: importar siempre desde `@/types`. El alias `@/*` apunta a `src/*`.

## Orden de construcción sugerido

1. `globals.css` (tokens) + `layout.tsx` (fuentes + grano) → que el esqueleto ya "sea M".
2. `lib/pricing.ts` + `data/` → la lógica y los datos antes que las vistas.
3. `(public)`: landing → flujo de reserva → confirmación.
4. `(admin)`: login → dashboard → habitaciones → caja → reservas → (reportes).
5. Pasada final de pulido visual contra `design.md` (grano, hover, reveals, mobile).
