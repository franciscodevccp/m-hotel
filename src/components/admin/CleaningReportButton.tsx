"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { fmtDuration, formatDate, formatDateTime, formatTime } from "@/lib/format";
import { useAppStore } from "@/lib/store";
import type { CleaningLogEntry, Room } from "@/types";

// fmtDuration vive en @/lib/format; se reexporta para los consumidores existentes.
export { fmtDuration };

/** Botón + modal que genera y descarga el informe de limpiezas (PDF), filtrable por empleado. */
export function CleaningReportButton({
  entries,
  rooms,
  employees,
}: {
  entries: CleaningLogEntry[];
  rooms: Room[];
  employees: string[];
}) {
  const { settings } = useAppStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [employee, setEmployee] = useState("all");

  const roomNumber = (id: string) => rooms.find((r) => r.id === id)?.number ?? id;

  async function generate() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const list = [...entries]
        .filter((e) => employee === "all" || e.by === employee)
        .sort((a, b) => b.at.localeCompare(a.at));

      const withMin = list.filter((e) => e.minutes != null);
      const totalMin = withMin.reduce((s, e) => s + (e.minutes ?? 0), 0);
      const avgMin = withMin.length > 0 ? Math.round(totalMin / withMin.length) : 0;

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const left = 40;
      const right = pageW - left;

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
      doc.line(left, 62, right, 62);

      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.setTextColor(28, 26, 24);
      doc.text("Informe de limpiezas", left, 92);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(111, 104, 95);
      doc.text(`Generado ${formatDateTime(new Date())}`, left, 108);
      doc.setTextColor(90, 84, 76);
      doc.text(`Empleado: ${employee === "all" ? "Todos" : employee}`, left, 122);

      if (list.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(138, 131, 125);
        doc.text("No hay limpiezas registradas para este filtro.", left, 160);
      } else {
        autoTable(doc, {
          startY: 144,
          head: [["Habitación", "Empleado", "Fecha", "Hora", "Duración"]],
          body: list.map((e) => [
            `Habitación ${roomNumber(e.roomId)}`,
            e.by ?? "—",
            formatDate(new Date(e.at)),
            formatTime(new Date(e.at)),
            fmtDuration(e.minutes),
          ]),
          theme: "striped",
          margin: { left, right: left },
          styles: { fontSize: 9, cellPadding: 5, textColor: [28, 26, 24], lineColor: [235, 230, 221], lineWidth: 0.4 },
          headStyles: { fillColor: [201, 162, 74], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
          alternateRowStyles: { fillColor: [250, 247, 241] },
          columnStyles: { 4: { halign: "right" } },
        });

        const lat = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable;
        let y = (lat?.finalY ?? 200) + 30;
        if (y > pageH - 120) {
          doc.addPage();
          y = 60;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(138, 131, 125);
        doc.text("RESUMEN", left, y);
        y += 5;
        doc.setDrawColor(235, 230, 221);
        doc.setLineWidth(0.5);
        doc.line(left, y, right, y);
        y += 24;

        const summary: [string, string][] = [
          ["Total de limpiezas", String(list.length)],
          ["Tiempo promedio", fmtDuration(avgMin)],
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
        doc.text("Tiempo total", left, y);
        doc.setTextColor(201, 162, 74);
        doc.text(fmtDuration(totalMin), right, y, { align: "right" });
      }

      const now = new Date();
      const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      doc.save(`informe-limpiezas-${stamp}.pdf`);
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
        <Modal title="Informe de limpiezas" subtitle="Filtro del PDF" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim">Empleado</label>
              <Select
                value={employee}
                onValueChange={setEmployee}
                ariaLabel="Empleado"
                options={[
                  { value: "all", label: "Todos los empleados" },
                  ...employees.map((e) => ({ value: e, label: e })),
                ]}
              />
            </div>
            <Button className="w-full" onClick={generate} disabled={busy}>
              {busy ? "Generando…" : "Descargar PDF"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
