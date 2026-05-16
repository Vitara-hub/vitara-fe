import { useEffect } from 'react';
import useStore from '@/store/useStore';
import { vitaraApi } from '@/services/api';

export const useAutoSync = () => {
  const { activityHistory, updateMetric } = useStore();

  useEffect(() => {
    const handleOnline = async () => {
      console.log('📶 Memeriksa koneksi Server dan data pending...');
      
      const pendingLogs = activityHistory.filter(log => log.syncStatus === 'pending');
      
      if (pendingLogs.length === 0) return;
      
      console.log(`Menyinkronkan ${pendingLogs.length} data ke server...`);

      const store = useStore.getState();

      for (const log of pendingLogs) {
        try {
          if (log.type === 'journal') {
            const response = await vitaraApi.predictJournal({ text: log.summary });
            store.updateMetric('nlp', { emotion: response.emotion, stress_level: response.stress_level });
            
            useStore.setState(state => ({
              activityHistory: state.activityHistory.map(item => 
                item.id === log.id ? { ...item, syncStatus: 'synced', emotion: response.emotion, stressLevel: response.stress_level, summary: log.summary.replace(' (Menunggu Sync)', '') } : item
              ),
              isServerDown: false // 🚀 BE NYALA!
            }));
          }
        } catch (error) {
          console.error(`Gagal sinkronisasi log ${log.id}, server mati!`, error);
          // 🚀 KASIH TAHU STORE KALAU BE MATI
          useStore.getState().setServerDown(true);
          useStore.getState().setVeeState('waiting'); 
        }
      }
      
      // Ubah Vee kembali jadi Fresh kalau udah beres dan server nyala
      if (!useStore.getState().isServerDown) {
        useStore.getState().setVeeState('fresh');
      }
    };

    window.addEventListener('online', handleOnline);

    // Langsung cek pas aplikasi dibuka
    if (navigator.onLine) {
      handleOnline();
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [activityHistory, updateMetric]);
};