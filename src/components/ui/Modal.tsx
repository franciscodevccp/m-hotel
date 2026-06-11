"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  /** Ancho extendido para contenidos a dos columnas (p. ej. cortesías al costado). */
  wide?: boolean;
}

/** Modal simple y accesible: cierra con Esc o clic en el fondo. Sheet en mobile. */
export function Modal({ title, subtitle, onClose, children, wide }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Si un hijo ya manejó Escape (p. ej. cerrar un Select abierto), no cerramos el modal.
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={onClose} aria-hidden />
      {/* max-h + scroll interno: en pantallas bajas (teléfonos) o contenidos largos,
          el pie del modal siempre queda alcanzable. dvh respeta la barra de iOS. */}
      <div
        className={
          "relative max-h-dvh w-full overflow-y-auto border border-line-strong bg-surface-2 p-6 sm:max-h-[calc(100dvh-3rem)] sm:rounded-md " +
          (wide ? "max-w-md sm:max-w-3xl" : "max-w-md")
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-cream">{title}</h3>
            {subtitle && <p className="kicker mt-1 text-dim">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-2xl leading-none text-dim transition-colors hover:text-cream"
          >
            ×
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
