interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

export function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 opacity-[.99]`}
    >
      <div className="flex flex-col max-w-[75%] sm:max-w-[65%]">
        <div
          className={isUser ? "lg-glass-bubble-user" : "lg-glass-bubble-other"}
        >
          <p className="text-base leading-relaxed">{message}</p>
        </div>
        <span
          className="text-xs mt-2 px-2 text-muted-foreground"
          style={{
            alignSelf: isUser ? "flex-end" : "flex-start",
          }}
        >
          {timestamp}
        </span>
      </div>
    </div>
  );
}
