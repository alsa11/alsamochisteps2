import React, { useState } from 'react';
import { X, Star, Check, ShieldCheck, RefreshCw, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: number, color: string, quantity: number, buyNow?: boolean) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart
}) => {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState<number>(
    product.sizes.find(s => s.stock > 0)?.size || product.sizes[0]?.size || 38
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const currentSizeObj = product.sizes.find(s => s.size === selectedSize);
  const availableStock = currentSizeObj?.stock || 0;
  const isOutOfStock = availableStock <= 0;

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;
    if (newQty > availableStock) return;
    setQuantity(newQty);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#DDD3C7] my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-[#7A7064] hover:text-[#2D2A26] bg-white/80 hover:bg-white rounded-full shadow-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left: Product Image */}
          <div className="bg-[#FAF7F2] p-6 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-[#EAE3DA]">
            <div className="w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-white">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Value markers */}
            <div className="w-full grid grid-cols-2 gap-3 mt-4 text-xs text-[#6B6154]">
              <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-lg border border-[#EBE4DB]">
                <ShieldCheck className="w-4 h-4 text-[#8C6D52] shrink-0" />
                <span>Kulit lembut bebas lecet</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 p-2.5 rounded-lg border border-[#EBE4DB]">
                <RefreshCw className="w-4 h-4 text-[#8C6D52] shrink-0" />
                <span>Bisa tukar size jika sempit</span>
              </div>
            </div>
          </div>

          {/* Right: Product Purchase Module */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category */}
              <div className="text-xs uppercase tracking-wider text-[#938576] font-semibold mb-1">
                {product.categoryName}
              </div>

              {/* Title */}
              <h2 className="font-brand text-2xl font-bold text-[#24211D]">
                {product.name}
              </h2>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-2 mt-2 text-xs text-[#63594C]">
                <div className="flex items-center text-[#D97706]">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold ml-1 tabular-nums">{product.rating}</span>
                </div>
                <span>·</span>
                <span className="text-[#877C6F] tabular-nums">{product.reviewCount} ulasan pembeli</span>
                <span>·</span>
                <span className="text-emerald-700 font-medium">Terverifikasi Ori</span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-bold text-[#24211D] tabular-nums">
                  {formatIDR(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-[#9C8F80] line-through tabular-nums">
                    {formatIDR(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    Hemat {formatIDR(product.originalPrice - product.price)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-4 text-xs text-[#61574B] leading-relaxed">
                {product.description}
              </p>

              {/* Color Selection */}
              <div className="mt-5">
                <label className="text-xs font-semibold text-[#2D2A26] block mb-2">
                  Pilihan Warna: <span className="font-normal text-[#756B5F]">{selectedColor}</span>
                </label>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        selectedColor === c.name
                          ? 'border-[#2D2A26] bg-[#FAF7F2] font-semibold text-[#2D2A26]'
                          : 'border-[#E2D8CC] hover:border-[#B5A898] text-[#5C5346]'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection with Real-time Stock & Insole Guide */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-[#2D2A26]">
                    Pilih Ukuran (EUR):
                  </label>
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs text-[#B36B73] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>📏 Panduan Insole Sepatu</span>
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {product.sizes.map((s) => {
                    const isSizeOut = s.stock === 0;
                    return (
                      <button
                        key={s.size}
                        disabled={isSizeOut}
                        onClick={() => {
                          setSelectedSize(s.size);
                          if (quantity > s.stock) setQuantity(Math.max(1, s.stock));
                        }}
                        className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition-all text-xs ${
                          isSizeOut
                            ? 'border-dashed border-[#DDD5CB] bg-[#F7F4F0] text-[#B3A99D] cursor-not-allowed'
                            : selectedSize === s.size
                            ? 'border-[#2D2A26] bg-[#2D2A26] text-white font-bold shadow-sm'
                            : 'border-[#DDD4C8] hover:border-[#8C6D52] text-[#3A352F] bg-white'
                        }`}
                      >
                        <span className="text-sm font-semibold tabular-nums">{s.size}</span>
                        <span className={`text-[10px] mt-0.5 ${selectedSize === s.size ? 'text-[#E2D4C5]' : 'text-[#877C6F]'}`}>
                          {isSizeOut ? 'Habis' : `${s.stock} pcs`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Stock Warning */}
                <div className="mt-2 text-xs">
                  {isOutOfStock ? (
                    <span className="text-rose-600 font-medium">Ukuran {selectedSize} saat ini habis terjual.</span>
                  ) : (
                    <span className="text-[#695F52]">
                      Tersedia <strong className="text-[#2D2A26] tabular-nums">{availableStock} pasang</strong> untuk ukuran {selectedSize}.
                    </span>
                  )}
                </div>
              </div>

              {/* Size Guide Table Toggle */}
              {showSizeGuide && (
                <div className="mt-3 p-3 bg-[#F8F5F0] rounded-xl border border-[#E2D8CC] text-xs">
                  <div className="font-semibold text-[#2D2A26] mb-1.5">Tabel Panduan Panjang Telapak Kaki:</div>
                  <div className="grid grid-cols-6 gap-1 text-center font-mono text-[11px]">
                    <div className="bg-white p-1 rounded">36: 23.0cm</div>
                    <div className="bg-white p-1 rounded">37: 23.5cm</div>
                    <div className="bg-white p-1 rounded">38: 24.0cm</div>
                    <div className="bg-white p-1 rounded">39: 24.5cm</div>
                    <div className="bg-white p-1 rounded">40: 25.0cm</div>
                    <div className="bg-white p-1 rounded">41: 25.5cm</div>
                  </div>
                  <div className="text-[10px] text-[#8C7E70] mt-1.5">
                    *Tip: Untuk kaki yang lebar / punggung kaki tebal, disarankan naik 1 size (upsize).
                  </div>
                </div>
              )}

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="mt-5 flex items-center gap-4">
                  <label className="text-xs font-semibold text-[#2D2A26]">Jumlah:</label>
                  <div className="flex items-center border border-[#DDD3C6] rounded-lg overflow-hidden bg-white">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="px-3 py-1.5 text-sm hover:bg-[#F3ECE3] disabled:opacity-40 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-bold tabular-nums min-w-[36px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= availableStock}
                      className="px-3 py-1.5 text-sm hover:bg-[#F3ECE3] disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-[#877C6F]">
                    Maks. {availableStock} pasang
                  </span>
                </div>
              )}

            </div>

            {/* CTAs */}
            <div className="pt-4 border-t border-[#EAE3DA] flex flex-col sm:flex-row gap-3">
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(product, selectedSize, selectedColor, quantity, false);
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-[#2D2A26] text-[#2D2A26] hover:bg-[#F7F2EC] font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ Keranjang</span>
              </button>

              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(product, selectedSize, selectedColor, quantity, true);
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#2D2A26] hover:bg-[#433E37] text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Beli Sekarang</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
