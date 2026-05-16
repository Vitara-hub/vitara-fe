// src/components/landing/FeaturesSection.tsx
import { useRef, useState, MouseEvent as ReactMouseEvent } from 'react';
import { ArrowRight, Brain, Activity, Utensils, Moon, LucideIcon } from 'lucide-react';

interface FeatureItem {
  icon: LucideIcon;
  bgC: string;
  icBg: string;
  icC: string;
  title: string;
  delay: string;
  bento: string;
  desc: string;
}

interface BentoCardProps {
  feature: FeatureItem;
}

function BentoCard({ feature }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [transformStyle, setTransformStyle] = useState<string>('');

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = ((y - centerY) / centerY) * -4; 
    const tiltY = ((x - centerX) / centerX) * 4;
    setTransformStyle(`perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setTransformStyle(''); }}
      style={{ transform: transformStyle, transition: isHovered ? 'none' : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }}
      className={`glass-noise relative group ${feature.bgC} backdrop-blur-2xl rounded-[24px] p-5 md:p-6 border border-white/40 dark:border-stone-700/50 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] reveal-on-scroll opacity-0 translate-y-12 ease-out ${feature.delay} ${feature.bento} flex flex-col justify-between overflow-hidden cursor-default`}
    >
      <div className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0, background: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, rgba(140, 224, 167, 0.15), transparent 80%)` }} />
      <div className="relative z-10 flex items-start justify-between mb-3">
        <div className={`w-10 h-10 md:w-12 md:h-12 ${feature.icBg} ${feature.icC} rounded-[16px] flex items-center justify-center shrink-0 shadow-sm group-hover:rotate-6 transition-transform duration-300`}>
          <feature.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.2} />
        </div>
        <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center text-black/20 dark:text-white/20 group-hover:text-[#2B4B3D] dark:group-hover:text-[#8CE0A7] transition-colors"><ArrowRight size={14} /></div>
      </div>
      <div className="relative z-10">
        <h3 className="text-[20px] md:text-[24px] font-extrabold text-[#2B4B3D] dark:text-stone-100 mb-2">{feature.title}</h3>
        <p className="text-[#8CAAB8] dark:text-stone-400 text-[13px] md:text-[14px] font-medium leading-[1.6] line-clamp-3">{feature.desc}</p>
      </div>
    </div>
  );
}

export default function FeaturesSection() {
  const features: FeatureItem[] = [
    { icon: Brain, bgC: "bg-[#E8F0EA] dark:bg-stone-800/60", icBg: "bg-white dark:bg-stone-700", icC: "text-[#2B7A50] dark:text-[#8CE0A7]", title: "Mood & Mental", delay: "delay-100", bento: "md:col-span-2 md:row-span-2", desc: "Cukup tulis apa yang kamu rasakan tanpa format rumit. Vitara membantu memahami pola pikiranmu dari waktu ke waktu layaknya bercerita ke teman." },
    { icon: Activity, bgC: "bg-[#FFF0E6] dark:bg-stone-800/60", icBg: "bg-white dark:bg-stone-700", icC: "text-[#C4621A] dark:text-[#FF9F66]", title: "Stress Radar", delay: "delay-200", bento: "md:col-span-1 md:row-span-1", desc: "Tanda kecil sering terlewat. Sadari lebih awal." },
    { icon: Utensils, bgC: "bg-[#FFF9E6] dark:bg-stone-800/60", icBg: "bg-white dark:bg-stone-700", icC: "text-[#8A6800] dark:text-[#FFD966]", title: "Nutrition", delay: "delay-300", bento: "md:col-span-1 md:row-span-1", desc: "Log makanan instan menggunakan analisis Vision AI." },
    { icon: Moon, bgC: "bg-[#EEF2F5] dark:bg-stone-800/60", icBg: "bg-white dark:bg-stone-700", icC: "text-[#3A6B7C] dark:text-[#A3C4D1]", title: "Sleep Cycle", delay: "delay-400", bento: "md:col-span-3 md:row-span-1", desc: "Bukan cuma durasi. Tapi kualitas pemulihan yang bisa kamu rasakan bedanya keesokan harinya." },
  ];

  return (
    <div className="bg-[#FAF9F6] dark:bg-[#121413] w-full relative shrink-0 transition-colors duration-300">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24 relative z-20">
        <div className="reveal-on-scroll opacity-0 translate-y-12 transition-all duration-700 ease-out">
          <div className="inline-block bg-[#FF9F66]/20 text-[#B35A1A] dark:text-[#FF9F66] px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] md:text-xs font-extrabold uppercase tracking-[0.08em] mb-3 md:mb-4 border border-[#FF9F66]/30">4 Things That Matter</div>
          <h2 className="text-[32px] md:text-[52px] font-black text-[#2B4B3D] dark:text-stone-50 tracking-[-0.02em] mb-8 md:mb-12 leading-[1.1]">Small inputs.<br/>Big clarity.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 auto-rows-[180px]">
          {features.map((f, i) => <BentoCard key={i} feature={f} />)}
        </div>
      </div>
    </div>
  );
}