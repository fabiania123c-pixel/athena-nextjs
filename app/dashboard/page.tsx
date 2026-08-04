"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GOLD = "#c9a96e";
const NAVY = "#0a1628";
const DARK = "#080c12";

interface Lead {
  id: string;
  nombre: string;
  empresa: string;
  industria: string;
  ciudad: string;
  whatsapp: string;
  email: string;
  tipo: string;
  fecha_evento: string;
  valor_potencial: number;
  score: number;
  estado: string;
  fecha_creacion: string;
  fecha_contactado: string | null;
  opcion_elegida: string;
  conversacion_id: string;
}

interface Conversacion {
  id: string;
  fecha_inicio: string;
  llego_al_cierre: boolean;
  temperatura: string;
  hora_del_dia: number;
  num_mensajes: number;
}

interface Mensaje {
  id: string;
  conversacion_id: string;
  rol: string;
  contenido: string;
  timestamp: string;
}

interface Review {
  id: string;
  rating: number;
  comentario: string | null;
  email: string | null;
  cedula_ruc: string;
  codigo_cafe: string;
  usado: boolean;
  fecha_creacion: string;
}

interface Insight {
  icono: string;
  titulo: string;
  detalle: string;
}

interface FunnelEvent {
  id: string;
  conversacion_id: string;
  evento: string;
  created_at: string;
}

interface Reserva {
  id: string;
  conversacion_id: string;
  nombre: string;
  fecha: string;
  hora: string;
  personas: number;
  tipo: string;
  preferencia: string;
  nota: string;
  fuente: string;
  estado: string;
  created_at: string;
}

const normalizeIndustria = (ind: string) => {
  const lower = ind.toLowerCase().trim();
  if (["tech", "tecnología", "tecnologia", "software", "ia", "inteligencia artificial", "automatizacion", "automatización", "marketing digital"].some(t => lower.includes(t))) return "Tecnología";
  if (["banca", "banco", "finanzas", "financiero"].some(t => lower.includes(t))) return "Banca y Finanzas";
  if (["construccion", "construcción", "inmobiliaria"].some(t => lower.includes(t))) return "Construcción";
  if (["legal", "abogado", "consultoría", "consultoria"].some(t => lower.includes(t))) return "Legal y Consultoría";
  if (["salud", "médico", "medico", "farmacia"].some(t => lower.includes(t))) return "Salud";
  if (["retail", "comercio", "tienda"].some(t => lower.includes(t))) return "Retail";
  if (["ingenieria", "ingeniería"].some(t => lower.includes(t))) return "Ingeniería";
  return ind.trim().charAt(0).toUpperCase() + ind.trim().slice(1).toLowerCase();
};

