import React from 'react';
import { ShoppingBag, Truck, ShieldCheck, Heart } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenTracking: () => void;
  onSelectCategory: (cat: string) => void;
  activeCategory: string;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  onOpenAdmin: () => void;
  isAdminLoggedIn?: boolean;
  onOpenDbInspector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenTracking,
  onSelectCategory,
  activeCategory,
  onOpenAdmin,
  isAdminLoggedIn = false
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Announcement Banner */}
      <div className="bg-[#24211E] text-[#F5EFE9] text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <Heart className="w-3.5 h-3.5 text-[#F6A5B2] fill-[#F6A5B2]" />
          Gratis Ongkir se-Jawa untuk pembelian 2 pasang flatshoes
        </span>
        <span className="text-[#8C8276] hidden md:inline">·</span>
        <span className="hidden md:inline text-[#D9D3CC]">Busa Insole Cloud-Cushion 8mm Empuk & Anti-Lecet</span>
      </div>

      {/* Main Top Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Zone 1: Brand Logo & Wordmark on Left */}
          <div className="flex items-center shrink-0">
            <a 
              href="#" 
              onClick={(e) => { 
                e.preventDefault(); 
                onSelectCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group flex items-center gap-3 whitespace-nowrap"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shadow-xs border border-[#E8DACB] shrink-0 bg-[#FCEAE9]">
                <img 
                  src="/src/assets/images/mochisteps_brand_logo_1791899999020.jpg" 
                  alt="Mochi Steps Logo" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex flex-col whitespace-nowrap">
                <span 
                  className="font-brand font-poppins font-bold text-xl sm:text-2xl tracking-tight text-[#24211D] group-hover:text-[#B36B73] transition-colors leading-tight"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Mochi Steps
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#9C9287] font-medium leading-none mt-0.5">
                  Step Into Your Style
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: Menu di Tengah: Beranda | Kategori | Katalog | Lacak Pesanan */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#5F5850]">
            <button
              onClick={() => {
                onSelectCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="whitespace-nowrap transition-colors py-1 hover:text-[#B36B73] cursor-pointer"
            >
              Beranda
            </button>
            <button
              onClick={() => {
                scrollToSection('collection-section');
              }}
              className="whitespace-nowrap transition-colors py-1 hover:text-[#B36B73] cursor-pointer"
            >
              Kategori
            </button>
            <button
              onClick={() => {
                scrollToSection('collection-section');
              }}
              className="whitespace-nowrap transition-colors py-1 hover:text-[#B36B73] cursor-pointer"
            >
              Katalog
            </button>
            <button
              onClick={onOpenTracking}
              className="whitespace-nowrap hover:text-[#B36B73] transition-colors flex items-center gap-1.5 py-1 text-[#5F5850] cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-[#B36B73]" />
              <span>Lacak Pesanan</span>
            </button>
          </nav>

          {/* Zone 3: Di pojok kanan tampil Keranjang dan Admin MochiSteps */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Icon Keranjang Saja */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-full text-[#2D2A26] hover:bg-[#F2ECE3] border border-[#DDD3C7] transition-all cursor-pointer active:scale-95 shadow-2xs"
              title="Keranjang Belanja"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5 text-[#2D2A26]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B36B73] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Admin MochiSteps Button */}
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-2xs cursor-pointer active:scale-95 ${
                isAdminLoggedIn
                  ? 'bg-[#FAF3EE] text-[#7A4B3A] border-[#E8DACB] hover:bg-[#F3E6D8]'
                  : 'bg-white hover:bg-[#FAF7F2] text-[#3D352E] border-[#DDD3C7]'
              }`}
              title="Akses Admin MochiSteps"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#B36B73] shrink-0" />
              <span className="font-medium">Admin MochiSteps</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isAdminLoggedIn ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
            </button>
          </div>

        </div>
      </header>
    </>
  );
};
