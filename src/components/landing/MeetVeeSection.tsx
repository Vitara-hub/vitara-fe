// src/components/landing/MeetVeeSection.tsx
import { Heart } from 'lucide-react';

interface TooltipTextProps {
  text: string;
  tooltip: string;
}

const TooltipText = ({ text, tooltip }: TooltipTextProps) => (
  <span className="relative group inline-block border-b border-dotted border-[#8CAAB8] cursor-help transition-colors hover:border-[#1DB38A] dark:hover:border-[#8CE0A7]">
    {text}
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] whitespace-normal px-3 py-2 bg-white/90 dark:bg-[#1A1D1B]/90 backdrop-blur-md border border-[#E8F0EA] dark:border-stone-800 text-[#2B4B3D] dark:text-stone-300 text-[10px] font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50 text-center">
      {tooltip}
    </span>
  </span>
);

export default function MeetVeeSection() {
  return (
    <div className="bg-[#1DB38A] dark:bg-[#1A2620] w-full relative overflow-hidden shrink-0 transition-colors duration-300">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px] animate-[pulse_4s_ease-in-out_infinite]"></div>
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24 relative z-20">
        <div className="md:flex md:items-center md:gap-8 lg:gap-16">
          
          <div className="md:w-1/2 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 ease-out z-20 relative">
            <div className="glass-noise w-[52px] md:w-[72px] h-[52px] md:h-[72px] bg-white/20 backdrop-blur-xl border border-white/20 rounded-[16px] md:rounded-[24px] flex items-center justify-center mb-5 md:mb-8 text-white shadow-lg md:cursor-none cursor-default">
              <Heart className="relative z-10 w-7 h-7 md:w-10 md:h-10 animate-pulse" strokeWidth={2.5} />
            </div>
            <h2 className="text-[32px] md:text-[52px] font-black text-white tracking-[-0.02em] mb-6 leading-tight">Meet Vee.</h2>
            <div className="text-white/90 text-[15px] md:text-[18px] font-medium leading-[1.75] space-y-4 md:space-y-6">
              <p>Bukan sekadar maskot yang lucu.</p>
              <p>Vee mencerminkan kondisi tubuh dan pikiranmu secara <TooltipText text="real-time" tooltip="Berubah langsung detik itu juga tanpa perlu kamu reload halamannya." />. Kurang tidur? Vee ikut lesu. Hari yang baik? Vee ikut bersinar.</p>
              <p className="font-extrabold text-white text-[16px] md:text-[22px] leading-snug">Lewat Vee, kamu belajar membaca dirimu sendiri tanpa harus jadi ahli kesehatan dulu.</p>
            </div>
          </div>

          <div className="md:w-1/2 mt-12 md:mt-0 flex justify-center items-center reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 delay-200 ease-out">
              <div id="vee-magnet-zone" className="relative w-full max-w-[320px] aspect-square flex flex-col items-center justify-center bg-white/5 dark:bg-black/20 rounded-[48px] border border-white/10 backdrop-blur-md shadow-2xl p-8 transition-transform duration-300 hover:scale-105 group">
                <p className="text-white/20 group-hover:text-white/60 transition-colors text-sm font-bold tracking-widest uppercase absolute top-10 pointer-events-none">Tarik Vee Kesini!</p>
                <div className="absolute bottom-12 w-[60%] h-4 bg-black/20 dark:bg-black/40 rounded-[100%] blur-md pointer-events-none"></div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}