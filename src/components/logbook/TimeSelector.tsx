// src/components/logbook/TimeSelector.tsx
import { LucideIcon } from 'lucide-react';

interface TimeSelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
}

export default function TimeSelector({ label, value, onChange, icon: Icon }: TimeSelectorProps) {
  return (
    <div className="relative flex-1 bg-white dark:bg-[#1A1D1B] p-4 rounded-[24px] border border-[#E8F0EA] dark:border-stone-800 shadow-sm group hover:border-[#8CE0A7] dark:hover:border-[#2B4B3D] transition-all overflow-hidden cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-[#8CAAB8] uppercase tracking-widest">{label}</p>
        <div className="w-6 h-6 rounded-full bg-[#FAF9F6] dark:bg-stone-800 flex items-center justify-center text-[#2B4B3D] dark:text-[#8CE0A7] group-hover:scale-110 group-hover:bg-[#E8F0EA] dark:group-hover:bg-[#1A2620] transition-all">
          <Icon size={12} strokeWidth={3} />
        </div>
      </div>
      <p className="text-3xl font-black text-[#2B4B3D] dark:text-stone-100 tracking-tighter">
        {value}
      </p>
      {/* Input Asli yang Disembunyikan untuk memunculkan pemilih waktu native OS */}
      <input 
        type="time" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
      />
    </div>
  );
}