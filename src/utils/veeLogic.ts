// src/utils/veeLogic.ts
import type { DashboardTodayResponse } from '@/types/api';
import type { VeeHealthStatus } from '@/store/useStore';

export type DashboardData = DashboardTodayResponse;

export interface VeeOverrideState {
  baseColorClass?: string;
  activeTraits?: string[];
  expression?: 'fresh' | 'hungry' | 'tired' | 'empathetic' | 'concerned' | 'calm' | 'yawn' | 'stressed';
}

type DashboardBreakdownWithScores = Partial<DashboardTodayResponse['breakdown']> & {
  mood?: number | null;
  nutrition?: number | null;
  stress?: number | null;
  sleep?: number | null;
  moodScore?: number | null;
  nutritionScore?: number | null;
  stressScore?: number | null;
  sleepScore?: number | null;
};

type DashboardWithOptionalScores = Partial<DashboardTodayResponse> & {
  breakdown?: DashboardBreakdownWithScores | null;
};

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(hasMeaningfulValue);
  return true;
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

export function deriveVeeHealthFromDashboard(
  dashboardData: DashboardTodayResponse | null
): VeeHealthStatus {
  if (!dashboardData || !hasMeaningfulValue(dashboardData)) return 'waiting';

  const data = dashboardData as DashboardWithOptionalScores;
  const breakdown = data.breakdown ?? null;
  const healthScore = toFiniteNumber(data.healthScore);
  const hasSupportingData = Boolean(
    normalizeText(data.dateLabel) ||
      normalizeText(data.statusLabel) ||
      normalizeText(data.suggestion) ||
      (breakdown && hasMeaningfulValue(breakdown))
  );

  if (healthScore === 0) {
    return hasSupportingData ? 'sick' : 'waiting';
  }

  const stressScore = toFiniteNumber(breakdown?.stressScore ?? breakdown?.stress);
  const sleepScore = toFiniteNumber(breakdown?.sleepScore ?? breakdown?.sleep);
  const sleepHours = toFiniteNumber(breakdown?.sleepHours);
  const stressLabel = normalizeText(breakdown?.stressLabel);
  const moodLabel = normalizeText(breakdown?.moodLabel);
  const statusLabel = normalizeText(data.statusLabel);

  if (healthScore !== null && healthScore < 40) return 'sick';

  if (
    (stressScore !== null && stressScore > 70) ||
    includesAny(stressLabel, ['tinggi', 'berat', 'high', 'stres']) ||
    includesAny(statusLabel, ['stress', 'stres', 'banyak pikiran'])
  ) {
    return 'stressed';
  }

  if (
    (healthScore !== null && healthScore < 65) ||
    (sleepScore !== null && sleepScore < 45) ||
    (sleepHours !== null && sleepHours < 6) ||
    includesAny(moodLabel, ['lelah', 'tired']) ||
    includesAny(statusLabel, ['tidur', 'lelah', 'tired'])
  ) {
    return 'tired';
  }

  return 'fresh';
}

export function calculateFinalVeeState(
  healthStatus?: VeeHealthStatus,
  data?: DashboardData,
  override?: VeeOverrideState
): VeeOverrideState {
  let baseColorClass = '#8CE0A7';
  const effectiveHealthStatus = healthStatus ?? (data ? deriveVeeHealthFromDashboard(data) : 'fresh');
  const stressLabel = normalizeText(data?.breakdown?.stressLabel);
  const nutritionKcal = toFiniteNumber(data?.breakdown?.nutritionKcal);
  const sleepHours = toFiniteNumber(data?.breakdown?.sleepHours);

  const isStressed =
    effectiveHealthStatus === 'stressed' ||
    includesAny(stressLabel, ['tinggi', 'berat', 'high', 'stres']);
  const isSick = effectiveHealthStatus === 'sick';

  if (override?.baseColorClass) {
    baseColorClass = override.baseColorClass;
  } else if (isStressed) {
    baseColorClass = '#FF9F66';
  } else if (isSick) {
    baseColorClass = '#8CAAB8';
  }

  const activeTraits = new Set<string>(override?.activeTraits || []);

  const isSleepDeprived =
    effectiveHealthStatus === 'tired' || (sleepHours !== null && sleepHours < 6);
  if (isSleepDeprived) {
    activeTraits.add('eye-bags');
  }

  if (isStressed || stressLabel === 'sedang') {
    activeTraits.add('sweat');
  }

  let expression = override?.expression;

  if (!expression) {
    if (nutritionKcal !== null && nutritionKcal < 1000) {
      expression = 'hungry';
    } else if (isSleepDeprived || isSick || effectiveHealthStatus === 'waiting') {
      expression = 'tired';
    } else if (isStressed) {
      expression = 'stressed';
    } else {
      expression = 'fresh';
    }
  }

  return {
    baseColorClass,
    activeTraits: Array.from(activeTraits),
    expression
  };
}
