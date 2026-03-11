"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Vehicle { id: string; model: string; version: string; year: number }
interface User { id: string; full_name: string; role: string }

interface Props {
  vehicles: Vehicle[];
  users: User[];
}

export function NewLeadForm({ vehicles, users }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    source_channel: "whatsapp",
    interest_model_id: "",
    has_trade_in: false,
    needs_financing: false,
    priority: "medium",
    assigned_to: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.phone.trim()) {
      toast.error("Nombre y teléfono son obligatorios");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Crear o buscar contacto
      let contactId: string;

      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("phone", form.phone.trim())
        .single();

      if (existing) {
        contactId = existing.id;
        // Actualizar nombre si cambió
        await supabase
          .from("contacts")
          .update({ full_name: form.full_name.trim() })
          .eq("id", contactId);
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            full_name: form.full_name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            source_channel: form.source_channel,
          })
          .select("id")
          .single();

        if (contactError || !newContact) {
          toast.error("Error al crear el contacto: " + contactError?.message);
          setLoading(false);
          return;
        }
        contactId = newContact.id;
      }

      // 2. Crear lead
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          contact_id: contactId,
          assigned_to: form.assigned_to || null,
          status: "new",
          interest_model_id: form.interest_model_id || null,
          has_trade_in: form.has_trade_in,
          needs_financing: form.needs_financing,
          priority: form.priority,
          source_channel: form.source_channel,
        })
        .select("id")
        .single();

      if (leadError || !lead) {
        toast.error("Error al crear el lead: " + leadError?.message);
        setLoading(false);
        return;
      }

      // 3. Registrar nota inicial si hay
      if (form.notes.trim()) {
        await supabase.from("activities").insert({
          lead_id: lead.id,
          type: "note",
          content: form.notes.trim(),
        });
      }

      // 4. Actividad de creación
      await supabase.from("activities").insert({
        lead_id: lead.id,
        type: "system",
        content: `Lead creado manualmente desde el CRM`,
      });

      toast.success("Lead creado correctamente");
      router.push(`/dashboard/leads/${lead.id}`);
    } catch (err) {
      toast.error("Error inesperado");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Volver */}
      <Link
        href="/dashboard/leads"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al pipeline
      </Link>

      {/* Datos del contacto */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Datos del cliente</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono / WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="2901 123456"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="juan@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canal de origen</label>
            <select
              name="source_channel"
              value={form.source_channel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="whatsapp">📱 WhatsApp</option>
              <option value="facebook">📘 Facebook</option>
              <option value="instagram">📸 Instagram</option>
              <option value="web">🌐 Sitio Web</option>
              <option value="phone">📞 Teléfono</option>
              <option value="referral">👥 Referido</option>
              <option value="other">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Interés comercial */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Interés comercial</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de interés</label>
            <select
              name="interest_model_id"
              value={form.interest_model_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="">Sin definir</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.model} {v.version} ({v.year})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta 🔥</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="needs_financing"
              checked={form.needs_financing}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-700"
            />
            <span className="text-sm text-gray-700">Necesita financiación</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="has_trade_in"
              checked={form.has_trade_in}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-700"
            />
            <span className="text-sm text-gray-700">Tiene usado para entregar</span>
          </label>
        </div>
      </div>

      {/* Asignación */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Asignación</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a vendedor</label>
          <select
            name="assigned_to"
            value={form.assigned_to}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
          >
            <option value="">Sin asignar</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nota inicial (opcional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Ej: Cliente interesado en el Fastback, consultó por financiación en 36 cuotas..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
        >
          {loading ? "Creando lead..." : "Crear Lead"}
        </button>
        <Link
          href="/dashboard/leads"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors text-sm text-center"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
