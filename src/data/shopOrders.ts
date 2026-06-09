import { seedProductId } from "@/data/products";
import { DEMO_CLIENT } from "@/lib/demo";
import type {
  ShopFulfillment,
  ShopOrder,
  ShopOrderItem,
  ShopPaymentMethod,
  ShopOrderStatus,
} from "@/types";

// Pedidos de la tienda online (sexshop). Datos determinísticos para que SSR y
// cliente coincidan: sin Math.random ni fechas relativas. Hoy de la demo: 2026-06-09.

interface SeedItem {
  name: string;
  qty: number;
  price: number;
}

interface SeedOrder {
  folio: number;
  customerName: string;
  customerRut?: string;
  customerEmail: string;
  customerPhone: string;
  fulfillment: ShopFulfillment;
  address?: string;
  comuna?: string;
  payment: ShopPaymentMethod;
  status: ShopOrderStatus;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: SeedItem[];
  shipping: number;
  coupon?: { code: string; discount: number };
  notes?: string;
}

function build(o: SeedOrder): ShopOrder {
  const items: ShopOrderItem[] = o.items.map((it) => ({
    productId: seedProductId(it.name),
    name: it.name,
    quantity: it.qty,
    unitPrice: it.price,
  }));
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const discount = o.coupon?.discount ?? 0;
  const total = subtotal + o.shipping - discount;
  return {
    id: `so-${o.folio}`,
    folio: o.folio,
    customerName: o.customerName,
    customerRut: o.customerRut,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    fulfillment: o.fulfillment,
    address: o.address,
    comuna: o.comuna,
    payment: o.payment,
    items,
    subtotal,
    shipping: o.shipping,
    discount,
    couponCode: o.coupon?.code,
    total,
    status: o.status,
    createdAt: o.createdAt,
    paidAt: o.paidAt,
    shippedAt: o.shippedAt,
    deliveredAt: o.deliveredAt,
    notes: o.notes,
  };
}

