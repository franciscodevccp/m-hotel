# Spec 1 — Correcciones del núcleo (Fase 0)

> Prerrequisito de todo lo demás. Toca `src/types/index.ts`, `src/lib/store.tsx`,
> `src/lib/cash.ts`, caja, cortes, login, nav, sexshop y checkout.
> Al terminar: subir `STORAGE_KEY` a `"m-motel-state-v13"`.

---

## §1. Modelo de caja coherente (real / deber)

**Problema actual:** cada operación del sistema suma solo a `real` y `expected` nunca se
mueve. Resultado: registrar un pago durante la demo altera el descuadre sembrado (folio
1477: tarjeta −$85.000), que es el argumento central de venta.

**Modelo correcto para la maqueta:** lo que el sistema registra es lo que *debería* haber
(deber) y, mientras el turno está abierto, se asume que también está (real). La diferencia
nace en el **arqueo del cierre**, cuando se cuenta lo físico.

**Cambios en `src/lib/store.tsx`** — toda operación que hoy hace
`real: prev.shift[line].real + monto` pasa a sumar a **ambas** líneas:

```ts
function addToLine(line: CashLine, amount: number): CashLine {
  return { real: line.real + amount, expected: line.expected + amount };
}
```

Aplicar en: `addTransaction`, `checkOut` (cuando cobra), `sellProduct` (canal presencial),
`sellPackage`, `deliverRoomServiceOrder`, `markReceivablePaid`, `addExpense` (línea
`expenses`).

**Invariante a verificar:** con el seed intacto, `cashDiff = +2.000` y `cardDiff = −85.000`;
tras registrar cualquier combinación de pagos/ventas/gastos, esos diffs **no cambian**.
Solo el arqueo del cierre (§2) los modifica.

No tocar `src/data/shifts.ts`: el seed del folio 1477 queda tal cual.

## §2. Cierre de turno real + cortes archivados

**Problema actual:** "Confirmar cierre" solo cierra el modal. La página Cortes promete un
archivo que no existe.

### Tipos (`src/types/index.ts`)

```ts
import type { ShiftItem } from "@/lib/cash"; // o redeclarar la forma aquí

/** Corte cerrado y archivado, con snapshot de su detalle. */
export interface ClosedShift extends Shift {
  closedAt: string;            // ISO
  countedCash: number;         // efectivo contado en el arqueo
  countedCard: number;         // comprobantes de tarjeta contados
  transactions: Transaction[]; // snapshot de los pagos del turno
  expenses: Expense[];         // snapshot de los gastos del turno
  items: ShiftItem[];          // artículos vendidos (snapshot del ticket)
}
```

Nota: si importar `ShiftItem` desde `lib/cash` genera ciclo, mover la interfaz `ShiftItem`
a `src/types/index.ts` y reexportarla desde `lib/cash`.

### Estado y acción en el store

- Nuevo slice: `pastShifts: ClosedShift[]` (seed inicial: `[]`).
- Nueva acción:

```ts
closeShift: (counted: { cash: number; card: number }, nextOpeningCash: number, user?: string) => void;
```

Comportamiento:
1. Calcula `items = shiftItems(movements, products, shift.id)` (ya **sin** filtro de
   categoría — ver §3).
2. Construye el `ClosedShift`: shift actual + `closedAt: now` + `countedCash/countedCard`
   + **`cash.real = counted.cash` y `card.real = counted.card`** (el real definitivo es lo
   contado; el expected queda como lo acumuló el sistema) + snapshots de `transactions` y
   `expenses` actuales + `items`.
3. `pastShifts: [closed, ...prev.pastShifts]`.
4. Abre turno nuevo: `folio: shift.folio + 1`, `id: makeId("s")`, `openedAt: now`,
   `user: user ?? prev.shift.user`, `openingCash: nextOpeningCash`,
   `cash/card/expenses: { real: 0, expected: 0 }`, `tipsCash/tipsCard: 0`,
   `branchId: "limache"`.
