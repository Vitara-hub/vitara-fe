// src/components/landing/HeroSection.tsx
import { useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
import { ArrowRight, Brain, Activity, Utensils, Moon, Sun, Plus, Heart, ChevronDown } from 'lucide-react';
import VitaraLogo from '@/components/ui/VitaraLogo';

interface HeroSectionProps {
  onEnter: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function HeroSection({ onEnter, isDarkMode, toggleDarkMode }: HeroSectionProps) {
  // 1. Ketatkan tipe Ref ke HTMLDivElement
  const heroObjectRef = useRef<HTMLDivElement>(null); 
  
  // 2. Ketatkan tipe state transform
  const [btnTransform, setBtnTransform] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 3. Ketatkan tipe MouseEvent untuk interaksi 3D
  const handleHeroObjectMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!heroObjectRef.current) return;
    heroObjectRef.current.style.transition = 'none';
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.08; 
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.08;
    heroObjectRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) rotateX(${-y * 0.15}deg) rotateY(${x * 0.15}deg)`;
  };

  const handleHeroObjectMouseLeave = () => {
    if (!heroObjectRef.current) return;
    heroObjectRef.current.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    heroObjectRef.current.style.transform = `translate3d(0px, 0px, 0) rotateX(0deg) rotateY(0deg)`;
  };

  const handleBtnMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setBtnTransform({ 
      x: (e.clientX - rect.left - rect.width / 2) * 0.3, 
      y: (e.clientY - rect.top - rect.height / 2) * 0.3 
    });
  };

  return (
    <div className="min-h-[95vh] flex flex-col relative shrink-0 border-b border-[#E8F0EA] dark:border-stone-800 overflow-hidden">
      {/* (Semua elemen SVG dekoratif, div background, animasi wipe-in dll, dipertahankan sesuai aslinya) */}
      <div className="absolute top-[45%] left-[30%] w-[60vw] h-[60vw] bg-[#1DB38A] dark:bg-[#8CE0A7] rounded-full blur-[120px] animate-zen-breathe pointer-events-none z-0"></div>
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Plus className="absolute top-[20%] right-[15%] text-[#FFD966] md:scale-150 animate-spin" style={{ animationDuration: '12s' }} size={20} strokeWidth={4} />
        <div className="absolute bottom-[25%] left-[20%] w-4 h-4 rounded-full bg-[#FF9F66]/80 animate-float-smooth blur-[1px]"></div>
        <div className="absolute top-[40%] left-[10%] w-2 h-2 rounded-full bg-[#8CE0A7] animate-pulse"></div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 pt-10 pb-12 flex flex-col h-full flex-1 relative z-20">
        <div className="flex justify-between items-center mb-auto relative z-20 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 ease-out">
          <div className="hover:scale-105 transition-transform md:cursor-none cursor-default"><VitaraLogo className="text-2xl md:text-3xl" /></div>
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={toggleDarkMode} className="glass-noise w-[34px] h-[34px] rounded-full bg-white/40 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-stone-700/50 flex items-center justify-center text-[#2B4B3D] dark:text-stone-300 shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#1DB38A] transition-all md:cursor-none cursor-pointer">
              {isDarkMode ? <Sun size={14} className="relative z-10" /> : <Moon size={14} className="relative z-10" />}
            </button>
            <div className="glass-noise group relative overflow-hidden text-[10px] md:text-xs font-black uppercase tracking-widest text-[#2B4B3D]/60 dark:text-stone-300 bg-white/40 dark:bg-black/30 backdrop-blur-xl border border-white/50 dark:border-stone-700/50 px-4 py-1.5 rounded-full shadow-sm w-[120px] text-center h-[34px]">
              <span className="absolute inset-0 flex items-center justify-center transition-transform duration-300 group-hover:-translate-y-full z-10">EST. 2026</span>
              <span className="absolute inset-0 flex items-center justify-center translate-y-full transition-transform duration-300 group-hover:translate-y-0 text-[#1DB38A] dark:text-[#8CE0A7] z-10">Built with ❤️</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center flex-1 relative z-20 mt-8 md:mt-0">
            <div className="w-full md:w-[60%] lg:w-1/2 flex flex-col items-center text-center md:items-start md:text-left z-30">
              <p className="text-[11px] md:text-[13px] font-extrabold text-[#1DB38A] dark:text-[#8CE0A7] tracking-[0.1em] uppercase mb-3 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 delay-100 ease-out">Vitara Ecosystem</p>
              <h1 className="text-[42px] sm:text-[48px] md:text-[56px] lg:text-[76px] font-black leading-[1.04] tracking-tight mb-4 md:mb-6 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 delay-200 ease-out">
                <span className="text-[#2B4B3D] dark:text-stone-50">Know yourself</span><br/>
                <span className="text-[#2B4B3D] dark:text-stone-50">feel </span>
                <span className="relative inline-block">
                  <span className="text-transparent" style={{ WebkitTextStroke: '2px rgba(140, 224, 167, 0.4)' }}>better.</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-[#1DB38A] to-[#8CE0A7] bg-clip-text text-transparent animate-wipe-in" style={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)' }}>better.</span>
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#8CE0A7]/30 dark:text-[#8CE0A7]/30 animate-wipe-in" style={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)' }} viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0,10 Q50,20 100,10" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/></svg>
                </span>
              </h1>
              <p className="text-[14px] md:text-[16px] font-medium text-[#8CAAB8] dark:text-stone-400 max-w-[280px] md:max-w-[85%] leading-[1.65] reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 delay-300 ease-out">
                Tidur, makan, suasana hati, energi semuanya terhubung. Vitara membantu kamu melihat polanya, satu hari dalam satu waktu.
              </p>
              <div className="hidden md:inline-block mt-10 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 delay-500 ease-out p-6 md:-ml-6" onMouseMove={handleBtnMouseMove} onMouseLeave={() => setBtnTransform({x:0, y:0})}>
                <button onClick={onEnter} style={{ transform: `translate(${btnTransform.x}px, ${btnTransform.y}px)` }} className="group relative w-max py-4 px-8 rounded-[24px] bg-[#2B4B3D] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-[16px] flex items-center gap-3 shadow-[0_8px_30px_rgba(43,75,61,0.15)] hover:shadow-[0_0_24px_rgba(140,224,167,0.4)] focus:outline-none focus:ring-2 focus:ring-[#1DB38A] focus:ring-offset-2 dark:focus:ring-offset-[#121413] transition-all duration-200 ease-out z-10 md:cursor-none cursor-pointer">
                  <span>Get Started</span>
                  <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>

            <div className="w-full flex mt-12 md:mt-0 md:w-[40%] lg:w-1/2 justify-center items-center relative z-20 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-1000 delay-300 ease-out">
              <div className="relative w-full max-w-[320px] md:max-w-[500px] h-[320px] md:h-[500px] flex items-center justify-center md:cursor-none scale-[0.85] sm:scale-100 md:scale-100" onMouseMove={handleHeroObjectMouseMove} onMouseLeave={handleHeroObjectMouseLeave} style={{ perspective: '1000px' }}>
                <div ref={heroObjectRef} className="relative flex items-center justify-center animate-float-smooth w-full h-full">
                  <div className="absolute w-[120px] md:w-[200px] h-[120px] md:h-[200px] bg-[#1DB38A]/30 dark:bg-[#8CE0A7]/20 rounded-full blur-[40px] md:blur-[60px]"></div>
                  
                  <div className="relative glass-noise w-[180px] h-[240px] md:w-[260px] md:h-[340px] lg:w-[300px] lg:h-[400px] rounded-[32px] md:rounded-[48px] bg-white/40 dark:bg-[#1A1D1B]/40 backdrop-blur-3xl border-2 border-white/60 dark:border-stone-700/50 shadow-[0_30px_80px_rgba(29,179,138,0.2)] dark:shadow-none flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1DB38A]/5 dark:to-[#8CE0A7]/5 pointer-events-none"></div>

                    <div className="absolute top-[12%] left-[12%] w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-[14px] md:rounded-2xl bg-[#E8F0EA] dark:bg-stone-800 shadow-xl flex items-center justify-center text-[#2B7A50] dark:text-[#8CE0A7] animate-float-smooth" style={{ animationDuration: '4.5s' }}><Brain size={20} className="md:w-6 md:h-6" strokeWidth={2.5} /></div>
                    <div className="absolute top-[15%] right-[12%] w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-[14px] md:rounded-2xl bg-[#FFF0E6] dark:bg-stone-800 shadow-xl flex items-center justify-center text-[#FF9F66] animate-float-smooth" style={{ animationDirection: 'reverse', animationDuration: '5s' }}><Activity size={20} className="md:w-6 md:h-6" strokeWidth={2.5} /></div>
                    <div className="absolute bottom-[18%] left-[15%] w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-[14px] md:rounded-2xl bg-[#FFF9E6] dark:bg-stone-800 shadow-xl flex items-center justify-center text-[#FFD966] animate-float-smooth" style={{ animationDelay: '1s', animationDuration: '4s' }}><Utensils size={20} className="md:w-6 md:h-6" strokeWidth={2.5} /></div>
                    <div className="absolute bottom-[15%] right-[15%] w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-[14px] md:rounded-2xl bg-[#EEF2F5] dark:bg-stone-800 shadow-xl flex items-center justify-center text-[#A3C4D1] animate-float-smooth" style={{ animationDirection: 'reverse', animationDelay: '0.5s', animationDuration: '5.5s' }}><Moon size={20} className="md:w-6 md:h-6" strokeWidth={2.5} /></div>

                    <div className="w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full bg-gradient-to-tr from-[#1DB38A] to-[#8CE0A7] shadow-[0_0_40px_rgba(140,224,167,0.6)] flex items-center justify-center text-white relative z-10 mt-2">
                       <Heart size={28} className="md:w-11 md:h-11 animate-pulse" strokeWidth={2.5} />
                       <div className="absolute inset-0 rounded-full border-4 border-white/20 scale-110 animate-custom-ping"></div>
                    </div>
                  </div>

                  <div className="absolute w-[260px] h-[260px] md:w-[360px] md:h-[360px] lg:w-[440px] lg:h-[440px] rounded-full border border-dashed border-[#1DB38A]/30 dark:border-[#8CE0A7]/20 animate-orbit pointer-events-none"></div>
                  <div className="absolute w-[320px] h-[320px] md:w-[440px] md:h-[440px] lg:w-[540px] lg:h-[540px] rounded-full border border-[#8CAAB8]/20 dark:border-stone-700/30 animate-orbit-reverse pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#FFD966] shadow-[0_0_15px_#FFD966]"></div>
                  </div>
                </div>
              </div>
            </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-float-smooth pointer-events-none">
          <span className="text-[10px] font-bold text-[#8CAAB8] dark:text-stone-400 tracking-widest uppercase">Scroll Down</span>
          <ChevronDown size={16} className="text-[#8CAAB8] dark:text-stone-400" />
        </div>

        <div className="mt-auto relative z-20 pt-8 md:hidden reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 delay-500 ease-out pb-8">
          <button onClick={onEnter} className="group w-full py-4 rounded-[22px] bg-[#2B4B3D] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-[15px] flex justify-between items-center px-6 shadow-[0_8px_30px_rgba(43,75,61,0.15)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#1DB38A] transition-all duration-300 cursor-pointer">
            <span>Get Started</span>
            <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}