import { useEffect, useState } from 'react';
import VitaraLogo from '@/components/ui/VitaraLogo';

interface SplashScreenProps {
  onComplete: () => void;
  isEcoMode?: boolean;
}

export default function SplashScreen({ onComplete, isEcoMode = false }: SplashScreenProps) {
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 3500); 
    const removeTimer = setTimeout(() => onComplete(), 4000); 
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#FAF9F6] dark:bg-[#121413] flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/*ECO MODE LOGIC */}
      {!isEcoMode ? (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] bg-[#1DB38A] dark:bg-[#8CE0A7] rounded-full blur-[100px] opacity-20 animate-pulse pointer-events-none"></div>
      ) : (
        <div className="absolute inset-0 bg-[#1DB38A]/5 dark:bg-[#8CE0A7]/5 pointer-events-none"></div>
      )}

      <div className="relative z-10 flex flex-col items-center animate-in duration-700 fade-in zoom-in-75">
        <VitaraLogo className="text-6xl md:text-7xl drop-shadow-lg" autoPlay={true} />
        <p className="mt-4 md:mt-5 text-[11px] md:text-sm font-black tracking-[0.25em] text-[#8CAAB8] dark:text-stone-500 uppercase">
          Ecosystem
        </p>
      </div>
    </div>
  );
}