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
  // Coordenadas aproximadas para el enlace "cómo llegar".
  mapsQuery: "Av. Palmira Romano Sur 196-A, Limache",
} as const;
