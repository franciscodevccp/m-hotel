"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DEMO_CLIENT } from "@/lib/demo";
import { useVisitor } from "@/lib/visitor";

type View = "welcome" | "register";

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

const BENEFITS = [
  "Reserva más rápido, con tus datos guardados.",
  "Sigue el estado de tus pedidos de la tienda.",
  "Pide la carta a tu habitación con un solo clic.",
];

function Check() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="mt-0.5 size-3.5 shrink-0 text-gold"
      aria-hidden
    >
      <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WelcomeModal() {
  const { visitor, hydrated, promptOpen, setGuest, setRegistered, closePrompt } = useVisitor();
  const [view, setView] = useState<View>("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const show = hydrated && (visitor === null || promptOpen);

  // Cerrar sin elegir: si aún no hay visitante, entra como invitado; si ya lo
  // había (reabrió el modal), solo se cierra.
  const dismiss = useCallback(() => {
    if (visitor === null) setGuest();
    else closePrompt();
  }, [visitor, setGuest, closePrompt]);

  // Cierre con Escape; bloquear scroll de fondo mientras está abierto.
  useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [show, dismiss]);

  if (!show) return null;

  const validRegister = name.trim() !== "" && email.trim() !== "" && password !== "";

  function register() {
    if (!validRegister) return;
    setRegistered(name, email);
  }

  // En la demo, "Ingresar" deja logueado a un cliente de ejemplo sin tipear nada.
  function loginDemo() {
    setRegistered(DEMO_CLIENT.name, DEMO_CLIENT.email);
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida"
    >
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm" onClick={dismiss} aria-hidden />
      <div className="relative w-full max-w-md border border-line-strong bg-surface-2 p-7 sm:rounded-md">
        {view === "welcome" && (
          <>
            <span className="kicker text-gold">M Motel · Limache</span>
            <h2 className="mt-3 font-display text-3xl text-cream">Te damos la bienvenida</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Crea tu cuenta para una experiencia más rápida y discreta, o continúa como invitado.
            </p>

            <ul className="mt-5 space-y-2.5">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-muted">
                  <Check />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 space-y-3">
              <Button className="w-full" onClick={() => setView("register")}>
                Crear cuenta
              </Button>
              <Button variant="secondary" className="w-full" onClick={setGuest}>
                Continuar como invitado
              </Button>
            </div>

            <p className="mt-5 text-center text-xs text-dim">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={loginDemo}
                className="text-gold transition-colors hover:text-gold-soft"
              >
                Ingresar
              </button>
            </p>
          </>
        )}

        {view === "register" && (
          <>
            <span className="kicker text-gold">Crear cuenta</span>
            <h2 className="mt-3 font-display text-3xl text-cream">Tus datos</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Con tu cuenta puedes pedir la carta a tu habitación con un solo clic.
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="kicker text-dim" htmlFor="w-name">
                  Nombre
                </label>
                <input
                  id="w-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre y apellido"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="w-email">
                  Correo
                </label>
                <input
                  id="w-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.cl"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="w-phone">
                  Teléfono (opcional)
                </label>
                <input
                  id="w-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+56 9 ..."
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="kicker text-dim" htmlFor="w-pass">
                  Contraseña
                </label>
                <input
                  id="w-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button className="w-full" onClick={register} disabled={!validRegister}>
                Crear cuenta
              </Button>
              <button
                type="button"
                onClick={() => setView("welcome")}
                className="w-full text-center text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-cream"
              >
                Volver
              </button>
            </div>
          </>
        )}

        <p className="mt-6 border-t border-line pt-4 text-center text-[0.7rem] leading-relaxed text-dim">
          Demostración · no se envía información real. Empaque y trato siempre discretos.
        </p>
      </div>
    </div>
  );
}
