import { createClient } from "@/lib/supabase/server";
import { NewQuoteForm } from "@/components/quotes/NewQuoteForm";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ lead_id?: string }>;
}) {
  const { lead_id } = await searchParams;
  const supabase = await createClient();

  const [{ data: leads }, { data: vehicles }] = await Promise.all([
    supabase
      .from("leads")
      .select("id, contact:contacts(full_name, phone), interest_model:vehicle_models(model, version)")
      .not("status", "in", '("won","lost","nurturing")')
      .order("created_at", { ascending: false }),
    supabase
      .from("vehicle_models")
      .select("*")
      .eq("active", true)
      .order("model"),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
        <p className="text-gray-500 text-sm mt-1">Generá una cotización para enviarle al cliente</p>
      </div>
      <NewQuoteForm leads={leads ?? []} vehicles={vehicles ?? []} defaultLeadId={lead_id} />
    </div>
  );
}
