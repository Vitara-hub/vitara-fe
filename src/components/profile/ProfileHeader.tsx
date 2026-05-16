// src/components/profile/ProfileHeader.tsx
import { Shield } from 'lucide-react';
import VeeMascot from '@/components/mascot/VeeMascot';
import { VeeHealthStatus } from '@/store/useStore';

interface ProfileHeaderProps {
  user: { name: string } | null;
  veeHealth: VeeHealthStatus;
}

export default function ProfileHeader({ user, veeHealth }: ProfileHeaderProps) {
  return (
    <div className="bg-white dark:bg-[#1A1D1B] p-8 flex flex-col items-center border-b border-[#E8F0EA] dark:border-stone-800">
      <div className="relative group">
        <div className="w-24 h-24 rounded-[32px] bg-[#E8F0EA] dark:bg-[#1A2620] flex items-center justify-center border-2 border-[#8CE0A7] overflow-hidden shadow-sm">
           <VeeMascot scale={0.7} veeHealth={veeHealth} />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-[#2B4B3D] text-white p-1.5 rounded-full border-2 border-white shadow-sm">
          <Shield size={14} />
        </div>
      </div>
      
      <h1 className="mt-4 text-xl font-bold text-[#2B4B3D] dark:text-stone-50">
        {user?.name || 'Yunggi'}
      </h1>
      <p className="text-xs font-semibold text-[#8CAAB8] uppercase tracking-wider text-center mt-1">
        Full-Stack Developer & Security Researcher
      </p>
    </div>
  );
}