'use client';

import { Activity, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleMockLogin = () => {
    alert("Mock Login diklik! Nanti bakal otomatis masuk Supabase dan pindah ke /dashboard");
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Header Section - Diubah ke Emerald Green */}
        <div className="bg-emerald-500 p-10 text-center relative overflow-hidden">
          {/* Ornamen lingkaran abstrak di background header */}
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-emerald-400 rounded-full opacity-50 blur-2xl"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-emerald-300 rounded-full opacity-50 blur-xl"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20 mb-5 shadow-inner">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Vitara</h1>
            <p className="text-emerald-50 text-sm font-medium">Holistic Health Ecosystem</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="p-8">
          <div className="space-y-5 mb-10">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">Instant nutrition & calorie tracking</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">AI-driven mood & journal analysis</span>
            </div>
            <div className="flex items-center gap-4 text-slate-700">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium">Secure & private health records</span>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleMockLogin}
            className="w-full group flex items-center justify-center gap-3 bg-slate-900 text-white px-4 py-4 rounded-2xl hover:bg-slate-800 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="w-5 h-5 bg-white rounded-full p-0.5"
            />
            Continue with Google
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-400" />
          </button>
        </div>

      </div>
      
      <p className="mt-8 text-sm text-slate-400 font-medium">
        &copy; 2026 Vitara Team.
      </p>
    </div>
  );
}