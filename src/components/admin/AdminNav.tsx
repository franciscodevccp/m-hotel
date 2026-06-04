"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/habitaciones", label: "Habitaciones" },
  { href: "/admin/caja", label: "Caja y turnos" },
  { href: "/admin/reservas", label: "Reservas" },
  { href: "/admin/reportes", label: "Reportes" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface/50 px-6 py-8 lg:flex">
        <Link href="/admin" className="flex items-baseline gap-2">
          <span className="font-display text-2xl text-cream">M</span>
          <span className="kicker text-dim">Panel</span>
        </Link>
        <nav className="mt-12 flex flex-col gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-sm px-3 py-2.5 text-sm transition-colors",
                isActive(link.href) ? "bg-surface-2 text-gold" : "text-muted hover:text-cream",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-line pt-5">
          <p className="text-sm text-cream">Recepción</p>
          <p className="kicker text-dim">Turno noche</p>
          <Link
            href="/admin/login"
            className="mt-3 inline-block text-xs uppercase tracking-[0.16em] text-dim transition-colors hover:text-muted"
          >
            Salir
          </Link>
        </div>
      </aside>

      {/* Topbar — mobile */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-xl text-cream">M</span>
            <span className="kicker text-dim">Panel</span>
          </Link>
          <Link href="/admin/login" className="text-xs uppercase tracking-[0.16em] text-dim">
            Salir
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-sm px-3 py-1.5 text-xs transition-colors",
                isActive(link.href) ? "bg-surface-2 text-gold" : "text-muted",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
