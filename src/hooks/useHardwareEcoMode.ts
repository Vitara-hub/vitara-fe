// src/hooks/useHardwareEcoMode.ts
import { useState, useEffect } from 'react';

export default function useHardwareEcoMode() {
  const [isEcoMode, setIsEcoMode] = useState<boolean>(false);

  useEffect(() => {
    // 1. Deteksi Hardware (Jumlah Core CPU). HP entry-level biasanya <= 4 core.
    const logicalProcessors = navigator.hardwareConcurrency || 4;
    
    // 2. Deteksi 'Data Saver' mode di Android/Chrome atau jaringan lambat
    const connection = (navigator as any).connection;
    const isSaveDataEnabled = connection ? connection.saveData : false;
    const isSlowNetwork = connection ? ['slow-2g', '2g', '3g'].includes(connection.effectiveType) : false;

    // 3. Deteksi preferensi OS untuk membatasi animasi berat
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Jika masuk kriteria HP kentang atau mode hemat, aktifkan Eco Mode
    if (logicalProcessors <= 4 || isSaveDataEnabled || isSlowNetwork || prefersReducedMotion) {
      console.log('🌱 Eco Mode Aktif: Visual berat dinonaktifkan untuk menghemat baterai & performa.');
      setIsEcoMode(true);
      document.documentElement.classList.add('eco-mode');
    }
  }, []);

  return isEcoMode;
}