import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { LeadsByChannelChart } from "@/components/dashboard/LeadsByChannelChart";
import { FunnelChart } from "@/components/dashboard/FunnelChart";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Traer datos básicos
  const [
    { count: totalLeads },
    { count: leadsToday },
    { count: leadsThisWeek },
    { count: leadsWon },
    { data: recentLeads },
    { data: leadsByStatus },
  ] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "won"),
    supabase
      .from("leads")
      .select(`
        *,
        contact:contacts(*),
        assigned_user:users(*),
        interest_model:vehicle_models(*)
      `)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("leads")
      .select("status"),
  ]);

  const conversionRate = totalLeads
    ? Math.round(((leadsWon ?? 0) / (totalLeads ?? 1)) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Resumen comercial en tiempo real — Lasac Oficial Fiat
        </p>
      </div>

      {/* KPI Cards */}
      <DashboardStats
        totalLeads={totalLeads ?? 0}
        leadsToday={leadsToday ?? 0}
        leadsThisWeek={leadsThisWeek ?? 0}
        conversionRate={conversionRate}
      />

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart leadsByStatus={leadsByStatus ?? []} />
        <LeadsByChannelChart />
      </div>

      {/* Leads recientes */}
      <RecentLeads leads={recentLeads ?? []} />
    </div>
  );
}
