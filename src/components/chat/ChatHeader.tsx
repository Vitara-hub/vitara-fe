// src/components/chat/ChatHeader.tsx
import VeeMascot from '@/components/mascot/VeeMascot';
import { VeeHealthStatus } from '@/store/useStore';

interface ChatHeaderProps {
  veeHealth: VeeHealthStatus;
  isLoading: boolean;
}

export default function ChatHeader({ veeHealth, isLoading }: ChatHeaderProps) {
  return (
    <div className="bg-white/80 dark:bg-[#1A1D1B]/80 backdrop-blur-md p-4 flex items-center gap-4 shadow-sm shrink-0 z-20 sticky top-0">
      <div className="w-12 h-12 rounded-full bg-[#E8F0EA] dark:bg-[#1A2620] flex items-center justify-center overflow-hidden border border-[#D5E5DB] dark:border-stone-800">
         <VeeMascot scale={0.4} veeHealth={veeHealth} isTyping={isLoading} />
      </div>
      <div>
        <h2 className="font-bold text-[#2B4B3D] dark:text-stone-50 text-sm">Vee Assistant</h2>
        <p className="text-[11px] text-[#8CAAB8] capitalize">Status: {veeHealth === 'waiting' ? 'Offline' : veeHealth}</p>
      </div>
    </div>
  );
}