import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, CHANNEL_ICONS } from "@/lib/utils";
import type { Lead } from "@/types";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentLeadsProps {
  leads: Lead[];
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Últimos Leads</h3>
        <Link
          href="/dashboard/leads"
          className="text-xs text-brand-700 hover:text-brand-800 flex items-center gap-1 font-medium"
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {leads.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-400 text-sm">No hay leads todavía.</p>
          <Link
            href="/dashboard/leads/new"
            className="mt-3 inline-block text-sm text-brand-700 font-medium hover:underline"
          >
            Crear el primer lead →
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-gray-600">
                  {lead.contact?.full_name?.substring(0, 2).toUpperCase() ?? "??"}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {lead.contact?.full_name ?? "Sin nombre"}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {lead.interest_model
                    ? `${lead.interest_model.model} ${lead.interest_model.version}`
                    : "Modelo sin definir"}
                </p>
              </div>

              {/* Canal */}
              <span className="text-base" title={lead.source_channel ?? ""}>
                {CHANNEL_ICONS[lead.source_channel as keyof typeof CHANNEL_ICONS] ?? "❓"}
              </span>

              {/* Status */}
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium border",
                  LEAD_STATUS_COLORS[lead.status]
                )}
              >
                {LEAD_STATUS_LABELS[lead.status]}
              </span>

              {/* Tiempo */}
              <span className="text-xs text-gray-400 shrink-0 hidden sm:block">
                {formatDistanceToNow(new Date(lead.created_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
