"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { parseCedula, type ScannedId } from "@/lib/idScan";
import { cn } from "@/lib/utils";

type ScanState = "idle" | "starting" | "scanning" | "error";

interface ScannerControls {
  stop: () => void;
}

/** Guía visual: el frente del carnet no sirve; el código está en el reverso. */
function CardSideGuide() {
  return (
    <svg
      viewBox="0 0 264 104"
      role="img"
      aria-label="Mostrar el reverso del carnet, no el frente"
      className="mx-auto w-full max-w-[250px]"
    >
      {/* Frente (atenuado, no es el lado que se escanea) */}
      <g className="text-dim" stroke="currentColor" fill="none" strokeWidth="1.4" opacity="0.55">
        <rect x="6" y="14" width="102" height="64" rx="6" />
        <circle cx="28" cy="40" r="10" />
        <line x1="46" y1="32" x2="96" y2="32" />
        <line x1="46" y1="42" x2="90" y2="42" />
        <line x1="46" y1="52" x2="84" y2="52" />
        <line x1="22" y1="64" x2="58" y2="64" />
      </g>
      <g className="text-busy" stroke="currentColor" strokeWidth="1.6" opacity="0.9">
        <line x1="98" y1="20" x2="108" y2="30" />
        <line x1="108" y1="20" x2="98" y2="30" />
      </g>
      <text
        x="57"
        y="94"
        textAnchor="middle"
        className="fill-current text-dim"
        fontSize="9"
        letterSpacing="1.5"
      >
        FRENTE
      </text>

      {/* Flecha de giro */}
      <g className="text-muted" stroke="currentColor" fill="none" strokeWidth="1.4">
        <path d="M118 52 q14 -18 28 0" />
        <path d="M146 52 l-5.5 -2.2 M146 52 l-1 -5.8" strokeLinecap="round" />
      </g>

      {/* Reverso (el lado correcto: código de barras + QR) */}
      <g className="text-gold" stroke="currentColor" fill="none" strokeWidth="1.4">
        <rect x="156" y="14" width="102" height="64" rx="6" />
      </g>
      <g className="text-gold" fill="currentColor">
        {[166, 170, 176, 179, 185, 190, 194, 199, 203, 209, 213, 218].map((x, i) => (
          <rect key={x} x={x} y="26" width={i % 3 === 0 ? 2.6 : 1.4} height="40" />
        ))}
        <rect x="228" y="26" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <rect x="232" y="30" width="4" height="4" />
        <rect x="240" y="30" width="4" height="4" />
        <rect x="232" y="38" width="4" height="4" />
        <rect x="239" y="37" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
      </g>
      <g className="text-ok" stroke="currentColor" fill="none" strokeWidth="1.8" strokeLinecap="round">
        <path d="M236 56 l5 5 l9 -10" />
      </g>
      <text
        x="207"
        y="94"
        textAnchor="middle"
        className="fill-current text-gold"
        fontSize="9"
        letterSpacing="1.5"
      >
        REVERSO
      </text>
    </svg>
  );
}

/**
 * Lector real de cédula: la cámara se enciende solo al pulsar "Empezar escaneo"
 * y decodifica el código del reverso del carnet (PDF417 en cédulas hasta 2024,
 * QR en el formato 2025). Todo ocurre en el dispositivo: se extraen nombre y
 * RUT, sin capturar ni almacenar imágenes. Si la lectura no resulta, quedan
 * los datos de ejemplo para no frenar la demostración.
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
  const slowTimerRef = useRef<number | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [foreignCode, setForeignCode] = useState(false);
  const [slowHint, setSlowHint] = useState(false);

  function cleanup() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (slowTimerRef.current != null) window.clearTimeout(slowTimerRef.current);
    slowTimerRef.current = null;
  }

  // Apagar la cámara al cerrar el modal o desmontar.
  useEffect(() => cleanup, []);

  function stopScan() {
    cleanup();
    setForeignCode(false);
    setSlowHint(false);
    setState("idle");
  }

  async function startScan() {
    setState("starting");
    setForeignCode(false);
    setSlowHint(false);
    try {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] =
        await Promise.all([import("@zxing/browser"), import("@zxing/library")]);
      if (!videoRef.current) return;

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.PDF_417,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      const reader = new BrowserMultiFormatReader(hints);

      const controls = await reader.decodeFromConstraints(
        {
          // Cámara trasera en móviles y la mayor resolución disponible:
          // el código de la cédula es denso y agradece los píxeles extra.
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        (result) => {
          if (!result || doneRef.current) return;
          const data = parseCedula(result.getText());
          if (!data.rut && !data.name) {
            // Leyó un código, pero no trae datos de cédula chilena.
            setForeignCode(true);
            return;
          }
          doneRef.current = true;
          cleanup();
          onResult(data);
        },
      );
      controlsRef.current = controls;
      setState("scanning");
      slowTimerRef.current = window.setTimeout(() => setSlowHint(true), 10000);
    } catch {
      cleanup();
      setState("error");
    }
  }

  const scanning = state === "scanning" || state === "starting";

  return (
    <Modal title="Escanear cédula" subtitle="Registro del huésped" onClose={onClose}>
      <div className="space-y-3">
        {/* Área del lector: instrucción en reposo, video al escanear. */}
        <div className="relative overflow-hidden rounded-sm border border-line bg-bg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn(
              "aspect-video max-h-[36vh] w-full object-cover",
              !scanning && "hidden",
            )}
          />
          {scanning && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 inset-y-6 rounded-sm border border-gold/50"
            />
          )}
          {!scanning && (
            <div className="flex w-full flex-col items-center justify-center gap-2.5 px-6 py-5 text-center">
              {state === "error" ? (
                <>
                  <p className="text-sm text-busy">No se pudo acceder a la cámara.</p>
                  <p className="text-xs leading-relaxed text-dim">
                    Revisa el permiso del navegador o continúa con los datos de ejemplo.
                  </p>
                </>
              ) : (
                <>
                  <CardSideGuide />
                  <p className="text-sm text-cream">
                    Da vuelta el carnet: el código está en el reverso.
                  </p>
                  <p className="text-xs leading-relaxed text-dim">
                    Pulsa “Empezar escaneo”, acércalo a la cámara y mantenlo firme hasta que
                    enfoque.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Estado de la lectura */}
        {scanning && (
          <p className={cn("text-xs leading-relaxed", foreignCode ? "text-busy" : "text-muted")}>
            {state === "starting"
              ? "Activando la cámara…"
              : foreignCode
                ? "Se leyó un código, pero no es de una cédula chilena. Muestra el reverso del carnet."
                : slowHint
                  ? "Cuesta enfocar: acerca un poco más el código, con buena luz y sin reflejos."
                  : "Buscando el código del carnet…"}
          </p>
        )}

        <p className="text-xs leading-relaxed text-dim">
          La lectura ocurre en el dispositivo: solo se extraen nombre y RUT, sin guardar
          imágenes del documento.
        </p>

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

        <button
          type="button"
          onClick={onSimulate}
          className="w-full text-center text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-gold"
        >
          Usar datos de ejemplo
        </button>
      </div>
    </Modal>
  );
}
