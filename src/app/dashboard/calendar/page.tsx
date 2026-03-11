import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Programado",
  completed: "Realizado",
  cancelled: "Cancelado",
  no_show: "No se presentó",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  no_show: "bg-red-100 text-red-700 border-red-200",
};

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: testDrives } = await supabase
    .from("test_drives")
    .select(`
      *,
      lead:leads(*, contact:contacts(*)),
      vehicle_model:vehicle_models(*),
      vendor:users(*)
    `)
    .gte("scheduled_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("scheduled_at", { ascending: true });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
        <p className="text-gray-500 text-sm mt-1">Test drives y citas programadas</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {!testDrives || testDrives.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">No hay test drives programados.</p>
            <p className="text-gray-400 text-xs mt-1">
              Agendá un test drive desde la ficha de un lead.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {testDrives.map((td: any) => (
              <div key={td.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                {/* Fecha/hora */}
                <div className="w-28 shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(td.scheduled_at).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(td.scheduled_at).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {td.lead?.contact?.full_name ?? "Sin nombre"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {td.vehicle_model
                      ? `${td.vehicle_model.model} ${td.vehicle_model.version}`
                      : "Vehículo sin definir"}{" "}
                    · {td.duration_minutes} min
                  </p>
                </div>

                {/* Vendedor */}
                <div className="text-xs text-gray-500 hidden sm:block">
                  {td.vendor?.full_name ?? "Sin asignar"}
                </div>

                {/* Estado */}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[td.status]}`}>
                  {STATUS_LABELS[td.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
