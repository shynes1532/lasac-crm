import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente con service role para operaciones del sistema (sin RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
      imageMessage?: { caption?: string };
      documentMessage?: { title?: string };
    };
    messageType: string;
    messageTimestamp: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const payload: EvolutionWebhookPayload = await req.json();

    // Solo procesar mensajes entrantes
    if (payload.event !== "messages.upsert" || payload.data.key.fromMe) {
      return NextResponse.json({ ok: true });
    }

    const { remoteJid, id: externalMessageId } = payload.data.key;
    const phone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");

    // Ignorar grupos
    if (remoteJid.includes("@g.us")) {
      return NextResponse.json({ ok: true });
    }

    const content =
      payload.data.message?.conversation ||
      payload.data.message?.extendedTextMessage?.text ||
      payload.data.message?.imageMessage?.caption ||
      "[Archivo multimedia]";

    const senderName = payload.data.pushName ?? "Sin nombre";

    // 1. Buscar o crear contacto
    let contact = await supabase
      .from("contacts")
      .select("*")
      .eq("phone", phone)
      .single()
      .then((r) => r.data);

    if (!contact) {
      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          full_name: senderName,
          phone,
          source_channel: "whatsapp",
        })
        .select()
        .single();
      contact = newContact;
    }

    if (!contact) {
      return NextResponse.json({ error: "No se pudo crear el contacto" }, { status: 500 });
    }

    // 2. Buscar o crear conversación
    let conversation = await supabase
      .from("conversations")
      .select("*")
      .eq("channel", "whatsapp")
      .eq("external_chat_id", remoteJid)
      .single()
      .then((r) => r.data);

    if (!conversation) {
      // Buscar si ya tiene un lead activo
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("contact_id", contact.id)
        .not("status", "in", '("won","lost")')
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let leadId = existingLead?.id;

      // Crear lead si no existe
      if (!leadId) {
        const { data: newLead } = await supabase
          .from("leads")
          .insert({
            contact_id: contact.id,
            status: "new",
            source_channel: "whatsapp",
            priority: "high",
          })
          .select()
          .single();
        leadId = newLead?.id;

        // Registrar actividad de creación
        if (leadId) {
          await supabase.from("activities").insert({
            lead_id: leadId,
            type: "system",
            content: `Lead creado automáticamente por mensaje de WhatsApp entrante`,
          });
        }
      }

      const { data: newConversation } = await supabase
        .from("conversations")
        .insert({
          lead_id: leadId,
          contact_id: contact.id,
          channel: "whatsapp",
          external_chat_id: remoteJid,
          status: "open",
        })
        .select()
        .single();
      conversation = newConversation;
    }

    if (!conversation) {
      return NextResponse.json({ error: "No se pudo crear la conversación" }, { status: 500 });
    }

    // 3. Guardar mensaje
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      direction: "inbound",
      sender_type: "lead",
      sender_id: contact.id,
      content,
      message_type: "text",
      external_message_id: externalMessageId,
    });

    // 4. Actualizar última actividad de la conversación
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString(), status: "open" })
      .eq("id", conversation.id);

    console.log(`[WhatsApp Webhook] Mensaje de ${phone} procesado correctamente`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
