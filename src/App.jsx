import { useState, useRef, useEffect } from "react";
import "./App.css";

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

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  const committedTranscriptRef = useRef("");

  useEffect(() => {
    return () => recognitionRef.current?.stop?.();
  }, []);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }

      if (final) {
        // commit final transcript (append to any previously committed text)
        const base = (committedTranscriptRef.current ? committedTranscriptRef.current + ' ' : '') + final.trim();
        committedTranscriptRef.current = base;
        setInput(base);
      } else {
        // show interim appended to committed base (replaces previous interim)
        const base = committedTranscriptRef.current ? committedTranscriptRef.current + ' ' : '';
        setInput(base + interim.trim());
      }
    };

    recognition.onerror = (e) => { console.error('Speech recognition error', e); setIsRecording(false); };
    recognition.onend = () => { setIsRecording(false); };
    // Use current input as the base so interim updates replace it rather than duplicate
    committedTranscriptRef.current = input;
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  const sendMessage = async () => {
    if (isRecording) stopRecording();
    if (!input.trim() || loading) return;

    const userText = input;

    // Show user message
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: userText, isUser: true },
    ]);

    setInput("");
    committedTranscriptRef.current = "";
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
              <div style={styles.bubble} className={`message-bubble ${msg.isUser ? 'user' : 'assistant'}`}>{msg.text}</div>
            </div>
          ))}  

          {loading && (
            <div style={{ textAlign: "left", marginBottom: "10px" }}>
              <div style={styles.bubble} className="message-loading message-bubble" aria-live="polite" aria-label="Thinking">
                <span className="sr-only">Thinking...</span>
                <span className="thinking-text">Thinking</span>
                <div className="bubble-loader small" aria-hidden="true">
                  <div className="bubble" />
                  <div className="bubble" />
                  <div className="bubble" />
                </div>
              </div> 
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div style={styles.inputBox} className="input-box">
          <input
            className="chat-input"
            value={input}
            // disabled={loading}
            onChange={(e) => { setInput(e.target.value); committedTranscriptRef.current = e.target.value; }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a question..."
            style={styles.input}
          />

          <button
            type="button"
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            aria-pressed={isRecording}
            aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
            style={{ border: 'none', background: 'transparent', padding: 0 }}
          >
            {/* Vector microphone icon (color via CSS currentColor) */}
            <svg className={`mic-icon ${isRecording ? 'recording' : ''}`} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" fill="currentColor" />
              <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M12 19v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            className="send-button"
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
    minHeight: "100vh",
    background: "#010221",
    display: "flex",
    // border : "2px solid #555",
    justifyContent: "center",
    alignItems: "center",
  },
  chatBox: {
    width: "min(800px, 95%)",
    height: "min(600px, 90vh)",
    background: "linear-gradient(180deg, #0b2030 0%, #071024 100%)",
    display: "flex",
    flexDirection: "column",
    borderRadius: "10px",
    boxShadow: "0 24px 40px rgba(2,6,23,0.7)",
  },
  header: {
    fontWeight: "700",
    background: "linear-gradient(90deg, rgba(255, 255, 255, 0.59), rgba(33, 29, 29, 0.01))",
    fontSize: "clamp(18px, 4vw, 30px)",
    padding: "12px",
    color: "#e6eef8",
    borderBottom: "1px solid rgba(7, 2, 42, 0.04)",
    textAlign: "center",
  },
  messages: {
    flex: 1,
    padding: "12px",
    overflowY: "auto",
  },
  bubble: {
    background: "#0b1226",
    color: "#e6eef8",
    padding: "10px",
    borderRadius: "10px",
    display: "inline-block",
    maxWidth: "70%",
    border: "1px solid rgba(255,255,255,0.03)",
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
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  input: {
    flex: 1,
    minWidth: 0,
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid rgba(255,255,255,0.06)",
    background: "#0a1c3d",
    color: "#e6eef8",
    outline: "none",
  },
  button: {
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    fontWeight: 700,
  },
};
