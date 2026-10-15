import React from 'react';
import { Star, Eye, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd
}) => {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const isLowStock = product.totalStock > 0 && product.totalStock <= 15;
  const isOutOfStock = product.totalStock === 0;

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E9E2D8] hover:border-[#D1C3B4] hover:shadow-xl transition-all duration-300">
      
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-[#F7F4EF] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          referrerPolicy="no-referrer"
        />

        {/* Stock Badge / Tag */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFeatured && (
            <span className="bg-[#2D2A26] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm">
              Koleksi Favorit
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
              Habis Terjual
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-600 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
              Sisa {product.totalStock} Pasang!
            </span>
          ) : null}
        </div>

        {/* Floating Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={() => onSelect(product)}
            className="bg-white/95 hover:bg-white text-[#2D2A26] p-3 rounded-full shadow-lg transition-transform hover:scale-110"
            title="Lihat Detail & Ukuran"
          >
            <Eye className="w-4 h-4" />
          </button>
          {!isOutOfStock && (
            <button
              onClick={() => onQuickAdd(product)}
              className="bg-[#2D2A26] hover:bg-[#433E37] text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110"
              title="Tambah ke Keranjang"
            >
              <ShoppingCart className="w-4 h-4 text-[#F3EDE5]" />
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Unboxed Metadata (Zero-Pill discipline) */}
          <div className="flex items-center gap-2 text-xs text-[#8C8072] font-medium mb-1">
            <span>{product.categoryName}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">Stok: {product.totalStock}</span>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => onSelect(product)}
            className="font-brand font-semibold text-base text-[#24211D] group-hover:text-[#8C6D52] transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h3>

          {/* Colors available swatch dots */}
          <div className="flex items-center gap-1.5 mt-2">
            {product.colors.map((c, i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
            <span className="text-[11px] text-[#938A7E] ml-1">
              {product.colors.length} warna
            </span>
          </div>
        </div>

        {/* Price & Rating */}
        <div className="pt-2 border-t border-[#F2ECE4] flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-[#2D2A26] tabular-nums">
              {formatIDR(product.price)}
            </div>
            {product.originalPrice && (
              <div className="text-xs text-[#9E9385] line-through tabular-nums">
                {formatIDR(product.originalPrice)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-[#6B6154]">
            <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
            <span className="font-semibold tabular-nums">{product.rating}</span>
            <span className="text-[#9E9385] tabular-nums">({product.reviewCount})</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelect(product)}
          disabled={isOutOfStock}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all mt-1 ${
            isOutOfStock
              ? 'bg-[#EAE4DC] text-[#A3998C] cursor-not-allowed'
              : 'bg-[#F5EFE8] hover:bg-[#2D2A26] text-[#2D2A26] hover:text-white'
          }`}
        >
          {isOutOfStock ? 'Stok Habis' : 'Pilih Ukuran (36–41)'}
        </button>

      </div>
    </div>
  );
};
