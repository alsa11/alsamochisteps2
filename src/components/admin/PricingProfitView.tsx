import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Percent, TrendingUp, Save, Sparkles, Filter, 
  Check, AlertCircle, RefreshCw, Calculator, ArrowUpRight, ShieldCheck 
} from 'lucide-react';
import { Product } from '../../types';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface PricingProfitViewProps {
  products: Product[];
  onRefreshProducts: () => Promise<void>;
}

interface ProductPricingItem {
  id: string;
  name: string;
  image: string;
  category: string;
  categoryName: string;
  totalStock: number;
  costPrice: number;        // Harga Beli / Modal (HPP)
  markupPercent: number;    // Target Markup (%)
  recommendedPrice: number; // Harga Jual Rekomendasi = HPP * (1 + markup/100)
  sellingPrice: number;     // Harga Jual Aktual
  profit: number;           // Keuntungan per Produk = sellingPrice - costPrice
  marginPercent: number;    // Margin Profit = (profit / sellingPrice) * 100
  isModified?: boolean;
}

export const PricingProfitView: React.FC<PricingProfitViewProps> = ({
  products,
  onRefreshProducts
}) => {
  const [items, setItems] = useState<ProductPricingItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [massMarkupPercent, setMassMarkupPercent] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Initialize items from products
  useEffect(() => {
    const list: ProductPricingItem[] = products.map(p => {
      const cost = p.costPrice || Math.round(p.price * 0.55);
      const sell = p.price;
      // Derived markup from current prices: markup = ((sell - cost) / cost) * 100
      const derivedMarkup = cost > 0 ? Math.round(((sell - cost) / cost) * 100) : 50;
      const profit = Math.max(0, sell - cost);
      const margin = sell > 0 ? Math.round((profit / sell) * 100) : 0;
      const recommended = Math.round(cost * (1 + derivedMarkup / 100));

      return {
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category,
        categoryName: p.categoryName,
        totalStock: p.totalStock,
        costPrice: cost,
        markupPercent: derivedMarkup,
        recommendedPrice: recommended,
        sellingPrice: sell,
        profit,
        marginPercent: margin,
        isModified: false
      };
    });

    setItems(list);
    setHasUnsavedChanges(false);
  }, [products]);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Recalculate single product row
  const handleUpdateProductRow = (
    id: string, 
    field: 'costPrice' | 'markupPercent' | 'sellingPrice', 
    value: number
  ) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      let newCost = item.costPrice;
      let newMarkup = item.markupPercent;
      let newSell = item.sellingPrice;

      if (field === 'costPrice') {
        newCost = Math.max(1000, value);
        // Formula: Harga Jual = Harga Beli * (1 + Markup/100)
        newSell = Math.round(newCost * (1 + newMarkup / 100));
      } else if (field === 'markupPercent') {
        newMarkup = Math.max(0, value);
        newSell = Math.round(newCost * (1 + newMarkup / 100));
      } else if (field === 'sellingPrice') {
        newSell = Math.max(1000, value);
        newMarkup = newCost > 0 ? Math.round(((newSell - newCost) / newCost) * 100) : 0;
      }

      const recommended = Math.round(newCost * (1 + newMarkup / 100));
      const profit = Math.max(0, newSell - newCost);
      const margin = newSell > 0 ? Math.round((profit / newSell) * 100) : 0;

      return {
        ...item,
        costPrice: newCost,
        markupPercent: newMarkup,
        recommendedPrice: recommended,
        sellingPrice: newSell,
        profit,
        marginPercent: margin,
        isModified: true
      };
    }));

    setHasUnsavedChanges(true);
  };

  // Terapkan Markup Massal berdasarkan Kategori
  const handleApplyMassMarkup = () => {
    setItems(prev => prev.map(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return item;
      }

      // Rumus: Harga Jual = Harga Beli * (1 + Markup/100)
      const recommended = Math.round(item.costPrice * (1 + massMarkupPercent / 100));
      // Round to nearest 1.000 for clean Indonesian retail pricing
      const roundedSell = Math.round(recommended / 1000) * 1000;
      const profit = Math.max(0, roundedSell - item.costPrice);
      const margin = roundedSell > 0 ? Math.round((profit / roundedSell) * 100) : 0;

      return {
        ...item,
        markupPercent: massMarkupPercent,
        recommendedPrice: recommended,
        sellingPrice: roundedSell,
        profit,
        marginPercent: margin,
        isModified: true
      };
    }));

    setHasUnsavedChanges(true);
    setSaveSuccessMsg(`✓ Markup ${massMarkupPercent}% berhasil diterapkan ke produk (${selectedCategory === 'all' ? 'Semua Kategori' : selectedCategory}). Klik "Simpan Perubahan" untuk menyimpan ke database.`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Simpan Perubahan ke Database Firestore
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      // Update each modified product in Firestore
      const modifiedItems = items.filter(it => it.isModified);
      if (modifiedItems.length === 0) {
        setSaveSuccessMsg('Tidak ada perubahan harga yang perlu disimpan.');
        setIsSaving(false);
        return;
      }

      for (const item of modifiedItems) {
        const prodRef = doc(db, 'products', item.id);
        await updateDoc(prodRef, {
          price: item.sellingPrice,
          costPrice: item.costPrice,
          originalPrice: Math.round(item.sellingPrice * 1.35)
        });
      }

      // Refresh master products
      await onRefreshProducts();

      // Clear modified flags
      setItems(prev => prev.map(it => ({ ...it, isModified: false })));
      setHasUnsavedChanges(false);

      setSaveSuccessMsg(`✓ Berhasil menyimpan ${modifiedItems.length} perubahan harga ke Google Cloud Firestore! Harga webstore dan POS kasir telah tersinkronisasi.`);
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan harga ke Firestore');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    }
    return true;
  });

  // Aggregate Metrics
  const avgMarkup = items.length > 0 
    ? Math.round(items.reduce((acc, it) => acc + it.markupPercent, 0) / items.length) 
    : 0;

  const avgMargin = items.length > 0 
    ? Math.round(items.reduce((acc, it) => acc + it.marginPercent, 0) / items.length) 
    : 0;

  const totalStockValuationCost = items.reduce((acc, it) => acc + (it.costPrice * it.totalStock), 0);
  const totalStockValuationSell = items.reduce((acc, it) => acc + (it.sellingPrice * it.totalStock), 0);
  const potentialGrossProfit = totalStockValuationSell - totalStockValuationCost;

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#FAF8F5]">
      {/* HEADER SECTION */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-brand font-bold text-lg text-[#2D2A26] flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#B36B73]" />
              <span>Pengaturan Harga Beli, Markup &amp; Margin Profit</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              Formula: Harga Jual = HPP × (1 + Markup%)
            </span>
          </div>
          <p className="text-xs text-[#7A6E60] mt-1">
            Kelola modal beli (HPP), target markup massal berdasarkan kategori, serta hitung keuntungan bersih dan margin profit otomatis ke Google Cloud Firestore.
          </p>
        </div>

        {/* Primary Save Changes Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              hasUnsavedChanges
                ? 'bg-emerald-700 hover:bg-emerald-800 text-white animate-pulse'
                : 'bg-[#DDD3C7] text-[#7A6E60] cursor-not-allowed opacity-75'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan ke Firestore...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan ke Database</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* FEEDBACK NOTIFICATION */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2.5 shadow-2xs animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 4 KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Rata-rata Markup */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Rata-rata Markup Toko</span>
            <TrendingUp className="w-4 h-4 text-[#B36B73]" />
          </div>
          <div className="text-2xl font-bold text-[#2D2A26] tabular-nums">
            {avgMarkup}%
          </div>
          <p className="text-[11px] text-[#7A6E60]">
            Target markup atas modal HPP
          </p>
        </div>

        {/* Card 2: Rata-rata Margin Profit */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Rata-rata Margin Profit</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 tabular-nums">
            {avgMargin}%
          </div>
          <p className="text-[11px] text-[#7A6E60]">
            Margin laba atas harga jual final
          </p>
        </div>

        {/* Card 3: Total Nilai Modal Fisik */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Total Modal Stok Gudang</span>
            <DollarSign className="w-4 h-4 text-[#7A6E60]" />
          </div>
          <div className="text-xl font-bold text-[#453D34] tabular-nums">
            {formatIDR(totalStockValuationCost)}
          </div>
          <p className="text-[11px] text-[#7A6E60]">
            Berdasarkan stok fisik 12 model
          </p>
        </div>

        {/* Card 4: Potensi Keuntungan Kotor */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Potensi Keuntungan Kotor</span>
            <ArrowUpRight className="w-4 h-4 text-[#B36B73]" />
          </div>
          <div className="text-xl font-bold text-[#B36B73] tabular-nums">
            {formatIDR(potentialGrossProfit)}
          </div>
          <p className="text-[11px] text-emerald-800 font-medium">
            Jika seluruh stok fisik terjual
          </p>
        </div>
      </div>

      {/* MASS MARKUP CONTROL PANEL */}
      <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E3B890]" />
            <span>Terapkan Markup Massal Berdasarkan Kategori</span>
          </h3>
          <span className="text-[11px] text-[#7A6E60]">
            Rumus: Harga Jual = Harga Beli × (1 + Markup/100)
          </span>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-1">
          {/* Category & Percentage Input */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5A4E42]">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl text-xs font-medium focus:outline-none focus:border-[#B36B73]"
              >
                <option value="all">Semua Kategori (12 Produk)</option>
                <option value="ballet-maryjane">Ballet &amp; Mary Jane</option>
                <option value="pointed-mules">Pointed Mules &amp; Loafers</option>
                <option value="casual-slipons">Casual Soft Leather Slip-Ons</option>
              </select>
            </div>

            {/* Markup Input with Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5A4E42]">Target Markup:</span>
              <div className="relative w-24">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={massMarkupPercent}
                  onChange={(e) => setMassMarkupPercent(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 pr-7 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl font-bold text-[#2D2A26] focus:outline-none focus:border-[#B36B73]"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C8072]">
                  %
                </span>
              </div>
            </div>

            {/* Quick Percentage Presets */}
            <div className="flex items-center gap-1.5">
              {[30, 40, 50, 65, 75, 100].map(pct => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setMassMarkupPercent(pct)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    massMarkupPercent === pct
                      ? 'bg-[#2D2A26] text-white border-[#2D2A26]'
                      : 'bg-[#FAF8F5] text-[#5A4E42] border-[#DDD3C7] hover:bg-[#F2ECE3]'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApplyMassMarkup}
            className="px-4 py-2.5 bg-[#B36B73] hover:bg-[#9B5A61] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <span>Terapkan Markup ke {selectedCategory === 'all' ? 'Semua Produk' : 'Kategori Terpilih'}</span>
          </button>
        </div>
      </div>

      {/* PRICING TABLE */}
      <div className="bg-white rounded-2xl border border-[#EAE3DA] overflow-hidden shadow-2xs">
        {/* Table Filter & Search Header */}
        <div className="p-4 border-b border-[#EAE3DA] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FAF8F5]">
          <div className="text-xs font-bold text-[#2D2A26]">
            Tabel Harga &amp; Keuntungan Produk ({filteredItems.length} Model)
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama flatshoes..."
              className="w-full pl-3 pr-3 py-1.5 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Produk Sepatu</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Beli / HPP</th>
                <th className="py-3 px-4 text-center">Markup Target</th>
                <th className="py-3 px-4">Rekomendasi Jual</th>
                <th className="py-3 px-4">Harga Jual Aktual</th>
                <th className="py-3 px-4">Keuntungan / Psg</th>
                <th className="py-3 px-4 text-center">Margin Laba</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EDE6]">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-[#FAF8F5] transition-colors ${item.isModified ? 'bg-amber-50/40' : ''}`}>
                  {/* Foto & Nama */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-11 h-11 object-cover rounded-xl border border-[#E5DDD2] shrink-0"
                      />
                      <div>
                        <div className="font-bold text-[#2D2A26]">{item.name}</div>
                        <div className="text-[11px] text-[#8C8072]">
                          Stok: <strong>{item.totalStock}</strong> pasang
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Kategori */}
                  <td className="py-3 px-4 text-[#63574A]">
                    {item.categoryName}
                  </td>

                  {/* Harga Beli / HPP (Editable) */}
                  <td className="py-3 px-4">
                    <div className="relative w-28">
                      <input
                        type="number"
                        step="1000"
                        value={item.costPrice}
                        onChange={(e) => handleUpdateProductRow(item.id, 'costPrice', parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#DDD3C7] rounded-lg font-mono text-[#4A3E31] focus:outline-none focus:border-[#B36B73]"
                      />
                    </div>
                  </td>

                  {/* Target Markup % (Editable) */}
                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={item.markupPercent}
                        onChange={(e) => handleUpdateProductRow(item.id, 'markupPercent', parseInt(e.target.value) || 0)}
                        className="w-14 px-1.5 py-1 text-xs text-center bg-white border border-[#DDD3C7] rounded-lg font-bold text-[#2D2A26] focus:outline-none focus:border-[#B36B73]"
                      />
                      <span className="text-[11px] font-bold text-[#8C8072]">%</span>
                    </div>
                  </td>

                  {/* Rekomendasi Jual (Computed) */}
                  <td className="py-3 px-4 font-mono text-[#7A6E60]">
                    {formatIDR(item.recommendedPrice)}
                  </td>

                  {/* Harga Jual Aktual (Editable) */}
                  <td className="py-3 px-4">
                    <div className="relative w-32">
                      <input
                        type="number"
                        step="1000"
                        value={item.sellingPrice}
                        onChange={(e) => handleUpdateProductRow(item.id, 'sellingPrice', parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#B36B73]/50 rounded-lg font-mono font-bold text-[#B36B73] focus:outline-none focus:border-[#B36B73]"
                      />
                    </div>
                  </td>

                  {/* Keuntungan per Pasang */}
                  <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                    +{formatIDR(item.profit)}
                  </td>

                  {/* Margin Laba % */}
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.marginPercent}%
                    </span>
                  </td>

                  {/* Status Modifikasi */}
                  <td className="py-3 px-4 text-center">
                    {item.isModified ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                        Diedit
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8C8072]">
                        Tersimpan
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer save reminder */}
        {hasUnsavedChanges && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 flex items-center justify-between">
            <span className="text-xs text-amber-900 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              Ada perubahan harga yang belum disimpan ke database.
            </span>
            <button
              type="button"
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
            >
              Simpan Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
