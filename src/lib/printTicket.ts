import { formatCLP } from "@/lib/format";

// Impresión de comandas en impresora térmica de 80 mm (Epson TM-T20 o similar).
// La maqueta imprime por el diálogo del sistema: el ticket se abre en una
// ventana con formato de 80 mm y el navegador lo manda a la impresora que el
// usuario elija. Si la térmica está instalada en Windows, sale directo de ahí.
// (En producción se puede sumar impresión silenciosa vía ESC/POS o un agente
// local tipo QZ Tray; el formato del ticket es el mismo.)

/** Línea de la comanda: cantidad, nombre y monto (null = sin cobro). */
export interface TicketLine {
  qty: number;
  name: string;
  amount: number | null;
  /** Texto que reemplaza el monto cuando amount es null (default "Cortesía"). */
  tag?: string;
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
        <span class="amt">${l.amount == null ? esc(l.tag ?? "Cortesía") : formatCLP(l.amount)}</span>
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

/** Línea de la guía de despacho: solicitado vs entregado por producto. */
export interface GuiaLine {
  name: string;
  requested: number;
  delivered: number;
}

export interface SolicitudData {
  id: string;
  from: string; // nombre de bodega de origen
  to: string; // nombre de bodega de destino
  at: string; // fecha/hora de la solicitud, ya formateada
  requestedBy: string;
  lines: { name: string; requested: number }[];
  note?: string;
}

/**
 * Vale de solicitud de reposición (cuerpo, sin <html>): el papel que el
 * bodeguero lleva a la bodega central para preparar el pedido. Lleva casilla
 * para marcar cada línea y espacio para anotar a mano lo entregado; el folio
 * de guía se asigna al registrar la entrega en el sistema.
 */
export function solicitudHtml(data: SolicitudData): string {
  const lines = data.lines
    .map(
      (l) => `
      <div class="row">
        <span class="name"><span class="chk"></span>${l.requested}&times; ${esc(l.name)}</span>
        <span class="amt">Entreg. ____</span>
      </div>`,
    )
    .join('<div class="sep-soft"></div>');

  return `
    <div class="center">
      <p class="brand">M MOTEL</p>
      <p>Av. Palmira Romano Sur 196-A · Limache</p>
      <p class="big">SOLICITUD DE REPOSICIÓN</p>
      <p class="banner">${esc(data.id.toUpperCase())}</p>
    </div>
    <div class="sep"></div>
    <div class="row"><span>${esc(data.from)}</span><span>&rarr;</span><span>${esc(data.to)}</span></div>
    <p>Solicitada: ${esc(data.at)}</p>
    <p>Solicita: ${esc(data.requestedBy)}</p>
    <div class="sep"></div>
    ${lines}
    <div class="sep"></div>
    <p>Prepara y entrega: ________________________</p>
    <p>Recibe conforme: ________________________</p>
    ${data.note ? `<div class="sep"></div><p>Nota: ${esc(data.note)}</p>` : ""}
    <div class="sep"></div>
    <p class="center">Marcar cada línea al preparar. El folio de guía de despacho se asigna al registrar la entrega en el sistema.</p>
  `;
}

export interface GuiaData {
  folio: number;
  from: string; // nombre de bodega de origen
  to: string; // nombre de bodega de destino
  at: string; // fecha/hora de entrega, ya formateada
  requestedBy: string;
  deliveredBy: string;
  receivedBy?: string;
  lines: GuiaLine[];
  note?: string;
}

/** HTML interno de la guía interna de despacho (cuerpo, sin <html>). */
export function guiaHtml(data: GuiaData): string {
  const pendingTotal = data.lines.reduce((s, l) => s + Math.max(0, l.requested - l.delivered), 0);
  const lines = data.lines
    .map((l) => {
      const pending = Math.max(0, l.requested - l.delivered);
      return `
      <div class="row"><span class="name">${esc(l.name)}</span></div>
      <div class="row cols">
        <span>Solicitado ${l.requested}</span>
        <span>Entregado ${l.delivered}</span>
        <span>${pending > 0 ? `Pendiente ${pending}` : "Completo"}</span>
      </div>`;
    })
    .join('<div class="sep-soft"></div>');

  return `
    <div class="center">
      <p class="brand">M MOTEL</p>
      <p>Av. Palmira Romano Sur 196-A · Limache</p>
      <p class="big">GUÍA INTERNA DE DESPACHO</p>
      <p class="banner">FOLIO N° ${data.folio}</p>
    </div>
    <div class="sep"></div>
    <div class="row"><span>${esc(data.from)}</span><span>&rarr;</span><span>${esc(data.to)}</span></div>
    <p>Entrega: ${esc(data.at)}</p>
    <div class="sep"></div>
    ${lines}
    <div class="sep"></div>
    <div class="row total"><span>SALDO PENDIENTE</span><span>${pendingTotal > 0 ? `${pendingTotal} un.` : "—"}</span></div>
    <div class="sep"></div>
    <p>Solicita: ${esc(data.requestedBy)}</p>
    <p>Entrega: ${esc(data.deliveredBy)}</p>
    <p>Recibe: ${data.receivedBy ? esc(data.receivedBy) : "________________________"}</p>
    ${data.note ? `<div class="sep"></div><p>Nota: ${esc(data.note)}</p>` : ""}
    <div class="sep"></div>
    <p class="center">Documento interno de control de bodegas.</p>
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
  .sep-soft { margin: 4px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row.cols { gap: 4px; font-size: 11px; }
  .chk { display: inline-block; width: 9px; height: 9px; margin-right: 6px; border: 1px solid #000; vertical-align: baseline; }
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
