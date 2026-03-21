import { Mic, Send } from "lucide-react";
import { useState, type FormEvent } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="lg-glass-dock opacity-70 rounded-none"
    >
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="メッセージを入力..."
          className="lg-glass-field lg-glass-field--white"
        />
        <button
          type="button"
          className="lg-glass-round lg-glass-round--muted"
          aria-label="音声入力"
        >
          <Mic className="w-5 h-5" />
        </button>
        <button
          type="submit"
          className="lg-glass-round lg-glass-round--accent"
          disabled={!message.trim()}
          aria-label="送信"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
