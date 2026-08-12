"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Message {
  role: "user" | "assistant";
  content: string;
  hidden?: boolean;
  quote?: QuoteData;
  opciones?: string[];
  menuCotizacion?: boolean;
}

interface QuoteOption {
  titulo: string;
  descripcion: string;
  items: { concepto: string; precio: number }[];
  total: number;
  nota: string;
}

interface QuoteData {
  tipo: string;
  intro: string;
  opcion1: QuoteOption;
  opcion2: QuoteOption;
}

interface CotizacionData {
  fecha: string;
  hora: string;
  personas: number;
  nombre: string;
  _rawDatos: string;
  textoPersonalizado?: string;
}

interface ReservaData {
  preferencia: string;
  fecha: string;
  hora: string;
  personas: number;
  nombre: string;
  nota: string;
}

type Pantalla = "inicio" | "chat" | "cotizacion" | "reserva";
type CotizacionStep = "fecha" | "hora" | "personas" | "nombre" | "menu" | "resultado";
type TipoComida = "desayuno" | "lunch" | "cena" | null;

const WA_NUMBER = "593980435843";

const PRECIOS = {
  desayuno: [
    {
      tier: "Costamar — $12 + IVA", precio: 12, descripcion: "Por persona",
      detalle: [
        "Variedad de frutas frescas", "Yogurt natural", "Granola · miel",
        "Bolones mixtos: queso · chicharrón", "Huevo frito · sal prieta",
        "Selección de pan artesanal · mantequilla · mermelada",
        "Café americano · infusiones", "Jugo natural del día",
      ],
    },
    {
      tier: "Manhattan Matutino — $18 + IVA", precio: 18, descripcion: "Por persona",
      detalle: [
        "Variedad de frutas frescas", "Yogurt natural", "Granola",
        "Bagel artesanal · trucha ahumada · queso crema · aguacate",
        "Huevo benedictino · salsa holandesa",
        "Selección de pan artesanal · mantequilla · mermelada",
        "Café americano · infusiones", "Jugo natural del día",
      ],
    },
    {
      tier: "Club Inglés — $22 + IVA", precio: 22, descripcion: "Por persona",
      detalle: [
        "Variedad de frutas frescas", "Yogurt natural", "Granola",
        "Papa hashbrown", "Tocino crocante", "Salchichas artesanales", "Scramble eggs",
        "Selección de pan artesanal · mantequilla · mermelada",
        "Café americano · té inglés", "Jugo natural del día",
      ],
    },
    {
      tier: "Desayuno Tradicional — $11 + IVA", precio: 11, descripcion: "Por persona",
      detalle: [
        "Bolones de queso y mapahuira", "Huevos a elección",
        "Jugo de naranja", "Café americano",
      ],
    },
    {
      tier: "Tostadas de Salmón — $11 + IVA", precio: 11, descripcion: "Por persona",
      detalle: [
        "Tostadas artesanales · salmón curado · alioli de aguacate · huevos a elección",
        "Jugo de naranja", "Café americano",
      ],
    },
    {
      tier: "Huevos Benedict — $11 + IVA", precio: 11, descripcion: "Por persona",
      detalle: [
        "Tostadas artesanales · huevos pochados · salsa holandesa · crocante de tocino",
        "Jugo de naranja", "Café americano",
      ],
    },
    {
      tier: "Desayuno Continental — $11 + IVA", precio: 11, descripcion: "Por persona",
      detalle: [
        "Canasta de pan artesanal", "Huevos a elección", "Parfait de yogurt griego",
        "Jugo de naranja", "Café americano",
      ],
    },
    { tier: "Personalizar", precio: null, descripcion: "Indícanos lo que tienes en mente" },
  ],
  lunch: [
    {
      tier: "Menú 1 — $55 + IVA", precio: 55, descripcion: "Por persona",
      detalle: [
        "Entrada — a elegir:",
        "Ensalada caprese — mozzarella de búfala · tomate San Marzano · rúcula",
        "Ceviche de atún — atún rojo · base de leche de coco · ralladura de limón · jengibre",
        "Empanadas en 3 actos — morocho · viento · verde",
        "Plato fuerte — a elegir:",
        "Pesca blanca — pesca del día · reducción de vino blanco · aceite de albahaca",
        "Pollo a la naranja — crocante de pollo · risotto de hongos · ensalada fresca",
        "Lomo & cacao — demi-glace de cacao · puré de papa chaucha · vegetales al grill",
        "Postre — a elegir:",
        "Brownie — cremoso al 70% · helado de vainilla · crocante de avellana",
        "Bebidas — a elegir:",
        "Vino blanco · vino tinto",
      ],
    },
    {
      tier: "Menú 2 — $60 + IVA", precio: 60, descripcion: "Por persona",
      detalle: [
        "Entrada — a elegir:",
        "Burrata salad — duraznos sellados al grill · rúcula · reducción de balsámico",
        "Tartar de res — lomo fino de res · mostaza dijon · pepinillo · alcaparras",
        "Pulpo a la parrilla — tentáculos de pulpo · papas nativas · salsa de aceitunas negras",
        "Plato fuerte — a elegir:",
        "Langostinos parrilla — ensalada de queso maduro · papas fritas artesanales · langostino",
        "Lomo paris — lomo fino de res · arroz blanco · papas fritas",
        "Pork belly — cerdo cocinado en larga cocción · puré de choclo · ensalada",
        "Postre — a elegir:",
        "Crumble de manzana — helado de vainilla · crocante de avellana",
        "Bebidas — a elegir:",
        "Vino blanco · vino tinto",
      ],
    },
    {
      tier: "Menú 3 — $25 + IVA", precio: 25, descripcion: "Por persona",
      detalle: [
        "Entrada — a elegir:",
        "Corviches con encocado de camarón — emulsión de tomate de árbol, con curtido tradicional",
        "Ceviche andino — base de aguacate y chimichurri, fondo de vegetales, choclo desgranado salteado, chochos, palmito, mix de picadillo y quinua crocante",
        "Plato fuerte — a elegir:",
        "Pollo al grill — salsa demiglace oriental, milhojas de papa y vegetales salteados",
        "Bondiola de cerdo — reducción de cocción de cerdo, puré de fréjol aromatizado con trufa, mesclum y kale rostizada",
        "Postre — a elegir:",
        "Mousse de frutos rojos — deconstrucción de crumble y suspiros",
        "Cheesecake de maracuyá — deconstrucción de crumble y suspiros",
        "Centro de mesa:",
        "Pan de bienvenida · arroz a las finas hierbas cuchareable",
      ],
    },
    { tier: "Personalizar", precio: null, descripcion: "Indícanos lo que tienes en mente" },
  ],
  cena: [
    {
      tier: "Menú Corporativo — $35 + IVA", precio: 35, descripcion: "Empanadas, ceviche, plato fuerte, postre y copa de vino",
      detalle: [
        "Centro — Tabla de empanadas: mix verde, morocho, viento",
        "Entrada — Mini ceviche tatemado: emulsión de mariscos · camarón · chips",
        "Fuerte — a elegir:",
        "Lomo & polenta — lomo fino de res · demi-glace · polenta de papa · vegetales al grill",
        "Pesca blanca — papas salteadas · mix verde · reducción de finas hierbas",
        "Postre — Mousse de limón",
        "Bebida — Soft a elegir + 1 copa de vino de la casa",
      ],
    },
    { tier: "Personalizar", precio: null, descripcion: "Indícanos lo que tienes en mente" },
  ],
};

const IVA = 0.15;
const SERVICIO = 0.10;

const ADICIONALES_DESAYUNO = [
  { nombre: "Canasta de pan artesanal", precio: 3.5 },
  { nombre: "Parfait de yogurt griego", precio: 3.5 },
  { nombre: "Copa de frutas de temporada", precio: 3.5 },
  { nombre: "Huevos a elección", precio: 3.5 },
  { nombre: "Porción de aguacate", precio: 3.5 },
  { nombre: "Tocino crocante", precio: 3.5 },
];

function loadImageAsBase64(url: string): Promise<string> {
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

function generateId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function registrarEvento(conversacionId: string, evento: string) {
  try {
    await fetch("/api/funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversacionId, evento }),
    });
  } catch (e) {
    console.error("Error registrando evento:", e);
  }
}

async function guardarReserva(datos: {
  conversacionId: string;
  nombre: string;
  fecha: string;
  hora: string;
  personas: number;
  tipo: string;
  preferencia?: string;
  nota?: string;
  fuente: string;
}) {
  try {
    await fetch("/api/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
  } catch (e) {
    console.error("Error guardando reserva:", e);
  }
}

function formatearFechaBonita(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" });
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "4px", marginBottom: "26px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= step ? "#c9a96e" : "rgba(201,169,110,0.15)" }} />
      ))}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ color: "#c9a96e", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, marginBottom: "12px" }}>
      {children}
    </div>
  );
}

function ChipRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              background: active ? "#c9a96e" : "transparent",
              color: active ? "#0a1628" : "#f5f0e8",
              border: `1px solid ${active ? "#c9a96e" : "rgba(201,169,110,0.35)"}`,
              borderRadius: "999px",
              padding: "10px 18px",
              fontSize: "14px",
              fontFamily: "sans-serif",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function WizardInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        boxSizing: "border-box",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(201,169,110,0.3)",
        borderRadius: "12px",
        padding: "14px 18px",
        color: "#f5f0e8",
        fontSize: "15px",
        outline: "none",
        fontFamily: "sans-serif",
      }}
    />
  );
}

