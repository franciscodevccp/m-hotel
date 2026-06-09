# Instructivo de Implementación — Maqueta M Motel

> Spec de trabajo para completar la maqueta de demostración de **M Motel Limache**.
> Pensado para ejecutarse paso a paso (incluido vía Cursor / Claude Code), respetando los
> patrones que ya existen en el proyecto: mismo `store`, mismos tokens de `globals.css`,
> mismos estilos de componentes.

---

## 1. Objetivo y contexto

La maqueta debe **mostrarse funcionando** ante el cliente (Rodrigo, dueño; Ivon, administradora que usa el sistema a diario) y demostrar que puede **reemplazar el núcleo operativo** del software actual (SoftwareParaMoteles.com, app de escritorio mexicana) **y agregar lo que ese software no tiene**.

Son **tres productos** conviviendo en un mismo sistema:

1. **Sitio público + motor de reservas online** — el diferenciador. El software actual no tiene reservas online de cara al cliente (hoy lo hacen a mano por WhatsApp).
2. **Sistema de administración** que reemplaza al de escritorio: habitaciones, caja/cortes, inventario, gastos, reportes, usuarios.
3. **Tienda online (sexshop)** de cara al cliente, con pago online y panel de pedidos en el admin.

### Ventajas confirmadas frente al competidor
- **Online, sin instalar, multidispositivo.** El de ellos es de escritorio (Windows) con nube solo para ver gráficas. El nuestro Ivon lo abre en el celular.
- **Diseño actual.** Ivon ya comentó que el de ellos "se ve un poco antiguo". La estética editorial premium es argumento de venta.
- **Fricción cero para probar.** Ivon no pudo testear la versión gratis del competidor (le pedían demasiados datos para validar el recinto). Nosotros le mandamos un link y entra al toque.

### Alcance: es una MAQUETA
- **No hay backend real todavía.** Estado en `store` (React Context) + `localStorage`, datos desde archivos semilla. Pagos **simulados**.
- El objetivo es que **se vea y se sienta funcional**, con las piezas interconectadas. La capa real (Postgres/Prisma, Flow real, etc.) se implementa después, en producción.

### Qué NO se implementa (ni se promete)
- **Sistema antirrobo de cajeros / domótica** (controla agua, luz y puertas con barreras físicas): es **hardware**, no software. Fuera de alcance. Si lo mencionan, se aclara que es una instalación física aparte.
- **Facturación electrónica real (SII / DTE):** en Chile requiere certificado, folios CAF y certificación. No para el día uno. En producción se integra vía API de un tercero o queda como fase posterior. En la maqueta, a lo más un comprobante/boleta visual de demo.
- **Manejo de dólares, bases SQL, manejo de cuentas:** Ivon confirmó que **nunca los usa**. No se construyen.

---

## 2. Estado actual de la maqueta

**Stack:** Next.js 15 (App Router), React, TypeScript, Tailwind v4, estado en Context + `localStorage`.

**Qué ya funciona:**
- Sitio público: hero, categorías (4 reales con tarifas reales), flujo de reserva en 5 pasos, confirmación con link a WhatsApp.
- Admin: dashboard, tablero de habitaciones (20, con estados y tiempo restante en vivo), caja y turnos (registrar pago + cierre con cuadre), lista de reservas, reportes (3 gráficos).
- Una reserva creada en el sitio aparece en el admin (estado compartido vía `store`).

**Qué la delata como demo (lo que hay que corregir):**
1. **Módulos aislados:** las acciones de un módulo casi no impactan a otro.
2. **Reportes hardcodeados:** `src/app/(admin)/admin/reportes/page.tsx` usa arreglos fijos (`INGRESOS_DIA`, etc.) que no se mueven hagas lo que hagas.
3. **Caja demasiado simple:** solo `expectedTotal` vs `countedTotal`. No refleja el corte de caja real que ellos imprimen.
4. **No hay productos/inventario ni tienda online** (requerimiento nuevo).
5. **Check-in/out incompleto:** el tablero solo cambia el estado de la pieza, no hay flujo de ingreso/salida.
6. **Pendientes de presentación:** collage vertical en contenedor horizontal, sin `prefers-reduced-motion`, imágenes placeholder.

---

## 3. Principios de arquitectura

