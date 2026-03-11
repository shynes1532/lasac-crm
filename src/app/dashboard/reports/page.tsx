import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, CHANNEL_LABELS, formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [
    { count: totalLeads },
    { count: wonLeads },
    { count: lostLeads },
    { data: byStatus },
    { data: byChannel },
    { data: recentSales },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "won"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "lost"),
    supabase.from("leads").select("status"),
    supabase.from("leads").select("source_channel"),
    supabase
      .from("sales")
      .select("*, lead:leads(*, contact:contacts(*)), vehicle_model:vehicle_models(*)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Agrupar por status
  const statusCounts: Record<string, number> = {};
  byStatus?.forEach((l) => {
    statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;
  });

  // Agrupar por canal
  const channelCounts: Record<string, number> = {};
  byChannel?.forEach((l) => {
    if (l.source_channel) {
      channelCounts[l.source_channel] = (channelCounts[l.source_channel] ?? 0) + 1;
    }
  });

  const conversionRate = totalLeads
    ? Math.round(((wonLeads ?? 0) / (totalLeads ?? 1)) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Métricas y análisis comercial</p>
      </div>

      {/* KPIs globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: totalLeads ?? 0, color: "text-blue-600 bg-blue-50" },
          { label: "Ventas Cerradas", value: wonLeads ?? 0, color: "text-green-600 bg-green-50" },
          { label: "Leads Perdidos", value: lostLeads ?? 0, color: "text-red-600 bg-red-50" },
          { label: "Tasa de Cierre", value: `${conversionRate}%`, color: "text-brand-700 bg-red-50" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color.split(" ")[0]}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads por Etapa</h3>
          <div className="space-y-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] ?? status}
                </span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(statusCounts).length === 0 && (
              <p className="text-gray-400 text-xs">Sin datos todavía</p>
            )}
          </div>
        </div>

        {/* Por canal */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads por Canal</h3>
          <div className="space-y-2">
            {Object.entries(channelCounts).map(([channel, count]) => (
              <div key={channel} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {CHANNEL_LABELS[channel as keyof typeof CHANNEL_LABELS] ?? channel}
                </span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
            {Object.keys(channelCounts).length === 0 && (
              <p className="text-gray-400 text-xs">Sin datos todavía</p>
            )}
          </div>
        </div>
      </div>

      {/* Ventas recientes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Ventas Cerradas</h3>
        </div>
        {!recentSales || recentSales.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">Sin ventas cerradas todavía.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Modelo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Precio Final</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentSales.map((sale: any) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {sale.lead?.contact?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {sale.vehicle_model
                      ? `${sale.vehicle_model.model} ${sale.vehicle_model.version}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-700">
                    {formatCurrency(sale.final_price)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 capitalize">{sale.payment_method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
