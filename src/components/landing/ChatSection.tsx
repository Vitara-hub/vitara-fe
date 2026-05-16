// src/components/landing/ChatSection.tsx
import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';

export default function ChatSection() {
  const [chatTyping, setChatTyping] = useState<boolean>(true);
  
  useEffect(() => {
    const interval = setInterval(() => setChatTyping(prev => !prev), 4000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#FAF9F6] dark:bg-[#121413] w-full relative overflow-hidden shrink-0 transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24 relative z-20 flex flex-col md:flex-row items-center gap-12 md:gap-24">
        <div className="md:w-[45%] reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 ease-out">
          <div className="inline-block bg-[#8CE0A7]/20 dark:bg-[#8CE0A7]/10 text-[#2B7A50] dark:text-[#8CE0A7] px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-extrabold uppercase tracking-[0.08em] mb-4 border border-[#8CE0A7]/30">Context-Aware AI</div>
          <h2 className="text-[32px] md:text-[48px] font-black text-[#2B4B3D] dark:text-white tracking-[-0.02em] mb-6 leading-[1.1]">Vee mengingat <br/><span className="text-[#1DB38A] dark:text-[#8CE0A7]">segalanya.</span></h2>
          <p className="text-[#8CAAB8] dark:text-stone-400 text-[14px] md:text-[16px] font-medium leading-[1.7] mb-6">Nggak perlu ngulang cerita dari nol. Vee ingat kalau semalam kamu kurang tidur dan makan <i>junk food</i>. Obrolannya jadi terasa personal, relevan, dan <i>to the point</i>.</p>
        </div>
        <div className="md:w-[55%] w-full relative reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 delay-200 ease-out">
          <div className="glass-noise bg-white/60 dark:bg-[#1A1D1B]/60 backdrop-blur-3xl border border-white dark:border-stone-800 rounded-[28px] p-5 md:p-8 shadow-2xl relative z-10 transform md:rotate-[2deg] md:hover:rotate-0 transition-transform duration-500">
            <div className="relative z-10 flex gap-3 items-center mb-6 border-b border-[#E8F0EA] dark:border-stone-800 pb-4">
                <div className="w-10 h-10 rounded-[14px] bg-[#8CE0A7]/20 flex items-center justify-center text-[#2B7A50] dark:text-[#8CE0A7]"><MessageCircle size={20} strokeWidth={2.5} /></div>
                <div>
                  <p className="text-[#2B4B3D] dark:text-stone-100 text-sm font-bold">Chat dengan Vee</p>
                  <p className="text-[#1DB38A] dark:text-[#8CE0A7] text-[10px] font-bold flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-[#1DB38A] dark:bg-[#8CE0A7] animate-pulse"></span> Context active</p>
                </div>
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex justify-end"><div className="bg-[#1DB38A] dark:bg-[#8CE0A7] text-white dark:text-[#121413] p-3.5 px-5 rounded-[22px] rounded-br-sm text-[13px] font-bold max-w-[85%] shadow-md">Vee, kepalaku pusing banget hari ini.</div></div>
              <div className="flex justify-start relative">
                <div className="bg-white dark:bg-stone-800 text-[#2B4B3D] dark:text-stone-100 p-3.5 px-5 rounded-[22px] rounded-bl-sm text-[13px] font-medium max-w-[90%] shadow-md leading-relaxed border border-white/50 dark:border-transparent min-w-[60px] min-h-[44px] flex items-center transition-all duration-500 overflow-hidden">
                  {chatTyping ? (
                    <div className="flex gap-1 items-center h-full px-1 w-8 justify-center animate-fade-in-up">
                      <div className="w-1.5 h-1.5 bg-[#8CAAB8] rounded-full typing-dot"></div><div className="w-1.5 h-1.5 bg-[#8CAAB8] rounded-full typing-dot"></div><div className="w-1.5 h-1.5 bg-[#8CAAB8] rounded-full typing-dot"></div>
                    </div>
                  ) : (
                    <span className="animate-fade-in-up inline-block">
                      Pantesan! Semalem kan kamu <b className="text-[#1DB38A] dark:text-[#8CE0A7]">cuma tidur 4 jam</b>, terus jam 2 siang tadi <b className="text-[#B39200] dark:text-[#FFD966]">makan mie instan</b> doang. Yuk istirahat bentar, minum air putih ya?
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 -left-2 md:-left-8 bg-[#FF9F66] text-white dark:text-[#2A1E18] text-[11px] font-black px-5 py-2.5 rounded-full shadow-xl transform md:rotate-[-8deg] animate-float-smooth z-20">Terkoneksi ke data tidur & nutrisi</div>
        </div>
      </div>
    </div>
  );
}