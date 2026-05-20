// src/pages/LogbookPage.tsx
import { useState, useRef, useEffect } from 'react';
import { Download, Moon, Brain, Utensils, LucideIcon } from 'lucide-react';
import useStore, { VeeHealthStatus } from '@/store/useStore';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';

// Mengimpor sub-komponen
import JournalTab from '@/components/logbook/JournalTab';
import NutritionTab from '@/components/logbook/NutritionTab';
import SleepTab from '@/components/logbook/SleepTab';

// 1. Tipe eksklusif untuk Tab yang tersedia
type TabType = 'mood' | 'nutrition' | 'sleep';
type JumpDirection = 'fromLeft' | 'fromRight' | 'none' | null;

const closedAlert: PopupState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
};

// 2. Interface Props untuk TabButton
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: LucideIcon;
}

function TabButton({ active, onClick, label, icon: Icon }: TabButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className={`relative flex-1 py-3 text-[13px] font-bold rounded-[16px] flex items-center justify-center gap-2 transition-all duration-300 z-10 ${
        active ? 'text-[#244135] dark:text-[#121413]' : 'text-[#647C73] dark:text-stone-400 hover:text-[#244135] dark:hover:text-stone-200'
      }`}
    >
      <Icon size={16} strokeWidth={active ? 3 : 2} />
      {label}
    </button>
  );
}

export default function LogbookPage() {
  const { veeHealth, veeWeight, setVeeState } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('mood'); 
  const [jumpDirection, setJumpDirection] = useState<JumpDirection>(null);
  const [eyePosition, setEyePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [alertConfig, setAlertConfig] = useState<PopupState>(closedAlert);
  
  const prevTabIndex = useRef<number>(0);
  
  // Record type memastikan tidak ada Tab yang terlewat
  const tabOrder: Record<TabType, number> = { mood: 0, nutrition: 1, sleep: 2 };
  const tabIndex = tabOrder[activeTab];

  // Helper function untuk Sinkronisasi Store (Type Safe dengan VeeHealthStatus)
  const setVeeHealth = (newHealth: VeeHealthStatus) => setVeeState(newHealth, veeWeight);
  
  // Menerima function updater (prev => prev + 1) ATAU number statis
  const setVeeWeight = (updater: number | ((prev: number) => number)) => {
    const newWeight = typeof updater === 'function' ? updater(veeWeight) : updater;
    setVeeState(veeHealth, newWeight);
  };

  const closeAlert = () => setAlertConfig((current) => ({ ...current, isOpen: false }));

  const showUnderConstruction = () => {
    setAlertConfig({
      isOpen: true,
      title: 'Under Construction',
      message: 'This feature is currently being developed. Stay tuned!',
      type: 'info',
    });
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === activeTab) return;
    const newIndex = tabOrder[tab];
    const oldIndex = prevTabIndex.current;
    
    setJumpDirection(newIndex > oldIndex ? 'fromLeft' : 'fromRight'); 
    setActiveTab(tab);
    prevTabIndex.current = newIndex;
    setTimeout(() => setJumpDirection(null), 500);
  };

  useEffect(() => {
    const handleEyeMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 6; 
      const y = (e.clientY / window.innerHeight - 0.5) * 6;
      setEyePosition({ x, y });
    };
    window.addEventListener('mousemove', handleEyeMove);
    return () => window.removeEventListener('mousemove', handleEyeMove);
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 bg-[#F4F6F5] dark:bg-[#121413]">
      <PopupAlert {...alertConfig} onClose={closeAlert} />
      
      {/* HEADER (Sticky) */}
      <div className="px-6 pt-10 pb-4 shrink-0 sticky top-0 z-20 bg-[#F4F6F5]/90 dark:bg-[#121413]/90 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-black text-[#244135] dark:text-stone-50 tracking-tight">Pencatatan</h2>
          <button
            type="button"
            aria-label="Export logbook"
            onClick={showUnderConstruction}
            className="w-11 h-11 rounded-[16px] bg-white dark:bg-[#1A1D1B] border border-[#E8F0EA] dark:border-stone-800 text-[#2B4B3D] dark:text-[#8CE0A7] shadow-sm flex items-center justify-center hover:bg-[#E8F0EA] dark:hover:bg-stone-800 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CE0A7]"
          >
            <Download size={18} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="relative flex bg-[#E8ECEA] dark:bg-stone-800/60 p-1.5 rounded-[20px] shadow-inner border border-white/50 dark:border-stone-700/50">
          <div
            className="absolute top-1.5 bottom-1.5 bg-[#8CE0A7] rounded-[16px] shadow-sm transition-transform duration-300 ease-out z-0"
            style={{ width: 'calc((100% - 12px) / 3)', transform: `translateX(${tabIndex * 100}%)`, left: '6px' }}
          ></div>
          <TabButton active={activeTab === 'mood'} onClick={() => handleTabChange('mood')} label="Mental" icon={Brain} />
          <TabButton active={activeTab === 'nutrition'} onClick={() => handleTabChange('nutrition')} label="Nutrisi" icon={Utensils} />
          <TabButton active={activeTab === 'sleep'} onClick={() => handleTabChange('sleep')} label="Tidur" icon={Moon} />
        </div>
      </div>

      {/* RENDER KONTEN TAB */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto no-scrollbar">
        {activeTab === 'mood' && <JournalTab jumpDirection={jumpDirection} veeHealth={veeHealth} setVeeHealth={setVeeHealth} weight={veeWeight} eyeLookX={eyePosition.x} eyeLookY={eyePosition.y} />}
        {activeTab === 'nutrition' && <NutritionTab jumpDirection={jumpDirection} veeHealth={veeHealth} setVeeHealth={setVeeHealth} weight={veeWeight} setWeight={setVeeWeight} eyeLookX={eyePosition.x} eyeLookY={eyePosition.y} />}
        {activeTab === 'sleep' && <SleepTab jumpDirection={jumpDirection} veeHealth={veeHealth} setVeeHealth={setVeeHealth} weight={veeWeight} eyeLookX={eyePosition.x} eyeLookY={eyePosition.y} />}
        <div className="h-32 shrink-0 w-full"></div>
      </div>
      
    </div>
  );
}
