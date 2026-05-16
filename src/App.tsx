import { useState, useEffect, lazy, Suspense } from 'react';
import useStore from '@/store/useStore';
import { useAutoSync } from '@/hooks/useAutoSync';
import useKeyboardVisible from '@/hooks/useKeyboardVisible';
import useHardwareEcoMode from '@/hooks/useHardwareEcoMode';

import BottomNav from '@/components/layout/BottomNav';
import Sidebar from '@/components/layout/Sidebar';
import SplashScreen from '@/components/layout/SplashScreen';
import { Activity } from 'lucide-react';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LogbookPage = lazy(() => import('@/pages/LogbookPage'));
const ActivityPage = lazy(() => import('@/pages/ActivityPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

export type ViewType = 'landing' | 'login' | 'dashboard' | 'logbook' | 'activity' | 'chat' | 'profile';

export default function App() {
  const { isAuthenticated, isDarkMode, toggleDarkMode, veeHealth, login } = useStore();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const isKeyboardVisible = useKeyboardVisible();
  
  const isEcoMode = useHardwareEcoMode();
  useAutoSync();

  useEffect(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  ('standalone' in window.navigator && (window.navigator as any).standalone === true);

    if (isAuthenticated) setCurrentView('dashboard');
    else setCurrentView(isPWA ? 'login' : 'landing');
  }, [isAuthenticated]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleLoginSuccess = () => {
    login('Yunggi'); 
    setCurrentView('dashboard');
  };

  const renderView = () => {
    switch (currentView) {
      case 'landing': return <LandingPage onEnter={() => setCurrentView('login')} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'login': return <LoginPage onLogin={handleLoginSuccess} />;
      case 'dashboard': return <DashboardPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'logbook': return <LogbookPage />;
      case 'activity': return <ActivityPage />;
      case 'chat': return <ChatPage veeHealth={veeHealth} />;
      case 'profile': return <ProfilePage />;
      default: return <LandingPage onEnter={() => setCurrentView('login')} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
    }
  };

  const PageLoader = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center w-full h-full text-[#8CE0A7] bg-[#FAF9F6] dark:bg-[#121413] z-50">
      <Activity size={32} className="animate-pulse" />
      <p className="text-xs font-bold mt-4 tracking-widest uppercase opacity-70">Memuat...</p>
    </div>
  );

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} isEcoMode={isEcoMode} />}

      <div className={`h-[100dvh] w-full flex flex-col overflow-hidden`}>
        <div className="flex-1 flex w-full min-h-0 bg-[#FAF9F6] dark:bg-[#121413] transition-colors duration-300 font-sans text-[#2B4B3D] dark:text-stone-100 overflow-hidden">
          
          {isAuthenticated && currentView !== 'landing' && currentView !== 'login' && (
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
          )}

          <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
            <main className="flex-1 flex flex-col w-full relative items-center min-h-0">
              <div className={`flex-1 flex flex-col w-full relative min-h-0 overflow-hidden ${currentView !== 'landing' && currentView !== 'login' ? 'max-w-4xl mx-auto' : ''}`}>
                <Suspense fallback={<PageLoader />}>
                  {renderView()}
                </Suspense>
              </div>
            </main>

            {isAuthenticated && currentView !== 'landing' && currentView !== 'login' && !isKeyboardVisible && (
              <div className="md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
                <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}