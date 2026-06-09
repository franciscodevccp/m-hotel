"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

interface NavLink {
  href: string;
  label: string;
  roles: Role[];
}

const BOTH: Role[] = ["recepcion", "admin"];
const ADMIN: Role[] = ["admin"];

// Menú organizado como el del software actual: Operación, Inventario, Precios,
// Reportes y Configuración. Recepción no ve precios, reportes ni configuración.
const GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Aseo",
    links: [
      { href: "/admin/aseo", label: "Mis habitaciones", roles: ["aseo"] },
      { href: "/admin/lavanderia", label: "Lavandería", roles: ["aseo"] },
    ],
  },
  {
    title: "Operación",
    links: [
      { href: "/admin", label: "Dashboard", roles: BOTH },
      { href: "/admin/habitaciones", label: "Habitaciones", roles: BOTH },
      { href: "/admin/reservas", label: "Reservas", roles: BOTH },
      { href: "/admin/caja", label: "Caja y turnos", roles: BOTH },
      { href: "/admin/room-service", label: "Room service", roles: BOTH },
      { href: "/admin/limpieza", label: "Limpieza", roles: BOTH },
      { href: "/admin/lavanderia", label: "Lavandería", roles: BOTH },
      { href: "/admin/anomalias", label: "Anomalías", roles: BOTH },
      { href: "/admin/cuentas", label: "Cuentas por cobrar", roles: BOTH },
    ],
  },
  {
    title: "Inventario",
    links: [
      { href: "/admin/inventario", label: "Productos y stock", roles: BOTH },
      { href: "/admin/paquetes", label: "Paquetes", roles: ADMIN },
    ],
  },
  {
    title: "Precios",
    links: [{ href: "/admin/precios", label: "Precios y tarifas", roles: ADMIN }],
  },
  {
    title: "Reportes",
    links: [
      { href: "/admin/reportes", label: "Reportes y gráficas", roles: ADMIN },
      { href: "/admin/cortes", label: "Cortes de caja", roles: ADMIN },
    ],
  },
  {
    title: "Configuración",
    links: [{ href: "/admin/configuracion", label: "Configuración", roles: ADMIN }],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const visibleGroups = GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => !user || link.roles.includes(user.role)),
  })).filter((group) => group.links.length > 0);

  const flatLinks = visibleGroups.flatMap((group) => group.links);
  const initial = (user?.name ?? "M").charAt(0).toUpperCase();

  function signOut() {
    logout();
    router.push("/admin/login");
  }

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface/50 lg:flex">
        <div className="px-6 pt-5">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-2xl text-cream">M</span>
            <span className="kicker text-dim">Panel</span>
          </Link>
        </div>

        <nav className="mt-4 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="kicker px-2 text-dim">{group.title}</p>
              <div className="mt-1 flex flex-col gap-0.5">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-sm px-3 py-1.5 text-sm transition-colors",
                      isActive(link.href)
                        ? "bg-surface-2 text-gold"
                        : "text-muted hover:text-cream",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-surface-2 font-display text-base leading-none text-gold">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm text-cream">{user?.name ?? "Invitado"}</p>
              <p className="kicker mt-1 leading-snug text-dim">
                {user ? `${user.roleLabel} · ${user.context}` : "Sin sesión"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-3 w-full rounded-sm border border-line px-3 py-2 text-xs uppercase tracking-[0.16em] text-muted transition-colors hover:border-gold/50 hover:text-gold"
          >
            Salir
          </button>
        </div>
      </aside>

      {/* Topbar — mobile */}
      <div className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-display text-xl text-cream">M</span>
            <span className="kicker text-dim">{user?.roleLabel ?? "Panel"}</span>
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="text-xs uppercase tracking-[0.16em] text-dim"
          >
            Salir
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {flatLinks.map((link) => (
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
