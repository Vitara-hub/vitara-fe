// src/components/dashboard/VeeStatusWidget.tsx
import { useState, useEffect, useRef } from 'react';
import { Activity, Info, CloudOff } from 'lucide-react';
import VeeMascot from '@/components/mascot/VeeMascot';
import { VeeHealthStatus } from '@/store/useStore';
import Skeleton from '@/components/ui/Skeleton';

interface VeeStatusWidgetProps {
  veeHealth: VeeHealthStatus;
  veeWeight: number;
  realScore?: number;
  isSyncing?: boolean;
  statusLabel?: string;
  suggestion?: string;
  hasData?: boolean;
}

interface StatusData { score: number | string; text: string; color: string; advice: string; glow: string; }

function toDisplayScore(value: number | undefined, fallback: number | string) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
  return fallback;
}

export default function VeeStatusWidget({
  veeHealth,
  veeWeight,
  realScore,
  isSyncing = false,
  statusLabel,
  suggestion,
  hasData = true,
}: VeeStatusWidgetProps) {
  const [eyePosition, setEyePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isVeeBooped, setIsVeeBooped] = useState<boolean>(false);
  const boopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eyeRafRef = useRef<number | null>(null);
  const pendingEyePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleEyeMove = (e: MouseEvent) => {
      pendingEyePositionRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 6,
        y: (e.clientY / window.innerHeight - 0.5) * 6,
      };

      if (eyeRafRef.current !== null) return;

      eyeRafRef.current = window.requestAnimationFrame(() => {
        setEyePosition(pendingEyePositionRef.current);
        eyeRafRef.current = null;
      });
    };

    window.addEventListener('mousemove', handleEyeMove);
    return () => {
      window.removeEventListener('mousemove', handleEyeMove);
      if (eyeRafRef.current !== null) {
        window.cancelAnimationFrame(eyeRafRef.current);
        eyeRafRef.current = null;
      }
    };
  }, []);

  const handleVeeClick = () => {
    setIsVeeBooped(true);
    if (boopTimeoutRef.current) clearTimeout(boopTimeoutRef.current);
    boopTimeoutRef.current = setTimeout(() => {
      setIsVeeBooped(false);
      boopTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (boopTimeoutRef.current) clearTimeout(boopTimeoutRef.current);
    };
  }, []);

  const healthData: Record<VeeHealthStatus, StatusData> = {
    fresh: { score: 85, text: 'Sehat & Senang', color: 'text-[#1DB38A] bg-[#E6F7ED] dark:text-[#8CE0A7] dark:bg-[#1A2620]', advice: 'Vee kelihatan sangat sehat hari ini! Terus pertahankan rutinitas baikmu.', glow: 'rgba(140, 224, 167, 0.4)' },
    tired: { score: 45, text: 'Kurang Tidur', color: 'text-[#4A7A8C] bg-[#EEF2F5] dark:text-[#8CAAB8] dark:bg-[#1A1D20]', advice: 'Vee kelihatan pucat dan punya kantong mata. Usahakan malam ini istirahat lebih awal ya.', glow: 'rgba(140, 170, 184, 0.4)' },
    sick: { score: 30, text: 'Sakit', color: 'text-[#4A7A8C] bg-[#EEF2F5] dark:text-[#8CAAB8] dark:bg-[#1A1D20]', advice: 'Kondisi kesehatanmu sedang menurun drastis. Segera istirahat total ya!', glow: 'rgba(140, 170, 184, 0.4)' },
    stressed: { score: 60, text: 'Banyak Pikiran', color: 'text-[#D96B2B] bg-[#FFF0E6] dark:text-[#FF9F66] dark:bg-[#2A1E18]', advice: 'Vee ikutan kepanasan gara-gara kamu lagi stres. Coba tarik napas dalam-dalam atau dengerin lagu santai.', glow: 'rgba(255, 159, 102, 0.4)' },
    // 1. TAMBAHKAN DATA KHUSUS UNTUK WAITING (OFFLINE)
    waiting: { score: '--', text: 'Menunggu Sync', color: 'text-[#647C73] bg-[#E8ECEA] dark:text-[#8CAAB8] dark:bg-[#1A1D20]', advice: 'Otak AI Vee sedang offline. Data aktivitasmu aman di perangkat dan akan dianalisis saat koneksi kembali.', glow: 'rgba(100, 124, 115, 0.2)' }
  };

  const displayHealth = hasData ? veeHealth : 'waiting';
  const currentStatus = hasData ? (healthData[veeHealth] || healthData['fresh']) : healthData.waiting;
  const displayStatusLabel = hasData ? (statusLabel || currentStatus.text) : 'Belum ada skor';
  const displaySuggestion = hasData
    ? (suggestion || currentStatus.advice)
    : 'Belum ada data. Yuk, isi jurnal pertamamu hari ini!';
  
  // Jika offline (tidak ada realScore dan status waiting), tampilkan garis putus-putus
  const displayScore = !hasData ? '-' : displayHealth === 'waiting' ? '--' : toDisplayScore(realScore, currentStatus.score);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1A1D1B] rounded-[28px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.03)] flex items-center justify-between relative overflow-hidden hover:shadow-xl group" style={{ boxShadow: `0 8px 32px ${currentStatus.glow}` }}>
        <div className="absolute -right-10 -top-10 w-32 h-32 opacity-20 rounded-full blur-2xl transition-colors duration-500" style={{ backgroundColor: displayHealth === 'tired' ? '#8CAAB8' : displayHealth === 'stressed' ? '#FF9F66' : displayHealth === 'waiting' ? '#647C73' : '#8CE0A7' }}></div>
        
        {isSyncing ? (
          <div className="relative z-10 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-28 rounded-lg" />
          </div>
        ) : (
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-[#647C73] dark:text-stone-400 mb-2">Kondisi Vee</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <p className="text-4xl font-black text-[#244135] dark:text-stone-50 leading-none">
              {displayScore}
            </p>
              {hasData && <span className="text-sm font-bold text-[#647C73] dark:text-stone-500">/100</span>}
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${currentStatus.color} transition-colors duration-300`}>
              {displayHealth === 'waiting' ? <CloudOff size={12} strokeWidth={3} /> : <Activity size={12} strokeWidth={3} />} 
              {displayStatusLabel}
            </div>
          </div>
        )}

        <div className="w-24 h-28 pt-4 shrink-0 flex items-center justify-center relative z-10 cursor-pointer" onClick={handleVeeClick}>
          {isSyncing ? (
            <Skeleton className="w-24 h-24 rounded-full bg-[#E8F0EA] dark:bg-[#1A2620]" />
          ) : (
            <div className={`transition-transform duration-200 ${isVeeBooped ? 'scale-x-[1.2] scale-y-[0.8] translate-y-1' : 'scale-100 group-hover:scale-110'}`}>
              <VeeMascot veeHealth={displayHealth} scale={0.9} weight={veeWeight} eyeLookX={eyePosition.x} eyeLookY={eyePosition.y} />
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#EEF2F5] dark:bg-[#1A1D20] rounded-[24px] p-4 flex gap-4 items-center">
        {isSyncing ? (
          <>
            <Skeleton className="w-10 h-10 rounded-[14px] bg-white/60 dark:bg-white/10 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20 bg-white/60 dark:bg-white/10" />
              <Skeleton className="h-3 w-full bg-white/60 dark:bg-white/10" />
              <Skeleton className="h-3 w-4/5 bg-white/60 dark:bg-white/10" />
            </div>
          </>
        ) : (
          <>
            <div className="bg-white/60 dark:bg-white/10 p-2.5 rounded-[14px] text-[#647C73] dark:text-[#8CAAB8] shrink-0">
              {displayHealth === 'waiting' ? <CloudOff size={20} strokeWidth={2.5} /> : <Info size={20} strokeWidth={2.5} />}
            </div>
            <div className="flex-1">
              <p className="text-[#244135] dark:text-stone-200 text-sm font-bold mb-0.5">{!hasData ? 'Mulai dari sini' : displayHealth === 'waiting' ? 'Status Offline' : 'Saran Vee'}</p>
              <p className="text-[#647C73] dark:text-stone-400 text-xs font-medium leading-relaxed">{displaySuggestion}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
