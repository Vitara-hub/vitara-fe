// src/components/logbook/JournalTab.tsx
import { useState, useRef, ChangeEvent } from 'react';
import { Activity } from 'lucide-react';
import VeeMascot from '@/components/mascot/VeeMascot';
import { useKeystrokeTracker } from '@/hooks/useKeystrokeTracker';
import { vitaraApi } from '@/services/api'; 
import useStore, { VeeHealthStatus } from '@/store/useStore'; 
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';

interface JournalTabProps {
  jumpDirection?: 'fromLeft' | 'fromRight' | 'none' | null;
  veeHealth: VeeHealthStatus;
  setVeeHealth: (health: VeeHealthStatus) => void;
  weight: number;
  eyeLookX?: number;
  eyeLookY?: number;
}

export default function JournalTab({ jumpDirection, veeHealth, setVeeHealth, weight, eyeLookX, eyeLookY }: JournalTabProps) {
  const [text, setText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [popup, setPopup] = useState<PopupState>({ isOpen: false, title: '', message: '', type: 'info' });
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { addLog, updateMetric, refreshDashboardAndActivity } = useStore();
  const { metrics, handleKeyDown, getSnapshot, resetTracker } = useKeystrokeTracker();

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  const blockPaste = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setPopup({
      isOpen: true,
      type: 'info',
      title: 'Paste Dinonaktifkan',
      message: 'Fitur paste dinonaktifkan untuk keperluan analisis gaya mengetik.',
    });
  };

  const handleSave = async () => {
    if (text.length < 10) return setPopup({ isOpen: true, type: 'error', title: 'Teks Terlalu Pendek', message: 'Ceritanya kurang panjang nih.' });
    
    const typingSnapshot = getSnapshot();
    const interKeyTimings =
      typingSnapshot.interKeyTimings.length > 0
        ? typingSnapshot.interKeyTimings
        : [typingSnapshot.averageTimeBetweenKeysMs || 200];
    const typingPayload = {
      wpm: typingSnapshot.wpm,
      duration: Math.max(1, Math.round(typingSnapshot.typingDurationMs / 1000)),
      textContent: text,
      backspaceRate: typingSnapshot.backspaceRate,
      interKeyTimings,
      total_keystrokes: typingSnapshot.totalKeystrokes,
      backspace_count: typingSnapshot.backspaceCount,
      typing_duration_ms: typingSnapshot.typingDurationMs,
      average_time_between_keys_ms: typingSnapshot.averageTimeBetweenKeysMs,
    };

    setIsAnalyzing(true);
    try {
      const [journalResult, typingResult] = await Promise.all([
        vitaraApi.predictJournal({ text }),
        vitaraApi.predictTyping(typingPayload)
      ]);
      
      const avgStress = (journalResult.stressLevel + typingResult.stressScore) / 2;
      let newHealth: VeeHealthStatus = 'fresh';
      if (avgStress >= 0.7) newHealth = 'stressed';
      else if (avgStress >= 0.4) newHealth = 'tired';

      setVeeHealth(newHealth); 
      updateMetric('nlp', { emotion: journalResult.emotion, stressLevel: journalResult.stressLevel });
      updateMetric('typing', { stressScore: typingResult.stressScore });
      addLog({ type: 'journal', summary: text.substring(0, 50) + '...', emotion: journalResult.emotion, stressLevel: journalResult.stressLevel, syncStatus: 'synced' });
      void refreshDashboardAndActivity();

      setPopup({ isOpen: true, type: 'success', title: 'Analisis Selesai!', message: `Emosi Dominan: ${journalResult.emotion}\nTopik: ${journalResult.topics.join(', ')}` });

    } catch (error) { 
      // 🚀 OFFLINE FIRST PATTERN: TIdak ada kalkulasi palsu.
      console.warn("API Offline, queuing locally...", error);
      
      setVeeHealth('waiting'); // Vee masuk ke mode waiting
      
      // Simpan log dengan status PENDING
      addLog({ 
        type: 'journal', 
        summary: text.substring(0, 50) + '... (Menunggu Sync)', 
        syncStatus: 'pending',
        pendingPayload: {
          text,
          typing: typingPayload,
        },
      });

      setPopup({ 
        isOpen: true, 
        type: 'info', 
        title: 'Tersimpan Secara Lokal 📱', 
        message: 'Server AI sedang offline. Jurnal kamu sudah diamankan di perangkat ini dan akan dianalisis otomatis saat koneksi kembali.' 
      });

    } finally { 
      setText(''); 
      resetTracker();
      setIsAnalyzing(false); 
    }
  };

  const displayHealth = (isTyping || text.length > 0) ? metrics.realtimeMood : veeHealth;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 fill-mode-both relative">
      <PopupAlert {...popup} onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))} />
      <div className="w-full h-44 bg-white dark:bg-[#1A1D1B] rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center relative overflow-hidden transition-colors border border-transparent dark:border-stone-800/50">
        <div className="absolute top-5 left-5 flex items-center gap-2 text-xs font-bold text-[#647C73] dark:text-stone-500">
          <Activity size={14} className={isTyping ? 'animate-pulse text-[#1DB38A]' : ''} />
          {isTyping ? 'Membaca ritme ngetik...' : veeHealth === 'waiting' ? 'Menunggu koneksi server...' : 'Merespons emosimu...'}
        </div>
        <div className="mt-4"><VeeMascot jumpDirection={jumpDirection} isTyping={isTyping} veeHealth={displayHealth} scale={1.15} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} /></div>
      </div>
      <div className="bg-white dark:bg-[#1A1D1B] p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent dark:border-stone-800/50">
        <textarea value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} onPaste={blockPaste} onContextMenu={blockPaste} disabled={isAnalyzing} placeholder="Apa yang ngeganjel di pikiranmu hari ini?" className="w-full min-h-[160px] p-5 rounded-[20px] bg-[#F4F6F5] dark:bg-[#121413] focus:outline-none focus:ring-2 focus:ring-[#8CE0A7] transition-all resize-none text-[#244135] dark:text-stone-100 font-medium placeholder-[#A0B0A8] text-sm disabled:opacity-50"></textarea>
      </div>
      <button onClick={() => { void handleSave(); }} disabled={isAnalyzing} className="w-full py-4 rounded-[22px] bg-[#244135] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-sm shadow-[0_8px_24px_rgba(36,65,53,0.15)] flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
        {isAnalyzing ? <><Activity size={18} className="animate-pulse" /> Memproses...</> : 'Lepaskan Beban'}
      </button>
    </div>
  );
}
