import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { Header } from "./components/Header";
import { MeditationParticles } from "./components/MeditationParticles";
import { MessageInput } from "./components/MessageInput";
import { getMessages } from "./lib/messages";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

type DbMessageRow = {
  id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
};

function rowToMessage(row: DbMessageRow): Message {
  return {
    id: row.id,
    text: row.content,
    isUser: row.role === "user",
    timestamp: new Date(row.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

async function loadMessagesForUser(userId: string): Promise<Message[]> {
  const data = await getMessages(userId);
  if (!data?.length) return [];
  return (data as DbMessageRow[]).map(rowToMessage);
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [sending, setSending] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("user_id", userId);
    }

    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadMessagesForUser(userId!);
        if (!cancelled) setMessages(loaded);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (text: string) => {
    let userId = localStorage.getItem("user_id");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("user_id", userId);
    }

    void (async () => {
      setSending(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, content: text }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          console.error(err.error ?? res.statusText);
          return;
        }
        await res.json();
        setMessages(await loadMessagesForUser(userId!));
      } finally {
        setSending(false);
      }
    })();
  };

  return (
    <>
      <MeditationParticles />
      <div className="relative z-10 flex h-screen flex-col bg-transparent">
        <Header />

        <div
          ref={chatContainerRef}
          className="chat-scrollbar flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {!hydrated ? (
            <p className="text-muted-foreground text-sm">読み込み中…</p>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
              />
            ))
          )}
        </div>

        <MessageInput onSendMessage={handleSendMessage} disabled={sending} />
      </div>
    </>
  );
}
