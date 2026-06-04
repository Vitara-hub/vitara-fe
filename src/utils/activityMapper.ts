import type {
  ActivityDataResponse,
  ActivityHistoryItem,
  ActivityRecentItem,
  ActivitySummary,
  DailyHealthSnapshot,
} from '@/types/api';
import { estimateNutritionMacros, hasNutritionMacros } from '@/utils/nutrition';

function formatActivityTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';

  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapRecentItem(item: ActivityRecentItem): ActivityHistoryItem {
  if (item.type === 'food') {
    const calories = item.meta.calories ?? 0;
    const mappedMacros = {
      protein: item.meta.protein ?? 0,
      carbs: item.meta.carbs ?? 0,
      fat: item.meta.fat ?? 0,
    };
    const macros = hasNutritionMacros(mappedMacros)
      ? mappedMacros
      : estimateNutritionMacros(calories);

    return {
      id: item.id,
      type: 'food',
      title: item.meta.name?.trim() || item.title,
      time: formatActivityTime(item.createdAt),
      score: item.meta.calories != null ? `${item.meta.calories} kcal` : 'Tercatat',
      nutritionDetails: {
        calories: item.meta.calories ?? null,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      },
    };
  }

  if (item.type === 'sleep') {
    return {
      id: item.id,
      type: 'sleep',
      title: 'Quality Score',
      time: formatActivityTime(item.createdAt),
      score: item.meta.qualityScore ?? 'Tercatat',
    };
  }

  if (item.type === 'journal') {
    return {
      id: item.id,
      type: 'journal',
      title: 'Emotion',
      time: formatActivityTime(item.createdAt),
      score: item.meta.emotion ?? 'Tercatat',
    };
  }

  return {
    id: item.id,
    type: 'stress',
    title: 'Stress Score',
    time: formatActivityTime(item.createdAt),
    score: formatStressPercentage(item.meta.stressScore),
  };
}

function formatStressPercentage(stressScore: number | null | undefined) {
  if (stressScore == null || !Number.isFinite(stressScore)) return 'Tercatat';

  const percentage = stressScore <= 1 ? stressScore * 100 : stressScore;
  return `${Math.round(Math.max(0, Math.min(100, percentage)))}%`;
}

function buildChart(daily: DailyHealthSnapshot[]) {
  const today = new Date();
  const scoreByDate = new Map(daily.map((row) => [row.snapshotDate, row.healthScore]));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);

    return {
      day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
      score: scoreByDate.get(key) ?? 0,
      is_today: index === 6,
    };
  });
}

function computeWeeklyChange(chartScores: number[]) {
  const nonZero = chartScores.filter((score) => score > 0);
  if (nonZero.length < 2) return 0;

  const midpoint = Math.floor(nonZero.length / 2);
  const previous = nonZero.slice(0, midpoint);
  const current = nonZero.slice(midpoint);

  const avg = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;

  return Math.round(avg(current) - avg(previous));
}

export function mapActivityFeed(
  daily: DailyHealthSnapshot[],
  recent: ActivityRecentItem[],
  summary: ActivitySummary,
): ActivityDataResponse {
  const chart = buildChart(daily);

  return {
    average_score: summary.averageHealthScore,
    weekly_change_percent: computeWeeklyChange(chart.map((point) => point.score)),
    chart,
    history: recent.map(mapRecentItem),
  };
}
