"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { parseRoomQr } from "@/lib/roomQr";
import { cn } from "@/lib/utils";

type ScanState = "idle" | "starting" | "scanning" | "error";

interface ScannerControls {
  stop: () => void;
}

/** Pictograma de QR para el estado en reposo (tres patrones de posición). */
function QrGlyph() {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className="size-12 text-dim"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="4" y="4" width="14" height="14" />
      <rect x="9" y="9" width="4" height="4" fill="currentColor" stroke="none" />
      <rect x="30" y="4" width="14" height="14" />
      <rect x="35" y="9" width="4" height="4" fill="currentColor" stroke="none" />
      <rect x="4" y="30" width="14" height="14" />
      <rect x="9" y="35" width="4" height="4" fill="currentColor" stroke="none" />
      <path d="M28 28h6v6h-6zM38 28h6M44 34h-8v10M28 40h4" strokeWidth="2.4" />
    </svg>
  );
}

/** Esquinas de enfoque del visor: el lenguaje clásico de un lector QR. */
function FinderCorners() {
  const corner = "absolute size-8 border-gold";
  return (
    <div className="pointer-events-none absolute inset-5" aria-hidden>
      <span className={cn(corner, "left-0 top-0 border-l-2 border-t-2")} />
      <span className={cn(corner, "right-0 top-0 border-r-2 border-t-2")} />
      <span className={cn(corner, "bottom-0 left-0 border-b-2 border-l-2")} />
      <span className={cn(corner, "bottom-0 right-0 border-b-2 border-r-2")} />
      <span className="qr-scanline" />
    </div>
  );
}

/**
 * Escáner del QR de habitación para el personal de aseo: reemplaza el
 * talonario de papel. Visor cuadrado con esquinas de enfoque (a diferencia
 * del lector de cédula, que es apaisado). Al leer el código, el aseo se
 * inicia a nombre del usuario de la sesión y el tiempo empieza a correr.
 */
export function RoomQrScanModal({
  onRoom,
  onExample,
  exampleLabel,
  onClose,
}: {
  onRoom: (roomNumber: number) => void;
  onExample?: () => void;
  exampleLabel?: string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const doneRef = useRef(false);
  const [state, setState] = useState<ScanState>("idle");
  const [foreignCode, setForeignCode] = useState(false);

  function cleanup() {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }

  useEffect(() => cleanup, []);

  function stopScan() {
    cleanup();
    setForeignCode(false);
    setState("idle");
  }

  async function startScan() {
    setState("starting");
    setForeignCode(false);
    try {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
        await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
      if (!videoRef.current) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      const reader = new BrowserMultiFormatReader(hints);

      const controls = await reader.decodeFromConstraints(
        { video: { facingMode: "environment", width: { ideal: 1280 } } },
        videoRef.current,
        (result) => {
          if (!result || doneRef.current) return;
          const roomNumber = parseRoomQr(result.getText());
          if (roomNumber == null) {
            setForeignCode(true); // un QR cualquiera no inicia nada
            return;
          }
          doneRef.current = true;
          cleanup();
          onRoom(roomNumber);
        },
      );
      controlsRef.current = controls;
      setState("scanning");
    } catch {
      cleanup();
      setState("error");
    }
  }

  const scanning = state === "scanning" || state === "starting";

  return (
    <Modal title="Escanear QR de habitación" subtitle="Inicio de aseo" onClose={onClose}>
      <div className="space-y-3">
        {/* Visor cuadrado: el QR es cuadrado y se centra en las esquinas */}
        <div className="relative mx-auto aspect-square w-full max-w-[260px] overflow-hidden rounded-sm border border-line bg-bg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn("absolute inset-0 size-full object-cover", !scanning && "hidden")}
          />
          {scanning && <FinderCorners />}
          {!scanning && (
            <div className="flex size-full flex-col items-center justify-center gap-3 px-6 text-center">
              {state === "error" ? (
                <>
                  <p className="text-sm text-busy">No se pudo acceder a la cámara.</p>
                  <p className="text-xs leading-relaxed text-dim">
                    Revisa el permiso del navegador o usa la habitación de ejemplo.
                  </p>
                </>
              ) : (
                <>
                  <QrGlyph />
                  <p className="text-sm text-cream">
                    Centra el código QR de la pieza en el recuadro.
                  </p>
                  <p className="text-xs leading-relaxed text-dim">
                    El aseo queda a tu nombre y el tiempo corre de inmediato.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {scanning && (
          <p
            className={cn(
              "text-center text-xs leading-relaxed",
              foreignCode ? "text-busy" : "text-muted",
            )}
          >
            {state === "starting"
              ? "Activando la cámara…"
              : foreignCode
                ? "Ese código no corresponde a una habitación del recinto."
                : "Buscando el código de la habitación…"}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          {scanning ? (
            <Button variant="secondary" className="flex-1" onClick={stopScan}>
              Detener
            </Button>
          ) : (
            <Button className="flex-1" onClick={startScan}>
              Empezar escaneo
            </Button>
          )}
        </div>

        {onExample && (
          <button
            type="button"
            onClick={onExample}
            className="w-full text-center text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
          >
            {exampleLabel ?? "Usar habitación de ejemplo"}
          </button>
        )}
      </div>
    </Modal>
  );
}
