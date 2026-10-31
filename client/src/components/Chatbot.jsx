import { useEffect, useRef, useState } from "react";
import { apiRequest } from "../data/store";

function renderText(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part.replace(/^\s*[*-]\s+/gm, "• ").replace(/\*([^*]+)\*/g, "$1")
      )
    );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Ask me how many users, teachers or courses there are." },
  ]);
  const bodyRef = useRef(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);

    try {
      const data = await apiRequest("/api/chatbot", {
        method: "POST",
        body: JSON.stringify({ message: text, history: messages.slice(-8) }),
      });
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((m) => [...m, { role: "bot", text: error.message || "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  };

   const bubble = (role) => ({
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background: role === "user" ? "#5b4ee8" : "#f0eff6",
    color: role === "user" ? "#fff" : "#222",
    padding: "8px 12px",
    borderRadius: 12,
    maxWidth: "85%",
    fontSize: 14,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  });

  return (
    <>
      {open && (
        <div
          style={{
            position: "fixed", right: 24, bottom: 90, width: 320, height: 420,
            background: "#fff", border: "1px solid #ddd", borderRadius: 16,
            boxShadow: "0 12px 32px rgba(0,0,0,.18)", display: "flex",
            flexDirection: "column", zIndex: 1000, overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", background: "#5b4ee8", color: "#fff", fontWeight: 600 }}>
            ✦ StudyHub Assistant
          </div>

          <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map((m, i) => (
             <div key={i} style={bubble(m.role)}>{renderText(m.text)}</div>
              ))}
            {busy && <div style={bubble("bot")}>Thinking...</div>}
          </div>

          <div style={{ display: "flex", gap: 8, padding: 10, borderTop: "1px solid #eee" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question..."
              style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ddd" }}
            />
            <button onClick={send} disabled={busy || !input.trim()}>Send</button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chatbot"
        style={{
          position: "fixed", right: 24, bottom: 24, width: 56, height: 56,
          borderRadius: "50%", border: "none", background: "#5b4ee8",
          color: "#fff", fontSize: 24, cursor: "pointer", zIndex: 1000,
          boxShadow: "0 8px 20px rgba(91,78,232,.4)",
        }}
      >
        {open ? "×" : "✦"}
      </button>
    </>
  );
}