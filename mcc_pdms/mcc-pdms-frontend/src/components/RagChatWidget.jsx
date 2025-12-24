// src/components/RagChatWidget.jsx
import { useState } from "react";
import { fetchRagAnswer } from "../services/api";

function RagChatWidget() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi, I am the MCC PDMS assistant. Ask me about batches and QC." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const sendQuestion = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((prev) => [...prev, { from: "user", text: question }]);
    setInput("");
    setSending(true);
    try {
      const data = await fetchRagAnswer(question);
      setMessages((prev) => [...prev, { from: "bot", text: data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, I could not get an answer." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="position-fixed"
      style={{ right: "1.5rem", bottom: "1.5rem", width: "320px", zIndex: 1050 }}
    >
      <div className="card shadow-sm">
        <div className="card-header py-2">
          <strong className="small">RAG Assistant</strong>
        </div>
        <div
          className="card-body p-2"
          style={{ maxHeight: "260px", overflowY: "auto", fontSize: "0.85rem" }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={
                "mb-1 d-flex " +
                (m.from === "user" ? "justify-content-end" : "justify-content-start")
              }
            >
              <div
                className={
                  "px-2 py-1 rounded-2 " +
                  (m.from === "user"
                    ? "bg-primary text-white"
                    : "bg-light border")
                }
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={sendQuestion} className="card-footer p-2">
          <div className="input-group input-group-sm">
            <input
              className="form-control"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={sending}>
              {sending ? "..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RagChatWidget;
