import React, { useState, useRef, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { askYawaBudgetApi } from "../api/ai";
import { ChatMessageItem } from "../types";
import { ChatMessage } from "../components/ai/ChatMessage";
import { ChatInput } from "../components/ai/ChatInput";
import { ErrorAlert } from "../components/common/ErrorAlert";
import { getErrorMessage } from "../api/client";

export const AskYawaBudgetPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: "welcome-1",
      sender: "assistant",
      text: "No yawa! I have live context of your monthly limits, connected Mono bank accounts, and recorded ledger transactions. Inquire about category limits, month-to-date spending, or threshold warnings.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    setError(null);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append user message
    const userMsg: ChatMessageItem = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text,
      timestamp: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await askYawaBudgetApi({ question: text });

      const aiMsg: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to get an answer from Yawa Budget AI. Please try again.");
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[var(--border-color)]">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] font-sans">
          Ask Yawa Budget
        </h1>
        <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
          Query your current ledger and keep your finances from becoming yawa
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* Main Chat Container */}
      <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] flex flex-col h-[560px]">
        {/* Messages Scroll Area */}
        <div
          id="chat-messages-container"
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[var(--bg-base)]"
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Assistant Loading State */}
          {isLoading && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-7 h-7 flex items-center justify-center shrink-0 border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)] rounded-xs">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="border border-[var(--border-color)] bg-[var(--bg-surface)] px-4 py-2.5 rounded-xs">
                <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-lime)] animate-pulse" />
                  Querying active ledger...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock Area */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

// Backward-compatible alias
export const AskSmartBudgetPage = AskYawaBudgetPage;
