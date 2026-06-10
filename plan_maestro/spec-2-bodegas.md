# Spec 2 — Bodegas, traspasos e inventario ampliado (Fases 1–2)

> El módulo protagonista de la segunda demo. Cita textual del correo de Ivon:
> *"Necesitamos que exista un sistema de traspasos digitales entre ambas bodegas, de manera
> que quede registro de quién solicita, quién entrega, qué productos se trasladan y cuáles
> son los saldos actualizados. Idealmente los jefes de turno deberían poder solicitar
> reposiciones desde recepción mediante la plataforma."*
> Eso, palabra por palabra, es lo que esta spec construye.

Prerrequisito: spec-1 **y spec-1b** ejecutadas (auditoría viva, branchId, storage v13,
catálogo real cargado).

> **Enmiendas por spec-1b (catálogo real).** Esta spec se escribió contra el catálogo
> ficticio v1; con el inventario real cargado cambian estos puntos (detalle en
> spec-1b §7):
> 1. §A1: `centralStock` ya viene sembrado por spec-1b §5 — NO poblarlo con fórmulas
>    sobre `sx()`/`rs()` (esos helpers ya no existen).
> 2. §A4: los ítems de tr-100–103 usan SKUs reales; tr-103 = 24× Cerveza Royal Guard
>    355 cc, 24× Agua mineral con gas 350 cc, 12× Preservativos variedades (verificados
>    como entregables con el stock central sembrado).
> 3. §B1: NO sembrar la lista inventada de insumos; los insumos reales ya están
>    cargados en 3 grupos (Aseo, Operativos, Lavandería). De §B1 sobrevive solo la UI
>    (toggle, columna de costo, valorización por `cost`).
> 4. §B2: el conteo seed usa SKUs reales (−2 Cerveza Royal Guard, −1 Agua mineral con
>    gas, bodega recepción).
> 5. §B3: `PRODUCT_SALES_30D` con claves `p-{códigoDeBarras}`; los 8 productos de bajo
>    movimiento nombrados existen todos en el inventario real.

---

## §A. Bodegas, traspasos y solicitudes de reposición

### A1. Modelo de stock por bodega

Decisión de diseño (para NO romper lo existente): el campo `Product.stock` actual pasa a
significar **stock en bodega de recepción** (el operativo, del que salen las ventas — que
es exactamente como opera M Motel). Se agrega la bodega central como campo nuevo.

```ts
// src/types/index.ts
export interface Warehouse { id: string; name: string; locked: boolean; }

// En Product, agregar:
centralStock?: number; // unidades en bodega central (bajo llave). undefined = 0
```

```ts
// src/data/warehouses.ts
export const WAREHOUSES: Warehouse[] = [
  { id: "recepcion", name: "Bodega de recepción", locked: false },
  { id: "central", name: "Bodega central", locked: true },
];
```

- Helper en `src/lib/inventory.ts` (nuevo): `centralOf(p) => p.centralStock ?? 0`,
  `totalOf(p) => p.stock + centralOf(p)`.
- **Seeds**: en `src/data/products.ts`, poblar `centralStock` determinístico en `sx()` y
  `rs()`: sexshop `((sxN * 11) % 30) + 6`, carta `((rsN * 9) % 60) + 15`. Dejar 2–3
  productos con `centralStock` bajo a propósito (para mostrar que la alerta de central
  también existe).
- Las **ventas siguen descontando `stock`** (recepción) — sin cambios en `sellProduct`,
  `sellPackage`, `deliverRoomServiceOrder`.
- `addPurchase` cambia: las compras a proveedor ahora **ingresan a bodega central** por
  defecto (`centralStock += qty`). Agregar al formulario de `/admin/compras` un `Select`
  "Bodega de destino" (default "Bodega central") por si quieren ingresar directo a
  recepción. El movimiento de inventario registra a qué bodega entró (ver A3).

### A2. Traspasos y solicitudes (un solo modelo)

Una **solicitud de reposición** ES un traspaso en estado `solicitado` creado desde
recepción. Un **traspaso directo** del encargado nace y se entrega en el acto. Mismo tipo,
mismo historial, misma auditoría:

```ts
export type TransferStatus = "solicitado" | "entregado" | "recibido" | "rechazado";

export interface TransferItem { productId: string; quantity: number; }

export interface Transfer {
  id: string;
  from: string;              // warehouseId origen (central, normalmente)
  to: string;                // warehouseId destino (recepcion, normalmente)
  items: TransferItem[];
  status: TransferStatus;
  requestedBy: string;       // quién solicita (jefe de turno)
  deliveredBy?: string;      // quién entrega (encargado/admin)
  receivedBy?: string;       // quién confirma recepción
  note?: string;
  createdAt: string;         // ISO
  deliveredAt?: string;
  receivedAt?: string;
  branchId?: string;
}
```

