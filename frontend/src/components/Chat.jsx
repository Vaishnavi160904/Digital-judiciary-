import { useState, useEffect, useRef } from "react";
import {
  sendMessage,
  saveChat,
  getChatHistory,
  getChatById,
} from "../services/api";
import "./Chat.css";

const SUGGESTED_PROMPTS = [
  "What is labour law?",
  "Explain contract breach and remedies",
  "Summary of IPC Section 302",
  "How to file a civil suit?",
  "Difference between civil and criminal case",
];

function formatBotContent(text) {
  if (!text || typeof text !== "string") return [];
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para) => {
    const segments = [];
    let rest = para.trim();
    if (!rest) return [];
    while (rest) {
      const i = rest.indexOf("**");
      if (i === -1) {
        segments.push({ type: "text", value: rest });
        break;
      }
      if (i > 0) segments.push({ type: "text", value: rest.slice(0, i) });
      rest = rest.slice(i + 2);
      const j = rest.indexOf("**");
      if (j === -1) {
        segments.push({ type: "text", value: "**" + rest });
        break;
      }
      segments.push({ type: "bold", value: rest.slice(0, j) });
      rest = rest.slice(j + 2);
    }
    return segments;
  });
}

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await getChatHistory();
    setHistory(res.data);
  };

  const loadChat = async (id) => {
    const res = await getChatById(id);
    setMessages(res.data.messages);
    setActiveChat(id);
  };

  const send = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendMessage(input);

      const botMessage = {
        role: "assistant",
        content: res.data.answer,
      };

      const updatedMessages = [...messages, userMessage, botMessage];
      setMessages(updatedMessages);

      if (!activeChat) {
        const saveRes = await saveChat({
          title: input.slice(0, 25),
          messages: updatedMessages,
        });
        setActiveChat(saveRes.data.id);
        loadHistory();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error occurred." },
      ]);
    }

    setLoading(false);
  };

  const handleSuggestedPrompt = (prompt) => {
    setInput(prompt);
  };

  const copyMessage = (content, id) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="lawgpt-wrap">
      <aside className="lawgpt-sidebar">
        <h3 className="lawgpt-sidebar-title">Conversations</h3>
        <button
          type="button"
          className="lawgpt-new-chat"
          onClick={() => {
            setMessages([]);
            setActiveChat(null);
          }}
        >
          + New Chat
        </button>
        <div className="lawgpt-history">
          {history.map((chat) => (
            <div
              key={chat._id}
              className={`lawgpt-history-item ${activeChat === chat._id ? "active" : ""}`}
              onClick={() => loadChat(chat._id)}
            >
              <span className="lawgpt-history-item-text">{chat.title}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="lawgpt-main">
        <header className="lawgpt-header">
          <h2>
            <span className="lawgpt-header-icon">⚖️</span>
            LawGPT
          </h2>
        </header>

        <div className="lawgpt-window" style={{ position: "relative" }}>
          {messages.length === 0 && !loading && (
            <div className="lawgpt-welcome">
              <div className="lawgpt-welcome-icon">⚖️</div>
              <h3>Ask a legal question</h3>
              <p>
                Get instant research, case analysis, and document help. Type below or try a suggestion.
              </p>
              <div className="lawgpt-suggestions">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="lawgpt-suggestion-chip"
                    onClick={() => handleSuggestedPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`lawgpt-bubble-wrap ${m.role === "user" ? "user" : "bot"}`}
            >
              <div
                className={`lawgpt-bubble ${
                  m.role === "user" ? "lawgpt-bubble-user" : "lawgpt-bubble-bot"
                }`}
              >
                {m.role === "user" ? (
                  m.content
                ) : (
                  <div className="lawgpt-bot-content">
                    {formatBotContent(m.content).filter((para) => para.length > 0).map((para, pIdx) => (
                      <p key={pIdx} className="lawgpt-bot-para">
                        {para.map((seg, sIdx) =>
                          seg.type === "bold" ? (
                            <strong key={sIdx}>{seg.value}</strong>
                          ) : (
                            <span key={sIdx}>{seg.value}</span>
                          )
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "assistant" && (
                <button
                  type="button"
                  className="lawgpt-copy-btn"
                  onClick={() => copyMessage(m.content, i)}
                  title="Copy"
                >
                  {copiedId === i ? "✓ Copied" : "Copy"}
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="lawgpt-typing">
              <span className="lawgpt-typing-dot" />
              <span className="lawgpt-typing-dot" />
              <span className="lawgpt-typing-dot" />
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="lawgpt-input-wrap">
          <div className="lawgpt-input-bar">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask a legal question..."
              className="lawgpt-input"
            />
            <button type="button" onClick={send} className="lawgpt-send" disabled={loading}>
              Send
            </button>
          </div>
          <p className="lawgpt-input-hint">Press Enter to send · Legal research, case analysis, documents</p>
        </div>
      </main>
    </div>
  );
}