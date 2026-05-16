// src/components/chat/ChatInput.tsx
import { Send } from 'lucide-react';
import { ChangeEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
}

export default function ChatInput({ inputMessage, setInputMessage, handleSend, isLoading }: ChatInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  return (
    <div className="absolute bottom-[100px] left-4 right-4 bg-white/90 backdrop-blur-md dark:bg-[#1A1D1B] p-2 rounded-[24px] shadow-lg flex gap-2 z-20 border border-[#E8F0EA] dark:border-stone-800">
      <input 
        type="text" 
        value={inputMessage} 
        onChange={handleChange} 
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Ceritakan harimu pada Vee..." 
        className="flex-1 bg-transparent px-4 py-2 text-sm font-medium outline-none text-[#2B4B3D] dark:text-stone-100 placeholder-[#A0B0A8] disabled:opacity-50" 
      />
      <button 
        onClick={handleSend} 
        disabled={!inputMessage.trim() || isLoading}
        className="w-11 h-11 rounded-[20px] bg-[#2B4B3D] text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
      >
        <Send size={18} strokeWidth={2.5}/>
      </button>
    </div>
  );
}