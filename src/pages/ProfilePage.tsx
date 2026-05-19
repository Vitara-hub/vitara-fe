// src/pages/ProfilePage.tsx
import { useEffect, useState } from 'react';
import useStore from '@/store/useStore';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { LogOut, Trash2, ChevronRight, Settings, Bell, Shield } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';

export default function ProfilePage() {
  const { user, veeHealth, logout, clearHistory } = useStore();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleClearData = () => {
    if (window.confirm("Yakin ingin menghapus semua riwayat data kesehatan? Data yang dihapus tidak bisa dikembalikan.")) {
      clearHistory();
      alert("Seluruh data kesehatan telah dihapus dari perangkat ini.");
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full bg-[#FAF9F6] dark:bg-[#121413] pb-24 overflow-y-auto no-scrollbar">
      <ProfileHeader user={user} veeHealth={veeHealth} isLoading={isLoading} />

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
              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#EEF2F5] dark:bg-stone-800 flex items-center justify-center text-[#4A7A8C] dark:text-[#8CAAB8]"><Settings size={18} /></div>
                  <span className="font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Pengaturan Akun</span>
                </div>
                <ChevronRight size={18} className="text-[#A0B0A8] group-hover:text-[#2B4B3D] dark:group-hover:text-stone-100 transition-colors" />
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#FFF0E6] dark:bg-stone-800 flex items-center justify-center text-[#D96B2B] dark:text-[#FF9F66]"><Bell size={18} /></div>
                  <span className="font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Notifikasi Pengingat</span>
                </div>
                <ChevronRight size={18} className="text-[#A0B0A8] group-hover:text-[#2B4B3D] dark:group-hover:text-stone-100 transition-colors" />
              </button>
              
              <button className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
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
                  onClick={handleClearData}
                  aria-label="Hapus seluruh riwayat data kesehatan Anda"
                  className="w-full flex items-center gap-4 p-4 hover:bg-[#FFF0E6] dark:hover:bg-[#2A1E18] rounded-[20px] transition-all group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4D4D]"
                >
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#FFF0E6] dark:bg-[#2A1E18] flex items-center justify-center text-[#D96B2B] dark:text-[#FF4D4D] group-hover:scale-110 transition-transform"><Trash2 size={18} /></div>
                  <div>
                    <span className="block font-bold text-[#D96B2B] dark:text-[#FF4D4D] text-sm">Hapus Riwayat Data</span>
                    <span className="block text-xs font-medium text-[#A0B0A8] mt-0.5">Mereset skor dan aktivitas Vitara</span>
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
