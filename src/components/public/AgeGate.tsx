"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";

const AGE_OK_KEY = "m-motel-age-ok";

/**
 * Verificación +18 del sexshop. Usa sessionStorage a propósito: en cada sesión
 * nueva de demo el aviso vuelve a aparecer. Respeta el toggle `ageNotice` de la
 * configuración de la tienda (apagarlo en vivo oculta el gate).
 */
export function AgeGate() {
  const router = useRouter();
  const { shopSettings, hydrated } = useAppStore();
  const [confirmed, setConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de sessionStorage en el cliente
      setConfirmed(sessionStorage.getItem(AGE_OK_KEY) === "1");
    } catch {
      setConfirmed(true);
    }
  }, []);

  const show = hydrated && confirmed === false && shopSettings.ageNotice;

  useEffect(() => {
    if (!show) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;

  function accept() {
    try {
      sessionStorage.setItem(AGE_OK_KEY, "1");
    } catch {
      // Sin sessionStorage seguimos igual: solo se pierde la persistencia.
    }
    setConfirmed(true);
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Verificación de mayoría de edad"
    >
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm" aria-hidden />
      <div className="relative w-full max-w-md border border-line-strong bg-surface-2 p-7 sm:rounded-md">
        <span className="kicker text-gold">Sexshop · M</span>
        <h2 className="mt-3 font-display text-3xl text-cream">
          Contenido para mayores de 18 años
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Esta sección muestra productos de catálogo adulto. Todo con empaque neutro, sin marcas
          a la vista y con un descriptor discreto en tu cartola.
        </p>

        <div className="mt-7 space-y-3">
          <Button className="w-full" onClick={accept}>
            Soy mayor de 18
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/")}>
            Salir
          </Button>
        </div>
      </div>
    </div>
  );
}