5. Vacía `transactions: []` y `expenses: []` (quedaron en el snapshot). Los `movements` NO
   se tocan (filtran por `refId` del turno).
6. Registra auditoría (§5): tipo `estado`, acción "Cerró el turno", target
   `Folio ${folio} · dif. efectivo ${formatCLP(...)} · dif. tarjeta ${formatCLP(...)}`.

### UI — modal "Cerrar turno" en `/admin/caja`

Reemplazar el modal actual por un **arqueo**:
- Resumen arriba: lo que el sistema espera (`cash.expected`, `card.expected`) en filas
  `Row` como las actuales.
- Dos `MoneyInput`: **"Efectivo contado"** (default `shift.cash.expected`) y
  **"Comprobantes tarjeta"** (default `shift.card.expected`). Para la demo del descuadre,
  el usuario edita estos valores y la **diferencia se recalcula en vivo** bajo cada input
  (verde cuadrado / rojo falta / dorado sobra — reutilizar la lógica de colores de
  `ShiftSummary`).
- `MoneyInput` **"Caja inicial del próximo turno"** (default `15.000`).
- Botón "Confirmar cierre" → `closeShift(...)` → toast/estado de éxito → modal muestra
  "Turno cerrado. Folio ${nuevo} abierto." con botón "Ver cortes" (link a /admin/cortes).

### UI — página `/admin/cortes`

- Arriba: el turno **en curso** (ShiftSummary + CorteTicket como hoy).
- Abajo: **"Cortes anteriores"** — lista de `pastShifts` (folio, fecha cierre, responsable,
  ingresos, diferencias con color). Click → `Modal` con el `CorteTicket` del corte usando
  sus snapshots (pasar `shift={closed}` e `items={closed.items}`; el componente ya es puro).
- Si `pastShifts` está vacío: empty state "Aún no hay cortes archivados. Al cerrar un turno
  queda guardado aquí."

## §3. Ticket de corte completo (carta + sexshop)

En `/admin/caja/page.tsx` y `/admin/cortes/page.tsx`, el `useMemo` de items filtra
`products.filter((p) => p.category === "carta")`. **Quitar el filtro**: pasar `products`
completo. El argumento de venta es "inventario único multicanal entrando al mismo corte";
los seeds del turno (m-001, m-002, m-005) son ventas de sexshop en recepción y DEBEN
aparecer en el ticket. Borrar los comentarios "el sexshop se habilita luego".

## §4. Multi-sucursal (arquitectura visible, sin sobre-construir)

Es la promesa "la base nace preparada desde el día uno". En la maqueta se demuestra así:

1. **Tipo y seed**:
```ts
export interface Branch { id: string; name: string; address: string; active: boolean; }
// src/data/branches.ts
export const SEED_BRANCHES: Branch[] = [
  { id: "limache", name: "M Motel Limache", address: "Av. Palmira Romano Sur 196-A, Limache", active: true },
];
```
   Slice `branches: Branch[]` en el store.
2. **`branchId?: string`** agregado a: `Shift`, `Transaction`, `Reservation`, `Room`,
   `Purchase`, `ShopOrder`, `Expense` y a todos los tipos nuevos de spec-2/3. Seeds nuevos
   lo pueblan con `"limache"`; los existentes pueden quedar sin él (campo opcional) — no
   reescribir todos los seeds v1.
3. **UI mínima**:
   - `Configuración` → nueva `Section` "Sucursales": lista `branches` (nombre, dirección,
     kicker "Activa") + texto: *"El sistema está preparado para operar múltiples sucursales
     con administración consolidada. Las sucursales adicionales se habilitan al abrir un
     nuevo recinto."* + botón secundario deshabilitado "Agregar sucursal".
   - `Gerencia` (spec-3) → `Select` de sucursal con la única opción "M Motel Limache".
   - Nada más. No construir vistas consolidadas.

