"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { PRODUCT_SALES_30D } from "@/data/history";
import { centralOf, totalOf } from "@/lib/inventory";
import { formatCLP, formatDateTime } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { Product, ProductCategory } from "@/types";

const FAMILY_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "Todo el recinto" },
  { value: "carta", label: "Carta / room service" },
  { value: "sexshop", label: "Sexshop" },
  { value: "insumo", label: "Insumos" },
];

const SCOPE_OPTIONS = [
  { value: "total", label: "Recepción + central" },
  { value: "recepcion", label: "Solo recepción" },
  { value: "central", label: "Solo bodega central" },
];

const STOCK_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "low", label: "Stock bajo" },
  { value: "out", label: "Agotados" },
  { value: "in", label: "En stock" },
];

const MOVEMENT_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "con", label: "Con ventas (30 d)" },
  { value: "sin", label: "Sin ventas (30 d)" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Nombre (A–Z)" },
  { value: "stock-asc", label: "Stock: menor a mayor" },
  { value: "stock-desc", label: "Stock: mayor a menor" },
  { value: "price-asc", label: "Precio: menor a mayor" },
  { value: "price-desc", label: "Precio: mayor a menor" },
  { value: "value-desc", label: "Valor en stock: mayor a menor" },
];

/** Saldo del producto según la bodega elegida para el informe. */
function scopeStock(p: Product, scope: string): number {
  if (scope === "recepcion") return p.stock;
  if (scope === "central") return centralOf(p);
  return totalOf(p);
}

/** Precio unitario del informe: los insumos se valorizan al costo. */
function unitValue(p: Product): number {
  return p.category === "insumo" ? (p.cost ?? 0) : p.price;
}

function stockState(p: Product, scope: string): "out" | "low" | "ok" {
  const saldo = scopeStock(p, scope);
  if (saldo === 0) return "out";
  if (saldo <= p.lowStockThreshold) return "low";
  return "ok";
}
const STATE_LABEL = { out: "Agotado", low: "Stock bajo", ok: "En stock" };

