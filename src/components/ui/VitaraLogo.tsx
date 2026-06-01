// src/components/VitaraLogo.tsx
import { useCallback, useState, useEffect } from 'react';

interface VitaraLogoProps {
  className?: string;
  autoPlay?: boolean;       
  loopInterval?: number;    
}

export default function VitaraLogo({ 
  className = "text-3xl", 
  autoPlay = false, 
  loopInterval = 2500 
}: VitaraLogoProps) {
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 2200);
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const startTimeout = setTimeout(triggerAnimation, 0);
    const interval = setInterval(() => {
      triggerAnimation();
    }, loopInterval);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
    };
  }, [autoPlay, loopInterval, triggerAnimation]);

  const handleLogoClick = () => {
    if (!autoPlay && !isAnimating) {
      triggerAnimation();
    }
  };

  return (
    <div 
      onClick={handleLogoClick}
      className={`flex items-baseline font-black tracking-tight select-none ${autoPlay ? 'cursor-default' : 'cursor-pointer'} ${className}`} 
      style={{ fontFamily: '"Nunito", "Quicksand", system-ui, sans-serif' }}
    >
      <span 
        className={`text-[#2B4B3D] dark:text-stone-50 ${isAnimating ? 'anim-v-float opacity-0' : ''}`} 
        style={{ zIndex: 20 }}
      >
        v
      </span>
      
      <div className="flex flex-col items-center justify-end mx-[0.05em] relative h-[1em] -translate-y-[0.7em]">
        <div 
          className={`relative w-[0.35em] h-[0.28em] bg-[#8CE0A7] mb-[0.08em] rounded-[48%_52%_40%_40%/55%_55%_35%_35%] shadow-sm flex items-center justify-center gap-[10%] origin-center
          ${isAnimating ? 'anim-dot-flip opacity-0' : 'animate-[slimeDotBounce_2.5s_ease-in-out_infinite]'}`}
        >
          <div className={`absolute -top-[0.25em] left-[0.05em] w-[0.2em] h-[0.3em] z-10 origin-bottom ${isAnimating ? 'anim-ahoge-soft' : ''}`}>
             <svg viewBox="0 0 40 40" className="overflow-visible">
                <path d="M 10,12 C 12,25 18,34 20,34 C 22,34 28,25 30,12" fill="none" stroke="#8CE0A7" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
          </div>

          <div className="w-[15%] h-[15%] bg-[#1A3024] rounded-full mt-[5%]"></div>
          <div className="w-[15%] h-[15%] bg-[#1A3024] rounded-full mt-[5%]"></div>
        </div>
        
        <div className={`w-[0.2em] h-[0.52em] bg-[#2B4B3D] dark:bg-stone-50 rounded-[0.08em] ${isAnimating ? 'anim-letter opacity-0' : ''}`} style={{ animationDelay: '0.1s' }}></div>
      </div>
      
      <span className={`text-[#2B4B3D] dark:text-stone-50 ${isAnimating ? 'anim-letter opacity-0' : ''}`} style={{ animationDelay: '0.2s' }}>t</span>
      <span className={`text-[#2B4B3D] dark:text-stone-50 ${isAnimating ? 'anim-letter opacity-0' : ''}`} style={{ animationDelay: '0.3s' }}>a</span>
      <span className={`text-[#2B4B3D] dark:text-stone-50 ${isAnimating ? 'anim-letter opacity-0' : ''}`} style={{ animationDelay: '0.4s' }}>r</span>
      <span className={`text-[#2B4B3D] dark:text-stone-50 ${isAnimating ? 'anim-letter opacity-0' : ''}`} style={{ animationDelay: '0.5s' }}>a</span>

      <style>{`
        @keyframes slimeDotBounce { 
          0%, 100% { transform: translateY(0) scale(1); } 
          50% { transform: translateY(-20%) scaleX(0.9) scaleY(1.1); } 
        }
        @keyframes letterAppear { 
          0% { opacity: 0; transform: translateY(0.4em) scale(0.8); } 
          60% { opacity: 1; transform: translateY(-0.1em) scale(1.1); } 
          100% { opacity: 1; transform: translateY(0) scale(1); } 
        }
        @keyframes slimePopAndFlip { 
          0% { opacity: 0; transform: translateY(0.5em) scale(0.5) rotate(0deg); } 
          15% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); } 
          40% { transform: translateY(-1.5em) scale(1) rotate(-180deg); } 
          70% { transform: translateY(0) scale(1) rotate(-360deg); } 
          85% { transform: translateY(0.1em) scaleY(0.7) scaleX(1.3) rotate(-360deg); } 
          100% { opacity: 1; transform: translateY(0) scaleY(1) scaleX(1) rotate(-360deg); } 
        }
        @keyframes ahogeSoftTrick { 
          0%, 39% { transform: scale(1); } 
          40% { transform: scale(0.5) translateY(0.1em); } 
          85% { transform: scale(0.5) translateY(0.1em); } 
          95% { transform: scale(1.2); } 
          100% { transform: scale(1); } 
        }
        @keyframes vFloatFromSlime {
          0% { opacity: 0; transform: translate(1em, -1.8em) scale(0) rotate(15deg); color: #8CE0A7; }
          10% { opacity: 1; transform: translate(0.8em, -2em) scale(0.6) rotate(10deg); color: #8CE0A7; }
          60% { opacity: 1; transform: translate(0.4em, -1em) scale(0.9) rotate(-10deg); color: #8CE0A7; }
          100% { opacity: 1; transform: translate(0, 0) scale(1) rotate(0deg); }
        }
        .anim-letter { animation: letterAppear 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .anim-dot-flip { animation: slimePopAndFlip 1.2s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; animation-delay: 0.6s; }
        .anim-v-float { animation: vFloatFromSlime 0.8s ease-out forwards; animation-delay: 1.05s; }
      `}</style>
    </div>
  );
}