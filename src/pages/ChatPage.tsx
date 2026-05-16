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

export default function ChatPage({ veeHealth }: ChatPageProps) {
  // Ambil setVeeState agar bisa mengubah wujud Vee secara global
  const { user, addLog, setVeeState, veeWeight } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([{ 
    id: 1, 
    role: 'ai', 
    text: veeHealth === 'tired' ? 'Halo... aku agak lemes nih karena kita kurang tidur. Kamu ngerasa capek juga nggak?' : 'Halo! Aku Vee. Ada yang mau diceritain hari ini?' 
  }]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, isLoading]);

  const handleSend = async () => {
    const textToSubmit = inputMessage.trim();
    if (!textToSubmit || isLoading) return;
    
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: textToSubmit }]);
    setInputMessage(''); 
    setIsLoading(true);

    try {
      const response = await vitaraApi.sendChatMessage({
        user_id: user?.name || 'anonymous_user',
        message: textToSubmit
      });

      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: response.response,
        recommendations: response.recommendations 
      }]);

      addLog({ type: 'chat', summary: `Ngobrol dengan Vee: "${textToSubmit.substring(0, 30)}..."`, syncStatus: 'synced' });

    } catch (error) {
      // 🚀 OFFLINE FIRST: Transparan tanpa error popup.
      console.warn("Chat API Offline:", error);
      
      // Ubah state maskot global jadi waiting (Abu-abu, loading)
      setVeeState('waiting', veeWeight);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now() + 1, 
          role: 'ai', 
          text: 'Sinyalku ke otak AI pusat lagi terputus nih... Pesanmu udah aku simpan, nanti kita bahas lagi kalau sinyalnya udah balik ya! 🥺',
          recommendations: ['Tunggu koneksi stabil']
        }]);
      }, 1000);

      addLog({ 
        type: 'chat', 
        summary: `Ngobrol: "${textToSubmit.substring(0, 30)}..." (Menunggu Sync)`, 
        syncStatus: 'pending' 
      });

    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full relative bg-[#FAF9F6] dark:bg-[#121413] pb-28 md:pb-6 overflow-hidden">
      <ChatHeader veeHealth={veeHealth} isLoading={isLoading} />
      <MessageList messages={messages} isLoading={isLoading} bottomRef={bottomRef} />
      <ChatInput inputMessage={inputMessage} setInputMessage={setInputMessage} handleSend={handleSend} isLoading={isLoading} />
    </div>
  );
}