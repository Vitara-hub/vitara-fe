// src/components/dashboard/DashboardHeader.tsx
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface DashboardHeaderProps {
  user: { name: string } | null;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function DashboardHeader({ user, isDarkMode, toggleDarkMode }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState<string>('Halo');
  const currentDate = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'short' 
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Selamat Pagi');
    else if (hour >= 12 && hour < 15) setGreeting('Selamat Siang');
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, []);

  return (
    <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-[20px] bg-white dark:bg-stone-800 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] shrink-0 group hover:scale-105 transition-transform cursor-pointer">
          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || 'Sarah'}`} alt="Profile" className="group-hover:rotate-6 transition-transform" />
        </div>
        <div>
          <p className="text-[#647C73] dark:text-stone-400 text-xs font-medium mb-0.5">{currentDate}</p>
          <h2 className="text-lg font-extrabold text-[#244135] dark:text-stone-50 leading-none">
            {greeting}, {user?.name || 'Sarah'} 👋
          </h2>
        </div>
      </div>
      <button onClick={toggleDarkMode} className="w-10 h-10 rounded-[16px] bg-white dark:bg-stone-800 flex items-center justify-center text-[#647C73] dark:text-stone-400 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:scale-105 hover:text-[#1DB38A] dark:hover:text-[#8CE0A7] transition-all">
        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}