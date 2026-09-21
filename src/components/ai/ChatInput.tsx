import React, { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { Button } from "../common/Button";

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [prompt, setPrompt] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  // Check browser support for SpeechRecognition or webkitSpeechRecognition
  const isSpeechSupported =
    typeof window !== "undefined" &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const quickQuestions = [
    "Any yawa with my budget this month?",
    "Which categories are past 80% limit?",
    "Total spent this month",
    "Where can I cut back?",
  ];

  // Clean up any ongoing recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignored
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (!isSpeechSupported || isLoading) return;

    if (isListening) {
      // User tapped mic to stop speaking -> trigger stop which will fire onend and send message
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          setIsListening(false);
        }
      }
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;
      recognition.continuous = false; // Automatically stops when user stops speaking
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      transcriptRef.current = "";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        setPrompt(fullTranscript);
        transcriptRef.current = fullTranscript;
      };

      recognition.onerror = (event: any) => {
        if (event.error !== "no-speech" && event.error !== "aborted") {
          console.warn("Speech recognition error:", event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        const textToSend = transcriptRef.current.trim();
        if (textToSend) {
          setPrompt("");
          transcriptRef.current = "";
          onSendMessage(textToSend);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    // If speech recognition is still running, abort to avoid duplicate onend send
    if (recognitionRef.current && isListening) {
      transcriptRef.current = "";
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignored
      }
      setIsListening(false);
    }

    const question = prompt.trim();
    setPrompt("");
    await onSendMessage(question);
  };

  const handleSelectQuick = async (q: string) => {
    if (isLoading) return;
    await onSendMessage(q);
  };

  return (
    <div className="space-y-2.5">
      {/* Quick Prompt Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-[var(--text-muted)] shrink-0">
          query:
        </span>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading || isListening}
            onClick={() => handleSelectQuick(q)}
            className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-[var(--bg-base)] hover:bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] shrink-0 transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            id="ask-smartbudget-input"
            type="text"
            placeholder={
              isListening
                ? "Listening... speak now"
                : "Ask about spending, limits, or ledger history..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            className={`flex-1 rounded-xs border bg-[var(--bg-base)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:outline-none disabled:opacity-50 ${
              isListening
                ? "border-[var(--accent-lime)] ring-1 ring-[var(--accent-lime)] placeholder:text-[var(--accent-lime-text)] dark:placeholder:text-[var(--accent-lime)]"
                : "border-[var(--border-color)] focus:border-[var(--text-primary)]"
            }`}
          />

          {/* Web Speech API Microphone Button (Hidden if browser does not support it) */}
          {isSpeechSupported && (
            <button
              id="ask-speech-mic-btn"
              type="button"
              onClick={toggleListening}
              disabled={isLoading}
              title={
                isListening
                  ? "Listening... Click to stop and send"
                  : "Ask with voice (Speech Recognition)"
              }
              aria-label={isListening ? "Stop voice listening and send" : "Ask with voice"}
              className={`h-8.5 px-2.5 rounded-xs border transition-all flex items-center justify-center shrink-0 disabled:opacity-50 select-none ${
                isListening
                  ? "border-[var(--accent-lime)] bg-[var(--accent-lime)] text-[var(--accent-lime-text)] ring-2 ring-[var(--accent-lime)] ring-offset-1 ring-offset-[var(--bg-surface)] animate-pulse"
                  : "border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]"
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${isListening ? "animate-pulse" : ""}`} />
            </button>
          )}

          <Button
            id="ask-smartbudget-send-btn"
            type="submit"
            isLoading={isLoading}
            disabled={!prompt.trim() || isLoading}
            size="sm"
            className="h-8.5 px-3"
            rightIcon={<Send className="w-3 h-3" />}
          >
            Send
          </Button>
        </div>

        {/* Real-time Listening Active State Feedback */}
        {isListening && (
          <div className="flex items-center gap-2 px-1 text-[11px] font-mono text-[var(--accent-lime-text)] dark:text-[var(--accent-lime)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-lime)] animate-ping" />
            <span>Listening to voice... Pausing speech or clicking the mic will submit your question.</span>
          </div>
        )}
      </form>
    </div>
  );
};
