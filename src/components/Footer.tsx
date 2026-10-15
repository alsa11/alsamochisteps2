import React from 'react';
import { MapPin, Phone, Mail, ShieldCheck, Heart, Sparkles, Ruler, Shield, Database } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onSelectCategory: (cat: string) => void;
  onOpenTracking: () => void;
  onOpenInsoleGuide: () => void;
  onOpenDbInspector?: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onSelectCategory,
  onOpenTracking,
  onOpenInsoleGuide,
  onOpenDbInspector,
  isAdminLoggedIn
}) => {
  return (
    <footer className="bg-[#24211E] text-[#D8CFBF] pt-16 pb-12 border-t border-[#3A3530]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#38332E]">
          
          {/* Col 1: Brand Story & Logo */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/src/assets/images/mochisteps_brand_logo_1791899999020.jpg" 
                alt="Mochi Steps Logo" 
                className="w-12 h-12 rounded-xl object-cover border border-white/20 bg-white"
              />
              <div>
                <span 
                  className="font-brand font-poppins font-bold text-2xl tracking-tight text-[#FAF7F2] block"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Mochi Steps
                </span>
                <span className="text-[11px] text-[#A69988] uppercase tracking-wider font-medium">
                  Step Into Your Style
                </span>
              </div>
            </div>

            <p className="text-xs text-[#ABA092] leading-relaxed max-w-sm">
              Sepatu flatshoes & loafers pilihan dengan kenyamanan busa insole cloud-cushion 8mm. 
              Didesain anggun untuk wanita aktif Indonesia. Bebas lecet, fleksibel, dan elegan.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs text-[#C9BFB2]">
              <span className="flex items-center gap-1.5 bg-[#312C27] px-3 py-1 rounded-md border border-[#453E38]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B36B73]" />
                100% Sepatu Flatshoes Pilihan
              </span>
              <button
                onClick={onOpenInsoleGuide}
                className="flex items-center gap-1.5 bg-[#312C27] hover:bg-[#3D3731] px-3 py-1 rounded-md border border-[#453E38] text-[#E8D0BB] transition-colors"
              >
                <Ruler className="w-3.5 h-3.5 text-[#B36B73]" />
                Panduan Insole Sepatu
              </button>
            </div>
          </div>

          {/* Col 2: Categories & Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 
              className="font-brand font-poppins font-bold text-xs uppercase tracking-wider text-[#F2ECE3]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Koleksi Flatshoes
            </h4>
            <ul className="space-y-2 text-xs text-[#B5A99B]">
              <li>
                <button
                  onClick={() => onSelectCategory('all')}
                  className="hover:text-white transition-colors"
                >
                  Semua Koleksi (12 Produk)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('ballet-maryjane')}
                  className="hover:text-white transition-colors"
                >
                  Ballet & Mary Jane Flats
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('pointed-mules')}
                  className="hover:text-white transition-colors"
                >
                  Pointed Mules & Loafers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('casual-slipons')}
                  className="hover:text-white transition-colors"
                >
                  Casual Soft Leather Slip-Ons
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenTracking}
                  className="hover:text-white transition-colors font-medium text-[#D1A67B]"
                >
                  Lacak Pesanan / Upload Bukti Bayar
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenInsoleGuide}
                  className="hover:text-white transition-colors font-medium text-[#B36B73]"
                >
                  Panduan Ukuran Insole (cm)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Exact Requested Contact Details */}
          <div className="md:col-span-4 space-y-3">
            <h4 
              className="font-brand font-poppins font-bold text-xs uppercase tracking-wider text-[#F2ECE3]"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Kontak Resmi Mochi Steps
            </h4>
            <div className="space-y-2.5 text-xs text-[#B8ACA0]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B36B73] shrink-0 mt-0.5" />
                <span>Jl. solo</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#B36B73] shrink-0" />
                <a 
                  href="https://wa.me/6281934424901?text=Halo%20Mochi%20Steps%20Solo%2C%20saya%20mau%20tanya%20produk%20flatshoes" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-white transition-colors font-mono"
                >
                  +62 81934424901
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#B36B73] shrink-0" />
                <a href="mailto:admin@mochisteps.com" className="hover:text-white transition-colors font-mono">
                  admin@mochisteps.com
                </a>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom Bar - Clean copyright and verified Database info */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8C8072]">
          <span 
            onClick={onOpenAdmin}
            className="cursor-pointer select-none hover:text-[#B5A99B] transition-colors"
            title="Akses Admin MochiSteps"
          >
            &copy; {new Date().getFullYear()} Mochi Steps. All rights reserved. Handcrafted in Indonesia.
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-[#C2B7AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Database: Firebase Cloud Firestore</span>
          </span>
        </div>

      </div>
    </footer>
  );
};
