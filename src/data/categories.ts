import type { Category } from "@/types";

// Las 5 categorías reales de M Motel con sus m² y tarifas por bloque.
// Valores 2026 tal cual del tarifario del cliente — no modificar montos.
export const CATEGORIES: Category[] = [
  {
    id: "standard-vip",
    name: "Standard VIP",
    shortName: "Standard VIP",
    area: 22,
    tagline: "Lo esencial, con buen gusto.",
    amenities: ["Cama king", "TV LED", "Wi-Fi", "Room service 24h", "Estacionamiento privado"],
    pricing: {
      weekday: { 3: 35000, 6: 50000, 12: 65000 },
      weekend: { 3: 40000, 6: 60000, 12: 80000 },
      extraHour: { weekday: 20000, weekend: 20000 },
      extraPerson: { weekday: 23000, weekend: 23000 },
    },
    image: null,
  },
  {
    id: "standard-black",
    name: "Standard Black",
    shortName: "Standard Black",
    area: 22,
    tagline: "El ambiente Black, sin jacuzzi.",
    amenities: ["Cama king", "TV LED", "Wi-Fi", "Room service 24h", "Estacionamiento privado", "Amenidades premium"],
    pricing: {
      weekday: { 3: 40000, 6: 55000, 12: 70000 },
      weekend: { 3: 45000, 6: 65000, 12: 85000 },
      extraHour: { weekday: 20000, weekend: 20000 },
      extraPerson: { weekday: 23000, weekend: 23000 },
    },
    image: null,
  },
  {
    id: "jacuzzi-vip",
    name: "Jacuzzi VIP",
    shortName: "Jacuzzi VIP",
    area: 22,
    tagline: "Jacuzzi privado para dos.",
    amenities: ["Jacuzzi privado", "Cama king", "TV LED", "Wi-Fi", "Room service 24h"],
    pricing: {
      weekday: { 3: 45000, 6: 75000, 12: 85000 },
      weekend: { 3: 50000, 6: 85000, 12: 95000 },
      extraHour: { weekday: 23000, weekend: 23000 },
      extraPerson: { weekday: 25000, weekend: 25000 },
    },
    image: null,
  },
  {
    id: "jacuzzi-premium",
    name: "Jacuzzi Premium",
    shortName: "Premium",
    area: 27,
    tagline: "Más espacio, misma intimidad.",
    amenities: ["Jacuzzi privado XL", "Cama king", "TV LED", "Wi-Fi", "Room service 24h", "Estacionamiento privado"],
    pricing: {
      weekday: { 3: 50000, 6: 80000, 12: 90000 },
      weekend: { 3: 55000, 6: 90000, 12: 115000 },
      extraHour: { weekday: 23000, weekend: 23000 },
      extraPerson: { weekday: 25000, weekend: 25000 },
    },
    image: null,
  },
  {
    id: "jacuzzi-black",
    name: "Jacuzzi Black",
    shortName: "Jacuzzi Black",
    area: 29,
    tagline: "Nuestra categoría más reservada.",
    amenities: ["Jacuzzi privado", "Cama king", "TV LED", "Wi-Fi", "Room service 24h", "Estacionamiento privado", "Amenidades premium"],
    pricing: {
      weekday: { 3: 55000, 6: 85000, 12: 105000 },
      weekend: { 3: 65000, 6: 100000, 12: 125000 },
      extraHour: { weekday: 23000, weekend: 23000 },
      extraPerson: { weekday: 25000, weekend: 25000 },
    },
    image: null,
  },
];
