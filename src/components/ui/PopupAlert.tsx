// src/components/PopupAlert.tsx
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export interface PopupState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface PopupAlertProps extends PopupState {
  onClose: () => void;
}

export default function PopupAlert({ isOpen, title, message, type, onClose }: PopupAlertProps) {
  if (!isOpen) return null;

  const bgColors = {
    success: 'bg-[#E6F7ED] dark:bg-[#1A2620]',
    error: 'bg-[#FFF0E6] dark:bg-[#2A1E18]',
    info: 'bg-[#EEF2F5] dark:bg-[#1A1D20]'
  };

  const textColors = {
    success: 'text-[#1DB38A] dark:text-[#8CE0A7]',
    error: 'text-[#D96B2B] dark:text-[#FF9F66]',
    info: 'text-[#4A7A8C] dark:text-[#8CAAB8]'
  };

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A1D1B] w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-[#E8F0EA] dark:border-stone-800 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-12 h-12 rounded-[16px] ${bgColors[type]} flex items-center justify-center ${textColors[type]} shadow-sm`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
          <button onClick={onClose} className="p-2 text-[#8CAAB8] hover:text-[#2B4B3D] dark:hover:text-stone-200 transition-colors bg-[#F4F6F5] dark:bg-stone-800 rounded-full">
            <X size={16} strokeWidth={3} />
          </button>
        </div>
        <h3 className="text-xl font-black text-[#2B4B3D] dark:text-stone-50 mb-2">{title}</h3>
        <p className="text-[#647C73] dark:text-stone-400 text-sm font-medium leading-relaxed whitespace-pre-line">{message}</p>
        <button onClick={onClose} className="w-full mt-6 py-4 rounded-[20px] bg-[#2B4B3D] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-black text-sm shadow-[0_8px_24px_rgba(36,65,53,0.15)] hover:scale-[1.02] active:scale-95 transition-all">
          Mengerti
        </button>
      </div>
    </div>
  );
}