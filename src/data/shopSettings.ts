import { SITE } from "@/lib/site";
import type { ShopSettings } from "@/types";

// Ajustes por defecto de la tienda online (sexshop). Determinístico.
export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  storeName: "M Sexshop",
  contactEmail: "tienda@mmotel.cl",
  whatsapp: SITE.whatsappDisplay,
  shippingCost: 3990,
  freeShippingThreshold: 25000,
  pickupAddress: `${SITE.address}, ${SITE.city}`,
  shippingComunas: [
    "Limache",
    "Olmué",
    "Quillota",
    "La Calera",
    "Quilpué",
    "Villa Alemana",
    "Viña del Mar",
    "Valparaíso",
  ],
  payments: { webpay: true, transferencia: true, efectivo: true },
  ageNotice: true,
  storeOnline: true,
  notificationEmails: ["pedidos@mmotel.cl"],
};