1. **Demo sin backend.** Todo vive en el `store` + `localStorage`. Nada de llamadas a API reales. Pagos = pantalla de éxito simulada.
2. **Inventario único, dos canales.** La tienda online (sexshop) y la tienda física del motel son **los mismos productos y el mismo stock**. (En su corte de caja ya venden "SHOP PRESERVATIVOS" → ya manejan productos físicos.) Una venta presencial entra al corte de caja; una venta online entra como pedido; **ambas bajan del mismo stock**.
3. **Interconexión = la demo se siente viva.** Lo que impresiona no son más pantallas, son las consecuencias en cadena:

   ```
   Vender producto en recepción
        ↓ baja stock
        ↓ entra al corte de caja del turno
        ↓ se mueve el reporte
   ```

   ```
   Pedido online pagado
        ↓ baja stock (mismo inventario)
        ↓ aparece en panel de pedidos del admin
        ↓ entra al reporte de ventas online
   ```
4. **Respetar lo que ya existe.** Tipos en `src/types/index.ts`. Estado en `src/lib/store.tsx`. Tokens (`bg-surface`, `text-gold`, `font-display`, `kicker`, `tnum`…) en `src/app/globals.css`. Componentes UI reutilizables en `src/components/ui/`. Formato de moneda con `formatCLP` de `src/lib/format.ts`. **No introducir librerías de estado nuevas ni romper el look.**
5. **Datos reales de M Motel donde se pueda.** Sembrar con sus tarifas, sus categorías y los números de su corte de caja real (ver Fase 2). Que cuando Ivon lo vea, reconozca *su* operación.

---

## 4. Roadmap por fases

| Fase | Módulo | Por qué en este orden |
|------|--------|------------------------|
| 1 | Productos e Inventario | Base de las otras dos: lo necesitan el corte de caja y la tienda online. |
| 2 | Corte de caja real | Ya puede itemizar productos reales. Es la pieza que cierra el trato. |
| 3 | Tienda online + panel de pedidos | Requerimiento nuevo grande, montado sobre el inventario de la Fase 1. |
| 4 | Reportes derivados del estado real | El upgrade "está vivo": reemplaza el hardcode. |
| 5 | Gastos, usuarios/roles, check-in/out y pulido | Completa el "acceso a todo" y deja presentable. |

**Para el link que se le prometió a Ivon:** basta con Fases 1 + 2 (sitio + reservas + corte de caja real funcionando). **No meter el e-commerce todavía** en esa primera entrega; viniendo del "diseño antiguo" del competidor, eso solo ya impresiona.

---

## 5. Fase 1 — Productos e Inventario

**Meta:** una sola base de productos con stock, vendibles en dos canales, con CRUD en el admin y trazabilidad de movimientos.

### 5.1 Modelo de datos — `src/types/index.ts`

```ts
export type ProductCategory =
  | "bebestible"
  | "snack"
  | "sexshop"
  | "amenidad"
  | "otro";

export type SalesChannel = "presencial" | "online";

export interface Product {
  id: string;
  sku: string;                 // código de barras / SKU (ej. "7804676070038")
  name: string;
  category: ProductCategory;
  price: number;               // precio de venta en CLP
  cost?: number;               // costo unitario (opcional, para margen)
  stock: number;               // unidades disponibles
  lowStockThreshold: number;   // umbral para alerta de stock bajo
  channels: SalesChannel[];    // dónde se vende: presencial, online o ambos
  ageRestricted: boolean;      // +18 (sexshop)
  image: string | null;
  description?: string;        // ficha para la tienda online
  active: boolean;
}

export type MovementType =
  | "ingreso"            // entrada de stock (compra/ajuste +)
  | "venta_presencial"  // salida por venta en recepción
  | "venta_online"      // salida por pedido online
  | "ajuste";           // corrección manual (+/-)

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;     // + entrada, − salida
  at: string;           // ISO
  refId?: string;       // id de venta/pedido/turno asociado
  user?: string;
}
```

### 5.2 Datos semilla — `src/data/products.ts` (nuevo)

Sembrar con productos reales tomados de su corte de caja (ver Fase 2), por ejemplo:
- Sexshop: "Preservativos Sensor Plus" (+18), otros artículos íntimos (+18).
- Bebestibles: Coca-Cola, Agua con/sin gas, Cerveza Corona 330cc, Cerveza Stella Artois 330cc, Pisco Sour Andino porción, Piña Colada porción, Mango Sour porción.
- Snacks: Papas Kryzpo, Bombones Bon o Bon.
- Amenidades: Papel higiénico, Espuma de baño.

Marcar `channels: ["presencial", "online"]` en los de sexshop (van a la tienda) y `ageRestricted: true` en esos. Stocks variados y dejar **al menos uno bajo el umbral** para demostrar la alerta.

### 5.3 Store — `src/lib/store.tsx`

Extender `AppState` con `products: Product[]` y `movements: InventoryMovement[]`, y agregar acciones:

