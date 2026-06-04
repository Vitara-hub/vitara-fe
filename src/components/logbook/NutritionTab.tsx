// src/components/logbook/NutritionTab.tsx
import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Camera, ScanLine, Flame, Droplet, Wheat, Zap } from 'lucide-react';
import VeeMascot from '@/components/mascot/VeeMascot';
import { vitaraApi } from '@/services/api';
import useStore, { VeeHealthStatus } from '@/store/useStore';
import PopupAlert, { PopupState } from '@/components/ui/PopupAlert';

interface NutritionTabProps {
  jumpDirection?: 'fromLeft' | 'fromRight' | 'none' | null;
  veeHealth: VeeHealthStatus;
  setVeeHealth: (health: VeeHealthStatus) => void;
  weight: number;
  setWeight: (updater: (prev: number) => number) => void;
  eyeLookX?: number;
  eyeLookY?: number;
}

interface UINutritionResult {
  name: string;
  tags: string[];
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
}

const NON_FOOD_WARNING_MESSAGE =
  'Hmm, Vee tidak menemukan makanan di gambar ini. Coba pilih foto lain atau masukkan secara manual ya!';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object'
  ) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.message === 'string') return data.message;
    if (typeof data.detail === 'string') return data.detail;
  }

  return '';
}

function isNonFoodAnalysisError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes('no food') ||
    message.includes('not food') ||
    message.includes('non-food') ||
    message.includes('makanan tidak') ||
    message.includes('tidak menemukan makanan') ||
    message.includes('0 calorie') ||
    message.includes('zero calorie')
  );
}

