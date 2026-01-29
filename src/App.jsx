import { useState, useRef, useEffect } from "react";

export default function App() {
  // Chat state
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! Ask me about government policies.", isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userText = input;

    // Show user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: userText, isUser: true },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userText }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: data.answer, isUser: false },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Server error. Please try again.",
          isUser: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.chatBox}>
        <div style={styles.header}>Government Policy Assistant</div>

        <div style={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                textAlign: msg.isUser ? "right" : "left",
                marginBottom: "10px",
              }}
            >
              <span style={styles.bubble}>{msg.text}</span>
            </div>
          ))}

          {loading && (
            <div style={{ textAlign: "left", marginBottom: "10px" }}>
              <span style={styles.loader}>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputBox}>
          <input
            value={input}
            // disabled={loading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a question..."
            style={styles.input}
          />
          <button
            onClick={sendMessage}
            // disabled={loading}
            style={styles.button}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const styles = {
  page: {
    minHeight: "97vh",
    background: "#bb7070",
    display: "flex",
    // border : "2px solid #555",
    justifyContent: "center",
    alignItems: "center",
  },
  chatBox: {
    width: "800px",
    height: "600px",
    background: "linear-gradient(135deg, #6327e3 0%, #7fc00f 100%)",
    display: "flex",  
    flexDirection: "column",
    borderRadius: "8px",
    boxShadow: "0 20px 20px rgba(0,0,0,0.5)",
  },
  header: {
    fontWeight: "bold",
    backgroundColor: "#e8e8e8",
    fontSize: "30px",
    padding: "12px",
    color: "black",
    borderBottom: "1px solid #555",
    textAlign: "center",
  },
  messages: {
    flex: 1,
    padding: "12px",
    overflowY: "auto",
  },
  bubble: {
    background: "white",
    padding: "10px",
    borderRadius: "10px",
    display: "inline-block",
    maxWidth: "70%",
    animation: "blink 1s infinite",

  },
  loader: {
    background: "#ddd",
    padding: "10px",
    borderRadius: "10px",
    display: "inline-block",
    fontStyle: "italic",
    color: "#333",
  },
  inputBox: {
    padding: "10px",
    borderTop: "1px solid #555",
  },
  input: {
    width: "80%",
    padding: "8px",
  },
  button: {
    marginLeft: "30px",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    hover: {scale: 1.05},
  },
};