function WizardStepper({ value, onChange, min = 1, max = 300 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <button onClick={() => onChange(clamp(value - 1))} style={{ width: "42px", height: "42px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: "#c9a96e", fontSize: "20px", cursor: "pointer" }}>−</button>
      <input
        type="number"
        value={value}
        onChange={(e) => { const n = parseInt(e.target.value, 10); onChange(Number.isNaN(n) ? min : clamp(n)); }}
        style={{ width: "60px", textAlign: "center", background: "transparent", border: "none", outline: "none", color: "#f5f0e8", fontSize: "24px", fontFamily: "Georgia, serif", fontWeight: 700 }}
      />
      <button onClick={() => onChange(clamp(value + 1))} style={{ width: "42px", height: "42px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.4)", background: "transparent", color: "#c9a96e", fontSize: "20px", cursor: "pointer" }}>+</button>
    </div>
  );
}

function WizardPrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "15px",
        borderRadius: "12px",
        background: disabled ? "rgba(201,169,110,0.25)" : "#c9a96e",
        border: "none",
        color: "#0a1628",
        fontSize: "13px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        cursor: disabled ? "default" : "pointer",
        fontFamily: "sans-serif",
      }}
    >
      {children}
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(201,169,110,0.12)" }}>
      <span style={{ color: "rgba(245,240,232,0.55)", fontSize: "14px", fontFamily: "sans-serif" }}>{label}</span>
      <span style={{ color: "#f5f0e8", fontSize: "14px", fontWeight: 500, fontFamily: "sans-serif" }}>{value}</span>
    </div>
  );
}

function WhatsAppSendButton({ waUrl, message, label, onSend }: { waUrl: string; message: string; label: string; onSend?: () => void }) {
  const [sent, setSent] = useState(false);
  const handleSend = () => {
    navigator.clipboard?.writeText(message);
    window.open(waUrl, "_blank");
    if (onSend) onSend();
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };
  return (
    <div>
      <button
        onClick={handleSend}
        style={{ width: "100%", background: "#25D366", color: "#06210f", border: "none", borderRadius: "12px", padding: "15px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "sans-serif" }}
      >
        {sent ? "Abierto ✓ — si el chat abre en blanco, ya está copiado" : label}
      </button>
    </div>
  );
}

function QuoteCard({ opcion, numero, onSelect }: { opcion: QuoteOption; numero: number; onSelect: () => void }) {
  const isRecommended = numero === 2;
  return (
    <div style={{ background: isRecommended ? "rgba(201,169,110,0.08)" : "rgba(255,255,255,0.04)", border: isRecommended ? "1px solid rgba(201,169,110,0.5)" : "1px solid rgba(201,169,110,0.2)", borderRadius: "20px", padding: "28px", display: "flex", flexDirection: "column", gap: "18px", flex: 1, minWidth: "260px", position: "relative" }}>
      {isRecommended && (
        <div style={{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "#c9a96e", color: "#0a1628", fontSize: "10px", fontWeight: "700", letterSpacing: "0.15em", padding: "4px 14px", borderRadius: "20px", whiteSpace: "nowrap" }}>RECOMENDADA</div>
      )}
      <div>
        <div style={{ color: isRecommended ? "#c9a96e" : "rgba(201,169,110,0.6)", fontSize: "10px", letterSpacing: "0.2em", fontWeight: "700", marginBottom: "8px" }}>OPCIÓN {numero}</div>
        <div style={{ color: "#f5f0e8", fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "600", lineHeight: "1.3" }}>{opcion.titulo}</div>
        <div style={{ color: "rgba(245,240,232,0.45)", fontSize: "13px", marginTop: "8px", lineHeight: "1.5" }}>{opcion.descripcion}</div>
      </div>
      <div style={{ height: "1px", background: "rgba(201,169,110,0.15)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {opcion.items.map((item, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(245,240,232,0.65)", fontSize: "14px" }}>{item.concepto}</span>
            <span style={{ color: "#f5f0e8", fontSize: "14px", fontWeight: "500" }}>${item.precio}</span>
          </div>
        ))}
      </div>
      <div style={{ height: "1px", background: "rgba(201,169,110,0.15)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#c9a96e", fontSize: "13px", fontWeight: "700", letterSpacing: "0.1em" }}>TOTAL + IVA</span>
        <span style={{ color: "#c9a96e", fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: "700" }}>${opcion.total}</span>
      </div>
      <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", fontStyle: "italic", lineHeight: "1.6", minHeight: "36px" }}>{opcion.nota}</div>
      <button onClick={onSelect} style={{ width: "100%", padding: "15px", borderRadius: "12px", background: isRecommended ? "#c9a96e" : "transparent", border: isRecommended ? "none" : "1px solid rgba(201,169,110,0.5)", color: isRecommended ? "#0a1628" : "#c9a96e", fontSize: "13px", fontWeight: "700", letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}>
        ELEGIR ESTA OPCIÓN
      </button>
    </div>
  );
}

