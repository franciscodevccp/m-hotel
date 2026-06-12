# scope.md — Alcance · M Motel (maqueta)

Alcance cerrado. Lo que no está acá, no se construye (se deja como placeholder coherente si hace falta visualmente).

---

## 1. Pantallas

### Públicas — `(public)`

**Landing (`/`)**
- Hero a sangre, oscuro, con titular serif y CTA "Reservar".
- Cifras de M: 4.3★ (198 reseñas), 21 habitaciones, atención 24/7, room service.
- Sección de las 5 categorías (tarjetas editoriales con "desde $XX.000").
- Bloque de servicios: room service gourmet 24h, jacuzzi, estacionamiento, discreción.
- Footer: dirección (Av. Palmira Romano Sur 196-A, Limache), WhatsApp, cómo llegar.

**Reserva (`/reservar`)** — flujo guiado (ver sección 2).

**Confirmación (`/reserva/confirmada`)**
- Resumen de la reserva (categoría, día, bloque, hora estimada de término, total).
- Mensaje "Te confirmamos por WhatsApp" + botón que abre WhatsApp con el detalle pre-armado (`https://wa.me/56940576201?text=...`).
- Todo mock: no se persiste nada en servidor.

### Admin — `(admin)` (todo simulado)

**Login (`/admin/login`)**
- Login falso. Cualquier credencial (o un botón "Entrar como administrador") pasa. Solo para mostrar el control de acceso por roles.

**Dashboard (`/admin`)**
- Resumen del día: ocupación actual, ingresos del turno, reservas próximas, habitaciones por estado. Cifras mock.

**Habitaciones (`/admin/habitaciones`)**
- Tablero de las 21 habitaciones con su estado (disponible / ocupada / limpieza / mantención) y, si está ocupada, tiempo restante del bloque. Permite cambiar estado (solo en memoria).

**Caja y turnos (`/admin/caja`)** — el módulo estrella del pitch.
- Registrar pagos (efectivo / tarjeta / transferencia) asociados a una habitación.
- Cierre de turno con cuadre: total esperado vs. registrado. Aquí se ve el valor de "no más descuadres".
- Registro automático de quién y a qué hora (auditoría mock).

**Reservas (`/admin/reservas`)**
- Lista de reservas (las que llegan del flujo público + mock precargadas), con estado.

**Reportes (`/admin/reportes`)** *(opcional, si alcanza)*
- 2–3 gráficos mock: ocupación e ingresos por día/categoría. Datos estáticos.

### Módulos operativos (observaciones del cliente, jun-2026)

Todo simulado en memoria, funcional dentro de la demo:

**Aseo (`/admin/aseo`) y Limpieza (`/admin/limpieza`)**
- Cada aseo registra camarera, hora de inicio, hora de término y duración. La presencia se valida escaneando el QR instalado en la pieza.
- Checklist obligatorio antes de marcar la pieza lista (jacuzzi solo donde corresponde), con observación e **incidencias con fotografía** (cámara o galería del dispositivo).
- Reportes para administración: historial por camarera y **por habitación**, tiempo promedio, pendientes, **habitaciones observadas**, **productividad por turno (día/noche)** y **cumplimiento de checklist**.
- **Consumo automático de insumos**: cada limpieza descuenta el kit de su categoría desde la bodega de lavandería, en fracciones del formato de compra (0,1 de bidón). La medición es **editable por administración** por categoría.
- Cobro del bloque en la pieza (flujo del cliente): cobro → medio de pago → **escaneo de carnet** → sincronización con recepción. El escaneo alerta lista negra y reconoce clientes frecuentes/VIP.

**Bodegas (`/admin/bodegas`)**
- **Tres bodegas**: recepción, central (bajo llave) y lavandería/aseo.
- Traspasos con **guía interna de despacho** (folio correlativo, imprimible en térmica 80 mm): producto, solicitado, entregado, **pendiente**, quién solicita / entrega / recibe, fecha y hora.
- **Control de stock insuficiente**: si lo solicitado supera el saldo, el sistema alerta, permite **entrega parcial**, registra el pendiente y lo suma a la **sugerencia de reposición** (con acceso directo a compras).
- **Semáforo de stock** en tiempo real, por bodega: verde normal · amarillo bajo · rojo crítico · gris sin stock.

**Inventario (`/admin/inventario`)**
- Miniaturas de producto (fotografía si existe; monograma sobrio si no) y el mismo semáforo de cuatro niveles.

**Tablero (`/admin/habitaciones`)**
- La celda ocupada muestra la marca **"Por cobrar"** mientras el ticket de la pieza siga pendiente; desaparece cuando la camarera registra el pago.

---

## 2. Flujo de reserva (público)

Pasos, con resumen sticky siempre visible:

1. **Categoría** — elegir entre las 5 (tarjetas con m² y "desde").
2. **Día** — toggle "Entre semana (Lun–Jue)" / "Fin de semana y festivos (Vie–Dom)". Cambia todos los precios.
3. **Bloque de horas** — chips 3h / 6h / 12h, cada uno mostrando su precio para el día elegido. (La "hora adicional" se menciona como nota, no es seleccionable en la demo.)
4. **Datos mínimos** — nombre y teléfono. Nada de pagos. Tono discreto, pedir lo mínimo.
5. **Resumen + confirmar** — categoría, día, bloque, hora estimada de término (hora actual + duración, ilustrativa), total. Botón "Confirmar reserva".
6. Redirige a **Confirmación** y arma el mensaje de WhatsApp.

