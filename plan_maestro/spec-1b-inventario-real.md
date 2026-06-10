# Spec 1b — Carga del inventario real (Fase 0.5)

> Convierte `inventario-mmotel.md` (405 filas del Excel `STOCK_09-06-26.xlsm`) en el
> **catálogo único** del sistema, reemplazando los ~152 productos ficticios de la v1.
> Argumento de venta directo: cuando Ivon abra Inventario va a ver **sus** productos,
> con **sus** códigos de barras y **sus** saldos del 09-06. Eso no lo logra ninguna demo
> genérica.
>
> **Posición en el orden de ejecución: entre spec-1 y spec-2.** Spec-2 siembra traspasos,
> conteos e insumos SOBRE este catálogo; ejecutarla antes obligaría a rehacer sus seeds.
> Prerrequisito: spec-1 ejecutada (branchId, auditoría viva, storage v13).

---

## §1. Fuente y realidad de los datos

- Única columna confiable del Excel: **TOTAL** (stock). Las columnas RECEPCION y BODEGA
  vienen vacías — la distribución por bodega se siembra con la regla del §5.
- Sin precios ni costos en el archivo → se resuelven según §4.
- 30 productos con stock negativo, 4 duplicados, 1 concepto de cobro y ~31 activos fijos
  mezclados → depuración en §2. Resultado esperado: **~370 SKUs limpios**.
- Los nombres vienen EN MAYÚSCULAS estilo planilla → normalización obligatoria (§3),
  porque "CONSOLADOR BANANIN NEGRO BRONX 21 CM CON SOPAPO" en mayúsculas destruye la
  estética premium (regla crítica 2 de CLAUDE.md).

## §2. Depuración previa al seed

### 2.1 Exclusiones (no se cargan como productos)

1. **`PERSONA EXTRA`** (`DDD999DDD`, stock −22): es un concepto de cobro de la reserva,
   no un ítem de inventario. Ya existe como cargo en el flujo de reserva; no duplicar.
2. **Activos fijos** (equipamiento, no consumible ni vendible). Lista cerrada de
   exclusión por código:
   - Cocina · ESPECIAL: `9876543210913` Freidora, `9876543210903` Mesones,
     `9876543210914` Tostadora
   - Cocina · HABITACION: `9876543210911` Microondas
   - Habitación · ESPECIAL: `9876543210907` Cocina 4 platos, `9876543210901` Computadores,
     `9876543210898` Congeladora, `9876543210896` Cooler, `9876543210895` Escritorios,
     `9876543210916` Hervidor, `9876543210912` Horno eléctrico, `9876543210915` Juguera,
     `9876543210902` Lockers, `9876543210900` Sillas, `9876543210897` TV
   - Habitación · HABITACION: `9876543210905` Centrífuga industrial,
     `9876543210899` Mesas habitaciones
   - Habitación · ASEO: `9876543210909` Lavadora Fenza, `9876543210906` Lavadora
     industrial, `9876543210904` Lavafondo
   - Limpieza · ASEO: `9876543210908` Plancha semindustrial, `9876543210910` Secadora Midea
   - Tienda · CORTESIA: `9876543210920` Porta menú acrílicos usados
   - **Guion de demo**: si preguntan por el equipamiento, la respuesta es "un módulo de
     activos fijos es etapa futura; el inventario operativo no se contamina con
     equipamiento". NO construir ese módulo (regla 4 de CLAUDE.md).

### 2.2 Duplicados (mismo nombre, distinto código) — consolidar en un SKU

| Producto | Código que se conserva | Stock consolidado |
|---|---|---:|
| Arnés con consolador negro | `221000273076` | 0 + 1 = **1** |
| Consolador vara Sex Pop rosado | `222000146100` | máx(−1, 0) + 2 = **2** |
| Vibrador Super Soft mulato | `44400104120` | 4 + 3 = **7** |
| Tapones de lavamanos | `9876543210921` | 4 + 0 = **4** |

### 2.3 Stock negativo → 0 con rastro de regularización

Los 30 negativos se cargan en **0** y por cada uno se siembra un movimiento de
inventario `type: "ajuste"` (el tipo ya existe en v1) con `refId: "carga-inicial"`,
cantidad igual al negativo (p. ej. −3.124 para el cubo de hielo) y fecha
`2026-06-09T08:00:00`. En el modal de movimientos, etiquetar estos ajustes
"Regularización de carga inicial — saldo negativo en el sistema anterior".

