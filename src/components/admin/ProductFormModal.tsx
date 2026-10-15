import React, { useState, useEffect } from 'react';
import { X, Sparkles, Calculator, Check, AlertCircle, Package, ArrowRight, Tag } from 'lucide-react';
import { Product, ProductCategory } from '../../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: any) => Promise<void>;
  initialProduct?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialProduct
}) => {
  const isEditing = Boolean(initialProduct);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('ballet-maryjane');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('/src/assets/images/flatshoes_ballet_maryjane_1791897850132.jpg');
  
  // Cost price & Selling price
  const [costPrice, setCostPrice] = useState<number>(185000);
  const [price, setPrice] = useState<number>(349000);
  const [originalPrice, setOriginalPrice] = useState<number>(429000);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Pricing calculator state
  const [calcMode, setCalcMode] = useState<'markup' | 'margin'>('markup');
  const [calcPercentage, setCalcPercentage] = useState<number>(40);

  // Size stocks
  const [sizes, setSizes] = useState([
    { size: 36, stock: 6 },
    { size: 37, stock: 10 },
    { size: 38, stock: 12 },
    { size: 39, stock: 8 },
    { size: 40, stock: 5 },
    { size: 41, stock: 3 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setCategory(initialProduct.category);
      setDescription(initialProduct.description || '');
      setImage(initialProduct.image || '/src/assets/images/flatshoes_ballet_maryjane_1791897850132.jpg');
      setCostPrice(initialProduct.costPrice || Math.round(initialProduct.price * 0.55));
      setPrice(initialProduct.price);
      setOriginalPrice(initialProduct.originalPrice || Math.round(initialProduct.price * 1.25));
      setIsActive(initialProduct.isActive !== false);
      if (initialProduct.sizes && initialProduct.sizes.length > 0) {
        setSizes(initialProduct.sizes.map(s => ({ ...s })));
      }
    } else {
      setName('');
      setCategory('ballet-maryjane');
      setDescription('Flatshoes elegan berkualitas premium dengan bantalan cloud-cushion ekstra lembut untuk kenyamanan melangkah sepanjang hari.');
      setImage('/src/assets/images/flatshoes_ballet_maryjane_1791897850132.jpg');
      setCostPrice(185000);
      setPrice(349000);
      setOriginalPrice(429000);
      setIsActive(true);
      setSizes([
        { size: 36, stock: 6 },
        { size: 37, stock: 10 },
        { size: 38, stock: 12 },
        { size: 39, stock: 8 },
        { size: 40, stock: 5 },
        { size: 41, stock: 3 }
      ]);
    }
  }, [initialProduct, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation based on formulas
  // Markup: harga jual = harga beli * (1 + markup% / 100)
  // Margin: harga jual = harga beli / (1 - margin% / 100)
  let calculatedSellingPrice = 0;
  if (costPrice > 0) {
    if (calcMode === 'markup') {
      const raw = costPrice * (1 + calcPercentage / 100);
      calculatedSellingPrice = Math.round(raw / 1000) * 1000;
    } else {
      const safeMargin = Math.min(99, Math.max(1, calcPercentage));
      const raw = costPrice / (1 - safeMargin / 100);
      calculatedSellingPrice = Math.round(raw / 1000) * 1000;
    }
  }

  const calculatedGrossProfit = Math.max(0, calculatedSellingPrice - costPrice);
  const actualMarginPct = calculatedSellingPrice > 0 ? ((calculatedGrossProfit / calculatedSellingPrice) * 100).toFixed(1) : '0';

  const handleApplyCalculatedPrice = () => {
    if (calculatedSellingPrice > 0) {
      setPrice(calculatedSellingPrice);
      setOriginalPrice(Math.round((calculatedSellingPrice * 1.22) / 1000) * 1000);
    }
  };

  const handleSizeStockChange = (index: number, val: number) => {
    const next = [...sizes];
    next[index].stock = Math.max(0, val);
    setSizes(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama produk wajib diisi');
      return;
    }
    if (price <= 0 || costPrice <= 0) {
      setError('Harga jual dan harga beli harus lebih dari Rp 0');
      return;
    }

    const totalStock = sizes.reduce((sum, s) => sum + s.stock, 0);
    const categoryNameMap: Record<ProductCategory, string> = {
      'ballet-maryjane': 'Ballet & Mary Jane',
      'pointed-mules': 'Pointed Mules & Loafers',
      'casual-slipons': 'Casual Soft Leather Slip-Ons'
    };

    const payload = {
      name: name.trim(),
      category,
      categoryName: categoryNameMap[category] || 'Ballet & Mary Jane',
      price: Number(price),
      originalPrice: Number(originalPrice) || Number(price),
      costPrice: Number(costPrice),
      isActive,
      image,
      description: description.trim(),
      features: [
        'Bahan Kulit Halus Lembut',
        'Insole Cloud-Cushion Empuk',
        'Sol Fleksibel Anti-Slip',
        'Jahitan Rapi Presisi'
      ],
      colors: [
        { name: 'Cream Ivory', hex: '#F5F2EB' },
        { name: 'Soft Blush', hex: '#E8CFCB' },
        { name: 'Onyx Black', hex: '#1F1F1F' }
      ],
      sizes,
      totalStock,
      rating: initialProduct?.rating || 4.9,
      reviewCount: initialProduct?.reviewCount || 120,
      isFeatured: initialProduct?.isFeatured || false
    };

    setIsSubmitting(true);
    setError(null);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan produk');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#2D2A26] to-[#1F1D1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#E3B890]" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-base text-[#FAF8F5]">
                {isEditing ? `Ubah Data Produk: ${initialProduct?.name}` : 'Tambah Produk Flatshoes Baru'}
              </h3>
              <p className="text-xs text-[#C2B7AA]">
                Disimpan langsung ke Google Cloud Firestore (Master Data Aman)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-[#3E352B] block mb-1">
                Nama Model Flatshoes *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Mochi Ribbon Ballet Flats"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] font-medium text-[#2D2A26]"
              />
            </div>

            <div>
              <label className="font-bold text-[#3E352B] block mb-1">
                Kategori Produk *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] font-medium text-[#2D2A26]"
              >
                <option value="ballet-maryjane">Ballet & Mary Jane</option>
                <option value="pointed-mules">Pointed Mules & Loafers</option>
                <option value="casual-slipons">Casual Soft Leather Slip-Ons</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-[#3E352B] block mb-1">
              Deskripsi Singkat Produk
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi kelembutan kulit, bantalan insole, dan keunggulan sepatu..."
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] text-[#2D2A26]"
            />
          </div>

          {/* PRICING & AUTOMATIC CALCULATOR SECTION */}
          <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5DACD] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#B36B73]" />
                <span className="font-brand font-bold text-sm text-[#2D2A26]">
                  Harga Beli & Kalkulator Harga Jual Otomatis
                </span>
              </div>
              <span className="text-[11px] bg-white px-2.5 py-0.5 rounded-full border border-[#DDD3C7] text-[#6E5C49] font-medium">
                Sesuai Rumus Finansial
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Cost Price */}
              <div>
                <label className="font-bold text-[#3E352B] block mb-1">
                  Harga Beli / HPP Modal (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="185000"
                  className="w-full px-3 py-2 bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] font-bold text-[#2D2A26] tabular-nums"
                />
                <span className="text-[10px] text-[#7F7466] mt-0.5 block">
                  Biaya produksi/pengadaan dari pengrajin per pasang
                </span>
              </div>

              {/* Calculator Mode Selection */}
              <div>
                <label className="font-bold text-[#3E352B] block mb-1">
                  Metode Kalkulasi:
                </label>
                <div className="flex rounded-xl overflow-hidden border border-[#DDD3C7] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setCalcMode('markup')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      calcMode === 'markup' ? 'bg-[#2D2A26] text-white' : 'text-[#6E5C49] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    Markup (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMode('margin')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      calcMode === 'margin' ? 'bg-[#2D2A26] text-white' : 'text-[#6E5C49] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    Margin (%)
                  </button>
                </div>
              </div>
            </div>

            {/* Percentage Input and Live Calculator Box */}
            <div className="p-3.5 bg-white rounded-xl border border-[#E3D7C9] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-[#483E33]">
                    Persentase {calcMode === 'markup' ? 'Markup' : 'Margin'}:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={calcMode === 'margin' ? 95 : 300}
                      value={calcPercentage}
                      onChange={(e) => setCalcPercentage(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-16 px-2 py-1 bg-[#FAF8F5] border border-[#DDD3C7] rounded-lg font-bold text-center tabular-nums"
                    />
                    <span className="font-bold text-[#2D2A26]">%</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-[#7A6C5D]">
                  <span>Formula: </span>
                  <code className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E5DACD] text-[#8C5840] font-mono text-[10px]">
                    {calcMode === 'markup' 
                      ? 'harga jual = harga beli × (1 + markup% / 100)'
                      : 'harga jual = harga beli / (1 − margin% / 100)'}
                  </code>
                </div>
              </div>

              {/* Live Preview Bar */}
              <div className="p-3 bg-gradient-to-r from-[#FDF9F3] to-[#F5ECE1] rounded-xl border border-[#E7DACB] flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-[#7A6E60]">Hasil Hitung Rekomendasi:</span>
                  <div className="text-base font-bold text-[#2D2A26] tabular-nums">
                    {formatIDR(calculatedSellingPrice)}
                  </div>
                  <div className="text-[10px] text-emerald-800 font-semibold">
                    Estimasi Laba Kotor: <strong>{formatIDR(calculatedGrossProfit)}</strong> / pasang (Margin: {actualMarginPct}%)
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyCalculatedPrice}
                  className="px-3.5 py-2 bg-[#2D2A26] hover:bg-[#1A1816] text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E3B890]" />
                  <span>Terapkan ke Harga Jual</span>
                </button>
              </div>
            </div>

            {/* Final Prices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-[#3E352B] block mb-1">
                  Harga Jual Final ke Pembeli (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="349000"
                  className="w-full px-3 py-2 bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] font-bold text-[#B36B73] text-sm tabular-nums"
                />
              </div>

              <div>
                <label className="font-bold text-[#3E352B] block mb-1">
                  Harga Coret / Promo (Rp)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="429000"
                  className="w-full px-3 py-2 bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] text-xs text-[#7F7466] line-through tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* STOCK PER SIZE */}
          <div className="p-4 bg-white rounded-2xl border border-[#DDD3C7] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#3E352B]">
                Persediaan Stok Fisik per Ukuran Sepatu (36–41) *
              </label>
              <span className="font-bold text-xs text-[#2D2A26]">
                Total: {sizes.reduce((sum, s) => sum + s.stock, 0)} Pasang
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {sizes.map((s, idx) => (
                <div key={s.size} className="p-2 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] text-center space-y-1">
                  <span className="text-[11px] font-bold text-[#5A4F42] block">Size {s.size}</span>
                  <input
                    type="number"
                    min={0}
                    value={s.stock}
                    onChange={(e) => handleSizeStockChange(idx, parseInt(e.target.value, 10) || 0)}
                    className="w-full py-1 text-center font-bold text-xs bg-white border border-[#DDD3C7] rounded-lg tabular-nums"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVE STATUS TOGGLE (NO HARD DELETE) */}
          <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E7DACB] flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-[#2D2A26] block">
                Status Tampil di Webstore
              </span>
              <span className="text-[11px] text-[#7A6D5E]">
                Jika dinonaktifkan, produk tidak akan muncul di katalog pembeli namun riwayat transaksi lama tetap utuh.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D2A26]"></div>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-3 border-t border-[#DDD3C7]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 border border-[#DDD3C7] hover:bg-[#FAF8F5] text-[#54483B] font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-[#2D2A26] hover:bg-[#1A1816] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Menyimpan ke Cloud Firestore...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#E3B890]" />
                  <span>{isEditing ? 'Simpan Perubahan Produk' : 'Terbitkan Produk ke Database'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
