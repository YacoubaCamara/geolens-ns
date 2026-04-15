"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const prefill = localStorage.getItem("geolens_prefill");
    if (prefill) {
      setInput(prefill);
      localStorage.removeItem("geolens_prefill");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let assistantText = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      assistantText += decoder.decode(value);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: assistantText };
        return updated;
      });
    }

    setIsLoading(false);
  }

  const accent = "#c9a84c";
  const accentDim = "#a07830";

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      backgroundColor: "#0f0f0f", color: "#f0f0f0",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>

      <div style={{
        padding: "20px 24px", borderBottom: "1px solid #222",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="./rock.svg" alt="rock" style={{ width: "24px", height: "24px", filter: "invert(1)" }} />
          <span style={{ fontSize: "20px" }}>⛏️</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "#fff" }}>
              GeoLens NS
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#555" }}>
              Nova Scotia geoscience assistant
            </p>
          </div>
        </div>
        <Link href="/map" style={{
          padding: "8px 16px", borderRadius: "8px",
          border: `1px solid ${accentDim}`,
          color: accent, fontSize: "13px", textDecoration: "none",
          fontWeight: 500,
        }}>
          View map ↗
        </Link>
      </div>

      <div style={{
        flex: 1, overflowY: "auto", padding: "24px",
        display: "flex", flexDirection: "column", gap: "16px",
      }}>
        {messages.length === 0 && (
          <div style={{ margin: "auto", textAlign: "center", color: "#444", maxWidth: "420px" }}>
            <p style={{ fontSize: "40px", margin: "0 0 16px" }}>🪨</p>
            <p style={{ fontSize: "16px", margin: "0 0 4px", color: "#aaa", fontWeight: 500 }}>
              Ask anything about NS geology
            </p>
            <p style={{ fontSize: "13px", margin: "0 0 24px", color: "#555" }}>
              Answers grounded in government geoscience reports
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "What minerals are found near Pictou County?",
                "Is there gold in Nova Scotia?",
                "Where can I collect rocks legally?",
              ].map((s) => (
                <button key={s} onClick={() => setInput(s)} style={{
                  background: "#141414", border: "1px solid #252525",
                  borderRadius: "10px", padding: "11px 14px",
                  color: "#777", fontSize: "13px", cursor: "pointer",
                  textAlign: "left", transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = accentDim}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#252525"}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: m.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "75%", padding: "12px 16px",
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              backgroundColor: m.role === "user" ? "#2a1f0a" : "#141414",
              color: m.role === "user" ? "#f5e6c8" : "#e0e0e0",
              fontSize: "14px", lineHeight: "1.65", whiteSpace: "pre-wrap",
              border: m.role === "user"
                ? `1px solid ${accentDim}`
                : "1px solid #222",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 16px", borderRadius: "18px 18px 18px 4px",
              backgroundColor: "#141414", border: "1px solid #222",
              display: "flex", gap: "5px", alignItems: "center",
            }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  backgroundColor: accentDim,
                  animation: "pulse 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "16px 24px", borderTop: "1px solid #1a1a1a",
        backgroundColor: "#0c0c0c",
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Nova Scotia minerals..."
            style={{
              flex: 1, padding: "12px 16px", borderRadius: "12px",
              border: "1px solid #222", backgroundColor: "#141414",
              color: "#f0f0f0", fontSize: "14px", outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              padding: "12px 20px", borderRadius: "12px", border: "none",
              backgroundColor: isLoading || !input.trim() ? "#1a1a1a" : accent,
              color: isLoading || !input.trim() ? "#444" : "#0f0f0f",
              fontSize: "14px", fontWeight: 600,
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
            }}
          >
            Ask
          </button>
        </form>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
        input::placeholder { color: #444; }
      `}</style>
    </div>
  );
}