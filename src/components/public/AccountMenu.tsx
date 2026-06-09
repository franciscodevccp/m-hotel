"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useVisitor } from "@/lib/visitor";

const itemClass =
  "block w-full rounded-xs px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-cream";

/** Logo/identidad del cliente registrado con menú: reservas, pedidos, salir. */
export function AccountMenu() {
  const { visitor, signOut } = useVisitor();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (visitor?.mode !== "registered") return null;

  const name = visitor.name ?? "Cliente";
  const initial = name.charAt(0).toUpperCase();
  const first = name.split(" ")[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2"
      >
        <span className="flex size-9 items-center justify-center rounded-full border border-gold/50 bg-surface-2 font-display text-sm leading-none text-gold">
          {initial}
        </span>
        <span className="hidden text-sm text-cream sm:inline">{first}</span>
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="hidden size-3.5 text-dim sm:block"
          aria-hidden
        >
          <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-60 border border-line-strong bg-surface-2 p-1 shadow-2xl shadow-black/40">
          <div className="border-b border-line px-3 py-3">
            <p className="text-sm text-cream">{name}</p>
            {visitor.email && <p className="truncate text-xs text-dim">{visitor.email}</p>}
          </div>
          <div className="py-1">
            <Link href="/cuenta#reservas" onClick={() => setOpen(false)} className={itemClass}>
              Mis reservas
            </Link>
            <Link href="/cuenta#pedidos" onClick={() => setOpen(false)} className={itemClass}>
              Mis pedidos
            </Link>
            <Link href="/reservar" onClick={() => setOpen(false)} className={itemClass}>
              Reservar
            </Link>
          </div>
          <div className="border-t border-line py-1">
            <button
              type="button"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className={`${itemClass} hover:text-busy`}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
