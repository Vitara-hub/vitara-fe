// src/components/Sidebar.tsx
import { LayoutDashboard, BookHeart, Activity, MessageCircle, User, LucideIcon } from 'lucide-react';
import VitaraLogo from '@/components/ui/VitaraLogo';
import { ViewType } from '@/App'; // Import strict ViewType dari App.tsx

interface SidebarProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

// Interface untuk struktur Menu
interface MenuItem {
  id: ViewType;
  icon: LucideIcon;
  label: string;
}

export default function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'logbook', icon: BookHeart, label: 'Logbook' },
    { id: 'activity', icon: Activity, label: 'Aktivitas' },
    { id: 'chat', icon: MessageCircle, label: 'AI Chat' },
    { id: 'profile', icon: User, label: 'Profil' }
  ];

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-full bg-[#FAF9F6] dark:bg-[#121413] border-r border-[#E8F0EA] dark:border-stone-800/50 py-8 px-5 transition-colors duration-300 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* 1. Header & Logo */}
      <div className="flex items-center gap-3 px-3 mb-10 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentView('dashboard')}>
        <VitaraLogo className="text-3xl" />
      </div>

      {/* 2. Menu Navigasi */}
      <nav className="flex flex-col gap-2 flex-1">
        <p className="text-[11px] font-extrabold text-[#8CAAB8] dark:text-stone-500 uppercase tracking-widest px-3 mb-2">Menu Utama</p>
        
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`relative flex items-center gap-3 w-full px-4 py-3.5 rounded-[16px] text-[14px] font-bold transition-all duration-300 overflow-hidden group focus:outline-none ${
                isActive 
                  ? 'text-[#2B4B3D] dark:text-[#8CE0A7] bg-[#E8F0EA] dark:bg-[#1A2620]/60 shadow-sm' 
                  : 'text-[#647C73] dark:text-stone-400 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/40 hover:text-[#2B4B3D] dark:hover:text-stone-200'
              }`}
            >
              {/* Highlight bar kiri saat aktif */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#1DB38A] dark:bg-[#8CE0A7] rounded-r-full"></div>
              )}
              
              <item.icon 
                size={20} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
              />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
}