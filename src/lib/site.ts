// Datos reales del negocio. Única fuente para copy de header, footer y WhatsApp.

export const SITE = {
  name: "M Motel",
  brand: "M",
  city: "Limache",
  region: "Región de Valparaíso",
  address: "Av. Palmira Romano Sur 196-A",
  // Número en formato internacional sin signos, para el link wa.me.
  whatsapp: "56940576201",
  whatsappDisplay: "+56 9 4057 6201",
  phone: "+56 33 251 0695",
  rating: 4.3,
  reviews: 198,
  rooms: 20,
  // Enlace directo a la ficha del lugar en Google Maps: muestra la dirección exacta
  // sin pedir la ubicación del usuario (no son indicaciones, es el lugar).
  mapsUrl:
    "https://www.google.com/maps/place/m+motel+limache/data=!4m2!3m1!1s0x9689d56a2ad85cf9:0x6f828affcd0abf4e",
} as const;
