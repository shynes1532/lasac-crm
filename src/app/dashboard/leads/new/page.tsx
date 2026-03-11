import { createClient } from "@/lib/supabase/server";
import { NewLeadForm } from "@/components/leads/NewLeadForm";

export default async function NewLeadPage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: users }] = await Promise.all([
    supabase
      .from("vehicle_models")
      .select("id, model, version, year")
      .eq("active", true)
      .order("model"),
    supabase
      .from("users")
      .select("id, full_name, role")
      .eq("active", true)
      .in("role", ["vendor", "supervisor", "manager"]),
  ]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Lead</h1>
        <p className="text-gray-500 text-sm mt-1">Cargá los datos del cliente interesado</p>
      </div>
      <NewLeadForm vehicles={vehicles ?? []} users={users ?? []} />
    </div>
  );
}
