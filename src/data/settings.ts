import { SITE } from "@/lib/site";
import type { BlacklistEntry, StaffUser, VenueSettings } from "@/types";

// Ajustes por defecto, tomados de los datos reales del recinto.
export const DEFAULT_SETTINGS: VenueSettings = {
  name: SITE.name,
  address: SITE.address,
  city: SITE.city,
  phone: SITE.phone,
  whatsappDisplay: SITE.whatsappDisplay,
  ivaPercent: 19,
  notificationEmails: ["recepcion@mmotel.cl", "administracion@mmotel.cl"],
};

export const SEED_USERS: StaffUser[] = [
  { id: "u-1", name: "Ivon", role: "admin", active: true },
  { id: "u-2", name: "Recepción turno noche", role: "recepcion", active: true },
  { id: "u-3", name: "Recepción turno día", role: "recepcion", active: true },
];

export const SEED_BLACKLIST: BlacklistEntry[] = [
  { id: "b-1", name: "Cliente Hab. 207 (oct-2025)", reason: "Daños no pagados en la habitación." },
];
