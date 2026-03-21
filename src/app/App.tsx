import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { Header } from "./components/Header";
import { MeditationParticles } from "./components/MeditationParticles";
import { MessageInput } from "./components/MessageInput";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

/** デモ用の初期スレッド（相手・自分を交互。id:1 の時刻はマウント後に入れる） */
const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    text: "こんにちは。今日の気持ちを、よければ共有してください。",
    isUser: false,
    timestamp: "",
  },
  { id: 2, text: "こんにちは。最近、少し疲れ気味です。", isUser: true, timestamp: "10:01" },
  {
    id: 3,
    text: "そうだったんですね。いつ頃からそう感じますか？",
    isUser: false,
    timestamp: "10:02",
  },
  {
    id: 4,
    text: "先月くらいからかもしれません。はっきりは覚えていません。",
    isUser: true,
    timestamp: "10:02",
  },
  {
    id: 5,
    text: "ありがとうございます。仕事やプライベート、どちらで負担が大きいですか？",
    isUser: false,
    timestamp: "10:03",
  },
  { id: 6, text: "どちらもありますが、仕事の方が強いです。", isUser: true, timestamp: "10:03" },
  {
    id: 7,
    text: "なるほど。休憩や睡眠は、今どのくらい取れていますか？",
    isUser: false,
    timestamp: "10:04",
  },
  {
    id: 8,
    text: "十分とは言えないと思います。夜更かしも続いています。",
    isUser: true,
    timestamp: "10:04",
  },
  {
    id: 9,
    text: "無理せず、少しずつでも休める工夫を一緒に考えられます。",
    isUser: false,
    timestamp: "10:05",
  },
  {
    id: 10,
    text: "そう言ってもらえて少し安心しました。",
    isUser: true,
    timestamp: "10:05",
  },
  {
    id: 11,
    text: "どんなときにいちばんつらさを感じますか？",
    isUser: false,
    timestamp: "10:06",
  },
  {
    id: 12,
    text: "夜、ひとりで考え込んでしまうときです。",
    isUser: true,
    timestamp: "10:06",
  },
  {
    id: 13,
    text: "夜は考えが巡りやすいですよね。周りに相談できる方はいますか？",
    isUser: false,
    timestamp: "10:07",
  },
  {
    id: 14,
    text: "家族には少し話しています。全部はまだ言えていません。",
    isUser: true,
    timestamp: "10:07",
  },
  {
    id: 15,
    text: "ここに書いてくれたことも、大切な一歩だと思います。",
    isUser: false,
    timestamp: "10:08",
  },
  {
    id: 16,
    text: "聞いてくれてありがとうございます。",
    isUser: true,
    timestamp: "10:08",
  },
  {
    id: 17,
    text: "今日の気持ちを言葉にしてくれたことに、感謝しています。",
    isUser: false,
    timestamp: "10:09",
  },
  {
    id: 18,
    text: "こちらこそ、時間を取ってくれて助かりました。",
    isUser: true,
    timestamp: "10:09",
  },
  {
    id: 19,
    text: "また落ち着いたときに、また来ても大丈夫です。",
    isUser: false,
    timestamp: "10:10",
  },
  { id: 20, text: "わかりました。また来ます。", isUser: true, timestamp: "10:10" },
  {
    id: 21,
    text: "お疲れさまでした。どうかご無理なさらず。",
    isUser: false,
    timestamp: "10:11",
  },
];

export default function App() {
  const [consultationType, setConsultationType] = useState<"ai" | "person">(
    "ai",
  );
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === 1 && m.timestamp === ""
          ? {
              ...m,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }
          : m,
      ),
    );
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (text: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI/counselor response
    setTimeout(
      () => {
        const responses = [
          "Thank you for sharing that with me. I'm here to listen. Could you tell me more about how you've been feeling?",
          "I hear you. It's completely okay to feel this way. Would you like to talk about what's been on your mind?",
          "That sounds difficult. Remember, this is a safe space and there's no judgment here. Take your time.",
          "I appreciate you opening up. Your feelings are valid. How long have you been experiencing this?",
          "It takes courage to reach out. I'm glad you're here. What would help you feel supported right now?",
        ];

        const responseText =
          responses[Math.floor(Math.random() * responses.length)];
        const aiMessage: Message = {
          id: messages.length + 2,
          text: responseText,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, aiMessage]);
      },
      1000 + Math.random() * 1500,
    );
  };

  return (
    <>
      <MeditationParticles />
      <div className="relative z-10 flex h-screen flex-col bg-transparent">
        <Header />

        {/* <ConsultationType
          selectedType={consultationType}
          onSelectType={setConsultationType}
        /> */}

        <div
          ref={chatContainerRef}
          className="chat-scrollbar flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
        </div>

        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </>
  );
}
