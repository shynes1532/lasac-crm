import { formatDateTime } from "@/lib/utils";

const TYPE_ICONS: Record<string, string> = {
  note: "📝",
  call: "📞",
  whatsapp: "💬",
  email: "📧",
  meeting: "🤝",
  status_change: "🔄",
  quote_sent: "📄",
  test_drive: "🚗",
  system: "⚙️",
};

const TYPE_LABELS: Record<string, string> = {
  note: "Nota",
  call: "Llamada",
  whatsapp: "WhatsApp",
  email: "Email",
  meeting: "Reunión",
  status_change: "Cambio de estado",
  quote_sent: "Cotización enviada",
  test_drive: "Test Drive",
  system: "Sistema",
};

interface Activity {
  id: string;
  type: string;
  content: string;
  created_at: string;
  user?: { full_name: string } | null;
}

interface Props {
  activities: Activity[];
}

export function ActivityFeed({ activities }: Props) {
  if (activities.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-4">
        Sin actividad registrada todavía
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3">
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center shrink-0 text-sm">
            {TYPE_ICONS[activity.type] ?? "📌"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium text-gray-700">
                {TYPE_LABELS[activity.type] ?? activity.type}
              </span>
              {activity.user && (
                <span className="text-xs text-gray-400">— {activity.user.full_name}</span>
              )}
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{activity.content}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(activity.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
