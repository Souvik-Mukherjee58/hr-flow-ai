import { useState } from "react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! 👋 I'm HR Motion AI. How can I help you with employee leave, workload, or burnout analysis?",
    },
  ]);

  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const getResponse = (message) => {
    const text = message.toLowerCase();

    if (
      text.includes("leave") ||
      text.includes("vacation") ||
      text.includes("holiday")
    ) {
      return "I can help analyze leave requests based on leave type, duration, employee workload, and company policy. 📋";
    }

    if (
      text.includes("burnout") ||
      text.includes("stress")
    ) {
      return "Burnout risk can be evaluated using workload, leave history, working patterns, and other employee indicators. 🔥";
    }

    if (
      text.includes("workload") ||
      text.includes("work")
    ) {
      return "The workload agent evaluates current workload and estimates whether approving leave could affect team capacity. 📊";
    }

    if (
      text.includes("policy") ||
      text.includes("eligible")
    ) {
      return "The Policy Agent checks the request against applicable leave rules and returns an approval recommendation with a confidence score. 📋";
    }

    if (
      text.includes("approve") ||
      text.includes("approval")
    ) {
      return "The final AI recommendation combines policy compliance, workload impact, and burnout risk before suggesting APPROVE or REJECT. 🧠";
    }

    if (
      text.includes("employee")
    ) {
      return "You can submit an employee ID, name, leave type, number of days, and reason in the Leave Intelligence panel. 👤";
    }

    if (
      text.includes("hello") ||
      text.includes("hi") ||
      text.includes("hey")
    ) {
      return "Hello! 👋 I'm ready to assist with your HR workforce analysis.";
    }

    return "I can help you with leave requests, HR policies, employee workload, burnout risk, and AI recommendations. Try asking me about one of those topics.";
  };

  const sendMessage = () => {
    if (!input.trim() || typing) return;

    const userMessage = input.trim();

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userMessage,
      },
    ]);

    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = getResponse(userMessage);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: response,
        },
      ]);

      setTyping(false);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    "How does burnout analysis work?",
    "How is leave approved?",
    "What does workload risk mean?",
  ];

  return (
    <>
      {/* CHAT WINDOW */}

      {open && (
        <div className="chatbot-window">

          {/* HEADER */}

          <div className="chatbot-header">

            <div className="chatbot-title">

              <div className="chatbot-avatar">
                🧠
              </div>

              <div>
                <strong>HR Motion AI</strong>

                <div className="chatbot-online">
                  <span></span>
                  AI Assistant Online
                </div>
              </div>

            </div>

            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>

          </div>

          {/* MESSAGES */}

          <div className="chatbot-messages">

            {messages.map((message, index) => (

              <div
                key={index}
                className={`chat-message ${
                  message.sender === "user"
                    ? "user-message"
                    : "bot-message"
                }`}
              >

                {message.sender === "bot" && (
                  <div className="message-avatar">
                    🧠
                  </div>
                )}

                <div className="message-bubble">
                  {message.text}
                </div>

              </div>

            ))}

            {/* TYPING */}

            {typing && (
              <div className="chat-message bot-message">

                <div className="message-avatar">
                  🧠
                </div>

                <div className="typing-indicator">

                  <span></span>
                  <span></span>
                  <span></span>

                </div>

              </div>
            )}

          </div>

          {/* QUICK QUESTIONS */}

          {messages.length === 1 && (
            <div className="quick-questions">

              <small>Quick questions</small>

              {quickQuestions.map((question, index) => (

                <button
                  key={index}
                  onClick={() => {
                    setInput(question);
                  }}
                >
                  {question}
                </button>

              ))}

            </div>
          )}

          {/* INPUT */}

          <div className="chatbot-input-area">

            <input
              type="text"
              placeholder="Ask HR Motion AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={sendMessage}
              disabled={!input.trim() || typing}
              className="send-button"
            >
              ↑
            </button>

          </div>

          <div className="chatbot-footer">
            AI-powered HR assistant
          </div>

        </div>
      )}

      {/* FLOATING BUTTON */}

      {!open && (
        <button
          className="chatbot-floating-button"
          onClick={() => setOpen(true)}
        >

          <span className="chatbot-icon">
            🧠
          </span>

          <span className="chatbot-notification">
            1
          </span>

        </button>
      )}

    </>
  );
}