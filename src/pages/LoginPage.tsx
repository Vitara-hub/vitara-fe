// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Loader2 } from 'lucide-react';
import useStore, { AuthUser } from '@/store/useStore';
import VitaraLogo from '@/components/ui/VitaraLogo';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';

interface LoginPageProps {
  onLogin?: () => void;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const initialPopup: PopupState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
};

export default function LoginPage({ onLogin }: LoginPageProps) {
  const login = useStore((state) => state.login);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [popup, setPopup] = useState<PopupState>(initialPopup);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const showError = (message: string) => {
    setPopup({
      isOpen: true,
      title: 'Login Google gagal',
      message,
      type: 'error',
    });
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: async (tokenResponse) => {
      setIsAuthenticating(true);

      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Tidak dapat mengambil profil Google.');
        }

        const googleUser = (await response.json()) as GoogleUserInfo;
        const authUser: AuthUser = {
          uid: googleUser.sub,
          email: googleUser.email,
          displayName: googleUser.name,
          photoURL: googleUser.picture,
          name: googleUser.name,
        };

        login(authUser);
        onLogin?.();
      } catch (error) {
        console.error('Google profile fetch failed:', error);
        showError('Koneksi ke Google bermasalah. Periksa koneksi internetmu, lalu coba lagi.');
      } finally {
        setIsAuthenticating(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google OAuth failed:', errorResponse);
      setIsAuthenticating(false);
      showError('Popup login ditutup atau Google menolak proses autentikasi. Silakan coba lagi.');
    },
  });

  const handleLoginClick = () => {
    if (!googleClientId) {
      showError('VITE_GOOGLE_CLIENT_ID belum dikonfigurasi di file .env.');
      return;
    }

    setIsAuthenticating(true);
    handleGoogleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-[#FAF9F6] dark:bg-[#121413] transition-colors duration-300 overflow-hidden px-4 md:px-0">
      <PopupAlert {...popup} onClose={() => setPopup(initialPopup)} />
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-0" style={{ filter: 'url(#noiseFilter)' }}></div>

      <div className="absolute top-[10%] md:top-[20%] left-[10%] md:left-[20%] w-[60vw] h-[60vw] md:w-[30vw] md:h-[30vw] bg-[#1DB38A] dark:bg-[#8CE0A7] rounded-full blur-[100px] md:blur-[120px] opacity-20 dark:opacity-10 animate-ambient pointer-events-none z-0"></div>
      <div className="absolute bottom-[5%] md:bottom-[10%] right-[10%] md:right-[20%] w-[50vw] h-[50vw] md:w-[25vw] md:h-[25vw] bg-[#FF9F66] rounded-full blur-[100px] md:blur-[120px] opacity-10 animate-ambient pointer-events-none z-0" style={{ animationDelay: '3s', animationDirection: 'reverse' }}></div>

      <div className="relative z-10 w-full max-w-[420px] glass-noise bg-white/60 dark:bg-[#1A1D1B]/60 backdrop-blur-3xl border border-white/60 dark:border-stone-700/50 rounded-[32px] p-8 md:p-10 shadow-[0_30px_80px_rgba(29,179,138,0.08)] dark:shadow-2xl flex flex-col">
        <div className="flex justify-center mb-8">
          <VitaraLogo className="text-3xl md:text-4xl" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-[24px] md:text-[28px] font-black text-[#2B4B3D] dark:text-stone-50 tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-[14px] text-[#8CAAB8] dark:text-stone-400 font-medium">
            Masuk aman dengan akun Google untuk melanjutkan perjalanan Vitara.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoginClick}
          disabled={isAuthenticating}
          className="w-full relative z-10 flex items-center justify-center gap-3 bg-white dark:bg-stone-800 border border-[#E8F0EA] dark:border-stone-700 hover:border-[#1DB38A] dark:hover:border-[#8CE0A7] text-[#2B4B3D] dark:text-stone-200 font-bold text-[14px] py-3.5 rounded-[20px] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1DB38A] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isAuthenticating ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
          <span>{isAuthenticating ? 'Menghubungkan Google...' : 'Continue with Google'}</span>
        </button>

        <p className="mt-6 text-center text-[12px] leading-relaxed font-medium text-[#8CAAB8] dark:text-stone-500">
          Kami hanya menggunakan profil dasar Google untuk mengenali akunmu di Vitara.
        </p>
      </div>
    </div>
  );
}
