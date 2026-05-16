// src/components/profile/ProfileMenu.tsx
import { User, Settings, LogOut } from 'lucide-react';

interface ProfileMenuProps {
  handleLogout: () => void;
}

export default function ProfileMenu({ handleLogout }: ProfileMenuProps) {
  return (
    <div className="space-y-3">
      <h3 className="px-2 text-[11px] font-bold text-[#8CAAB8] uppercase tracking-[0.2em]">Pengaturan</h3>
      
      <div className="bg-white dark:bg-[#1A1D1B] rounded-[28px] border border-[#E8F0EA] dark:border-stone-800 overflow-hidden shadow-sm">
        <button className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 transition-colors border-b border-[#F4F6F5] dark:border-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FAF9F6] dark:bg-stone-800 rounded-xl text-[#2B4B3D] dark:text-[#8CE0A7]"><User size={18}/></div>
            <span className="text-sm font-semibold text-[#2B4B3D] dark:text-stone-200">Informasi Pribadi</span>
          </div>
        </button>
        
        <button className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 transition-colors border-b border-[#F4F6F5] dark:border-stone-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FAF9F6] dark:bg-stone-800 rounded-xl text-[#2B4B3D] dark:text-[#8CE0A7]"><Settings size={18}/></div>
            <span className="text-sm font-semibold text-[#2B4B3D] dark:text-stone-200">Preferensi Aplikasi</span>
          </div>
        </button>

        <button onClick={handleLogout} className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500"><LogOut size={18}/></div>
            <span className="text-sm font-semibold text-red-500">Keluar dari Akun</span>
          </div>
        </button>
      </div>
    </div>
  );
}