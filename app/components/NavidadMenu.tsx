"use client";

import React, { useEffect, useState } from "react";

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

type Props = {
  onVolver: () => void;
  onEvento: (evento: string) => void;
};

export default function NavidadMenu({ onVolver, onEvento }: Props) {
  const [abierta, setAbierta] = useState<number | null>(null);
  const [elegida, setElegida] = useState<number | null>(null);
  const [personas, setPersonas] = useState<number>(10);

  useEffect(() => {
    onEvento("navidad_vista");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                Atheneum abre de lunes a viernes, por eso las fechas de diciembre son pocas y exclusivas. Cuéntenos su número de invitados y le preparamos su propuesta.
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
                onClick={abrirWhatsApp}
                disabled={!opcionElegida}
                style={{
                  width: "100%", background: opcionElegida ? "#25D366" : "rgba(37,211,102,0.25)",
                  color: "#06210f", border: "none", borderRadius: "12px", padding: "15px",
                  fontSize: "14px", fontWeight: 700, cursor: opcionElegida ? "pointer" : "default",
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