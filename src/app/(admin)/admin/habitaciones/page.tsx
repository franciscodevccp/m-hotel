import { ReceptionTurnBar } from "@/components/admin/ReceptionTurnBar";
import { RoomBoard } from "@/components/admin/RoomBoard";

export default function HabitacionesPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Operación</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Habitaciones</h1>
        <p className="mt-2 text-sm text-muted">
          Tablero en vivo de las 20 habitaciones. Toca una para hacer check-in, check-out, cambiarla
          de pieza o gestionar su estado.
        </p>
      </div>
      <ReceptionTurnBar />
      <RoomBoard />
    </div>
  );
}
