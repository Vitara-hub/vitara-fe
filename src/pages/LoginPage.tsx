// src/pages/LoginPage.tsx
import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Lock, Mail, User } from 'lucide-react';
import VitaraLogo from '@/components/ui/VitaraLogo';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';
import { isApiConfigured, vitaraApi } from '@/services/api';
import { markPostLoginPreparation } from '@/services/authSession';
import useStore, { getFriendlyAuthError } from '@/store/useStore';

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

export default function LoginPage() {
  const { establishSession, clearCachedPageData } = useStore();
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [popup, setPopup] = useState<PopupState>(initialPopup);

  const isAuthenticating = isEmailLoading || isGoogleLoading;

  const showPopup = (type: PopupState['type'], title: string, message: string) => {
    setPopup({ isOpen: true, type, title, message });
  };

  const toggleView = () => {
    setPopup(initialPopup);
    setIsAnimating(true);
    setTimeout(() => {
      setIsLoginView((current) => !current);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || window.location.hash.replace('#', '?'));
    const errorDescription = params.get('error_description') || params.get('error');

    if (errorDescription) {
      window.setTimeout(() => {
        showPopup('error', 'Login Google gagal', getFriendlyAuthError(decodeURIComponent(errorDescription).replace(/\+/g, ' ')));
      }, 0);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPopup(initialPopup);

    if (!isApiConfigured) {
      showPopup('error', 'Login belum tersedia', 'Backend API belum dikonfigurasi. Set VITE_API_URL lalu coba lagi.');
      return;
    }

    if (!email.trim() || !password) {
      showPopup('error', 'Data belum lengkap', 'Isi email dan password terlebih dahulu.');
      return;
    }

    if (!isLoginView && password.length < 6) {
      showPopup('error', 'Daftar akun gagal', 'Kata sandi belum memenuhi syarat. Gunakan minimal 6 karakter.');
      return;
    }

    setIsEmailLoading(true);

    try {
      if (!isLoginView) {
        const emailValue = email.trim();
        const fallbackName = emailValue.split('@')[0] || 'vitara-user';

        await vitaraApi.signup({
          username: fallbackName,
          fullName: fullName.trim() || fallbackName,
          email: emailValue,
          password,
        });
      }

      const tokens = await vitaraApi.login({
        email: email.trim(),
        password,
      });

      const hydratedUser = await establishSession(tokens);
      if (!hydratedUser.uid) throw new Error('Profile hydration failed.');
      clearCachedPageData();
      markPostLoginPreparation();
      window.location.replace('/dashboard');
    } catch (error) {
      if (isLoginView) {
        showPopup('error', 'Login gagal', 'Email atau kata sandi salah.');
        return;
      }

      showPopup('error', 'Daftar akun gagal', getFriendlyAuthError(error));
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isApiConfigured) {
      showPopup('error', 'Login belum tersedia', 'Backend API belum dikonfigurasi. Set VITE_API_URL lalu coba lagi.');
      return;
    }

    setIsGoogleLoading(true);

    try {
      const authUrl = await vitaraApi.getGoogleAuthUrl();
      window.location.assign(authUrl);
    } catch (error) {
      setIsGoogleLoading(false);
      showPopup('error', 'Login Google gagal', getFriendlyAuthError(error));
    }
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

        <div className={`transition-opacity duration-300 ease-in-out ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
          <div className="text-center mb-8">
            <h1 className="text-[24px] md:text-[28px] font-black text-[#2B4B3D] dark:text-stone-50 tracking-tight mb-2">
              {isLoginView ? 'Welcome back' : 'Create an account'}
            </h1>
            <p className="text-[14px] text-[#8CAAB8] dark:text-stone-400 font-medium">
              {isLoginView ? 'Masuk dengan email atau Google.' : 'Mulai perjalananmu bersama Vitara.'}
            </p>
          </div>

          <form onSubmit={(e) => { void handleEmailAuth(e); }} className="flex flex-col gap-4 relative z-10">
            {!isLoginView && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8CAAB8] dark:text-stone-500 group-focus-within:text-[#1DB38A] dark:group-focus-within:text-[#8CE0A7] transition-colors">
                  <User size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap"
                  required={!isLoginView}
                  disabled={isAuthenticating}
                  className="w-full bg-white/50 dark:bg-stone-800/40 border border-[#E8F0EA] dark:border-stone-700/50 rounded-[20px] py-3.5 pl-12 pr-4 text-[14px] font-bold text-[#2B4B3D] dark:text-stone-100 placeholder-[#8CAAB8]/70 focus:outline-none focus:border-[#1DB38A] dark:focus:border-[#8CE0A7] focus:ring-1 focus:ring-[#1DB38A] dark:focus:ring-[#8CE0A7] transition-all backdrop-blur-sm disabled:opacity-70"
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8CAAB8] dark:text-stone-500 group-focus-within:text-[#1DB38A] dark:group-focus-within:text-[#8CE0A7] transition-colors">
                <Mail size={18} strokeWidth={2.5} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Alamat Email"
                required
                disabled={isAuthenticating}
                className="w-full bg-white/50 dark:bg-stone-800/40 border border-[#E8F0EA] dark:border-stone-700/50 rounded-[20px] py-3.5 pl-12 pr-4 text-[14px] font-bold text-[#2B4B3D] dark:text-stone-100 placeholder-[#8CAAB8]/70 focus:outline-none focus:border-[#1DB38A] dark:focus:border-[#8CE0A7] focus:ring-1 focus:ring-[#1DB38A] dark:focus:ring-[#8CE0A7] transition-all backdrop-blur-sm disabled:opacity-70"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8CAAB8] dark:text-stone-500 group-focus-within:text-[#1DB38A] dark:group-focus-within:text-[#8CE0A7] transition-colors">
                <Lock size={18} strokeWidth={2.5} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata Sandi"
                required
                disabled={isAuthenticating}
                className="w-full bg-white/50 dark:bg-stone-800/40 border border-[#E8F0EA] dark:border-stone-700/50 rounded-[20px] py-3.5 pl-12 pr-4 text-[14px] font-bold text-[#2B4B3D] dark:text-stone-100 placeholder-[#8CAAB8]/70 focus:outline-none focus:border-[#1DB38A] dark:focus:border-[#8CE0A7] focus:ring-1 focus:ring-[#1DB38A] dark:focus:ring-[#8CE0A7] transition-all backdrop-blur-sm disabled:opacity-70"
              />
            </div>

            {isLoginView && (
              <div className="flex justify-end">
                <button type="button" className="text-[12px] font-bold text-[#1DB38A] dark:text-[#8CE0A7] hover:underline focus:outline-none">
                  Lupa kata sandi?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="group relative w-full mt-2 py-4 rounded-[20px] bg-[#2B4B3D] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-[15px] flex justify-center items-center gap-2 shadow-[0_8px_30px_rgba(43,75,61,0.15)] hover:shadow-[0_0_24px_rgba(140,224,167,0.4)] focus:outline-none focus:ring-2 focus:ring-[#1DB38A] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isEmailLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{isLoginView ? 'Masuk Sekarang' : 'Daftar Sekarang'}</span>
                  <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform duration-300" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center my-6 relative z-10">
            <div className="flex-grow h-px bg-[#E8F0EA] dark:bg-stone-800"></div>
            <span className="px-4 text-[12px] font-bold text-[#8CAAB8] dark:text-stone-500 uppercase tracking-wider">OR</span>
            <div className="flex-grow h-px bg-[#E8F0EA] dark:bg-stone-800"></div>
          </div>

          <button
            type="button"
            onClick={() => { void handleGoogleLogin(); }}
            disabled={isAuthenticating}
            className="w-full relative z-10 flex items-center justify-center gap-3 bg-white dark:bg-stone-800 border border-[#E8F0EA] dark:border-stone-700 hover:border-[#1DB38A] dark:hover:border-[#8CE0A7] text-[#2B4B3D] dark:text-stone-200 font-bold text-[14px] py-3.5 rounded-[20px] transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1DB38A] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-[13px] font-medium text-[#8CAAB8] dark:text-stone-400">
            {isLoginView ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button type="button" onClick={toggleView} disabled={isAuthenticating} className="font-bold text-[#1DB38A] dark:text-[#8CE0A7] hover:underline focus:outline-none disabled:opacity-60">
              {isLoginView ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
