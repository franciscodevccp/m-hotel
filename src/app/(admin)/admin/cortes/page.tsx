"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CorteTicket } from "@/components/admin/CorteTicket";
import { ShiftSummary } from "@/components/admin/ShiftSummary";
import { shiftItems } from "@/lib/cash";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";

export default function CortesPage() {
  const { shift, products, movements } = useAppStore();
  const { user } = useSession();
  // Por ahora el corte itemiza solo la carta (room service); el sexshop se habilita luego.
  const items = useMemo(
    () => shiftItems(movements, products.filter((p) => p.category === "carta"), shift.id),
    [movements, products, shift.id],
  );

  // Los cortes son material de Administración.
  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Cortes de caja</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          El historial de cortes está disponible solo para el perfil de administración.
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
        <span className="kicker text-gold">Reportes</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Cortes de caja</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Corte del turno en curso, con el detalle que se imprime. Al cerrar un turno, su corte
          queda archivado en esta sección.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ShiftSummary shift={shift} />
        <div className="border border-line bg-surface/40 p-4">
          <CorteTicket shift={shift} items={items} />
        </div>
      </div>
    </div>
  );
}
