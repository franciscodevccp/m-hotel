# Plan Maestro — Maqueta M Motel v2 (post-correo Ivon)

> **Léeme primero.** Este archivo es el mapa. La ejecución detallada está en:
> 1. `spec-1-core.md` — correcciones del núcleo (caja, cierre de turno, multi-sucursal, rol Dueño, auditoría viva, +18, cupones)
> 2. `spec-1b-inventario-real.md` — carga del inventario real de M Motel (405 filas de `inventario-mmotel.md`) como catálogo único, con depuración y re-mapeo de seeds
> 3. `spec-2-bodegas.md` — bodegas, traspasos, solicitudes de reposición, insumos, conteos de inventario (con las enmiendas de spec-1b §7)
> 4. `spec-3-personal-gerencia.md` — vista de Personal y Panel Gerencial con data histórica
>
> **Ejecutar en ese orden.** La spec-1 cambia el modelo de datos del que dependen las demás; la spec-1b cambia el catálogo sobre el que spec-2 y spec-3 siembran sus datos.

---

## 1. Contexto de negocio (por qué existe esta v2)

La maqueta v1 ya fue presentada a M Motel Limache (Rodrigo = dueño, Ivon = administradora).
Después de verla, **Ivon envió un correo con requerimientos detallados** y pidió ver una
**maqueta funcional/prototipo navegable** antes de avanzar. Francisco respondió comprometiendo
una segunda demo con módulos nuevos. **Esta v2 es esa segunda demo.** Lo que se construya
aquí fue prometido por escrito; tiene que estar y tiene que funcionar.

### Lo que pidió Ivon (resumen fiel de su correo)

1. **Registro único**: una acción genera automáticamente todos los registros (ingreso,
   responsable, cobro, inventario, informes). *Ya es la arquitectura de la maqueta — hay que
   protegerla y completarla, no construirla.*
2. **Bodegas**: bodega de recepción (venta diaria) + bodega central (bajo llave). Traspasos
   digitales con registro de quién solicita, quién entrega, qué se traslada y saldos.
   Solicitudes de reposición desde recepción que generan los movimientos solos.
3. **Control de inventario**: stock de venta, productos de aseo, insumos operativos,
   productos de lavandería, bebidas/alimentos, próximos a agotarse, bajo movimiento,
   diferencias de inventario, inventarios parciales y generales.
4. **Personal**: habitaciones por trabajador, tiempos de aseo, tareas ejecutadas,
   rendimiento por turno, cumplimiento, historial de actividades.
5. **Información gerencial**: ventas diarias/semanales/mensuales, ocupación, ticket
   promedio, habitaciones más/menos vendidas, productos más/menos vendidos, consumo de
   inventario, costos, comparativos históricos.
6. **Clientes**: reservas online, disponibilidad real, sin duplicidad, registro nombre+RUT,
   historial de visitas, consumos por estadía. (Captura de cédula fue **desaconsejada** por
   Francisco en su respuesta — NO construir.)
7. **Multi-sucursal**: preparación de arquitectura desde el día uno; vista consolidada como
   fase futura.

### Mapa requerimiento → estado

| Requerimiento de Ivon | Estado | Dónde se resuelve |
|---|---|---|
| Registro único (3 ejemplos del correo) | ✅ Ya funciona | Proteger en spec-1 (modelo de caja) |
| Bodegas + traspasos + reposición | ❌ Nuevo | spec-2 |
| Próximos a agotarse | ✅ Existe (umbral) | — |
| Bajo movimiento | ❌ Nuevo | spec-2 |
| Diferencias / inventarios parciales y generales | ❌ Nuevo (conteos) | spec-2 |
| Categorías aseo / insumos / lavandería | ❌ Nuevo (familia insumo) | spec-2 |
| Personal y rendimiento (vista consolidada) | ❌ Nuevo (datos ya se capturan) | spec-3 |
| Panel gerencial + comparativos | ❌ Nuevo | spec-3 |
| Reservas online, RUT, consumos por estadía | ✅ Ya funciona | — |
| Captura de cédula | 🚫 Desaconsejado | NO construir |
| Inventario real cargado (Excel del 09-06, 405 SKUs) | ❌ Nuevo | spec-1b |
| Multi-sucursal (arquitectura) | ❌ Nuevo (liviano) | spec-1 |
| Cierre de turno real + arqueo | ⚠️ Roto en v1 | spec-1 |
| Auditoría que registre acciones reales | ⚠️ Estática en v1 | spec-1 + transversal |

