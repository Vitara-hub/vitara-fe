// src/components/chat/MessageList.tsx
import { RefObject } from 'react';
import Skeleton from '@/components/ui/Skeleton';
import type { ChatHistoryMessage } from '@/types/api';

export type ChatMessage = ChatHistoryMessage;

interface MessageListProps {
  messages: ChatMessage[];
  isInitialLoading?: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
}

const skeletonBubbles = [
  { side: 'left', width: 'w-3/4', lines: ['w-11/12', 'w-2/3'] },
  { side: 'right', width: 'w-1/2', lines: ['w-4/5'] },
  { side: 'left', width: 'w-2/3', lines: ['w-full', 'w-1/2'] },
  { side: 'right', width: 'w-1/3', lines: ['w-3/4'] },
] as const;

function ChatHistorySkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {skeletonBubbles.map((bubble, index) => {
        const isUser = bubble.side === 'right';

        return (
          <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`${bubble.width} max-w-[80%] p-3.5 space-y-2 shadow-sm border ${
                isUser
                  ? 'bg-[#DDF5E6] dark:bg-[#1A2620] border-[#C8EAD4] dark:border-[#244135] rounded-[24px] rounded-br-sm'
                  : 'bg-white dark:bg-[#1A1D1B] border-[#E8F0EA] dark:border-stone-800 rounded-[28px] rounded-bl-sm rounded-tr-[32px]'
              }`}
            >
              {bubble.lines.map((lineWidth, lineIndex) => (
                <Skeleton key={lineIndex} className={`h-3 ${lineWidth} bg-[#E8F0EA] dark:bg-stone-800`} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MessageList({ messages, isInitialLoading = false, bottomRef }: MessageListProps) {
  // const hasStreamingAiBubble = messages.some((msg) => msg.role === 'ai' && msg.text.trim().length === 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-[160px] no-scrollbar">
      {isInitialLoading ? (
        <ChatHistorySkeleton />
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'ai' && msg.text.trim().length === 0 ? (
              <div className="max-w-[80%] w-[70%] p-3.5 space-y-2 shadow-sm border bg-white dark:bg-[#1A1D1B] border-[#E8F0EA] dark:border-stone-800 rounded-[28px] rounded-bl-sm rounded-tr-[32px]">
                <Skeleton className="h-3 w-11/12 bg-[#E8F0EA] dark:bg-stone-800" />
                <Skeleton className="h-3 w-2/3 bg-[#E8F0EA] dark:bg-stone-800" />
              </div>
            ) : (
              <div className={`max-w-[80%] p-3.5 text-[14px] font-medium leading-relaxed 
                ${msg.role === 'user' 
                  ? 'bg-[#8CE0A7] text-[#1A3024] rounded-[24px] rounded-br-sm shadow-sm' 
                  : 'bg-white dark:bg-[#1A1D1B] text-[#2B4B3D] dark:text-stone-100 rounded-[28px] rounded-bl-sm rounded-tr-[32px] shadow-sm border border-[#E8F0EA] dark:border-stone-800' 
                }`}>
                {msg.text}
              </div>
            )}
            
            {msg.role === 'ai' && msg.recommendations && msg.recommendations.length > 0 && (
              <div className="mt-2 ml-2 flex flex-col gap-1.5 max-w-[80%]">
                {msg.recommendations.map((rec, idx) => (
                  <div key={idx} className="text-[11px] font-bold text-[#4A7A8C] dark:text-[#8CAAB8] bg-[#EEF2F5] dark:bg-[#1A1D20] px-3 py-1.5 rounded-[12px] border border-[#D5E5DB] dark:border-stone-700/50">
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
