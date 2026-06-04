import { useEffect } from 'react';
import useStore, { ActivityLog } from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import type { SleepAnalyzeRequest, TypingRequest } from '@/types/api';

class SkipPendingLogError extends Error {}

function getPayloadString(log: ActivityLog, key: string): string | null {
  const value = log.pendingPayload?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function getPayloadNumber(log: ActivityLog, key: string): number | null {
  const value = log.pendingPayload?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getPendingJournalText(log: ActivityLog) {
  return getPayloadString(log, 'text') ?? log.summary.replace(' (Menunggu Sync)', '');
}

function getPendingTypingPayload(log: ActivityLog): TypingRequest | null {
  const typing = log.pendingPayload?.typing;
  if (!typing || typeof typing !== 'object') return null;

  const payload = typing as Partial<TypingRequest>;
  if (
    typeof payload.wpm !== 'number' ||
    typeof payload.backspaceRate !== 'number' ||
    !Array.isArray(payload.interKeyTimings) ||
    typeof payload.total_keystrokes !== 'number' ||
    typeof payload.backspace_count !== 'number' ||
    typeof payload.typing_duration_ms !== 'number' ||
    typeof payload.average_time_between_keys_ms !== 'number'
  ) {
    return null;
  }

  return {
    wpm: payload.wpm,
    backspaceRate: payload.backspaceRate,
    interKeyTimings: payload.interKeyTimings,
    total_keystrokes: payload.total_keystrokes,
    backspace_count: payload.backspace_count,
    typing_duration_ms: payload.typing_duration_ms,
    average_time_between_keys_ms: payload.average_time_between_keys_ms,
    duration: payload.duration,
    textContent: payload.textContent,
  };
}

async function syncPendingLog(log: ActivityLog): Promise<Partial<ActivityLog>> {
  if (log.type === 'journal') {
    const journalResult = await vitaraApi.predictJournal({ text: getPendingJournalText(log) });
    const typingPayload = getPendingTypingPayload(log);

    if (typingPayload) {
      const typingResult = await vitaraApi.predictTyping(typingPayload);
      useStore.getState().updateMetric('typing', { stressScore: typingResult.stressScore });
    }

    useStore.getState().updateMetric('nlp', {
      emotion: journalResult.emotion,
      stressLevel: journalResult.stressLevel,
    });

    return {
      emotion: journalResult.emotion,
      stressLevel: journalResult.stressLevel,
      summary: log.summary.replace(' (Menunggu Sync)', ''),
    };
  }

  if (log.type === 'sleep') {
    const durationHours = getPayloadNumber(log, 'durationHours');
    const sleepRequest: SleepAnalyzeRequest = {
      sleepTime: getPayloadString(log, 'bedtime') ?? '',
      wakeTime: getPayloadString(log, 'wakeTime') ?? '',
      interruptions: getPayloadNumber(log, 'interruptions') ?? 0,
    };

    if (!sleepRequest.sleepTime || !sleepRequest.wakeTime || durationHours === null || durationHours <= 0) {
      throw new Error('Missing sleep payload for background sync.');
    }

    const response = await vitaraApi.predictSleep(sleepRequest);
    useStore.getState().updateMetric('sleep', { qualityScore: response.qualityScore });

    return {
      qualityScore: response.qualityScore,
      summary: log.summary.replace(' (Menunggu Sync)', ` (Skor: ${response.qualityScore})`),
    };
  }

  if (log.type === 'food') {
    const imageFile = log.pendingPayload?.imageFile;
    if (imageFile instanceof File) {
      const response = await vitaraApi.predictFood(imageFile);
      if (response.estimatedCalories <= 0 || response.foods.length === 0) {
        throw new SkipPendingLogError('Makanan dengan 0 kalori tidak dicatat ke aktivitas.');
      }

      useStore.getState().updateMetric('food', {
        estimatedCalories: response.estimatedCalories,
      });

      return {
        calories: response.estimatedCalories,
        foods: response.foods,
        summary: `Makan: ${response.foods.join(', ')} (${response.estimatedCalories} kcal)`,
      };
    }

    const name = getPayloadString(log, 'name') ?? log.foods?.join(', ') ?? '';
    const calories = getPayloadNumber(log, 'calories') ?? log.calories;

    if (!name || typeof calories !== 'number') {
      throw new Error('Missing food payload for background sync.');
    }

    if (calories <= 0) {
      throw new SkipPendingLogError('Makanan dengan 0 kalori tidak dicatat ke aktivitas.');
    }

    await vitaraApi.createManualFoodLog({
      name,
      calories,
      protein: getPayloadNumber(log, 'protein') ?? 0,
      carbs: getPayloadNumber(log, 'carbs') ?? 0,
      fat: getPayloadNumber(log, 'fat') ?? 0,
      consumedAt: getPayloadString(log, 'consumedAt') ?? log.timestamp,
    });

    useStore.getState().updateMetric('food', { estimatedCalories: calories });

    return {
      calories,
      foods: [name],
      protein: getPayloadNumber(log, 'protein') ?? 0,
      carbs: getPayloadNumber(log, 'carbs') ?? 0,
      fat: getPayloadNumber(log, 'fat') ?? 0,
      summary: `Makan: ${name} (${calories} kcal)`,
    };
  }

  if (log.type === 'chat') {
    const message = getPayloadString(log, 'message');
    if (!message) throw new Error('Missing chat payload for background sync.');

    await vitaraApi.sendChatMessage({ message });

    return {
      summary: log.summary.replace(' (Menunggu Sync)', ''),
    };
  }

  return {};
}

export const useAutoSync = () => {
  useEffect(() => {
    let isSyncing = false;

    const handleOnline = () => {
      if (isSyncing) return;
      isSyncing = true;

      void (async () => {
        console.log('📶 Memeriksa koneksi Server dan data pending...');

        const store = useStore.getState();
        const pendingLogs = store.activityHistory.filter((log) => log.syncStatus === 'pending');

        if (pendingLogs.length === 0) return;

        console.log(`Menyinkronkan ${pendingLogs.length} data ke server...`);
        let syncedCount = 0;

        for (const log of pendingLogs) {
          try {
            const syncedFields = await syncPendingLog(log);

            useStore.setState((state) => ({
              activityHistory: log.type === 'journal'
                ? state.activityHistory.filter((item) => item.id !== log.id)
                : state.activityHistory.map((item) =>
                    item.id === log.id
                      ? {
                          ...item,
                          ...syncedFields,
                          syncStatus: 'synced',
                          pendingPayload: undefined,
                        }
                      : item
                  ),
              activityData: log.type === 'journal' && state.activityData.data
                ? {
                    ...state.activityData,
                    data: {
                      ...state.activityData.data,
                      history: state.activityData.data.history.filter(
                        (item) => String(item.id) !== `local-${log.id}`,
                      ),
                    },
                  }
                : state.activityData,
              isServerDown: false,
            }));

            syncedCount += 1;
          } catch (error) {
            if (error instanceof SkipPendingLogError) {
              useStore.setState((state) => ({
                activityHistory: state.activityHistory.filter((item) => item.id !== log.id),
              }));
              continue;
            }

            console.error(`Gagal sinkronisasi log ${log.id}, server mati!`, error);
            useStore.getState().setServerDown(true);
            useStore.getState().setVeeState('waiting');
          }
        }

        if (syncedCount > 0) {
          await useStore.getState().refreshDashboardAndActivity();
        }
      })().finally(() => {
        isSyncing = false;
      });
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, []);
};
