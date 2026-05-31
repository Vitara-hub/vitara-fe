// src/components/logbook/SleepTab.tsx
import { useState } from 'react';
import { Moon, Sun, Plus, Minus, ChevronRight } from 'lucide-react';
import VeeMascot from '@/components/mascot/VeeMascot';
import TimeSelector from '@/components/logbook/TimeSelector'; 
import { vitaraApi } from '@/services/api';
import useStore, { VeeHealthStatus } from '@/store/useStore';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';

interface SleepTabProps {
  jumpDirection?: 'fromLeft' | 'fromRight' | 'none' | null;
  veeHealth: VeeHealthStatus;
  setVeeHealth: (health: VeeHealthStatus) => void;
  weight: number;
  eyeLookX?: number;
  eyeLookY?: number;
}

function isSameDay(isoTimestamp: string, date: Date) {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return false;

  return (
    parsed.getFullYear() === date.getFullYear() &&
    parsed.getMonth() === date.getMonth() &&
    parsed.getDate() === date.getDate()
  );
}

export default function SleepTab({ jumpDirection, veeHealth, setVeeHealth, weight, eyeLookX, eyeLookY }: SleepTabProps) {
  const [bedtime, setBedtime] = useState<string>('23:00'); 
  const [wakeTime, setWakeTime] = useState<string>('06:30');
  const [interruptions, setInterruptions] = useState<number>(0);
  const [sleepState, setSleepState] = useState<'input' | 'sleeping' | 'result'>('input');
  const [resultHealth, setResultHealth] = useState<VeeHealthStatus | null>(null);
  const [popup, setPopup] = useState<PopupState>({ isOpen: false, title: '', message: '', type: 'info' });
  
  const {
    activityData,
    activityHistory,
    addLog,
    updateMetric,
    refreshDashboardAndActivity,
  } = useStore();

  const getSleepDuration = () => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let durationHours = wH - bH;
    let durationMins = wM - bM;
    if (durationMins < 0) { durationHours -= 1; durationMins += 60; }
    if (durationHours < 0) { durationHours += 24; }
    return { h: durationHours, m: durationMins };
  };

  const dur = getSleepDuration();
  const displayedHealth = resultHealth ?? veeHealth;
  const today = new Date();
  const todayActivityLabel = today.toLocaleString('id-ID', { day: 'numeric', month: 'short' });
  const hasSleepLogToday =
    activityHistory.some((log) => log.type === 'sleep' && isSameDay(log.timestamp, today)) ||
    Boolean(
      activityData.data?.history.some(
        (item) => item.type === 'sleep' && item.time.includes(todayActivityLabel),
      ),
    );

  const submitSleepLog = async () => {
    setSleepState('sleeping');
    setResultHealth(null);
    
    try {
      const response = await vitaraApi.predictSleep({
        sleepTime: bedtime,
        wakeTime,
        interruptions,
      });

      const nextHealth: VeeHealthStatus = response.qualityScore >= 70 ? 'fresh' : 'tired';
      setResultHealth(nextHealth);
      setVeeHealth(nextHealth);

      updateMetric('sleep', { qualityScore: response.qualityScore });
      addLog({ type: 'sleep', summary: `Tidur ${dur.h}j ${dur.m}m (Skor: ${response.qualityScore})`, qualityScore: response.qualityScore, syncStatus: 'synced' });
      await refreshDashboardAndActivity();

    } catch (error) {
      // 🚀 OFFLINE FIRST: Tidak ada tebakan skor tidur.
      console.warn("Sleep API Offline, queuing locally...", error);
      
      setResultHealth('waiting');
      setVeeHealth('waiting');
      
      addLog({ 
        type: 'sleep', 
        summary: `Tidur ${dur.h}j ${dur.m}m (Menunggu Sync)`, 
        syncStatus: 'pending',
        pendingPayload: {
          durationHours: dur.h + (dur.m / 60),
          bedtime,
          wakeTime,
          interruptions,
        },
      });

      setPopup({ 
        isOpen: true, 
        type: 'info', 
        title: 'Tersimpan Secara Lokal 📱', 
        message: 'Server AI sedang offline. Data durasi tidurmu sudah diamankan dan akan dianalisis pemulihannya saat koneksi kembali.' 
      });

    } finally {
      setSleepState('result');
    }
  };

  const handleSaveSleep = () => {
    if (hasSleepLogToday) {
      setPopup({
        isOpen: true,
        type: 'info',
        title: 'Tidur Sudah Dicatat',
        message: 'Data tidur utama hari ini sudah ada. Untuk demo, Vee hanya menerima satu catatan tidur per hari.',
      });
      return;
    }

    setPopup({
      isOpen: true,
      type: 'info',
      title: 'Konfirmasi Data Tidur',
      message: 'Pastikan jam tidurmu sudah benar. Data tidur utama hanya bisa dicatat satu kali untuk hari ini. Lanjutkan?',
      confirmLabel: 'Lanjutkan',
      cancelLabel: 'Cek Lagi',
      onConfirm: () => {
        void submitSleepLog();
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 fill-mode-both relative">
      <PopupAlert {...popup} onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))} />

      <div className="w-full h-44 bg-[#EEF2F5] dark:bg-[#1A1D1B] shadow-[0_4px_20px_rgba(0,0,0,0.05)] rounded-[28px] flex flex-col items-center justify-center relative overflow-hidden transition-colors border border-transparent dark:border-stone-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent dark:from-stone-800 dark:via-[#1A1D1B] dark:to-[#1A1D1B] opacity-50"></div>
        <div className="absolute top-5 left-5 flex gap-2 z-10"><Moon size={16} className="text-[#647C73] dark:text-[#8CAAB8]" /></div>
        
        <div className="mt-4 z-10">
          {sleepState === 'input' && <VeeMascot jumpDirection={jumpDirection} veeHealth={veeHealth} scale={1.2} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} />}
          {sleepState === 'sleeping' && <VeeMascot isSleeping={true} veeHealth={veeHealth} scale={1.2} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} />}
          {sleepState === 'result' && <VeeMascot veeHealth={displayedHealth} scale={1.2} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} />}
        </div>
      </div>

      {sleepState === 'input' && (
        <div className="animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1A1D1B] p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-4 border border-transparent dark:border-stone-800/50">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-sm font-extrabold text-[#244135] dark:text-stone-100">Jadwal Tidur</h3>
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#A0B0A8] uppercase tracking-widest block mb-1">Durasi</span>
                <span className={`text-lg font-black ${dur.h >= 7 ? 'text-[#1DB38A] dark:text-[#8CE0A7]' : 'text-[#D96B2B] dark:text-[#FF9F66]'}`}>{dur.h}h {dur.m}m</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TimeSelector label="Tidur" value={bedtime} onChange={setBedtime} icon={Moon} />
              <div className="shrink-0 text-[#D1D9D5] dark:text-stone-700"><ChevronRight size={24} strokeWidth={2.5} /></div>
              <TimeSelector label="Bangun" value={wakeTime} onChange={setWakeTime} icon={Sun} />
            </div>
          </div>
          <div className="bg-white dark:bg-[#1A1D1B] p-5 px-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex justify-between items-center border border-transparent dark:border-stone-800/50">
            <div><h3 className="text-sm font-extrabold text-[#244135] dark:text-stone-100 mb-0.5">Sering Terbangun?</h3><p className="text-[10px] font-medium text-[#A0B0A8]">Ke toilet atau tiba-tiba melek</p></div>
            <div className="flex items-center gap-4 bg-[#F4F6F5] dark:bg-[#121413] p-1.5 rounded-[20px]">
                <button onClick={() => setInterruptions(Math.max(0, interruptions - 1))} className="w-10 h-10 rounded-[16px] bg-white dark:bg-stone-800 shadow-sm flex justify-center items-center hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors active:scale-95"><Minus size={18} strokeWidth={3} className="text-[#244135] dark:text-stone-100" /></button>
                <span className="w-4 text-center text-lg font-black text-[#244135] dark:text-stone-50">{interruptions}</span>
                <button onClick={() => setInterruptions(interruptions + 1)} className="w-10 h-10 rounded-[16px] bg-white dark:bg-stone-800 shadow-sm flex justify-center items-center hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors active:scale-95"><Plus size={18} strokeWidth={3} className="text-[#244135] dark:text-stone-100" /></button>
            </div>
          </div>
          <button
            onClick={() => { void handleSaveSleep(); }}
            disabled={hasSleepLogToday}
            className="w-full py-4 mt-6 rounded-[22px] bg-[#244135] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-sm shadow-[0_8px_24px_rgba(36,65,53,0.15)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {hasSleepLogToday ? 'Tidur Hari Ini Sudah Dicatat' : 'Kalkulasi Pemulihan'}
          </button>
        </div>
      )}

      {sleepState === 'sleeping' && (
        <div className="bg-white dark:bg-[#1A1D1B] p-10 rounded-[28px] text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent dark:border-stone-800/50 animate-in fade-in duration-300">
           <Moon size={32} className="mx-auto text-[#4A7A8C] dark:text-[#8CAAB8] mb-4 animate-pulse" />
           <p className="font-bold text-[#4A7A8C] dark:text-[#8CAAB8] text-sm tracking-wide">Merekap gelombang tidur...</p>
        </div>
      )}

      {sleepState === 'result' && (
        <div className="bg-white dark:bg-[#1A1D1B] p-8 rounded-[28px] text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent dark:border-stone-800/50 animate-in zoom-in-95 duration-300">
           <h3 className="text-2xl font-black text-[#244135] dark:text-stone-100 mb-3">
             {displayedHealth === 'waiting' ? 'Data Disimpan! ⏳' : displayedHealth === 'fresh' ? 'Segar Banget! ☀️' : 'Kurang Tidur ya? 💤'}
           </h3>
           <p className="text-[#647C73] dark:text-stone-400 text-sm font-medium mb-8 leading-relaxed">
             {displayedHealth === 'waiting' 
               ? 'Durasi tidurmu sudah diamankan. Server sedang offline, tapi Vee akan menganalisis skor pemulihanmu nanti.' 
               : displayedHealth === 'fresh' ? 'Vee kelihatan sehat (hijau) karena kamu tidur cukup! Pertahankan rutinitas ini biar produktif seharian.' : 'Warna Vee jadi pucat kebiruan dan matanya turun. Besok jangan begadang lagi ya, kasihan badanmu!'}
           </p>
           <button onClick={() => setSleepState('input')} className="w-full py-4 rounded-[22px] bg-[#F4F6F5] dark:bg-[#121413] text-[#244135] dark:text-stone-100 font-black text-sm hover:scale-[1.02] transition-transform">Tutup</button>
        </div>
      )}
    </div>
  );
}
