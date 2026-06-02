// src/pages/ProfilePage.tsx
import { FormEvent, useEffect, useRef, useState } from 'react';
import useStore from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { LogOut, Trash2, ChevronRight, Settings, Bell, Shield, X } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';
import type { AuthUser } from '@/store/useStore';
import type { ProfileResponse } from '@/types/api';

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

const demoNotificationScenarios = [
  {
    title: 'Check-in Harian',
    body: 'Hai! Vee nungguin cerita kamu hari ini nih. Yuk, luangkan waktu 2 menit.',
  },
  {
    title: 'Pengingat Tidur',
    body: 'Udah jam 22.00, waktunya istirahat biar besok Vee nggak ikutan lesu.',
  },
  {
    title: 'Log Nutrisi',
    body: 'Makan siang pakai apa hari ini? Jangan lupa masukin ke log ya!',
  },
  {
    title: 'Intervensi Cepat',
    body: 'Vee ngerasa kamu lagi tegang. Tarik napas dalam-dalam sebentar, yuk.',
  },
] as const;

function mapProfileToAuthUser(
  profile: ProfileResponse,
  currentUser?: AuthUser | null,
): AuthUser {
  const displayName =
    profile.fullName?.trim() ||
    profile.email?.trim() ||
    'User';

  return {
    uid: profile.id,
    email: profile.email || '',
    displayName,
    imageUrl: profile.imageUrl ?? null,
    name: displayName,
    user_metadata: profile.user_metadata ?? currentUser?.user_metadata ?? null,
  };
}

function getProfileFormValues(user: AuthUser | null) {
  return {
    fullName: user?.displayName || user?.name || '',
    email: user?.email || '',
  };
}

