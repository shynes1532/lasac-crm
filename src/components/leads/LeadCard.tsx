"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, MessageCircle, Car, Clock, Banknote, RefreshCw } from "lucide-react";
import { CHANNEL_ICONS, PRIORITY_COLORS, whatsappLink, cn } from "@/lib/utils";
import type { Lead } from "@/types";

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const isStale = lead.last_activity_at
    ? Date.now() - new Date(lead.last_activity_at).getTime() > 24 * 60 * 60 * 1000
    : Date.now() - new Date(lead.created_at).getTime() > 24 * 60 * 60 * 1000;

  return (
    <Link href={`/dashboard/leads/${lead.id}`}>
      <div
        className={cn(
          "bg-white rounded-lg border p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group",
          isStale ? "border-red-200 bg-red-50/30" : "border-gray-200"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
              {lead.contact?.full_name ?? "Sin nombre"}
            </p>
            {lead.contact?.phone && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{lead.contact.phone}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm">
              {CHANNEL_ICONS[lead.source_channel as keyof typeof CHANNEL_ICONS] ?? "❓"}
            </span>
            {lead.priority === "high" && (
              <span className="w-2 h-2 bg-red-500 rounded-full" title="Prioridad alta" />
            )}
          </div>
        </div>

        {/* Modelo */}
        {lead.interest_model && (
          <div className="flex items-center gap-1.5 mb-2">
            <Car className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-600 truncate">
              {lead.interest_model.model} {lead.interest_model.version}
            </span>
          </div>
        )}

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {lead.needs_financing && (
            <span className="flex items-center gap-0.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">
              <Banknote className="w-3 h-3" />
              Financiación
            </span>
          )}
          {lead.has_trade_in && (
            <span className="flex items-center gap-0.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">
              <RefreshCw className="w-3 h-3" />
              Usado
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-1 text-xs", isStale ? "text-red-500" : "text-gray-400")}>
            <Clock className="w-3 h-3" />
            <span>
              {formatDistanceToNow(
                new Date(lead.last_activity_at ?? lead.created_at),
                { addSuffix: true, locale: es }
              )}
            </span>
          </div>

          {/* Acciones rápidas */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {lead.contact?.phone && (
              <>
                <a
                  href={`tel:${lead.contact.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                  title="Llamar"
                >
                  <Phone className="w-3 h-3 text-gray-600" />
                </a>
                <a
                  href={whatsappLink(lead.contact.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-6 h-6 flex items-center justify-center rounded bg-green-100 hover:bg-green-200 transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3 h-3 text-green-600" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
