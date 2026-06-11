import { formatCLP } from "@/lib/format";

// Impresión de comandas en impresora térmica de 80 mm (Epson TM-T20 o similar).
// La maqueta imprime por el diálogo del sistema: el ticket se abre en una
// ventana con formato de 80 mm y el navegador lo manda a la impresora que el
// usuario elija. Si la térmica está instalada en Windows, sale directo de ahí.
// (En producción se puede sumar impresión silenciosa vía ESC/POS o un agente
// local tipo QZ Tray; el formato del ticket es el mismo.)

/** Línea de la comanda: cantidad, nombre y monto (null = cortesía sin cobro). */
export interface TicketLine {
  qty: number;
  name: string;
  amount: number | null;
}

export interface ComandaData {
  /** Aviso bajo el título, p. ej. "PRUEBA DE IMPRESORA". */
  banner?: string;
  room: string;
  at: string; // ya formateado
  user: string;
  lines: TicketLine[];
  total: number;
  notes?: string;
  footer?: string;
}

function esc(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** HTML interno del ticket de comanda (cuerpo, sin <html>). */
export function comandaHtml(data: ComandaData): string {
  const lines = data.lines
    .map(
      (l) => `
      <div class="row">
        <span class="name">${l.qty}&times; ${esc(l.name)}</span>
        <span class="amt">${l.amount == null ? "Cortesía" : formatCLP(l.amount)}</span>
      </div>`,
    )
    .join("");

  return `
    <div class="center">
      <p class="brand">M MOTEL</p>
      <p>Av. Palmira Romano Sur 196-A · Limache</p>
      <p class="big">COMANDA ROOM SERVICE</p>
      ${data.banner ? `<p class="banner">${esc(data.banner)}</p>` : ""}
    </div>
    <div class="sep"></div>
    <div class="row"><span>${esc(data.room)}</span><span>${esc(data.at)}</span></div>
    <p>Atiende: ${esc(data.user)}</p>
    <div class="sep"></div>
    ${lines}
    <div class="sep"></div>
    <div class="row total"><span>TOTAL A COBRAR</span><span>${formatCLP(data.total)}</span></div>
    ${data.notes ? `<div class="sep"></div><p>Nota: ${esc(data.notes)}</p>` : ""}
    ${data.footer ? `<div class="sep"></div><p class="center">${esc(data.footer)}</p>` : ""}
  `;
}

const TICKET_CSS = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    width: 72mm;
    margin: 0 auto;
    padding: 4mm;
    color: #000;
    font: 12px/1.45 "Courier New", ui-monospace, monospace;
  }
  p { margin: 0 0 2px; }
  .center { text-align: center; }
  .brand { font-size: 18px; font-weight: 700; letter-spacing: 2px; }
  .big { margin-top: 6px; font-size: 14px; font-weight: 700; }
  .banner { margin-top: 4px; padding: 2px 0; border: 1px solid #000; font-weight: 700; }
  .sep { margin: 6px 0; border-top: 1px dashed #000; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row .name { min-width: 0; }
  .row .amt { flex-shrink: 0; }
  .total { font-size: 14px; font-weight: 700; }
`;

/**
 * Abre el ticket en una ventana angosta y lanza la impresión del sistema.
 * Devuelve false si el navegador bloqueó la ventana emergente.
 */
export function printTicket(bodyHtml: string, title = "Comanda"): boolean {
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return false;
  win.document.open();
  win.document.write(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>${esc(title)}</title>
    <style>${TICKET_CSS}</style>
  </head>
  <body>
    ${bodyHtml}
    <script>
      window.onload = function () {
        window.focus();
        window.print();
        window.onafterprint = function () { window.close(); };
      };
    </script>
  </body>
</html>`);
  win.document.close();
  return true;
}
