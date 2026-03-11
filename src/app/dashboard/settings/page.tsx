import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/utils";

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });

  const { data: vehicles } = await supabase
    .from("vehicle_models")
    .select("*")
    .eq("active", true)
    .order("model", { ascending: true });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 text-sm mt-1">Usuarios, vehículos y ajustes del sistema</p>
      </div>

      {/* Usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Usuarios del sistema</h3>
          <span className="text-xs text-gray-400">{users?.length ?? 0} usuarios</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.full_name}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3 text-gray-600">
                  {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {user.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Catálogo de vehículos */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Catálogo de vehículos</h3>
          <span className="text-xs text-gray-400">{vehicles?.length ?? 0} modelos activos</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Modelo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Versión</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Año</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {vehicles?.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{v.model}</td>
                <td className="px-4 py-3 text-gray-600">{v.version}</td>
                <td className="px-4 py-3 text-gray-600">{v.year}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    v.stock_count > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {v.stock_count > 0 ? `${v.stock_count} unidades` : "Sin stock"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