export const SEED_SHOP_ORDERS: ShopOrder[] = [
  build({
    folio: 1042,
    customerName: DEMO_CLIENT.name,
    customerRut: DEMO_CLIENT.rut,
    customerEmail: DEMO_CLIENT.email,
    customerPhone: DEMO_CLIENT.phone,
    fulfillment: "retiro",
    comuna: "Limache",
    payment: "webpay",
    status: "entregado",
    createdAt: "2026-05-28T19:12:00",
    paidAt: "2026-05-28T19:14:00",
    deliveredAt: "2026-05-30T17:40:00",
    items: [
      { name: "Anillo vibrador Pretty Love", qty: 1, price: 19900 },
      { name: "Caja preservativos Sensor Plus (3 un.)", qty: 2, price: 3000 },
    ],
    shipping: 0,
  }),
  build({
    folio: 1043,
    customerName: "Camila Rojas",
    customerRut: "18.903.221-4",
    customerEmail: "camirojas@outlook.com",
    customerPhone: "+56 9 9123 0098",
    fulfillment: "despacho",
    address: "Av. Libertad 1234, depto 52",
    comuna: "Viña del Mar",
    payment: "webpay",
    status: "entregado",
    createdAt: "2026-05-30T21:48:00",
    paidAt: "2026-05-30T21:50:00",
    deliveredAt: "2026-06-02T13:20:00",
    items: [
      { name: "Succionador de clítoris", qty: 1, price: 14900 },
      { name: "Gel calor sabor Frutilla", qty: 1, price: 9900 },
    ],
    shipping: 3990,
    coupon: { code: "BIENVENIDA10", discount: 2480 },
  }),
  build({
    folio: 1044,
    customerName: "Felipe Soto",
    customerRut: "15.220.118-9",
    customerEmail: "felipe.soto.q@gmail.com",
    customerPhone: "+56 9 7788 4421",
    fulfillment: "despacho",
    address: "Pasaje Los Aromos 567",
    comuna: "Quilpué",
    payment: "transferencia",
    status: "entregado",
    createdAt: "2026-06-01T20:05:00",
    paidAt: "2026-06-01T22:30:00",
    deliveredAt: "2026-06-03T16:10:00",
    items: [{ name: "Vibrador realista 23 cm", qty: 1, price: 24900 }],
    shipping: 3990,
  }),
  build({
    folio: 1045,
    customerName: "Daniela Pérez",
    customerRut: "17.665.430-2",
    customerEmail: "dani.perez88@gmail.com",
    customerPhone: "+56 9 6650 1122",
    fulfillment: "retiro",
    comuna: "Limache",
    payment: "webpay",
    status: "entregado",
    createdAt: "2026-06-02T18:33:00",
    paidAt: "2026-06-02T18:35:00",
    deliveredAt: "2026-06-03T12:00:00",
    items: [
      { name: "Kit de Sade", qty: 1, price: 14900 },
      { name: "Esposas Teddy Love", qty: 1, price: 6000 },
    ],
    shipping: 0,
  }),
  build({
    folio: 1046,
    customerName: "Ignacio Morales",
    customerRut: "14.009.882-1",
    customerEmail: "imorales@gmail.com",
    customerPhone: "+56 9 5540 8890",
    fulfillment: "despacho",
    address: "Calle Valparaíso 880",
    comuna: "Villa Alemana",
    payment: "webpay",
    status: "entregado",
    createdAt: "2026-06-03T22:14:00",
    paidAt: "2026-06-03T22:16:00",
    deliveredAt: "2026-06-05T15:30:00",
    items: [{ name: "Vibrador Power Wand Rosado", qty: 1, price: 38000 }],
    shipping: 0,
    coupon: { code: "ENVIOGRATIS", discount: 0 },
    notes: "Envío gratis por compra sobre $25.000.",
  }),
  build({
    folio: 1047,
    customerName: "Pablo Sandoval",
    customerRut: "19.554.207-6",
    customerEmail: "p.sandoval@gmail.com",
    customerPhone: "+56 9 8810 3344",
    fulfillment: "despacho",
    address: "Camino El Manzano 145",
    comuna: "Olmué",
    payment: "webpay",
    status: "entregado",
    createdAt: "2026-06-04T23:02:00",
    paidAt: "2026-06-04T23:05:00",
    deliveredAt: "2026-06-06T14:05:00",
    items: [
      { name: "Bala vibradora Punto G", qty: 1, price: 22900 },
      { name: 'Lubricante femenino Starsex "Placer Intenso"', qty: 1, price: 2500 },
    ],
    shipping: 3990,
  }),
  build({
    folio: 1048,
    customerName: "Valentina Castro",
    customerRut: "18.112.770-5",
    customerEmail: "vale.castro@gmail.com",
    customerPhone: "+56 9 9988 1200",
    fulfillment: "despacho",
    address: "Av. Granizo 2210",
    comuna: "Olmué",
    payment: "webpay",
    status: "despachado",
    createdAt: "2026-06-06T20:40:00",
    paidAt: "2026-06-06T20:42:00",
    shippedAt: "2026-06-07T11:15:00",
    items: [
      { name: "Arnés con dildo negro", qty: 1, price: 34900 },
      { name: 'Lubricante anal Starsex "Más Comodidad"', qty: 1, price: 2500 },
    ],
    shipping: 3990,
  }),
  build({
    folio: 1049,
    customerName: "Rodrigo Tapia",
    customerRut: "13.880.451-0",
    customerEmail: "rtapia.vlp@gmail.com",
    customerPhone: "+56 9 6677 2031",
    fulfillment: "despacho",
    address: "Subida Ecuador 455",
    comuna: "Valparaíso",
    payment: "transferencia",
    status: "despachado",
    createdAt: "2026-06-07T21:25:00",
    paidAt: "2026-06-07T23:10:00",
    shippedAt: "2026-06-08T10:30:00",
    items: [{ name: "Vibrador Cyber 21 cm", qty: 1, price: 29900 }],
    shipping: 3990,
  }),
  build({
    folio: 1050,
    customerName: "Antonia Vega",
    customerRut: "20.115.664-8",
    customerEmail: "antonia.vega@gmail.com",
    customerPhone: "+56 9 7012 9988",
    fulfillment: "despacho",
    address: "Av. O'Higgins 1500",
    comuna: "Quillota",
    payment: "webpay",
    status: "preparando",
    createdAt: "2026-06-08T19:50:00",
    paidAt: "2026-06-08T19:52:00",
    items: [
      { name: "Vibrador Tracy Pretty Love Pink", qty: 1, price: 49900 },
      { name: "Gel calor sabor Chocolate", qty: 1, price: 9900 },
    ],
    shipping: 3990,
  }),
  build({
    folio: 1051,
    customerName: "Sebastián Núñez",
    customerRut: "16.770.339-K",
    customerEmail: "seba.nunez@gmail.com",
    customerPhone: "+56 9 5521 4477",
    fulfillment: "retiro",
    comuna: "Limache",
    payment: "efectivo",
    status: "preparando",
    createdAt: "2026-06-08T22:18:00",
    paidAt: "2026-06-08T22:20:00",
    items: [
      { name: "Plug joya silicona M", qty: 1, price: 19900 },
      { name: "Plug joya silicona L", qty: 1, price: 19900 },
    ],
    shipping: 0,
    notes: "Paga en efectivo al retirar.",
  }),
  build({
    folio: 1052,
    customerName: DEMO_CLIENT.name,
    customerRut: DEMO_CLIENT.rut,
    customerEmail: DEMO_CLIENT.email,
    customerPhone: DEMO_CLIENT.phone,
    fulfillment: "despacho",
    address: "Calle Valparaíso 45, of. 8",
    comuna: "Viña del Mar",
    payment: "webpay",
    status: "pagado",
    createdAt: "2026-06-09T11:30:00",
    paidAt: "2026-06-09T11:32:00",
    items: [{ name: "Masturbador Holand UV Touch", qty: 1, price: 29000 }],
    shipping: 3990,
    coupon: { code: "VERANO15", discount: 4350 },
  }),
  build({
    folio: 1053,
    customerName: "Matías Herrera",
    customerRut: "15.998.220-3",
    customerEmail: "matias.herrera@gmail.com",
    customerPhone: "+56 9 6690 5512",
    fulfillment: "despacho",
    address: "Av. Latorre 320",
    comuna: "La Calera",
    payment: "transferencia",
    status: "pagado",
    createdAt: "2026-06-09T12:48:00",
    paidAt: "2026-06-09T13:05:00",
    items: [
      { name: "Dildo con ventosa 20 cm", qty: 1, price: 18000 },
      { name: "Vara anal beads Pretty Love", qty: 1, price: 29900 },
    ],
    shipping: 3990,
  }),
  build({
    folio: 1054,
    customerName: "Constanza Lagos",
    customerRut: "18.440.117-9",
    customerEmail: "cota.lagos@gmail.com",
    customerPhone: "+56 9 7745 0021",
    fulfillment: "despacho",
    address: "Pasaje El Sauce 12",
    comuna: "Quilpué",
    payment: "webpay",
    status: "pendiente",
    createdAt: "2026-06-09T14:20:00",
    items: [{ name: "Disfraz enfermera talla M/L", qty: 1, price: 19900 }],
    shipping: 3990,
  }),
  build({
    folio: 1055,
    customerName: "Tomás Reyes",
    customerRut: "17.220.884-6",
    customerEmail: "tomas.reyes@gmail.com",
    customerPhone: "+56 9 8890 1234",
    fulfillment: "retiro",
    comuna: "Limache",
    payment: "webpay",
    status: "pendiente",
    createdAt: "2026-06-09T15:05:00",
    items: [
      { name: 'Juego de cartas "Do Fuck"', qty: 1, price: 9900 },
      { name: "Dados Love Dice", qty: 1, price: 6000 },
    ],
    shipping: 0,
  }),
  build({
    folio: 1056,
    customerName: "Francisca Olivares",
    customerRut: "19.001.552-8",
    customerEmail: "fran.olivares@gmail.com",
    customerPhone: "+56 9 6612 7788",
    fulfillment: "despacho",
    address: "Av. San Martín 670",
    comuna: "Viña del Mar",
    payment: "webpay",
    status: "cancelado",
    createdAt: "2026-06-06T18:00:00",
    items: [{ name: "Set antifaz / máscara premium", qty: 1, price: 17000 }],
    shipping: 3990,
    notes: "Cliente canceló: se arrepintió de la compra.",
  }),
];
