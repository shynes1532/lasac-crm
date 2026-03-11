"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

interface Props {
  leadId: string;
}

const ACTIVITY_TYPES = [
  { value: "note", label: "📝 Nota" },
  { value: "call", label: "📞 Llamada" },
  { value: "whatsapp", label: "💬 WhatsApp" },
  { value: "email", label: "📧 Email" },
  { value: "meeting", label: "🤝 Reunión" },
];

export function AddActivityForm({ leadId }: Props) {
  const router = useRouter();
  const [type, setType] = useState("note");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.from("activities").insert({
      lead_id: leadId,
      type,
      content: content.trim(),
    });

    if (error) {
      toast.error("Error al registrar la actividad");
    } else {
      toast.success("Actividad registrada");
      setContent("");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-2 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Registrá una nota, llamada, mensaje..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="p-2 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
