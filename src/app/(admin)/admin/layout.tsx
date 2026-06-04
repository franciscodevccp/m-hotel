"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // El login va a pantalla completa, sin el shell del panel.
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full">
      <AdminNav />
      <main className="px-5 pb-20 pt-28 sm:px-8 lg:ml-64 lg:px-10 lg:pt-12">{children}</main>
    </div>
  );
}
