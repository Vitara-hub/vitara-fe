// src/pages/ChatPage.tsx
import { useState, useEffect, useRef } from 'react';
import { vitaraApi } from '@/services/api';
import useStore, { VeeHealthStatus } from '@/store/useStore';

import ChatHeader from '@/components/chat/ChatHeader';
import MessageList, { ChatMessage } from '@/components/chat/MessageList';
import ChatInput from '@/components/chat/ChatInput';

interface ChatPageProps {
  veeHealth: VeeHealthStatus;
}

const CHAT_CACHE_TTL = 5 * 60 * 1000;

function isFresh(fetchedAt: number | null, ttl = CHAT_CACHE_TTL) {
  return Boolean(fetchedAt && Date.now() - fetchedAt < ttl);
}

function getGreetingMessage(veeHealth: VeeHealthStatus): ChatMessage {
  return {
    id: 'greeting',
    role: 'ai',
    text: veeHealth === 'tired'
      ? 'Halo... aku agak lemes nih karena kita kurang tidur. Kamu ngerasa capek juga nggak?'
      : 'Halo! Aku Vee. Ada yang mau diceritain hari ini?',
  };
}

function createClientMessageId(prefix: string) {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
  return `${prefix}_${uuid}`;
}

export default function ChatPage({ veeHealth }: ChatPageProps) {
  const {
    addLog,
    setVeeState,
    veeWeight,
    chatMessages,
    setChatMessages,
    refreshDashboardAndActivity,
  } = useStore();

  const hasFreshCache = isFresh(chatMessages.fetchedAt);
  const [messages, setMessages] = useState<ChatMessage[]>(() => chatMessages.data || [getGreetingMessage(veeHealth)]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => !hasFreshCache);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef<boolean>(true);

  useEffect(() => {
    if (hasFreshCache && chatMessages.data) return;

    let isMounted = true;

    const loadHistory = async () => {
      setIsInitialLoading(true);
      try {
        const { messages: history } = await vitaraApi.loadChatHistory();
        if (!isMounted) return;

        const mapped: ChatMessage[] =
          history.length > 0
            ? history.map((item, index) => ({
                id: String(item.id || `remote_${index}`),
                role: item.role === 'assistant' ? 'ai' : 'user',
                text: item.content,
                recommendations: item.recommendations ?? undefined,
              }))
            : [getGreetingMessage(veeHealth)];

        setMessages(mapped);
        setChatMessages(mapped);
      } catch (error) {
        console.warn('Chat history unavailable, using local cache.', error);
        if (!isMounted) return;
        const fallbackMessages = chatMessages.data || [getGreetingMessage(veeHealth)];
        setMessages(fallbackMessages);
        setChatMessages(fallbackMessages);
      } finally {
        if (isMounted) setIsInitialLoading(false);
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [chatMessages.data, hasFreshCache, setChatMessages, veeHealth]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: isInitialMount.current ? 'auto' : 'smooth',
    });

    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [messages, isInitialLoading, isSending]);

  const updateMessages = (updater: (previous: ChatMessage[]) => ChatMessage[]) => {
    setMessages((previous) => {
      const nextMessages = updater(previous);
      setChatMessages(nextMessages);
      return nextMessages;
    });
  };

  const handleSend = async () => {
    const textToSubmit = inputMessage.trim();
    if (!textToSubmit || isSending || isInitialLoading) return;
    
    updateMessages((prev) => [...prev, { id: createClientMessageId('user'), role: 'user', text: textToSubmit }]);
    setInputMessage(''); 
    setIsSending(true);

    const aiMessageId = createClientMessageId('ai');
    updateMessages((prev) => [...prev, { id: aiMessageId, role: 'ai', text: '' }]);

    try {
      const response = await vitaraApi.sendChatMessage(
        { message: textToSubmit },
        (chunkText) => {
          updateMessages((prev) =>
            prev.map((m) => (m.id === aiMessageId ? { ...m, text: chunkText } : m))
          );
        }
      );

      const finalResponseText = response.full_response ?? response.response ?? '';

      updateMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? { ...m, text: finalResponseText, recommendations: response.recommendations }
            : m
        )
      );

      addLog({ type: 'chat', summary: `Ngobrol dengan Vee: "${textToSubmit.substring(0, 30)}..."`, syncStatus: 'synced' });
      void refreshDashboardAndActivity();

    } catch (error) {
      console.warn('Chat API Offline:', error);
      
      setVeeState('waiting', veeWeight);
      
      setTimeout(() => {
        updateMessages((prev) => [...prev, { 
          id: createClientMessageId('ai_fallback'),
          role: 'ai', 
          text: 'Sinyalku ke otak AI pusat lagi terputus nih... Pesanmu udah aku simpan, nanti kita bahas lagi kalau sinyalnya udah balik ya!',
          recommendations: ['Tunggu koneksi stabil']
        }]);
      }, 1000);

      addLog({ 
        type: 'chat', 
        summary: `Ngobrol: "${textToSubmit.substring(0, 30)}..." (Menunggu Sync)`, 
        syncStatus: 'pending',
        pendingPayload: {
          message: textToSubmit,
        },
      });

    } finally { 
      setIsSending(false); 
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full relative bg-[#FAF9F6] dark:bg-[#121413] pb-28 md:pb-6 overflow-hidden">
      <ChatHeader veeHealth={veeHealth} isLoading={isSending || isInitialLoading} />
      <MessageList messages={messages} isInitialLoading={isInitialLoading} bottomRef={bottomRef} />
      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSend={() => { void handleSend(); }}
        isLoading={isSending || isInitialLoading}
      />
    </div>
  );
}
