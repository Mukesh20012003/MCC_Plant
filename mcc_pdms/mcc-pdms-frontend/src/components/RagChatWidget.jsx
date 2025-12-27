import { useState } from "react";
import { fetchRagAnswer } from "../services/api";

function RagChatWidget() {
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi, I am the MCC PDMS assistant. Ask me about batches and QC.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

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
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Sorry, I could not get an answer." },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-6 bottom-6 z-40 bg-blue-600 text-white rounded-full shadow-lg px-4 py-2 text-xs font-semibold hover:bg-blue-700"
      >
        {open ? "Close assistant" : "Ask MCC Assistant"}
      </button>

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold">RAG Assistant</span>
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-blue-100 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-3 space-y-1 max-h-[calc(100%-90px)] overflow-y-auto text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${
                m.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-3 py-1.5 rounded-2xl max-w-[85%] ${
                  m.from === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={sendQuestion}
          className="border-t border-gray-200 p-3 flex gap-2"
        >
          <input
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ask something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
            type="submit"
            disabled={sending}
          >
            {sending ? "..." : "Send"}
          </button>
        </form>
      </div>
    </>
  );
}

export default RagChatWidget;
