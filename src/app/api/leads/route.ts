import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/leads — llamado desde n8n cuando el bot califica un lead
export async function POST(req: NextRequest) {
  try {
    // Verificar API key simple para n8n
    const apiKey = req.headers.get("x-api-key");
    if (apiKey !== process.env.CRM_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const {
      full_name,
      phone,
      email,
      city,           // "ushuaia" | "rio_grande"
      source_channel, // "whatsapp" | "facebook" | "instagram" | "web"
      interest_model, // nombre del modelo ej: "Cronos"
      operation_type, // "0km" | "plan_ahorro"
      has_trade_in,   // boolean
      needs_financing,// boolean
      notes,          // texto libre del bot
      priority,       // "low" | "medium" | "high"
      source_campaign,
    } = body;

    // Validaciones básicas
    if (!phone) {
      return NextResponse.json({ error: "phone es requerido" }, { status: 400 });
    }

    // 1. Crear o actualizar contacto (deduplicar por teléfono)
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("phone", phone.trim())
      .single();

    let contactId: string;

    if (existingContact) {
      contactId = existingContact.id;
      // Actualizar datos si el bot los capturó
      await supabase
        .from("contacts")
        .update({
          full_name: full_name?.trim() ?? undefined,
          email: email?.trim() ?? undefined,
        })
        .eq("id", contactId);
    } else {
      const { data: newContact, error: contactErr } = await supabase
        .from("contacts")
        .insert({
          full_name: full_name?.trim() ?? "Sin nombre",
          phone: phone.trim(),
          email: email?.trim() ?? null,
          source_channel: source_channel ?? "whatsapp",
          source_campaign: source_campaign ?? null,
        })
        .select("id")
        .single();

      if (contactErr || !newContact) {
        return NextResponse.json(
          { error: "Error creando contacto", detail: contactErr?.message },
          { status: 500 }
        );
      }
      contactId = newContact.id;
    }

    // 2. Verificar si ya tiene un lead activo para no duplicar
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, status")
      .eq("contact_id", contactId)
      .not("status", "in", '("won","lost","nurturing")')
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existingLead) {
      // Ya tiene un lead activo — solo registrar actividad
      await supabase.from("activities").insert({
        lead_id: existingLead.id,
        type: "whatsapp",
        content: `Nueva interacción del bot${notes ? `: ${notes}` : ""}`,
        metadata: { operation_type, city, from_bot: true },
      });

      return NextResponse.json({
        ok: true,
        lead_id: existingLead.id,
        action: "updated",
        message: "Lead existente actualizado con nueva actividad",
      });
    }

    // 3. Buscar el modelo de vehículo si se especificó
    let interestModelId: string | null = null;
    if (interest_model) {
      const { data: vehicle } = await supabase
        .from("vehicle_models")
        .select("id")
        .ilike("model", `%${interest_model}%`)
        .eq("active", true)
        .limit(1)
        .single();
      interestModelId = vehicle?.id ?? null;
    }

    // 4. Crear el lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        contact_id: contactId,
        status: "new",
        source_channel: source_channel ?? "whatsapp",
        source_campaign: source_campaign ?? null,
        interest_model_id: interestModelId,
        has_trade_in: has_trade_in ?? false,
        needs_financing: needs_financing ?? (operation_type === "plan_ahorro" ? false : true),
        priority: priority ?? "high", // leads del bot son alta prioridad
      })
      .select("id")
      .single();

    if (leadErr || !lead) {
      return NextResponse.json(
        { error: "Error creando lead", detail: leadErr?.message },
        { status: 500 }
      );
    }

    // 5. Registrar actividad con el resumen del bot
    const activityContent = [
      `Lead calificado por bot de WhatsApp`,
      city ? `Ciudad: ${city === "ushuaia" ? "Ushuaia" : "Río Grande"}` : null,
      interest_model ? `Modelo de interés: ${interest_model}` : null,
      operation_type ? `Operación: ${operation_type === "0km" ? "0KM" : "Plan de Ahorro"}` : null,
      has_trade_in ? "Tiene usado para entregar" : null,
      needs_financing ? "Necesita financiación" : null,
      notes ? `Notas: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    await supabase.from("activities").insert({
      lead_id: lead.id,
      type: "system",
      content: activityContent,
      metadata: { operation_type, city, from_bot: true },
    });

    return NextResponse.json({
      ok: true,
      lead_id: lead.id,
      contact_id: contactId,
      action: "created",
      message: "Lead creado correctamente desde el bot",
    });
  } catch (error) {
    console.error("[API /leads] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
