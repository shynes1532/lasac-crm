import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { LeadStatus, SourceChannel, LeadPriority, UserRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ------------------------------------------------
// Fechas
// ------------------------------------------------

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: es });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es });
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

// ------------------------------------------------
// Moneda
// ------------------------------------------------

export function formatCurrency(amount: number, currency: "ARS" | "USD" = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ------------------------------------------------
// Lead status
// ------------------------------------------------

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  quoted: "Cotización enviada",
  test_drive: "Test Drive",
  negotiation: "Negociación",
  won: "Cerrado - Venta",
  lost: "Perdido",
  nurturing: "Nurturing",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  qualified: "bg-purple-100 text-purple-800 border-purple-200",
  quoted: "bg-orange-100 text-orange-800 border-orange-200",
  test_drive: "bg-cyan-100 text-cyan-800 border-cyan-200",
  negotiation: "bg-indigo-100 text-indigo-800 border-indigo-200",
  won: "bg-green-100 text-green-800 border-green-200",
  lost: "bg-red-100 text-red-800 border-red-200",
  nurturing: "bg-gray-100 text-gray-800 border-gray-200",
};

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "quoted",
  "test_drive",
  "negotiation",
  "won",
  "lost",
];

// ------------------------------------------------
// Canales
// ------------------------------------------------

export const CHANNEL_LABELS: Record<SourceChannel, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  web: "Sitio Web",
  phone: "Teléfono",
  referral: "Referido",
  other: "Otro",
};

export const CHANNEL_ICONS: Record<SourceChannel, string> = {
  whatsapp: "📱",
  facebook: "📘",
  instagram: "📸",
  web: "🌐",
  phone: "📞",
  referral: "👥",
  other: "❓",
};

// ------------------------------------------------
// Prioridad
// ------------------------------------------------

export const PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

export const PRIORITY_COLORS: Record<LeadPriority, string> = {
  low: "text-gray-500",
  medium: "text-yellow-600",
  high: "text-red-600",
};

// ------------------------------------------------
// Roles
// ------------------------------------------------

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gerente Comercial",
  supervisor: "Supervisor de Ventas",
  vendor: "Vendedor",
  marketing: "Marketing",
};

// ------------------------------------------------
// Teléfono (formato Argentina)
// ------------------------------------------------

export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.startsWith("54")) return `+${clean}`;
  if (clean.startsWith("9")) return `+54${clean}`;
  return `+549${clean}`;
}

export function whatsappLink(phone: string, message?: string): string {
  const formatted = formatPhone(phone).replace("+", "");
  const url = `https://wa.me/${formatted}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}
