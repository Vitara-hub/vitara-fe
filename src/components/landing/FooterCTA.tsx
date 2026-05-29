// src/components/landing/FooterCTA.tsx
import { useState, MouseEvent as ReactMouseEvent } from 'react';
import { Smile, ArrowRight } from 'lucide-react';
import VitaraLogo from '@/components/ui/VitaraLogo';

interface FooterCTAProps {
  onEnter: () => void;
}

export default function FooterCTA({ onEnter }: FooterCTAProps) {
  const [footerBtnTransform, setFooterBtnTransform] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const handleFooterBtnMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setFooterBtnTransform({ 
      x: (e.clientX - rect.left - rect.width / 2) * 0.3, 
      y: (e.clientY - rect.top - rect.height / 2) * 0.3 
    });
  };

  return (
    <footer className="w-full shrink-0 flex flex-col items-center justify-center text-center py-20 md:py-32 transition-colors duration-300 bg-[#FAF9F6] dark:bg-[#121413] relative z-0">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#E8F0EA] dark:bg-[#1A2620] rounded-full mx-auto mb-6 md:mb-8 flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-[0_4px_20px_rgba(140,224,167,0.2)]">
          <Smile className="w-8 h-8 md:w-10 md:h-10 text-[#1DB38A] dark:text-[#8CE0A7]" strokeWidth={2.5} />
        </div>
        <h2 className="text-[32px] md:text-[52px] font-black text-[#2B4B3D] dark:text-stone-50 tracking-[-0.02em] mb-3 md:mb-4">Start Today.</h2>
        <p className="text-[14px] md:text-[18px] font-medium text-[#8CAAB8] dark:text-stone-400 leading-[1.65] mb-1.5 md:mb-2">Tidak perlu sempurna. Tidak perlu tahu segalanya tentang kesehatanmu.</p>
        <p className="text-[14px] md:text-[18px] font-bold text-[#2B4B3D] dark:text-stone-200">Cukup mulai. Vee akan ikut tumbuh bersamamu.</p>
        
        <div className="mt-8 md:mt-12 p-8 inline-block" onMouseMove={handleFooterBtnMouseMove} onMouseLeave={() => setFooterBtnTransform({x: 0, y: 0})}>
          <button onClick={onEnter} style={{ transform: `translate(${footerBtnTransform.x}px, ${footerBtnTransform.y}px)` }} className="group relative w-max mx-auto py-4 px-10 rounded-[28px] bg-[#2B4B3D] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-[16px] md:text-[18px] flex justify-center items-center gap-3 shadow-[0_8px_30px_rgba(43,75,61,0.15)] hover:shadow-[0_0_24px_rgba(140,224,167,0.4)] focus:outline-none focus:ring-2 focus:ring-[#1DB38A] focus:ring-offset-2 dark:focus:ring-offset-[#121413] transition-all duration-200 ease-out md:cursor-none cursor-pointer">
            Get Started <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
        
        <div className="mt-16 opacity-50 flex justify-center md:cursor-none cursor-default"><VitaraLogo className="text-xl" /></div>
      </div>
    </footer>
  );
}