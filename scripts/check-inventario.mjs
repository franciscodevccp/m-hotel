// Chequeo de integridad del catálogo real (uso único en desarrollo).
// Lee los archivos de datos como texto y valida conteos, duplicados y alias.
import { readFileSync } from "node:fs";

const files = [
  "src/data/inventario/cocina.ts",
  "src/data/inventario/tienda.ts",
  "src/data/inventario/habitacion.ts",
];

const items = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const matches = [...text.matchAll(/\{\s*barcode:\s*"([^"]+)"[^}]*?family:\s*"([^"]+)"[^}]*?total:\s*(-?\d+)[^}]*?price:\s*(\d+)/gs)];
  for (const m of matches) {
    items.push({ barcode: m[1], family: m[2], total: Number(m[3]), price: Number(m[4]), file });
  }
}

console.log("Total ítems:", items.length);
const byFamily = {};
for (const it of items) byFamily[it.family] = (byFamily[it.family] ?? 0) + 1;
console.log("Por familia:", JSON.stringify(byFamily));

const seen = new Map();
const dups = [];
for (const it of items) {
  if (seen.has(it.barcode)) dups.push(it.barcode);
  seen.set(it.barcode, it);
}
console.log("Barcodes duplicados:", dups.length ? dups.join(", ") : "ninguno");

const negatives = items.filter((it) => it.total < 0);
console.log("Stocks negativos (a regularizar):", negatives.length);

const zeroPriceVenta = items.filter((it) => it.family !== "insumo" && it.price === 0);
console.log(
  "Vendibles con precio 0:",
  zeroPriceVenta.length ? zeroPriceVenta.map((i) => i.barcode).join(", ") : "ninguno",
);

// Alias de products.ts: todos deben existir en el catálogo.
const productsText = readFileSync("src/data/products.ts", "utf8");
const aliasBarcodes = [...productsText.matchAll(/":\s*"(\d+)"/g)].map((m) => m[1]);
const missing = aliasBarcodes.filter((b) => !seen.has(b));
console.log(
  "Alias sin producto:",
  missing.length ? missing.join(", ") : "ninguno",
);

// Exclusiones que NO deben estar.
const excluded = ["DDD999DDD", "9876543210897", "9876543210901", "9876543210909", "9876543210910", "9876543210920", "9876543210942", "22100027307", "22200014610", "444001041103"];
const leaked = excluded.filter((b) => seen.has(b));
console.log("Exclusiones filtradas:", leaked.length ? "FUGA: " + leaked.join(", ") : "correcto");
