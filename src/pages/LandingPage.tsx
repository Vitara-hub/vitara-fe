// src/pages/LandingPage.tsx
import { useRef, useEffect, MouseEvent as ReactMouseEvent } from 'react';
import useVeePhysics from '@/hooks/useVeePhysics';

import VeeMascot from '@/components/mascot/VeeMascot';

// Import komponen-komponen section
import HeroSection from '@/components/landing/HeroSection';
import MeetVeeSection from '@/components/landing/MeetVeeSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import ChatSection from '@/components/landing/ChatSection';
import SecuritySection from '@/components/landing/SecuritySection';
import FooterCTA from '@/components/landing/FooterCTA';

interface LandingPageProps {
  onEnter: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function LandingPage({ onEnter, isDarkMode, toggleDarkMode }: LandingPageProps) {
  // 1. Tipe Ref yang lebih ketat
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const customCursorRef = useRef<HTMLDivElement>(null);

  // 2. Fisika Mascot Vee (Hooks)
  const {
    veeRef,
    eyePosition,
    isMouseDown,
    isVeeBooped,
    isVeeTickled,
    veeHandlers,
    isDizzy,
  } = useVeePhysics();
  const landingVeeHealth = isDizzy || isMouseDown ? 'stressed' : 'fresh';

  // 3. Scroll Reveal Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-12');
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // 4. Global Mouse Handler Tipe
  const handleGlobalMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (customCursorRef.current) {
      customCursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
    }
  };

  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) return;
    link.href = "/favicon.svg";
  }, []);

  return (
    <div
      id="landing-scroll-container"
      ref={scrollContainerRef}
      onMouseMove={handleGlobalMouseMove}
      className="h-full overflow-y-auto no-scrollbar flex flex-col relative bg-[#FAF9F6] dark:bg-[#121413] w-full scroll-smooth transition-colors duration-300 md:cursor-none"
    >
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch"/></filter></svg>
      {/* CSS Animations */}
      <style>{`
        @keyframes float-smooth { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-15px); } }
        .animate-float-smooth { animation: float-smooth 4s ease-in-out infinite; }
        @keyframes tickle { 0%, 100% { transform: rotate(0deg) scaleX(1) scaleY(1); } 25% { transform: rotate(-4deg) scaleX(1.05) scaleY(0.95); } 50% { transform: rotate(4deg) scaleX(0.95) scaleY(1.05); } 75% { transform: rotate(-2deg) scaleX(1.02) scaleY(0.98); } }
        .animate-tickle { animation: tickle 0.4s ease-in-out infinite; }
        .typing-dot { animation: typing 1.4s infinite ease-in-out both; }
        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
        @keyframes wipe-in { 0% { clip-path: polygon(0 0, 0 0, 0 100%, 0% 100%); } 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0% 100%); } }
        .animate-wipe-in { animation: wipe-in 1.2s cubic-bezier(0.85, 0, 0.15, 1) forwards; animation-delay: 0.8s; }
        @keyframes zen-breathe { 0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.1; } 21% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.25; } 58% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.25; } }
        .animate-zen-breathe { animation: zen-breathe 19s ease-in-out infinite; }
        @keyframes custom-ping { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
        .animate-custom-ping { animation: custom-ping 2.5s cubic-bezier(0,0,0.2,1) infinite; }
        @keyframes orbit { 100% { transform: rotate(360deg); } }
        @keyframes orbit-reverse { 100% { transform: rotate(-360deg); } }
        .animate-orbit { animation: orbit 40s linear infinite; }
        .animate-orbit-reverse { animation: orbit-reverse 50s linear infinite; }
        .glass-noise { position: relative; }
        .glass-noise::before { content: ""; position: absolute; inset: 0; opacity: 0.05; mix-blend-mode: overlay; filter: url(#noiseFilter); pointer-events: none; border-radius: inherit; z-index: 0; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(5px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <div ref={customCursorRef} className="hidden md:flex fixed pointer-events-none z-[999] w-8 h-8 rounded-full bg-[#1DB38A]/40 dark:bg-[#8CE0A7]/40 blur-md transition-transform duration-75 ease-out items-center justify-center mix-blend-multiply dark:mix-blend-screen top-0 left-0">
        <div className="w-1.5 h-1.5 bg-[#2B4B3D] dark:bg-white rounded-full"></div>
      </div>

      {/* VEE MASCOT TINGKAT ROOT */}
      <div
        ref={veeRef}
        {...veeHandlers}
        className={`fixed top-0 left-0 w-[160px] h-[160px] md:w-[240px] md:h-[240px] flex items-center justify-center z-[100] touch-none select-none drop-shadow-2xl ${isMouseDown ? 'cursor-grabbing' : 'cursor-grab'} opacity-100`}
      >
        <div className={`transition-transform duration-200 ${isMouseDown ? 'scale-90' : 'scale-100'}`}>
          <div className={`origin-bottom transition-transform duration-200 ${isVeeBooped ? 'scale-x-[1.2] scale-y-[0.8] translate-y-2' : 'scale-100'} ${isVeeTickled && !isVeeBooped ? 'animate-tickle' : ''}`}>
            <VeeMascot
              ignoreSystemStatus={true}
              jumpDirection="none"
              scale={1.5}
              isOffline={false}
              isSyncing={false}
              isEcoMode={false}
              overrideState={landingVeeHealth === 'stressed' ? undefined : { expression: 'fresh', baseColorClass: '#8CE0A7' }}
              veeHealth={landingVeeHealth}
              weight={1}
              eyeLookX={eyePosition.x}
              eyeLookY={eyePosition.y}
            />
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col relative z-10 bg-[#FAF9F6] dark:bg-[#121413] transition-colors duration-300">
        <HeroSection onEnter={onEnter} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <MeetVeeSection />
        <FeaturesSection />
        <ChatSection />
        <SecuritySection />
      </main>
      <FooterCTA onEnter={onEnter} />
    </div>
  );
}
