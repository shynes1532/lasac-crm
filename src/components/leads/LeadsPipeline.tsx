"use client";

import { useMemo } from "react";
import { LeadCard } from "./LeadCard";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types";

interface LeadsPipelineProps {
  leads: Lead[];
}

const COLUMN_COLORS: Record<LeadStatus, string> = {
  new: "border-t-blue-500",
  contacted: "border-t-yellow-500",
  qualified: "border-t-purple-500",
  quoted: "border-t-orange-500",
  test_drive: "border-t-cyan-500",
  negotiation: "border-t-indigo-500",
  won: "border-t-green-500",
  lost: "border-t-red-400",
  nurturing: "border-t-gray-400",
};

const PIPELINE_COLUMNS: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "quoted",
  "test_drive",
  "negotiation",
];

export function LeadsPipeline({ leads }: LeadsPipelineProps) {
  const leadsByStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = {} as Record<LeadStatus, Lead[]>;
    LEAD_STATUS_ORDER.forEach((status) => {
      map[status] = leads.filter((l) => l.status === status);
    });
    return map;
  }, [leads]);

  return (
    <div className="flex gap-4 p-4 h-full overflow-x-auto pb-4">
      {PIPELINE_COLUMNS.map((status) => {
        const columnLeads = leadsByStatus[status] ?? [];
        return (
          <div
            key={status}
            className={`flex flex-col bg-gray-50 rounded-xl border-t-4 ${COLUMN_COLORS[status]} border border-gray-200 shrink-0 w-72`}
          >
            {/* Header columna */}
            <div className="px-3 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {LEAD_STATUS_LABELS[status]}
                </span>
                <span className="bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-full px-2 py-0.5">
                  {columnLeads.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {columnLeads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400">Sin leads</p>
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
