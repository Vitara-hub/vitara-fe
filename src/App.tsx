import { useCallback, useState, useEffect, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import useStore from '@/store/useStore';
import { useAutoSync } from '@/hooks/useAutoSync';
import useKeyboardVisible from '@/hooks/useKeyboardVisible';
import useHardwareEcoMode from '@/hooks/useHardwareEcoMode';
import { hasAuthTokens } from '@/services/authSession';

import BottomNav from '@/components/layout/BottomNav';
import Sidebar from '@/components/layout/Sidebar';
import SplashScreen from '@/components/layout/SplashScreen';
import PWABadge from '@/components/ui/PWABadge';
import Skeleton from '@/components/ui/Skeleton';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const LogbookPage = lazy(() => import('@/pages/LogbookPage'));
const ActivityPage = lazy(() => import('@/pages/ActivityPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

export type ViewType = 'landing' | 'login' | 'dashboard' | 'logbook' | 'activity' | 'chat' | 'profile';

const viewPaths: Record<ViewType, string> = {
  landing: '/',
  login: '/login',
  dashboard: '/dashboard',
  logbook: '/logbook',
  activity: '/activity',
  chat: '/chat',
  profile: '/profile',
};

const protectedViews = new Set<ViewType>(['dashboard', 'logbook', 'activity', 'chat', 'profile']);


interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function PageLoader() {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#FAF9F6] dark:bg-[#121413] z-50 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-[20px]" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-44 max-w-[54vw]" />
          </div>
        </div>
        <Skeleton className="w-10 h-10 rounded-[16px]" />
      </div>
      <Skeleton className="h-40 w-full rounded-[28px]" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-32 rounded-[24px]" />
        <Skeleton className="h-32 rounded-[24px]" />
        <Skeleton className="h-32 rounded-[24px]" />
        <Skeleton className="h-32 rounded-[24px]" />
      </div>
    </div>
  );
}

function defer(callback: () => void) {
  queueMicrotask(callback);
}

function getViewFromPath(pathname: string): ViewType | null {
  const entry = Object.entries(viewPaths).find(([, path]) => path === pathname);
  return entry ? (entry[0] as ViewType) : null;
}

export default function App() {
  const { isAuthenticated, isAuthLoading, user, isDarkMode, toggleDarkMode, veeHealth, initAuth } = useStore();
  const [currentView, setCurrentView] = useState<ViewType>(() => getViewFromPath(window.location.pathname) || 'landing');
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const isKeyboardVisible = useKeyboardVisible();
  const hasValidSession = isAuthenticated && Boolean(user) && hasAuthTokens();
  
  const isEcoMode = useHardwareEcoMode();
  useAutoSync();

  const navigateToView = useCallback((view: ViewType, replace = false) => {
    setCurrentView(view);

    const nextPath = viewPaths[view];
    if (window.location.pathname === nextPath) return;

    if (replace) window.history.replaceState({}, '', nextPath);
    else window.history.pushState({}, '', nextPath);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void initAuth().then(() => {
      if (!isMounted) return;
    });

    return () => {
      isMounted = false;
    };
  }, [initAuth]);

  useEffect(() => {
    const handlePopState = () => {
      const nextView = getViewFromPath(window.location.pathname);
      if (nextView) setCurrentView(nextView);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  ('standalone' in window.navigator && (window.navigator as NavigatorWithStandalone).standalone === true);
    const pathView = getViewFromPath(window.location.pathname);

    if (hasValidSession) {
      const nextView = !pathView || pathView === 'landing' || pathView === 'login' ? 'dashboard' : pathView;
      if (nextView === 'dashboard' && window.location.pathname !== viewPaths.dashboard) {
        window.location.href = viewPaths.dashboard;
        return;
      }
      defer(() => navigateToView(nextView, true));
      return;
    }

    if (pathView && protectedViews.has(pathView)) {
      defer(() => navigateToView('login', true));
      return;
    }

    defer(() => navigateToView(pathView || (isPWA ? 'login' : 'landing'), true));
  }, [hasValidSession, isAuthLoading, navigateToView]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const renderView = (): ReactNode => {
    if (!hasValidSession && protectedViews.has(currentView)) {
      return <LoginPage />;
    }

    switch (currentView) {
      case 'landing': return <LandingPage onEnter={() => navigateToView('login')} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'login': return <LoginPage />;
      case 'dashboard': return <DashboardPage isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
      case 'logbook': return <LogbookPage />;
      case 'activity': return <ActivityPage />;
      case 'chat': return <ChatPage veeHealth={veeHealth} />;
      case 'profile': return <ProfilePage />;
      default: return <LandingPage onEnter={() => setCurrentView('login')} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />;
    }
  };

  if (isAuthLoading) {
    return showSplash ? (
      <SplashScreen onComplete={() => setShowSplash(false)} isEcoMode={isEcoMode} />
    ) : (
      <PageLoader />
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} isEcoMode={isEcoMode} />}
      <PWABadge />

      <div className={`h-[100dvh] w-full flex flex-col overflow-hidden`}>
        <div className="flex-1 flex w-full min-h-0 bg-[#FAF9F6] dark:bg-[#121413] transition-colors duration-300 font-sans text-[#2B4B3D] dark:text-stone-100 overflow-hidden">
          
          {hasValidSession && currentView !== 'landing' && currentView !== 'login' && (
            <Sidebar currentView={currentView} setCurrentView={navigateToView} />
          )}

          <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
            <main className="flex-1 flex flex-col w-full relative items-center min-h-0">
              <div className={`flex-1 flex flex-col w-full relative min-h-0 overflow-hidden ${currentView !== 'landing' && currentView !== 'login' ? 'max-w-4xl mx-auto' : ''}`}>
                <Suspense fallback={<PageLoader />}>
                  {renderView()}
                </Suspense>
              </div>
            </main>

            {hasValidSession && currentView !== 'landing' && currentView !== 'login' && !isKeyboardVisible && (
              <div className="md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
                <BottomNav currentView={currentView} setCurrentView={navigateToView} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