**Esto es narrativa de venta, no relleno**: el Excel actual del cliente acumula ventas
sin ingreso registrado (Coca-Cola Express −338, pisco sour −769, hielo −3.124). La demo
muestra que el sistema nuevo los detecta, los regulariza con rastro y no permite que
vuelva a pasar. Mencionarlo en el guion al pasar por Inventario.

### 2.4 Reclasificaciones y typos (corregir al cargar)

- `9876543210930` Vibrador doble estimulación → familia **sexshop** (estaba en
  Tienda · HABITACION).
- `9876543211009` Sal de fruta Disfruta clásico → mismo grupo que su versión limón
  (Bebidas/antiácidos de carta).
- `7692832920` Papel higiénico (Cocina · ASEO) → grupo **Aseo** de insumos.
- Typos del Excel que se corrigen en el nombre normalizado: MOTAZA→mostaza,
  CHEEDAR→cheddar, EROTOCAS→eróticas, GRICES→grises, FUCSSIA→fucsia, PREMIUN→Premium,
  SELET→Select, ARROLADO→arrollado, BARA→vara, S//L→S/L.

## §3. Modelo de carga

### 3.1 Identidad

- `id: "p-{códigoDeBarras}"` (estable, real y útil para el pitch: "sus códigos ya están
  cargados"). `sku: el código de barras tal cual`.
- Archivo nuevo `src/data/inventarioReal.ts`: el catálogo crudo transcrito
  (código, nombre normalizado, familia, grupo, stock total, precio o costo según §4) y
  `src/data/products.ts` pasa a derivar `SEED_PRODUCTS` de ahí (generación en módulo,
  determinística, igual patrón que el resto de seeds). Los helpers `sx()`/`rs()` y los
  152 productos ficticios se eliminan.

### 3.2 Normalización de nombres

- Capitalización de oración con marcas respetadas ("Cerveza Royal Guard 355 cc",
  "Anillo vibrador Starsex celeste", "Porción 2 oz Johnnie Walker Black Label").
- Quitar el prefijo redundante "SEX SHOP " (la familia ya lo dice).
- Unidades legibles: `4 UNID`→`4 un.`, `330CC`→`330 cc`, `5LT`→`5 L`, `45GR`→`45 g`,
  `2 OZ`→`2 oz`.
- Conservar la denominación comercial completa (gramajes, marca, formato): es lo que
  hace que Ivon reconozca su inventario.

### 3.3 Mapeo familia/grupo/canales por (categoría · subcategoría) del Excel

| Excel | `category` | `group` (sugerido) | `channels` | Notas |
|---|---|---|---|---|
| Cocina · ALIMENTO | `carta` | Platos calientes / Para compartir / Sándwich y pizzas / Acompañamientos / Sugerencias del M / Algo dulce — asignado a mano por ítem | `["room_service"]` | Mismos grupos que la carta v1 para no tocar la UI pública |
| Cocina · BEBIDA | `carta` | Bebidas / Cervezas / Cócteles / Destilados / Espumantes / Vinos — a mano por ítem | `["room_service"]` | Porciones 2 oz y botellas comparten grupo; `ageRestricted: true` en alcohol |
| Cocina · CORTESIA + Tienda · CORTESIA | `insumo` | Cortesías | `[]` | Precio 0, costo estimado; Alkas, Kryzpo, bombones, Coyac, bomba de baño |
| Cocina · ESPECIAL (espuma de baño 45 ml) | `carta` | Spa | `["room_service"]` | Único no-activo de esa subcategoría |
| Tienda · SEXSHOP | `sexshop` | Vibradores / Consoladores / Lubricantes / Fetiches / Juegos / Preservativos y potenciadores / Anal / Lencería y disfraces — a mano | `["online", "presencial"]` | `ageRestricted: true`; reemplaza al sexshop ficticio |
| Tienda · ESPECIAL | `carta` | Cigarros (Pall Mall, OCB, `ageRestricted: true`) · Extras (kits, presto barba, afeitadora) · Celebraciones (globos, peluche, caja bombones, pack San Valentín) · Spa (espuma 500 ml) | `["presencial"]` (+`room_service` en Extras/Spa) | |
| Tienda · BEBIDA (sal de fruta) | `carta` | Bebidas | `["presencial","room_service"]` | |
| Tienda · HABITACION | amenidades frasco/sachet/tapones → `insumo` grupo Amenidades · sales de baño → `carta` grupo Spa · encendedor → `carta` grupo Extras | según ítem | Ver excepciones |
| Habitación · ESPECIAL (cintas decorar) | `insumo` | Cortesías | `[]` | Resto de la subcategoría son activos excluidos |
| Habitación · HABITACION (textiles: batas, cobertores, cubrecolchones, frazadas, fundas) + Limpieza · HABITACION (pieceras, sábanas, toallas) | `insumo` | Blancos y lencería | `[]` | Ver §3.4 |
| Habitación · HABITACION (menaje: bandejas, ceniceros, destapadores, vasos) | `insumo` | Menaje | `[]` | |
| Limpieza · ASEO + Habitación · ASEO (pegamento) + papel higiénico | `insumo` | Aseo · Lavandería (detergente, suavizante, cloro ropa, jabón Popeye) · Operativos (cofias, guantes, mascarillas, papel Nova) | `[]` | Reemplaza la lista inventada de spec-2 §B1 |

- `ProductCategory` suma `"insumo"` **aquí** (se adelanta de spec-2 §B1; spec-2 ya no
  declara el tipo, solo construye su UI).
- Los insumos y blancos quedan invisibles en el sitio público (`channels: []` ya lo
  garantiza).
- La tienda online pública sigue mostrando solo `sexshop`; la carta pública se alimenta
  de los grupos de `carta` (con ~212 vendibles agrupados la página actual sigue
  funcionando; verificar que el agrupado por `group` no rompa el layout).

### 3.4 Blancos: convivencia con el módulo existente

El módulo Blancos actual (`LinenStock`: sábana/toalla/bata) sigue siendo la vista
operativa de dotación y NO se toca. Los textiles entran además al catálogo como
`insumo · Blancos y lencería` para que Bodegas y los conteos (spec-2) puedan contarlos
— es lo que Ivon pidió como "productos de lavandería". Nota honesta para la demo: en
producción ambas vistas se unifican; en la maqueta conviven sin sincronizarse.

## §4. Precios y costos (el Excel no trae ninguno)

1. **Vendibles con equivalente en la v1** (machear por nombre: machas, pizzas,
   empanadas, cervezas, porciones 2 oz, espumantes, preservativos, lubricantes,
   vibradores, etc.): **heredan el precio v1** (esos precios ya estaban curados como
   verosímiles).
2. **Vendibles nuevos sin equivalente**: precio de ejemplo verosímil, redondeado a
   $100, con comentario `// precio de ejemplo — confirmar con M Motel` en el bloque
   correspondiente de `inventarioReal.ts`. Rangos de referencia: gaseosa/agua
   $2.000–2.800 · cerveza $3.500–4.800 · porción 2 oz $5.500–9.000 · cóctel porción
   $6.500–8.500 · espumante $14.000–22.000 · vino 750 $12.000–24.000 · botella
   destilado $28.000–55.000 · plato/pizza $7.900–12.900 · cigarros $5.500–7.500 ·
   pack San Valentín $25.000 (lo dice su nombre).
3. **Insumos, blancos, cortesías y amenidades**: `price: 0` y `cost` estimado (la
   valorización del informe usa `cost`, como define spec-2 §B1).
4. `lowStockThreshold`: vendibles 5 (sexshop) / 10 (carta), insumos 8 — coherente con
   los umbrales v1 y spec-2.

## §5. Distribución recepción / bodega central

El Excel solo trae el total; se siembra una distribución determinística y explicable
en demo ("lo operativo a mano, el grueso bajo llave"):

- **Vendibles** (`carta`, `sexshop`): `stock = min(total, 12)`, `centralStock = resto`.
- **Insumos/blancos/cortesías/amenidades**: `stock = min(total, 4)`, `centralStock = resto`
  (los insumos viven en central, como pide spec-2).
- Esto adelanta el campo `centralStock?: number` de spec-2 §A1 (solo el campo y el
  seed; las bodegas como UI siguen siendo de spec-2). Los "2–3 productos con central
  bajo" que pedía spec-2 salen solos de los stocks reales pequeños.

## §6. Re-mapeo de seeds que referencian productos (crítico)

Los IDs ficticios `sx-*`/`rs-*` desaparecen; TODO seed que referencie `productId` se
re-mapea a un SKU real equivalente. Lista cerrada de archivos a tocar:

| Seed | Referencia actual | Reemplazo real (id `p-{código}`) |
|---|---|---|
| `SEED_MOVEMENTS` m-001 | Caja preservativos Sensor Plus | `p-7804676070113` Preservativos variedades |
| `SEED_MOVEMENTS` m-002 | Esposas Teddy Love | `p-920045051013` Esposas eróticas Teddy Love |
| `SEED_MOVEMENTS` m-005 | Lubricante femenino Starsex | `p-777000805002` Lubricante femenino |
| `SEED_MOVEMENTS` m-003/m-004 y resto | revisar uno a uno | equivalente real del mismo tipo |
| `SEED_ROOM_SERVICE` rso-310, rso-309 | platos/bebidas v1 | equivalentes reales de carta |
| `shopOrders.ts` | productos sexshop v1 | equivalentes reales sexshop |
| `packages.ts` | ítems v1 | equivalentes reales (espumante + sales + bombones, etc.) |
| `purchases.ts` | ítems v1 | equivalentes reales del mismo proveedor/tipo |

- Tras el re-mapeo, **verificar el flujo Valentina Ríos completo** (r-1044, pieza 304,
  pedido a la habitación validado por RUT): debe operar con productos reales sin
  cambiar su guion. Es la regla transversal 6; si algo no calza, se ajusta el seed del
  pedido, jamás el flujo.
- Los stocks sembrados deben ser coherentes con esos movimientos ya ocurridos (igual
  criterio que spec-2 §A4: coherencia visible, no cuadratura histórica perfecta).

## §7. Enmiendas que esta spec impone a spec-2 y spec-3

1. **spec-2 §A1**: NO poblar `centralStock` con fórmulas sobre `sx()`/`rs()` — ya viene
   sembrado por §5 de esta spec. El tipo `Warehouse` y la UI de bodegas siguen en spec-2.
2. **spec-2 §A4 (tr-103)**: los ítems de la solicitud demo deben ser SKUs reales **con
   central suficiente** para entregarla en vivo. Propuesta verificada contra §5:
   24× `p-7802100505538` Cerveza Royal Guard 355 cc (central 114) · 24×
   `p-7801620004507` Agua mineral con gas 350 cc (central 77) · 12× `p-7804676070113`
   Preservativos variedades (central 186). (La Corona real quedó en 0 — ironía útil
   para la demo, pero no sirve para entregar una reposición.) Ajustar igual tr-100–102.
3. **spec-2 §B1**: NO sembrar la lista inventada de insumos (cloro gel 900 ml, etc.);
   los insumos reales ya están cargados con sus 3 grupos (Aseo, Operativos, Lavandería).
   De §B1 sobrevive solo la UI (toggle Carta | Insumos, columna de costo, valorización).
4. **spec-2 §B2 (conteo seed)**: usar SKUs reales: −2 Cerveza Royal Guard, −1 Agua
   mineral con gas (recepción).
5. **spec-2 §B3 / spec-3 §B1 (`PRODUCT_SALES_30D`)**: claves sobre IDs reales
   `p-{código}`. Los 8 de bajo movimiento nombrados en spec-2 existen todos en el
   inventario real: Sal de fruta limón (stock 183 — sobrestock evidente, oro para la
   demo), Papelillo OCB, Disfraz enfermera S/M (caja), Gin Knut Hansen 500 cc, los 2
   vinos caros (Tarapacá Gran Reserva, Tabalí) y 2 insumos (cofia negra, Tanax).

## §8. UI mínima afectada en esta fase

- `/admin/inventario`, `/admin/compras`, tienda admin y selects de producto deben
  soportar ~370 SKUs: verificar buscador y paginación existentes (si una lista no
  pagina, paginar a 25 como en las tablas actuales). Sin rediseños.
- La carta pública y el sexshop público se revisan visualmente tras el reemplazo
  (agrupado, orden alfabético dentro del grupo, nada en mayúsculas sostenidas).

## Criterios de "listo" (Fase 0.5)

- [ ] `SEED_PRODUCTS` derivado de `inventarioReal.ts`: ~370 SKUs, cero stock negativo,
      cero duplicados, sin activos fijos ni PERSONA EXTRA.
- [ ] 30 movimientos de ajuste "Regularización de carga inicial" visibles en el modal
      de movimientos de los productos afectados.
- [ ] Nombres normalizados (sin mayúsculas sostenidas, sin prefijo "SEX SHOP", typos
      corregidos).
- [ ] Todos los vendibles con precio (heredado o de ejemplo comentado); insumos con
      costo y precio 0.
- [ ] `stock`/`centralStock` repartidos según §5; tr-103 (enmienda) entregable.
- [ ] Seeds re-mapeados (§6) y flujo Valentina Ríos intacto de punta a punta.
- [ ] Carta pública y sexshop público se ven premium con el catálogo real (revisión
      visual, no solo build).
- [ ] `pnpm build` limpio.
