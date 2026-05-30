import { useEffect } from 'react';
import useStore from '@/store/useStore';
import { vitaraApi } from '@/services/api';

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

        for (const log of pendingLogs) {
          try {
            if (log.type !== 'journal') continue;

            const response = await vitaraApi.predictJournal({ text: log.summary });

            useStore.setState((state) => ({
              activityHistory: state.activityHistory.map((item) =>
                item.id === log.id
                  ? {
                      ...item,
                      syncStatus: 'synced',
                      emotion: response.emotion,
                      stressLevel: response.stressLevel,
                      summary: item.summary.replace(' (Menunggu Sync)', ''),
                    }
                  : item
              ),
              isServerDown: false,
            }));

            store.updateMetric('nlp', { emotion: response.emotion, stressLevel: response.stressLevel });
          } catch (error) {
            console.error(`Gagal sinkronisasi log ${log.id}, server mati!`, error);
            useStore.getState().setServerDown(true);
            useStore.getState().setVeeState('waiting');
          }
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
