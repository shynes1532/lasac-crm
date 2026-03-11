import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import type { Quote } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  viewed: "Vista",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-purple-100 text-purple-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
};

export default async function QuotesPage() {
  const supabase = await createClient();

  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      *,
      lead:leads(
        *,
        contact:contacts(*)
      ),
      vehicle_model:vehicle_models(*),
      created_by_user:users(*)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-500 text-sm mt-1">{quotes?.length ?? 0} cotizaciones</p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {!quotes || quotes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No hay cotizaciones todavía.</p>
            <Link
              href="/dashboard/quotes/new"
              className="mt-3 inline-block text-sm text-brand-700 font-medium hover:underline"
            >
              Crear la primera cotización →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Modelo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descuento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vence</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map((quote: Quote & { lead?: { contact?: { full_name?: string } }; vehicle_model?: { model?: string; version?: string } }) => (
                <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {quote.lead?.contact?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {quote.vehicle_model
                      ? `${quote.vehicle_model.model} ${quote.vehicle_model.version}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(quote.final_price)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {quote.discount_pct > 0 ? `${quote.discount_pct}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLORS[quote.status])}>
                      {STATUS_LABELS[quote.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(quote.valid_until)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(quote.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
