"use client";

import Link from "next/link";
import { useState } from "react";
import QRCode from "qrcode";
import { ROOM_STATUS } from "@/components/admin/roomStatus";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getCategory } from "@/lib/pricing";
import { roomQrPayload } from "@/lib/roomQr";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { CategoryId, Room } from "@/types";

const CATEGORY_BADGE: Record<CategoryId, string> = {
  standard: "border-line-strong bg-surface/70 text-muted",
  "vip-jacuzzi": "border-gold/60 bg-gold/10 text-gold",
  "jacuzzi-premium": "border-wine/60 bg-wine/10 text-wine-soft",
  black: "border-gold/70 bg-[#181410] text-gold",
};

export default function QrHabitacionesPage() {
  const { rooms } = useAppStore();
  const { user } = useSession();
  const [selected, setSelected] = useState<Room | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function generate(room: Room) {
    setBusyId(room.id);
    try {
      // Negro sobre blanco a propósito: estos códigos se imprimen y se pegan
      // en cada habitación; el contraste máximo asegura la lectura.
      const url = await QRCode.toDataURL(roomQrPayload(room.number), {
        width: 560,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrUrl(url);
      setSelected(room);
    } finally {
      setBusyId(null);
    }
  }

  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">QR de habitaciones</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          La generación de códigos QR está disponible solo para administración.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Configuración</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">QR de habitaciones</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Un código por habitación, para imprimir y pegar en cada pieza. El personal de aseo lo
          escanea desde su perfil para iniciar el aseo: queda registrado quién lo hizo y cuánto
          demoró, sin talonarios de papel.
        </p>
      </div>

      <div className="border border-line bg-surface/40">
        <div className="hidden grid-cols-[90px_minmax(0,1fr)_150px_170px] gap-4 border-b border-line px-5 py-3 sm:grid">
          <span className="kicker text-dim">Pieza</span>
          <span className="kicker text-dim">Categoría</span>
          <span className="kicker text-dim">Estado</span>
          <span className="kicker text-right text-dim">Código</span>
        </div>
        <ul>
          {rooms.map((room) => {
            const category = getCategory(room.categoryId);
            const status = ROOM_STATUS[room.status];
            return (
              <li
                key={room.id}
                className="grid grid-cols-2 items-center gap-2 border-b border-line px-5 py-3.5 last:border-b-0 sm:grid-cols-[90px_minmax(0,1fr)_150px_170px] sm:gap-4"
              >
                <span className="tnum font-display text-xl text-cream">{room.number}</span>
                <span
                  className={cn(
                    "justify-self-start rounded-xs border px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.1em]",
                    CATEGORY_BADGE[room.categoryId],
                  )}
                >
                  {category.shortName}
                </span>
                <span className={cn("text-sm", status.text)}>{status.label}</span>
                <span className="col-span-2 sm:col-span-1 sm:justify-self-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busyId === room.id}
                    onClick={() => generate(room)}
                  >
                    {busyId === room.id ? "Generando…" : "Generar QR"}
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-dim">
        El código contiene solo el identificador de la pieza. Únicamente los perfiles de aseo
        pueden iniciarle un aseo al escanearlo.
      </p>

      {selected && qrUrl && (
        <Modal
          title={`Habitación ${selected.number}`}
          subtitle={`QR de aseo · ${getCategory(selected.categoryId).shortName}`}
          onClose={() => {
            setSelected(null);
            setQrUrl(null);
          }}
        >
          <div className="space-y-4">
            <div className="mx-auto w-full max-w-[280px] border border-line bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element -- dataURL generada en el cliente */}
              <img src={qrUrl} alt={`Código QR de la habitación ${selected.number}`} className="w-full" />
              <p className="tnum mt-2 text-center text-xs tracking-[0.2em] text-[#241f1a]">
                {roomQrPayload(selected.number)}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-dim">
              Imprímelo y pégalo dentro de la habitación. Al escanearlo, el aseo se inicia a
              nombre del usuario que lo escaneó y el tiempo empieza a correr.
            </p>
            <a href={qrUrl} download={`qr-habitacion-${selected.number}.png`} className="block">
              <Button className="w-full">Descargar PNG</Button>
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
