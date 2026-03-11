import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, MessageCircle, Car, Banknote,
  RefreshCw, Clock, User, Calendar
} from "lucide-react";
import {
  LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, CHANNEL_LABELS,
  CHANNEL_ICONS, PRIORITY_LABELS, formatDateTime, formatDate,
  whatsappLink, cn
} from "@/lib/utils";
import { LeadStatus } from "@/types";
import { LeadStatusUpdater } from "@/components/leads/LeadStatusUpdater";
import { ActivityFeed } from "@/components/leads/ActivityFeed";
import { AddActivityForm } from "@/components/leads/AddActivityForm";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(`
      *,
      contact:contacts(*),
      assigned_user:users(*),
      interest_model:vehicle_models(*),
      lost_reason:lost_reasons(*)
    `)
    .eq("id", id)
    .single();

  if (!lead) notFound();

  const { data: activities } = await supabase
    .from("activities")
    .select("*, user:users(full_name)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  const { data: quotes } = await supabase
    .from("quotes")
    .select("*, vehicle_model:vehicle_models(*)")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/leads"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {lead.contact?.full_name ?? "Sin nombre"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">
                {CHANNEL_ICONS[lead.source_channel as keyof typeof CHANNEL_ICONS]}{" "}
                {CHANNEL_LABELS[lead.source_channel as keyof typeof CHANNEL_LABELS] ?? "—"}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{formatDate(lead.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span className={cn(
          "px-3 py-1 rounded-full text-sm font-medium border",
          LEAD_STATUS_COLORS[lead.status as LeadStatus]
        )}>
          {LEAD_STATUS_LABELS[lead.status as LeadStatus]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-4">

          {/* Info del contacto */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Contacto</h2>
            <div className="space-y-3">
              {lead.contact?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> {lead.contact.phone}
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={`tel:${lead.contact.phone}`}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> Llamar
                    </a>
                    <a
                      href={whatsappLink(lead.contact.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </a>
                  </div>
                </div>
              )}
              {lead.contact?.email && (
                <p className="text-sm text-gray-500">📧 {lead.contact.email}</p>
              )}
            </div>
          </div>

          {/* Interés comercial */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Interés comercial</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Modelo</p>
                <p className="font-medium text-gray-800 flex items-center gap-1">
                  <Car className="w-4 h-4 text-gray-400" />
                  {lead.interest_model
                    ? `${lead.interest_model.model} ${lead.interest_model.version}`
                    : "Sin definir"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Prioridad</p>
                <p className="font-medium text-gray-800">
                  {PRIORITY_LABELS[lead.priority as keyof typeof PRIORITY_LABELS]}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Financiación</p>
                <p className="font-medium flex items-center gap-1">
                  <Banknote className="w-4 h-4 text-gray-400" />
                  {lead.needs_financing ? "Sí, necesita" : "No"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Usado</p>
                <p className="font-medium flex items-center gap-1">
                  <RefreshCw className="w-4 h-4 text-gray-400" />
                  {lead.has_trade_in ? "Sí, tiene" : "No"}
                </p>
              </div>
            </div>
          </div>

          {/* Cotizaciones */}
          {quotes && quotes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Cotizaciones</h2>
              <div className="space-y-2">
                {quotes.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-gray-800">
                        {q.vehicle_model?.model} {q.vehicle_model?.version}
                      </p>
                      <p className="text-xs text-gray-400">Vence: {formatDate(q.valid_until)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${q.final_price?.toLocaleString("es-AR")}
                      </p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        q.status === "sent" ? "bg-blue-100 text-blue-700" :
                        q.status === "accepted" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {q.status === "draft" ? "Borrador" :
                         q.status === "sent" ? "Enviada" :
                         q.status === "accepted" ? "Aceptada" :
                         q.status === "rejected" ? "Rechazada" : q.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/dashboard/quotes/new?lead_id=${lead.id}`}
                className="mt-3 inline-block text-xs text-brand-700 hover:underline font-medium"
              >
                + Nueva cotización
              </Link>
            </div>
          )}

          {/* Actividad */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Actividad</h2>
            <AddActivityForm leadId={lead.id} />
            <ActivityFeed activities={activities ?? []} />
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-4">
          {/* Cambiar estado */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Estado del lead</h2>
            <LeadStatusUpdater leadId={lead.id} currentStatus={lead.status} />
          </div>

          {/* Asignado a */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Asignado a</h2>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-700 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-semibold">
                  {lead.assigned_user?.full_name?.substring(0, 2).toUpperCase() ?? "??"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {lead.assigned_user?.full_name ?? "Sin asignar"}
                </p>
                <p className="text-xs text-gray-400">{lead.assigned_user?.email ?? "—"}</p>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Acciones</h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/quotes/new?lead_id=${lead.id}`}
                className="w-full flex items-center gap-2 text-sm bg-brand-700 hover:bg-brand-800 text-white px-3 py-2 rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Generar cotización
              </Link>
              {lead.contact?.phone && (
                <a
                  href={whatsappLink(lead.contact.phone, `Hola ${lead.contact.full_name?.split(" ")[0]}, te contacto de Lasac Oficial Fiat.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Enviar WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Timeline info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-xs text-gray-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Creado: {formatDateTime(lead.created_at)}</span>
            </div>
            {lead.last_activity_at && (
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span>Última actividad: {formatDateTime(lead.last_activity_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
