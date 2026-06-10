"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { parseCedula, type ScannedId } from "@/lib/idScan";

type ScanState = "starting" | "scanning" | "error";

interface ScannerControls {
  stop: () => void;
}

/**
 * Lector real de cédula: usa la cámara para decodificar el PDF417 del reverso
 * del carnet (RUN y, según la emisión, nombre). Todo ocurre en el navegador;
 * no se captura ni almacena la imagen del documento. Si no hay cámara o el
 * código no se deja leer, queda el camino de los datos de ejemplo.
 */
export function IdScanModal({
  onResult,
  onSimulate,
  onClose,
}: {
  onResult: (data: ScannedId) => void;
  onSimulate: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const doneRef = useRef(false);
  const [state, setState] = useState<ScanState>("starting");

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        // Carga diferida: el decodificador solo se trae al abrir el lector.
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
          await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
        if (cancelled || !videoRef.current) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.PDF_417,
          BarcodeFormat.QR_CODE,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints);

        const controls = await reader.decodeFromConstraints(
          // En móviles toma la cámara trasera; en escritorio, la webcam.
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            if (!result || doneRef.current) return;
            const data = parseCedula(result.getText());
            if (!data.rut && !data.name) return; // código ajeno: seguir buscando
            doneRef.current = true;
            controlsRef.current?.stop();
            onResult(data);
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setState("scanning");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    start();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onResult]);

  return (
    <Modal title="Escanear cédula" subtitle="Registro del huésped" onClose={onClose}>
      <div className="space-y-4">
        {state !== "error" ? (
          <>
            <div className="relative overflow-hidden rounded-sm border border-line bg-bg">
              <video ref={videoRef} autoPlay muted playsInline className="aspect-[4/3] w-full object-cover" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-8 inset-y-12 rounded-sm border border-gold/50"
              />
            </div>
            <p className="text-sm leading-relaxed text-muted">
              {state === "starting"
                ? "Activando la cámara…"
                : "Acerca el reverso del carnet: el lector busca el código de barras (PDF417) y completa nombre y RUT."}
            </p>
          </>
        ) : (
          <p className="border border-line bg-surface px-4 py-5 text-sm leading-relaxed text-muted">
            No se pudo acceder a la cámara. Revisa el permiso del navegador o usa los datos de
            ejemplo para continuar la demostración.
          </p>
        )}

        <p className="text-xs leading-relaxed text-dim">
          La lectura ocurre en el dispositivo: se extraen solo nombre y RUT, sin capturar ni
          almacenar imágenes del documento.
        </p>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="secondary" className="flex-1" onClick={onSimulate}>
            Usar datos de ejemplo
          </Button>
        </div>
      </div>
    </Modal>
  );
}
