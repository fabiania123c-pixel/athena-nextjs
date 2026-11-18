"use client";

import React, { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GOLD = "#c9a96e";
const GOLD_SOFT = "#e3c98d";
const NAVY = "#0a1628";
const CREAM = "#f5f0e8";
const WHATSAPP = "593980435843";
const PDF_URL = "/navidad/navidad-atheneum-2026.pdf";

type Fila = { etiqueta?: string; nombre: string; detalle?: string; tag?: string; foto?: string };
type Bloque = { titulo?: string; filas: Fila[] };
type Opcion = {
  id: number;
  precio: number;
  titulo: string;
  resumen: string;
  foto: string;
  posicion: string;
  bloques: Bloque[];
};

const OPCIONES: Opcion[] = [
  {
    id: 1,
    precio: 22,
    titulo: "Menú servido de tres tiempos",
    resumen: "Un menú fijo: entrada, plato fuerte, guarnición de arroz y postre.",
    foto: "/navidad/opcion1.jpg",
    posicion: "center 58%",
    bloques: [
      {
        filas: [
          { etiqueta: "Entrada", nombre: "Ensalada de sandía a la parrilla", detalle: "Mix de lechugas y kale crocante, vinagreta de sandía y cúrcuma, quinua y cebolla crocantes, hierba buena." },
          { etiqueta: "Plato fuerte", nombre: "Pavo en salsa de ciruelas", detalle: "Pechuga de pavo horneada, milhojas de papa y ensalada Waldorf." },
          { etiqueta: "Guarnición", nombre: "Arroz navideño", detalle: "Arroz al curry con nuez, tocino, mix de pimientos y pasas." },
          { etiqueta: "Postre", nombre: "Panna cotta de arándanos", detalle: "En versión deconstruida, con suspiros de arándanos y frambuesas, arándanos y moras en almíbar." },
        ],
      },
    ],
  },
  {
    id: 2,
    precio: 35,
    titulo: "Menú servido con opciones",
    resumen: "Tres entradas y tres platos fuertes a elegir, con guarnición de arroz y postre.",
    foto: "/navidad/asado.jpg",
    posicion: "62% center",
    bloques: [
      {
        titulo: "Entradas, a elegir",
        filas: [
          { nombre: "Tartar de camarón", detalle: "Adobado con soya, aceite de ajonjolí, lima, eneldo, mango, aguacate y ají en escamas. Con tostadas de pan de masa madre." },
          { nombre: "Canutillo de wantán y langostino", detalle: "Relleno de langostino y picadillos, infusión de naranjilla y menta, caviar falso de cebolleta sobre crema agria." },
          { nombre: "Ceviche andino", detalle: "Cremoso, sobre base de aguacate, con maíz, chocho, palmito, picadillos y dúo de quinuas crocantes.", tag: "Opción vegetariana" },
        ],
      },
      {
        titulo: "Plato fuerte, uno a elegir",
        filas: [
          { nombre: "Bondiola rellena y pavo", detalle: "Bondiola en salsa de tamarindo oriental y pavo con gravy de ave. Puré de arveja con hierba buena y ensalada fresca.", foto: "/navidad/bondiola.jpg" },
          { nombre: "Asado de tira y langostino", detalle: "Asado con demi-glace de res y langostino en salsa de tamarindo. Milhojas de papa y vegetales salteados.", foto: "/navidad/asado.jpg" },
          { nombre: "Filet mignon y cordon bleu", detalle: "Filet mignon en salsa de ciruela y cordon bleu en gravy de ave. Puré de papa trufado con tocino y vegetales al vapor.", foto: "/navidad/filet.jpg" },
        ],
      },
      {
        titulo: "Para cerrar",
        filas: [
          { etiqueta: "Guarnición", nombre: "Arroz navideño o arroz de cilantro y albahaca" },
          { etiqueta: "Postre", nombre: "Red velvet deconstruido o panna cotta de arándanos" },
        ],
      },
    ],
  },
  {
    id: 3,
    precio: 55,
    titulo: "Mesa navideña al centro",
    resumen: "Fuertes, guarniciones, ensaladas, salsas y postres servidos al centro para compartir.",
    foto: "/navidad/mesa.jpg",
    posicion: "center 62%",
    bloques: [
      {
        titulo: "Platos fuertes",
        filas: [
          { nombre: "Pechuga de pavo al horno", detalle: "En adobo de especias y vino." },
          { nombre: "Crispy pork belly", detalle: "En adobo de la casa, de cocción lenta y terminado a fuego directo." },
        ],
      },
      {
        titulo: "Salsas de la casa",
        filas: [
          { nombre: "Gravy de ave", detalle: "Jugos de ave en cocción lenta, ligados con mantequilla." },
          { nombre: "Reducción de tamarindo", detalle: "Con toques de tomillo." },
          { nombre: "Salsa de ciruelas pasas", detalle: "La tradicional compañera de la cena navideña." },
        ],
      },
      {
        titulo: "Guarniciones",
        filas: [
          { nombre: "Arroz navideño", detalle: "Al curry, con aceite de tocino, pimientos, nuez y pasas." },
          { nombre: "Puré de papa trufado", detalle: "Rústico, aromatizado con trufa y tocino." },
          { nombre: "Macarrones gratinados", detalle: "Con cheddar fundido y paprika." },
        ],
      },
      {
        titulo: "Ensaladas",
        filas: [
          { nombre: "Ensalada Waldorf", detalle: "Aderezo de yogur con miel y un toque de hierba buena." },
          { nombre: "Papa y betabel", detalle: "Betabel confitado y chalotas al vino tinto." },
          { nombre: "Ensalada a la parrilla", detalle: "Kale rostizado, lechugas, uvillas, tomate cherry, mashua y zanahoria." },
        ],
      },
      {
        titulo: "Postres",
        filas: [
          { nombre: "Pie de limón", detalle: "Un clásico con acento navideño." },
          { nombre: "Brazo gitano de frutos rojos", detalle: "Bizcocho enrollado con frutos rojos." },
        ],
      },
    ],
  },
];

function Copo({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" />
      <path d="M9.5 3.8L12 6l2.5-2.2M9.5 20.2L12 18l2.5 2.2" />
    </svg>
  );
}

const HORAS = ["08:00", "09:00", "12:00", "13:00", "14:00", "19:00", "20:00", "21:00"];
const SERVICIO = 0.1;
const IMP = 0.15;
const redondear = (n: number) => Math.round(n * 100) / 100;

function fechaBonita(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
}

type Adicional = {
  id: string;
  titulo: string;
  detalle: string;
  precio: number;
  unidad: "persona" | "botella";
  grupo?: string;
};

const ADICIONALES: Adicional[] = [
  { id: "welcome", titulo: "Welcome drink", detalle: "Copa de recibimiento para cada invitado: Cava Española o Mocktail", precio: 7, unidad: "persona" },
  { id: "copa-vino", titulo: "Copa de vino adicional", detalle: "Blanco o tinto de la casa", precio: 5, unidad: "persona" },
  { id: "soft", titulo: "Paquete de bebidas soft ilimitadas", detalle: "Agua natural, agua mineral, gaseosa, café americano e infusiones", precio: 5, unidad: "persona" },
  { id: "barra2", titulo: "Barra libre Atheneum · 2 cócteles", detalle: "Coctelería ilimitada por 4 horas: Mojito y Paloma", precio: 15, unidad: "persona", grupo: "barra" },
  { id: "barra3", titulo: "Barra libre Atheneum · 3 cócteles", detalle: "Coctelería ilimitada por 4 horas: Moscow Mule, Margarita y Mojito", precio: 22, unidad: "persona", grupo: "barra" },
  { id: "vino-botella", titulo: "Vino de la casa", detalle: "Nuestra selección de espumante, blanco o tinto", precio: 25, unidad: "botella" },
];

function hoyISO(): string {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}-${String(h.getDate()).padStart(2, "0")}`;
}

function cargarImagen(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

function lineasMenu(o: Opcion): string[] {
  const out: string[] = [];
  o.bloques.forEach((b) => {
    if (b.titulo) out.push(`${b.titulo}:`);
    b.filas.forEach((f) => out.push(`${f.etiqueta ? f.etiqueta + ": " : ""}${f.nombre}`));
  });
  return out;
}

type GuardarDatos = {
  nombre: string;
  fecha: string;
  hora: string;
  personas: number;
  tipo: string;
  nota?: string;
  fuente: string;
};

type CotizarProps = {
  opcionInicial: number;
  personasInicial: number;
  onVolver: () => void;
  onEvento: (evento: string) => void;
  onGuardar: (datos: GuardarDatos) => void;
};

function CotizarNavidad({ opcionInicial, personasInicial, onVolver, onEvento, onGuardar }: CotizarProps) {
  const [opcionId, setOpcionId] = useState<number>(opcionInicial);
  const [personas, setPersonas] = useState<number>(personasInicial);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  // Adicionales elegidos: la clave existe = elegido; null = cantidad automática (todos los invitados / 1 botella)
  const [sel, setSel] = useState<Record<string, number | null>>({});

  const resumenRef = useRef<HTMLDivElement | null>(null);
  const [resumenVisible, setResumenVisible] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const el = resumenRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setResumenVisible(entry.isIntersecting), { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const cantDe =(a: Adicional): number => {
    if (!(a.id in sel)) return 0;
    const v = sel[a.id];
    return v ?? (a.unidad === "persona" ? personas : 1);
  };

  const alternar = (a: Adicional) => {
    const activo = a.id in sel;
    if (!activo) onEvento("navidad_adicional");
    setSel((prev) => {
      const n = { ...prev };
      if (activo) {
        delete n[a.id];
      } else {
        if (a.grupo) ADICIONALES.filter((x) => x.grupo === a.grupo && x.id !== a.id).forEach((x) => delete n[x.id]);
        n[a.id] = null;
      }
      return n;
    });
  };

  const cambiarCant = (a: Adicional, delta: number) => {
    const tope = a.unidad === "persona" ? 300 : 99;
    const nueva = Math.min(tope, Math.max(1, cantDe(a) + delta));
    setSel((prev) => ({ ...prev, [a.id]: nueva }));
  };

  const opcion = OPCIONES.find((o) => o.id === opcionId) || OPCIONES[0];
  const subtotalMenu = redondear(opcion.precio * personas);
  const seleccionados = ADICIONALES.filter((a) => a.id in sel).map((a) => {
    const cant = cantDe(a);
    return { a, cant, total: redondear(a.precio * cant) };
  });
  const subtotalAdic = redondear(seleccionados.reduce((s, x) => s + x.total, 0));
  const subtotal = redondear(subtotalMenu + subtotalAdic);
  const servicio = redondear(subtotal * SERVICIO);
  const imp = redondear((subtotal + servicio) * IMP);
  const total = redondear(subtotal + servicio + imp);

  const valido = nombre.trim().length > 1 && !!fecha && !!hora;

  const etiqueta: React.CSSProperties = {
    color: GOLD, fontSize: "10.5px", letterSpacing: "0.2em", fontWeight: 700,
    textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: "8px",
  };
  const campo: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(201,169,110,0.3)", borderRadius: "12px", padding: "14px 16px",
    color: CREAM, fontSize: "16px", outline: "none", fontFamily: "sans-serif", colorScheme: "dark",
  };
  const fila: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13.5px", fontFamily: "sans-serif" };

  const confirmar = () => {
    if (!valido) return;
    onEvento("navidad_confirmar");
    const mensaje =
      `Hola, quisiera confirmar una cotización de Atheneum (Navidad 2026).\n\n` +
      `Nombre: ${nombre.trim()}\n` +
      `Fecha: ${fechaBonita(fecha)}\n` +
      `Hora: ${hora}\n\n` +
      `Tipo: Navidad, Opción ${opcion.id} · ${opcion.titulo}\n` +
      `———————————————\n` +
      `Personas:        ${personas}\n` +
      `Menú (${personas} x $${opcion.precio}): $${subtotalMenu.toFixed(2)}\n` +
      seleccionados.map((s) => `+ ${s.a.titulo} (${s.cant} x $${s.a.precio}): $${s.total.toFixed(2)}\n`).join("") +
      `Subtotal:        $${subtotal.toFixed(2)}\n` +
      `Servicio (10%):  $${servicio.toFixed(2)}\n` +
      `IMP (15%):       $${imp.toFixed(2)}\n` +
      `———————————————\n` +
      `TOTAL:           $${total.toFixed(2)}\n\n` +
      `Quedo pendiente de confirmación.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
    onGuardar({
      nombre: nombre.trim(),
      fecha: fechaBonita(fecha),
      hora,
      personas,
      tipo: `Navidad Opción ${opcion.id}`,
      nota: `Navidad 2026 · Total $${total.toFixed(2)}` + (seleccionados.length ? ` · Adicionales: ${seleccionados.map((s) => `${s.a.titulo} x${s.cant}`).join(", ")}` : ""),
      fuente: "cotizacion",
    });
  };

  const descargarPDF = async () => {
    if (!valido) return;
    onEvento("navidad_pdf_cotizacion");
    const hoy = new Date();
    const fechaEmision = hoy.toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" });
    const numero = `COT-NAV-${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}-${String(hoy.getHours()).padStart(2, "0")}${String(hoy.getMinutes()).padStart(2, "0")}`;

    const doc = new jsPDF();
    try {
      const logo = await cargarImagen("/atheneum-logo.jpg");
      doc.addImage(logo, "JPEG", 14, 8, 20, 20);
    } catch (e) {
      console.error("No se pudo cargar el logo para el PDF:", e);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(10, 22, 40);
    doc.text("ATHENEUM", 38, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("Quito, Ecuador | IG @atheneum.uio | WEB www.clubatheneum.ec", 38, 24);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(10, 22, 40);
    doc.text("COTIZACIÓN", 196, 18, { align: "right" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`No: ${numero}`, 196, 24, { align: "right" });
    doc.text(`Fecha: ${fechaEmision}`, 196, 29, { align: "right" });
    doc.setDrawColor(201, 169, 110);
    doc.setLineWidth(0.8);
    doc.line(14, 33, 196, 33);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(10, 22, 40);
    doc.text("INFORMACIÓN DEL CLIENTE:", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Cliente: ${nombre.trim()}`, 14, 49);
    doc.text(`Fecha del evento: ${fechaBonita(fecha)}`, 14, 55);
    doc.text(`Hora: ${hora}`, 14, 61);

    autoTable(doc, {
      startY: 68,
      head: [["ÍTEM", "DESCRIPCIÓN", "CANT.", "PRECIO UNIT.", "VALOR TOTAL"]],
      body: [
        ["1", `Navidad en Atheneum, Opción ${opcion.id}: ${opcion.titulo}`, String(personas), `$${opcion.precio.toFixed(2)}`, `$${subtotalMenu.toFixed(2)}`],
        ...seleccionados.map((s, i) => [String(i + 2), `${s.a.titulo} (por ${s.a.unidad})`, String(s.cant), `$${s.a.precio.toFixed(2)}`, `$${s.total.toFixed(2)}`]),
      ],
      theme: "grid",
      headStyles: { fillColor: [10, 22, 40], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9.5, textColor: [40, 40, 40], fontStyle: "bold", valign: "middle" },
      columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 96 }, 2: { cellWidth: 16 }, 3: { cellWidth: 26 }, 4: { cellWidth: 26 } },
    });

    let y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;

    // Detalle del menú
    const lineas: { texto: string; header: boolean }[] = [];
    lineasMenu(opcion).forEach((l) => {
      if (l.endsWith(":")) {
        lineas.push({ texto: l, header: true });
      } else {
        (doc.splitTextToSize(l, 168) as string[]).forEach((sub, i) => lineas.push({ texto: `${i === 0 ? "• " : "   "}${sub}`, header: false }));
      }
    });
    const alto = 14 + lineas.reduce((a, l) => a + (l.header ? 5.5 : 5), 0) + 4;
    if (y + alto > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.setDrawColor(201, 169, 110);
    doc.rect(14, y, 182, alto);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(180, 148, 90);
    doc.text("DETALLE DEL MENÚ", 18, y + 8);
    let ty = y + 14;
    lineas.forEach((l) => {
      if (l.header) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(l.texto, 18, ty);
        ty += 5.5;
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(90, 90, 90);
        doc.text(l.texto, 22, ty);
        ty += 5;
      }
    });
    y += alto + 10;

    // Totales y términos
    if (y + 75 > 285) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Subtotal:", 150, y, { align: "right" });
    doc.text(`$${subtotal.toFixed(2)}`, 196, y, { align: "right" });
    doc.text("Servicio (10%):", 150, y + 6, { align: "right" });
    doc.text(`$${servicio.toFixed(2)}`, 196, y + 6, { align: "right" });
    doc.text("IMP (15%):", 150, y + 12, { align: "right" });
    doc.text(`$${imp.toFixed(2)}`, 196, y + 12, { align: "right" });
    doc.setDrawColor(201, 169, 110);
    doc.setLineWidth(0.8);
    doc.line(140, y + 16, 196, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(10, 22, 40);
    doc.text("TOTAL:", 150, y + 23, { align: "right" });
    doc.text(`$${total.toFixed(2)}`, 196, y + 23, { align: "right" });

    const termsY = y + 36;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(10, 22, 40);
    doc.text("TÉRMINOS Y CONDICIONES:", 14, termsY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const terminos = [
      "1. Los precios están expresados en Dólares Americanos (USD).",
      "2. Incluye decoración navideña estándar. Consulte por el montaje especial de Navidad.",
      "3. Las fechas de diciembre están sujetas a disponibilidad.",
      ...(opcion.id === 2 ? ["4. Las opciones de entrada, plato fuerte, guarnición y postre se coordinan con el equipo."] : []),
      "World Trade Center, Quito.",
    ];
    terminos.forEach((t, i) => doc.text(t, 14, termsY + 6 + i * 5));

    doc.save(`${numero}.pdf`);
  };

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: NAVY, overflowX: "hidden" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: `20px 20px ${seleccionados.length > 0 ? 96 : 48}px` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "22px" }}>
          <button
            onClick={onVolver}
            aria-label="Volver al menú"
            style={{ width: "38px", height: "38px", borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.35)", color: CREAM, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ←
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Copo size={12} />
              <span style={{ ...etiqueta, marginBottom: 0 }}>Temporada navideña 2026</span>
            </div>
            <div style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 600, marginTop: "4px" }}>Cotizar tu evento</div>
          </div>
        </div>

        <div style={etiqueta}>Menú</div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          {OPCIONES.map((o) => {
            const activa = o.id === opcionId;
            return (
              <button
                key={o.id}
                onClick={() => setOpcionId(o.id)}
                style={{
                  flex: 1, padding: "12px 6px", borderRadius: "12px", cursor: "pointer", textAlign: "center",
                  background: activa ? GOLD : "transparent",
                  border: `1px solid ${activa ? GOLD : "rgba(201,169,110,0.35)"}`,
                  color: activa ? NAVY : GOLD_SOFT, fontFamily: "sans-serif",
                }}
              >
                <div style={{ fontSize: "10px", letterSpacing: "0.14em", fontWeight: 700 }}>OPCIÓN {o.id}</div>
                <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: 700 }}>${o.precio}</div>
              </button>
            );
          })}
        </div>
        <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "12.5px", fontFamily: "Georgia, serif", fontStyle: "italic", marginBottom: "22px" }}>
          {opcion.titulo}. {opcion.resumen}
        </div>

        <div style={etiqueta}>Nombre</div>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre o el de tu empresa" style={{ ...campo, marginBottom: "20px" }} />

        <div style={etiqueta}>Fecha del evento</div>
        <input type="date" value={fecha} min={hoyISO()} max="2026-12-31" onChange={(e) => setFecha(e.target.value)} style={{ ...campo, marginBottom: "20px" }} />

        <div style={etiqueta}>Hora</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          {HORAS.map((h) => {
            const activa = hora === h;
            return (
              <button
                key={h}
                onClick={() => setHora(h)}
                style={{ padding: "10px 16px", borderRadius: "20px", cursor: "pointer", fontFamily: "sans-serif", fontSize: "13.5px", background: activa ? GOLD : "transparent", color: activa ? NAVY : CREAM, border: `1px solid ${activa ? GOLD : "rgba(201,169,110,0.35)"}`, fontWeight: activa ? 700 : 400 }}
              >
                {h}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
          <span style={{ color: "rgba(245,240,232,0.7)", fontSize: "13px", fontFamily: "sans-serif" }}>Número de invitados</span>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <button onClick={() => setPersonas((p) => Math.max(1, p - 1))} aria-label="Menos" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: GOLD, fontSize: "20px", cursor: "pointer" }}>−</button>
            <span style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 700, minWidth: "40px", textAlign: "center" }}>{personas}</span>
            <button onClick={() => setPersonas((p) => Math.min(300, p + 1))} aria-label="Más" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: GOLD, fontSize: "20px", cursor: "pointer" }}>+</button>
          </div>
        </div>

        <div style={etiqueta}>Adicionales (opcional)</div>
        <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "12.5px", fontFamily: "Georgia, serif", fontStyle: "italic", marginBottom: "12px", lineHeight: 1.5 }}>
          Complemente su celebración con los servicios que mejor acompañen a su grupo. Se suman al total de su cotización.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "8px" }}>
          {ADICIONALES.map((a) => {
            const activo = a.id in sel;
            const cant = cantDe(a);
            return (
              <div
                key={a.id}
                style={{
                  borderRadius: "14px", overflow: "hidden",
                  border: `1px solid ${activo ? GOLD : "rgba(201,169,110,0.3)"}`,
                  background: activo ? "rgba(201,169,110,0.10)" : "rgba(255,255,255,0.03)",
                }}
              >
                <button
                  onClick={() => alternar(a)}
                  aria-pressed={activo}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <span style={{ width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${activo ? GOLD : "rgba(201,169,110,0.5)"}`, background: activo ? GOLD : "transparent", color: NAVY, fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {activo ? "✓" : ""}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", color: CREAM, fontFamily: "Georgia, serif", fontSize: "15.5px", fontWeight: 600 }}>{a.titulo}</span>
                    <span style={{ display: "block", color: "rgba(245,240,232,0.55)", fontFamily: "sans-serif", fontSize: "12px", marginTop: "3px", lineHeight: 1.4 }}>{a.detalle}</span>
                  </span>
                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ display: "block", color: GOLD_SOFT, fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 700 }}>${a.precio}</span>
                    <span style={{ display: "block", color: "rgba(245,240,232,0.5)", fontFamily: "sans-serif", fontSize: "10.5px" }}>por {a.unidad}</span>
                  </span>
                </button>
                {activo && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "10px 14px 12px", borderTop: "1px solid rgba(201,169,110,0.25)" }}>
                    <span style={{ color: "rgba(245,240,232,0.7)", fontFamily: "sans-serif", fontSize: "12.5px" }}>
                      {a.unidad === "persona" ? "Para cuántos invitados" : "Cantidad de botellas"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button onClick={() => cambiarCant(a, -1)} aria-label="Menos" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: GOLD, fontSize: "17px", cursor: "pointer" }}>−</button>
                      <span style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: 700, minWidth: "30px", textAlign: "center" }}>{cant}</span>
                      <button onClick={() => cambiarCant(a, 1)} aria-label="Más" style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: GOLD, fontSize: "17px", cursor: "pointer" }}>+</button>
                    </div>
                    <span style={{ color: GOLD_SOFT, fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 700, minWidth: "64px", textAlign: "right" }}>${(a.precio * cant).toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11.5px", fontFamily: "sans-serif", marginBottom: "22px", lineHeight: 1.5 }}>
          La barra libre es una sola por evento: elige la de 2 o la de 3 cócteles.
        </div>

        <div ref={resumenRef} style={{ borderRadius: "16px", border: "1px solid rgba(201,169,110,0.35)", background: "rgba(201,169,110,0.06)", padding: "16px 18px", marginBottom: "18px" }}>
          <div style={etiqueta}>Tu cotización</div>
          <div style={{ ...fila, color: "rgba(245,240,232,0.7)" }}><span>Menú: ${opcion.precio} x {personas} personas</span><span>${subtotalMenu.toFixed(2)}</span></div>
          {seleccionados.map((s) => (
            <div key={s.a.id} style={{ ...fila, color: "rgba(245,240,232,0.7)", gap: "12px" }}>
              <span>{s.a.titulo}: ${s.a.precio} x {s.cant}</span>
              <span style={{ flexShrink: 0 }}>${s.total.toFixed(2)}</span>
            </div>
          ))}
          {seleccionados.length > 0 && (
            <div style={{ ...fila, color: CREAM, borderTop: "1px solid rgba(201,169,110,0.2)", marginTop: "4px", paddingTop: "8px" }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          )}
          <div style={{ ...fila, color: "rgba(245,240,232,0.7)" }}><span>Servicio (10%)</span><span>${servicio.toFixed(2)}</span></div>
          <div style={{ ...fila, color: "rgba(245,240,232,0.7)" }}><span>IMP (15%)</span><span>${imp.toFixed(2)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid rgba(201,169,110,0.3)", marginTop: "8px", paddingTop: "12px" }}>
            <span style={{ color: GOLD, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", fontFamily: "sans-serif" }}>TOTAL</span>
            <span style={{ color: GOLD_SOFT, fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 700 }}>${total.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={descargarPDF}
          disabled={!valido}
          style={{ width: "100%", padding: "15px", borderRadius: "12px", marginBottom: "10px", background: valido ? GOLD : "rgba(201,169,110,0.25)", border: "none", color: NAVY, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", cursor: valido ? "pointer" : "default", fontFamily: "sans-serif" }}
        >
          DESCARGAR COTIZACIÓN (PDF)
        </button>
        <button
          onClick={confirmar}
          disabled={!valido}
          style={{ width: "100%", padding: "15px", borderRadius: "12px", background: valido ? "#25D366" : "rgba(37,211,102,0.25)", border: "none", color: "#06210f", fontSize: "14px", fontWeight: 700, cursor: valido ? "pointer" : "default", fontFamily: "sans-serif", letterSpacing: "0.04em" }}
        >
          Confirmar con el equipo por WhatsApp
        </button>
        {!valido && (
          <div style={{ color: "rgba(245,240,232,0.45)", fontSize: "12px", fontFamily: "Georgia, serif", fontStyle: "italic", marginTop: "12px", textAlign: "center" }}>
            Completa tu nombre, la fecha y la hora para descargar o confirmar.
          </div>
        )}
        <div style={{ color: "rgba(245,240,232,0.35)", fontSize: "11px", fontFamily: "sans-serif", marginTop: "18px", textAlign: "center", lineHeight: 1.5 }}>
          Valores por persona, más servicio e impuestos. Las fechas de diciembre están sujetas a disponibilidad.
        </div>
      </div>

      {seleccionados.length > 0 && !resumenVisible && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, padding: "10px 16px calc(10px + env(safe-area-inset-bottom))", background: "rgba(10,22,40,0.96)", borderTop: "1px solid rgba(201,169,110,0.4)", backdropFilter: "blur(8px)" }}>
          <button
            onClick={() => resumenRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            aria-label="Ver resumen de la cotización"
            style={{ maxWidth: "528px", margin: "0 auto", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
          >
            <span>
              <span style={{ display: "block", color: "rgba(245,240,232,0.6)", fontFamily: "sans-serif", fontSize: "11px", letterSpacing: "0.08em" }}>
                TOTAL · {seleccionados.length} {seleccionados.length === 1 ? "ADICIONAL" : "ADICIONALES"}
              </span>
              <span style={{ display: "block", color: GOLD_SOFT, fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 700 }}>${total.toFixed(2)}</span>
            </span>
            <span style={{ color: NAVY, background: GOLD, borderRadius: "20px", padding: "10px 16px", fontFamily: "sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em" }}>VER RESUMEN ↓</span>
          </button>
        </div>
      )}
    </div>
  );
}

type Props = {
  onVolver: () => void;
  onEvento: (evento: string) => void;
  onGuardar: (datos: GuardarDatos) => void;
};

export default function NavidadMenu({ onVolver, onEvento, onGuardar }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const [elegida, setElegida] = useState<number | null>(null);
  const [personas, setPersonas] = useState<number>(10);
  const [cotizando, setCotizando] = useState<number | null>(null);

  useEffect(() => {
    onEvento("navidad_vista");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirCotizar = (id: number) => {
    setElegida(id);
    onEvento("navidad_cotizar");
    setCotizando(id);
  };

  if (cotizando !== null) {
    return (
      <CotizarNavidad
        opcionInicial={cotizando}
        personasInicial={personas}
        onVolver={() => setCotizando(null)}
        onEvento={onEvento}
        onGuardar={onGuardar}
      />
    );
  }

  const opcionElegida = OPCIONES.find((o) => o.id === elegida) || null;
  const total = opcionElegida ? opcionElegida.precio * personas : 0;

  const tocarOpcion = (id: number) => {
    setElegida(id);
    if (abierta === id) {
      setAbierta(null);
    } else {
      setAbierta(id);
      onEvento(`navidad_opcion_${id}`);
    }
  };

  const abrirWhatsApp = () => {
    if (!opcionElegida) return;
    onEvento("navidad_whatsapp");
    const mensaje = `Hola, me interesa el menú de Navidad de Atheneum: Opción ${opcionElegida.id} ($${opcionElegida.precio} por persona) para ${personas} personas. ¿Qué fechas de diciembre tienen disponibles?`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
  };

  const etiquetaSeccion: React.CSSProperties = {
    color: GOLD, fontSize: "10.5px", letterSpacing: "0.2em", fontWeight: 700,
    textTransform: "uppercase", fontFamily: "sans-serif",
  };

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: NAVY, overflowX: "hidden" }}>
      <div style={{ maxWidth: "560px", margin: "0 auto", paddingBottom: "40px" }}>

        {/* Hero */}
        <div style={{
          position: "relative", height: "320px",
          backgroundImage: `linear-gradient(180deg, rgba(10,22,40,0.35) 0%, rgba(10,22,40,0.5) 50%, ${NAVY} 100%), url('/navidad/portada.jpg')`,
          backgroundSize: "cover", backgroundPosition: "center 74%",
        }}>
          <button
            onClick={onVolver}
            aria-label="Volver"
            style={{
              position: "absolute", top: "20px", left: "20px",
              width: "38px", height: "38px", borderRadius: "50%",
              background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.25)", color: CREAM,
              fontSize: "18px", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
          >
            ←
          </button>
          <div style={{ position: "absolute", left: "24px", right: "24px", bottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Copo size={13} />
              <span style={etiquetaSeccion}>Temporada navideña 2026</span>
            </div>
            <div style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "34px", fontWeight: 600, lineHeight: 1.1 }}>
              Navidad en Atheneum
            </div>
            <div style={{ color: "rgba(245,240,232,0.7)", fontSize: "13.5px", fontFamily: "sans-serif", marginTop: "10px", lineHeight: 1.5 }}>
              Tres menús para celebrar el cierre de año con su equipo, sus clientes o su familia.
            </div>
          </div>
        </div>

        <div style={{ padding: "8px 20px 0" }}>

          {/* Opciones */}
          <div style={{ ...etiquetaSeccion, margin: "18px 0 12px" }}>Elige tu menú</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {OPCIONES.map((o) => {
              const activa = elegida === o.id;
              const abierto = abierta === o.id;
              return (
                <div
                  key={o.id}
                  style={{
                    borderRadius: "16px", overflow: "hidden",
                    border: activa ? `1.5px solid ${GOLD}` : "1px solid rgba(201,169,110,0.25)",
                    background: activa ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.03)",
                    transition: "all 0.25s",
                  }}
                >
                  <button
                    onClick={() => tocarOpcion(o.id)}
                    style={{
                      width: "100%", background: "transparent", border: "none", cursor: "pointer",
                      padding: "16px", display: "flex", gap: "14px", alignItems: "stretch", textAlign: "left",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...etiquetaSeccion, fontSize: "10px" }}>Opción {o.id}</div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", margin: "6px 0 4px" }}>
                        <span style={{ color: GOLD_SOFT, fontFamily: "Georgia, serif", fontSize: "30px", fontWeight: 700 }}>${o.precio}</span>
                        <span style={{ color: "rgba(245,240,232,0.5)", fontSize: "11px", fontFamily: "sans-serif" }}>por persona + impuestos</span>
                      </div>
                      <div style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>{o.titulo}</div>
                      <div style={{ color: "rgba(245,240,232,0.55)", fontSize: "12px", fontFamily: "sans-serif", lineHeight: 1.5 }}>{o.resumen}</div>
                      <div style={{ color: GOLD, fontSize: "12px", fontFamily: "Georgia, serif", fontStyle: "italic", marginTop: "10px" }}>
                        {abierto ? "Ocultar menú ↑" : "Ver menú ↓"}
                      </div>
                    </div>
                    <img
                      src={o.foto}
                      alt=""
                      style={{ width: "88px", height: "auto", minHeight: "100px", borderRadius: "12px", objectFit: "cover", objectPosition: o.posicion, flexShrink: 0, alignSelf: "stretch", border: "1px solid rgba(201,169,110,0.3)" }}
                    />
                  </button>

                  {abierto && (
                    <div style={{ padding: "4px 16px 18px", borderTop: "1px solid rgba(201,169,110,0.18)", animation: "navFade 0.3s ease" }}>
                      {o.bloques.map((b, bi) => (
                        <div key={bi} style={{ marginTop: "16px" }}>
                          {b.titulo && <div style={{ ...etiquetaSeccion, fontSize: "10px", marginBottom: "10px" }}>{b.titulo}</div>}
                          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {b.filas.map((f, fi) => (
                              <div key={fi} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                {f.foto && (
                                  <img src={f.foto} alt={f.nombre} style={{ width: "72px", height: "72px", borderRadius: "10px", objectFit: "cover", flexShrink: 0, border: "1px solid rgba(201,169,110,0.25)" }} />
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {f.etiqueta && <div style={{ color: GOLD, fontSize: "10px", letterSpacing: "0.16em", fontWeight: 700, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: "2px" }}>{f.etiqueta}</div>}
                                  <div style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "15px", fontWeight: 600 }}>{f.nombre}</div>
                                  {f.detalle && <div style={{ color: "rgba(245,240,232,0.55)", fontSize: "12.5px", fontFamily: "sans-serif", lineHeight: 1.5, marginTop: "2px" }}>{f.detalle}</div>}
                                  {f.tag && (
                                    <span style={{ display: "inline-block", marginTop: "6px", color: GOLD_SOFT, border: "1px solid rgba(201,169,110,0.45)", borderRadius: "20px", padding: "2px 10px", fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "sans-serif", fontWeight: 700 }}>{f.tag}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => abrirCotizar(o.id)}
                        style={{ width: "100%", marginTop: "20px", padding: "14px", borderRadius: "12px", background: GOLD, border: "none", color: NAVY, fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "sans-serif" }}
                      >
                        COTIZAR LA OPCIÓN {o.id}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", fontFamily: "Georgia, serif", fontStyle: "italic", marginTop: "14px", lineHeight: 1.5 }}>
            Las tres opciones incluyen decoración navideña estándar. ¿Desea un ambiente aún más festivo? Pregunte por nuestras decoraciones especiales.
          </div>

          {/* PDF */}
          <a
            href={PDF_URL}
            download
            onClick={() => onEvento("navidad_pdf")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              marginTop: "18px", padding: "14px", borderRadius: "12px",
              border: "1px solid rgba(201,169,110,0.5)", color: GOLD_SOFT,
              fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em",
              fontFamily: "sans-serif", textDecoration: "none",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD_SOFT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v12M7 11l5 5 5-5M5 20h14" />
            </svg>
            DESCARGAR MENÚ COMPLETO (PDF)
          </a>

          {/* Reservar */}
          <div style={{ marginTop: "26px", borderRadius: "18px", overflow: "hidden", border: "1px solid rgba(201,169,110,0.35)", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ height: "130px", backgroundImage: "url('/navidad/mesa-navidad.jpg')", backgroundSize: "cover", backgroundPosition: "center 66%" }} />
            <div style={{ padding: "18px" }}>
              <div style={{ ...etiquetaSeccion, marginBottom: "6px" }}>Diciembre 2026</div>
              <div style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: 600, marginBottom: "8px" }}>Reserve su fecha navideña</div>
              <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "12.5px", fontFamily: "sans-serif", lineHeight: 1.55, marginBottom: "16px" }}>
                Las fechas de diciembre están sujetas a disponibilidad. Cuéntenos su número de invitados y le preparamos su propuesta.
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ color: "rgba(245,240,232,0.7)", fontSize: "13px", fontFamily: "sans-serif" }}>Número de invitados</span>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <button onClick={() => setPersonas((p) => Math.max(1, p - 1))} aria-label="Menos" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: GOLD, fontSize: "20px", cursor: "pointer" }}>−</button>
                  <span style={{ color: CREAM, fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 700, minWidth: "40px", textAlign: "center" }}>{personas}</span>
                  <button onClick={() => setPersonas((p) => Math.min(300, p + 1))} aria-label="Más" style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: GOLD, fontSize: "20px", cursor: "pointer" }}>+</button>
                </div>
              </div>

              {opcionElegida ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderTop: "1px solid rgba(201,169,110,0.2)", marginBottom: "14px" }}>
                  <div>
                    <div style={{ color: CREAM, fontSize: "13px", fontFamily: "sans-serif" }}>Opción {opcionElegida.id} · ${opcionElegida.precio} por persona</div>
                    <div style={{ color: "rgba(245,240,232,0.45)", fontSize: "11px", fontFamily: "sans-serif", marginTop: "2px" }}>Valor referencial, más impuestos</div>
                  </div>
                  <div style={{ color: GOLD_SOFT, fontFamily: "Georgia, serif", fontSize: "26px", fontWeight: 700 }}>${total}</div>
                </div>
              ) : (
                <div style={{ color: "rgba(245,240,232,0.45)", fontSize: "12.5px", fontFamily: "Georgia, serif", fontStyle: "italic", padding: "12px 0", borderTop: "1px solid rgba(201,169,110,0.2)", marginBottom: "14px" }}>
                  Toca uno de los menús de arriba para elegirlo.
                </div>
              )}

              <button
                onClick={() => opcionElegida && abrirCotizar(opcionElegida.id)}
                disabled={!opcionElegida}
                style={{
                  width: "100%", background: opcionElegida ? GOLD : "rgba(201,169,110,0.25)",
                  color: NAVY, border: "none", borderRadius: "12px", padding: "15px",
                  fontSize: "13px", fontWeight: 700, cursor: opcionElegida ? "pointer" : "default",
                  fontFamily: "sans-serif", letterSpacing: "0.1em", marginBottom: "10px",
                }}
              >
                COTIZAR MI EVENTO
              </button>
              <button
                onClick={abrirWhatsApp}
                disabled={!opcionElegida}
                style={{
                  width: "100%", background: "transparent",
                  color: opcionElegida ? "#4ade80" : "rgba(74,222,128,0.35)",
                  border: `1px solid ${opcionElegida ? "rgba(37,211,102,0.5)" : "rgba(37,211,102,0.2)"}`,
                  borderRadius: "12px", padding: "14px",
                  fontSize: "13.5px", fontWeight: 700, cursor: opcionElegida ? "pointer" : "default",
                  fontFamily: "sans-serif", letterSpacing: "0.04em",
                }}
              >
                Consultar fechas por WhatsApp
              </button>
              <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11.5px", fontFamily: "Georgia, serif", fontStyle: "italic", marginTop: "12px", textAlign: "center", lineHeight: 1.5 }}>
                Comuníquenos alergias u opciones vegetarianas. Incluye decoración navideña estándar.
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "22px", fontSize: "11px", color: "rgba(245,240,232,0.3)", letterSpacing: "0.05em", fontFamily: "sans-serif" }}>
            Navidad 2026 · Valores por persona, más impuestos · Fotos referenciales
          </div>
        </div>
      </div>
      <style>{`@keyframes navFade { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } } html, body { margin: 0; padding: 0; }`}</style>
    </div>
  );
}