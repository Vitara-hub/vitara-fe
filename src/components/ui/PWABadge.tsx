import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWABadge() {
  const [isApplyingUpdate, setIsApplyingUpdate] = useState<boolean>(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      console.info(`Service worker registered: ${swUrl}`);
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });

  const forceReload = () => {
    // @ts-expect-error Legacy forceReload argument is intentionally used for mobile PWA cache busting.
    window.location.reload(true);
  };

  const handleApplyUpdate = async () => {
    if (isApplyingUpdate) return;

    setIsApplyingUpdate(true);

    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Failed to apply service worker update.', error);
    } finally {
      if ('caches' in window) {
        window.caches
          .keys()
          .then((names) => Promise.all(names.map((name) => window.caches.delete(name))))
          .then(() => {
            forceReload();
          })
          .catch((error: unknown) => {
            console.error('Failed to clear browser caches before update reload.', error);
            forceReload();
          });
      } else {
        forceReload();
      }
    }
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#8CE0A7]/40 bg-[#FAF9F6] p-3 shadow-[0_18px_45px_rgba(43,75,61,0.18)] dark:border-[#8CE0A7]/30 dark:bg-[#18211C]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#2B4B3D] dark:text-stone-100">
          A new Vitara update is ready
        </p>
      </div>

      <button
        type="button"
        onClick={() => { void handleApplyUpdate(); }}
        disabled={isApplyingUpdate}
        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#8CE0A7] px-3 text-sm font-semibold text-[#173326] transition hover:bg-[#7BD396] focus:outline-none focus:ring-2 focus:ring-[#8CE0A7] focus:ring-offset-2 focus:ring-offset-[#FAF9F6] disabled:cursor-wait disabled:opacity-70 dark:focus:ring-offset-[#18211C]"
      >
        <RefreshCw className={`h-4 w-4 ${isApplyingUpdate ? 'animate-spin' : ''}`} aria-hidden="true" />
        {isApplyingUpdate ? 'Updating' : 'Refresh'}
      </button>

      <button
        type="button"
        aria-label="Dismiss update prompt"
        onClick={() => setNeedRefresh(false)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#2B4B3D] transition hover:bg-[#EAF6EE] focus:outline-none focus:ring-2 focus:ring-[#8CE0A7] focus:ring-offset-2 focus:ring-offset-[#FAF9F6] dark:text-stone-100 dark:hover:bg-[#223126] dark:focus:ring-offset-[#18211C]"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