Flujo de estados y semántica (los TRES responsables que pidió Ivon):
1. `solicitado` — recepción pide. Aún no se mueve stock.
2. `entregado` — encargado/admin entrega: **aquí se mueve el stock** (origen − / destino +)
   y se generan los movimientos de inventario. Si el origen no tiene saldo suficiente para
   una línea, la acción recorta la cantidad al saldo disponible y lo deja anotado en `note`
   (regla simple de maqueta; en producción sería validación dura).
3. `recibido` — recepción confirma conformidad. No mueve stock; cierra el ciclo con el
   tercer responsable.
4. `rechazado` — el encargado rechaza con nota. No mueve stock.

### A3. Store

Slice nuevo: `transfers: Transfer[]` + `warehouses: Warehouse[]` (seed). Acciones:

```ts
/** Recepción solicita reposición (central → recepción). */
requestTransfer: (items: TransferItem[], requestedBy: string, note?: string, actor?: Actor) => void;
/** Encargado/Admin crea un traspaso directo ya entregado (cualquier dirección). */
createDirectTransfer: (from: string, to: string, items: TransferItem[], deliveredBy: string, actor?: Actor) => void;
/** Entrega una solicitud pendiente: mueve stock y registra movimientos. */
deliverTransfer: (id: string, deliveredBy: string, actor?: Actor) => void;
/** Recepción confirma que recibió conforme. */
receiveTransfer: (id: string, receivedBy: string, actor?: Actor) => void;
/** Rechaza una solicitud con motivo. */
rejectTransfer: (id: string, by: string, note?: string, actor?: Actor) => void;
```

Movimientos de inventario del traspaso: agregar a `MovementType` el valor `"traspaso"`.
Por cada ítem entregado, UN movimiento `{ type: "traspaso", quantity: +q, refId: transfer.id }`.
En las vistas de movimientos, etiquetarlo "Traspaso {origen} → {destino}" resolviendo el
transfer por `refId` (extender `MOVEMENT_LABELS` y el render del modal de movimientos en
`/admin/inventario`).

Auditoría (obligatoria, spec-1 §5): crear solicitud (`crear`, módulo "Bodegas"), entregar
(`estado`, target "Solicitud {id} · N productos · central → recepción"), recibir, rechazar,
traspaso directo, ingreso de compra con bodega destino.

### A4. Seeds de traspasos (`src/data/transfers.ts`)

Para que la pantalla nazca con vida y la demo tenga una solicitud lista para aprobar:

- `tr-103` — `solicitado` HOY (2026-06-09T19:30): pedido por "Recepción turno noche",
  3 ítems reales con poco stock en recepción (ej.: Caja preservativos Sensor Plus ×12,
  Corona (330 ml) ×24, Agua embotellada ×24). **Esta es la que se aprueba en vivo.**
- `tr-102` — `recibido` ayer: ciclo completo (pidió Recepción turno día, entregó
  "Encargado de inventario", recibió Recepción), 2–3 ítems.
- `tr-101` — `entregado` hace 2 días, aún sin confirmar recepción (muestra el estado
  intermedio).
- `tr-100` — `rechazado` hace 3 días con nota "Stock central insuficiente, se repone con
  la compra del viernes".

Fechas absolutas. IMPORTANTE: los saldos sembrados de `stock`/`centralStock` deben ser
coherentes con estos traspasos ya ocurridos (no hace falta cuadratura perfecta histórica,
pero sí que la solicitud pendiente tr-103 SEA entregable con el `centralStock` sembrado).

### A5. Página `/admin/bodegas`

Nueva entrada en `AdminNav`, grupo **Inventario** → "Bodegas y traspasos"
(roles: `STAFF` recepción/admin/encargado; aseo no).

Estructura (patrones visuales existentes — stats cards, `SegmentedToggle`, listas
`border border-line bg-surface/40`):

- **Header**: kicker "Inventario", h1 "Bodegas y traspasos", bajada corta. Botón primario
  según rol: Recepción → "Solicitar reposición"; Encargado/Admin → "Nuevo traspaso".
- **Stats** (4): Solicitudes pendientes (tono dorado si >0) · Por confirmar recepción ·
  Traspasos del mes · Productos críticos en recepción (stock ≤ umbral, tono busy si >0).
