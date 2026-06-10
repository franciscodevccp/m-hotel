"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import type { AdminArea, Role } from "@/types";

interface NavLink {
  href: string;
  label: string;
  roles: Role[];
}

interface NavGroup {
  title: string;
  links: NavLink[];
}

const BOTH: Role[] = ["recepcion", "admin"];
const ADMIN: Role[] = ["admin"];
// Encargado: como admin pero acotado — operación básica e inventario, sin caja,
// precios, reportes ni configuración.
const STAFF: Role[] = ["recepcion", "admin", "encargado"];
const STOCK: Role[] = ["encargado", "admin"];

// Área Motel: operación del recinto. Recepción ve un subconjunto (sin precios,
// reportes ni configuración).
const MOTEL_GROUPS: NavGroup[] = [
  {
    title: "Operación",
    links: [
      { href: "/admin", label: "Dashboard", roles: STAFF },
      { href: "/admin/habitaciones", label: "Habitaciones", roles: STAFF },
      { href: "/admin/reservas", label: "Reservas", roles: STAFF },
      { href: "/admin/caja", label: "Caja y turnos", roles: BOTH },
      { href: "/admin/room-service", label: "Room service", roles: STAFF },
      { href: "/admin/limpieza", label: "Limpieza", roles: STAFF },
      { href: "/admin/lavanderia", label: "Lavandería", roles: STAFF },
      { href: "/admin/blancos", label: "Blancos", roles: STAFF },
      { href: "/admin/anomalias", label: "Anomalías", roles: STAFF },
      { href: "/admin/cuentas", label: "Cuentas por cobrar", roles: BOTH },
    ],
  },
  {
    title: "Inventario",
    links: [
      { href: "/admin/compras", label: "Ingreso de stock", roles: STOCK },
      { href: "/admin/inventario", label: "Productos y stock", roles: STAFF },
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
    links: [
      { href: "/admin/configuracion", label: "Configuración", roles: ADMIN },
      { href: "/admin/auditoria", label: "Auditoría", roles: ADMIN },
    ],
  },
];

// Área Tienda online: inventario y precios del sexshop, separados del motel.
const TIENDA_GROUPS: NavGroup[] = [
  {
    title: "Tienda online",
    links: [
      { href: "/admin/tienda", label: "Resumen", roles: ADMIN },
      { href: "/admin/pedidos", label: "Pedidos", roles: ADMIN },
      { href: "/admin/inventario", label: "Inventario y precios", roles: ADMIN },
      { href: "/admin/categorias", label: "Categorías", roles: ADMIN },
    ],
  },
  {
    title: "Crecimiento",
    links: [
      { href: "/admin/cupones", label: "Cupones", roles: ADMIN },
      { href: "/admin/clientes", label: "Clientes", roles: ADMIN },
      { href: "/admin/reportes-tienda", label: "Reportes", roles: ADMIN },
    ],
  },
  {
    title: "Configuración",
    links: [{ href: "/admin/configuracion-tienda", label: "Configuración", roles: ADMIN }],
  },
];

// Área del aseo: una sola cola de trabajo.
const ASEO_GROUPS: NavGroup[] = [
  {
    title: "Aseo",
    links: [
      { href: "/admin/aseo", label: "Mis habitaciones", roles: ["aseo"] },
      { href: "/admin/lavanderia", label: "Lavandería", roles: ["aseo"] },
      { href: "/admin/blancos", label: "Blancos", roles: ["aseo"] },
    ],
  },
];

const AREA_HOME: Record<AdminArea, string> = { motel: "/admin", tienda: "/admin/tienda" };

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, area, setArea, logout } = useSession();

  const isActive = (href: string) =>
    href === "/admin" || href === "/admin/tienda"
      ? pathname === href
      : pathname.startsWith(href);

  const baseGroups =
    user?.role === "aseo"
      ? ASEO_GROUPS
      : user?.role === "admin" && area === "tienda"
        ? TIENDA_GROUPS
        : MOTEL_GROUPS;

  const visibleGroups = baseGroups
    .map((group) => ({
      ...group,
      links: group.links.filter((link) => !user || link.roles.includes(user.role)),
    }))
    .filter((group) => group.links.length > 0);

  const flatLinks = visibleGroups.flatMap((group) => group.links);
  const initial = (user?.name ?? "M").charAt(0).toUpperCase();
  const isAdmin = user?.role === "admin";

  function signOut() {
    logout();
    router.push("/admin/login");
  }

  function switchArea(next: AdminArea) {
    setArea(next);
    router.push(AREA_HOME[next]);
  }

  const AreaSwitch = isAdmin ? (
    <div className="flex gap-1 rounded-sm border border-line bg-surface/60 p-1">
      {(["motel", "tienda"] as AdminArea[]).map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => switchArea(a)}
          className={cn(
            "flex-1 rounded-xs px-2 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] transition-colors",
            area === a ? "bg-gold text-bg" : "text-muted hover:text-cream",
          )}
        >
          {a === "motel" ? "Motel" : "Tienda"}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-surface/50 lg:flex">
        <div className="px-6 pt-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl text-cream">M</span>
            <span className="kicker text-dim">Panel</span>
          </div>
        </div>

        {isAdmin && <div className="mt-4 px-4">{AreaSwitch}</div>}

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
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl text-cream">M</span>
            <span className="kicker text-dim">{user?.roleLabel ?? "Panel"}</span>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="text-xs uppercase tracking-[0.16em] text-dim"
          >
            Salir
          </button>
        </div>
        {isAdmin && <div className="px-3 pb-2">{AreaSwitch}</div>}
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