export default function ProfilePage() {
  const { user, logout, setAuthUser } = useStore();
  const notificationTimeoutRef = useRef<number | null>(null);
  const [alertConfig, setAlertConfig] = useState<ProfileAlertState>(closedAlert);
  const [isDeletingData, setIsDeletingData] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(() => (
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  ));
  const [isResearchEnabled, setIsResearchEnabled] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState(() => getProfileFormValues(user));
  const [profileBaseline, setProfileBaseline] = useState(() => getProfileFormValues(user));
  const isLoading = false;
  const hasProfileChanges = profileForm.fullName.trim() !== profileBaseline.fullName.trim();

  useEffect(() => () => {
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
    }
  }, []);

  const closeAlert = () => setAlertConfig((current) => ({ ...current, isOpen: false }));

  const handleLogout = () => {
    void logout().finally(() => {
      window.history.replaceState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  };

  const queueDemoNotification = () => {
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
    }

    notificationTimeoutRef.current = window.setTimeout(() => {
      notificationTimeoutRef.current = null;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      const selectedScenario =
        demoNotificationScenarios[Math.floor(Math.random() * demoNotificationScenarios.length)];
      const notification = new Notification(selectedScenario.title, {
        body: selectedScenario.body,
      });
      notification.onclick = () => window.focus();
    }, 3000);
  };

  const handleNotificationToggle = async () => {
    if (isNotificationsEnabled) {
      setIsNotificationsEnabled(false);
      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = null;
      }
      return;
    }

    if (typeof Notification === 'undefined') {
      setIsNotificationsEnabled(false);
      setAlertConfig({
        isOpen: true,
        title: 'Notifikasi Ditolak',
        message: 'Izin notifikasi ditolak',
        type: 'error',
        confirmLabel: 'Mengerti',
      });
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      setIsNotificationsEnabled(true);
      setAlertConfig({
        isOpen: true,
        title: 'Notifikasi Aktif',
        message: 'Notifikasi diaktifkan',
        type: 'success',
        confirmLabel: 'Mengerti',
      });
      queueDemoNotification();
      return;
    }

    setIsNotificationsEnabled(false);
    setAlertConfig({
      isOpen: true,
      title: 'Notifikasi Ditolak',
      message: 'Izin notifikasi ditolak',
      type: 'error',
      confirmLabel: 'Mengerti',
    });
  };

  const openAccountSettings = () => {
    const nextValues = getProfileFormValues(user);
    setProfileForm(nextValues);
    setProfileBaseline(nextValues);
    setIsSettingsOpen(true);
  };

  const closeAccountSettings = () => {
    if (isSavingProfile) return;
    setIsSettingsOpen(false);
  };

  const closePrivacySettings = () => setIsPrivacyOpen(false);

  const showDemoDisabledToast = () => {
    setAlertConfig({
      isOpen: true,
      title: 'Mode Demo',
      message: 'Fitur dinonaktifkan selama masa demo',
      type: 'info',
      confirmLabel: 'Mengerti',
    });
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasProfileChanges || isSavingProfile) return;

    setIsSavingProfile(true);

    try {
      const updatedProfile = await vitaraApi.updateProfile({
        fullName: profileForm.fullName.trim(),
      });
      const updatedUser = mapProfileToAuthUser(updatedProfile, user);
      setAuthUser(updatedUser);

      const nextValues = getProfileFormValues(updatedUser);
      setProfileForm(nextValues);
      setProfileBaseline(nextValues);
      setIsSettingsOpen(false);
      setAlertConfig({
        isOpen: true,
        title: 'Profil Diperbarui',
        message: 'Profil berhasil diperbarui.',
        type: 'success',
        confirmLabel: 'Mengerti',
      });
    } catch (error) {
      console.warn('Failed to update profile.', error);
      setAlertConfig({
        isOpen: true,
        title: 'Gagal Memperbarui Profil',
        message: 'Gagal memperbarui profil. Silakan coba lagi.',
        type: 'error',
        confirmLabel: 'Mengerti',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const submitDataDeletionRequest = async () => {
    setIsDeletingData(true);

    try {
      await vitaraApi.requestDataDeletion();
      setAlertConfig({
        isOpen: true,
        title: 'Permintaan Dikirim',
        message: 'Pengajuan penghapusan data berhasil dikirim.',
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
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[900] flex items-end sm:items-center justify-center bg-black/30 dark:bg-black/70 backdrop-blur-sm px-4 py-6 animate-in fade-in duration-200">
          <section
            aria-label="Pengaturan akun"
            className="w-full max-w-md bg-white dark:bg-[#1A1D1B] rounded-[28px] p-6 shadow-2xl border border-[#E8F0EA] dark:border-stone-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-[#2B4B3D] dark:text-stone-50">Pengaturan Akun</h2>
                <p className="text-xs font-semibold text-[#8CAAB8] dark:text-stone-400 mt-1">Perbarui profil yang ditampilkan di Vitara.</p>
              </div>
              <button
                type="button"
                onClick={closeAccountSettings}
                disabled={isSavingProfile}
                aria-label="Tutup pengaturan akun"
                className="w-10 h-10 rounded-[14px] bg-[#F4F6F5] dark:bg-stone-800 text-[#647C73] dark:text-stone-400 flex items-center justify-center hover:text-[#2B4B3D] dark:hover:text-stone-100 transition-colors disabled:opacity-50"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={(event) => { void handleProfileSubmit(event); }} className="space-y-4">
              <label className="block">
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#647C73] dark:text-stone-400 mb-2">Nama Lengkap</span>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
                  disabled={isSavingProfile}
                  className="w-full rounded-[18px] border border-[#E8F0EA] dark:border-stone-700 bg-[#F4F6F5] dark:bg-[#121413] px-4 py-3 text-sm font-bold text-[#2B4B3D] dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8CE0A7] disabled:opacity-60"
                />
              </label>

              <label className="block">
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#647C73] dark:text-stone-400 mb-2">Email</span>
                <input
                  type="email"
                  value={profileForm.email}
                  readOnly
                  disabled
                  className="w-full rounded-[18px] border border-[#E8F0EA] dark:border-stone-700 bg-[#EEF2F5] dark:bg-stone-900 px-4 py-3 text-sm font-bold text-[#647C73] dark:text-stone-400 disabled:opacity-80"
                />
                <span className="block text-[11px] font-semibold text-[#8CAAB8] dark:text-stone-500 mt-2">Email dikelola oleh metode login dan tidak bisa diubah di sini.</span>
              </label>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAccountSettings}
                  disabled={isSavingProfile}
                  className="py-4 rounded-[20px] bg-[#F4F6F5] dark:bg-stone-800 text-[#2B4B3D] dark:text-stone-100 font-black text-sm hover:bg-[#E8F0EA] dark:hover:bg-stone-700 transition-all disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!hasProfileChanges || isSavingProfile}
                  className="py-4 rounded-[20px] bg-[#2B4B3D] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-sm shadow-[0_8px_24px_rgba(36,65,53,0.15)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isPrivacyOpen && (
        <div className="fixed inset-0 z-[900] flex items-end sm:items-center justify-center bg-black/30 dark:bg-black/70 backdrop-blur-sm px-4 py-6 animate-in fade-in duration-200">
          <section
            aria-label="Privasi dan keamanan"
            className="w-full max-w-md bg-white dark:bg-[#1A1D1B] rounded-[28px] p-6 shadow-2xl border border-[#E8F0EA] dark:border-stone-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-[#2B4B3D] dark:text-stone-50">Privasi & Keamanan</h2>
                <p className="text-xs font-semibold text-[#8CAAB8] dark:text-stone-400 mt-1">Kontrol singkat untuk keamanan data Vitara.</p>
              </div>
              <button
                type="button"
                onClick={closePrivacySettings}
                aria-label="Tutup privasi dan keamanan"
                className="w-10 h-10 rounded-[14px] bg-[#F4F6F5] dark:bg-stone-800 text-[#647C73] dark:text-stone-400 flex items-center justify-center hover:text-[#2B4B3D] dark:hover:text-stone-100 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                role="switch"
                aria-checked={isResearchEnabled}
                onClick={() => setIsResearchEnabled((current) => !current)}
                className="w-full flex items-center justify-between gap-4 p-4 rounded-[20px] bg-[#F4F6F5] dark:bg-[#121413] border border-[#E8F0EA] dark:border-stone-800 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]"
              >
                <div className="min-w-0 flex-1">
                  <span className="block font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Bagikan data anonim untuk riset</span>
                  <span className="block text-xs font-semibold text-[#8CAAB8] dark:text-stone-500 mt-0.5">
                    {isResearchEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    isResearchEnabled ? 'bg-[#1DB38A]' : 'bg-[#E8F0EA] dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isResearchEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={showDemoDisabledToast}
                className="w-full flex items-center gap-4 p-4 rounded-[20px] bg-red-600 hover:bg-red-700 text-left transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1A1D1B]"
              >
                <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-white/15 flex items-center justify-center text-white">
                  <Trash2 size={18} />
                </div>
                <div>
                  <span className="block font-black text-white text-sm">Hapus Akun & Data</span>
                  <span className="block text-xs font-semibold text-red-100 mt-0.5">Dinonaktifkan untuk live demo</span>
                </div>
              </button>
            </div>
          </section>
        </div>
      )}

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
              <button onClick={openAccountSettings} className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
                <div className="flex items-center gap-4">
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#EEF2F5] dark:bg-stone-800 flex items-center justify-center text-[#4A7A8C] dark:text-[#8CAAB8]"><Settings size={18} /></div>
                  <span className="font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Pengaturan Akun</span>
                </div>
                <ChevronRight size={18} className="text-[#A0B0A8] group-hover:text-[#2B4B3D] dark:group-hover:text-stone-100 transition-colors" />
              </button>

              <button
                type="button"
                role="switch"
                aria-checked={isNotificationsEnabled}
                onClick={() => { void handleNotificationToggle(); }}
                className="w-full flex items-center justify-between gap-4 p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div aria-hidden="true" className="w-10 h-10 rounded-[14px] bg-[#FFF0E6] dark:bg-stone-800 flex items-center justify-center text-[#D96B2B] dark:text-[#FF9F66]"><Bell size={18} /></div>
                  <div className="min-w-0 text-left">
                    <span className="block font-bold text-[#2B4B3D] dark:text-stone-100 text-sm">Notifikasi Pengingat</span>
                    <span className="block text-xs font-semibold text-[#8CAAB8] dark:text-stone-500 mt-0.5">
                      {isNotificationsEnabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>
                <span
                  aria-hidden="true"
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    isNotificationsEnabled ? 'bg-[#1DB38A]' : 'bg-[#E8F0EA] dark:bg-stone-700'
                  }`}
                >
                  <span
                    className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      isNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
              
              <button onClick={() => setIsPrivacyOpen(true)} className="w-full flex items-center justify-between p-4 hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 rounded-[20px] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]">
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
