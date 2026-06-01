// src/hooks/useHardwareEcoMode.ts
import { useEffect, useState } from 'react';

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformationLike;
}

function shouldUseEcoMode() {
  const logicalProcessors = navigator.hardwareConcurrency || 4;
  const connection = (navigator as NavigatorWithConnection).connection;
  const isSaveDataEnabled = connection?.saveData === true;
  const isSlowNetwork = connection?.effectiveType
    ? ['slow-2g', '2g', '3g'].includes(connection.effectiveType)
    : false;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return logicalProcessors <= 4 || isSaveDataEnabled || isSlowNetwork || prefersReducedMotion;
}

export default function useHardwareEcoMode() {
  const [isEcoMode] = useState<boolean>(() => shouldUseEcoMode());

  useEffect(() => {
    if (!isEcoMode) return;

    console.log('🌱 Eco Mode Aktif: Visual berat dinonaktifkan untuk menghemat baterai & performa.');
    document.documentElement.classList.add('eco-mode');
  }, [isEcoMode]);

  return isEcoMode;
}
