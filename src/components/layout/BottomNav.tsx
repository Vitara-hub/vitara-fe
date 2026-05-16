// src/components/BottomNav.tsx
import { Home, BarChart2, MessageCircle, User, Plus, LucideIcon } from 'lucide-react';
import { ViewType } from '@/App'; // Import tipe ViewType dari root

interface BottomNavProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
}

// Interface untuk elemen navigasi
interface NavItem {
  id: ViewType;
  icon: LucideIcon;
  label: string;
}

export default function BottomNav({ currentView, setCurrentView }: BottomNavProps) {
  const leftItems: NavItem[] = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'activity', icon: BarChart2, label: 'Activity' }
  ];

  const rightItems: NavItem[] = [
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const renderNavButton = (item: NavItem) => {
    const isActive = currentView === item.id;
    return (
      <button key={item.id} onClick={() => setCurrentView(item.id)} className="flex flex-col items-center gap-1 w-12">
        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors duration-300 ${isActive ? 'text-[#244135] dark:text-[#8CE0A7]' : 'text-[#A0B0A8] dark:text-stone-500'}`} />
        <span className={`text-[9px] font-black tracking-wide transition-colors duration-300 ${isActive ? 'text-[#244135] dark:text-[#8CE0A7]' : 'text-[#A0B0A8] dark:text-stone-500'}`}>
          {item.label}
        </span>
      </button>
    );
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[380px] z-50 pointer-events-none">
      <div className="bg-white/90 dark:bg-[#1A1D1B]/90 backdrop-blur-xl rounded-[32px] px-5 py-3.5 shadow-[0_12px_40px_rgba(36,65,53,0.15)] border border-white/60 dark:border-stone-800/50 flex justify-between items-center relative pointer-events-auto">
        <div className="flex gap-4 sm:gap-6">{leftItems.map(renderNavButton)}</div>
        <button
          onClick={() => setCurrentView('logbook')}
          className={`absolute left-1/2 -translate-x-1/2 -top-5 w-16 h-16 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(36,65,53,0.25)] transition-all duration-300 hover:scale-105 active:scale-95 ${currentView === 'logbook' ? 'bg-[#8CE0A7] text-[#244135] dark:bg-[#8CE0A7] dark:text-[#121413]' : 'bg-[#244135] text-white dark:bg-[#8CE0A7] dark:text-[#121413]'}`}
        >
          <Plus size={32} strokeWidth={2.5} />
        </button>
        <div className="flex gap-4 sm:gap-6">{rightItems.map(renderNavButton)}</div>
      </div>
    </div>
  );
}