/** Botón + modal de filtros que genera y descarga un informe de stock en PDF. */
export function StockReportButton({
  products,
  initialFamily,
}: {
  products: Product[];
  initialFamily: ProductCategory;
}) {
  const { settings } = useAppStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [family, setFamily] = useState<string>(initialFamily);
  const [group, setGroup] = useState("all");
  const [scope, setScope] = useState("total");
  const [stock, setStock] = useState("all");
  const [movement, setMovement] = useState("all");
  const [sort, setSort] = useState("name");
  const [onlyActive, setOnlyActive] = useState(true);

  // Las sub-categorías disponibles dependen de la familia elegida.
  const groups = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) {
      if (family !== "all" && p.category !== family) continue;
      if (p.group && !seen.includes(p.group)) seen.push(p.group);
    }
    return seen.sort((a, b) => a.localeCompare(b, "es"));
  }, [products, family]);

  function selectFamily(next: string) {
    setFamily(next);
    setGroup("all");
  }

  async function generate() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      let list = products.filter((p) => (onlyActive ? p.active : true));
      if (family !== "all") list = list.filter((p) => p.category === family);
      if (group !== "all") list = list.filter((p) => (p.group ?? "") === group);
      if (stock !== "all") list = list.filter((p) => {
        const state = stockState(p, scope);
        return stock === "low" ? state === "low" : stock === "out" ? state === "out" : state === "ok";
      });
      if (movement !== "all") {
        list = list.filter((p) => {
          if (p.category === "insumo") return movement === "all";
          const sales = PRODUCT_SALES_30D[p.id] ?? 0;
          return movement === "sin" ? sales === 0 : sales > 0;
        });
      }

      list = [...list].sort((a, b) => {
        switch (sort) {
          case "stock-asc":
            return scopeStock(a, scope) - scopeStock(b, scope);
          case "stock-desc":
            return scopeStock(b, scope) - scopeStock(a, scope);
          case "price-asc":
            return unitValue(a) - unitValue(b);
          case "price-desc":
            return unitValue(b) - unitValue(a);
          case "value-desc":
            return unitValue(b) * scopeStock(b, scope) - unitValue(a) * scopeStock(a, scope);
          default:
            return a.name.localeCompare(b.name, "es");
        }
      });

      const totalUnits = list.reduce((s, p) => s + scopeStock(p, scope), 0);
      const totalValue = list.reduce((s, p) => s + scopeStock(p, scope) * unitValue(p), 0);
      const familyLabel = FAMILY_OPTIONS.find((o) => o.value === family)?.label ?? family;
      const filtersSummary = [
        `Familia: ${familyLabel}`,
        `Categoría: ${group === "all" ? "Todas" : group}`,
        `Bodega: ${SCOPE_OPTIONS.find((o) => o.value === scope)?.label}`,
        `Stock: ${STOCK_OPTIONS.find((o) => o.value === stock)?.label}`,
        `Movimiento: ${MOVEMENT_OPTIONS.find((o) => o.value === movement)?.label}`,
        `Orden: ${SORT_OPTIONS.find((o) => o.value === sort)?.label}`,
        onlyActive ? "Solo activos" : "Incluye inactivos",
      ].join("   ·   ");

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const left = 40;

      // Encabezado de marca
      doc.setFont("times", "bold");
      doc.setFontSize(26);
      doc.setTextColor(201, 162, 74);
      doc.text("M", left, 52);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(138, 131, 125);
      doc.text(settings.name.toUpperCase(), left + 26, 50);
      doc.setDrawColor(201, 162, 74);
      doc.setLineWidth(1.5);
      doc.line(left, 62, pageW - left, 62);

      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.setTextColor(28, 26, 24);
      doc.text("Informe de stock", left, 92);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(111, 104, 95);
      doc.text(`Inventario · ${familyLabel}  ·  Generado ${formatDateTime(new Date())}`, left, 108);
      doc.setTextColor(90, 84, 76);
      doc.text(filtersSummary, left, 122, { maxWidth: pageW - left * 2 });

      if (list.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(138, 131, 125);
        doc.text("No hay productos para estos filtros.", left, 168);
      } else {
        const head = [
          ["Producto", "Categoría", "Precio unitario", "Recep.", "Central", "Total", "Estado", "Valor en stock"],
        ];
        const body = list.map((p) => {
          const unit = unitValue(p);
          const central = centralOf(p);
          return [
            p.name + (p.ageRestricted ? "  (+18)" : ""),
            p.group ?? "-",
            formatCLP(unit),
            String(p.stock),
            String(central),
            String(p.stock + central),
            STATE_LABEL[stockState(p, scope)],
            formatCLP(unit * scopeStock(p, scope)),
          ];
        });

        autoTable(doc, {
          startY: 150,
          head,
          body,
          theme: "striped",
          margin: { left, right: left },
          styles: {
            fontSize: 9,
            cellPadding: 5,
            textColor: [28, 26, 24],
            lineColor: [235, 230, 221],
            lineWidth: 0.4,
          },
          headStyles: {
            fillColor: [201, 162, 74],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: [250, 247, 241] },
          columnStyles: {
            2: { halign: "right" },
            3: { halign: "right", cellWidth: 38 },
            4: { halign: "right", cellWidth: 40 },
            5: { halign: "right", cellWidth: 36 },
            7: { halign: "right" },
          },
          didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 6) {
              const raw = String(data.cell.raw);
              if (raw === "Agotado") {
                data.cell.styles.textColor = [163, 39, 28];
                data.cell.styles.fontStyle = "bold";
              } else if (raw === "Stock bajo") {
                data.cell.styles.textColor = [178, 90, 78];
                data.cell.styles.fontStyle = "bold";
              }
            }
          },
        });

        // Resumen de totales, separado y debajo de la tabla.
        const pageH = doc.internal.pageSize.getHeight();
        const lat = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
        let y = (lat?.finalY ?? 200) + 30;
        if (y > pageH - 130) {
          doc.addPage();
          y = 60;
        }
        const right = pageW - left;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(138, 131, 125);
        doc.text("RESUMEN", left, y);
        y += 5;
        doc.setDrawColor(235, 230, 221);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);
        y += 24;

        const scopeLabel = SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? "";
        const summary: [string, string][] = [
          ["Total de productos", String(list.length)],
          [`Total de stock (${scopeLabel.toLowerCase()})`, `${totalUnits} unidades`],
        ];
        doc.setFontSize(10);
        for (const [label, value] of summary) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(90, 84, 76);
          doc.text(label, left, y);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(28, 26, 24);
          doc.text(value, right, y, { align: "right" });
          y += 20;
        }

        y += 4;
        doc.setDrawColor(201, 162, 74);
        doc.setLineWidth(0.9);
        doc.line(left, y, right, y);
        y += 24;
        doc.setFont("times", "bold");
        doc.setFontSize(13);
        doc.setTextColor(28, 26, 24);
        doc.text("Total valor de stock", left, y);
        doc.setTextColor(201, 162, 74);
        doc.text(formatCLP(totalValue), right, y, { align: "right" });
      }

      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      doc.save(`informe-stock-${stamp}.pdf`);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Descargar informe
      </Button>

      {open && (
        <Modal title="Informe de stock" subtitle="Filtros del PDF" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim">Familia</label>
                <Select
                  value={family}
                  onValueChange={selectFamily}
                  ariaLabel="Familia"
                  options={FAMILY_OPTIONS}
                />
              </div>
              <div>
                <label className="kicker text-dim">Categoría</label>
                <Select
                  value={group}
                  onValueChange={setGroup}
                  ariaLabel="Categoría"
                  options={[
                    { value: "all", label: "Todas las categorías" },
                    ...groups.map((g) => ({ value: g, label: g })),
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim">Bodega a evaluar</label>
                <Select value={scope} onValueChange={setScope} ariaLabel="Bodega" options={SCOPE_OPTIONS} />
              </div>
              <div>
                <label className="kicker text-dim">Nivel de stock</label>
                <Select value={stock} onValueChange={setStock} ariaLabel="Nivel de stock" options={STOCK_OPTIONS} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="kicker text-dim">Movimiento (30 d)</label>
                <Select
                  value={movement}
                  onValueChange={setMovement}
                  ariaLabel="Movimiento"
                  options={MOVEMENT_OPTIONS}
                />
              </div>
              <div>
                <label className="kicker text-dim">Ordenar por</label>
                <Select value={sort} onValueChange={setSort} ariaLabel="Ordenar por" options={SORT_OPTIONS} />
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 pt-1">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="size-4 accent-gold"
              />
              <span className="text-sm text-muted">Solo productos activos</span>
            </label>

            <p className="text-xs leading-relaxed text-dim">
              El nivel de stock, el orden y los totales se calculan sobre la bodega elegida. Los
              insumos se valorizan al costo; el resto, a precio de venta.
            </p>

            <Button className="w-full" onClick={generate} disabled={busy}>
              {busy ? "Generando…" : "Descargar PDF"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
