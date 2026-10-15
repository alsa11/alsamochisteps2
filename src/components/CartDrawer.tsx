import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, ShieldCheck } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onCheckout: (discountAmount: number, promoCode: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - promoDiscount);

  const handleApplyPromo = () => {
    setPromoError(null);
    const code = promoCodeInput.trim().toUpperCase();
    if (code === 'MOCHI20' || code === 'MOCHILOVE' || code === 'SINTA') {
      setAppliedPromo(code);
      setPromoDiscount(20000);
      setPromoCodeInput('');
    } else {
      setPromoError('Kode voucher tidak valid. Gunakan MOCHI20 atau SINTA');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoDiscount(0);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EAE3DA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#2D2A26]" />
            <h2 className="font-brand text-lg font-bold text-[#2D2A26]">
              Keranjang Belanja ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#7F7568] hover:text-[#2D2A26] rounded-full hover:bg-[#F3ECE4] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-[#F5EFE7] rounded-full flex items-center justify-center text-[#8C6D52]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-brand font-semibold text-base text-[#2D2A26]">
                Keranjang Anda Masih Kosong
              </h3>
              <p className="text-xs text-[#7F7466] max-w-xs">
                Pilih flatshoes favorit Anda dengan kenyamanan insole busa empuk cloud-cushion.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-[#2D2A26] text-white rounded-xl text-xs font-semibold hover:bg-[#48423B] transition-all"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cartItemId}
                className="flex gap-4 p-3 bg-[#FAF8F5] rounded-xl border border-[#EDE6DC] relative group"
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shrink-0 border border-[#E5DDD2]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-brand font-semibold text-xs text-[#24211D] line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.cartItemId)}
                        className="text-[#A39789] hover:text-rose-600 transition-colors p-1"
                        title="Hapus produk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-[#7C7164] mt-0.5">
                      Ukuran: <strong className="text-[#2D2A26] tabular-nums">{item.selectedSize}</strong> · Warna: {item.selectedColor}
                    </div>

                    <div className="text-xs font-bold text-[#2D2A26] tabular-nums mt-1">
                      {formatIDR(item.price)}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-[#DDD3C7] rounded bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs hover:bg-[#F3EFE9]"
                      >
                        -
                      </button>
                      <span className="px-3 py-0.5 text-xs font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        className="px-2 py-0.5 text-xs hover:bg-[#F3EFE9] disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs font-bold text-[#8C6D52] tabular-nums">
                      {formatIDR(item.price * item.quantity)}
                    </span>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#EAE3DA] bg-[#FAF8F5] space-y-4">
            
            {/* Promo Code Input */}
            <div className="space-y-1.5">
              {appliedPromo ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Voucher <strong>{appliedPromo}</strong> aktif (-{formatIDR(promoDiscount)})</span>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Kode voucher (Coba: MOCHI20)"
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#DDD3C7] rounded-lg focus:outline-none focus:border-[#8C6D52]"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-3.5 py-2 bg-[#FAF3EC] border border-[#DDD0C2] hover:bg-[#EAE0D3] text-xs font-semibold text-[#483B2F] rounded-lg transition-colors"
                  >
                    Terapkan
                  </button>
                </div>
              )}
              {promoError && (
                <p className="text-[11px] text-rose-600">{promoError}</p>
              )}
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#6D6357]">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} produk)</span>
                <span className="font-semibold text-[#2D2A26] tabular-nums">{formatIDR(subtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Diskon Voucher</span>
                  <span className="tabular-nums">-{formatIDR(promoDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#24211D] pt-2 border-t border-[#EAE3DA]">
                <span>Total Estimasi</span>
                <span className="tabular-nums text-[#8C6D52]">{formatIDR(grandTotal)}</span>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-[#827668]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Pembayaran aman dengan transfer BCA, Mandiri & QRIS resmi.</span>
            </div>

            {/* Checkout Action */}
            <button
              onClick={() => {
                onCheckout(promoDiscount, appliedPromo || '');
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-[#2D2A26] hover:bg-[#433E37] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="w-4 h-4 text-[#F3EFE9]" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