```ts
sellProduct(productId, quantity, channel, refId?)  // baja stock + registra movimiento
adjustStock(productId, quantity, reason)           // ajuste manual + movimiento
addProduct(product) / updateProduct(product)       // CRUD
```

`sellProduct` es la pieza clave de interconexión: descuenta `stock` y registra un `InventoryMovement`. Lo usan tanto la venta presencial (Fase 2) como el checkout online (Fase 3). Incluir `products` y `movements` en la persistencia a `localStorage` y en `resetDemo`.

### 5.4 UI Admin — `src/app/(admin)/admin/inventario/page.tsx` (nuevo)
- Agregar "Inventario" a `LINKS` en `src/components/admin/AdminNav.tsx`.
- Tabla de productos (reutilizar el estilo de `CashTable` / listas existentes): nombre, categoría, precio, **stock con badge de alerta** si `stock <= lowStockThreshold`, canales.
- Modal (`src/components/ui/Modal.tsx`) para crear/editar producto y para ajustar stock.
- Componente `StockBadge` en `src/components/admin/` (verde/ámbar/rojo según nivel), usando los colores de estado existentes (`text-ok`, `text-clean`/ámbar, `text-busy`).

### 5.5 Criterios de aceptación
- [ ] Existe la vista `/admin/inventario` con la lista de productos sembrados.
- [ ] Se puede crear, editar y ajustar stock de un producto; persiste tras recargar.
- [ ] Al menos un producto muestra alerta de stock bajo.
- [ ] `sellProduct()` descuenta stock y deja un movimiento consultable (aunque sea en consola/estado en esta fase).

---

## 6. Fase 2 — Corte de caja real

**Meta:** reemplazar el cierre de turno simple por una réplica fiel del **corte de caja que ellos imprimen**, itemizando productos vendidos y mostrando el descuadre. **Esta es la pieza que cierra el trato.**

### 6.1 Réplica del ticket (campos exactos del print del cliente)

El corte real tiene esta estructura — replicarla 1:1:

```
CORTE DE CAJA
[recinto] · [fecha hora] · Folio: 1477
Responsable: [cajero]

DINERO EN CAJA
  Caja Inicial      $15.000
  Efectivo Real     $419.000
  Efectivo Deber    $417.000
  Diferencia        −$2.000

PAGOS CON TARJETA
  Comprobante Real  $416.000
  Comprobante Deber $501.000
  Diferencia        $85.000      ← descuadre fuerte (el dolor real)

GASTOS
  Comprobante Real  $0
  Comprobante Deber $0
  Diferencia        $0

ARTÍCULOS Y SERVICIOS VENDIDOS
  [SKU]  [nombre]                         [cantidad]
  ... (lista del turno)

Ingresos Totales      $856.500
Gastos Totales        $0
Utilidad del Turno    $856.500
Propina en Efectivo   $19.500
Propina en Tarjeta    $27.000
```

> **Gancho de venta:** sembrar el corte demo con **estos números reales** (folio 1477, los $85.000 de descuadre en tarjeta, la lista de productos). Cuando Ivon lo vea, va a reconocer su propio ticket — y se le muestra en vivo cómo el sistema **detecta y alerta** ese descuadre al instante.

### 6.2 Modelo de datos — `src/types/index.ts`

Evolucionar el `Shift` actual a una estructura rica (mantener compatibilidad con `Transaction`):

```ts
export interface CashLine {
  real: number;       // lo efectivamente contado/registrado
  expected: number;   // "deber": lo que el sistema esperaba
}

export interface Shift {
  id: string;
  folio: number;
  user: string;            // cajero responsable
  openedAt: string;
  closedAt?: string;
  openingCash: number;     // caja inicial
  cash: CashLine;          // efectivo
  card: CashLine;          // tarjeta
  expenses: CashLine;      // gastos
  tipsCash: number;        // propina en efectivo
  tipsCard: number;        // propina en tarjeta
}
```

Derivados (calcular en `src/lib/cash.ts`, **no** guardar):
- `cashDiff = cash.real − cash.expected`
- `cardDiff = card.real − card.expected`
- `expensesDiff = expenses.real − expenses.expected`
- `ingresosTotales = cash.real + card.real`
- `utilidadTurno = ingresosTotales − expenses.real`
- `itemsVendidos`: derivar de `movements` con `type` de venta y `refId === shift.id` durante el turno.

> En la maqueta, `real` y `expected` se siembran explícitos para controlar el descuadre del pitch. En producción, `expected` se calcularía desde las ventas/transacciones del turno y `real` sería lo que el cajero declara.

### 6.3 Datos semilla — `src/data/shifts.ts`

