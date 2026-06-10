"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminThemeProvider } from "@/lib/adminTheme";
import { useSession } from "@/lib/session";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated } = useSession();

  const isLogin = pathname === "/admin/login";

  // Sin sesión, el panel redirige al login. El aseo queda confinado a su pantalla.
  useEffect(() => {
    if (isLogin || !hydrated) return;
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    const aseoAllowed =
      pathname.startsWith("/admin/aseo") ||
      pathname.startsWith("/admin/lavanderia") ||
      pathname.startsWith("/admin/blancos");
    if (user.role === "aseo" && !aseoAllowed) {
      router.replace("/admin/aseo");
    }
  }, [isLogin, hydrated, user, pathname, router]);

  // El login va a pantalla completa, sin el shell del panel (pero con el tema).
  if (isLogin) {
    return <AdminThemeProvider>{children}</AdminThemeProvider>;
  }

  // Mientras hidrata o si no hay sesión, no pintamos el shell (evita parpadeo).
  if (!hydrated || !user) {
    return null;
  }

  return (
    <AdminThemeProvider>
      <AdminNav />
      <main className="px-5 pb-20 pt-28 sm:px-8 lg:ml-64 lg:px-10 lg:pt-12">{children}</main>
    </AdminThemeProvider>
  );
}
