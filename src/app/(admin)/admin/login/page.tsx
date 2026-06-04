"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const inputClass =
  "min-h-[48px] w-full rounded-sm border border-line bg-surface px-4 py-3 text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/admin");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="gold-glow absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-baseline justify-center gap-2">
          <span className="font-display text-3xl text-cream">M</span>
          <span className="kicker text-dim">Panel</span>
        </Link>
        <h1 className="mt-8 text-center font-display text-2xl text-cream">Acceso al panel</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Demostración. Cualquier credencial te deja entrar.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
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
            Entrar al panel
          </Button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="mt-4 w-full text-center text-xs uppercase tracking-[0.16em] text-dim transition-colors hover:text-muted"
        >
          Entrar como administrador
        </button>
      </div>
    </div>
  );
}
