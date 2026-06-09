"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/public/AccountMenu";
import { buttonStyles } from "@/components/ui/Button";
import { useVisitor } from "@/lib/visitor";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/#servicios", label: "Servicios" },
  { href: "/#experiencia", label: "Experiencia" },
  { href: "/carta", label: "Carta" },
  { href: "/sexshop", label: "Sexshop" },
];

export function SiteHeader() {
  const { visitor, signOut } = useVisitor();
  const registered = visitor?.mode === "registered";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Bloquea el scroll del fondo cuando el menú móvil está abierto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[60] border-b transition-colors duration-500",
          scrolled || open ? "border-line bg-bg/95 backdrop-blur-md" : "border-transparent",
        )}
      >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:h-20 sm:px-8">
        <div className="flex select-none items-baseline gap-2">
          <span className="font-display text-2xl leading-none tracking-tight text-cream">M</span>
          <span className="kicker hidden text-dim sm:inline">Motel</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-cream"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {registered ? (
            <AccountMenu />
          ) : (
            <Link
              href="/admin/login"
              className="hidden text-xs uppercase tracking-[0.16em] text-dim transition-colors hover:text-muted sm:inline"
            >
              Acceso
            </Link>
          )}
          <Link
            href="/reservar"
            className={cn(buttonStyles({ variant: "primary", size: "sm" }), "hidden sm:inline-flex")}
          >
            Reservar
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            <span className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-5 bg-cream transition-transform duration-300",
                  open && "translate-y-[6px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-px w-5 bg-cream transition-transform duration-300",
                  open && "-translate-y-[5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>
      </header>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[60] flex flex-col bg-bg px-5 pb-10 pt-10 md:hidden">
          <nav className="flex flex-col gap-7">
            {NAV.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-display text-4xl text-cream"
              >
                {link.label}
              </Link>
            ))}
            {registered && (
              <Link
                href="/cuenta"
                onClick={() => setOpen(false)}
                className="font-display text-4xl text-gold"
              >
                Mi cuenta
              </Link>
            )}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            <Link
              href="/reservar"
              onClick={() => setOpen(false)}
              className={buttonStyles({ variant: "primary", size: "lg" })}
            >
              Reservar
            </Link>
            {registered ? (
              <button
                type="button"
                onClick={() => {
                  signOut();
                  setOpen(false);
                }}
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                Cerrar sesión
              </button>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                Acceso al panel
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
