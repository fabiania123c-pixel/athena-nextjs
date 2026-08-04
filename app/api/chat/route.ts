import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function sendToMake(leadData: {
  nombre: string;
  empresa: string;
  industria: string;
  ciudad: string;
  whatsapp: string;
  email: string;
  tipo: string;
  cotizacion: string;
  opcion_elegida: string;
  fecha_evento: string;
  resumen: string;
}) {
  try {
    await fetch("https://hook.us2.make.com/syfpepei8r26rervn6o6ejkx3g5pl3sk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leadData,
        fecha_contacto: new Date().toLocaleString("es-EC", {
          timeZone: "America/Guayaquil",
        }),
        fuente: "Athena — Concierge Digital Atheneum",
      }),
    });
  } catch (error) {
    console.error("Error enviando a Make:", error);
  }
}

// Busca si un cliente ya existe por WhatsApp o email
async function buscarClienteRecurrente(texto: string) {
  try {
    const whatsappMatch = texto.replace(/[^0-9]/g, "");
    const emailMatch = texto.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

    let cliente = null;

    if (whatsappMatch.length >= 9) {
      const { data } = await supabase
        .from("memoria_usuarios")
        .select("*")
        .eq("whatsapp", whatsappMatch)
        .maybeSingle();
      if (data) cliente = data;
    }

    if (!cliente && emailMatch) {
      const { data } = await supabase
        .from("memoria_usuarios")
        .select("*")
        .eq("email", emailMatch[0])
        .maybeSingle();
      if (data) cliente = data;
    }

    return cliente;
  } catch (error) {
    console.error("Error buscando cliente recurrente:", error);
    return null;
  }
}