## §5. Auditoría viva (transversal)

**Problema actual:** el log es solo seed; las acciones reales no dejan rastro.

### Mecanismo

En el store, helper interno (no expuesto) usado dentro de cada acción:

```ts
function auditEntry(
  type: AuditType, action: string, module: string,
  target?: string, actor?: Actor,
): AuditEntry {
  return {
    id: makeId("au"), type, action, module, target,
    at: new Date().toISOString(),
    userName: actor?.name ?? "Sistema",
    userRole: actor?.role ?? "recepcion",
  };
}
export interface Actor { name: string; role: Role; } // en src/types
```

Las acciones del store ganan un parámetro final opcional `actor?: Actor`. Las páginas lo
construyen desde `useSession`: `const actor = user ? { name: user.name, role: user.role } : undefined;`
y lo pasan en cada llamada. Donde hoy se pasa `userLabel: string`, mantenerlo para los
campos `user` existentes y AGREGAR `actor` para auditoría (no romper firmas: añadir al
final).

### Acciones a instrumentar (mínimo)

| Acción | type | módulo | ejemplo de target |
|---|---|---|---|
| checkIn | estado | Habitaciones | "Habitación 304 · 6h" |
| checkOut | estado | Habitaciones | "Habitación 304 · cobro $90.000 tarjeta" |
| moveRoom | estado | Habitaciones | "201 → 202" |
| setRoomStatus | estado | Habitaciones | "Habitación 107 → Mantención" |
| addTransaction | crear | Caja | "Efectivo · $45.000 · Hab. 203" |
| addExpense | crear | Caja | "Insumos · $12.000" |
| sellProduct / sellPackage | crear | Caja | "2× Corona (330 ml) · $6.000" |
| deliverRoomServiceOrder | estado | Room service | "Habitación 201 · $10.500" |
| markReceivablePaid | estado | Cuentas | "Empresa Aguas Claras · $95.000" |
| addReservation | crear | Reservas | "Jacuzzi Premium · {nombre}" |
| finishCleaning | estado | Limpieza | "Habitación 204 · 22 min" |
| reportMaintenance | estado | Limpieza | "Habitación 105" |
| addAnomaly / resolveAnomaly | crear/estado | Anomalías | descripción corta |
| updateCategory | editar | Precios | "Categoría BLACK" |
| updateProduct / addProduct / adjustStock | editar/crear | Inventario | nombre + delta |
| addPurchase | crear | Inventario | "Proveedor · $93.600" |
| advanceShopOrder / cancelShopOrder | estado | Tienda online | "#1052 → Preparando" |
| closeShift | estado | Caja | "Folio 1477 · dif…" |
| login (en `login/page.tsx`, vía acción `logAccess`) | acceso | Acceso | roleLabel |
| Traspasos / solicitudes / conteos (spec-2) | crear/estado | Bodegas | ver spec-2 |

Mantener el seed `SEED_AUDIT` (da historia); las entradas nuevas se anteponen.

## §6. Rol Dueño (solo lectura)

1. **Tipo**: `Role` suma `"dueno"`.
2. **Sesión** (`src/lib/session.tsx`):
```ts
dueno: { role: "dueno", name: "Rodrigo", roleLabel: "Dueño", context: "Solo lectura" },
```
   (Usar el nombre real del dueño es deliberado: efecto demo.)
3. **Login** (`/admin/login`): agregar segmento "Dueño" (orden: Recepción, Admin, Dueño,
   Encargado, Aseo — si 5 segmentos aprietan en mobile, permitir `overflow-x-auto`).
   Perfil: user `dueno` / pass `demo1234`, desc: "Vista gerencial de solo lectura: ventas,
   ocupación, cortes, personal y auditoría." `HOME.dueno = "/admin/gerencia"`.
4. **Navegación** (`AdminNav`): grupos para dueño:
   - "Gerencia": Gerencia (`/admin/gerencia`), Reportes, Cortes de caja
   - "Operación": Habitaciones (vista), Personal (`/admin/personal`)
   - "Control": Auditoría