Actualizar `SEED_SHIFT` con los valores del print:
`openingCash: 15000`, `cash: { real: 419000, expected: 417000 }`, `card: { real: 416000, expected: 501000 }`, `expenses: { real: 0, expected: 0 }`, `tipsCash: 19500`, `tipsCard: 27000`, `folio: 1477`. Mantener `SEED_TRANSACTIONS` como los pagos del turno.

### 6.4 UI
- Reescribir `src/app/(admin)/admin/caja/page.tsx` y `src/components/admin/ShiftSummary.tsx` para mostrar el corte completo (las tres secciones + totales + propinas + ítems).
- Resaltar la **diferencia de tarjeta** en `text-busy` cuando ≠ 0, con un mensaje de alerta ("Descuadre detectado: revisar comprobantes del turno").
- Vista "Imprimir corte" (un layout angosto tipo ticket, fácil de mostrar en pantalla). Reutilizar `Modal`.
- Actualizar la tarjeta "Diferencia de caja" del dashboard (`src/app/(admin)/admin/page.tsx`) para que lea de los nuevos campos.

### 6.5 Criterios de aceptación
- [ ] El cierre de turno muestra efectivo, tarjeta, gastos (real/deber/diferencia c/u), ítems vendidos del turno, propinas y utilidad.
- [ ] La diferencia de tarjeta de $85.000 aparece resaltada con alerta.
- [ ] La lista de "Artículos y Servicios Vendidos" sale de productos reales (Fase 1).
- [ ] Existe una vista imprimible tipo ticket.

---

## 7. Fase 3 — Tienda online (sexshop) + panel de pedidos

**Meta:** e-commerce de cara al cliente con pago simulado, sobre el **mismo inventario** de la Fase 1, y su panel de gestión de pedidos en el admin.

### 7.1 Modelo de datos — `src/types/index.ts`

```ts
export type OrderStatus =
  | "nuevo"
  | "preparando"
  | "despachado"
  | "entregado"
  | "cancelado";

export type Fulfillment = "despacho" | "retiro";

export interface OrderItem {
  productId: string;
  name: string;        // snapshot del nombre al comprar
  unitPrice: number;   // snapshot del precio
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  fulfillment: Fulfillment;
  status: OrderStatus;
  paymentStatus: "pagado" | "pendiente";
  customerName: string;
  customerPhone: string;
  address?: string;    // si fulfillment === "despacho"
  createdAt: string;   // ISO
}
```

Store: `orders: Order[]` + acción `placeOrder(order)` que crea el pedido **y** llama `sellProduct(..., "online", order.id)` por cada ítem (baja stock del inventario compartido).

### 7.2 Tienda pública — `src/app/(public)/tienda/...` (nuevo)
- **Gate +18 al entrar**: modal de confirmación de edad antes de mostrar el catálogo (estado en `sessionStorage` para no repetir en la sesión). Es maqueta; es confirmación, no verificación dura.
- **Catálogo** filtrando `products` con `channels` incluyendo `"online"` y `active`: grid de tarjetas (reutilizar estilo de `CategoryCard`), con `ImagePlaceholder` mientras no haya foto.
- **Ficha de producto**: imagen, descripción, precio, selector de cantidad, "Agregar al carro".
- **Carrito**: estado local; resumen con subtotal, despacho/retiro, total.
- **Checkout simulado**: datos del cliente, elección despacho/retiro, **botón "Pagar" que muestra pantalla de éxito** (sin pasarela real; en producción es Flow, ya resuelto en Domos El Tabo). Al confirmar: `placeOrder()`.
- **Confirmación de pedido**: número de pedido + mensaje (espejo de `reserva/confirmada`).

### 7.3 Discreción (copy de demo, sexshop)
- Texto visible de "empaque neutro, sin marcas" y "en tu cartola/tarjeta aparece un descriptor neutro". Es **copy** para mostrar la intención; no hay cobro real.

### 7.4 Panel de pedidos (admin) — `src/app/(admin)/admin/pedidos/page.tsx` (nuevo)
- Agregar "Pedidos" a `AdminNav`.
- Lista de pedidos con estado, cliente, total, despacho/retiro, fecha.
- Cambiar estado con flujo `nuevo → preparando → despachado → entregado` (botones tipo los de cambio de estado de habitación en `RoomBoard`).
- Detalle del pedido (ítems, dirección si aplica).
- Badge de "nuevos" en el nav/dashboard para que se sienta en vivo.

### 7.5 Criterios de aceptación
- [ ] `/tienda` pide confirmación +18, lista solo productos del canal online.
- [ ] Flujo completo: agregar al carro → checkout → "pago" → confirmación con número.
- [ ] El pedido aparece en `/admin/pedidos` y **baja el stock** del mismo inventario que la tienda física.
- [ ] Se puede avanzar el estado del pedido.
- [ ] Textos de discreción presentes.

