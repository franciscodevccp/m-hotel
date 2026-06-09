import type { Discount, Promotion } from "@/types";

export const SEED_DISCOUNTS: Discount[] = [
  {
    id: "d-01",
    name: "Descuento entre semana",
    type: "porcentaje",
    value: 10,
    scope: "Bloques de lunes a jueves",
    active: true,
  },
  {
    id: "d-02",
    name: "Cliente frecuente",
    type: "monto",
    value: 5000,
    scope: "A partir de la quinta visita",
    active: true,
  },
];

export const SEED_PROMOTIONS: Promotion[] = [
  {
    id: "promo-01",
    name: "Noche BLACK",
    description: "Categoría BLACK 12h al precio de 6h, solo los domingos.",
    startsAt: "2026-06-01",
    endsAt: "2026-06-30",
    active: true,
  },
  {
    id: "promo-02",
    name: "Happy hour minibar",
    description: "20% en bebestibles antes de medianoche.",
    startsAt: "2026-06-01",
    endsAt: "2026-07-15",
    active: false,
  },
];