---

## 2. Qué es este proyecto (recordatorio técnico)

- **MAQUETA de demostración**, no producción. Next.js 15 (App Router) + React 19 +
  TypeScript + Tailwind v4.
- Estado en **React Context + localStorage** (`src/lib/store.tsx`). Sin backend ni BD.
  Pagos y correos **simulados**.
- Seeds **determinísticos** en `src/data/` (nada de `Math.random()` ni fechas relativas en
  el render del servidor — SSR y cliente deben coincidir o se rompe la hidratación).
- Diseño: tokens de `src/app/globals.css` (bg-bg, bg-surface, text-cream, text-muted,
  text-dim, text-gold, border-line, `kicker`, `tnum`, `font-display`). Fraunces (display) +
  Instrument Sans (texto). Paleta oscura cálida + dorado champagne. **No inventar estilos
  nuevos: copiar patrones de páginas existentes** (stats en cards `border border-line
  bg-surface/40 p-4`, modales con `Modal`, selects con `Select`, etc.).
- Moneda SIEMPRE con `formatCLP` de `src/lib/format.ts`. UI y comentarios en **español
  neutro** (claro y correcto para cualquier hispanohablante; se conservan solo los
  términos locales inevitables del negocio: RUT, CLP, boleta).

## 3. Reglas transversales (aplican a TODAS las fases)

1. **STORAGE_KEY**: subir a `"m-motel-state-v13"` en `src/lib/store.tsx` (el modelo cambia;
   los datos viejos de localStorage no deben mezclarse).
2. **Auditoría viva**: toda acción mutadora nueva o tocada DEBE registrar una entrada de
   auditoría (mecanismo en spec-1 §5). Si una fase agrega una acción al store y no la
   audita, la fase no está terminada.
3. **Multi-sucursal**: todo tipo nuevo lleva `branchId?: string` y los seeds nuevos usan
   `"limache"`. No construir UI multi-sucursal más allá de lo indicado en spec-1 §4.
4. **Roles**: respetar la matriz de visibilidad (spec-1 §6). El rol `dueno` es SOLO lectura.
5. **Determinismo**: seeds nuevos con valores fijos o fórmulas con índice (`(i*7)%n`), nunca
   aleatorios. Fechas absolutas tipo `"2026-06-09T18:40:00"`. El "hoy" de la demo es
   **2026-06-09/10**.
6. **No romper lo que funciona**: el flujo demo de Valentina Ríos (reserva r-1044, pieza 304,
   pedidos a la habitación validados por RUT), el descuadre sembrado del folio 1477 y la
   interconexión venta→stock→caja→reportes son el corazón del pitch.
7. Después de cada fase: `pnpm build` debe pasar sin errores de tipos. **Este proyecto usa
   exclusivamente `pnpm` (nunca `npm` ni `yarn`).**

## 4. Orden de ejecución

| Fase | Spec | Contenido | Por qué en este orden |
|---|---|---|---|
| 0 | spec-1 | Modelo real/deber, cierre de turno + arqueo + cortes archivados, ticket con sexshop, multi-sucursal, rol Dueño, auditoría viva, +18, cupones | Cambia tipos y store de los que depende todo lo demás |
| 0.5 | spec-1b | Catálogo real (~370 SKUs depurados del Excel), familia insumo, reparto recepción/central, re-mapeo de seeds | Spec-2 y spec-3 siembran traspasos, conteos y ventas SOBRE este catálogo |
| 1 | spec-2 §A | Bodegas, traspasos, solicitudes de reposición | El módulo prometido como protagonista |
| 2 | spec-2 §B | Conteos de inventario + bajo movimiento + UI de insumos | Se apoya en bodegas y el catálogo real |
| 3 | spec-3 §A | Vista Personal | Datos ya existen; vista nueva |
| 4 | spec-3 §B | Panel Gerencial + data histórica sembrada | Cierra la lista de Ivon |

