import React, { useState } from 'react';
import { 
  Layers, Plus, Search, AlertTriangle, TrendingUp, History, 
  ArrowUpRight, ArrowDownRight, Edit3, Filter, PackageCheck, Eye, EyeOff
} from 'lucide-react';
import { Product, StockMutation } from '../../types';

interface InventoryMutationsViewProps {
  products: Product[];
  mutations: StockMutation[];
  onOpenStockEdit: (product: Product) => void;
  onOpenRecordMutation: (productId?: string) => void;
  onOpenAddProduct: () => void;
  onToggleProductStatus: (id: string, isActive: boolean) => Promise<void>;
}

export const InventoryMutationsView: React.FC<InventoryMutationsViewProps> = ({
  products,
  mutations,
  onOpenStockEdit,
  onOpenRecordMutation,
  onOpenAddProduct,
  onToggleProductStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'mutations'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'empty'>('all');
  const [mutationTypeFilter, setMutationTypeFilter] = useState('all');

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // KPI Calculations
  const totalPhysicalStock = products.reduce((sum, p) => sum + p.totalStock, 0);

  // Low stock size count (< 5)
  let lowStockVariantsCount = 0;
  products.forEach(p => {
    p.sizes.forEach(s => {
      if (s.stock < 5) lowStockVariantsCount++;
    });
  });

  // Total Asset Valuation
  const totalAssetValuation = products.reduce((sum, p) => {
    const cost = p.costPrice || Math.round(p.price * 0.55);
    return sum + (cost * p.totalStock);
  }, 0);

  // Latest mutation
  const latestMutation = mutations.length > 0 ? mutations[0] : null;

  // Filter products
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

    if (stockStatusFilter === 'low') {
      const hasLow = p.sizes.some(s => s.stock > 0 && s.stock < 5);
      if (!hasLow) return false;
    } else if (stockStatusFilter === 'empty') {
      const hasEmpty = p.sizes.some(s => s.stock === 0);
      if (!hasEmpty) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  // Filter mutations
  const filteredMutations = mutations.filter(m => {
    if (mutationTypeFilter !== 'all' && m.type !== mutationTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.productName.toLowerCase().includes(q) ||
        m.mutationNumber.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        (m.referenceNumber && m.referenceNumber.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#FAF8F5]">
      {/* HEADER SECTION (MATCHING SCREENSHOT) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-brand font-bold text-lg text-[#2D2A26]">
              Inventaris & Mutasi Stok Barang
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Mutation Log</span>
            </div>
          </div>
          <p className="text-xs text-[#7A6E60] mt-1">
            Pantau ketersediaan fisik, varian ukuran sepatu (36–41), dan histori log mutasi keluar-masuk barang ke Google Cloud Firestore.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenRecordMutation()}
            className="px-4 py-2.5 bg-[#2D2A26] hover:bg-[#1A1816] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#E3B890]" />
            <span>+ Catat Mutasi Stok</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddProduct}
            className="px-4 py-2.5 bg-white hover:bg-[#FAF7F2] text-[#4A3E31] border border-[#DDD3C7] text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B36B73]" />
            <span>+ Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* 4 STAT KPI CARDS (MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Fisik Stok */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Total Fisik Stok</span>
            <PackageCheck className="w-4 h-4 text-[#B36B73]" />
          </div>
          <div className="text-2xl font-bold text-[#2D2A26] tabular-nums">
            {totalPhysicalStock} <span className="text-sm font-normal text-[#7F7466]">Pasang</span>
          </div>
          <p className="text-[11px] text-emerald-800 font-medium">
            Tersedia di Gudang Solo (12 Model)
          </p>
        </div>

        {/* Card 2: Peringatan Stok Menipis */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Peringatan Stok Menipis</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#B36B73] tabular-nums">
            {lowStockVariantsCount} <span className="text-sm font-normal text-[#7F7466]">Varian</span>
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            Stok &lt; 5 pasang (Perlu Restock)
          </p>
        </div>

        {/* Card 3: Total Nilai Aset Produk */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Total Nilai Aset Produk</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-bold text-[#2D2A26] tabular-nums">
            {formatIDR(totalAssetValuation)}
          </div>
          <p className="text-[11px] text-[#7A6E60]">
            Berdasarkan Snapshot HPP Modal
          </p>
        </div>

        {/* Card 4: Mutasi Terakhir */}
        <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-[#7F7466]">
            <span>Mutasi Terakhir</span>
            <History className="w-4 h-4 text-[#7A6E60]" />
          </div>
          <div className="text-sm font-bold text-[#2D2A26] truncate">
            {latestMutation ? `${latestMutation.productName}` : 'Belum ada mutasi'}
          </div>
          <p className="text-[11px] text-[#7A6E60] truncate">
            {latestMutation 
              ? `${latestMutation.quantity > 0 ? '+' : ''}${latestMutation.quantity} psg (Sz ${latestMutation.size}) · ${latestMutation.type}` 
              : 'Audit log tersinkron'}
          </p>
        </div>
      </div>

      {/* SUB-TABS & FILTERS */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Subtab Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-[#DDD3C7] p-0.5 bg-[#FAF7F2] shrink-0">
            <button
              onClick={() => setActiveSubTab('inventory')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'inventory' ? 'bg-[#2D2A26] text-white shadow-xs' : 'text-[#6E5C49] hover:bg-[#F2ECE4]'
              }`}
            >
              Daftar Stok Produk per Ukuran ({products.length})
            </button>
            <button
              onClick={() => setActiveSubTab('mutations')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeSubTab === 'mutations' ? 'bg-[#2D2A26] text-white shadow-xs' : 'text-[#6E5C49] hover:bg-[#F2ECE4]'
              }`}
            >
              Histori Mutasi Stok / Audit Trail ({mutations.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C8072] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeSubTab === 'inventory' ? "Cari nama flatshoes..." : "Cari no mutasi, produk, alasan..."}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl text-[#2D2A26] focus:outline-none focus:border-[#B36B73]"
            />
          </div>
        </div>

        {/* Filter Row */}
        {activeSubTab === 'inventory' ? (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2EDE6] text-xs">
            <span className="text-[#7A6E60] font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD3C7] rounded-lg text-xs"
            >
              <option value="all">Semua Kategori</option>
              <option value="ballet-maryjane">Ballet & Mary Jane</option>
              <option value="pointed-mules">Pointed Mules & Loafers</option>
              <option value="casual-slipons">Casual Soft Leather Slip-Ons</option>
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD3C7] rounded-lg text-xs"
            >
              <option value="all">Semua Status Stok</option>
              <option value="low">Ada Size Menipis (&lt; 5)</option>
              <option value="empty">Ada Size Habis (0)</option>
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2EDE6] text-xs">
            <span className="text-[#7A6E60] font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Mutasi:
            </span>

            <select
              value={mutationTypeFilter}
              onChange={(e) => setMutationTypeFilter(e.target.value)}
              className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD3C7] rounded-lg text-xs"
            >
              <option value="all">Semua Jenis Mutasi</option>
              <option value="MASUK_RESTOCK">Stok Masuk (Restock)</option>
              <option value="KELUAR_POS">Stok Keluar (POS Kasir)</option>
              <option value="KELUAR_ONLINE">Stok Keluar (Online Webstore)</option>
              <option value="PENYESUAIAN_RUSAK">Penyesuaian (Sampel / Rusak)</option>
              <option value="RETUR_BATAL">Retur / Batal Transaksi</option>
              <option value="KOREKSI_STOK">Koreksi Opname Fisik</option>
            </select>
          </div>
        )}
      </div>

      {/* CONTENT TABLE: INVENTORY LIST */}
      {activeSubTab === 'inventory' ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DA] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">HPP (Modal)</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Rincian Stok Size (36–41)</th>
                  <th className="py-3 px-4 text-center">Total Fisik</th>
                  <th className="py-3 px-4 text-center">Status Toko</th>
                  <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EDE6]">
                {filteredProducts.map((p) => {
                  const cost = p.costPrice || Math.round(p.price * 0.55);
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 object-cover rounded-xl border border-[#E5DDD2] shrink-0"
                          />
                          <div>
                            <div className="font-bold text-[#2D2A26]">{p.name}</div>
                            <div className="text-[11px] text-[#8C8072]">
                              {p.colors.map(c => c.name).join(', ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#63574A]">
                        {p.categoryName}
                      </td>
                      <td className="py-3 px-4 text-[#7A6D5E] tabular-nums font-medium">
                        {formatIDR(cost)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#B36B73] tabular-nums">
                        {formatIDR(p.price)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.sizes.map((s) => (
                            <span
                              key={s.size}
                              className={`px-1.5 py-0.5 rounded text-[10px] tabular-nums ${
                                s.stock === 0
                                  ? 'bg-rose-100 text-rose-800 font-bold'
                                  : s.stock <= 5
                                  ? 'bg-amber-100 text-amber-800 font-bold'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {s.size}: <strong>{s.stock}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#2D2A26] tabular-nums">
                        {p.totalStock} psg
                      </td>
                      <td className="py-3 px-4 text-center">
                        {p.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            Nonaktif (Arsip)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenStockEdit(p)}
                            className="px-2.5 py-1 bg-[#FAF2E8] hover:bg-[#F2E5D6] text-[#694F38] border border-[#E5DACD] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Edit Stok Cepat"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Ubah Stok</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenRecordMutation(p.id)}
                            className="px-2.5 py-1 bg-white hover:bg-[#FAF8F5] text-[#2D2A26] border border-[#DDD3C7] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            title="Catat Mutasi Khusus Produk Ini"
                          >
                            <span>+ Mutasi</span>
                          </button>

                          {/* Soft toggle status: NO DELETE */}
                          <button
                            type="button"
                            onClick={() => onToggleProductStatus(p.id, p.isActive === false)}
                            className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                              p.isActive !== false
                                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={p.isActive !== false ? "Arsipkan / Nonaktifkan dari Webstore" : "Aktifkan kembali ke Webstore"}
                          >
                            {p.isActive !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* AUDIT TRAIL MUTATION LOGS TABLE */
        <div className="bg-white rounded-2xl border border-[#EAE3DA] overflow-hidden shadow-2xs">
          <div className="p-4 bg-[#FAF7F2] border-b border-[#EAE3DA] flex items-center justify-between text-xs">
            <span className="font-bold text-[#4A3E31]">
              Audit Trail Jejak Mutasi Stok (Immutable / Tidak Dapat Dihapus)
            </span>
            <span className="text-[11px] text-[#7A6E60]">
              Total {filteredMutations.length} entri tercatat di database
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">No. Mutasi</th>
                  <th className="py-3 px-4">Produk & Ukuran</th>
                  <th className="py-3 px-4">Jenis Mutasi</th>
                  <th className="py-3 px-4 text-center">Perubahan Qty</th>
                  <th className="py-3 px-4 text-center">Stok (Awal &rarr; Akhir)</th>
                  <th className="py-3 px-4">Alasan & Referensi</th>
                  <th className="py-3 px-4 text-right">Petugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EDE6]">
                {filteredMutations.map((m) => (
                  <tr key={m.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-3 px-4 text-[#63574A] whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#2D2A26]">
                      {m.mutationNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#2D2A26]">{m.productName}</div>
                      <div className="text-[11px] text-[#7A6E60]">Ukuran {m.size}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        m.type === 'MASUK_RESTOCK' || m.type === 'RETUR_BATAL'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : m.type === 'KELUAR_POS' || m.type === 'KELUAR_ONLINE'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {m.type === 'MASUK_RESTOCK' ? 'Restock Gudang' :
                         m.type === 'KELUAR_POS' ? 'Keluar POS Kasir' :
                         m.type === 'KELUAR_ONLINE' ? 'Keluar Webstore' :
                         m.type === 'RETUR_BATAL' ? 'Retur / Batal' : 'Penyesuaian'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold tabular-nums">
                      {m.quantity > 0 ? (
                        <span className="text-emerald-700 flex items-center justify-center gap-0.5">
                          <ArrowUpRight className="w-3.5 h-3.5" /> +{m.quantity}
                        </span>
                      ) : (
                        <span className="text-rose-700 flex items-center justify-center gap-0.5">
                          <ArrowDownRight className="w-3.5 h-3.5" /> {m.quantity}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[11px] text-[#4A3E31] tabular-nums">
                      {m.previousStock} &rarr; <strong>{m.newStock}</strong>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-[#2D2A26]">{m.reason}</div>
                      {m.referenceNumber && (
                        <span className="font-mono text-[10px] text-[#8C8072] block">
                          Ref: {m.referenceNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-[#63574A] whitespace-nowrap">
                      {m.operator || 'Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