Notas UX (de la investigación):
- Pre-seleccionar el día actual por defecto para reducir fricción.
- Chips, no selectores nativos tipo ruleta.
- Mobile impecable: el resumen pasa a sheet inferior fijo.

---

## 3. Lógica de precios (DATOS REALES — no inventar)

Centralizar en `src/lib/pricing.ts`. Regla: dos tarifas según el día.
- **Entre semana** = Lunes a Jueves.
- **Fin de semana y festivos** = Viernes a Domingo (y festivos; víspera de festivo desde las 14:00).

Montos en CLP. Formato `$45.000`. Valores del tarifario 2026 del cliente.

| Categoría | m² | Entre semana 3h / 6h / 12h | Finde/festivo 3h / 6h / 12h | +hora | +persona |
|---|---|---|---|---|---|
| Standard VIP | 22 | 35.000 / 50.000 / 65.000 | 40.000 / 60.000 / 80.000 | 20.000 | 23.000 |
| Standard Black | 22 | 40.000 / 55.000 / 70.000 | 45.000 / 65.000 / 85.000 | 20.000 | 23.000 |
| Jacuzzi VIP | 22 | 45.000 / 75.000 / 85.000 | 50.000 / 85.000 / 95.000 | 23.000 | 25.000 |
| Jacuzzi Premium | 27 | 50.000 / 80.000 / 90.000 | 55.000 / 90.000 / 115.000 | 23.000 | 25.000 |
| Jacuzzi Black | 29 | 55.000 / 85.000 / 105.000 | 65.000 / 100.000 / 125.000 | 23.000 | 25.000 |

La hora y la persona adicional valen lo mismo entre semana y el fin de semana.

---

## 4. Modelo de datos (mock, TypeScript)

Tipos sugeridos en `src/types/index.ts`. Los datos viven en `src/data/`.

```ts
export type DayType = "weekday" | "weekend"; // weekday = Lun–Jue, weekend = Vie–Dom/festivos
export type Duration = 3 | 6 | 12;

export interface CategoryPricing {
  weekday: Record<Duration, number>;
  weekend: Record<Duration, number>;
  extraHour: { weekday: number; weekend: number };
  extraPerson: { weekday: number; weekend: number };
}

export interface Category {
  id: "standard-vip" | "standard-black" | "jacuzzi-vip" | "jacuzzi-premium" | "jacuzzi-black";
  name: string;        // "Jacuzzi Black"
  shortName: string;   // "Jacuzzi Black"
  area: number;        // m²
  amenities: string[]; // ["Jacuzzi privado", "Cama king", "TV", "Wi-Fi", "Room service 24h"]
  pricing: CategoryPricing;
  image: string;       // ruta o key del fondo generado
}

export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export interface Room {
  id: string;              // "12"
  number: number;
  categoryId: Category["id"];
  status: RoomStatus;
  occupiedUntil?: string;  // ISO, si está ocupada (para mostrar tiempo restante)
}

export interface Reservation {
  id: string;
  categoryId: Category["id"];
  dayType: DayType;
  duration: Duration;
  guestName: string;
  guestPhone: string;
  total: number;
  createdAt: string;       // ISO
  status: "pending" | "confirmed";
}

export type PaymentMethod = "cash" | "card" | "transfer";

export interface Transaction {
  id: string;
  roomId: string;
  method: PaymentMethod;
  amount: number;
  at: string;              // ISO
  user: string;            // "Recepción turno noche" (auditoría mock)
}

export interface Shift {
  id: string;
  user: string;
  openedAt: string;
  closedAt?: string;
  expectedTotal: number;   // esperado por reservas/ocupación
  countedTotal: number;    // ingresado en caja
}
```

Datos mock a precargar:
- **5 categorías** con sus precios reales (tabla de arriba) y amenidades reales (jacuzzi privado, cama king, TV, Wi-Fi, room service 24h; estacionamiento a nivel motel).
- **21 habitaciones** con su numeración real: 1-2-3-6-7-8-9 Standard VIP, 19-20-21 Standard Black, 4-5 Jacuzzi VIP, 10-11-12-13-14 Jacuzzi Premium, 15-16-17-18 Jacuzzi Black. Mezcla de estados para que el tablero se vea vivo.
- **Reservas** y **transacciones** de ejemplo para poblar admin.
- Un **turno** abierto con un pequeño descuadre, para demostrar el cuadre de caja.

---

## 5. Datos del negocio (para copy/footer)

- Nombre: **M Motel** (marca "M"). Motel de paso para parejas.
- Ubicación: Av. Palmira Romano Sur 196-A, Limache, Región de Valparaíso.
- WhatsApp: +56 9 4057 6201 · Tel: +56 33 251 0695.
- Atención 24/7, room service gourmet, restaurante propio, sexshop.
- Reputación: 4.3★ con 198 reseñas en Google (privacidad, limpieza y discreción son lo más valorado).
- Check-in 14:00 (referencial; en motel de paso el ingreso es por bloque).

---

## 6. Fuera de alcance (NO construir)

- Base de datos, ORM, backend, API real.
- Pasarela de pago real (Flow, Webpay, etc.). El paso de pago no existe en la demo.
- Autenticación real, manejo de sesiones, roles con permisos reales.
- Integración real con WhatsApp Cloud API (solo el link `wa.me` pre-armado).
- Reemplazar el software de gestión interno del cliente (eso NO es lo que vendemos; ver `CLAUDE.md`).
- Multi-idioma, multi-sucursal, panel de configuración.
- Tests, CI/CD, analítica.
