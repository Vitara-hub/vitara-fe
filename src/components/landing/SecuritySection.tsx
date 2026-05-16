// src/components/landing/SecuritySection.tsx
import { ShieldCheck, Lock, EyeOff, UserCheck } from 'lucide-react';

export default function SecuritySection() {
  const securityFeatures = [
    { icon: Lock, title: "Enkripsi End-to-End", desc: "Setiap jurnal dan log nutrisi diproses dengan standar industri sebelum masuk ke database." },
    { icon: EyeOff, title: "Zero Data Selling", desc: "Kami berkomitmen penuh untuk tidak pernah menjual data kesehatan maupun percakapanmu ke pihak ketiga." },
    { icon: UserCheck, title: "Kontrol Penuh", desc: "Kamu memegang kendali sepenuhnya. Hapus seluruh riwayat datamu dari server kapan saja dengan satu klik." }
  ];

  return (
    <div className="bg-[#2B4B3D] w-full relative overflow-hidden shrink-0 transition-colors duration-300">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#8CE0A7 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24 relative z-20">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 ease-out">
          <div className="w-12 h-12 bg-[#1A3024] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#8CE0A7]/20 shadow-[0_0_20px_rgba(140,224,167,0.1)]">
            <ShieldCheck className="text-[#8CE0A7]" size={24} strokeWidth={2} />
          </div>
          <h2 className="text-[28px] md:text-[40px] font-black text-white tracking-tight mb-4">Privasi kamu adalah prioritas.</h2>
          <p className="text-[#8CAAB8] text-[15px] md:text-[16px] font-medium leading-relaxed">
            Kesehatan mental dan fisik adalah hal yang sangat personal. Kami merancang arsitektur keamanan Vitara agar datamu tidak pernah jatuh ke tangan yang salah.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {securityFeatures.map((feature, idx) => (
            <div key={idx} className="bg-[#1A3024]/50 backdrop-blur-md border border-[#8CE0A7]/10 p-6 md:p-8 rounded-[24px] reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 ease-out hover:bg-[#1A3024] hover:border-[#8CE0A7]/30 hover:-translate-y-1" style={{ transitionDelay: `${idx * 150}ms` }}>
                <feature.icon className="text-[#1DB38A] mb-4" size={28} strokeWidth={2} />
                <h3 className="text-white font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-[#8CAAB8] text-[13px] md:text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}