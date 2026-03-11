import { createClient } from "@/lib/supabase/server";
import { LeadsPipeline } from "@/components/leads/LeadsPipeline";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function LeadsPage() {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select(`
      *,
      contact:contacts(*),
      assigned_user:users(*),
      interest_model:vehicle_models(*)
    `)
    .not("status", "in", '("won","lost","nurturing")')
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pipeline de Leads</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {leads?.length ?? 0} leads activos
          </p>
        </div>
        <Link
          href="/dashboard/leads/new"
          className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Lead
        </Link>
      </div>

      {/* Pipeline Kanban */}
      <div className="flex-1 overflow-hidden">
        <LeadsPipeline leads={leads ?? []} />
      </div>
    </div>
  );
}
