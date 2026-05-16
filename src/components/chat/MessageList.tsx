// src/components/chat/MessageList.tsx
import { RefObject } from 'react';

// Ekspor tipe agar bisa digunakan di ChatPage
export interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  text: string;
  recommendations?: string[]; // Properti opsional berdasarkan API Contract
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
}

export default function MessageList({ messages, isLoading, bottomRef }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-[160px] no-scrollbar">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-[80%] p-3.5 text-[14px] font-medium leading-relaxed 
            ${msg.role === 'user' 
              ? 'bg-[#8CE0A7] text-[#1A3024] rounded-[24px] rounded-br-sm shadow-sm' 
              : 'bg-white dark:bg-[#1A1D1B] text-[#2B4B3D] dark:text-stone-100 rounded-[28px] rounded-bl-sm rounded-tr-[32px] shadow-sm border border-[#E8F0EA] dark:border-stone-800' 
            }`}>
            {msg.text}
          </div>
          
          {/* Render Rekomendasi jika ada dari backend */}
          {msg.role === 'ai' && msg.recommendations && msg.recommendations.length > 0 && (
            <div className="mt-2 ml-2 flex flex-col gap-1.5 max-w-[80%]">
              {msg.recommendations.map((rec, idx) => (
                <div key={idx} className="text-[11px] font-bold text-[#4A7A8C] dark:text-[#8CAAB8] bg-[#EEF2F5] dark:bg-[#1A1D20] px-3 py-1.5 rounded-[12px] border border-[#D5E5DB] dark:border-stone-700/50">
                  ✨ {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {/* Indikator Loading */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-[#1A1D1B] rounded-[24px] rounded-bl-sm p-3 shadow-sm border border-[#E8F0EA] flex gap-1.5 items-center">
            <div className="w-2 h-2 rounded-full bg-[#8CE0A7] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#8CE0A7] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-[#8CE0A7] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      {/* Target auto-scroll diletakkan di paling bawah */}
      <div ref={bottomRef} />
    </div>
  );
}