---

## 8. Fase 4 — Reportes derivados del estado real

**Meta:** que los gráficos dejen de ser hardcode y reaccionen a la operación.

- Reescribir `src/app/(admin)/admin/reportes/page.tsx` para derivar de `transactions`, `movements`, `orders` y `reservations` del `store` (en vez de `INGRESOS_DIA` / `OCUPACION_DIA` / `INGRESOS_CATEGORIA` fijos).
- Crear `src/lib/reports.ts` con selectores: ingresos por día, ocupación, ingresos por categoría de habitación, **y nuevos: ventas por canal (hospedaje / tienda física / tienda online) y top productos** (lo que el competidor presume con sus "+20 gráficas").
- Mantener Recharts y la paleta actual (`GOLD`, `WINE`).

**Criterios:**
- [ ] Registrar un pago o un pedido **mueve** algún gráfico.
- [ ] Existe el gráfico de ventas por canal y el top de productos.

---

## 9. Fase 5 — Gastos, usuarios/roles, check-in/out y pulido

### 9.1 Gastos
- Tipo `Expense { id, concept, amount, category, at, user }` + `addExpense()` en el store.
- Vista/`Modal` para registrar gasto; **alimenta `expenses.real` del corte y baja la utilidad del turno**.

### 9.2 Usuarios y roles
- Tipo `Role = "admin" | "recepcion"` y `User { id, name, role, active }`.
- En el login demo (`/admin/login`), elegir el rol con quién "entrar".
- **Recepción** no ve Reportes ni edición de productos; **Admin** ve todo. Esto materializa el "acceso a todo" que pidió Ivon (ella sería admin).

### 9.3 Check-in / Check-out
- Sobre el `RoomBoard`/`RoomCell`: al ocupar una pieza, registrar ingreso (categoría, bloque, hora término); al liberar, check-out que puede gatillar un pago en caja. Conecta tablero ↔ caja.

### 9.4 Presentación (pendientes ya conocidos)
- Partir el collage vertical en 3 archivos para el contenedor horizontal (`src/app/(public)/page.tsx`, sección "Experiencia M").
- `prefers-reduced-motion`: neutralizar `rise` y `reveal` bajo movimiento reducido en `globals.css` (hoy se fuerzan siempre).
- Reemplazar placeholders por fotos reales en `public/images/` (las pone el cliente/Francisco).

**Criterios:**
- [ ] Registrar un gasto baja la utilidad del turno en el corte.
- [ ] Entrar como "recepción" oculta lo restringido.
- [ ] Check-in/out cambia estado de pieza y puede registrar pago.
- [ ] Sin saltos de layout en el collage; animaciones respetan `prefers-reduced-motion`.

---

## 10. Definition of Done de la demo

- [ ] Las acciones tienen consecuencias en cadena (venta → stock → corte → reporte; pedido → stock → panel → reporte).
- [ ] **Un solo inventario** alimenta tienda física y tienda online.
- [ ] El corte de caja replica el ticket real del cliente, con el descuadre de tarjeta resaltado.
- [ ] La tienda online funciona de punta a punta con pago simulado y gate +18.
- [ ] Los reportes se mueven con la operación.
- [ ] Todo persiste en `localStorage` y `resetDemo` deja la maqueta como nueva.
- [ ] Se ve y funciona bien en celular (Ivon la abre desde el teléfono).
- [ ] Se respeta el look (tokens, tipografías Fraunces/Hanken, componentes UI existentes).

---

## 11. Lo que queda explícitamente fuera (no construir)

- Antirrobo de cajeros / domótica (hardware).
- Facturación electrónica real SII/DTE (a lo más comprobante visual de demo).
- Manejo de dólares, bases SQL, manejo de cuentas (Ivon no los usa).
- Integraciones reales de pago/correo en la maqueta (Flow/Resend van en producción; aquí se simulan).

---

## 12. Notas de ejecución

- Mantener un único `store` como fuente de verdad; cada módulo nuevo agrega su slice de estado + acciones ahí.
- Cada acción que mueva dinero o stock debe dejar su rastro (`Transaction` o `InventoryMovement`) para que los derivados (corte, reportes) cuadren solos.
- Sembrar siempre con datos de M Motel (tarifas, categorías, productos y números del corte real) para máxima credibilidad en la demo.
- Orden sugerido de PRs/commits: Fase 1 → Fase 2 (link a Ivon aquí) → Fase 3 → Fase 4 → Fase 5.
