import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST() {
  try {
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .order("fecha_creacion", { ascending: false })
      .limit(100);

    const { data: conversaciones } = await supabase
      .from("conversaciones")
      .select("*")
      .order("fecha_inicio", { ascending: false })
      .limit(200);

    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating, comentario, fecha_creacion")
      .order("fecha_creacion", { ascending: false })
      .limit(100);

    const resumenDatos = {
      total_leads: leads?.length || 0,
      leads: (leads || []).map(l => ({
        industria: l.industria,
        ciudad: l.ciudad,
        tipo: l.tipo,
        valor: l.valor_potencial,
        score: l.score,
        estado: l.estado,
        fecha: l.fecha_creacion,
        fecha_contactado: l.fecha_contactado,
      })),
      total_conversaciones: conversaciones?.length || 0,
      conversaciones: (conversaciones || []).map(c => ({
        hora: c.hora_del_dia,
        llego_al_cierre: c.llego_al_cierre,
        temperatura: c.temperatura,
        num_mensajes: c.num_mensajes,
      })),
      reviews: (reviews || []).map(r => ({
        rating: r.rating,
        comentario: r.comentario,
      })),
    };

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: `Eres el analista de inteligencia de negocio de Atheneum, un club empresarial privado de lujo en Quito, Ecuador. Athena es su concierge AI que captura leads.

Analiza los datos y genera EXACTAMENTE 3 o 4 insights accionables para Andres, el dueño del club.

REGLAS:
- Cada insight debe ser CONCRETO y ACCIONABLE — no observaciones genericas
- Usa numeros reales de los datos
- Si detectas dinero perdido o en riesgo, cuantificalo
- Si hay patrones de horario, industria o comportamiento, senalalo con la accion recomendada
- Si los datos son muy pocos para un insight, dilo honestamente y sugiere que accion tomar para generar mas datos
- Maximo 2 lineas por insight
- Tono directo y ejecutivo, sin relleno

Responde SOLO con JSON valido, sin backticks ni explicaciones:
{
  "insights": [
    {"icono": "💰", "titulo": "Titulo corto", "detalle": "Explicacion con numeros y accion recomendada"},
    {"icono": "⏰", "titulo": "...", "detalle": "..."}
  ]
}

Iconos disponibles: 💰 ⏰ 🔥 📈 📉 ⚠️ 🎯 💡`,
      messages: [
        {
          role: "user",
          content: `Datos de Atheneum:\n${JSON.stringify(resumenDatos, null, 2)}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error generando insights:", error);
    return NextResponse.json(
      { error: "Error generando insights" },
      { status: 500 }
    );
  }
}