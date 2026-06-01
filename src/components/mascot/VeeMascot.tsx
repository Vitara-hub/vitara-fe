// src/components/mascot/VeeMascot.tsx
import React, { useRef, useEffect, useState } from 'react';
import useStore from '@/store/useStore';
import { calculateFinalVeeState } from '@/utils/veeLogic';
import type { DashboardData, VeeOverrideState } from '@/utils/veeLogic';
import type { VeeHealthStatus } from '@/store/useStore';

export interface VeeMascotProps {
  data?: DashboardData;
  overrideState?: VeeOverrideState;
  outfit?: 'default' | 'doctor';
  isTyping?: boolean;
  isEating?: boolean;
  isSleeping?: boolean;
  isSyncing?: boolean;
  isOffline?: boolean;
  veeHealth?: VeeHealthStatus;
  weight?: number;
  scale?: number;
  isWalking?: boolean;
  jumpDirection?: 'fromLeft' | 'fromRight' | 'none' | null;
  eyeLookX?: number;
  eyeLookY?: number;
  isEcoMode?: boolean;
  ignoreSystemStatus?: boolean;
}

export default function VeeMascot({
  data,
  overrideState,
  outfit = 'default',
  isTyping = false,
  isEating = false,
  isSleeping = false,
  isSyncing = false,
  isOffline = false,
  veeHealth = 'fresh',
  weight = 1,
  scale = 1,
  isWalking = false,
  jumpDirection = null,
  eyeLookX = 0,
  eyeLookY = 0,
  isEcoMode = false,
  ignoreSystemStatus = false
}: VeeMascotProps) {
  const faceRef = useRef<HTMLDivElement>(null);
  const isServerDown = useStore((state) => state.isServerDown);

  const [isBrowserOffline, setIsBrowserOffline] = useState<boolean>(() => (
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  ));

  useEffect(() => {
    const handleOnline = () => setIsBrowserOffline(false);
    const handleOffline = () => setIsBrowserOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const offlineActive = !ignoreSystemStatus && (isOffline || isBrowserOffline || isServerDown);
  const isActuallySyncing = !ignoreSystemStatus && !offlineActive && (isSyncing || veeHealth === 'waiting');

  const activeEating = offlineActive ? false : isEating;
  const activeSleeping = offlineActive ? false : isSleeping;
  const activeTyping = offlineActive ? false : isTyping;

  const { baseColorClass = '#8CE0A7', activeTraits = [], expression } = calculateFinalVeeState(veeHealth, data, overrideState);
  const finalExpression = activeSleeping ? 'yawn' : activeEating ? 'hungry' : expression;

  const color = offlineActive ? '#B0C4DE' : baseColorClass;
  const ahogeColor = color;

  const [walkX, setWalkX] = useState<number>(0);
  const [facing, setFacing] = useState<number>(1);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const currentX = useRef<number>(0);
  const targetX = useRef<number>(0);

  useEffect(() => {
    if (!isWalking || isEcoMode || offlineActive || isActuallySyncing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const maxRange = 120;
      const screenRatio = e.clientX / window.innerWidth;
      targetX.current = (screenRatio - 0.5) * maxRange * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const updatePosition = () => {
      const diff = targetX.current - currentX.current;
      if (Math.abs(diff) > 2) {
        currentX.current += diff * 0.06;
        setWalkX(currentX.current);
        setFacing(diff > 0 ? 1 : -1);
        setIsMoving(true);
      } else {
        setIsMoving(false);
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isWalking, isEcoMode, offlineActive, isActuallySyncing]);

  useEffect(() => {
    if (!faceRef.current || offlineActive || isActuallySyncing || activeSleeping) return;
    faceRef.current.style.transform = `translate3d(${eyeLookX * facing}px, ${eyeLookY}px, 0)`;
  }, [eyeLookX, eyeLookY, facing, offlineActive, isActuallySyncing, activeSleeping]);

  const handleMascotTouch = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate && !offlineActive) {
      navigator.vibrate(50);
    }
  };

  const wobbleSpeed = offlineActive ? '6s'
    : activeSleeping ? '5s'
    : (isActuallySyncing && activeTyping) ? '0.5s'
    : isActuallySyncing ? '2.5s'
    : finalExpression === 'fresh' ? '1.2s'
    : activeTyping ? '0.8s'
    : activeEating ? '1.5s'
    : '4s';

  const scaleY = activeEating ? 1.05 : activeSleeping ? 0.92 : 1;
  const strokeColor = "#1A3024";

  return (
    <div
      onClick={handleMascotTouch}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMascotTouch(); } }}
      tabIndex={0}
      role="button"
      aria-label={`Maskot Vee. Status: ${offlineActive ? 'Offline / Server Down' : isActuallySyncing ? 'Loading' : veeHealth}.`}
      style={{ transform: `translateX(${walkX}px) scale(${scale})` }}
      className={`will-change-transform z-10 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8CE0A7] rounded-[40%] transition-all duration-700 ${offlineActive ? 'opacity-50 grayscale-[50%]' : ''}`}
    >
      <div
        className={`relative flex flex-col items-center justify-center origin-bottom
          ${isMoving ? 'animate-walk-bounce' : ''}
          ${(jumpDirection === 'fromLeft' && !offlineActive && !isActuallySyncing) ? 'animate-jump-from-left' : ''}
          ${(jumpDirection === 'fromRight' && !offlineActive && !isActuallySyncing) ? 'animate-jump-from-right' : ''}
        `}
        style={{ transform: `scaleX(${facing})`, '--facing': facing } as React.CSSProperties}
      >

        <div
          aria-hidden="true"
          className="absolute w-[40px] h-[40px] z-20"
          style={{
            top: '-28px', left: '12px',
            animation: `ahogeReactSideInverted ${wobbleSpeed} ease-in-out infinite alternate`,
            transformOrigin: 'bottom center',
            transform: activeSleeping ? 'translateY(18px) rotate(-60deg) scale(0.7)' : 'rotate(-15deg)'
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40" className="overflow-visible absolute inset-0">
            <path d="M 10,12 C 12,25 18,34 20,34 C 22,34 28,25 30,12" fill="none" stroke={ahogeColor} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="absolute top-[8px] left-[6px] w-[8px] h-[3.5px] bg-white/70 rounded-full rotate-[-15deg] blur-[0.5px]"></div>
          <div className="absolute top-[8px] left-[26px] w-[8px] h-[3.5px] bg-white/60 rounded-full rotate-[15deg] blur-[0.5px]"></div>
        </div>

        <div className="relative flex justify-center mt-1">
          <div
            aria-hidden="true"
            className="absolute -bottom-1 h-3 bg-[#2B4B3D]/15 dark:bg-black/40 blur-[4px] rounded-[100%] transition-all duration-500 z-0"
            style={{ width: '5rem', transform: `scaleX(${weight * (activeTyping ? 1.1 : activeSleeping ? 1.2 : 1)})` }}
          ></div>

          <div
            aria-hidden="true"
            className="relative w-24 h-20 transition-all duration-500 ease-in-out overflow-hidden z-10"
            style={{
              backgroundColor: color,
              borderRadius: '48% 52% 40% 40% / 55% 55% 35% 35%',
              animation: `slimeWobble ${wobbleSpeed} ease-in-out infinite alternate`,
              transform: `scaleY(${scaleY}) scaleX(${weight})`,
              boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.08), inset 10px 10px 20px rgba(255,255,255,0.4)`
            }}
          >
            <div className="absolute top-2 left-3 w-10 h-3.5 bg-white/60 rounded-full rotate-[-15deg] blur-[1px]"></div>
            <div className="absolute top-3.5 left-12 w-3 h-2 bg-white/60 rounded-full rotate-[10deg] blur-[0.5px]"></div>
            <div className="absolute bottom-[-10%] left-[10%] w-[80%] h-[60%] bg-[#1A3024] opacity-10 rounded-[100%] blur-md"></div>


            {outfit === 'doctor' && !offlineActive && !activeSleeping && (
              <div className="absolute bottom-0 left-0 w-full h-[55%] z-[5] overflow-hidden opacity-95">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M 0,50 L 30,0 L 50,22 L 70,0 L 100,50 Z" fill="#F1F5F9" />
                  <path d="M 30,0 L 50,22 L 70,0" fill="none" stroke="#CBD5E1" strokeWidth="1.5" />
                  <path d="M 20,0 C 20,38 80,38 80,0" fill="none" stroke="#334155" strokeWidth="2.5" />
                  <path d="M 50,25 L 50,38" fill="none" stroke="#334155" strokeWidth="2.5" />
                  <circle cx="50" cy="42" r="4.5" fill="#94A3B8" stroke="#334155" strokeWidth="1.5" />
                </svg>
              </div>
            )}

            <div className="absolute inset-0 w-full h-full flex items-center justify-center z-10" style={{ transform: `scaleX(${1 / weight})` }}>
              <div ref={faceRef} className="relative w-16 h-10 mt-6 will-change-transform" style={{ transition: 'transform 0.05s linear' }}>
                <svg width="100%" height="100%" viewBox="0 0 64 40" className="overflow-visible z-10 relative">

                  {offlineActive ? (
                    <g opacity="0.4">
                      <line x1="14" y1="22" x2="20" y2="22" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                      <line x1="44" y1="22" x2="50" y2="22" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  ) : activeSleeping ? (
                    <g>
                      <line x1="12" y1="20" x2="22" y2="20" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                      <line x1="42" y1="20" x2="52" y2="20" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                    </g>
                  ) : isActuallySyncing ? (
                    <g>
                      <line x1="12" y1="19" x2="22" y2="19" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" className="animate-pulse" />
                      <line x1="42" y1="19" x2="52" y2="19" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" className="animate-pulse" style={{ animationDelay: '250ms' }} />
                    </g>
                  ) : finalExpression === 'tired' || finalExpression === 'yawn' ? (
                    <g>
                      <path d="M 12,18 Q 17,21 22,20" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 42,20 Q 47,21 52,18" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  ) : finalExpression === 'hungry' || finalExpression === 'stressed' ? (
                    <g>
                      <path d="M 12,17 L 18,20 L 12,23" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M 52,17 L 46,20 L 52,23" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  ) : finalExpression === 'empathetic' || finalExpression === 'concerned' ? (
                    <g>
                      <path d="M 12,18 Q 17,16 22,19" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 42,19 Q 47,16 52,18" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  ) : finalExpression === 'calm' ? (
                    <g>
                      <path d="M 12,20 Q 17,23 22,20" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 42,20 Q 47,23 52,20" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  ) : (
                    <g>
                      <path d="M 12,21 Q 17,14 22,21" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                      <path d="M 42,21 Q 47,14 52,21" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  )}

                  {activeTraits.includes('eye-bags') && !activeSleeping && !offlineActive && (
                    <g opacity="0.3">
                      <path d="M 10,24 Q 17,28 24,23" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M 40,23 Q 47,28 54,24" fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  )}

                  {activeTraits.includes('sweat') && !offlineActive && (
                    <path d="M 50,4 C 50,4 47,8 47,10 C 47,12 48,13 50,13 C 52,13 53,12 53,10 C 53,8 50,4 50,4 Z" fill="#93C5FD" opacity="0.9" />
                  )}

                  {activeTraits.includes('glasses') && !offlineActive && (
                    <g stroke={strokeColor} strokeWidth="2" fill="none" opacity="0.9">
                      <rect x="8" y="14" width="18" height="12" rx="3" />
                      <rect x="38" y="14" width="18" height="12" rx="3" />
                      <path d="M 26,20 L 38,20" />
                    </g>
                  )}

                  {(!offlineActive && !isActuallySyncing) && (
                    <g stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" fill="none">
                      {finalExpression === 'fresh' && <path d="M 26,26 Q 32,32 38,26" />}
                      {finalExpression === 'hungry' && <path d="M 26,28 L 38,28" className={activeEating ? "animate-pulse" : ""} />}
                      {finalExpression === 'tired' && <path d="M 26,30 Q 32,26 38,30" />}
                      {finalExpression === 'empathetic' && <path d="M 28,28 Q 32,29 36,28" strokeWidth="2.5" />}
                      {finalExpression === 'concerned' && <path d="M 28,29 Q 32,27 36,29" strokeWidth="2" />}
                      {finalExpression === 'calm' && <path d="M 28,27 Q 32,30 36,27" strokeWidth="2" />}
                      {finalExpression === 'stressed' && <path d="M 26,28 L 38,28" />}
                      {finalExpression === 'yawn' && <ellipse cx="32" cy="28" rx="3" ry="5" fill={strokeColor} />}
                    </g>
                  )}

                  {(!activeSleeping && !offlineActive) && (
                    <g opacity={activeTyping || activeEating || baseColorClass === '#FF9F66' ? "0.8" : isActuallySyncing ? "0.4" : "0.5"} className="transition-opacity duration-300">
                      <ellipse cx="12" cy="25" rx="6.5" ry="3.5" fill="#FF9F66" />
                      <ellipse cx="52" cy="25" rx="6.5" ry="3.5" fill="#FF9F66" />
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {activeSleeping && (
          <div className="absolute top-2 -right-4 text-[#244135]/60 dark:text-stone-300/60 font-black animate-[ping_3s_infinite_ease-in-out] z-30">
            Z<span className="text-sm">z</span><span className="text-xs">z</span>
          </div>
        )}

      </div>

      <style>{`
        @keyframes ahogeReactSideInverted { 0% { transform: translateY(0px) rotate(-15deg); } 100% { transform: translateY(-3px) rotate(-22deg); } }
        @keyframes slimeWobble { 0% { border-radius: 48% 52% 40% 40% / 50% 50% 45% 45%; transform: translateY(0) rotate(-1deg); } 100% { border-radius: 45% 55% 42% 38% / 55% 45% 40% 40%; transform: translateY(-3px) rotate(1deg); } }
        @keyframes walkBounce { 0%, 100% { transform: translateY(0) scaleX(var(--facing)); } 50% { transform: translateY(-12px) scaleX(var(--facing)); } }
        .animate-walk-bounce { animation: walkBounce 0.35s ease-in-out infinite; }
        @keyframes slimeJumpFromLeft { 0% { transform: translate(-100px, -50px) scaleX(0.8) scaleY(1.2) rotate(-15deg); opacity: 0; } 40% { transform: translate(-30px, -60px) scaleX(1.1) scaleY(0.9) rotate(-5deg); opacity: 1; } 70% { transform: translate(0, 0) scaleX(1.3) scaleY(0.7) rotate(0deg); } 100% { transform: translate(0, 0) scaleX(1) scaleY(1); } }
        @keyframes slimeJumpFromRight { 0% { transform: translate(100px, -50px) scaleX(0.8) scaleY(1.2) rotate(15deg); opacity: 0; } 40% { transform: translate(30px, -60px) scaleX(1.1) scaleY(0.9) rotate(5deg); opacity: 1; } 70% { transform: translate(0, 0) scaleX(1.3) scaleY(0.7) rotate(0deg); } 100% { transform: translate(0, 0) scaleX(1) scaleY(1); } }
        .animate-jump-from-left { animation: slimeJumpFromLeft 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
        .animate-jump-from-right { animation: slimeJumpFromRight 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; }
      `}</style>
    </div>
  );
}
