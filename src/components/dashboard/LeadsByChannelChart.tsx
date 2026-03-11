"use client";

import { CHANNEL_LABELS, CHANNEL_ICONS } from "@/lib/utils";
import type { SourceChannel } from "@/types";

// En producción esto viene de Supabase via props
const MOCK_DATA: { channel: SourceChannel; count: number }[] = [
  { channel: "whatsapp", count: 0 },
  { channel: "facebook", count: 0 },
  { channel: "instagram", count: 0 },
  { channel: "web", count: 0 },
  { channel: "phone", count: 0 },
  { channel: "referral", count: 0 },
];

export function LeadsByChannelChart() {
  const total = MOCK_DATA.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Leads por Canal</h3>
      <div className="space-y-3">
        {MOCK_DATA.map(({ channel, count }) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={channel} className="flex items-center gap-3">
              <span className="text-lg w-6">{CHANNEL_ICONS[channel]}</span>
              <span className="text-xs text-gray-500 w-24 shrink-0">
                {CHANNEL_LABELS[channel]}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-brand-700 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-8 text-right">
                {count}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-4 text-center">
        Se completa a medida que ingresan leads reales
      </p>
    </div>
  );
}