const normalizeCiudad = (ciudad: string) => {
  return ciudad.trim().charAt(0).toUpperCase() + ciudad.trim().slice(1).toLowerCase();
};

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [funnelEvents, setFunnelEvents] = useState<FunnelEvent[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [activeTab, setActiveTab] = useState("command");
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [filtroReserva, setFiltroReserva] = useState("todas");
  const [loadingMensajes, setLoadingMensajes] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState<string | null>(null);
  const [updatingReserva, setUpdatingReserva] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const DASHBOARD_PASSWORD = "atheneum2026";

  useEffect(() => {
    if (authenticated) {
      fetchData();
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const fetchData = async () => {
    const { data: leadsData } = await supabase
      .from("leads")
      .select("*")
      .order("fecha_creacion", { ascending: false });

    const { data: convData } = await supabase
      .from("conversaciones")
      .select("*")
      .order("fecha_inicio", { ascending: false });

    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("*")
      .order("fecha_creacion", { ascending: false });

    const { data: funnelData } = await supabase
      .from("funnel_events")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: reservasData } = await supabase
      .from("reservas")
      .select("*")
      .order("created_at", { ascending: false });

    if (leadsData) setLeads(leadsData);
    if (convData) setConversaciones(convData);
    if (reviewsData) setReviews(reviewsData);
    if (funnelData) setFunnelEvents(funnelData);
    if (reservasData) setReservas(reservasData);
  };

  const fetchMensajes = async (conversacionId: string) => {
    setLoadingMensajes(true);
    const { data } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", conversacionId)
      .order("timestamp", { ascending: true });
    if (data) setMensajes(data);
    setLoadingMensajes(false);
  };

  const updateEstado = async (leadId: string, estado: string) => {
    setUpdatingEstado(leadId);
    const updateData: { estado: string; fecha_contactado?: string } = { estado };
    if (estado === "contactado") {
      const lead = leads.find(l => l.id === leadId);
      if (lead && !lead.fecha_contactado) {
        updateData.fecha_contactado = new Date().toISOString();
      }
    }
    await supabase.from("leads").update(updateData).eq("id", leadId);
    await fetchData();
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, estado, fecha_contactado: updateData.fecha_contactado || selectedLead.fecha_contactado });
    }
    setUpdatingEstado(null);
  };

  const updateReservaEstado = async (reservaId: string, estado: string) => {
    setUpdatingReserva(reservaId);
    await supabase.from("reservas").update({ estado }).eq("id", reservaId);
    await fetchData();
    setUpdatingReserva(null);
  };

  const toggleUsado = async (reviewId: string, usadoActual: boolean) => {
    await supabase.from("reviews").update({ usado: !usadoActual }).eq("id", reviewId);
    await fetchData();
  };

  const generarInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();
      if (data.insights) setInsights(data.insights);
    } catch (e) {
      console.error(e);
    }
    setLoadingInsights(false);
  };

  const handleLogin = () => {
    if (password === DASHBOARD_PASSWORD) {
      setAuthenticated(true);
    } else {
      setAuthError("Contraseña incorrecta");
    }
  };

  const exportarCSV = () => {
    const headers = ["Nombre", "Empresa", "Industria", "Ciudad", "WhatsApp", "Email", "Tipo", "Fecha Evento", "Valor", "Score", "Estado", "Fecha Creacion"];
    const rows = leads.map(l => [
      l.nombre || "",
      l.empresa || "",
      l.industria ? normalizeIndustria(l.industria) : "",
      l.ciudad ? normalizeCiudad(l.ciudad) : "",
      l.whatsapp || "",
      l.email || "",
      l.tipo || "",
      l.fecha_evento || "",
      String(l.valor_potencial || 0),
      String(l.score || 0),
      l.estado || "",
      l.fecha_creacion ? new Date(l.fecha_creacion).toLocaleDateString("es-EC") : "",
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `atheneum-leads-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cálculo de semanas
  const ahora = new Date();
  const inicioEstaSemanaa = new Date(ahora);
  inicioEstaSemanaa.setDate(ahora.getDate() - ahora.getDay());
  inicioEstaSemanaa.setHours(0, 0, 0, 0);

  const inicioSemanaPasada = new Date(inicioEstaSemanaa);
  inicioSemanaPasada.setDate(inicioEstaSemanaa.getDate() - 7);

  const leadsEstaSemana = leads.filter(l =>
    l.fecha_creacion && new Date(l.fecha_creacion) >= inicioEstaSemanaa
  );
  const leadsSemanaPasada = leads.filter(l =>
    l.fecha_creacion &&
    new Date(l.fecha_creacion) >= inicioSemanaPasada &&
    new Date(l.fecha_creacion) < inicioEstaSemanaa
  );

  const diferenciaLeads = leadsEstaSemana.length - leadsSemanaPasada.length;

  const pipelineEstaSemana = leadsEstaSemana.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);
  const pipelineSemanaPasada = leadsSemanaPasada.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);
  const diferenciaPipeline = pipelineEstaSemana - pipelineSemanaPasada;

  // KPIs
  const totalPipeline = leads.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);
  const leadsCerrados = leads.filter(l => l.estado === "cerrado");
  const valorCerrado = leadsCerrados.reduce((sum, l) => sum + (l.valor_potencial || 0), 0);
  const leadsPendientes = leads.filter(l => l.estado === "pendiente");
  const leadsCalientes = leads.filter(l => (l.score || 0) >= 7 && l.estado === "pendiente");

  const tasaConversion = leads.length > 0
    ? Math.round((leadsCerrados.length / leads.length) * 100)
    : 0;

  const ticketPromedio = leads.length > 0
    ? Math.round(totalPipeline / leads.length)
    : 0;

  const leadsConTiempos = leads.filter(l => l.fecha_creacion && l.fecha_contactado);
  const tiempoRespuestaPromedio = leadsConTiempos.length > 0
    ? leadsConTiempos.reduce((sum, l) => {
        const creado = new Date(l.fecha_creacion).getTime();
        const contactado = new Date(l.fecha_contactado!).getTime();
        return sum + Math.max(0, contactado - creado);
      }, 0) / leadsConTiempos.length
    : 0;

  const formatTiempo = (ms: number) => {
    if (ms === 0) return "—";
    const minutos = Math.round(ms / 60000);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const minRestantes = minutos % 60;
    if (horas < 24) return `${horas}h ${minRestantes}m`;
    const dias = Math.floor(horas / 24);
    return `${dias}d ${horas % 24}h`;
  };

  const leadsFiltrados = filtroEstado === "todos"
    ? leads
    : leads.filter(l => l.estado === filtroEstado);

  const industriaData = leads.reduce((acc: Record<string, number>, l) => {
    if (l.industria && l.industria !== "No especificado") {
      const key = normalizeIndustria(l.industria);
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});
  const industriaChart = Object.entries(industriaData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const tipoData = leads.reduce((acc: Record<string, number>, l) => {
    if (l.tipo) acc[l.tipo] = (acc[l.tipo] || 0) + 1;
    return acc;
  }, {});
  const tipoChart = Object.entries(tipoData).map(([name, value]) => ({ name, value }));

  const horaData = conversaciones.reduce((acc: Record<number, number>, c) => {
    if (c.hora_del_dia !== null) {
      acc[c.hora_del_dia] = (acc[c.hora_del_dia] || 0) + 1;
    }
    return acc;
  }, {});
  const horaChart = Array.from({ length: 24 }, (_, i) => ({
    hora: `${i}h`,
    conversaciones: horaData[i] || 0,
  }));

  const ciudadData = leads.reduce((acc: Record<string, number>, l) => {
    if (l.ciudad && l.ciudad !== "No especificado") {
      const key = normalizeCiudad(l.ciudad);
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {});
  const ciudadChart = Object.entries(ciudadData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Funnel KPIs
  const totalAperturas = funnelEvents.filter(e => e.evento === "apertura").length;
  const totalReservaRapida = funnelEvents.filter(e => e.evento === "reserva_rapida").length;
  const totalCotizacion = funnelEvents.filter(e => e.evento === "cotizacion").length;
  const totalMasInfo = funnelEvents.filter(e => e.evento === "mas_info").length;
  const pctReservaRapida = totalAperturas > 0 ? Math.round((totalReservaRapida / totalAperturas) * 100) : 0;
  const pctCotizacion = totalAperturas > 0 ? Math.round((totalCotizacion / totalAperturas) * 100) : 0;
  const pctMasInfo = totalAperturas > 0 ? Math.round((totalMasInfo / totalAperturas) * 100) : 0;
  const funnelChart = [
    { name: "Abrieron Athena", value: totalAperturas, color: GOLD },
    { name: "Reserva Rápida", value: totalReservaRapida, color: "#4ade80" },
    { name: "Cotización", value: totalCotizacion, color: "#60a5fa" },
    { name: "Más Info", value: totalMasInfo, color: "#c084fc" },
  ];

  // Reservas
  const reservasFiltradas = filtroReserva === "todas" ? reservas : reservas.filter(r => r.estado === filtroReserva);
  const hoyStr = new Date().toISOString().split("T")[0];
  const reservasHoy = reservas.filter(r => r.created_at && r.created_at.startsWith(hoyStr));
  const reservasPendientes = reservas.filter(r => r.estado === "pendiente");
  const reservasConfirmadas = reservas.filter(r => r.estado === "confirmada");
  const personasTotal = reservasFiltradas.reduce((sum, r) => sum + (r.personas || 0), 0);

  const getEstadoReservaBadge = (estado: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      pendiente: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
      confirmada: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
      llego: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
      cancelada: { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
      no_show: { bg: "rgba(156,163,175,0.15)", color: "#9ca3af" },
    };
    return styles[estado] || styles.pendiente;
  };

  const getFuenteLabel = (fuente: string) => {
    const labels: Record<string, string> = {
      reserva_rapida: "Reserva Rápida",
      cotizacion: "Cotización",
    };
    return labels[fuente] || fuente;
  };

  const COLORS = [GOLD, "#d4b483", "#b8924a", "#8a6d35", "#5c4820"];

  const getTemperaturaColor = (score: number) => {
    if (score >= 7) return "#4ade80";
    if (score >= 4) return "#fbbf24";
    return "rgba(245,240,232,0.3)";
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      pendiente: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
      contactado: { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" },
      cerrado: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
      perdido: { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
    };
    return styles[estado] || styles.pendiente;
  };

  // Reviews
  const totalReviews = reviews.length;
  const promedioRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews)
    : 0;

  const distribucionRating = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter(r => r.rating === star).length;
    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    return { star, count, pct };
  });

  const reviewsNegativos = reviews.filter(r => r.rating <= 3 && r.comentario);
  const codigosUsados = reviews.filter(r => r.usado).length;
  const codigosPendientes = reviews.filter(r => !r.usado).length;

  if (!authenticated) {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: DARK,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", boxSizing: "border-box",
      }}>
        <div style={{
          background: NAVY, border: "1px solid rgba(201,169,110,0.2)",
          borderRadius: "20px", padding: "48px 32px", width: "100%", maxWidth: "360px",
          display: "flex", flexDirection: "column", gap: "24px", alignItems: "center",
        }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "50%", background: GOLD,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", fontFamily: "Georgia, serif", color: NAVY, fontWeight: "700",
          }}>A</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "600" }}>
              Atheneum Intelligence
            </div>
            <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "13px", marginTop: "6px" }}>
              Acceso restringido al equipo
            </div>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Contraseña"
            style={{
              width: "100%", padding: "14px 18px", borderRadius: "12px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(201,169,110,0.25)",
              color: "#f5f0e8", fontSize: "15px", outline: "none", boxSizing: "border-box",
            }}
          />
          {authError && <div style={{ color: "#f87171", fontSize: "13px" }}>{authError}</div>}
          <button
            onClick={handleLogin}
            style={{
              width: "100%", padding: "14px", borderRadius: "12px",
              background: GOLD, border: "none", color: NAVY,
              fontSize: "14px", fontWeight: "700", letterSpacing: "0.1em", cursor: "pointer",
            }}
          >
            ENTRAR
          </button>
          <div style={{ color: "rgba(245,240,232,0.2)", fontSize: "11px", letterSpacing: "0.05em", textAlign: "center" }}>
            ATHENEUM · WORLD TRADE CENTER · QUITO
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: DARK, color: "#f5f0e8" }}>

      <div style={{
        padding: "16px 20px", borderBottom: "1px solid rgba(201,169,110,0.15)",
        background: NAVY, display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "50%", background: GOLD,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: NAVY, fontWeight: "700", fontSize: "16px", fontFamily: "Georgia, serif",
          }}>A</div>
          <div>
            <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600" }}>
              Atheneum Intelligence
            </div>
            <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px" }}>
              Dashboard en tiempo real
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            { key: "command", label: "COMMAND" },
            { key: "leads", label: "LEADS" },
            { key: "reservas", label: "RESERVAS" },
            { key: "inteligencia", label: "INTELIGENCIA" },
            { key: "funnel", label: "FUNNEL" },
            { key: "reviews", label: "REVIEWS" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 14px", borderRadius: "10px", border: "none",
                background: activeTab === tab.key ? GOLD : "rgba(255,255,255,0.05)",
                color: activeTab === tab.key ? NAVY : "rgba(245,240,232,0.5)",
                fontSize: "11px", fontWeight: "600", letterSpacing: "0.06em", cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ color: "rgba(245,240,232,0.3)", fontSize: "11px" }}>
          🟢 En vivo
        </div>
      </div>

      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto", boxSizing: "border-box" }}>

        {activeTab === "command" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{
              background: NAVY, border: `1px solid ${GOLD}`,
              borderRadius: "16px", padding: "20px 24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: insights.length > 0 ? "16px" : "0" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em" }}>
                  💡 INSIGHTS INTELIGENTES
                </div>
                <button
                  onClick={generarInsights}
                  disabled={loadingInsights}
                  style={{
                    padding: "8px 16px", borderRadius: "10px", border: "none",
                    background: GOLD, color: NAVY,
                    fontSize: "11px", fontWeight: "700", letterSpacing: "0.06em",
                    cursor: loadingInsights ? "default" : "pointer",
                    opacity: loadingInsights ? 0.6 : 1,
                  }}
                >
                  {loadingInsights ? "ANALIZANDO..." : "GENERAR ANALISIS"}
                </button>
              </div>
              {insights.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {insights.map((ins, idx) => (
                    <div key={idx} style={{
                      display: "flex", gap: "14px", alignItems: "flex-start",
                      background: "rgba(201,169,110,0.05)", borderRadius: "12px", padding: "14px 16px",
                    }}>
                      <div style={{ fontSize: "20px", flexShrink: 0 }}>{ins.icono}</div>
                      <div>
                        <div style={{ color: "#f5f0e8", fontSize: "13px", fontWeight: "700" }}>{ins.titulo}</div>
                        <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "12px", marginTop: "4px", lineHeight: "1.5" }}>
                          {ins.detalle}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              background: "rgba(201,169,110,0.05)", border: `1px solid rgba(201,169,110,0.2)`,
              borderRadius: "16px", padding: "20px 24px",
            }}>
              <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>
                ESTA SEMANA
              </div>
              <div style={{ display: "flex", gap: "28px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ color: "#f5f0e8", fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                      {leadsEstaSemana.length}
                    </span>
                    <span style={{
                      color: diferenciaLeads >= 0 ? "#4ade80" : "#f87171",
                      fontSize: "12px", fontWeight: "600",
                    }}>
                      {diferenciaLeads >= 0 ? "+" : ""}{diferenciaLeads} vs semana pasada
                    </span>
                  </div>
                  <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", marginTop: "4px" }}>Leads nuevos</div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ color: "#f5f0e8", fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                      ${pipelineEstaSemana.toLocaleString()}
                    </span>
                    <span style={{
                      color: diferenciaPipeline >= 0 ? "#4ade80" : "#f87171",
                      fontSize: "12px", fontWeight: "600",
                    }}>
                      {diferenciaPipeline >= 0 ? "+" : ""}${diferenciaPipeline.toLocaleString()} vs semana pasada
                    </span>
                  </div>
                  <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", marginTop: "4px" }}>Pipeline generado</div>
                </div>
                <div>
                  <div style={{ color: "#f5f0e8", fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                    {formatTiempo(tiempoRespuestaPromedio)}
                  </div>
                  <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", marginTop: "4px" }}>Tiempo de respuesta promedio</div>
                </div>
              </div>
            </div>

            {leadsCalientes.length > 0 && (
              <div style={{
                background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)",
                borderRadius: "16px", padding: "18px 22px",
                display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
              }}>
                <div style={{ fontSize: "26px" }}>🔥</div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ color: "#4ade80", fontWeight: "700", fontSize: "15px" }}>
                    {leadsCalientes.length} lead{leadsCalientes.length > 1 ? "s" : ""} caliente{leadsCalientes.length > 1 ? "s" : ""} sin contactar
                  </div>
                  <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "13px", marginTop: "4px" }}>
                    {leadsCalientes.map(l => l.nombre).join(", ")} — responde ahora
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab("leads"); setFiltroEstado("pendiente"); }}
                  style={{
                    padding: "10px 18px", borderRadius: "10px",
                    background: "#4ade80", border: "none", color: NAVY,
                    fontSize: "12px", fontWeight: "700", cursor: "pointer",
                  }}
                >
                  VER LEADS →
                </button>
              </div>
            )}

            {reservasPendientes.length > 0 && (
              <div style={{
                background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.3)",
                borderRadius: "16px", padding: "18px 22px",
                display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap",
              }}>
                <div style={{ fontSize: "26px" }}>📖</div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ color: "#60a5fa", fontWeight: "700", fontSize: "15px" }}>
                    {reservasPendientes.length} reserva{reservasPendientes.length > 1 ? "s" : ""} pendiente{reservasPendientes.length > 1 ? "s" : ""} de confirmar
                  </div>
                  <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "13px", marginTop: "4px" }}>
                    {reservasPendientes.slice(0, 3).map(r => r.nombre).join(", ")}{reservasPendientes.length > 3 ? "..." : ""}
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab("reservas"); setFiltroReserva("pendiente"); }}
                  style={{
                    padding: "10px 18px", borderRadius: "10px",
                    background: "#60a5fa", border: "none", color: NAVY,
                    fontSize: "12px", fontWeight: "700", cursor: "pointer",
                  }}
                >
                  VER RESERVAS →
                </button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              {[
                { label: "Pipeline Total", value: `$${totalPipeline.toLocaleString()}`, sub: "Valor total capturado", icon: "💰", color: GOLD },
                { label: "Valor Cerrado", value: `$${valorCerrado.toLocaleString()}`, sub: `${leadsCerrados.length} negocios cerrados`, icon: "✅", color: "#4ade80" },
                { label: "Tasa Conversión", value: `${tasaConversion}%`, sub: "Leads cerrados sobre capturados", icon: "📈", color: "#60a5fa" },
                { label: "Ticket Promedio", value: `$${ticketPromedio.toLocaleString()}`, sub: "Por lead capturado", icon: "🎯", color: "#c084fc" },
              ].map((kpi, idx) => (
                <div key={idx} style={{
                  background: NAVY, border: "1px solid rgba(201,169,110,0.15)",
                  borderRadius: "16px", padding: "20px",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "10px" }}>{kpi.icon}</div>
                  <div style={{ color: kpi.color, fontSize: "28px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                    {kpi.value}
                  </div>
                  <div style={{ color: "#f5f0e8", fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>{kpi.label}</div>
                  <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", marginTop: "4px" }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[
                { label: "Total Conversaciones", value: conversaciones.length, icon: "💬" },
                { label: "Leads Capturados", value: leads.length, icon: "👤" },
                { label: "Pendientes", value: leadsPendientes.length, icon: "⏳" },
                { label: "Leads Calientes", value: leadsCalientes.length, icon: "🔥" },
              ].map((kpi, idx) => (
                <div key={idx} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,169,110,0.1)",
                  borderRadius: "16px", padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  <div style={{ fontSize: "24px" }}>{kpi.icon}</div>
                  <div>
                    <div style={{ color: GOLD, fontSize: "24px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                      {kpi.value}
                    </div>
                    <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px" }}>{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
              <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>TOP INDUSTRIAS</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={industriaChart}>
                    <XAxis dataKey="name" tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 10 }} />
                    <YAxis tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: "8px" }} />
                    <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>TIPO DE SOLICITUD</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tipoChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {tipoChart.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "leads" && (
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em" }}>
                  {leadsFiltrados.length} LEADS
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                  {[
                    { key: "pendiente", label: "PENDIENTES" },
                    { key: "contactado", label: "CONTACTADOS" },
                    { key: "cerrado", label: "CERRADOS" },
                    { key: "perdido", label: "PERDIDOS" },
                    { key: "todos", label: "TODOS" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFiltroEstado(f.key)}
                      style={{
                        padding: "6px 12px", borderRadius: "20px", border: "none",
                        background: filtroEstado === f.key ? GOLD : "rgba(255,255,255,0.05)",
                        color: filtroEstado === f.key ? NAVY : "rgba(245,240,232,0.4)",
                        fontSize: "10px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.06em",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                  <button
                    onClick={exportarCSV}
                    style={{
                      padding: "6px 12px", borderRadius: "20px",
                      border: `1px solid ${GOLD}`,
                      background: "transparent", color: GOLD,
                      fontSize: "10px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.06em",
                    }}
                  >
                    ↓ CSV
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {leadsFiltrados.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => {
                      setSelectedLead(lead);
                      fetchMensajes(lead.conversacion_id);
                    }}
                    style={{
                      background: selectedLead?.id === lead.id ? "rgba(201,169,110,0.08)" : NAVY,
                      border: selectedLead?.id === lead.id ? `1px solid ${GOLD}` : "1px solid rgba(201,169,110,0.15)",
                      borderRadius: "14px", padding: "16px 18px",
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap",
                    }}
                  >
                    <div style={{
                      width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0,
                      background: getTemperaturaColor(lead.score || 0),
                      boxShadow: `0 0 8px ${getTemperaturaColor(lead.score || 0)}`,
                    }} />
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                        <span style={{ color: "#f5f0e8", fontWeight: "600", fontSize: "14px" }}>{lead.nombre}</span>
                        <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px" }}>{lead.empresa}</span>
                        {lead.industria && lead.industria !== "No especificado" && (
                          <span style={{
                            background: "rgba(201,169,110,0.1)", color: GOLD,
                            fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                          }}>{normalizeIndustria(lead.industria)}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "12px", color: "rgba(245,240,232,0.4)", fontSize: "11px", flexWrap: "wrap" }}>
                        <span>📍 {lead.ciudad ? normalizeCiudad(lead.ciudad) : "—"}</span>
                        <span>🎯 {lead.tipo}</span>
                        <span>📅 {lead.fecha_evento || "—"}</span>
                        <span>Score: {lead.score || 0}/10</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "700" }}>
                        ${(lead.valor_potencial || 0).toLocaleString()}
                      </div>
                      <div style={{
                        background: getEstadoBadge(lead.estado).bg,
                        color: getEstadoBadge(lead.estado).color,
                        fontSize: "10px", padding: "3px 8px", borderRadius: "20px",
                        marginTop: "6px", display: "inline-block", fontWeight: "600",
                      }}>
                        {lead.estado?.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
                {leadsFiltrados.length === 0 && (
                  <div style={{ textAlign: "center", padding: "50px", color: "rgba(245,240,232,0.3)", fontSize: "14px" }}>
                    No hay leads con este estado
                  </div>
                )}
              </div>
            </div>

            {selectedLead && (
              <div style={{
                width: "100%", maxWidth: "380px", background: NAVY,
                border: "1px solid rgba(201,169,110,0.2)", borderRadius: "16px",
                padding: "20px", display: "flex", flexDirection: "column", gap: "18px",
                maxHeight: "80vh", overflowY: "auto",
              }}>
                <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "17px", fontWeight: "600" }}>
                  {selectedLead.nombre}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "Empresa", value: selectedLead.empresa },
                    { label: "Industria", value: selectedLead.industria ? normalizeIndustria(selectedLead.industria) : "—" },
                    { label: "Ciudad", value: selectedLead.ciudad ? normalizeCiudad(selectedLead.ciudad) : "—" },
                    { label: "WhatsApp", value: selectedLead.whatsapp },
                    { label: "Email", value: selectedLead.email },
                    { label: "Tipo", value: selectedLead.tipo },
                    { label: "Fecha evento", value: selectedLead.fecha_evento },
                    { label: "Opción elegida", value: selectedLead.opcion_elegida },
                    { label: "Valor", value: `$${(selectedLead.valor_potencial || 0).toLocaleString()}` },
                    { label: "Score", value: `${selectedLead.score || 0}/10` },
                    { label: "Contactado en", value: selectedLead.fecha_contactado && selectedLead.fecha_creacion
                        ? formatTiempo(new Date(selectedLead.fecha_contactado).getTime() - new Date(selectedLead.fecha_creacion).getTime())
                        : "—" },
                  ].map((item, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "rgba(245,240,232,0.4)" }}>{item.label}</span>
                      <span style={{ color: "#f5f0e8", fontWeight: "500", maxWidth: "190px", textAlign: "right" }}>
                        {item.value || "—"}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => window.open(`https://wa.me/593${selectedLead.whatsapp?.replace(/^0/, "")}`, "_blank")}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "10px",
                      background: "#25D366", border: "none", color: "white",
                      fontSize: "12px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.05em",
                    }}
                  >
                    📱 ABRIR WHATSAPP
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {["contactado", "cerrado", "pendiente", "perdido"].map((estado) => (
                      <button
                        key={estado}
                        onClick={() => updateEstado(selectedLead.id, estado)}
                        disabled={updatingEstado === selectedLead.id}
                        style={{
                          padding: "10px", borderRadius: "10px", border: "none",
                          background: selectedLead.estado === estado
                            ? getEstadoBadge(estado).bg
                            : "rgba(255,255,255,0.05)",
                          color: selectedLead.estado === estado
                            ? getEstadoBadge(estado).color
                            : "rgba(245,240,232,0.4)",
                          fontSize: "10px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.05em",
                        }}
                      >
                        {estado.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ color: GOLD, fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "10px" }}>
                    CONVERSACIÓN CON ATHENA
                  </div>
                  {loadingMensajes ? (
                    <div style={{ color: "rgba(245,240,232,0.3)", fontSize: "12px" }}>Cargando...</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {mensajes.map((msg) => (
                        <div key={msg.id} style={{
                          padding: "10px 12px", borderRadius: "10px", fontSize: "11px", lineHeight: "1.5",
                          background: msg.rol === "user" ? "rgba(201,169,110,0.1)" : "rgba(255,255,255,0.04)",
                          color: msg.rol === "user" ? GOLD : "rgba(245,240,232,0.7)",
                          alignSelf: msg.rol === "user" ? "flex-end" : "flex-start",
                          maxWidth: "90%",
                        }}>
                          {msg.contenido}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "reservas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[
                { label: "Reservas Hoy", value: reservasHoy.length, sub: "Registradas hoy", icon: "📅", color: GOLD },
                { label: "Pendientes", value: reservasPendientes.length, sub: "Por confirmar", icon: "⏳", color: "#fbbf24" },
                { label: "Confirmadas", value: reservasConfirmadas.length, sub: "Ya confirmadas por el equipo", icon: "✅", color: "#4ade80" },
                { label: "Total Personas", value: personasTotal, sub: "En la vista actual", icon: "👥", color: "#60a5fa" },
              ].map((kpi, idx) => (
                <div key={idx} style={{
                  background: NAVY, border: "1px solid rgba(201,169,110,0.15)",
                  borderRadius: "16px", padding: "20px",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "10px" }}>{kpi.icon}</div>
                  <div style={{ color: kpi.color, fontSize: "28px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                    {kpi.value}
                  </div>
                  <div style={{ color: "#f5f0e8", fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>{kpi.label}</div>
                  <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", marginTop: "4px" }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em" }}>
                LIBRO DE RESERVAS · {reservasFiltradas.length}
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { key: "pendiente", label: "PENDIENTES" },
                  { key: "confirmada", label: "CONFIRMADAS" },
                  { key: "llego", label: "LLEGARON" },
                  { key: "cancelada", label: "CANCELADAS" },
                  { key: "no_show", label: "NO-SHOW" },
                  { key: "todas", label: "TODAS" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFiltroReserva(f.key)}
                    style={{
                      padding: "6px 12px", borderRadius: "20px", border: "none",
                      background: filtroReserva === f.key ? GOLD : "rgba(255,255,255,0.05)",
                      color: filtroReserva === f.key ? NAVY : "rgba(245,240,232,0.4)",
                      fontSize: "10px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.06em",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {reservasFiltradas.map((r) => (
                  <div key={r.id} onClick={() => setSelectedReserva(r)} style={{
                    background: selectedReserva?.id === r.id ? "rgba(201,169,110,0.08)" : NAVY,
                    border: selectedReserva?.id === r.id ? `1px solid ${GOLD}` : "1px solid rgba(201,169,110,0.15)",
                    borderRadius: "14px", padding: "16px 18px",
                    display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap",
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <div style={{ minWidth: "90px" }}>
                      <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "15px", fontWeight: "700" }}>
                        {r.hora || "—"}
                      </div>
                      <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", marginTop: "2px" }}>
                        {r.fecha || "—"}
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <span style={{ color: "#f5f0e8", fontWeight: "600", fontSize: "14px" }}>{r.nombre || "Sin nombre"}</span>
                        <span style={{
                          background: "rgba(201,169,110,0.1)", color: GOLD,
                          fontSize: "10px", padding: "2px 8px", borderRadius: "20px",
                        }}>{getFuenteLabel(r.fuente)}</span>
                      </div>
                      <div style={{ display: "flex", gap: "12px", color: "rgba(245,240,232,0.4)", fontSize: "11px", flexWrap: "wrap" }}>
                        <span>👥 {r.personas || "—"} personas</span>
                        {r.tipo && <span>🎯 {r.tipo}</span>}
                        {r.preferencia && <span>📍 {r.preferencia}</span>}
                      </div>
                      {r.nota && (
                        <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "11px", marginTop: "6px", fontStyle: "italic" }}>
                          {r.nota}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{
                        background: getEstadoReservaBadge(r.estado).bg,
                        color: getEstadoReservaBadge(r.estado).color,
                        fontSize: "10px", padding: "3px 10px", borderRadius: "20px",
                        fontWeight: "600",
                      }}>
                        {r.estado?.toUpperCase()}
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {["confirmada", "llego", "cancelada", "no_show"].map((estado) => (
                          <button
                            key={estado}
                            onClick={() => updateReservaEstado(r.id, estado)}
                            disabled={updatingReserva === r.id}
                            title={estado}
                            style={{
                              width: "26px", height: "26px", borderRadius: "6px", border: "none",
                              background: r.estado === estado ? getEstadoReservaBadge(estado).bg : "rgba(255,255,255,0.05)",
                              color: r.estado === estado ? getEstadoReservaBadge(estado).color : "rgba(245,240,232,0.3)",
                              fontSize: "11px", cursor: "pointer",
                            }}
                          >
                            {estado === "confirmada" ? "✓" : estado === "llego" ? "→" : estado === "cancelada" ? "✕" : "∅"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {reservasFiltradas.length === 0 && (
                  <div style={{ textAlign: "center", padding: "50px", color: "rgba(245,240,232,0.3)", fontSize: "14px", background: NAVY, borderRadius: "16px", border: "1px solid rgba(201,169,110,0.1)" }}>
                    No hay reservas con este estado
                  </div>
                )}
              </div>

              {selectedReserva && (
                <div style={{
                  width: "100%", maxWidth: "380px", background: NAVY,
                  border: "1px solid rgba(201,169,110,0.2)", borderRadius: "16px",
                  padding: "20px", display: "flex", flexDirection: "column", gap: "18px",
                  maxHeight: "80vh", overflowY: "auto",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "17px", fontWeight: "600" }}>
                      {selectedReserva.nombre || "Sin nombre"}
                    </div>
                    <button
                      onClick={() => setSelectedReserva(null)}
                      style={{ background: "transparent", border: "none", color: "rgba(245,240,232,0.4)", cursor: "pointer", fontSize: "18px" }}
                    >✕</button>
                  </div>

                  <div style={{
                    background: getEstadoReservaBadge(selectedReserva.estado).bg,
                    color: getEstadoReservaBadge(selectedReserva.estado).color,
                    fontSize: "11px", padding: "5px 12px", borderRadius: "20px",
                    fontWeight: "600", alignSelf: "flex-start",
                  }}>
                    {selectedReserva.estado?.toUpperCase()}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[
                      { label: "Fecha", value: selectedReserva.fecha },
                      { label: "Hora", value: selectedReserva.hora },
                      { label: "Personas", value: selectedReserva.personas ? String(selectedReserva.personas) : "" },
                      { label: "Tipo", value: selectedReserva.tipo },
                      { label: "Preferencia", value: selectedReserva.preferencia },
                      { label: "Fuente", value: getFuenteLabel(selectedReserva.fuente) },
                      { label: "Registrado", value: selectedReserva.created_at ? new Date(selectedReserva.created_at).toLocaleString("es-EC") : "" },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "rgba(245,240,232,0.4)" }}>{item.label}</span>
                        <span style={{ color: "#f5f0e8", fontWeight: "500", maxWidth: "190px", textAlign: "right" }}>
                          {item.value || "—"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {selectedReserva.nota && (
                    <div style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.2)", borderRadius: "10px", padding: "12px 14px" }}>
                      <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "11px", letterSpacing: "0.08em", marginBottom: "6px" }}>NOTA</div>
                      <div style={{ color: "#f5f0e8", fontSize: "13px", lineHeight: "1.5" }}>{selectedReserva.nota}</div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {["confirmada", "llego", "cancelada", "no_show"].map((estado) => (
                      <button
                        key={estado}
                        onClick={() => {
                          updateReservaEstado(selectedReserva.id, estado);
                          setSelectedReserva({ ...selectedReserva, estado });
                        }}
                        disabled={updatingReserva === selectedReserva.id}
                        style={{
                          padding: "10px", borderRadius: "10px", border: "none",
                          background: selectedReserva.estado === estado ? getEstadoReservaBadge(estado).bg : "rgba(255,255,255,0.05)",
                          color: selectedReserva.estado === estado ? getEstadoReservaBadge(estado).color : "rgba(245,240,232,0.4)",
                          fontSize: "10px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.05em",
                        }}
                      >
                        {estado.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "inteligencia" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
              <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>TOP INDUSTRIAS</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={industriaChart} layout="vertical">
                    <XAxis type="number" tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "rgba(245,240,232,0.5)", fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: "8px" }} />
                    <Bar dataKey="value" fill={GOLD} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>TOP CIUDADES</div>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={ciudadChart} layout="vertical">
                    <XAxis type="number" tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: "rgba(245,240,232,0.5)", fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: "8px" }} />
                    <Bar dataKey="value" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>HORARIO PICO DE CONVERSACIONES</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={horaChart}>
                  <XAxis dataKey="hora" tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 10 }} />
                  <YAxis tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="conversaciones" stroke={GOLD} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "funnel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[
                { label: "Abrieron Athena", value: totalAperturas, sub: "Personas que entraron al link", color: GOLD },
                { label: "Reserva Rápida", value: totalReservaRapida, sub: `${pctReservaRapida}% de las aperturas`, color: "#4ade80" },
                { label: "Cotización", value: totalCotizacion, sub: `${pctCotizacion}% de las aperturas`, color: "#60a5fa" },
                { label: "Más Información", value: totalMasInfo, sub: `${pctMasInfo}% de las aperturas`, color: "#c084fc" },
              ].map((kpi, idx) => (
                <div key={idx} style={{
                  background: NAVY, border: "1px solid rgba(201,169,110,0.15)",
                  borderRadius: "16px", padding: "24px",
                }}>
                  <div style={{ color: kpi.color, fontSize: "36px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                    {kpi.value}
                  </div>
                  <div style={{ color: "#f5f0e8", fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>{kpi.label}</div>
                  <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", marginTop: "4px" }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "28px" }}>
              <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "24px" }}>EMBUDO DE CONVERSIÓN</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {funnelChart.map((item, idx) => {
                  const pct = totalAperturas > 0 ? Math.round((item.value / totalAperturas) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ color: "rgba(245,240,232,0.7)", fontSize: "13px" }}>{item.name}</span>
                        <span style={{ color: item.color, fontSize: "13px", fontWeight: "700" }}>{item.value} ({pct}%)</span>
                      </div>
                      <div style={{ height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: item.color, borderRadius: "6px", transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>DISTRIBUCIÓN POR OPCIÓN</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={funnelChart}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "rgba(245,240,232,0.4)", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: NAVY, border: `1px solid ${GOLD}`, borderRadius: "8px" }}
                    labelStyle={{ color: "#f5f0e8", fontSize: "12px" }}
                    itemStyle={{ color: GOLD, fontSize: "12px" }}
                    cursor={{ fill: "rgba(201,169,110,0.08)" }}
                    formatter={(value) => [String(value), ""]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {funnelChart.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {totalAperturas === 0 && (
              <div style={{ textAlign: "center", padding: "60px", color: "rgba(245,240,232,0.3)", fontSize: "14px", background: NAVY, borderRadius: "16px", border: "1px solid rgba(201,169,110,0.1)" }}>
                Aún no hay datos de funnel. Los eventos se registran cuando los usuarios interactúan con Athena.
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
              {[
                { label: "Total Reviews", value: totalReviews, sub: "Personas que dejaron opinion", icon: "📝", color: GOLD },
                { label: "Promedio", value: totalReviews > 0 ? promedioRating.toFixed(1) : "—", sub: "Calificacion promedio", icon: "⭐", color: "#4ade80" },
                { label: "Codigos Pendientes", value: codigosPendientes, sub: "Cafes gratis por canjear", icon: "☕", color: "#60a5fa" },
                { label: "Codigos Usados", value: codigosUsados, sub: "Cafes ya canjeados", icon: "✅", color: "#c084fc" },
              ].map((kpi, idx) => (
                <div key={idx} style={{
                  background: NAVY, border: "1px solid rgba(201,169,110,0.15)",
                  borderRadius: "16px", padding: "20px",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "10px" }}>{kpi.icon}</div>
                  <div style={{ color: kpi.color, fontSize: "28px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
                    {kpi.value}
                  </div>
                  <div style={{ color: "#f5f0e8", fontSize: "13px", fontWeight: "600", marginTop: "8px" }}>{kpi.label}</div>
                  <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", marginTop: "4px" }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
              <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>
                  DISTRIBUCION DE ESTRELLAS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {distribucionRating.map((d) => (
                    <div key={d.star} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ color: GOLD, fontSize: "12px", fontWeight: "600", width: "36px" }}>
                        {d.star} ★
                      </div>
                      <div style={{ flex: 1, height: "10px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", overflow: "hidden" }}>
                        <div style={{
                          width: `${d.pct}%`, height: "100%",
                          background: d.star >= 4 ? "#4ade80" : d.star === 3 ? "#fbbf24" : "#f87171",
                          borderRadius: "6px",
                        }} />
                      </div>
                      <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "11px", width: "65px", textAlign: "right" }}>
                        {d.count} ({d.pct}%)
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>
                  COMENTARIOS - QUE PODEMOS MEJORAR ({reviewsNegativos.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                  {reviewsNegativos.map((r) => (
                    <div key={r.id} style={{
                      background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)",
                      borderRadius: "12px", padding: "12px 14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <div style={{ color: "#f87171", fontSize: "12px", fontWeight: "700" }}>
                          {String.fromCharCode(9733).repeat(r.rating)}
                          {String.fromCharCode(9734).repeat(5 - r.rating)}
                        </div>
                        <div style={{ color: "rgba(245,240,232,0.3)", fontSize: "10px" }}>
                          {r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString("es-EC") : ""}
                        </div>
                      </div>
                      <div style={{ color: "rgba(245,240,232,0.7)", fontSize: "12px", lineHeight: "1.5" }}>
                        {r.comentario}
                      </div>
                      {r.email && (
                        <div style={{ color: "rgba(245,240,232,0.3)", fontSize: "10px", marginTop: "6px" }}>
                          {r.email}
                        </div>
                      )}
                    </div>
                  ))}
                  {reviewsNegativos.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px", color: "rgba(245,240,232,0.3)", fontSize: "12px" }}>
                      No hay comentarios negativos
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: NAVY, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "16px", padding: "20px" }}>
              <div style={{ color: GOLD, fontSize: "13px", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "16px" }}>
                CODIGOS DE CAFE GRATIS ({reviews.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.03)", flexWrap: "wrap", gap: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                      <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: "700" }}>
                        {r.codigo_cafe}
                      </div>
                      <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px" }}>
                        {String.fromCharCode(9733).repeat(r.rating)}
                      </div>
                      <div style={{ color: "rgba(245,240,232,0.3)", fontSize: "11px" }}>
                        {r.cedula_ruc}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUsado(r.id, r.usado)}
                      style={{
                        fontSize: "10px", padding: "6px 12px", borderRadius: "20px", fontWeight: "600",
                        border: "none", cursor: "pointer",
                        background: r.usado ? "rgba(74,222,128,0.15)" : "rgba(251,191,36,0.15)",
                        color: r.usado ? "#4ade80" : "#fbbf24",
                      }}
                    >
                      {r.usado ? "USADO ✓" : "MARCAR USADO"}
                    </button>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px", color: "rgba(245,240,232,0.3)", fontSize: "12px" }}>
                    No hay codigos generados aun
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}