"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  MessageSquare,
  Car,
  LogOut,
  ChevronRight,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Leads",
    href: "/dashboard/leads",
    icon: Users,
  },
  {
    label: "Cotizaciones",
    href: "/dashboard/quotes",
    icon: FileText,
  },
  {
    label: "Calendario",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    label: "Mensajes",
    href: "/dashboard/inbox",
    icon: MessageSquare,
    badge: 0, // se actualiza dinámicamente
  },
  {
    label: "Vehículos",
    href: "/dashboard/vehicles",
    icon: Car,
  },
  {
    label: "Reportes",
    href: "/dashboard/reports",
    icon: BarChart3,
  },
  {
    label: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    router.push("/login");
    router.refresh();
  }

  const initials = user.email?.substring(0, 2).toUpperCase() ?? "US";

  return (
    <aside className="w-64 flex flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="w-9 h-9 bg-brand-700 rounded-xl flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">L</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-none">Lasac CRM</p>
          <p className="text-gray-400 text-xs mt-0.5">Fiat Oficial</p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group",
                isActive
                  ? "bg-[hsl(var(--sidebar-accent))] text-white"
                  : "text-gray-400 hover:bg-[hsl(var(--sidebar-accent))] hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="bg-brand-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
              {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer del sidebar */}
      <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user.email}</p>
            <p className="text-gray-500 text-xs truncate">Vendedor</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
