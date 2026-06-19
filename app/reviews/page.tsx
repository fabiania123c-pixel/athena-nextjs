"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GOLD = "#c9a96e";
const NAVY = "#0a1628";
const DARK = "#080c12";

const REVIEW_LINK = "https://www.google.com/search?q=ATHENEUM+QUITO+reviews#lrd=0x91d59b00754f2265:0x4b86cf22b9655876,3,,,,";

type Step = "rating" | "feedback" | "confirmar-review" | "cedula" | "codigo" | "ya-participo" | "error";

export default function Reviews() {
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [email, setEmail] = useState("");
  const [cedula, setCedula] = useState("");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRating = (value: number) => {
    setRating(value);
    if (value >= 4) {
      setStep("confirmar-review");
    } else {
      setStep("feedback");
    }
  };

  const handleFeedbackSubmit = () => {
    if (!comentario.trim()) {
      setErrorMsg("Por favor cuentanos que podemos mejorar");
      return;
    }
    setErrorMsg("");
    setStep("cedula");
  };

  const generarCodigo = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return "ATH-" + random;
  };

  const handleCedulaSubmit = async () => {
    const cleanCedula = cedula.trim();
    if (cleanCedula.length < 9 || cleanCedula.length > 13 || !/^[0-9]+$/.test(cleanCedula)) {
      setErrorMsg("Ingresa una cedula o RUC valido");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const existResult = await supabase
        .from("reviews")
        .select("id")
        .eq("cedula_ruc", cleanCedula)
        .maybeSingle();

      const existente = existResult.data;

      if (existente) {
        setStep("ya-participo");
        setLoading(false);
        return;
      }

      const nuevoCodigo = generarCodigo();

      const insertResult = await supabase.from("reviews").insert({
        rating: rating,
        comentario: comentario || null,
        email: email || null,
        cedula_ruc: cleanCedula,
        codigo_cafe: nuevoCodigo,
        usado: false,
      });

      if (insertResult.error) {
        console.error(insertResult.error);
        setStep("error");
        setLoading(false);
        return;
      }

      setCodigo(nuevoCodigo);
      setStep("codigo");
    } catch (e) {
      console.error(e);
      setStep("error");
    }
    setLoading(false);
  };

  const renderStars = () => {
    return (
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        {[1, 2, 3, 4, 5].map(function(star) {
          const isFilled = (hoverRating || rating) >= star;
          return (
            <button
              key={star}
              onClick={function() { handleRating(star); }}
              onMouseEnter={function() { setHoverRating(star); }}
              onMouseLeave={function() { setHoverRating(0); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "44px",
                lineHeight: 1,
                padding: "4px",
                color: isFilled ? GOLD : "rgba(245,240,232,0.2)",
                transition: "color 0.15s, transform 0.1s",
                transform: isFilled ? "scale(1.08)" : "scale(1)",
              }}
            >
              {String.fromCharCode(9733)}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      width: "100vw",
      minHeight: "100vh",
      background: DARK,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      boxSizing: "border-box",
    }}>
      <div style={{
        background: NAVY,
        border: "1px solid rgba(201,169,110,0.2)",
        borderRadius: "20px",
        padding: "40px 32px",
        width: "100%",
        maxWidth: "400px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        alignItems: "center",
        textAlign: "center",
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: GOLD,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          fontFamily: "Georgia, serif",
          color: NAVY,
          fontWeight: "700",
        }}>A</div>

        {step === "rating" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
            <div>
              <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "600" }}>
                Atheneum
              </div>
              <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "15px", marginTop: "8px" }}>
                Como fue tu experiencia hoy?
              </div>
            </div>
            {renderStars()}
          </div>
        ) : null}

        {step === "feedback" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            <div>
              <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "600" }}>
                Gracias por tu honestidad
              </div>
              <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px", marginTop: "8px" }}>
                Que podemos mejorar?
              </div>
            </div>
            <textarea
              value={comentario}
              onChange={function(e) { setComentario(e.target.value); }}
              placeholder="Cuentanos tu experiencia..."
              rows={4}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,169,110,0.25)",
                color: "#f5f0e8",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                resize: "none",
                fontFamily: "inherit",
              }}
            />
            <input
              type="email"
              value={email}
              onChange={function(e) { setEmail(e.target.value); }}
              placeholder="Tu correo (opcional)"
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,169,110,0.25)",
                color: "#f5f0e8",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {errorMsg ? <div style={{ color: "#f87171", fontSize: "13px" }}>{errorMsg}</div> : null}
            <button
              onClick={handleFeedbackSubmit}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                background: GOLD,
                border: "none",
                color: NAVY,
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              ENVIAR
            </button>
          </div>
        ) : null}

        {step === "confirmar-review" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            <div>
              <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "600" }}>
                Nos alegra mucho!
              </div>
              <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px", marginTop: "8px" }}>
                Comparte tu experiencia en Google para recibir tu cafe gratis
              </div>
            </div>
            <a href={REVIEW_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                background: GOLD,
                color: NAVY,
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                textAlign: "center",
                textDecoration: "none",
                boxSizing: "border-box",
              }}
            >
              DEJAR RESENA EN GOOGLE
            </a>
            <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px" }}>
              Se abre en una pestana nueva
            </div>
            <div style={{ height: "1px", background: "rgba(201,169,110,0.15)", width: "100%" }}></div>
            <button
              onClick={function() { setStep("cedula"); }}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,169,110,0.3)",
                color: GOLD,
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                cursor: "pointer",
              }}
            >
              YA DEJE MI RESENA - CONTINUAR
            </button>
          </div>
        ) : null}

        {step === "cedula" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            <div>
              <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600" }}>
                Tu cafe gratis
              </div>
              <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "13px", marginTop: "8px" }}>
                Ingresa tu cedula o RUC para generar tu codigo
              </div>
            </div>
            <input
              type="text"
              value={cedula}
              onChange={function(e) { setCedula(e.target.value.replace(/[^0-9]/g, "")); }}
              placeholder="Cedula o RUC"
              maxLength={13}
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(201,169,110,0.25)",
                color: "#f5f0e8",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box",
                textAlign: "center",
                letterSpacing: "0.05em",
              }}
            />
            {errorMsg ? <div style={{ color: "#f87171", fontSize: "13px" }}>{errorMsg}</div> : null}
            <button
              onClick={handleCedulaSubmit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                background: GOLD,
                border: "none",
                color: NAVY,
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "0.08em",
                cursor: loading ? "default" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "PROCESANDO..." : "OBTENER CODIGO"}
            </button>
          </div>
        ) : null}

        {step === "codigo" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
            <div>
              <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "600" }}>
                Listo!
              </div>
              <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px", marginTop: "8px" }}>
                Muestra este codigo en tu proxima visita para tu cafe gratis
              </div>
            </div>
            <div style={{
              width: "100%",
              padding: "24px",
              borderRadius: "14px",
              background: "rgba(201,169,110,0.08)",
              border: "2px solid " + GOLD,
            }}>
              <div style={{
                color: GOLD,
                fontFamily: "Georgia, serif",
                fontSize: "32px",
                fontWeight: "700",
                letterSpacing: "0.1em",
              }}>
                {codigo}
              </div>
            </div>
            <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px" }}>
              Gracias por ser parte de Atheneum
            </div>
          </div>
        ) : null}

        {step === "ya-participo" ? (
          <div>
            <div style={{ color: GOLD, fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "600" }}>
              Ya eres parte de Atheneum!
            </div>
            <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px", marginTop: "12px" }}>
              Ya recibiste tu cafe gratis con nosotros anteriormente. Gracias por tu visita y por seguir confiando en Atheneum!
            </div>
          </div>
        ) : null}

        {step === "error" ? (
          <div>
            <div style={{ color: "#f87171", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600" }}>
              Algo salio mal
            </div>
            <div style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px", marginTop: "8px" }}>
              Por favor intenta de nuevo mas tarde, o avisa al equipo de Atheneum.
            </div>
          </div>
        ) : null}

        <div style={{ color: "rgba(245,240,232,0.2)", fontSize: "10px", letterSpacing: "0.05em" }}>
          ATHENEUM - WORLD TRADE CENTER - QUITO
        </div>
      </div>
    </div>
  );
}