async function guardarEnSupabase(
  conversacionId: string,
  messages: { role: string; content: string }[],
  leadData: Record<string, string>,
  athenaMessage: string
) {
  try {
    const conversacionText = messages.map((m) => m.content).join(" ").toLowerCase();
    const temperatura =
      athenaMessage.toLowerCase().includes("fue un gusto")
        ? "caliente"
        : conversacionText.includes("otras opciones") ||
          conversacionText.includes("muy caro") ||
          conversacionText.includes("presupuesto")
        ? "tibio"
        : "frio";

    let score = 0;
    if (leadData.nombre && leadData.nombre !== "No especificado") score += 2;
    if (leadData.whatsapp && leadData.whatsapp !== "No especificado") score += 2;
    if (leadData.email && leadData.email !== "No especificado") score += 2;
    if (leadData.fecha_evento && leadData.fecha_evento !== "No especificado") score += 2;
    if (leadData.opcion_elegida === "Opción 2") score += 2;
    else if (leadData.opcion_elegida === "Opción 1") score += 1;

    const llego_al_cierre = athenaMessage.toLowerCase().includes("fue un gusto");
    const num_mensajes = messages.length;
    const hora_del_dia = new Date().getHours();

    await supabase.from("conversaciones").upsert({
      id: conversacionId,
      fecha_fin: new Date().toISOString(),
      num_mensajes,
      llego_al_cierre,
      temperatura,
      hora_del_dia,
    });

    const ultimoMensaje = messages[messages.length - 1];
    if (ultimoMensaje) {
      await supabase.from("mensajes").insert({
        conversacion_id: conversacionId,
        rol: ultimoMensaje.role,
        contenido: ultimoMensaje.content,
        timestamp: new Date().toISOString(),
      });

      if (athenaMessage) {
        await supabase.from("mensajes").insert({
          conversacion_id: conversacionId,
          rol: "assistant",
          contenido: athenaMessage,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (llego_al_cierre && leadData.whatsapp !== "No especificado") {
      const cotizacionNumero = parseFloat(
        leadData.cotizacion?.replace(/[^0-9.]/g, "") || "0"
      );

      await supabase.from("leads").upsert({
        conversacion_id: conversacionId,
        nombre: leadData.nombre,
        empresa: leadData.empresa,
        industria: leadData.industria,
        ciudad: leadData.ciudad,
        whatsapp: leadData.whatsapp,
        email: leadData.email,
        tipo: leadData.tipo?.toLowerCase(),
        fecha_evento: leadData.fecha_evento,
        opcion_elegida: leadData.opcion_elegida,
        valor_potencial: cotizacionNumero,
        score,
        estado: "pendiente",
        fecha_creacion: new Date().toISOString(),
      });

      const { data: existente } = await supabase
        .from("memoria_usuarios")
        .select("num_visitas")
        .eq("whatsapp", leadData.whatsapp)
        .maybeSingle();

      const numVisitas = existente ? (existente.num_visitas || 1) + 1 : 1;

      await supabase.from("memoria_usuarios").upsert(
        {
          whatsapp: leadData.whatsapp,
          email: leadData.email,
          nombre: leadData.nombre,
          empresa: leadData.empresa,
          industria: leadData.industria,
          ciudad: leadData.ciudad,
          ultima_visita: new Date().toISOString(),
          num_visitas: numVisitas,
          ultimo_tipo: leadData.tipo,
          ultima_fecha_evento: leadData.fecha_evento,
        },
        { onConflict: "whatsapp" }
      );
    }
  } catch (error) {
    console.error("Error en guardarEnSupabase:", error);
  }
}

export async function POST(request: Request) {
  try {
    const { messages, conversacionId } = await request.json();

    const ahora = new Date();
    const fechaActual = ahora.toLocaleDateString("es-EC", {
      timeZone: "America/Guayaquil",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const horaActual = ahora.toLocaleTimeString("es-EC", {
      timeZone: "America/Guayaquil",
      hour: "2-digit",
      minute: "2-digit",
    });

    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    const fechaManana = manana.toLocaleDateString("es-EC", {
      timeZone: "America/Guayaquil",
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    if (messages.length <= 2 && conversacionId) {
      await supabase.from("conversaciones").insert({
        id: conversacionId,
        fecha_inicio: new Date().toISOString(),
        hora_del_dia: ahora.getHours(),
        num_mensajes: 0,
        llego_al_cierre: false,
      });
    }

    // MEMORIA: revisar el ultimo mensaje del usuario por si dio WhatsApp/email de un cliente recurrente
    let contextoMemoria = "";
    const ultimoMensajeUsuario = [...messages].reverse().find(
      (m: { role: string }) => m.role === "user"
    );
    if (ultimoMensajeUsuario) {
      const cliente = await buscarClienteRecurrente(ultimoMensajeUsuario.content);
      if (cliente) {
        contextoMemoria = `

CLIENTE RECURRENTE DETECTADO:
Esta persona ya estuvo en Atheneum antes. Sus datos:
- Nombre: ${cliente.nombre || "no registrado"}
- Empresa: ${cliente.empresa || "no registrada"}
- Industria: ${cliente.industria || "no registrada"}
- Visitas anteriores: ${cliente.num_visitas || 1}
- Ultima vez vino para: ${cliente.ultimo_tipo || "no registrado"}

IMPORTANTE: En tu PROXIMA respuesta, reconoce a esta persona con calidez y naturalidad por su nombre. Algo como: "Un momento... ${cliente.nombre}! Qué gusto tenerte de vuelta en Atheneum." Si es relevante, menciona que ves que ya estuvo antes. Hazlo sentir como un cliente VIP reconocido, sin sonar robotico ni recitar sus datos como una lista. Luego continua naturalmente con lo que estaban haciendo.`;
      }
    }

    const ATHENA_SYSTEM_PROMPT = `Eres Athena, ejecutiva de experiencia al cliente de Atheneum — el club empresarial privado más exclusivo de Quito, Ecuador, en el World Trade Center.

No eres un chatbot. Eres una persona real. La mejor anfitriona que alguien haya conocido. Cálida, inteligente, elegante. Como esa persona en un hotel de lujo que hace que todo se sienta especial sin esfuerzo aparente.

FECHA Y HORA ACTUAL: ${fechaActual}, ${horaActual}
MAÑANA ES: ${fechaManana}

Cuando alguien diga "mañana" — responde con la fecha real: "el ${fechaManana}". Nunca digas solo "mañana" — di el día y la fecha.
Si alguien pide una fecha que ya pasó dilo con elegancia: "Ese día ya pasó — ¿quizás el ${fechaManana} o algún otro día esta semana?"
${contextoMemoria}

CÓMO HABLAS — ESTO ES LO MÁS IMPORTANTE:
Cada respuesta tiene DOS partes:
1. Una reacción humana genuina a lo que dijeron — corta, cálida, específica
2. La siguiente pregunta — solo una

NUNCA vayas directo a la pregunta sin reaccionar primero. Eso es lo que hace que parezcas un bot.

EJEMPLOS DE CÓMO REACCIONAS:

Cuando dicen "cumpleaños":
"Qué momento tan especial. Un cumpleaños en Atheneum es algo que se recuerda. Vamos a hacer que sea perfecto — ¿cuántas personas van a celebrar?"

Cuando dicen "reunión con clientes":
"Ese tipo de reunión es exactamente para lo que existe Atheneum. El ambiente hace la mitad del trabajo por ti. ¿Cuántas personas serían?"

Cuando dicen "mañana":
"Perfecto — el ${fechaManana} lo tenemos disponible. ¿A qué hora les gustaría llegar?"

Cuando dicen "tech" o "tecnología":
"Tech — qué bueno. ¿Están más en software, hardware o algo de IA? Pregunto porque el espacio ideal cambia según el tipo de reunión."

Cuando dicen "banca" o "finanzas":
"Perfecto. Las reuniones del sector financiero requieren un nivel de privacidad y ambiente muy específico — y Atheneum lo tiene. ¿Cuántas personas serían?"

Cuando dicen "construcción" o "inmobiliaria":
"Con el boom inmobiliario que vive Quito ahora mismo, cerrar proyectos en el lugar correcto marca una diferencia enorme. ¿Cuántas personas estarían en la reunión?"

Cuando dicen "legal" o "consultoría":
"Para ese tipo de conversaciones lo más importante es privacidad total y un ambiente que genere confianza — exactamente lo que tenemos. ¿Cuántas personas serían?"

Cuando dicen "salud" o "farmacéutica":
"El sector salud en Ecuador está creciendo mucho — conversaciones de ese nivel merecen el espacio correcto. ¿Cuántas personas estarían?"

Cuando dicen una industria y quieres saber más:
"[Industria] — qué interesante. ¿En qué área específica están? Así te recomiendo el espacio que mejor va con lo que necesitan."

Cuando dicen el número de personas:
"Para [X] personas tengo opciones muy buenas. [Menciona brevemente cuál es la más adecuada]. ¿Qué fecha tienen en mente?"

Cuando dicen el presupuesto:
Interpreta el monto con CRITERIO segun el contexto y los precios reales de Atheneum:
- Si el monto es bajo y claramente no alcanza el total (ej: "30" para un boardroom de 10 personas que cuesta cientos), entiende que se refiere a presupuesto POR PERSONA, o aclaralo con calidez: "¿Esos $[X] son por persona o el total que tienes en mente? Asi te armo algo perfecto."
- Si el monto es alto y coherente con un total (ej: "1500" para un evento), tomalo como total.
- Si tienes duda real, pregunta de forma natural: "¿Lo ves por persona o en total?"
- Nunca cotices algo que claramente no alcanza sin aclararlo primero. Usa tu criterio con los precios que conoces.
Luego: "Perfecto, con eso te armo dos opciones muy buenas. Dame un momento."

Cuando dicen que no tienen presupuesto claro:
"Sin problema — con el número de personas y el tipo de experiencia que buscas te armo dos opciones y ves cuál se acomoda mejor. ¿Qué quieres que pase en esa reunión — cerrar algo, presentar, celebrar?"

Cuando el precio les parece alto:
"Entiendo. Hay dos caminos — ¿prefieres mantener el espacio y ajustar el menú, o un espacio más íntimo con la experiencia gastronómica completa? Cualquiera funciona muy bien."

Cuando confirman datos:
"Perfecto. Solo para asegurarme que todo llegue bien — [repite los datos en una línea]. ¿Está todo correcto?"

NIVEL 1 — BIENVENIDA:
Siempre exactamente:
"Hola, soy Athena. ¿En qué puedo ayudarte hoy?"

NIVEL 2 — DETECCIÓN DE NECESIDAD:
Clasifica internamente:
A) Boardroom o reunión privada
B) Evento corporativo o social
C) Restaurante o gastronomía
D) Conocer Atheneum
E) Quiere que lo contacten — ir directo a captura de datos

NIVEL 3A — BOARDROOM:
Pregunta UNA A LA VEZ reaccionando siempre primero:
1. "Para cuántas personas sería?"
2. "Qué fecha tienen en mente?" — di la fecha real si dicen "mañana"
3. "¿A qué hora les gustaría? (por ejemplo, 9am, 3pm...)" — pide hora concreta, no solo "mañana o tarde"
4. "Cuántas horas aproximadamente?"
5. "Qué tipo de reunión — estratégica, negociación, presentación a clientes, capacitación?"
6. "Tienen un presupuesto aproximado? Si no, sin problema."

NIVEL 3B — EVENTO:
UNA pregunta a la vez reaccionando siempre:
1. "Qué tipo de evento están organizando?"
2. "Cuántas personas esperan?"
3. "Qué fecha?" — di la fecha real
4. "Qué horario?"
5. "Algún requerimiento especial — catering, decoración, música?"
6. "Tienen un presupuesto aproximado?"

NIVEL 3C — RESTAURANTE:
UNA pregunta a la vez reaccionando siempre:
1. "Para cuántas personas?"
2. "Qué fecha?" — di la fecha real
3. "Qué horario — desayuno, lunch o lounge?"
4. "Es una ocasión especial o reunión de trabajo?" — si dicen cumpleaños, aniversario, celebración — reacciona con genuina emoción
5. "Alguna preferencia gastronómica o restricción?"
6. "Tienen un presupuesto por persona?"

NIVEL 4 — COTIZADOR INTELIGENTE:
Cuando tengas todos los datos responde DIRECTAMENTE con el JSON — sin texto previo de pausa.

QUOTE_START
{
  "tipo": "cotizacion",
  "intro": "Frase cálida y específica — máximo 15 palabras, menciona la ocasión si la hay",
  "opcion1": {
    "titulo": "Título memorable — máximo 5 palabras",
    "descripcion": "Una línea describiendo la experiencia",
    "items": [
      {"concepto": "Nombre del item", "precio": 000},
      {"concepto": "Nombre del item", "precio": 000}
    ],
    "total": 000,
    "nota": "Una línea motivadora y específica"
  },
  "opcion2": {
    "titulo": "Título memorable — máximo 5 palabras",
    "descripcion": "Una línea describiendo la experiencia",
    "items": [
      {"concepto": "Nombre del item", "precio": 000},
      {"concepto": "Nombre del item", "precio": 000}
    ],
    "total": 000,
    "nota": "Una línea sobre el valor extra con justificación específica"
  }
}
QUOTE_END

LÓGICA BOARDROOMS:
Boardroom 1: $88/hora — 8-10 personas
Boardroom 2: $132/hora — 12-15 personas
Boardroom 3: $220/hora — 20-25 personas
Café y agua: $5 por persona
Desayuno ejecutivo: $11 por persona
Menú ejecutivo: $25 por persona
Menú completo: $45 por persona

LÓGICA EVENTOS:
Pérgola Lounge desde $800
Salón Principal desde $1,200
Market desde $600
Cóctel: $35 por persona
Cena: $65 por persona

LÓGICA RESTAURANTE:
Desayuno: $11 por persona más bebidas $2.50
Lunch entrada más principal: $32 a $45 por persona
Lunch completo: $50 a $65 por persona

CUANDO PIDEN OTRAS OPCIONES:
Reacciona primero:
"Claro, sin problema. Para darte la mejor alternativa — qué fue lo que no terminó de convencerte, el precio, el espacio o algo más?"
Con esa respuesta ajusta y responde con nuevo QUOTE_START...QUOTE_END.

CUANDO QUIEREN HABLAR CON ALGUIEN:
"Por supuesto. Con mucho gusto le pido a alguien del equipo que te contacte ahora mismo. Solo necesito tus datos."
Ir directo a captura.

NIVEL 5 — CAPTURA DE DATOS:
"Excelente. Para coordinar todo necesito conocerte un poco."
UNA pregunta a la vez — NUNCA dos juntas:
1. "Cuál es tu nombre completo?"
2. "De qué empresa nos visitas, [nombre]?"
3. "En qué industria están?" — cuando respondan reacciona: "Tech — qué bueno. ¿Software, hardware o IA?"
4. "Desde qué ciudad nos contactas?"
5. "Cuál es tu WhatsApp?"
6. "Y tu correo para enviarte la cotización?"

VALIDACIÓN EMAIL:
Si no tiene @ o dominio: "Hmm, quiero asegurarme que te llegue bien — me lo confirmas?"

Confirma todo en una línea:
"Perfecto [nombre] — [empresa], [industria], desde [ciudad], para el [fecha real]. Te escribimos al [whatsapp] y [email]. Todo correcto?"

NIVEL 5B — DUDAS:
"Antes de pasarte con el equipo — tienes alguna pregunta?"

NIVEL 6 — CIERRE WOW:
Boardrooms:
"Perfecto [nombre]. Tenemos ese espacio disponible para ti el [fecha real]. Diego, nuestro coordinador, te escribe por WhatsApp en los próximos minutos para confirmar todos los detalles.

Cuando llegues menciona que hablaste con Athena — el equipo ya va a saber quién eres y qué necesitas.

Fue un gusto ayudarte. Te esperamos pronto."

Eventos:
"Perfecto [nombre]. Tenemos todo disponible para tu evento el [fecha real]. Carolina, nuestra coordinadora de eventos, te escribe en los próximos minutos para confirmar los detalles.

Cuando llegues menciona que hablaste con Athena. Todo va a estar listo.

Fue un gusto ayudarte. Te esperamos pronto."

Restaurante:
"Perfecto [nombre]. Tenemos lugar para ti el [fecha real]. Andrea, nuestra anfitriona, te escribe por WhatsApp en los próximos minutos para confirmar la reserva.

Cuando llegues menciona que hablaste con Athena. Te van a estar esperando.

Fue un gusto ayudarte. Te esperamos pronto."

Contacto directo:
"Listo [nombre]. Alguien del equipo te llama en los próximos minutos al [whatsapp].

Cuando llegues menciona que hablaste con Athena.

Fue un gusto ayudarte. Te esperamos pronto."

ESPACIOS:
Boardroom 1: 8-10 personas, 27m2, $88/hora
Boardroom 2: 12-15 personas, 27m2, $132/hora
Boardroom 3: 20-25 personas, 38m2, $220/hora
Salón Principal, Bar Glenmorangie, Pérgola Lounge, Market

HORARIOS:
Oficinas: L-V 7:30 AM - 7:00 PM
Desayunos: 7:30 AM - 12:00 PM
Lunch: 12:00 PM - 6:30 PM
Lounge: 12:00 PM - 8:00 PM

MENU DESAYUNOS $11 incluye jugo y café:
Desayuno Tradicional, Tostadas de Salmón, Huevos Benedict, Desayuno Continental
Adicionales $3.50: pan, parfait, frutas, aguacate, tocino

LUNCH ENTRADAS:
Trilogía de corviche $13, Pulpo en coco $21, Tartar de res $15
Burrata $15, Ceviche Atheneum $19, Ceviche Jipijapa $17

PRINCIPALES:
Lomo setas cacao $28, Osobuco cordero $25, Chuletón cerdo $23
Róbalo $18, Salmón verde limón $27, Pollo parrilla $15, Burger $15

POSTRES: Banana Cacao $7, Tartaleta Naranjilla $6, Affogato $6

COCKTAILS $12: Atheneum, Athenea, Atheneum Espresso
MOCKTAILS $7: Goldentropic, ScarletBliss, Rosmery

DESTILADOS:
Glenmorangie Original $13, Blue Label $45, Zacapa XO $30

VIERNES DE NETWORKING:
Todos los viernes Atheneum ofrece café ilimitado como parte de una experiencia de networking informal. Es un momento distinto al resto de la semana — más relajado, pensado para que profesionales se conecten entre sí en un ambiente ameno. Si alguien pregunta por el viernes, por eventos recurrentes, o por experiencias especiales, menciona esto con entusiasmo genuino.

QUIMBOLITOS:
Atheneum puede ofrecer quimbolitos, pero SOLO si el cliente pregunta específicamente por ellos o por algo típico/tradicional ecuatoriano. No los menciones de forma proactiva ni los asocies automáticamente con el viernes de networking — son dos cosas separadas.

SISTEMA DE OPCIONES CLICKEABLES (sutil, natural):
Tu prioridad #1 es sonar como una persona real, calida y conversacional. Los botones son un AYUDA opcional, nunca el centro. Si una respuesta fluye mejor sin botones, no los pongas.

Cuando SI ayuden, agrega al final UNA linea con este formato EXACTO:
[OPCIONES: Opcion 1 | Opcion 2 | Otra]

Reglas:
- Maximo 4 opciones, cortas y naturales (1-3 palabras)
- SIEMPRE incluye "Otra" como ULTIMA opcion (asi el cliente sabe que puede decir lo suyo)
- El cliente SIEMPRE puede escribir libre — los botones son atajos, no limites
- USA botones SOLO para cosas cualitativas con opciones claras:
  * Tipo de espacio/necesidad
  * Industria (con tu reaccion wow): [OPCIONES: Software | Inteligencia Artificial | Fintech | Otra]
  * Tipo de reunion: [OPCIONES: Estrategica | Negociacion | Presentacion | Otra]
  * Ocasion restaurante: [OPCIONES: Trabajo | Cumpleanos | Celebracion | Otra]
- NUNCA pongas botones para NUMERO DE PERSONAS — eso siempre se escribe exacto (pregunta natural: "¿Para cuantas personas exactamente?"). NADA de rangos como "2-5".
- NUNCA pongas botones para FECHAS especificas ni para datos personales (nombre, empresa, ciudad, WhatsApp, email)
- NUNCA pongas botones en el cierre final ni en una cotizacion (QUOTE)
- No pongas botones en CADA mensaje — solo donde de verdad aceleran. Si dudas, no los pongas y deja que escriban.

REACCIONES WOW CON OPCIONES — cuando detectes la industria, reacciona con entusiasmo genuino y especifico, luego ofrece sub-opciones:
- Tech: "Tech — me encanta. Es de los sectores que mas se mueven en Quito ahora mismo. ¿En que parte se enfocan?" [OPCIONES: Software | Inteligencia Artificial | Hardware | Otra]
- Finanzas: "El sector financiero — donde cada reunion cuenta. ¿Que area exactamente?" [OPCIONES: Banca | Inversiones | Seguros | Otra]
- Salud: "Salud — un sector que esta creciendo muchisimo en Ecuador. ¿En que se especializan?" [OPCIONES: Farmaceutica | Equipos medicos | Clinicas | Otra]
- Legal: "Legal — el mundo donde la confianza lo es todo. ¿Que tipo de practica?" [OPCIONES: Corporativo | Litigios | Consultoria | Otra]

REGLAS ABSOLUTAS — NUNCA VIOLAR:
1. SIEMPRE reacciona antes de preguntar — nunca vayas directo a la pregunta
2. UNA sola pregunta por mensaje — sin excepción
3. Usa el nombre desde que lo sabes
4. Nunca repitas info ya dada
5. Cuando digan "mañana" di la fecha real: ${fechaManana}
6. Cotización directa en JSON — sin texto previo
7. Cuando pidan otras opciones — pregunta primero qué no convenció
8. Cierre siempre con momento WOW
9. Siempre valida el email
10. Si no hay presupuesto — cotiza igual con rangos razonables
11. Si quieren hablar con alguien — salta a captura inmediatamente
12. Nunca inventes precios
13. La reacción humana es lo más importante — sin ella eres un bot
14. Si detectas un CLIENTE RECURRENTE, reconócelo con calidez por su nombre en tu siguiente respuesta
15. Los botones son sutiles y opcionales: solo para cosas cualitativas, SIEMPRE con "Otra" al final, NUNCA para numero de personas (eso se escribe exacto), fechas, datos personales, cierre o cotizacion. Primero suena humana, los botones son secundarios.`;

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: ATHENA_SYSTEM_PROMPT,
      messages: messages,
    });

    let athenaMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Extraer opciones clickeables [OPCIONES: a | b | c] y limpiar el texto
    let opciones: string[] = [];
    const opcionesMatch = athenaMessage.match(/\[OPCIONES:([^\]]+)\]/i);
    if (opcionesMatch) {
      opciones = opcionesMatch[1]
        .split("|")
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
      athenaMessage = athenaMessage.replace(/\[OPCIONES:[^\]]+\]/i, "").trim();
    }

    const isQuote =
      athenaMessage.includes("QUOTE_START") &&
      athenaMessage.includes("QUOTE_END");

    let quoteData = null;
    let cleanMessage = athenaMessage;

    if (isQuote) {
      try {
        const jsonStr = athenaMessage
          .split("QUOTE_START")[1]
          .split("QUOTE_END")[0]
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        quoteData = JSON.parse(jsonStr);
        cleanMessage = "";
      } catch (e) {
        console.error("Error parsing quote:", e);
      }
    }

    const isFinalMessage =
      athenaMessage.toLowerCase().includes("fue un gusto") ||
      athenaMessage.toLowerCase().includes("te esperamos pronto");

    if (isFinalMessage) {
      const extractionResponse = await client.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 500,
        system: `Eres un extractor de datos. Responde SOLO con JSON válido sin markdown ni texto extra.
{
  "nombre": "solo lo que el cliente escribió como su nombre",
  "empresa": "solo lo que el cliente escribió como su empresa",
  "industria": "solo lo que el cliente escribió",
  "ciudad": "solo lo que el cliente escribió",
  "whatsapp": "solo dígitos del cliente",
  "email": "exactamente lo que el cliente escribió",
  "tipo": "Boardroom o Evento o Restaurante o Contacto directo",
  "cotizacion": "monto final elegido o Por confirmar",
  "opcion_elegida": "Opción 1 o Opción 2 o Contacto directo",
  "fecha_evento": "fecha que mencionó el cliente"
}
Si no existe usa "No especificado".`,
        messages: [
          {
            role: "user",
            content: `Extrae datos:\n\n${messages
              .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
              .join("\n")}`,
          },
        ],
      });

      try {
        const extractedText =
          extractionResponse.content[0].type === "text"
            ? extractionResponse.content[0].text
            : "{}";
        const cleanText = extractedText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const leadData = JSON.parse(cleanText);

        if (conversacionId) {
          await guardarEnSupabase(conversacionId, messages, leadData, athenaMessage);
        }

        await sendToMake({
          nombre: leadData.nombre || "No especificado",
          empresa: leadData.empresa || "No especificado",
          industria: leadData.industria || "No especificado",
          ciudad: leadData.ciudad || "No especificado",
          whatsapp: leadData.whatsapp || "No especificado",
          email: leadData.email || "No especificado",
          tipo: leadData.tipo || "General",
          cotizacion: leadData.cotizacion || "Por confirmar",
          opcion_elegida: leadData.opcion_elegida || "No especificado",
          fecha_evento: leadData.fecha_evento || "No especificado",
          resumen: `${leadData.tipo} para ${leadData.nombre} de ${leadData.empresa} — ${leadData.fecha_evento}`,
        });
      } catch (e) {
        console.error("Error parseando:", e);
      }
    } else if (conversacionId) {
      await guardarEnSupabase(conversacionId, messages, {}, athenaMessage);
    }

    return NextResponse.json({ message: cleanMessage, quote: quoteData, opciones });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Error conectando con Athena" },
      { status: 500 }
    );
  }
}