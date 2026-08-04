import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    const { conversacionId, evento } = await request.json();

    if (!conversacionId || !evento) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const { error } = await supabase.from("funnel_events").insert({
      conversacion_id: conversacionId,
      evento,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error insertando evento:", error);
      return NextResponse.json({ error: "Error guardando evento" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en funnel route:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}