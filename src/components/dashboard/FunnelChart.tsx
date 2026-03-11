"use client";

import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/utils";
import type { LeadStatus } from "@/types";

interface FunnelChartProps {
  leadsByStatus: { status: string }[];
}

export function FunnelChart({ leadsByStatus }: FunnelChartProps) {
  const counts = LEAD_STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = leadsByStatus.filter((l) => l.status === status).length;
      return acc;
    },
    {} as Record<LeadStatus, number>
  );

  const max = Math.max(...Object.values(counts), 1);

  const COLORS: Record<LeadStatus, string> = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    qualified: "bg-purple-500",
    quoted: "bg-orange-500",
    test_drive: "bg-cyan-500",
    negotiation: "bg-indigo-500",
    won: "bg-green-500",
    lost: "bg-red-400",
    nurturing: "bg-gray-400",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Funnel de Ventas</h3>
      <div className="space-y-2.5">
        {LEAD_STATUS_ORDER.filter((s) => s !== "nurturing").map((status) => {
          const count = counts[status] ?? 0;
          const pct = Math.round((count / max) * 100);
          return (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-32 shrink-0 truncate">
                {LEAD_STATUS_LABELS[status]}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${COLORS[status]}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-6 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
