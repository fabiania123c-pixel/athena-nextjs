"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  hidden?: boolean;
  quote?: QuoteData;
  opciones?: string[];
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

function generateId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function QuoteCard({
  opcion,
  numero,
  onSelect,
}: {
  opcion: QuoteOption;
  numero: number;
  onSelect: () => void;
}) {
  const isRecommended = numero === 2;

  return (
    <div
      style={{
        background: isRecommended
          ? "rgba(201,169,110,0.08)"
          : "rgba(255,255,255,0.04)",
        border: isRecommended
          ? "1px solid rgba(201,169,110,0.5)"
          : "1px solid rgba(201,169,110,0.2)",
        borderRadius: "20px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        flex: 1,
        minWidth: "260px",
        position: "relative",
      }}
    >
      {isRecommended && (
        <div
          style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#c9a96e",
            color: "#0a1628",
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.15em",
            padding: "4px 14px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
          }}
        >
          RECOMENDADA
        </div>
      )}

      <div>
        <div
          style={{
            color: isRecommended ? "#c9a96e" : "rgba(201,169,110,0.6)",
            fontSize: "10px",
            letterSpacing: "0.2em",
            fontWeight: "700",
            marginBottom: "8px",
          }}
        >
          OPCIÓN {numero}
        </div>
        <div
          style={{
            color: "#f5f0e8",
            fontFamily: "Georgia, serif",
            fontSize: "20px",
            fontWeight: "600",
            lineHeight: "1.3",
          }}
        >
          {opcion.titulo}
        </div>
        <div
          style={{
            color: "rgba(245,240,232,0.45)",
            fontSize: "13px",
            marginTop: "8px",
            lineHeight: "1.5",
          }}
        >
          {opcion.descripcion}
        </div>
      </div>

      <div style={{ height: "1px", background: "rgba(201,169,110,0.15)" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {opcion.items.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "rgba(245,240,232,0.65)", fontSize: "14px" }}>
              {item.concepto}
            </span>
            <span style={{ color: "#f5f0e8", fontSize: "14px", fontWeight: "500" }}>
              ${item.precio}
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: "1px", background: "rgba(201,169,110,0.15)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#c9a96e", fontSize: "13px", fontWeight: "700", letterSpacing: "0.1em" }}>
          TOTAL + IVA
        </span>
        <span style={{ color: "#c9a96e", fontSize: "26px", fontFamily: "Georgia, serif", fontWeight: "700" }}>
          ${opcion.total}
        </span>
      </div>

      <div style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", fontStyle: "italic", lineHeight: "1.6", minHeight: "36px" }}>
        {opcion.nota}
      </div>

      <button
        onClick={onSelect}
        style={{
          width: "100%",
          padding: "15px",
          borderRadius: "12px",
          background: isRecommended ? "#c9a96e" : "transparent",
          border: isRecommended ? "none" : "1px solid rgba(201,169,110,0.5)",
          color: isRecommended ? "#0a1628" : "#c9a96e",
          fontSize: "13px",
          fontWeight: "700",
          letterSpacing: "0.1em",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "0.85";
          e.currentTarget.style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        ELEGIR ESTA OPCIÓN
      </button>
    </div>
  );
}

