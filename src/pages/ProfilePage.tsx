// src/pages/ProfilePage.tsx
import { useState } from 'react';
import useStore from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { LogOut, Trash2, ChevronRight, Settings, Bell, Shield } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';

type ProfileAlertState = PopupState & {
  onConfirm?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
};

const closedAlert: ProfileAlertState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
};

export default function ProfilePage() {
  const { user, logout } = useStore();
  const [alertConfig, setAlertConfig] = useState<ProfileAlertState>(closedAlert);
  const [isDeletingData, setIsDeletingData] = useState<boolean>(false);
  const isLoading = false;

  const closeAlert = () => setAlertConfig((current) => ({ ...current, isOpen: false }));

  const showUnderConstruction = (feature: string) => {
    setAlertConfig({
      isOpen: true,
      title: 'Under Construction',
      message: `${feature} is currently being developed. Stay tuned!`,
      type: 'info',
      confirmLabel: 'Mengerti',
    });
  };

  const handleLogout = () => {
    logout();
  };

  const submitDataDeletionRequest = async () => {
    setIsDeletingData(true);

    try {
      await vitaraApi.requestDataDeletion();
      setAlertConfig({
        isOpen: true,
        title: 'Permintaan Dikirim',
        message: 'Permintaan penghapusan data riwayat aktivitas berhasil dikirim. Akun kamu tetap aktif dan aman.',
        type: 'success',
        confirmLabel: 'Mengerti',
      });
    } catch (error) {
      console.warn('Failed to request data deletion.', error);
      setAlertConfig({
        isOpen: true,
        title: 'Permintaan Gagal',
        message: 'Permintaan penghapusan data riwayat belum berhasil dikirim. Coba lagi sebentar lagi.',
        type: 'error',
        confirmLabel: 'Mengerti',
      });
    } finally {
      setIsDeletingData(false);
    }
  };

  const handleRequestDataDeletion = () => {
    setAlertConfig({
      isOpen: true,
      title: 'Ajukan Penghapusan Data?',
      message: 'Apakah kamu yakin ingin mengajukan penghapusan semua data riwayat aktivitas? Tindakan ini tidak dapat dibatalkan, namun akun kamu akan tetap aman.',
      type: 'error',
      variant: 'danger',
      confirmLabel: 'Ajukan',
      cancelLabel: 'Batal',
      onConfirm: () => {
        void submitDataDeletionRequest();
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-[#FAF9F6] dark:bg-[#121413] pb-24 overflow-y-auto no-scrollbar">
      <PopupAlert {...alertConfig} onClose={closeAlert} />
      <ProfileHeader user={user} isLoading={isLoading} />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <>
            <nav aria-hidden="true" className="bg-white dark:bg-[#1A1D1B] rounded-[28px] p-2 shadow-sm border border-[#E8F0EA] dark:border-stone-800 space-y-1">
              {[0, 1, 2].map((item) => (
                <div key={item} className="w-full flex items-center justify-between p-4 rounded-[20px]">
                  <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="w-10 h-10 rounded-[14px]" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
              ))}
            </nav>

            <section aria-hidden="true" className="pt-2">
              <Skeleton className="h-3 w-24 mx-4 mb-3" />
              <div className="bg-white dark:bg-[#1A1D1B] rounded-[28px] p-2 shadow-sm border border-[#E8F0EA] dark:border-stone-800 space-y-1">
                {[0, 1].map((item) => (
                  <div key={item} className="w-full flex items-center gap-4 p-4 rounded-[20px]">
                    <Skeleton className="w-10 h-10 rounded-[14px]" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-36" />
                      {item === 0 && <Skeleton className="h-3 w-48 max-w-full" />}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* A11Y: Semantic <nav> */}
            <nav aria-label="Pengaturan Akun" className="bg-white dark:bg-[#1A1D1B] rounded-[28px] p-2 shadow-sm border border-[#E8F0EA] dark:border-stone-800">
              <button onClick={() => showUnderConstruction('Pengaturan Akun')} className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#EEF2F5] dark:bg-stone-800 flex items-center justify-center text-[#4A7A8C] dark:text-[#8CAAB8]"><Settings size={18} /></div>
                  <span className="font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Pengaturan Akun</span>
                </div>
                <ChevronRight size={18} className="text-[#A0B0A8] group-hover:text-[#2B4B3D] dark:group-hover:text-stone-100 transition-colors" />
              </button>

              <button onClick={() => showUnderConstruction('Notifikasi Pengingat')} className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#FFF0E6] dark:bg-stone-800 flex items-center justify-center text-[#D96B2B] dark:text-[#FF9F66]"><Bell size={18} /></div>
                  <span className="font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Notifikasi Pengingat</span>
                </div>
                <ChevronRight size={18} className="text-[#A0B0A8] group-hover:text-[#2B4B3D] dark:group-hover:text-stone-100 transition-colors" />
              </button>
              
              <button onClick={() => showUnderConstruction('Privasi & Keamanan')} className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#E8F0EA] dark:bg-stone-800 flex items-center justify-center text-[#2B7A50] dark:text-[#8CE0A7]"><Shield size={18} /></div>
                  <span className="font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Privasi & Keamanan</span>
                </div>
                <ChevronRight size={18} className="text-[#A0B0A8] group-hover:text-[#2B4B3D] dark:group-hover:text-stone-100 transition-colors" />
              </button>
            </nav>

            {/* A11Y: Semantic <section> */}
            <section aria-labelledby="danger-zone-title" className="pt-2">
              <h2 id="danger-zone-title" className="text-[10px] font-extrabold text-[#8CAAB8] uppercase tracking-widest px-4 mb-3">Zona Bahaya</h2>
              
              <div className="bg-white dark:bg-[#1A1D1B] rounded-[28px] p-2 shadow-sm border border-[#E8F0EA] dark:border-stone-800 space-y-1">
                <button 
                  onClick={handleRequestDataDeletion}
                  disabled={isDeletingData}
                  aria-label="Hapus seluruh riwayat data kesehatan Anda"
                  className="w-full flex items-center gap-4 p-4 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-[20px] transition-all group text-left shadow-[0_8px_24px_rgba(220,38,38,0.18)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1A1D1B] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                >
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-white/15 flex items-center justify-center text-white group-hover:scale-110 transition-transform"><Trash2 size={18} /></div>
                  <div>
                    <span className="block font-bold text-white text-sm">{isDeletingData ? 'Mengirim Permintaan...' : 'Hapus Riwayat Data'}</span>
                    <span className="block text-xs font-medium text-red-100 mt-0.5">Ajukan penghapusan logbook, chat, dan aktivitas</span>
                  </div>
                </button>

                <button 
                  onClick={handleLogout}
                  aria-label="Keluar dari akun Anda"
                  className="w-full flex items-center gap-4 p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]"
                >
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#F4F6F5] dark:bg-stone-800 flex items-center justify-center text-[#2B4B3D] dark:text-stone-400 group-hover:scale-110 transition-transform"><LogOut size={18} /></div>
                  <span className="font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Keluar Akun</span>
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
