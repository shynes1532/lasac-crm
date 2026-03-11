import { createClient } from "@/lib/supabase/server";
import { CHANNEL_LABELS, CHANNEL_ICONS, formatDateTime } from "@/lib/utils";

export default async function InboxPage() {
  const supabase = await createClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      contact:contacts(*),
      lead:leads(*),
      assigned_user:users(*)
    `)
    .eq("status", "open")
    .order("last_message_at", { ascending: false })
    .limit(50);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mensajes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Inbox omnicanal — {conversations?.length ?? 0} conversaciones abiertas
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {!conversations || conversations.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-2xl mb-3">💬</p>
            <p className="text-gray-500 text-sm font-medium">Sin mensajes todavía</p>
            <p className="text-gray-400 text-xs mt-1">
              Los mensajes de WhatsApp, Facebook e Instagram aparecerán aquí
              automáticamente cuando lleguen.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conv: any) => (
              <div
                key={conv.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-gray-600">
                    {conv.contact?.full_name?.substring(0, 2).toUpperCase() ?? "??"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conv.contact?.full_name ?? conv.contact?.phone ?? "Desconocido"}
                    </p>
                    <span className="text-base">
                      {CHANNEL_ICONS[conv.channel as keyof typeof CHANNEL_ICONS]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {conv.contact?.phone ?? "Sin teléfono"}
                  </p>
                </div>

                {/* Canal */}
                <span className="text-xs text-gray-400 hidden sm:block">
                  {CHANNEL_LABELS[conv.channel as keyof typeof CHANNEL_LABELS]}
                </span>

                {/* Última actividad */}
                <span className="text-xs text-gray-400 shrink-0">
                  {conv.last_message_at ? formatDateTime(conv.last_message_at) : "—"}
                </span>

                {/* Asignado */}
                {conv.assigned_user && (
                  <div className="w-7 h-7 bg-brand-700 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-semibold">
                      {conv.assigned_user.full_name?.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
