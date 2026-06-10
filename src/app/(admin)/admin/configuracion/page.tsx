"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { CATEGORIES } from "@/data/categories";
import { formatDateTime } from "@/lib/format";
import { makeId } from "@/lib/id";
import { useSession } from "@/lib/session";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { BlacklistEntry, Role, StaffUser } from "@/types";

const ROLE_LABEL: Record<Role, string> = {
  recepcion: "Recepción",
  admin: "Administración",
  aseo: "Aseo",
  encargado: "Encargado",
};

const fieldClass =
  "mt-2 min-h-[44px] w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none";

function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-surface/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl text-cream">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function ConfiguracionPage() {
  const {
    settings,
    users,
    blacklist,
    updateSettings,
    addUser,
    updateUser,
    addBlacklistEntry,
    removeBlacklistEntry,
    backupNow,
  } = useAppStore();
  const { user } = useSession();

  const [newEmail, setNewEmail] = useState("");
  const [userModal, setUserModal] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<Role>("recepcion");
  const [blModal, setBlModal] = useState(false);
  const [blName, setBlName] = useState("");
  const [blReason, setBlReason] = useState("");

  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <span className="kicker text-gold">Configuración</span>
        <h1 className="mt-3 font-display text-3xl text-cream">Sección de Administración</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          La configuración del recinto es exclusiva del perfil de administración.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block text-xs uppercase tracking-[0.16em] text-gold transition-colors hover:text-gold-soft"
        >
          Volver al panel
        </Link>
      </div>
    );
  }

  function addEmail() {
    const email = newEmail.trim();
    if (!email || settings.notificationEmails.includes(email)) return;
    updateSettings({ notificationEmails: [...settings.notificationEmails, email] });
    setNewEmail("");
  }
  function saveUser() {
    if (!userName.trim()) return;
    const u: StaffUser = { id: makeId("u"), name: userName.trim(), role: userRole, active: true };
    addUser(u);
    setUserName("");
    setUserRole("recepcion");
    setUserModal(false);
  }
  function saveBlacklist() {
    if (!blName.trim()) return;
    const entry: BlacklistEntry = {
      id: makeId("b"),
      name: blName.trim(),
      reason: blReason.trim(),
    };
    addBlacklistEntry(entry);
    setBlName("");
    setBlReason("");
    setBlModal(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8">
        <span className="kicker text-gold">Configuración</span>
        <h1 className="mt-3 font-display text-3xl text-cream sm:text-4xl">Configuración</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Parámetros del recinto. Los cambios se guardan al instante y persisten en el dispositivo.
        </p>
      </div>

      <div className="space-y-6">
        {/* Datos del recinto */}
        <Section title="Datos del recinto" description="Nombre, dirección y contacto.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="kicker text-dim" htmlFor="s-name">
                Nombre
              </label>
              <input
                id="s-name"
                value={settings.name}
                onChange={(e) => updateSettings({ name: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="s-city">
                Ciudad
              </label>
              <input
                id="s-city"
                value={settings.city}
                onChange={(e) => updateSettings({ city: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="kicker text-dim" htmlFor="s-address">
                Dirección
              </label>
              <input
                id="s-address"
                value={settings.address}
                onChange={(e) => updateSettings({ address: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="s-phone">
                Teléfono
              </label>
              <input
                id="s-phone"
                value={settings.phone}
                onChange={(e) => updateSettings({ phone: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="s-wa">
                WhatsApp
              </label>
              <input
                id="s-wa"
                value={settings.whatsappDisplay}
                onChange={(e) => updateSettings({ whatsappDisplay: e.target.value })}
                className={fieldClass}
              />
            </div>
          </div>
        </Section>

        {/* Impuesto y bloques */}
        <Section
          title="Impuesto y bloques de cobro"
          description="IVA para el cálculo interno y los bloques con que se cobra la estancia."
        >
          <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
            <div>
              <label className="kicker text-dim" htmlFor="s-iva">
                IVA (%)
              </label>
              <input
                id="s-iva"
                inputMode="numeric"
                value={String(settings.ivaPercent)}
                onChange={(e) =>
                  updateSettings({ ivaPercent: Number(e.target.value.replace(/\D/g, "")) || 0 })
                }
                className={fieldClass}
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-6">
              {[3, 6, 12].map((h) => (
                <span key={h} className="border border-line px-3 py-1.5 text-xs text-muted">
                  Bloque {h} h
                </span>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-dim">
            Los tipos de habitación y sus tarifas se gestionan en{" "}
            <Link href="/admin/precios" className="text-gold transition-colors hover:text-gold-soft">
              Precios
            </Link>
            : {CATEGORIES.map((c) => c.name).join(", ")}. El mapa de habitaciones está en{" "}
            <Link
              href="/admin/habitaciones"
              className="text-gold transition-colors hover:text-gold-soft"
            >
              Habitaciones
            </Link>
            .
          </p>
        </Section>

        {/* Usuarios y roles */}
        <Section
          title="Usuarios y roles"
          description="Quién entra al panel y con qué permisos."
          action={
            <Button onClick={() => setUserModal(true)} className="shrink-0">
              Nuevo usuario
            </Button>
          }
        >
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm text-cream">{u.name}</p>
                  <p className="kicker text-dim">{ROLE_LABEL[u.role]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateUser({ ...u, active: !u.active })}
                  className={cn("kicker transition-colors", u.active ? "text-ok" : "text-dim")}
                >
                  {u.active ? "Activo" : "Inactivo"}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-dim">
            Recepción opera el turno (habitaciones, caja, inventario). Administración además ve
            precios, reportes y esta configuración.
          </p>
        </Section>

        {/* Lista negra */}
        <Section
          title="Lista negra de clientes"
          description="Clientes a los que no se les vuelve a arrendar."
          action={
            <Button variant="secondary" onClick={() => setBlModal(true)} className="shrink-0">
              Agregar
            </Button>
          }
        >
          {blacklist.length === 0 ? (
            <p className="text-sm text-dim">Sin registros.</p>
          ) : (
            <ul className="divide-y divide-line">
              {blacklist.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm text-cream">{b.name}</p>
                    {b.reason && <p className="mt-1 text-xs text-dim">{b.reason}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBlacklistEntry(b.id)}
                    className="shrink-0 text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Correos */}
        <Section
          title="Correos de notificación"
          description="Reciben avisos de reservas y cierres (envío simulado)."
        >
          <ul className="space-y-2">
            {settings.notificationEmails.map((email) => (
              <li key={email} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted">{email}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({
                      notificationEmails: settings.notificationEmails.filter((e) => e !== email),
                    })
                  }
                  className="text-xs uppercase tracking-[0.14em] text-dim transition-colors hover:text-busy"
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="correo@mmotel.cl"
              className="min-h-[44px] flex-1 rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-cream placeholder:text-dim focus:border-gold/60 focus-visible:outline-none sm:max-w-xs"
            />
            <Button variant="secondary" onClick={addEmail} disabled={!newEmail.trim()}>
              Agregar
            </Button>
          </div>
        </Section>

        {/* Respaldo */}
        <Section
          title="Respaldo en la nube"
          description="En producción es automático. Aquí puedes simular un respaldo manual."
        >
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="secondary" onClick={backupNow}>
              Respaldar ahora
            </Button>
            <span className="text-xs text-dim">
              {settings.lastBackup
                ? `Último respaldo: ${formatDateTime(new Date(settings.lastBackup))}`
                : "Sin respaldos en esta sesión."}
            </span>
          </div>
        </Section>
      </div>

      {/* Modal nuevo usuario */}
      {userModal && (
        <Modal title="Nuevo usuario" subtitle="Acceso al panel" onClose={() => setUserModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="u-name">
                Nombre
              </label>
              <input
                id="u-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Nombre del usuario"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="u-role">
                Rol
              </label>
              <Select
                id="u-role"
                value={userRole}
                onValueChange={(v) => setUserRole(v as Role)}
                options={[
                  { value: "recepcion", label: "Recepción" },
                  { value: "admin", label: "Administración" },
                  { value: "aseo", label: "Aseo" },
                  { value: "encargado", label: "Encargado" },
                ]}
              />
            </div>
            <Button className="w-full" onClick={saveUser} disabled={!userName.trim()}>
              Crear usuario
            </Button>
          </div>
        </Modal>
      )}

      {/* Modal lista negra */}
      {blModal && (
        <Modal title="Agregar a lista negra" subtitle="Cliente vetado" onClose={() => setBlModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="kicker text-dim" htmlFor="bl-name">
                Cliente
              </label>
              <input
                id="bl-name"
                value={blName}
                onChange={(e) => setBlName(e.target.value)}
                placeholder="Nombre o referencia"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="kicker text-dim" htmlFor="bl-reason">
                Motivo
              </label>
              <input
                id="bl-reason"
                value={blReason}
                onChange={(e) => setBlReason(e.target.value)}
                placeholder="Por qué queda vetado"
                className={fieldClass}
              />
            </div>
            <Button className="w-full" onClick={saveBlacklist} disabled={!blName.trim()}>
              Agregar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
