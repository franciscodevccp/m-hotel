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

/**
 * Escáner del QR de habitación para el personal de aseo: reemplaza el
 * talonario de papel. Al leer el código, el aseo se inicia a nombre del
 * usuario de la sesión y el tiempo empieza a correr. El botón de ejemplo
 * permite demostrar el flujo sin tener el código impreso a mano.
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
        <div className="relative overflow-hidden rounded-sm border border-line bg-bg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn("aspect-video max-h-[34vh] w-full object-cover", !scanning && "hidden")}
          />
          {scanning && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-16 inset-y-5 rounded-sm border border-gold/50"
            />
          )}
          {!scanning && (
            <div className="flex w-full flex-col items-center justify-center gap-2.5 px-6 py-8 text-center">
              {state === "error" ? (
                <>
                  <p className="text-sm text-busy">No se pudo acceder a la cámara.</p>
                  <p className="text-xs leading-relaxed text-dim">
                    Revisa el permiso del navegador o usa la habitación de ejemplo.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-cream">
                    Apunta al código QR pegado en la habitación.
                  </p>
                  <p className="text-xs leading-relaxed text-dim">
                    El aseo queda a tu nombre y el tiempo empieza a correr de inmediato.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {scanning && (
          <p className={cn("text-xs leading-relaxed", foreignCode ? "text-busy" : "text-muted")}>
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
