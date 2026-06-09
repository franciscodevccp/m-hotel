"use client";

import type { ReactNode } from "react";
import { ingresosTotales } from "@/lib/cash";
import { formatCLP } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="border border-line bg-surface/40 p-4">
      <p className="kicker text-dim">{label}</p>
      <p className={cn("tnum mt-2 font-display text-2xl", accent ? "text-gold" : "text-cream")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-dim">{hint}</p>}
    </div>
  );
}

/** Resumen del turno para recepción: solo lo suyo, sin analítica del negocio. */
export function ReceptionTurnBar() {
  const { user } = useSession();
  const { rooms, shift, transactions, roomService } = useAppStore();

  if (!user || user.role !== "recepcion") return null;

  const ocupadas = rooms.filter((r) => r.status === "occupied").length;
  const disponibles = rooms.filter((r) => r.status === "available").length;
  const pedidos = roomService.filter((o) => o.status === "preparando").length;

  return (
    <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label="Ocupación"
        value={`${ocupadas}/${rooms.length}`}
        hint={`${disponibles} disponibles`}
      />
      <Stat label="Cobros del turno" value={transactions.length} hint="pagos registrados" />
      <Stat label="Cobrado en el turno" value={formatCLP(ingresosTotales(shift))} accent />
      <Stat label="Pedidos pendientes" value={pedidos} hint="room service" />
    </div>
  );
}
