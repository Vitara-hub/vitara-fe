// src/pages/ProfilePage.tsx
import { FormEvent, useState } from 'react';
import useStore, { AuthUser } from '@/store/useStore';
import { vitaraApi } from '@/services/api';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { LogOut, Trash2, ChevronRight, Settings, Bell, Shield, X } from 'lucide-react';
import Skeleton from '@/components/ui/Skeleton';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';
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

function mapProfileToAuthUser(profile: ProfileResponse): AuthUser {
  const displayName =
    profile.fullName?.trim() ||
    profile.username?.trim() ||
    profile.email?.trim() ||
    'User';

  return {
    uid: profile.id,
    username: profile.username || '',
    email: profile.email || '',
    displayName,
    imageUrl: profile.imageUrl ?? null,
    name: displayName,
  };
}

function getProfileFormValues(user: AuthUser | null) {
  return {
    fullName: user?.displayName || user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta',
  };
}

export default function ProfilePage() {
  const { user, logout, setAuthUser } = useStore();
  const [alertConfig, setAlertConfig] = useState<ProfileAlertState>(closedAlert);
  const [isDeletingData, setIsDeletingData] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [profileForm, setProfileForm] = useState(() => getProfileFormValues(user));
  const [profileBaseline, setProfileBaseline] = useState(() => getProfileFormValues(user));
  const isLoading = false;
  const hasProfileChanges =
    profileForm.fullName.trim() !== profileBaseline.fullName.trim() ||
    profileForm.username.trim() !== profileBaseline.username.trim() ||
    profileForm.timezone.trim() !== profileBaseline.timezone.trim();

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
    void logout().finally(() => {
      window.history.replaceState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
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

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasProfileChanges || isSavingProfile) return;

    setIsSavingProfile(true);

    try {
      const updatedProfile = await vitaraApi.updateProfile({
        username: profileForm.username.trim(),
        fullName: profileForm.fullName.trim(),
        timezone: profileForm.timezone.trim() || 'Asia/Jakarta',
      });
      const updatedUser = mapProfileToAuthUser(updatedProfile);
      setAuthUser(updatedUser);

      const nextValues = {
        ...getProfileFormValues(updatedUser),
        timezone: updatedProfile.timezone || profileForm.timezone,
      };
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
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#647C73] dark:text-stone-400 mb-2">Username</span>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(event) => setProfileForm((current) => ({ ...current, username: event.target.value }))}
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

              <label className="block">
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#647C73] dark:text-stone-400 mb-2">Timezone</span>
                <input
                  type="text"
                  value={profileForm.timezone}
                  onChange={(event) => setProfileForm((current) => ({ ...current, timezone: event.target.value }))}
                  disabled={isSavingProfile}
                  className="w-full rounded-[18px] border border-[#E8F0EA] dark:border-stone-700 bg-[#F4F6F5] dark:bg-[#121413] px-4 py-3 text-sm font-bold text-[#2B4B3D] dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#8CE0A7] disabled:opacity-60"
                />
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