function CartaPrecios({ onSelect }: { onSelect: (tipo: TipoComida, tierIdx: number, precio: number | null, textoPersonalizado?: string) => void }) {
  const [personalizar, setPersonalizar] = React.useState<{ tipo: TipoComida; idx: number } | null>(null);
  const [textoPersonalizado, setTextoPersonalizado] = React.useState("");
  const [menuExpandido, setMenuExpandido] = React.useState(false);
  const [detalleAbierto, setDetalleAbierto] = React.useState<{ tipo: TipoComida; idx: number } | null>(null);
  const secciones: { key: TipoComida; label: string }[] = [
    { key: "desayuno", label: "Desayuno" },
    { key: "lunch", label: "Lunch" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      <div
        style={{
          background: "rgba(201,169,110,0.1)",
          border: "1.5px solid #c9a96e",
          borderRadius: "18px",
          padding: "18px 20px",
        }}
      >
        <div style={{
          display: "inline-block", background: "#c9a96e", color: "#0a1628",
          fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em",
          padding: "4px 12px", borderRadius: "20px", marginBottom: "12px",
        }}>
          MENÚ CORPORATIVO
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>

          <div style={{ display: "flex", gap: "8px", fontSize: "12.5px", lineHeight: "1.5" }}>
            <span style={{ color: "#c9a96e", fontWeight: "700", flexShrink: 0, minWidth: "78px" }}>Centro</span>
            <span style={{ color: "rgba(245,240,232,0.7)" }}>Tabla de empanadas</span>
          </div>
          {menuExpandido && (
            <div style={{ marginLeft: "86px", color: "rgba(245,240,232,0.4)", fontSize: "11px", lineHeight: "1.5", paddingBottom: "4px" }}>
              Mix: verde, morocho, viento
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", fontSize: "12.5px", lineHeight: "1.5" }}>
            <span style={{ color: "#c9a96e", fontWeight: "700", flexShrink: 0, minWidth: "78px" }}>Entrada</span>
            <span style={{ color: "rgba(245,240,232,0.7)" }}>Mini ceviche tatemado</span>
          </div>
          {menuExpandido && (
            <div style={{ marginLeft: "86px", color: "rgba(245,240,232,0.4)", fontSize: "11px", lineHeight: "1.5", paddingBottom: "4px" }}>
              Emulsión de mariscos · camarón · chips
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", fontSize: "12.5px", lineHeight: "1.5" }}>
            <span style={{ color: "#c9a96e", fontWeight: "700", flexShrink: 0, minWidth: "78px" }}>Fuerte</span>
            <span style={{ color: "rgba(245,240,232,0.7)" }}>Lomo & polenta <em style={{ color: "rgba(245,240,232,0.4)", fontStyle: "italic" }}>o</em> pesca blanca <em style={{ color: "rgba(245,240,232,0.4)", fontStyle: "italic" }}>— a elegir</em></span>
          </div>
          {menuExpandido && (
            <div style={{ marginLeft: "86px", display: "flex", flexDirection: "column", gap: "6px", paddingBottom: "4px" }}>
              <div>
                <span style={{ color: "rgba(245,240,232,0.55)", fontSize: "11px", fontWeight: "700" }}>Lomo & polenta — </span>
                <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px" }}>lomo fino de res · demi-glace · polenta de papa · vegetales al grill</span>
              </div>
              <div>
                <span style={{ color: "rgba(245,240,232,0.55)", fontSize: "11px", fontWeight: "700" }}>Pesca blanca — </span>
                <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px" }}>papas salteadas · mix verde · reducción de finas hierbas</span>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", fontSize: "12.5px", lineHeight: "1.5" }}>
            <span style={{ color: "#c9a96e", fontWeight: "700", flexShrink: 0, minWidth: "78px" }}>Postre</span>
            <span style={{ color: "rgba(245,240,232,0.7)" }}>Mousse de limón</span>
          </div>

          <div style={{ display: "flex", gap: "8px", fontSize: "12.5px", lineHeight: "1.5" }}>
            <span style={{ color: "#c9a96e", fontWeight: "700", flexShrink: 0, minWidth: "78px" }}>Bebida</span>
            <span style={{ color: "rgba(245,240,232,0.7)" }}>Soft <em style={{ color: "rgba(245,240,232,0.4)", fontStyle: "italic" }}>a elegir</em> + 1 copa de vino de la casa</span>
          </div>
          {menuExpandido && (
            <div style={{ marginLeft: "86px", color: "rgba(245,240,232,0.4)", fontSize: "11px", lineHeight: "1.5" }}>
              Agua natural · agua mineral · selección de refrescos<br />
              Vino de la casa — 1 copa a elegir
            </div>
          )}
        </div>

        <button
          onClick={() => setMenuExpandido((v) => !v)}
          style={{
            background: "transparent", border: "none", color: "rgba(201,169,110,0.7)",
            fontSize: "11.5px", fontFamily: "Georgia, serif", fontStyle: "italic",
            cursor: "pointer", padding: "0 0 14px", display: "block",
          }}
        >
          {menuExpandido ? "Ocultar opciones del menú ↑" : "Ver opciones del menú ↓"}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", fontStyle: "italic" }}>Más IVA y 10% de servicio</span>
          <button
            onClick={() => onSelect("cena", 0, 35)}
            style={{
              background: "#c9a96e", border: "none", borderRadius: "10px",
              padding: "10px 18px", color: "#0a1628", fontSize: "14px",
              fontWeight: "700", fontFamily: "Georgia, serif", cursor: "pointer",
            }}
          >
            $35 · Elegir →
          </button>
        </div>
      </div>

      {secciones.map(({ key, label }) => (
        <div key={key}>
          <div style={{ color: "#c9a96e", fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", marginBottom: "10px" }}>{label.toUpperCase()}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {PRECIOS[key!].map((item: any, idx) => {
              const esPersonalizar = item.precio === null;
              const esteActivo = personalizar?.tipo === key && personalizar?.idx === idx;
              const detalleActivo = detalleAbierto?.tipo === key && detalleAbierto?.idx === idx;
              return (
                <div key={idx}>
                  <button onClick={() => { if (esPersonalizar) { setPersonalizar({ tipo: key, idx }); setTextoPersonalizado(""); } else { onSelect(key, idx, item.precio); } }}
                    style={{ background: esteActivo ? "rgba(201,169,110,0.12)" : "rgba(255,255,255,0.04)", border: esteActivo ? "1px solid rgba(201,169,110,0.6)" : "1px solid rgba(201,169,110,0.2)", borderRadius: esteActivo || (item.detalle && detalleActivo) ? "14px 14px 0 0" : "14px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "all 0.2s", textAlign: "left", width: "100%" }}
                    onMouseEnter={(e) => { if (!esteActivo) { e.currentTarget.style.background = "rgba(201,169,110,0.08)"; e.currentTarget.style.borderColor = "rgba(201,169,110,0.5)"; } }}
                    onMouseLeave={(e) => { if (!esteActivo) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(201,169,110,0.2)"; } }}>
                    <div>
                      <div style={{ color: "#f5f0e8", fontSize: "14px", fontFamily: "Georgia, serif", marginBottom: "3px" }}>{item.tier}</div>
                      <div style={{ color: "rgba(245,240,232,0.45)", fontSize: "12px" }}>{item.descripcion}</div>
                    </div>
                    <div style={{ color: "#c9a96e", fontSize: "15px", fontFamily: "Georgia, serif", fontWeight: "700", whiteSpace: "nowrap", marginLeft: "16px" }}>{esPersonalizar ? "Personalizar →" : `$${item.precio} + IVA`}</div>
                  </button>

                  {item.detalle && (
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,169,110,0.2)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "10px 18px" }}>
                      <button
                        onClick={() => setDetalleAbierto(detalleActivo ? null : { tipo: key, idx })}
                        style={{ background: "transparent", border: "none", color: "rgba(201,169,110,0.7)", fontSize: "11px", fontFamily: "Georgia, serif", fontStyle: "italic", cursor: "pointer", padding: 0 }}
                      >
                        {detalleActivo ? "Ocultar detalle ↑" : "Ver detalle ↓"}
                      </button>
                      {detalleActivo && (
                        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "5px" }}>
                          {item.detalle.map((linea: string, i: number) => {
                            const esHeader = linea.endsWith(":");
                            return (
                              <div
                                key={i}
                                style={{
                                  color: esHeader ? "rgba(201,169,110,0.75)" : "rgba(245,240,232,0.5)",
                                  fontSize: "11.5px",
                                  fontWeight: esHeader ? 700 : 400,
                                  letterSpacing: esHeader ? "0.05em" : "normal",
                                  lineHeight: "1.5",
                                  marginTop: esHeader && i > 0 ? "4px" : "0",
                                }}
                              >
                                {linea}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {esteActivo && (
                    <div style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.4)", borderTop: "none", borderRadius: "0 0 14px 14px", padding: "14px 18px", display: "flex", gap: "10px" }}>
                      <input autoFocus type="text" value={textoPersonalizado} onChange={(e) => setTextoPersonalizado(e.target.value)} onKeyPress={(e) => { if (e.key === "Enter" && textoPersonalizado.trim()) { onSelect(key, idx, null, textoPersonalizado.trim()); } }} placeholder="Describe lo que tienes en mente..." style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#f5f0e8", fontSize: "14px", fontFamily: "Georgia, serif" }} />
                      <button onClick={() => { if (textoPersonalizado.trim()) onSelect(key, idx, null, textoPersonalizado.trim()); }} disabled={!textoPersonalizado.trim()} style={{ background: "#c9a96e", border: "none", borderRadius: "8px", padding: "6px 14px", color: "#0a1628", fontSize: "13px", fontWeight: "700", cursor: "pointer", opacity: textoPersonalizado.trim() ? 1 : 0.4 }}>→</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultadoCotizacion({ datos, tipo, tierIdx, precio, onConfirmar, onVolver, onMasPreguntas, onDescargarPDF, adicionalesSeleccionados, onToggleAdicional }: { datos: CotizacionData; tipo: TipoComida; tierIdx: number; precio: number | null; onConfirmar: () => void; onVolver: () => void; onMasPreguntas: () => void; onDescargarPDF: () => void; adicionalesSeleccionados: number[]; onToggleAdicional: (idx: number) => void }) {
  if (!tipo) return null;
  const item = PRECIOS[tipo][tierIdx];
  const personas = Number(datos.personas) || 0;
  const subtotalBase = precio && personas ? precio * personas : null;
  const totalAdicionalesPorPersona = tipo === "desayuno"
    ? adicionalesSeleccionados.reduce((sum, idx) => sum + ADICIONALES_DESAYUNO[idx].precio, 0)
    : 0;
  const subtotalAdicionales = totalAdicionalesPorPersona;
  const subtotal = subtotalBase !== null ? subtotalBase + subtotalAdicionales : null;
  const servicio = subtotal !== null ? Math.round(subtotal * SERVICIO * 100) / 100 : null;
  const iva = subtotal !== null ? Math.round((subtotal + servicio!) * IVA * 100) / 100 : null;
  const total = subtotal !== null ? Math.round((subtotal + servicio! + iva!) * 100) / 100 : null;
  const tipoLabel: Record<string, string> = { desayuno: "Desayuno", lunch: "Lunch", cena: "Cena" };
  return (
    <div>
      <div style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.3)", borderRadius: "20px", padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ color: "#c9a96e", fontSize: "10px", letterSpacing: "0.2em", fontWeight: "700" }}>COTIZACIÓN ATHENEUM</div>
        <div style={{ color: "#f5f0e8", fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "600" }}>{tipoLabel[tipo]} {item.tier}</div>
        <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "13px", lineHeight: "1.6" }}>{item.descripcion}</div>
        <div style={{ height: "1px", background: "rgba(201,169,110,0.15)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>Fecha</span>
            <span style={{ color: "#f5f0e8", fontSize: "14px" }}>{datos.fecha || datos._rawDatos as string}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>Hora</span>
            <span style={{ color: "#f5f0e8", fontSize: "14px" }}>{datos.hora || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>Personas</span>
            <span style={{ color: "#f5f0e8", fontSize: "14px" }}>{personas || "—"}</span>
          </div>
          {precio && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>Precio por persona</span>
                <span style={{ color: "#f5f0e8", fontSize: "14px" }}>${precio}</span>
              </div>
              {subtotalAdicionales > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>Adicionales</span>
                  <span style={{ color: "#f5f0e8", fontSize: "14px" }}>${subtotalAdicionales.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>Subtotal</span>
                <span style={{ color: "#f5f0e8", fontSize: "14px" }}>${subtotal!.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>Servicio (10%)</span>
                <span style={{ color: "#f5f0e8", fontSize: "14px" }}>${servicio}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px" }}>IVA (15%)</span>
                <span style={{ color: "#f5f0e8", fontSize: "14px" }}>${iva}</span>
              </div>
            </>
          )}
        </div>

        {tipo === "desayuno" && precio !== null && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ color: "#c9a96e", fontSize: "11px", letterSpacing: "0.1em", fontWeight: "700", marginBottom: "2px" }}>ADICIONALES · $3.50 c/u</div>
            {ADICIONALES_DESAYUNO.map((ad, idx) => {
              const activo = adicionalesSeleccionados.includes(idx);
              return (
                <label key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "4px 0" }}>
                  <div
                    onClick={() => onToggleAdicional(idx)}
                    style={{
                      width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                      border: activo ? "none" : "1px solid rgba(201,169,110,0.4)",
                      background: activo ? "#c9a96e" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#0a1628", fontSize: "12px", fontWeight: "700",
                    }}
                  >
                    {activo ? "✓" : ""}
                  </div>
                  <span onClick={() => onToggleAdicional(idx)} style={{ color: "rgba(245,240,232,0.8)", fontSize: "13px", flex: 1 }}>{ad.nombre}</span>
                  <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px" }}>${ad.precio.toFixed(2)}</span>
                </label>
              );
            })}
          </div>
        )}

        <div style={{ height: "1px", background: "rgba(201,169,110,0.15)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#c9a96e", fontSize: "13px", fontWeight: "700", letterSpacing: "0.1em" }}>{precio ? "TOTAL" : "A COORDINAR"}</span>
          <span style={{ color: "#c9a96e", fontSize: "28px", fontFamily: "Georgia, serif", fontWeight: "700" }}>{precio ? `$${total}` : "Personalizado"}</span>
        </div>
        {datos.textoPersonalizado && (
          <div style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: "10px", padding: "12px 16px" }}>
            <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "11px", letterSpacing: "0.1em", marginBottom: "4px" }}>SOLICITUD</div>
            <div style={{ color: "#f5f0e8", fontSize: "14px", fontFamily: "Georgia, serif" }}>{datos.textoPersonalizado}</div>
          </div>
        )}
        <div style={{ color: "rgba(245,240,232,0.35)", fontSize: "12px", fontStyle: "italic" }}>Parqueadero gratuito · Proyector y audio incluido · WTC Quito</div>
        {precio !== null && (
          <button
            onClick={onDescargarPDF}
            style={{
              width: "100%", padding: "13px", borderRadius: "10px",
              background: "transparent", border: "1px solid rgba(201,169,110,0.5)",
              color: "#c9a96e", fontSize: "12.5px", fontWeight: "700",
              letterSpacing: "0.06em", cursor: "pointer", fontFamily: "sans-serif",
            }}
          >
            ↓ DESCARGAR COTIZACIÓN
          </button>
        )}

        <button onClick={onConfirmar} style={{ width: "100%", padding: "15px", borderRadius: "12px", background: "#c9a96e", border: "none", color: "#0a1628", fontSize: "13px", fontWeight: "700", letterSpacing: "0.1em", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }} onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>CONFIRMAR CON EL EQUIPO</button>

        <button onClick={onVolver} style={{ background: "transparent", border: "none", color: "rgba(245,240,232,0.35)", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif", fontStyle: "italic" }} onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.65)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.35)"; }}>Ver otras opciones</button>
        <button onClick={onMasPreguntas} style={{ background: "transparent", border: "none", color: "rgba(201,169,110,0.5)", fontSize: "13px", cursor: "pointer", fontFamily: "Georgia, serif", fontStyle: "italic" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#c9a96e"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(201,169,110,0.5)"; }}>Tengo más preguntas</button>
      </div>
    </div>
  );
}

export default function AthenaChat() {
  const [pantalla, setPantalla] = useState<Pantalla>("inicio");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveQuote, setHasActiveQuote] = useState(false);
  const [conversacionId] = useState(() => generateId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const RESERVA_STEPS = ["preferencia", "fecha", "hora", "personas", "nombre", "nota"] as const;
  const [reservaStepIdx, setReservaStepIdx] = useState(0);
  const [reservaData, setReservaData] = useState<ReservaData>({ preferencia: "", fecha: "", hora: "", personas: 2, nombre: "", nota: "" });
  const [preferenciaEsOtro, setPreferenciaEsOtro] = useState(false);

  const [cotizacionStep, setCotizacionStep] = useState<CotizacionStep>("fecha");
  const [cotizacionData, setCotizacionData] = useState<Partial<CotizacionData>>({ personas: 2 });
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoComida>(null);
  const [tierSeleccionado, setTierSeleccionado] = useState<number>(0);
  const [precioSeleccionado, setPrecioSeleccionado] = useState<number | null>(null);
  const [adicionalesSeleccionados, setAdicionalesSeleccionados] = useState<number[]>([]);
  const [cotizacionMessages, setCotizacionMessages] = useState<{ role: "athena" | "user"; content: string }[]>([]);
  const cotizacionEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (cotizacionStep === "resultado") {
      cotizacionEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [cotizacionMessages, cotizacionStep]);
  useEffect(() => { registrarEvento(conversacionId, "apertura"); }, [conversacionId]);

  const handleReservaRapida = () => {
    registrarEvento(conversacionId, "reserva_rapida");
    setReservaStepIdx(0);
    setReservaData({ preferencia: "", fecha: "", hora: "", personas: 2, nombre: "", nota: "" });
    setPantalla("reserva");
  };

  const handleCotizacion = () => {
    registrarEvento(conversacionId, "cotizacion");
    setCotizacionStep("fecha");
    setCotizacionData({ personas: 2 });
    setCotizacionMessages([]);
    setAdicionalesSeleccionados([]);
    setPantalla("cotizacion");
  };

  const handleMasInfo = () => {
    registrarEvento(conversacionId, "mas_info");
    setPantalla("chat");
    setMessages([
      { role: "user", content: "hola", hidden: true },
      { role: "assistant", content: "Hola, soy Athena. ¿En qué puedo ayudarte hoy?", opciones: ["Sala privada", "Restaurante", "Evento", "Cómo llegar"] },
    ]);
  };

  const reservaCanNext = () => {
    const step = RESERVA_STEPS[reservaStepIdx];
    if (step === "preferencia") return preferenciaEsOtro ? reservaData.preferencia.trim().length > 0 : !!reservaData.preferencia;
    if (step === "nota") return true;
    if (step === "fecha") return !!reservaData.fecha;
    if (step === "hora") return !!reservaData.hora;
    if (step === "nombre") return reservaData.nombre.trim().length > 1;
    return true;
  };

  const handleEnviarReserva = () => {
    const msg = encodeURIComponent(
      `Hola, quisiera hacer una reserva en Atheneum.\n\n` +
      `Fecha: ${formatearFechaBonita(reservaData.fecha)}\n` +
      `Hora: ${reservaData.hora}\n` +
      `Número de personas: ${reservaData.personas}\n` +
      `Nombre de la reservación: ${reservaData.nombre}\n` +
      `Preferencia: ${reservaData.preferencia}` +
      (reservaData.nota.trim() ? `\nNota: ${reservaData.nota.trim()}` : "")
    );
    return { waUrl: `https://wa.me/${WA_NUMBER}?text=${msg}`, texto: decodeURIComponent(msg) };
  };

  const handleGuardarReservaRapida = () => {
    guardarReserva({
      conversacionId,
      nombre: reservaData.nombre,
      fecha: formatearFechaBonita(reservaData.fecha),
      hora: reservaData.hora,
      personas: reservaData.personas,
      tipo: "reserva_rapida",
      preferencia: reservaData.preferencia,
      nota: reservaData.nota,
      fuente: "reserva_rapida",
    });
  };

  const cotizacionWizardSteps: CotizacionStep[] = ["fecha", "hora", "personas", "nombre"];
  const cotizacionCanNext = () => {
    if (cotizacionStep === "fecha") return !!cotizacionData.fecha;
    if (cotizacionStep === "hora") return !!cotizacionData.hora;
    if (cotizacionStep === "nombre") return !!cotizacionData.nombre && cotizacionData.nombre.trim().length > 1;
    return true;
  };
  const goToNextCotizacionStep = () => {
    const idx = cotizacionWizardSteps.indexOf(cotizacionStep);
    if (idx < cotizacionWizardSteps.length - 1) {
      setCotizacionStep(cotizacionWizardSteps[idx + 1]);
    } else {
      setCotizacionStep("menu");
    }
  };
  const goToPrevCotizacionStep = () => {
    const idx = cotizacionWizardSteps.indexOf(cotizacionStep);
    if (idx > 0) setCotizacionStep(cotizacionWizardSteps[idx - 1]);
  };

  const handleTierSelect = (tipo: TipoComida, tierIdx: number, precio: number | null, textoPersonalizado?: string) => {
    setTipoSeleccionado(tipo);
    setTierSeleccionado(tierIdx);
    setPrecioSeleccionado(precio);
    const item = PRECIOS[tipo!][tierIdx];
    const label = textoPersonalizado ? `Personalizado: ${textoPersonalizado}` : item.tier;
    setCotizacionMessages((prev) => [...prev, { role: "user", content: label }]);
    setCotizacionData((prev) => ({ ...prev, textoPersonalizado: textoPersonalizado || undefined }));
    setCotizacionStep("resultado");
  };

  const handleConfirmarCotizacion = () => {
    const datos = cotizacionData;
    const item = tipoSeleccionado ? PRECIOS[tipoSeleccionado][tierSeleccionado] : null;
    const personas = Number(datos.personas) || 0;
    const totalAdicionalesPorPersona = tipoSeleccionado === "desayuno"
      ? adicionalesSeleccionados.reduce((sum, idx) => sum + ADICIONALES_DESAYUNO[idx].precio, 0)
      : 0;
    const subtotalAdicionales = totalAdicionalesPorPersona;
    const subtotalBase = precioSeleccionado && personas ? precioSeleccionado * personas : null;
    const subtotal = subtotalBase !== null ? subtotalBase + subtotalAdicionales : null;
    const servicio = subtotal !== null ? Math.round(subtotal * SERVICIO * 100) / 100 : null;
    const iva = subtotal !== null ? Math.round((subtotal + servicio!) * IVA * 100) / 100 : null;
    const total = subtotal !== null ? Math.round((subtotal + servicio! + iva!) * 100) / 100 : null;
    const tipoLabel: Record<string, string> = { desayuno: "Desayuno", lunch: "Lunch", cena: "Cena" };
    const nombresAdicionales = adicionalesSeleccionados.map((idx) => ADICIONALES_DESAYUNO[idx].nombre).join(", ");

    let cuerpo = "";
    if (datos.textoPersonalizado) {
      cuerpo =
        `Tipo: ${tipoSeleccionado ? tipoLabel[tipoSeleccionado] : ""}\n` +
        `Solicitud: ${datos.textoPersonalizado}\n` +
        `Precio: A coordinar con el equipo`;
    } else {
      cuerpo =
        `Tipo: ${tipoSeleccionado ? tipoLabel[tipoSeleccionado] : ""} — ${item?.tier}\n` +
        (nombresAdicionales ? `Adicionales: ${nombresAdicionales}\n` : "") +
        `———————————————\n` +
        `Precio/persona:  $${precioSeleccionado}\n` +
        `Personas:        ${personas}\n` +
        (subtotalAdicionales > 0 ? `Adicionales:     $${subtotalAdicionales.toFixed(2)}\n` : "") +
        `Subtotal:        $${subtotal!.toFixed(2)}\n` +
        `Servicio (10%):  $${servicio}\n` +
        `IVA (15%):       $${iva}\n` +
        `———————————————\n` +
        `TOTAL:           $${total}`;
    }

    const msg = encodeURIComponent(
      `Hola, quisiera confirmar una cotización de Atheneum.\n\n` +
      `Nombre: ${datos.nombre}\n` +
      `Fecha: ${datos.fecha || datos._rawDatos}\n` +
      `Hora: ${datos.hora || "—"}\n\n` +
      cuerpo +
      `\n\nQuedo pendiente de confirmación.`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");

    guardarReserva({
      conversacionId,
      nombre: datos.nombre || "",
      fecha: datos.fecha || datos._rawDatos || "",
      hora: datos.hora || "",
      personas,
      tipo: tipoSeleccionado ? tipoLabel[tipoSeleccionado] : "",
      nota: datos.textoPersonalizado || "",
      fuente: "cotizacion",
    });
  };

  const handleDescargarPDF = async () => {
    const datos = cotizacionData;
    const item = tipoSeleccionado ? PRECIOS[tipoSeleccionado][tierSeleccionado] : null;
    const personas = Number(datos.personas) || 0;
    const totalAdicionalesPorPersona = tipoSeleccionado === "desayuno"
      ? adicionalesSeleccionados.reduce((sum, idx) => sum + ADICIONALES_DESAYUNO[idx].precio, 0)
      : 0;
    const subtotalAdicionales = totalAdicionalesPorPersona;
    const subtotalBase = precioSeleccionado && personas ? precioSeleccionado * personas : 0;
    const subtotal = subtotalBase + subtotalAdicionales;
    const servicio = Math.round(subtotal * SERVICIO * 100) / 100;
    const iva = Math.round((subtotal + servicio) * IVA * 100) / 100;
    const total = Math.round((subtotal + servicio + iva) * 100) / 100;
    const tipoLabel: Record<string, string> = { desayuno: "Desayuno", lunch: "Lunch", cena: "Cena" };
    const nombresAdicionales = adicionalesSeleccionados.map((idx) => ADICIONALES_DESAYUNO[idx].nombre).join(", ");
    const hoy = new Date();
    const fechaEmision = hoy.toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" });
    const numero = `COT-${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}-${String(hoy.getHours()).padStart(2, "0")}${String(hoy.getMinutes()).padStart(2, "0")}`;

    const doc = new jsPDF();

    try {
      const logoBase64 = await loadImageAsBase64("/atheneum-logo.jpg");
      doc.addImage(logoBase64, "JPEG", 14, 8, 20, 20);
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
    doc.text("Quito, Ecuador | IG @atheneum.io | WEB www.clubatheneum.ec", 38, 24);

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
    doc.text(`Cliente: ${datos.nombre || "—"}`, 14, 49);
    doc.text(`Fecha del evento: ${datos.fecha || datos._rawDatos || "—"}`, 14, 55);
    doc.text(`Hora: ${datos.hora || "—"}`, 14, 61);

    const itemDetalle: any = item;
    const tituloItem = datos.textoPersonalizado
      ? `${tipoSeleccionado ? tipoLabel[tipoSeleccionado] : ""} — Personalizado`
      : `${tipoSeleccionado ? tipoLabel[tipoSeleccionado] : ""} — ${item?.tier || ""}`;

    autoTable(doc, {
      startY: 68,
      head: [["ÍTEM", "DESCRIPCIÓN", "CANT.", "PRECIO UNIT.", "VALOR TOTAL"]],
      body: [
        [
          "1",
          tituloItem,
          String(personas),
          precioSeleccionado ? `$${precioSeleccionado.toFixed(2)}` : "A coordinar",
          precioSeleccionado ? `$${subtotalBase.toFixed(2)}` : "A coordinar",
        ],
        ...(nombresAdicionales
          ? [[
              "2",
              `Adicionales: ${nombresAdicionales}`,
              String(adicionalesSeleccionados.length),
              `$${subtotalAdicionales.toFixed(2)}`,
              `$${subtotalAdicionales.toFixed(2)}`,
            ]]
          : []),
      ],
      theme: "grid",
      headStyles: { fillColor: [10, 22, 40], textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
      bodyStyles: { fontSize: 9.5, textColor: [40, 40, 40], fontStyle: "bold", valign: "middle" },
      columnStyles: { 0: { cellWidth: 14 }, 1: { cellWidth: 96 }, 2: { cellWidth: 16 }, 3: { cellWidth: 26 }, 4: { cellWidth: 26 } },
    });

    let detalleY = (doc as any).lastAutoTable.finalY + 4;

    if (datos.textoPersonalizado) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      const lineasPersonalizado = doc.splitTextToSize(datos.textoPersonalizado, 175);
      doc.text(lineasPersonalizado, 14, detalleY + 4);
      detalleY += lineasPersonalizado.length * 4.5 + 4;
    } else if (itemDetalle?.detalle) {
      doc.setDrawColor(230, 230, 230);
      doc.setFillColor(250, 249, 246);
      const boxStartY = detalleY;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(180, 148, 90);
      doc.text("DETALLE DEL MENÚ", 18, detalleY + 8);
      detalleY += 14;

      itemDetalle.detalle.forEach((linea: string) => {
        const esHeader = linea.endsWith(":");
        if (esHeader) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(80, 80, 80);
          doc.text(linea, 18, detalleY);
          detalleY += 5.5;
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(90, 90, 90);
          const wrapped = doc.splitTextToSize(linea, 168);
          wrapped.forEach((sub: string, i: number) => {
            const prefix = i === 0 ? "• " : "   ";
            doc.text(`${prefix}${sub}`, 22, detalleY);
            detalleY += 5;
          });
        }
      });

      doc.setDrawColor(201, 169, 110);
      doc.setLineWidth(0.3);
      doc.rect(14, boxStartY, 182, detalleY - boxStartY + 4);
      detalleY += 8;
    } else {
      detalleY += 6;
    }

    const finalY = detalleY + 6;

    if (precioSeleccionado) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Subtotal:", 150, finalY, { align: "right" });
      doc.text(`$${subtotal.toFixed(2)}`, 196, finalY, { align: "right" });
      doc.text("Servicio (10%):", 150, finalY + 6, { align: "right" });
      doc.text(`$${servicio.toFixed(2)}`, 196, finalY + 6, { align: "right" });
      doc.text("IVA (15%):", 150, finalY + 12, { align: "right" });
      doc.text(`$${iva.toFixed(2)}`, 196, finalY + 12, { align: "right" });

      doc.setDrawColor(201, 169, 110);
      doc.line(140, finalY + 16, 196, finalY + 16);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(10, 22, 40);
      doc.text("TOTAL:", 150, finalY + 23, { align: "right" });
      doc.text(`$${total.toFixed(2)}`, 196, finalY + 23, { align: "right" });
    }

    const termsY = precioSeleccionado ? finalY + 36 : finalY + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(10, 22, 40);
    doc.text("TÉRMINOS Y CONDICIONES:", 14, termsY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("1. Los precios están expresados en Dólares Americanos (USD).", 14, termsY + 6);
    doc.text("2. Cualquier servicio o requerimiento no contemplado en esta cotización será facturado como adicional.", 14, termsY + 11);
    doc.text("3. Forma de pago: 50% de anticipo y 50% previo al evento.", 14, termsY + 16);
    doc.text("4. Parqueadero gratuito · Proyector y audio incluido · World Trade Center, Quito.", 14, termsY + 21);

    doc.save(`${numero}.pdf`);
  };

  const handleVolverMenu = () => {
    setCotizacionStep("menu");
    setTipoSeleccionado(null);
    setCotizacionData((prev) => ({ ...prev, textoPersonalizado: undefined }));
    setCotizacionMessages((prev) => prev.slice(0, -1));
    setAdicionalesSeleccionados([]);
  };

  const handleMasPreguntas = () => {
    const tipoLabel: Record<string, string> = { desayuno: "Desayuno", lunch: "Lunch", cena: "Cena" };
    const item = tipoSeleccionado ? PRECIOS[tipoSeleccionado][tierSeleccionado] : null;
    const contexto = tipoSeleccionado
      ? `Hola, estuve viendo una cotización de ${tipoLabel[tipoSeleccionado]} — ${item?.tier}${precioSeleccionado ? ` a $${precioSeleccionado} por persona` : ""} para ${cotizacionData.personas || ""} personas el ${cotizacionData.fecha || cotizacionData._rawDatos || ""}. Tengo algunas preguntas adicionales.`
      : "Hola, estuve viendo una cotización y tengo algunas preguntas adicionales.";
    setPantalla("chat");
    setMessages([
      { role: "user", content: contexto, hidden: true },
      { role: "assistant", content: `Con gusto te ayudo. ¿Qué más quisieras saber, ${cotizacionData.nombre || ""}?`, opciones: ["Parqueadero", "Equipos AV", "Restricciones dietéticas", "Otra"] },
    ]);
  };

  const sendMessage = async (messageToSend?: string) => {
    const content = messageToSend || input;
    if (!content.trim() || isLoading) return;
    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!messageToSend) setInput("");
    setIsLoading(true);
    setHasActiveQuote(false);
    try {
      const apiMessages = newMessages.filter((m) => !m.hidden).map((m) => ({ role: m.role, content: m.content }));
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: apiMessages, conversacionId }) });
      const data = await response.json();
      const athenaResponse = data.message || "";
      const quoteData = data.quote || null;
      const opciones = data.opciones || null;
      if (quoteData) {
        setHasActiveQuote(true);
        setMessages([...newMessages, { role: "assistant", content: quoteData.intro, quote: quoteData }]);
      } else if (athenaResponse) {
        setMessages([...newMessages, { role: "assistant", content: athenaResponse, opciones: opciones && opciones.length > 0 ? opciones : undefined }]);
      }
    } catch (error) { console.error("Error:", error); }
    setIsLoading(false);
  };

  const handleSelectOption = (opcion: QuoteOption, numero: number) => {
    setHasActiveQuote(false);
    const items = opcion.items.map((i) => `${i.concepto}: $${i.precio}`).join(", ");
    sendMessage(`Elijo la Opción ${numero} — ${opcion.titulo} por $${opcion.total}. Incluye: ${items}`);
  };

  const handleContactarEquipo = () => { setHasActiveQuote(false); sendMessage("Prefiero que alguien del equipo de Atheneum me contacte directamente"); };

  const handleQuickReply = (texto: string) => {
    const escape = ["otra", "otra opcion", "otra opción", "algo diferente", "otro"];
    if (escape.includes(texto.trim().toLowerCase())) { inputRef.current?.focus(); return; }
    if (texto === "Cómo llegar") {
      window.open("https://www.google.com/maps/place/ATHENEUM+QUITO/@-0.2049153,-78.4873373,17z/data=!3m1!4b1!4m6!3m5!1s0x91d59b00754f2265:0x4b86cf22b9655876!8m2!3d-0.2049153!4d-78.4847624!16s%2Fg%2F11xd17y9fh?entry=tts", "_blank");
      return;
    }
    sendMessage(texto);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const lastAssistantIdx = (() => {
    const visibles = messages.filter((m) => !m.hidden);
    for (let i = visibles.length - 1; i >= 0; i--) { if (visibles[i].role === "assistant") return i; }
    return -1;
  })();

  const headerStyle: React.CSSProperties = { padding: "24px 24px 16px", borderBottom: "1px solid rgba(201,169,110,0.2)", display: "flex", alignItems: "center", gap: "14px", background: "#0a1628", flexShrink: 0 };
  const avatarStyle: React.CSSProperties = { width: "40px", height: "40px", borderRadius: "50%", background: "#c9a96e", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a1628", fontWeight: "bold", fontSize: "16px", fontFamily: "Georgia, serif", flexShrink: 0, overflow: "hidden" };
  const logoImg = <img src="/atheneum-logo.jpg" alt="Atheneum" style={{ width: "100%", height: "100%", objectFit: "cover" }} />;
  const footerStyle: React.CSSProperties = { textAlign: "center", marginTop: "8px", fontSize: "11px", color: "rgba(245,240,232,0.3)", letterSpacing: "0.05em" };

  const HORA_CHIPS = ["08:00", "09:00", "12:00", "13:00", "14:00", "19:00", "20:00", "21:00"];
  const PREFERENCIA_CHIPS = ["Restaurante", "Terraza", "Salón privado", "Otro"];

  if (pantalla === "inicio") {
    return (
      <div style={{
        width: "100vw", minHeight: "100vh",
        backgroundImage: "linear-gradient(rgba(8,12,18,0.68), rgba(8,12,18,0.78)), url('/atheneum-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex", flexDirection: "column", position: "relative",
      }}>
        <div style={headerStyle}>
          <div style={avatarStyle}>{logoImg}</div>
          <div>
            <div style={{ color: "#c9a96e", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600", letterSpacing: "0.05em" }}>Atheneum</div>
            <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block", boxShadow: "0 0 6px rgba(74,222,128,0.6)" }} />
              Asistente Virtual · En línea
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 24px", gap: "18px", maxWidth: "560px", width: "100%", margin: "0 auto", overflow: "hidden" }}>

          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "68px", height: "68px", borderRadius: "50%",
              background: "linear-gradient(150deg, #e3c98d, #a67c3d)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#0a1628", fontWeight: "bold", fontSize: "26px", fontFamily: "Georgia, serif",
              margin: "0 auto 18px", overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(245,240,232,0.4), 0 0 0 6px rgba(201,169,110,0.08), 0 0 30px rgba(201,169,110,0.28), 0 8px 20px rgba(0,0,0,0.45)",
              border: "1px solid rgba(245,240,232,0.5)",
            }}>{logoImg}</div>
            <div style={{ color: "#f5f0e8", fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "600", letterSpacing: "0.01em" }}>Bienvenido a Atheneum</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", margin: "12px 0" }}>
              <div style={{ width: "24px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.7))" }} />
              <div style={{ width: "4px", height: "4px", background: "#c9a96e", transform: "rotate(45deg)" }} />
              <div style={{ width: "24px", height: "1px", background: "linear-gradient(90deg, rgba(201,169,110,0.7), transparent)" }} />
            </div>
            <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "13px", fontFamily: "sans-serif" }}>¿Cómo puedo ayudarte hoy?</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
            <button onClick={handleReservaRapida} style={{ background: "linear-gradient(135deg, rgba(37,211,102,0.12), rgba(37,211,102,0.03))", border: "1px solid rgba(37,211,102,0.35)", borderRadius: "14px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "all 0.25s", textAlign: "left", width: "100%", boxShadow: "0 6px 16px rgba(0,0,0,0.3)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(37,211,102,0.6)"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(37,211,102,0.35)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(74,222,128,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#4ade80"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.68 1.45c6.55 0 11.89-5.34 11.89-11.89C23.94 5.34 18.6 0 12.05 0z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#4ade80", fontSize: "14.5px", fontWeight: "700", fontFamily: "sans-serif", marginBottom: "2px", letterSpacing: "0.01em" }}>Reserva Rápida</div>
                <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "11.5px", fontFamily: "sans-serif" }}>Confirma por WhatsApp en minutos</div>
              </div>
              <div style={{ color: "#4ade80", fontSize: "18px", fontFamily: "sans-serif", opacity: 0.65 }}>→</div>
            </button>

            <button onClick={handleCotizacion} style={{ background: "linear-gradient(135deg, rgba(201,169,110,0.14), rgba(201,169,110,0.03))", border: "1px solid rgba(201,169,110,0.4)", borderRadius: "14px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "all 0.25s", textAlign: "left", width: "100%", boxShadow: "0 6px 16px rgba(0,0,0,0.3)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.65)"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,169,110,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.45)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5.5c0-1.5-1.5-2.5-5-2.5s-5 1.2-5 3 2 2.4 5 2.7c3 .3 5 1.1 5 2.8s-1.5 3-5 3-5-1-5-2.5" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#e3c98d", fontSize: "14.5px", fontWeight: "700", fontFamily: "sans-serif", marginBottom: "2px", letterSpacing: "0.01em" }}>Cotización</div>
                <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "11.5px", fontFamily: "sans-serif" }}>Cotiza al instante tus eventos</div>
              </div>
              <div style={{ color: "#e3c98d", fontSize: "18px", fontFamily: "sans-serif", opacity: 0.8 }}>→</div>
            </button>

            <button onClick={handleMasInfo} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "14px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "all 0.25s", textAlign: "left", width: "100%", boxShadow: "0 6px 16px rgba(0,0,0,0.3)" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"; e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,240,232,0.8)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M9.3 9a2.7 2.7 0 015.2.9c0 1.8-2.5 2.1-2.5 3.8" />
                  <circle cx="12" cy="17" r="0.4" fill="rgba(245,240,232,0.8)" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#f5f0e8", fontSize: "14.5px", fontWeight: "700", fontFamily: "sans-serif", marginBottom: "2px", letterSpacing: "0.01em" }}>Preguntas y Respuestas</div>
                <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "11.5px", fontFamily: "sans-serif" }}>Tus dudas respondidas al instante</div>
              </div>
              <div style={{ color: "rgba(245,240,232,0.45)", fontSize: "18px", fontFamily: "sans-serif" }}>→</div>
            </button>
          </div>

          <a href="https://www.google.com/maps/place/ATHENEUM+QUITO/@-0.2049153,-78.4873373,17z/data=!3m1!4b1!4m6!3m5!1s0x91d59b00754f2265:0x4b86cf22b9655876!8m2!3d-0.2049153!4d-78.4847624!16s%2Fg%2F11xd17y9fh?entry=tts" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(201,169,110,0.55)", fontSize: "11.5px", fontFamily: "Georgia, serif", fontStyle: "italic", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(201,169,110,0.9)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(201,169,110,0.55)"; }}>
            Av. 12 de Octubre y Luis Cordero, WTC · Cómo llegar →
          </a>
        </div>

        <div style={{ padding: "11px 16px", borderTop: "1px solid rgba(201,169,110,0.14)", background: "rgba(10,22,40,0.5)", flexShrink: 0 }}>
          <div style={{ ...footerStyle, letterSpacing: "0.16em" }}>ATHENEUM · WORLD TRADE CENTER · QUITO</div>
        </div>

        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} } html, body { margin: 0; padding: 0; }`}</style>
      </div>
    );
  }
  if (pantalla === "reserva") {
    const step = RESERVA_STEPS[reservaStepIdx];
    const done = reservaStepIdx >= RESERVA_STEPS.length;
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#080c12", display: "flex", flexDirection: "column" }}>
        <div style={headerStyle}>
          <button onClick={() => setPantalla("inicio")} style={{ background: "transparent", border: "none", color: "rgba(245,240,232,0.4)", cursor: "pointer", fontSize: "20px", padding: "0 8px 0 0", fontFamily: "sans-serif" }}>←</button>
          <div style={avatarStyle}>{logoImg}</div>
          <div>
            <div style={{ color: "#c9a96e", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600", letterSpacing: "0.05em" }}>Reserva Rápida</div>
            <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", marginTop: "2px" }}>Atheneum</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px", maxWidth: "520px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {!done ? (
            <>
              <ProgressBar step={reservaStepIdx} total={RESERVA_STEPS.length} />

              {step === "preferencia" && (
                <div>
                  <FieldLabel>¿Dónde prefieres?</FieldLabel>
                  <ChipRow
                    options={PREFERENCIA_CHIPS}
                    value={preferenciaEsOtro ? "Otro" : reservaData.preferencia}
                    onChange={(v) => {
                      if (v === "Otro") {
                        setPreferenciaEsOtro(true);
                        setReservaData((d) => ({ ...d, preferencia: "" }));
                      } else {
                        setPreferenciaEsOtro(false);
                        setReservaData((d) => ({ ...d, preferencia: v }));
                      }
                    }}
                  />
                  {preferenciaEsOtro && (
                    <div style={{ marginTop: "14px" }}>
                      <WizardInput autoFocus placeholder="Cuéntanos qué tienes en mente" value={reservaData.preferencia} onChange={(e) => setReservaData((d) => ({ ...d, preferencia: e.target.value }))} />
                    </div>
                  )}
                </div>
              )}

              {step === "fecha" && (
                <div>
                  <FieldLabel>¿Qué día?</FieldLabel>
                  <WizardInput type="date" value={reservaData.fecha} onChange={(e) => setReservaData((d) => ({ ...d, fecha: e.target.value }))} />
                </div>
              )}

              {step === "hora" && (
                <div>
                  <FieldLabel>¿A qué hora?</FieldLabel>
                  <ChipRow options={HORA_CHIPS} value={reservaData.hora} onChange={(v) => setReservaData((d) => ({ ...d, hora: v }))} />
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", marginBottom: "8px" }}>¿Otra hora? Escríbela directo</div>
                    <WizardInput type="time" value={reservaData.hora} onChange={(e) => setReservaData((d) => ({ ...d, hora: e.target.value }))} />
                  </div>
                </div>
              )}

              {step === "personas" && (
                <div>
                  <FieldLabel>¿Cuántas personas?</FieldLabel>
                  <WizardStepper value={reservaData.personas} onChange={(v) => setReservaData((d) => ({ ...d, personas: v }))} />
                </div>
              )}

              {step === "nombre" && (
                <div>
                  <FieldLabel>¿A nombre de quién?</FieldLabel>
                  <WizardInput placeholder="Tu nombre" value={reservaData.nombre} onChange={(e) => setReservaData((d) => ({ ...d, nombre: e.target.value }))} />
                </div>
              )}

              {step === "nota" && (
                <div>
                  <FieldLabel>¿Alguna nota u ocasión especial? (opcional)</FieldLabel>
                  <textarea
                    placeholder="Ej: cumpleaños, alergias, aniversario... (omite si no aplica)"
                    value={reservaData.nota}
                    onChange={(e) => setReservaData((d) => ({ ...d, nota: e.target.value }))}
                    rows={3}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.3)", borderRadius: "12px", padding: "14px 18px", color: "#f5f0e8", fontSize: "15px", outline: "none", fontFamily: "sans-serif", resize: "vertical" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "26px" }}>
                {reservaStepIdx > 0 && (
                  <button onClick={() => setReservaStepIdx((i) => i - 1)} style={{ background: "transparent", border: "1px solid rgba(201,169,110,0.4)", color: "#c9a96e", borderRadius: "12px", padding: "14px 22px", fontFamily: "sans-serif", cursor: "pointer" }}>Atrás</button>
                )}
                <div style={{ flex: 1 }}>
                  <WizardPrimaryButton disabled={!reservaCanNext()} onClick={() => setReservaStepIdx((i) => i + 1)}>
                    {reservaStepIdx === RESERVA_STEPS.length - 1 ? "Confirmar" : "Continuar"}
                  </WizardPrimaryButton>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "#f5f0e8", fontFamily: "Georgia, serif", fontSize: "24px", fontWeight: 600, marginBottom: "6px" }}>Casi listo, {reservaData.nombre.split(" ")[0]}</div>
              <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "13px", marginBottom: "20px", lineHeight: 1.6, fontFamily: "sans-serif" }}>
                Envía este resumen por WhatsApp y el equipo de Atheneum te confirma la mesa en minutos.
              </p>
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,169,110,0.3)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
                <SummaryRow label="Preferencia" value={reservaData.preferencia} />
                <SummaryRow label="Fecha" value={formatearFechaBonita(reservaData.fecha)} />
                <SummaryRow label="Hora" value={reservaData.hora} />
                <SummaryRow label="Personas" value={reservaData.personas} />
                <SummaryRow label="Nombre" value={reservaData.nombre} />
                {reservaData.nota.trim() && <SummaryRow label="Nota" value={reservaData.nota} />}
              </div>
              <WhatsAppSendButton waUrl={handleEnviarReserva().waUrl} message={handleEnviarReserva().texto} label="Enviar por WhatsApp" onSend={handleGuardarReservaRapida} />
            </>
          )}
        </div>
      </div>
    );
  }

  if (pantalla === "cotizacion") {
    const wizardIdx = cotizacionWizardSteps.indexOf(cotizacionStep);
    const enWizard = wizardIdx !== -1;
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#080c12", display: "flex", flexDirection: "column" }}>
        <div style={headerStyle}>
          <button
            onClick={() => {
              if (cotizacionStep === "resultado") { handleVolverMenu(); return; }
              if (cotizacionStep === "menu" && wizardIdx === -1) {
                const idx = cotizacionWizardSteps.indexOf("nombre");
                setCotizacionStep(cotizacionWizardSteps[idx]);
                return;
              }
              if (enWizard && wizardIdx > 0) { goToPrevCotizacionStep(); return; }
              setPantalla("inicio");
            }}
            style={{ background: "transparent", border: "none", color: "rgba(245,240,232,0.4)", cursor: "pointer", fontSize: "20px", padding: "0 8px 0 0", fontFamily: "sans-serif" }}
          >←</button>
          <div style={avatarStyle}>{logoImg}</div>
          <div>
            <div style={{ color: "#c9a96e", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600", letterSpacing: "0.05em" }}>Atheneum · Cotización</div>
            <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              En línea
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px", display: "flex", flexDirection: "column", gap: "18px", maxWidth: "900px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
          {enWizard && (
            <div style={{ maxWidth: "520px", width: "100%", margin: "0 auto" }}>
              <ProgressBar step={wizardIdx} total={cotizacionWizardSteps.length} />

              {cotizacionStep === "fecha" && (
                <div>
                  <FieldLabel>¿Qué día?</FieldLabel>
                  <WizardInput type="date" value={cotizacionData.fecha || ""} onChange={(e) => setCotizacionData((d) => ({ ...d, fecha: e.target.value }))} />
                </div>
              )}

              {cotizacionStep === "hora" && (
                <div>
                  <FieldLabel>¿A qué hora?</FieldLabel>
                  <ChipRow options={HORA_CHIPS} value={cotizacionData.hora || ""} onChange={(v) => setCotizacionData((d) => ({ ...d, hora: v }))} />
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", marginBottom: "8px" }}>¿Otra hora? Escríbela directo</div>
                    <WizardInput type="time" value={cotizacionData.hora || ""} onChange={(e) => setCotizacionData((d) => ({ ...d, hora: e.target.value }))} />
                  </div>
                </div>
              )}

              {cotizacionStep === "personas" && (
                <div>
                  <FieldLabel>¿Cuántas personas?</FieldLabel>
                  <WizardStepper value={cotizacionData.personas || 2} onChange={(v) => setCotizacionData((d) => ({ ...d, personas: v }))} />
                </div>
              )}

              {cotizacionStep === "nombre" && (
                <div>
                  <FieldLabel>¿A nombre de quién?</FieldLabel>
                  <WizardInput placeholder="Tu nombre" value={cotizacionData.nombre || ""} onChange={(e) => setCotizacionData((d) => ({ ...d, nombre: e.target.value }))} />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", marginTop: "26px" }}>
                {wizardIdx > 0 && (
                  <button onClick={goToPrevCotizacionStep} style={{ background: "transparent", border: "1px solid rgba(201,169,110,0.4)", color: "#c9a96e", borderRadius: "12px", padding: "14px 22px", fontFamily: "sans-serif", cursor: "pointer" }}>Atrás</button>
                )}
                <div style={{ flex: 1 }}>
                  <WizardPrimaryButton disabled={!cotizacionCanNext()} onClick={() => { setCotizacionData((d) => ({ ...d, fecha: d.fecha ? formatearFechaBonita(d.fecha) : d.fecha })); goToNextCotizacionStep(); }}>
                    {wizardIdx === cotizacionWizardSteps.length - 1 ? "Ver el menú" : "Continuar"}
                  </WizardPrimaryButton>
                </div>
              </div>
            </div>
          )}

          {!enWizard && cotizacionMessages.map((msg, idx) => (
            <div key={idx}>
              {msg.role === "athena" ? (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#c9a96e", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a1628", fontWeight: "bold", fontSize: "13px", fontFamily: "Georgia, serif", flexShrink: 0, marginTop: "2px" }}>A</div>
                  <div style={{ borderRadius: "4px 20px 20px 20px", padding: "14px 18px", fontSize: "15px", lineHeight: "1.7", background: "rgba(255,255,255,0.06)", color: "#f5f0e8", fontFamily: "Georgia, serif", whiteSpace: "pre-line" }}>{msg.content}</div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ borderRadius: "20px 20px 4px 20px", padding: "14px 18px", fontSize: "15px", lineHeight: "1.7", background: "#c9a96e", color: "#0a1628", maxWidth: "72%", fontFamily: "sans-serif" }}>{msg.content}</div>
                </div>
              )}
            </div>
          ))}
          {cotizacionStep === "menu" && <div style={{ paddingLeft: "0" }}><CartaPrecios onSelect={handleTierSelect} /></div>}
          {cotizacionStep === "resultado" && tipoSeleccionado && (
            <ResultadoCotizacion datos={cotizacionData as CotizacionData} tipo={tipoSeleccionado} tierIdx={tierSeleccionado} precio={precioSeleccionado} onConfirmar={handleConfirmarCotizacion} onVolver={handleVolverMenu} onMasPreguntas={handleMasPreguntas} onDescargarPDF={handleDescargarPDF} adicionalesSeleccionados={adicionalesSeleccionados} onToggleAdicional={(idx) => setAdicionalesSeleccionados((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx])} />
          )}
          <div ref={cotizacionEndRef} />
        </div>
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#080c12", display: "flex", flexDirection: "column" }}>
      <div style={headerStyle}>
        <button onClick={() => setPantalla("inicio")} style={{ background: "transparent", border: "none", color: "rgba(245,240,232,0.4)", cursor: "pointer", fontSize: "20px", padding: "0 8px 0 0", fontFamily: "sans-serif" }}>←</button>
        <div style={avatarStyle}>{logoImg}</div>
        <div>
          <div style={{ color: "#c9a96e", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600", letterSpacing: "0.05em" }}>Atheneum</div>
          <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Asistente Virtual · En línea
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px", width: "100%", margin: "0 auto" }}>
        {messages.filter((m) => !m.hidden).map((msg, idx) => (
          <div key={idx}>
            {!msg.quote ? (
              <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#c9a96e", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a1628", fontWeight: "bold", fontSize: "13px", fontFamily: "Georgia, serif", flexShrink: 0, marginRight: "10px", marginTop: "4px" }}>A</div>
                )}
                <div style={{ display: "flex", flexDirection: "column", maxWidth: "72%" }}>
                  <div style={{ borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "4px 20px 20px 20px", padding: "14px 18px", fontSize: "15px", lineHeight: "1.7", background: msg.role === "user" ? "#c9a96e" : "rgba(255,255,255,0.06)", color: msg.role === "user" ? "#0a1628" : "#f5f0e8", fontFamily: msg.role === "assistant" ? "Georgia, serif" : "inherit" }}>{msg.content}</div>
                  {msg.role === "assistant" && msg.opciones && msg.opciones.length > 0 && idx === lastAssistantIdx && !isLoading && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px", rowGap: "10px" }}>
                      {msg.opciones.map((op, i) => {
                        const esOtra = ["otra", "otra opcion", "otra opción", "algo diferente", "otro"].includes(op.trim().toLowerCase());
                        return (
                          <button key={i} onClick={() => handleQuickReply(op)} style={{ background: "transparent", border: esOtra ? "1px dashed rgba(245,240,232,0.3)" : "1px solid rgba(201,169,110,0.45)", color: esOtra ? "rgba(245,240,232,0.55)" : "#c9a96e", borderRadius: "22px", padding: "10px 20px", fontSize: "13.5px", fontWeight: "500", cursor: "pointer", transition: "all 0.2s ease", fontFamily: "inherit", fontStyle: esOtra ? "italic" : "normal", whiteSpace: "nowrap" }}
                            onMouseEnter={(e) => { if (esOtra) { e.currentTarget.style.borderColor = "rgba(245,240,232,0.5)"; e.currentTarget.style.color = "rgba(245,240,232,0.8)"; } else { e.currentTarget.style.background = "#c9a96e"; e.currentTarget.style.color = "#0a1628"; e.currentTarget.style.borderColor = "#c9a96e"; } }}
                            onMouseLeave={(e) => { if (esOtra) { e.currentTarget.style.borderColor = "rgba(245,240,232,0.3)"; e.currentTarget.style.color = "rgba(245,240,232,0.55)"; } else { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#c9a96e"; e.currentTarget.style.borderColor = "rgba(201,169,110,0.45)"; } }}>
                            {esOtra ? "Otra — escribir" : op}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#c9a96e", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a1628", fontWeight: "bold", fontSize: "13px", fontFamily: "Georgia, serif", flexShrink: 0 }}>A</div>
                  <div style={{ borderRadius: "4px 20px 20px 20px", padding: "14px 18px", fontSize: "15px", lineHeight: "1.7", background: "rgba(255,255,255,0.06)", color: "#f5f0e8", fontFamily: "Georgia, serif" }}>{msg.content}</div>
                </div>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", paddingLeft: "42px" }}>
                  <QuoteCard opcion={msg.quote.opcion1} numero={1} onSelect={() => handleSelectOption(msg.quote!.opcion1, 1)} />
                  <QuoteCard opcion={msg.quote.opcion2} numero={2} onSelect={() => handleSelectOption(msg.quote!.opcion2, 2)} />
                </div>
                <div style={{ paddingLeft: "42px", marginTop: "16px", display: "flex", justifyContent: "center" }}>
                  <button onClick={handleContactarEquipo} style={{ background: "transparent", border: "none", color: "rgba(245,240,232,0.35)", fontSize: "13px", cursor: "pointer", padding: "8px 16px", borderRadius: "8px", fontFamily: "Georgia, serif", fontStyle: "italic" }} onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.65)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.35)"; }}>
                    Prefiero que alguien del equipo me contacte
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#c9a96e", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a1628", fontWeight: "bold", fontSize: "13px", fontFamily: "Georgia, serif", flexShrink: 0 }}>A</div>
            <div style={{ borderRadius: "4px 20px 20px 20px", padding: "14px 18px", background: "rgba(255,255,255,0.06)", display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (<div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#c9a96e", opacity: 0.7, animation: `bounce 1s infinite ${i * 0.15}s` }} />))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(201,169,110,0.2)", background: "#0a1628", flexShrink: 0 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", gap: "10px" }}>
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder={hasActiveQuote ? "Selecciona una opción arriba..." : "Escribe tu respuesta..."} disabled={isLoading || hasActiveQuote} style={{ flex: 1, borderRadius: "14px", padding: "14px 20px", fontSize: "15px", background: hasActiveQuote ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.25)", color: "#f5f0e8", outline: "none", opacity: hasActiveQuote ? 0.4 : 1, cursor: hasActiveQuote ? "not-allowed" : "text", transition: "all 0.2s" }} />
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim() || hasActiveQuote} style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#c9a96e", border: "none", color: "#0a1628", cursor: isLoading || hasActiveQuote ? "not-allowed" : "pointer", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", opacity: isLoading || !input.trim() || hasActiveQuote ? 0.3 : 1, flexShrink: 0, transition: "opacity 0.2s" }}>→</button>
        </div>
        <div style={footerStyle}>ATHENEUM · WORLD TRADE CENTER · QUITO</div>
      </div>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @media (max-width: 640px) { .quote-cards { flex-direction: column !important; } }
      `}</style>
    </div>
  );
}