export default function NutritionTab({ jumpDirection, veeHealth, setVeeHealth, weight, setWeight, eyeLookX, eyeLookY }: NutritionTabProps) {
  const [mealTime, setMealTime] = useState<string>('Makan Siang');
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<UINutritionResult | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [popup, setPopup] = useState<PopupState>({ isOpen: false, title: '', message: '', type: 'info' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addLog, updateMetric, refreshDashboardAndActivity } = useStore();

  const mealTimeRef = useRef<string>(mealTime);

  useEffect(() => {
    mealTimeRef.current = mealTime;
  }, [mealTime]);

  const resetFoodUploadState = () => {
    setFile(null);
    setResult(null);
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const showNonFoodWarning = () => {
    setPopup({
      isOpen: true,
      type: 'info',
      title: 'Makanan Tidak Ditemukan',
      message: NON_FOOD_WARNING_MESSAGE,
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      return setPopup({ isOpen: true, type: 'error', title: 'File Kebesaran', message: 'Ukuran foto terlalu besar. Maksimal 5MB ya!' });
    }

    setFile(selectedFile);
    setAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const apiResult = await vitaraApi.predictFood(formData);
      const hasDetectedFood = apiResult.foods.length > 0 && apiResult.estimatedCalories > 0;

      if (!hasDetectedFood) {
        resetFoodUploadState();
        showNonFoodWarning();
        return;
      }

      setResult({
        name: apiResult.foods.join(', '),
        tags: ['Makanan AI Terdeteksi', mealTimeRef.current],
        calories: apiResult.estimatedCalories,
        macros: { protein: Math.round(apiResult.estimatedCalories * 0.05), carbs: Math.round(apiResult.estimatedCalories * 0.12), fat: Math.round(apiResult.estimatedCalories * 0.03) }
      });
    } catch (error) {
      if (isNonFoodAnalysisError(error)) {
        resetFoodUploadState();
        showNonFoodWarning();
        return;
      }

      // 🚀 OFFLINE FIRST: Tidak ada tebakan kalori.
      console.warn("Vision API Offline, queuing locally...", error);
      
      setVeeHealth('waiting');
      setSaved(true); // Langsung ke halaman sukses (tapi versi offline)

      addLog({ 
        type: 'food', 
        summary: `Foto Makanan (Menunggu Sync)`, 
        syncStatus: 'pending',
        pendingPayload: {
          imageFile: selectedFile,
        },
      });

      setPopup({ 
        isOpen: true, 
        type: 'info', 
        title: 'Tersimpan Secara Lokal 📱', 
        message: 'Mata Vee lagi burem karena server offline. Foto makananmu sudah diamankan dan akan dihitung kalorinya saat koneksi kembali.' 
      });

    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveNutrition = () => {
    if (!result) return;

    if (result.calories <= 0) {
      resetFoodUploadState();
      setPopup({
        isOpen: true,
        type: 'info',
        title: 'Tidak Dicatat',
        message: 'Makanan dengan 0 kalori tidak dicatat ke aktivitas.',
      });
      return;
    }

    setWeight(prev => Math.min(prev + 0.15, 1.6)); 
    setVeeHealth('fresh'); 
    setSaved(true);

    updateMetric('food', { estimatedCalories: result.calories });
    addLog({
      type: 'food',
      summary: `Makan: ${result.name} (${result.calories} kcal)`,
      calories: result.calories,
      foods: result.name.split(', '),
      protein: result.macros.protein,
      carbs: result.macros.carbs,
      fat: result.macros.fat,
      syncStatus: 'synced',
    });
    void refreshDashboardAndActivity();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 fill-mode-both relative">
      <PopupAlert {...popup} onClose={() => setPopup(prev => ({ ...prev, isOpen: false }))} />

      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
        {['Sarapan', 'Makan Siang', 'Malam', 'Camilan'].map(meal => (
          <button key={meal} onClick={() => setMealTime(meal)} className={`px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all whitespace-nowrap border ${mealTime === meal ? 'bg-[#FFD966] text-[#244135] border-[#FFD966] shadow-sm' : 'bg-white dark:bg-[#1A1D1B] text-[#647C73] dark:text-stone-400 border-transparent dark:border-stone-800/50 hover:bg-stone-50 dark:hover:bg-stone-800'}`}>
            {meal}
          </button>
        ))}
      </div>

      <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => { void handleFileChange(e); }} className="hidden" />

      {!file ? (
        <div onClick={() => fileInputRef.current?.click()} className="bg-white dark:bg-[#1A1D1B] border-2 border-dashed border-[#D1D9D5] dark:border-stone-700 rounded-[28px] p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:bg-[#F4F6F5] dark:hover:bg-stone-800/50 transition-all duration-300 group relative">
          <div className="relative mb-6">
            <div className="group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-300 ease-out">
               <VeeMascot jumpDirection={jumpDirection} veeHealth={veeHealth} scale={1.1} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} />
            </div>
            <div className="absolute -bottom-1 -right-4 w-12 h-12 bg-[#FFD966] text-[#244135] rounded-[16px] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-300 border-4 border-white dark:border-[#1A1D1B]">
              <Camera size={20} strokeWidth={2.5} />
            </div>
          </div>
          <h3 className="font-extrabold text-[#244135] dark:text-stone-100 mb-1.5 text-base group-hover:text-[#8CE0A7] transition-colors">Beri Makan Vee</h3>
          <p className="text-xs text-[#A0B0A8] font-medium max-w-[220px]">Klik untuk upload foto makananmu biar Vision AI yang hitung kalorinya!</p>
        </div>
      ) : analyzing ? (
        <div className="bg-[#FFF9E6] dark:bg-stone-900 rounded-[28px] p-8 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden shadow-xl border border-transparent dark:border-stone-800">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-[#FFD966] shadow-[0_0_15px_#FFD966] animate-[scan_2s_ease-in-out_infinite]"></div>
          <div className="mb-4 opacity-50 blur-sm"><VeeMascot isEating={true} veeHealth={veeHealth} scale={1.2} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} /></div>
          <div className="flex items-center gap-3 bg-white/80 dark:bg-black/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-stone-200 dark:border-white/10 z-10 shadow-sm">
            <ScanLine size={16} className="text-[#B39200] dark:text-[#FFD966] animate-pulse" />
            <p className="font-bold text-[#B39200] dark:text-[#FFD966] text-xs uppercase tracking-widest">Memproses Makanan...</p>
          </div>
          <style>{`@keyframes scan { 0%, 100% { top: 0%; opacity: 0; } 10% { opacity: 1; } 50% { top: 100%; opacity: 1; } 90% { opacity: 0; } }`}</style>
        </div>
      ) : saved ? (
        <div className="bg-white dark:bg-[#1A1D1B] p-8 rounded-[28px] text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent dark:border-stone-800/50 animate-in zoom-in-95 duration-300">
           <div className="flex justify-center mb-6"><VeeMascot veeHealth={veeHealth} scale={1.2} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} /></div>
           <h3 className="text-xl font-black text-[#244135] dark:text-stone-100 mb-3">
             {veeHealth === 'waiting' ? 'Foto Disimpan! 📸' : 'Nyam! Kenyang~ 🎉'}
           </h3>
           <p className="text-[#647C73] dark:text-stone-400 text-sm font-medium mb-8 leading-relaxed">
             {veeHealth === 'waiting' 
               ? 'Server sedang offline. Vee akan menganalisis kalori makanan ini saat koneksi kembali.' 
               : 'Kalori dicatat. Liat deh badan Vee jadi melebar dan lebih chubby habis kamu kasih makan!'}
           </p>
           <button onClick={() => { setFile(null); setResult(null); setSaved(false); }} className="w-full py-4 rounded-[22px] bg-[#F4F6F5] dark:bg-[#121413] text-[#244135] dark:text-stone-100 font-black text-sm hover:scale-[1.02] transition-transform">Beri Makan Lagi</button>
        </div>
      ) : result ? (
        <div className="bg-white dark:bg-[#1A1D1B] rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent dark:border-stone-800/50 animate-in fade-in duration-300">
          <div className="w-full h-36 bg-[#FFF9E6] dark:bg-[#2A2616] rounded-[22px] mb-6 flex justify-center items-center relative overflow-hidden">
             <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FFD966] via-transparent to-transparent"></div>
             <VeeMascot isEating={true} veeHealth={veeHealth} scale={1} weight={weight} eyeLookX={eyeLookX} eyeLookY={eyeLookY} />
          </div>
          <h3 className="text-xl font-black text-[#244135] dark:text-stone-100 mb-3">{result.name}</h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {result.tags.map(tag => <span key={tag} className="px-3 py-1.5 bg-[#F4F6F5] dark:bg-stone-800 text-[#647C73] dark:text-stone-300 rounded-[10px] text-[10px] font-extrabold uppercase tracking-wide">{tag}</span>)}
          </div>
          <div className="bg-[#FF8A3D] rounded-[20px] p-5 flex justify-between items-center mb-4 shadow-[0_8px_20px_rgba(255,138,61,0.2)]">
            <span className="font-extrabold text-white text-sm flex items-center gap-2"><Flame size={18} /> Est. Kalori</span>
            <span className="text-3xl font-black text-white">{result.calories} <span className="text-xs font-bold text-[#FFF9E6]">kcal</span></span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
             <div className="bg-[#F4F6F5] dark:bg-[#121413] p-3 rounded-[16px]"><p className="text-[10px] font-bold text-[#A0B0A8] flex items-center gap-1.5 mb-1"><Droplet size={12}/> Lemak</p><p className="text-sm font-black text-[#244135] dark:text-stone-100">{result.macros.fat}g</p></div>
             <div className="bg-[#F4F6F5] dark:bg-[#121413] p-3 rounded-[16px]"><p className="text-[10px] font-bold text-[#A0B0A8] flex items-center gap-1.5 mb-1"><Wheat size={12}/> Karbo</p><p className="text-sm font-black text-[#244135] dark:text-stone-100">{result.macros.carbs}g</p></div>
             <div className="bg-[#F4F6F5] dark:bg-[#121413] p-3 rounded-[16px]"><p className="text-[10px] font-bold text-[#A0B0A8] flex items-center gap-1.5 mb-1"><Zap size={12}/> Protein</p><p className="text-sm font-black text-[#244135] dark:text-stone-100">{result.macros.protein}g</p></div>
          </div>
          <button onClick={handleSaveNutrition} className="w-full py-4 rounded-[22px] bg-[#244135] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-sm shadow-[0_8px_24px_rgba(36,65,53,0.15)] hover:scale-[1.02] transition-transform">Simpan Nutrisi</button>
        </div>
      ) : null}
    </div>
  );
}