5. **Solo lectura**: en `useSession` exponer derivado `readOnly = user?.role === "dueno"`.
   - Páginas que el dueño ve: ocultar todo botón mutador cuando `readOnly` (en
     Habitaciones, el modal de pieza muestra solo la info de estado/estancia, sin acciones).
   - Las páginas con guard `AdminOnly` o `role !== "admin"` deben **permitir también
     `dueno`** en: Reportes, Cortes, Auditoría, Gerencia, Personal (ajustar los guards:
     crear helper `canView(user, ...roles)` o extender las condiciones existentes).
   - El dueño NO ve: Caja, Configuración, Precios (edición), Inventario, Tienda admin.

## §7. Gate +18 en /sexshop

- Componente `AgeGate` (client) montado en `src/app/(public)/sexshop/page.tsx`.
- Lógica: si `shopSettings.ageNotice === true` y `sessionStorage["m-motel-age-ok"] !== "1"`,
  overlay a pantalla completa (mismo patrón visual del `WelcomeModal`: fondo
  `bg-bg/85 backdrop-blur-sm`, card `border-line-strong bg-surface-2`):
  - kicker "Sexshop · M", título display "Contenido para mayores de 18 años", texto breve
    sobre discreción.
  - Botón primario "Soy mayor de 18" → setea sessionStorage y cierra.
  - Botón ghost "Salir" → `router.push("/")`.
- `sessionStorage` (no localStorage) a propósito: en cada sesión nueva de demo el gate
  vuelve a aparecer.
- Si `ageNotice` está desactivado en Configuración de tienda, el gate no se muestra (esto
  permite demostrar el toggle en vivo).

## §8. Cupones en el checkout público

En `FloatingCart` (vista `checkout`):

1. Campo "Cupón de descuento (opcional)": input + botón secundario "Aplicar".
2. Validación contra `coupons` del store:
   - no existe / inactivo → "El cupón no es válido."
   - `subtotal < minPurchase` → "Este cupón requiere una compra mínima de {formatCLP}."
   - válido → estado `appliedCoupon` y línea verde/dorada "Cupón {code}: −{descuento}" con
     opción "Quitar".
3. Cálculo de `discount`:
   - `porcentaje` → `Math.round(subtotal * value / 100)`
   - `monto` → `Math.min(value, subtotal)`
   - `envio_gratis` → `discount = 0` pero `shipping = 0` (mostrar "Envío: Gratis · cupón")
4. `total = subtotal + shipping − discount` (recalcular el shipping del envío gratis ANTES).
5. `placeOrder` incluye `discount` y `couponCode`, y llama
   `updateCoupon({ ...c, uses: c.uses + 1 })`.
6. Probar con los seeds reales: BIENVENIDA10 (10%), ENVIOGRATIS (mín. $25.000), VERANO15
   (15%, mín. $30.000), M5000 (inactivo → debe rechazarse).

## Criterios de "listo" (Fase 0)

- [ ] Diffs del folio 1477 inmutables ante operaciones del sistema.
- [ ] `closeShift` archiva, abre folio 1478 y limpia transacciones/gastos activos.
- [ ] Cortes lista archivados y abre su ticket con snapshots.
- [ ] Ticket itemiza carta + sexshop.
- [ ] `branchId` en tipos indicados; Configuración muestra Sucursales.
- [ ] Login con 5 perfiles; dueño "Rodrigo" aterriza en /admin/gerencia (placeholder hasta
      spec-3: crear la ruta con un "En construcción" temporal si spec-3 no se ha ejecutado).
- [ ] Acciones de la tabla §5 generan entradas de auditoría visibles con usuario y rol.
- [ ] Gate +18 operativo y respetando el toggle.
- [ ] Cupones aplican, descuentan y suman usos.
- [ ] `pnpm build` limpio. Flujo Valentina intacto.