- **Toggle** de 3 tabs: `Saldos` | `Traspasos` | `Conteos` (conteos en §B).

**Tab Saldos**: tabla de productos (buscador + filtro de familia como en Inventario) con
columnas: Producto · Recepción (`tnum`, en `text-busy` si ≤ umbral) · Central · Total ·
acción "Reponer →" (prellena el modal de solicitud con ese producto). Mostrar TODAS las
familias (carta, sexshop, insumos).

**Tab Traspasos**: lista ordenada por estado (solicitado primero) y fecha desc. Cada fila:
estado en kicker con color (`solicitado` → text-clean, `entregado` → text-gold, `recibido`
→ text-ok, `rechazado` → text-dim), ítems resumidos ("12× Preservativos · 24× Corona…"),
"Pidió {requestedBy}" / "Entregó {deliveredBy}" / "Recibió {receivedBy}" según existan,
fecha. Acciones contextuales por rol:
  - `solicitado` + (encargado|admin) → botones "Entregar" y "Rechazar" (rechazo pide nota
    en un mini-modal).
  - `entregado` + (recepcion|admin) → botón "Confirmar recepción".
- Click en la fila → `Modal` detalle: tabla de ítems con cantidades, los tres responsables
  con fecha/hora cada uno (timeline como el de pedidos de la tienda), nota si hay.

**Modal "Solicitar reposición" / "Nuevo traspaso"**: mismo patrón de lista de ítems de
`/admin/compras` (Select producto + cantidad + quitar, botón "+ Agregar ítem"). En traspaso
directo, dos `Select` adicionales Origen/Destino (default central → recepción). Validar ≥1
ítem con qty > 0. Texto de ayuda: "El stock se mueve al momento de la entrega y queda
registrado quién solicita, quién entrega y quién recibe."

### A6. Integraciones pequeñas

- `/admin/inventario`: en la tabla, mostrar el stock como "Recepción" y agregar columna
  (oculta en mobile) "Central". El `StockBadge` sigue evaluando el stock de recepción.
- `StockReportButton` (PDF): agregar columnas Recepción/Central/Total.
- Dashboard admin: card-link "Solicitudes de bodega pendientes: N" → /admin/bodegas
  (solo si N > 0, tono dorado).

---

## §B. Inventario ampliado

### B1. Familia de insumos (aseo, operativos, lavandería)

- `ProductCategory` suma `"insumo"`.
- Seeds en `src/data/products.ts` — helper `ins(group, name, cost)`:
  `category: "insumo"`, `channels: []`, `ageRestricted: false`, `price: 0`,
  `cost` poblado, `lowStockThreshold: 8`, stocks determinísticos (recepción bajo,
  central alto: los insumos viven en central).
  - **Aseo**: Cloro gel 900 ml ($1.890) · Limpiavidrios 750 ml ($1.590) · Desinfectante
    aerosol ($2.490) · Paños multiuso pack 3 ($1.290) · Guantes nitrilo caja 100 ($4.990) ·
    Bolsas basura 80 L pack 10 ($2.190)
  - **Insumos operativos**: Papel higiénico institucional pack 12 ($6.990) · Toalla papel
    rollo ($1.990) · Jabón líquido recarga 1 L ($2.490) · Pilas AA pack 4 ($2.990)
  - **Lavandería**: Detergente industrial 5 L ($8.990) · Suavizante 5 L ($5.990) ·
    Quitamanchas ropa blanca ($3.490) · Bolsas de lavandería pack 50 ($2.990)
- **UI**: los insumos NO aparecen en carta/sexshop públicos (channels vacío ya lo
  garantiza). En `/admin/inventario` área motel, reemplazar el filtro fijo por familia con
  un `SegmentedToggle` "Carta | Insumos" (la tienda sigue mostrando solo sexshop). Para
  insumos: columna precio muestra el **costo** con kicker "costo" (valorización del
  informe usa `cost` para insumos).
- En Bodegas (tab Saldos) los insumos aparecen siempre.

### B2. Conteos de inventario (parciales y generales) + diferencias

```ts
export interface StockCountLine { productId: string; expected: number; counted: number; }

export interface StockCount {
  id: string;
  scope: "parcial" | "general";
  warehouseId: string;            // qué bodega se contó
  group?: string;                 // sub-categoría si es parcial
  lines: StockCountLine[];
  status: "abierto" | "cerrado";
  adjusted: boolean;              // si al cerrar se ajustó el stock
  by: string;
  createdAt: string;
  closedAt?: string;
  branchId?: string;
}
```

