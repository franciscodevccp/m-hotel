const SERVICES = [
  {
    title: "Room service gourmet",
    desc: "Carta caliente y coctelería las 24 horas, directo a la habitación.",
  },
  {
    title: "Jacuzzi privado",
    desc: "Disponible en toda la línea Jacuzzi: VIP, Premium y Black, pensado para dos.",
  },
  {
    title: "Estacionamiento privado",
    desc: "Acceso reservado y discreto, sin contacto innecesario.",
  },
  {
    title: "Discreción",
    desc: "Entrada y atención cuidadas para tu privacidad, de principio a fin.",
  },
];

export function ServiceList() {
  return (
    <ul className="border-y border-line">
      {SERVICES.map((service, i) => (
        <li
          key={service.title}
          className="grid grid-cols-[3rem_1fr] items-baseline gap-x-5 gap-y-2 border-t border-line py-7 first:border-t-0 sm:grid-cols-[5rem_1fr_24rem] sm:py-9"
        >
          <span className="tnum kicker text-dim">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="font-display text-2xl text-cream sm:text-3xl">{service.title}</h3>
          <p className="col-start-2 max-w-md text-sm leading-relaxed text-muted sm:col-start-3 sm:text-right">
            {service.desc}
          </p>
        </li>
      ))}
    </ul>
  );
}
