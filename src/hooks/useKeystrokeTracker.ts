// src/hooks/useKeystrokeTracker.ts
import { useRef, useState, useCallback, useEffect, KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface KeystrokeMetrics {
  wpm: number;
  backspaceRate: number;
  interKeyTimings: number[];
  cpm: number;
  totalKeystrokes: number;
  backspaceCount: number;
  typingDurationMs: number;
  averageTimeBetweenKeysMs: number;
  backspaces: number;
  pauses: number;
  realtimeMood: 'fresh' | 'tired' | 'stressed';
}

export interface KeystrokeTrackerReturn {
  metrics: KeystrokeMetrics;
  handleKeyDown: (e: ReactKeyboardEvent<HTMLTextAreaElement>) => void;
  getSnapshot: () => KeystrokeMetrics;
  resetTracker: () => void;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export const useKeystrokeTracker = (): KeystrokeTrackerReturn => {
  const [metrics, setMetrics] = useState<KeystrokeMetrics>({
    wpm: 0, 
    backspaceRate: 0, 
    interKeyTimings: [], 
    cpm: 0, 
    totalKeystrokes: 0,
    backspaceCount: 0,
    typingDurationMs: 0,
    averageTimeBetweenKeysMs: 0,
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

  const buildSnapshot = useCallback((): KeystrokeMetrics => {
    const data = dataRef.current;
    const typingDurationMs = data.startTime ? Math.max(0, Date.now() - data.startTime) : 0;
    const elapsedMinutes = typingDurationMs / 60000;
    const currentCpm = elapsedMinutes > 0 ? Math.round(data.charCount / elapsedMinutes) : 0;
    const wpm = Math.round(currentCpm / 5);
    const totalKeystrokes = data.charCount + data.backspaceCount;
    const backspaceRate = totalKeystrokes > 0 ? data.backspaceCount / totalKeystrokes : 0;
    const averageTimeBetweenKeysMs = average(data.interKeyTimings);

    let guess: 'fresh' | 'tired' | 'stressed' = 'fresh';
    if (data.backspaceCount > 4 || currentCpm > 350) guess = 'stressed';
    else if ((currentCpm > 0 && currentCpm < 120) || data.pauseCount > 2) guess = 'tired';

    return {
      cpm: currentCpm,
      wpm,
      backspaceRate,
      interKeyTimings: [...data.interKeyTimings],
      totalKeystrokes,
      backspaceCount: data.backspaceCount,
      typingDurationMs,
      averageTimeBetweenKeysMs,
      backspaces: data.backspaceCount,
      pauses: data.pauseCount,
      realtimeMood: guess,
    };
  }, []);

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

      setMetrics(buildSnapshot());
    }, 1000);

    return () => clearInterval(interval);
  }, [buildSnapshot]);

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
      totalKeystrokes: 0,
      backspaceCount: 0,
      typingDurationMs: 0,
      averageTimeBetweenKeysMs: 0,
      backspaces: 0, 
      pauses: 0, 
      realtimeMood: 'fresh' 
    });
  };

  return { metrics, handleKeyDown, getSnapshot: buildSnapshot, resetTracker };
};
