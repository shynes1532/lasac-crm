"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, UserPlus, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Lead {
  id: string;
  contact?: { full_name?: string; phone?: string } | null;
  interest_model?: { model?: string; version?: string } | null;
}

interface Vehicle {
  id: string;
  model: string;
  version: string;
  year: number;
  base_price: number;
  currency: string;
}

interface Props {
  leads: Lead[];
  vehicles: Vehicle[];
  defaultLeadId?: string;
}

export function NewQuoteForm({ leads, vehicles, defaultLeadId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);

  const [form, setForm] = useState({
    lead_id: defaultLeadId ?? "",
    vehicle_model_id: "",
    color: "",
    discount_pct: "0",
    financing_included: false,
    trade_in_included: false,
    trade_in_value: "",
    valid_days: "72",
    notes: "",
  });

  // Datos del cliente nuevo (si elige crear uno)
  const [newClient, setNewClient] = useState({
    full_name: "",
    phone: "",
    email: "",
  });

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    const v = vehicles.find((v) => v.id === form.vehicle_model_id) ?? null;
    setSelectedVehicle(v);
  }, [form.vehicle_model_id, vehicles]);

  useEffect(() => {
    if (form.lead_id && defaultLeadId === form.lead_id) {
      const lead = leads.find((l) => l.id === form.lead_id);
      if (lead?.interest_model) {
        const matchingVehicle = vehicles.find(
          (v) =>
            v.model === lead.interest_model?.model &&
            v.version === lead.interest_model?.version
        );
        if (matchingVehicle) {
          setForm((prev) => ({ ...prev, vehicle_model_id: matchingVehicle.id }));
        }
      }
    }
  }, [form.lead_id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  function handleNewClientChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setNewClient((prev) => ({ ...prev, [name]: value }));
  }

  const basePrice = selectedVehicle?.base_price ?? 0;
  const discountAmt = basePrice * (parseFloat(form.discount_pct) / 100);
  const tradeInVal = form.trade_in_included ? parseFloat(form.trade_in_value) || 0 : 0;
  const finalPrice = basePrice - discountAmt - tradeInVal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.vehicle_model_id) {
      toast.error("Seleccioná el modelo de vehículo");
      return;
    }

    // Validar según modo
    if (showNewClient) {
      if (!newClient.full_name.trim() || !newClient.phone.trim()) {
        toast.error("Nombre y teléfono del cliente son obligatorios");
        return;
      }
    } else {
      if (!form.lead_id) {
        toast.error("Seleccioná un cliente existente o creá uno nuevo");
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("No autenticado"); setLoading(false); return; }

    let leadId = form.lead_id;

    // Si es cliente nuevo, crear contacto + lead
    if (showNewClient) {
      // Buscar si ya existe por teléfono
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("phone", newClient.phone.trim())
        .single();

      let contactId: string;

      if (existingContact) {
        contactId = existingContact.id;
        toast.info("El teléfono ya existe en el sistema, se usó el contacto existente");
      } else {
        const { data: created, error: contactErr } = await supabase
          .from("contacts")
          .insert({
            full_name: newClient.full_name.trim(),
            phone: newClient.phone.trim(),
            email: newClient.email.trim() || null,
            source_channel: "other",
          })
          .select("id")
          .single();

        if (contactErr || !created) {
          toast.error("Error al crear el contacto: " + contactErr?.message);
          setLoading(false);
          return;
        }
        contactId = created.id;
      }

      // Crear lead asociado
      const { data: newLead, error: leadErr } = await supabase
        .from("leads")
        .insert({
          contact_id: contactId,
          status: "quoted",
          source_channel: "other",
          interest_model_id: form.vehicle_model_id || null,
          priority: "medium",
        })
        .select("id")
        .single();

      if (leadErr || !newLead) {
        toast.error("Error al crear el lead: " + leadErr?.message);
        setLoading(false);
        return;
      }
      leadId = newLead.id;

      await supabase.from("activities").insert({
        lead_id: leadId,
        type: "system",
        content: "Lead creado automáticamente al generar una cotización directa",
      });
    }

    // Crear la cotización
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + parseInt(form.valid_days) * 24);

    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({
        lead_id: leadId,
        created_by: user.id,
        vehicle_model_id: form.vehicle_model_id,
        color: form.color || null,
        base_price: basePrice,
        discount_pct: parseFloat(form.discount_pct),
        final_price: Math.max(finalPrice, 0),
        financing_included: form.financing_included,
        trade_in_included: form.trade_in_included,
        trade_in_value: tradeInVal > 0 ? tradeInVal : null,
        status: "draft",
        valid_until: validUntil.toISOString(),
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (error || !quote) {
      toast.error("Error al crear la cotización: " + error?.message);
      setLoading(false);
      return;
    }

    await supabase.from("activities").insert({
      lead_id: leadId,
      type: "quote_sent",
      content: `Cotización generada: ${selectedVehicle?.model} ${selectedVehicle?.version} — ${formatCurrency(Math.max(finalPrice, 0), selectedVehicle?.currency as "ARS" | "USD")}`,
    });

    toast.success("Cotización creada correctamente");
    router.push("/dashboard/quotes");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Link
        href="/dashboard/quotes"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a cotizaciones
      </Link>

      {/* Cliente */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Cliente</h2>
          <button
            type="button"
            onClick={() => {
              setShowNewClient(!showNewClient);
              setForm((p) => ({ ...p, lead_id: "" }));
              setNewClient({ full_name: "", phone: "", email: "" });
            }}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
              showNewClient
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-brand-50 text-brand-700 hover:bg-red-100 hover:text-brand-800"
            }`}
          >
            {showNewClient ? (
              <><X className="w-3.5 h-3.5" /> Cancelar cliente nuevo</>
            ) : (
              <><UserPlus className="w-3.5 h-3.5" /> Cliente nuevo</>
            )}
          </button>
        </div>

        {showNewClient ? (
          /* Formulario de cliente nuevo */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="sm:col-span-2 text-xs text-blue-600 font-medium">
              Se creará un nuevo contacto y lead automáticamente
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={newClient.full_name}
                onChange={handleNewClientChange}
                placeholder="Juan Pérez"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono / WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={newClient.phone}
                onChange={handleNewClientChange}
                placeholder="2901 123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (opcional)
              </label>
              <input
                type="email"
                name="email"
                value={newClient.email}
                onChange={handleNewClientChange}
                placeholder="juan@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 bg-white"
              />
            </div>
          </div>
        ) : (
          /* Selector de lead existente */
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar cliente existente <span className="text-red-500">*</span>
            </label>
            <select
              name="lead_id"
              value={form.lead_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="">— Elegí un cliente —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.contact?.full_name ?? "Sin nombre"}
                  {l.contact?.phone ? ` · ${l.contact.phone}` : ""}
                  {l.interest_model ? ` (${l.interest_model.model} ${l.interest_model.version})` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              ¿No está en la lista?{" "}
              <button
                type="button"
                onClick={() => setShowNewClient(true)}
                className="text-brand-700 hover:underline font-medium"
              >
                Crear cliente nuevo
              </button>
            </p>
          </div>
        )}
      </div>

      {/* Vehículo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Vehículo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo <span className="text-red-500">*</span>
            </label>
            <select
              name="vehicle_model_id"
              value={form.vehicle_model_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="">Seleccioná el modelo</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.model} {v.version} ({v.year})
                  {v.base_price > 0
                    ? ` — ${formatCurrency(v.base_price, v.currency as "ARS" | "USD")}`
                    : " — A consultar"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="text"
              name="color"
              value={form.color}
              onChange={handleChange}
              placeholder="Ej: Rojo Pasión"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
            <input
              type="number"
              name="discount_pct"
              value={form.discount_pct}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
            {parseFloat(form.discount_pct) > 3 && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ Descuento mayor al 3% requiere aprobación del gerente
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="financing_included"
              checked={form.financing_included}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-700"
            />
            <span className="text-sm text-gray-700">Incluye financiación</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="trade_in_included"
              checked={form.trade_in_included}
              onChange={handleChange}
              className="w-4 h-4 accent-brand-700"
            />
            <span className="text-sm text-gray-700">Incluye toma de usado</span>
          </label>
        </div>

        {form.trade_in_included && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor del usado ($)
            </label>
            <input
              type="number"
              name="trade_in_value"
              value={form.trade_in_value}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
            />
          </div>
        )}
      </div>

      {/* Resumen de precio */}
      {selectedVehicle && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Resumen de precio</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Precio base</span>
              <span>{formatCurrency(basePrice, selectedVehicle.currency as "ARS" | "USD")}</span>
            </div>
            {parseFloat(form.discount_pct) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descuento ({form.discount_pct}%)</span>
                <span>-{formatCurrency(discountAmt, selectedVehicle.currency as "ARS" | "USD")}</span>
              </div>
            )}
            {form.trade_in_included && tradeInVal > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>Toma de usado</span>
                <span>-{formatCurrency(tradeInVal, selectedVehicle.currency as "ARS" | "USD")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
              <span>Precio final</span>
              <span>{formatCurrency(Math.max(finalPrice, 0), selectedVehicle.currency as "ARS" | "USD")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Validez y notas */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Validez de la cotización
          </label>
          <select
            name="valid_days"
            value={form.valid_days}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
          >
            <option value="24">24 horas</option>
            <option value="48">48 horas</option>
            <option value="72">72 horas (recomendado)</option>
            <option value="168">7 días</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas adicionales
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Condiciones especiales, accesorios incluidos, etc."
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
          {loading ? "Creando cotización..." : "Crear Cotización"}
        </button>
        <Link
          href="/dashboard/quotes"
          className="px-6 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors text-sm text-center"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
