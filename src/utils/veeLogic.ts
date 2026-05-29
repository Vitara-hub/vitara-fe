// src/utils/veeLogic.ts
import type { VeeHealthStatus } from '@/store/useStore';

export interface DashboardData {
  dateLabel: string;
  healthScore: number;
  statusLabel: string;
  suggestion: string;
  breakdown: {
    moodLabel: string;
    stressLabel: string;
    nutritionKcal: number;
    sleepHours: number;
  };
}

export interface VeeOverrideState {
  baseColorClass?: string;
  activeTraits?: string[];
  // Tambahan state 'stressed' agar ekspresi wajah bisa menyesuaikan
  expression?: 'fresh' | 'hungry' | 'tired' | 'empathetic' | 'yawn' | 'stressed'; 
}

export function calculateFinalVeeState(
  healthStatus?: VeeHealthStatus,
  data?: DashboardData,
  override?: VeeOverrideState
): VeeOverrideState {
  // 1. WARNA DASAR (Langsung mengeluarkan Hex Code Orisinal Slime)
  let baseColorClass = '#8CE0A7'; // Default: Fresh (Green Sage)
  
  // Safe-chaining untuk mencegah TypeError saat data di-load
  const isStressed = healthStatus === 'stressed' || data?.breakdown?.stressLabel?.toLowerCase() === 'tinggi';
  const isSick = healthStatus === 'sick' || (data && data.healthScore < 40);

  if (override?.baseColorClass) {
    baseColorClass = override.baseColorClass;
  } else if (isStressed) {
    baseColorClass = '#FF9F66'; // Orange/Peach saat stres (Lebih nyatu dengan tema Cream)
  } else if (isSick) {
    baseColorClass = '#8CAAB8'; // Biru redup saat sakit
  }

  // 2. AKSESORIS FISIK
  const activeTraits = new Set<string>(override?.activeTraits || []);
  
  const isSleepDeprived = healthStatus === 'tired' || (data && data?.breakdown?.sleepHours < 6);
  if (isSleepDeprived) {
    activeTraits.add('eye-bags');
  }
  
  if (isStressed || data?.breakdown?.stressLabel?.toLowerCase() === 'sedang') {
    activeTraits.add('sweat');
  }

  // 3. EKSPRESI WAJAH
  let expression = override?.expression;

  if (!expression) {
    if (data && data?.breakdown?.nutritionKcal < 1000) {
      expression = 'hungry';
    } else if (isSleepDeprived || isSick || healthStatus === 'waiting') {
      expression = 'tired';
    } else if (isStressed) {
      expression = 'stressed'; // Ekspresi datar/cemas, bukan senyum
    } else {
      expression = 'fresh';
    }
  }

  return {
    baseColorClass,
    activeTraits: Array.from(activeTraits),
    expression: expression as VeeOverrideState['expression']
  };
}