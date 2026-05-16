// src/hooks/useKeystrokeTracker.ts
import { useRef, useState, useCallback, useEffect, KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface KeystrokeMetrics {
  wpm: number;
  backspaceRate: number;
  interKeyTimings: number[];
  cpm: number;
  backspaces: number; // <--- SUDAH MASUK DI SINI
  pauses: number;
  realtimeMood: 'fresh' | 'tired' | 'stressed';
}

export interface KeystrokeTrackerReturn {
  metrics: KeystrokeMetrics;
  handleKeyDown: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  resetTracker: () => void;
}

export const useKeystrokeTracker = (): KeystrokeTrackerReturn => {
  const [metrics, setMetrics] = useState<KeystrokeMetrics>({
    wpm: 0, 
    backspaceRate: 0, 
    interKeyTimings: [], 
    cpm: 0, 
    backspaces: 0, 
    pauses: 0, 
    realtimeMood: 'fresh',
  });

  const dataRef = useRef({
    startTime: null as number | null,
    lastCharTime: null as number | null,
    charCount: 0,
    backspaceCount: 0,
    pauseCount: 0,
    interKeyTimings: [] as number[]
  });

  const handleKeyDown = useCallback((e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    const now = Date.now();
    const data = dataRef.current;

    if (!data.startTime) data.startTime = now;

    // Hitung inter-key timing
    if (data.lastCharTime) {
      const diff = now - data.lastCharTime;
      if (diff < 3000) data.interKeyTimings.push(diff); // Abaikan jeda > 3 detik
      if (diff > 2000) data.pauseCount += 1;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      data.backspaceCount += 1;
    } else if (e.key.length === 1) {
      data.charCount += 1;
    }

    data.lastCharTime = now;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const data = dataRef.current;
      if (!data.startTime) return;

      const elapsedMinutes = (Date.now() - data.startTime) / 60000;
      const currentCpm = elapsedMinutes > 0 ? Math.round(data.charCount / elapsedMinutes) : 0;
      const wpm = Math.round(currentCpm / 5);
      const backspaceRate = data.charCount > 0 ? data.backspaceCount / data.charCount : 0;

      let guess: 'fresh' | 'tired' | 'stressed' = 'fresh';
      if (data.backspaceCount > 4 || currentCpm > 350) guess = 'stressed';
      else if ((currentCpm > 0 && currentCpm < 120) || data.pauseCount > 2) guess = 'tired';

      setMetrics({
        cpm: currentCpm,
        wpm,
        backspaceRate,
        interKeyTimings: [...data.interKeyTimings],
        backspaces: data.backspaceCount, // <--- SUDAH DI-MAPPING DI SINI
        pauses: data.pauseCount,
        realtimeMood: guess,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const resetTracker = () => {
    dataRef.current = { 
      startTime: null, 
      lastCharTime: null, 
      charCount: 0, 
      backspaceCount: 0, 
      pauseCount: 0, 
      interKeyTimings: [] 
    };
    setMetrics({ 
      wpm: 0, 
      backspaceRate: 0, 
      interKeyTimings: [], 
      cpm: 0, 
      backspaces: 0, 
      pauses: 0, 
      realtimeMood: 'fresh' 
    });
  };

  return { metrics, handleKeyDown, resetTracker };
};