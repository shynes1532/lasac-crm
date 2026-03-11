"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { LEAD_STATUS_LABELS, LEAD_STATUS_COLORS, cn } from "@/lib/utils";
import type { LeadStatus } from "@/types";

const PIPELINE_ORDER: LeadStatus[] = [
  "new", "contacted", "qualified", "quoted",
  "test_drive", "negotiation", "won", "lost",
];

interface Props {
  leadId: string;
  currentStatus: LeadStatus;
}

export function LeadStatusUpdater({ leadId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: LeadStatus) {
    if (newStatus === currentStatus) return;
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("leads")
      .update({
        status: newStatus,
        ...(newStatus === "won" || newStatus === "lost"
          ? { closed_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", leadId);

    if (error) {
      toast.error("Error al actualizar el estado");
      setLoading(false);
      return;
    }

    await supabase.from("activities").insert({
      lead_id: leadId,
      type: "status_change",
      content: `Estado actualizado a: ${LEAD_STATUS_LABELS[newStatus]}`,
    });

    toast.success(`Estado actualizado a: ${LEAD_STATUS_LABELS[newStatus]}`);
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-1.5">
      {PIPELINE_ORDER.map((status) => (
        <button
          key={status}
          onClick={() => handleStatusChange(status)}
          disabled={loading}
          className={cn(
            "w-full text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all",
            currentStatus === status
              ? LEAD_STATUS_COLORS[status] + " ring-2 ring-offset-1 ring-current"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          {currentStatus === status && "✓ "}
          {LEAD_STATUS_LABELS[status]}
        </button>
      ))}
    </div>
  );
}
