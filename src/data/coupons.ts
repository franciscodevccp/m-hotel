import type { Coupon } from "@/types";

// Cupones de descuento de la tienda online. Datos determinísticos.
export const SEED_COUPONS: Coupon[] = [
  {
    id: "cp-bienvenida10",
    code: "BIENVENIDA10",
    type: "porcentaje",
    value: 10,
    minPurchase: 0,
    active: true,
    uses: 23,
  },
  {
    id: "cp-enviogratis",
    code: "ENVIOGRATIS",
    type: "envio_gratis",
    value: 0,
    minPurchase: 25000,
    active: true,
    uses: 41,
  },
  {
    id: "cp-verano15",
    code: "VERANO15",
    type: "porcentaje",
    value: 15,
    minPurchase: 30000,
    active: true,
    uses: 8,
  },
  {
    id: "cp-m5000",
    code: "M5000",
    type: "monto",
    value: 5000,
    minPurchase: 20000,
    active: false,
    uses: 12,
  },
];
