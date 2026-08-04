import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      conversacionId,
      nombre,
      fecha,
      hora,
      personas,
      tipo,
      preferencia,
      nota,
      fuente,
    } = body;

    const { error } = await supabase.from("reservas").insert({
      conversacion_id: conversacionId || null,
      nombre: nombre || null,
      fecha: fecha || null,
      hora: hora || null,
      personas: personas || null,
      tipo: tipo || null,
      preferencia: preferencia || null,
      nota: nota || null,
      fuente: fuente || null,
      estado: "pendiente",
    });

    if (error) {
      console.error("Error guardando reserva:", error);
      return NextResponse.json({ error: "Error guardando reserva" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en reservas route:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}