Acciones:
```ts
startStockCount: (warehouseId: string, group: string | undefined, by: string, actor?: Actor) => string; // retorna id
setCountLine: (countId: string, productId: string, counted: number) => void;
closeStockCount: (countId: string, applyAdjustment: boolean, actor?: Actor) => void;
```

- `startStockCount` prellena `lines` con los productos del alcance (todos, o solo el
  `group`) y `expected` = saldo actual de esa bodega; `counted` parte igual a `expected`
  (así en la demo solo se editan 2–3 líneas y el resto queda cuadrado).
- `closeStockCount` con `applyAdjustment: true`: por cada línea con diferencia genera un
  movimiento `"ajuste"` (`quantity = counted − expected`, `refId = countId`) y corrige el
  saldo de la bodega correspondiente (recepción → `stock`; central → `centralStock`).
- Auditoría: abrir conteo (`crear`), cerrar (`estado`, target
  "Conteo {parcial·grupo} {bodega} · N diferencias · ajustado").

**UI — tab Conteos en /admin/bodegas**:
- Botón "Nuevo conteo" (admin/encargado) → modal: Select bodega + Select alcance
  ("Inventario general" | sub-categorías) → crea y abre la vista de conteo.
- Vista de conteo (Modal grande o panel): lista de líneas con `expected` (`text-dim`) e
  input `counted` (`tnum`); las líneas con diferencia se tiñen (falta → text-busy, sobra →
  text-gold). Footer: "N diferencias · neto {±unidades}" + checkbox "Ajustar stock al
  cerrar" (default on) + botón "Cerrar conteo".
- Lista de conteos históricos: alcance, bodega, fecha, responsable, "N diferencias",
  kicker "Ajustado" / "Sin ajuste". Click → detalle de solo las líneas con diferencia.
- **Seed** (`src/data/stockCounts.ts`): 1 conteo cerrado de ejemplo (parcial · Bebidas ·
  recepción · 2026-06-08, por "Encargado de inventario") con 2 diferencias (−2 Corona,
  −1 Agua), `adjusted: true`.

### B3. Bajo movimiento

Sin backend no hay 30 días de movimientos reales, así que la señal viene de un agregado
sembrado (mismo enfoque que la data gerencial de spec-3):

```ts
// src/data/history.ts (archivo compartido con spec-3)
/** Unidades vendidas por producto en los últimos 30 días (agregado de ejemplo). */
export const PRODUCT_SALES_30D: Record<string, number> = { /* productId: unidades */ };
```

- Poblarlo determinístico para ~40 productos representativos (los top vendedores con
  20–60 unidades; el resto 1–10) y **dejar en 0 u omitir ~8 productos elegidos** (ej.:
  "Sal de fruta", "Papelillos OCB", "Disfraz enfermera S/M", "Botella Gin Knut Hansen",
  2 vinos caros, 2 insumos) → esos son "bajo movimiento".
- Helper `lowMovement(products) => products.filter(p => (PRODUCT_SALES_30D[p.id] ?? 0) === 0)`
  en `src/lib/inventory.ts`.
- **UI**: en `/admin/inventario`, stat nueva "Bajo movimiento (30 d)" + filtro rápido; en
  cada fila afectada, kicker `text-dim` "Sin ventas 30 d". En Gerencia (spec-3) se reusa
  la misma fuente para el ranking de menos vendidos.
- Nota honesta visible (tooltip o pie de sección): "Datos de ejemplo — en operación real
  se calcula con las ventas registradas."

---

## Criterios de "listo" (Fases 1–2)

- [ ] `/admin/bodegas` operativa con sus 3 tabs y stats.
- [ ] Recepción crea solicitud → Encargado la entrega → saldos de recepción suben y de
      central bajan → Recepción confirma → los tres responsables quedan en el detalle.
- [ ] Rechazo con nota funciona y no mueve stock.
- [ ] tr-103 sembrada queda lista para aprobar en vivo en la demo.
- [ ] Compras ingresan a bodega central (con selector de destino).
- [ ] Insumos sembrados en 3 grupos, visibles en Bodegas e Inventario (toggle), invisibles
      en el sitio público.
- [ ] Conteo parcial: editar 2 líneas → cerrar con ajuste → movimientos "ajuste" creados y
      saldos corregidos; el conteo queda en el historial con sus diferencias.
- [ ] "Bajo movimiento" lista los productos sin ventas 30 d con su nota de datos de ejemplo.
- [ ] Toda acción nueva genera auditoría con usuario y rol.
- [ ] `pnpm build` limpio.
