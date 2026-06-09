"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { useSession } from "@/lib/session";
import type { Role } from "@/types";

const inputClass =
  "min-h-[48px] w-full rounded-sm border border-line bg-surface px-4 py-3 text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

const PROFILES: Record<Role, { user: string; password: string; desc: string }> = {
  recepcion: {
    user: "recepcion",
    password: "demo1234",
    desc: "Operación del turno: tablero de habitaciones, caja y reservas.",
  },
  admin: {
    user: "administrador",
    password: "demo1234",
    desc: "Todo lo de recepción, más los reportes de ocupación e ingresos.",
  },
  aseo: {
    user: "aseo",
    password: "demo1234",
    desc: "Limpieza: solo tus habitaciones por limpiar.",
  },
};

const ROLE_SEGMENTS: { value: Role; label: string }[] = [
  { value: "recepcion", label: "Recepción" },
  { value: "admin", label: "Admin" },
  { value: "aseo", label: "Aseo" },
];

const HOME: Record<Role, string> = {
  admin: "/admin",
  recepcion: "/admin/habitaciones",
  aseo: "/admin/aseo",
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [role, setRole] = useState<Role>("recepcion");
  const [user, setUser] = useState(PROFILES.recepcion.user);
  const [password, setPassword] = useState(PROFILES.recepcion.password);

  function selectRole(next: Role) {
    setRole(next);
    setUser(PROFILES[next].user);
    setPassword(PROFILES[next].password);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    login(role);
    // Cada rol aterriza en su home: admin → dashboard, recepción → tablero, aseo → su lista.
    router.push(HOME[role]);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="gold-glow absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-baseline justify-center gap-2">
          <span className="font-display text-3xl text-cream">M</span>
          <span className="kicker text-dim">Panel</span>
        </Link>
        <h1 className="mt-8 text-center font-display text-2xl text-cream">Acceso al panel</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Demostración. Elige un perfil para ver su panel.
        </p>

        <div className="mt-7">
          <SegmentedToggle
            segments={ROLE_SEGMENTS}
            value={role}
            onChange={selectRole}
            className="w-full"
          />
          <p className="mt-3 min-h-[2.5rem] text-center text-xs leading-relaxed text-dim">
            {PROFILES[role].desc}
          </p>
        </div>

        <form onSubmit={submit} className="mt-3 space-y-4">
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="Usuario"
            autoComplete="username"
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            className={inputClass}
          />
          <Button type="submit" className="w-full">
            Entrar como {role === "admin" ? "administración" : role === "aseo" ? "aseo" : "recepción"}
          </Button>
        </form>
      </div>
    </div>
  );
}
