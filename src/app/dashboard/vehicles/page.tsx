import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function VehiclesPage() {
  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicle_models")
    .select("*")
    .order("model", { ascending: true });

  const byModel = vehicles?.reduce((acc: Record<string, typeof vehicles>, v) => {
    if (!acc[v.model]) acc[v.model] = [];
    acc[v.model].push(v);
    return acc;
  }, {}) ?? {};

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Catálogo de modelos Fiat — {vehicles?.length ?? 0} versiones
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(byModel).map(([model, versions]) => (
          <div key={model} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">FIAT {model}</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Versión</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Año</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Precio base</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {versions.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{v.version}</td>
                    <td className="px-4 py-3 text-gray-600">{v.year}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {v.base_price > 0
                        ? formatCurrency(v.base_price, v.currency as "ARS" | "USD")
                        : <span className="text-gray-400 italic">A consultar</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.stock_count}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        v.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}>
                        {v.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
