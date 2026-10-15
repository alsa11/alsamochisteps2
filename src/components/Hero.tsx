import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Heart, Sparkles, Ruler } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onCategoryClick: (cat: string) => void;
  onOpenInsoleGuide: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onCategoryClick, onOpenInsoleGuide }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F3EE] to-[#FAF8F5] pt-8 pb-16 sm:py-20 border-b border-[#EAE3DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Animated Text & Value Props */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col justify-center space-y-6"
          >
            {/* Tagline with Logo Pill */}
            <div className="inline-flex items-center gap-2.5 self-start bg-[#FCEAE9] border border-[#F3D1CF] px-3.5 py-1.5 rounded-full">
              <img 
                src="/src/assets/images/mochisteps_brand_logo_1791899999020.jpg" 
                alt="Logo Mochi Steps" 
                className="w-5 h-5 rounded-full object-cover"
              />
              <span 
                className="text-xs font-semibold text-[#8C4F56] tracking-wide font-brand font-poppins"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Mochi Steps · Step Into Your Style
              </span>
            </div>

            {/* Main Headline */}
            <h1 
              className="font-brand font-poppins text-3xl sm:text-5xl lg:text-5xl font-bold tracking-tight text-[#24211D] leading-[1.15]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Langkah Ringan Seperti Awan Bersama{' '}
              <span 
                className="text-[#B36B73] font-bold font-brand font-poppins" 
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Mochi Steps
              </span>.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#665E54] max-w-2xl leading-relaxed">
              Dibuat khusus untuk kenyamanan wanita Indonesia. Menggunakan insole busa 
              <strong className="text-[#2D2A26] font-semibold"> Cloud-Cushion 8mm</strong> yang ultra-empuk, 
              kulit lembut bebas lecet, dan desain anggun dari siluet ballet, pointed mules, hingga slip-ons santai.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center gap-2.5 bg-[#2D2A26] hover:bg-[#433E37] text-white px-7 py-3.5 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <span>Lihat 12 Koleksi Flatshoes</span>
                <ArrowRight className="w-4 h-4 text-[#E2D5C8]" />
              </button>

              <button
                onClick={onOpenInsoleGuide}
                className="inline-flex items-center gap-2 bg-[#FAF2EB] hover:bg-[#F3E5D8] text-[#7A5035] border border-[#ECD9C8] px-5 py-3.5 rounded-xl text-xs font-semibold transition-all shadow-2xs"
              >
                <Ruler className="w-4 h-4 text-[#B36B73]" />
                <span>Panduan Insole Sepatu</span>
              </button>
            </div>

            {/* Trust Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#EAE3DA]">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-[#EFE8DF] rounded-lg shrink-0">
                  <ShieldCheck className="w-4 h-4 text-[#7A5C41]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2D2A26]">100% Sepatu Flat</h4>
                  <p className="text-[11px] text-[#7A7268] leading-tight">Khusus flatshoes pilihan</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-[#EFE8DF] rounded-lg shrink-0">
                  <Heart className="w-4 h-4 text-[#7A5C41]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2D2A26]">Busa 8mm Anti-Lecet</h4>
                  <p className="text-[11px] text-[#7A7268] leading-tight">Melangkah tanpa pegal</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-[#EFE8DF] rounded-lg shrink-0">
                  <Sparkles className="w-4 h-4 text-[#7A5C41]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#2D2A26]">Garansi Pas Ukuran</h4>
                  <p className="text-[11px] text-[#7A7268] leading-tight">Bisa tukar size 36–41</p>
                </div>
              </div>
            </div>

          </motion.div>

          {/* Right Column: Hero Showcase Image with Framer Motion */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#E0D7CC] bg-[#F5EFE8]">
              <img
                src="/src/assets/images/hero_flatshoes_lifestyle_1791897849729.jpg"
                alt="Koleksi Flatshoes Mochi Steps"
                className="w-full h-[380px] sm:h-[460px] object-cover hover:scale-105 transition-transform duration-700"
                loading="eager"
              />

              {/* Overlay Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-white/60 shadow-lg flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#938779] font-semibold">
                    New Season Collection
                  </div>
                  <div className="text-sm font-bold text-[#24211D]">
                    Crafted with Softness & Grace
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#7A7165]">Mulai dari</div>
                  <div className="text-base font-extrabold text-[#B36B73] tabular-nums">
                    Rp 89.000
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#F5D8D8]/50 rounded-full blur-3xl -z-10 pointer-events-none" />
          </motion.div>

        </div>
      </div>
    </section>
  );
};