export default function AthenaChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveQuote, setHasActiveQuote] = useState(false);
  const [conversacionId] = useState(() => generateId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMessages([
      { role: "user", content: "hola", hidden: true },
      {
        role: "assistant",
        content: "Hola, soy Athena. ¿En qué puedo ayudarte hoy?",
        opciones: ["Sala privada", "Restaurante", "Evento", "Conocer Atheneum"],
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const apiMessages = newMessages
        .filter((m) => !m.hidden)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, conversacionId }),
      });

      const data = await response.json();
      const athenaResponse = data.message || "";
      const quoteData = data.quote || null;
      const opciones = data.opciones || null;

      if (quoteData) {
        setHasActiveQuote(true);
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: quoteData.intro,
            quote: quoteData,
          },
        ]);
      } else if (athenaResponse) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: athenaResponse,
            opciones: opciones && opciones.length > 0 ? opciones : undefined,
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setIsLoading(false);
  };

  const handleSelectOption = (opcion: QuoteOption, numero: number) => {
    setHasActiveQuote(false);
    const items = opcion.items
      .map((i) => `${i.concepto}: $${i.precio}`)
      .join(", ");
    sendMessage(
      `Elijo la Opción ${numero} — ${opcion.titulo} por $${opcion.total}. Incluye: ${items}`
    );
  };

  const handleContactarEquipo = () => {
    setHasActiveQuote(false);
    sendMessage("Prefiero que alguien del equipo de Atheneum me contacte directamente");
  };

  const handleQuickReply = (texto: string) => {
    // Si es una opcion de escape, no enviar — enfocar el campo para que escriba libre
    const escape = ["otra", "otra opcion", "otra opción", "algo diferente", "otro"];
    if (escape.includes(texto.trim().toLowerCase())) {
      inputRef.current?.focus();
      return;
    }
    sendMessage(texto);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Solo muestra los botones del ULTIMO mensaje del assistant (no de los viejos)
  const lastAssistantIdx = (() => {
    const visibles = messages.filter((m) => !m.hidden);
    for (let i = visibles.length - 1; i >= 0; i--) {
      if (visibles[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#080c12",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(201,169,110,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
          background: "#0a1628",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#c9a96e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#0a1628",
            fontWeight: "bold",
            fontSize: "18px",
            fontFamily: "Georgia, serif",
            flexShrink: 0,
          }}
        >
          A
        </div>
        <div>
          <div style={{ color: "#c9a96e", fontFamily: "Georgia, serif", fontSize: "18px", fontWeight: "600", letterSpacing: "0.05em" }}>
            Athena
          </div>
          <div style={{ color: "rgba(245,240,232,0.5)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Concierge Atheneum · En línea
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "900px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {messages
          .filter((m) => !m.hidden)
          .map((msg, idx) => (
            <div key={idx}>
              {!msg.quote ? (
                <div style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "assistant" && (
                    <div
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "#c9a96e", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#0a1628", fontWeight: "bold",
                        fontSize: "13px", fontFamily: "Georgia, serif",
                        flexShrink: 0, marginRight: "10px", marginTop: "4px",
                      }}
                    >
                      A
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", maxWidth: "72%" }}>
                    <div
                      style={{
                        borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
                        padding: "14px 18px",
                        fontSize: "15px",
                        lineHeight: "1.7",
                        background: msg.role === "user" ? "#c9a96e" : "rgba(255,255,255,0.06)",
                        color: msg.role === "user" ? "#0a1628" : "#f5f0e8",
                        fontFamily: msg.role === "assistant" ? "Georgia, serif" : "inherit",
                      }}
                    >
                      {msg.content}
                    </div>

                    {/* Quick-reply buttons — solo en el ultimo mensaje del assistant */}
                    {msg.role === "assistant" &&
                      msg.opciones &&
                      msg.opciones.length > 0 &&
                      idx === lastAssistantIdx &&
                      !isLoading && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "14px", rowGap: "10px" }}>
                          {msg.opciones.map((op, i) => {
                            const esOtra = ["otra", "otra opcion", "otra opción", "algo diferente", "otro"].includes(op.trim().toLowerCase());
                            return (
                              <button
                                key={i}
                                onClick={() => handleQuickReply(op)}
                                style={{
                                  background: "transparent",
                                  border: esOtra
                                    ? "1px dashed rgba(245,240,232,0.3)"
                                    : "1px solid rgba(201,169,110,0.45)",
                                  color: esOtra ? "rgba(245,240,232,0.55)" : "#c9a96e",
                                  borderRadius: "22px",
                                  padding: "10px 20px",
                                  fontSize: "13.5px",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  fontFamily: "inherit",
                                  fontStyle: esOtra ? "italic" : "normal",
                                  whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                  if (esOtra) {
                                    e.currentTarget.style.borderColor = "rgba(245,240,232,0.5)";
                                    e.currentTarget.style.color = "rgba(245,240,232,0.8)";
                                  } else {
                                    e.currentTarget.style.background = "#c9a96e";
                                    e.currentTarget.style.color = "#0a1628";
                                    e.currentTarget.style.borderColor = "#c9a96e";
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (esOtra) {
                                    e.currentTarget.style.borderColor = "rgba(245,240,232,0.3)";
                                    e.currentTarget.style.color = "rgba(245,240,232,0.55)";
                                  } else {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "#c9a96e";
                                    e.currentTarget.style.borderColor = "rgba(201,169,110,0.45)";
                                  }
                                }}
                              >
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
                    <div
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        background: "#c9a96e", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#0a1628", fontWeight: "bold",
                        fontSize: "13px", fontFamily: "Georgia, serif", flexShrink: 0,
                      }}
                    >
                      A
                    </div>
                    <div
                      style={{
                        borderRadius: "4px 20px 20px 20px", padding: "14px 18px",
                        fontSize: "15px", lineHeight: "1.7",
                        background: "rgba(255,255,255,0.06)", color: "#f5f0e8",
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", paddingLeft: "42px" }}>
                    <QuoteCard
                      opcion={msg.quote.opcion1}
                      numero={1}
                      onSelect={() => handleSelectOption(msg.quote!.opcion1, 1)}
                    />
                    <QuoteCard
                      opcion={msg.quote.opcion2}
                      numero={2}
                      onSelect={() => handleSelectOption(msg.quote!.opcion2, 2)}
                    />
                  </div>

                  <div style={{ paddingLeft: "42px", marginTop: "16px", display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={handleContactarEquipo}
                      style={{
                        background: "transparent", border: "none",
                        color: "rgba(245,240,232,0.35)", fontSize: "13px",
                        cursor: "pointer", padding: "8px 16px", borderRadius: "8px",
                        fontFamily: "Georgia, serif", fontStyle: "italic",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.65)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.35)"; }}
                    >
                      Prefiero que alguien del equipo me contacte
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "#c9a96e", display: "flex", alignItems: "center",
                justifyContent: "center", color: "#0a1628", fontWeight: "bold",
                fontSize: "13px", fontFamily: "Georgia, serif", flexShrink: 0,
              }}
            >
              A
            </div>
            <div style={{ borderRadius: "4px 20px 20px 20px", padding: "14px 18px", background: "rgba(255,255,255,0.06)", display: "flex", gap: "5px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: "#c9a96e", opacity: 0.7,
                    animation: `bounce 1s infinite ${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "20px 24px",
          borderTop: "1px solid rgba(201,169,110,0.2)",
          background: "#0a1628",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", gap: "10px" }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={hasActiveQuote ? "Selecciona una opción arriba..." : "Escribe tu respuesta..."}
            disabled={isLoading || hasActiveQuote}
            style={{
              flex: 1, borderRadius: "14px", padding: "14px 20px",
              fontSize: "15px",
              background: hasActiveQuote ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.06)",
              border: "1px solid rgba(201,169,110,0.25)",
              color: "#f5f0e8", outline: "none",
              opacity: hasActiveQuote ? 0.4 : 1,
              cursor: hasActiveQuote ? "not-allowed" : "text",
              transition: "all 0.2s",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim() || hasActiveQuote}
            style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: "#c9a96e", border: "none", color: "#0a1628",
              cursor: isLoading || hasActiveQuote ? "not-allowed" : "pointer",
              fontSize: "20px", display: "flex", alignItems: "center",
              justifyContent: "center",
              opacity: isLoading || !input.trim() || hasActiveQuote ? 0.3 : 1,
              flexShrink: 0, transition: "opacity 0.2s",
            }}
          >
            →
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "10px", fontSize: "11px", color: "rgba(245,240,232,0.3)", letterSpacing: "0.05em" }}>
          ATHENEUM · WORLD TRADE CENTER · QUITO
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @media (max-width: 640px) {
          .quote-cards { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}