## 5. Guion de la demo (lo que esta maqueta tiene que poder contar)

El recorrido que Francisco hará con Ivon y Rodrigo. Cada paso debe funcionar de corrido:

1. **Login Recepción** → tablero de habitaciones. Check-in en una pieza libre → queda
   ocupada con responsable y término.
2. Recepción nota **stock bajo** en un producto → **solicita reposición** a bodega central
   desde la plataforma (sin papel, sin WhatsApp).
3. **Login Encargado** → ve la solicitud pendiente → la **entrega**: el stock se mueve solo
   de central a recepción, con registro de quién pidió y quién entregó.
4. **Venta en recepción** (un producto del sexshop + una bebida) → baja stock de recepción,
   entra al efectivo del corte.
5. **Check-out con tarjeta** → cobro entra al corte. Mostrar que el **descuadre sembrado
   (−$85.000 en tarjeta) NO se movió**: las operaciones del sistema cuadran solas; el
   descuadre es del arqueo.
6. **Cerrar turno**: arqueo (efectivo contado / comprobantes), diferencia en vivo, confirmar
   → el corte queda **archivado** en Cortes y se abre el folio siguiente.
7. **Auditoría**: todo lo anterior aparece registrado con usuario, rol y hora.
8. **Login Dueño (Rodrigo)** → aterriza en **Gerencia**: ventas del mes, ocupación,
   habitaciones más vendidas, comparativo vs mes anterior. Todo solo-lectura.
9. **Personal**: tiempos de aseo por trabajadora, limpiezas del mes, rendimiento por turno.
10. **Conteo de inventario** (parcial, bodega recepción) → diferencia detectada → ajuste con
    registro.
11. Público: **reserva online** + pedido a la habitación con RUT (flujo Valentina) +
    **cupón** en el checkout del sexshop con **verificación +18**.

## 6. Checklist de aceptación (antes de dar por lista la v2)

- [ ] `pnpm build` limpio.
- [ ] El catálogo es el inventario real de M Motel (~370 SKUs depurados, nombres
      normalizados, sin negativos ni duplicados ni activos fijos), con los 30 ajustes de
      regularización visibles en movimientos.
- [ ] El descuadre del folio 1477 permanece en −$85.000 tarjeta / +$2.000 efectivo aunque se
      registren pagos, ventas y gastos.
- [ ] Cerrar turno archiva el corte (visible en Cortes con su ticket) y abre folio 1478.
- [ ] El ticket de corte itemiza productos de carta **y** sexshop vendidos en el turno.
- [ ] Una solicitud de reposición creada por Recepción puede ser entregada por Encargado y
      los saldos de ambas bodegas cambian; todo queda en auditoría.
- [ ] Un conteo parcial con diferencias permite ajustar y deja movimientos de ajuste.
- [ ] El rol Dueño entra con perfil "Rodrigo", aterriza en Gerencia y no puede mutar nada.
- [ ] /admin/personal muestra métricas por trabajadora con el seed de 30 días.
- [ ] /admin/gerencia muestra todos los KPIs y gráficos de la lista de Ivon, con nota de
      "datos de ejemplo".
- [ ] /sexshop muestra gate +18 (si `ageNotice` está activo) y el checkout acepta cupones
      reales del admin (BIENVENIDA10, ENVIOGRATIS, VERANO15).
- [ ] Configuración muestra la sección Sucursales; Gerencia tiene el selector de sucursal.
- [ ] El flujo Valentina Ríos sigue intacto de punta a punta.
- [ ] "Reiniciar demo" deja todo en el estado sembrado correcto.
