// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#FAF9F6] dark:bg-[#121413] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-[#FFF0E6] dark:bg-[#2A1E18] rounded-full flex items-center justify-center mb-6 shadow-sm">
            <AlertTriangle size={48} className="text-[#D96B2B] dark:text-[#FF9F66]" />
          </div>
          <h1 className="text-2xl font-black text-[#2B4B3D] dark:text-stone-50 mb-2">Vee Tersandung Bug! 🐛</h1>
          <p className="text-[#8CAAB8] text-sm font-medium mb-8 max-w-xs">
            Waduh, ada sedikit konslet di memori aplikasi. Nggak usah panik, data lu aman kok.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-[#1DB38A] dark:bg-[#8CE0A7] text-white dark:text-[#121413] font-bold rounded-full hover:scale-105 transition-transform shadow-lg"
          >
            <RefreshCw size={18} /> Muat Ulang Aplikasi
          </button>
          
          {/* Opsi untuk developer melihat error */}
          <details className="mt-8 text-left max-w-sm">
            <summary className="text-[10px] text-stone-400 cursor-pointer outline-none">Lihat Detail Error</summary>
            <p className="text-[10px] text-red-500 mt-2 bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30 overflow-auto">{this.state.errorMsg}</p>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}