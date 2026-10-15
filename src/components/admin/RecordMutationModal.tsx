import React, { useState } from 'react';
import { X, Layers, AlertCircle, Check, ArrowRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Product, StockMutationType } from '../../types';

interface RecordMutationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveMutation: (mutationData: any) => Promise<void>;
  currentUser: any;
  defaultProductId?: string;
}

export const RecordMutationModal: React.FC<RecordMutationModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveMutation,
  currentUser,
  defaultProductId
}) => {
  const [selectedProductId, setSelectedProductId] = useState(defaultProductId || (products[0]?.id || ''));
  const [selectedSize, setSelectedSize] = useState<number>(38);
  const [mutationType, setMutationType] = useState<StockMutationType>('MASUK_RESTOCK');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Penerimaan batch restock dari Workshop');
  const [referenceNumber, setReferenceNumber] = useState<string>('PO-SOLO-' + new Date().toISOString().slice(0, 10).replace(/-/g, ''));
  const [operator, setOperator] = useState<string>(currentUser?.name || 'Admin Logistik');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentProduct = products.find(p => p.id === selectedProductId) || products[0];
  const sizeObj = currentProduct?.sizes.find(s => s.size === selectedSize);
  const prevStock = sizeObj ? sizeObj.stock : 0;

  // Determine delta direction
  const isIncoming = mutationType === 'MASUK_RESTOCK' || mutationType === 'RETUR_BATAL';
  const delta = isIncoming ? Math.abs(quantity) : -Math.abs(quantity);
  const targetStock = Math.max(0, prevStock + delta);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) {
      setError('Pilih produk terlebih dahulu');
      return;
    }
    if (quantity <= 0) {
      setError('Jumlah mutasi harus lebih besar dari 0');
      return;
    }
    if (!reason.trim()) {
      setError('Alasan mutasi wajib dicatat untuk keperluan audit pembukuan');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const mutNumber = 'MUT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
      await onSaveMutation({
        mutationNumber: mutNumber,
        productId: currentProduct.id,
        productName: currentProduct.name,
        size: selectedSize,
        type: mutationType,
        quantity: delta,
        previousStock: prevStock,
        newStock: targetStock,
        reason: reason.trim(),
        referenceNumber: referenceNumber.trim() || undefined,
        operator: operator.trim() || 'Admin'
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan mutasi stok');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-[#2D2A26] to-[#1F1D1A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-[#E3B890]" />
            </div>
            <div>
              <h3 className="font-brand font-bold text-base text-[#FAF8F5]">
                Catat Mutasi Stok Barang
              </h3>
              <p className="text-xs text-[#C2B7AA]">
                Catatan mutasi dicatat permanen ke audit log Firestore
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Select */}
          <div>
            <label className="font-bold text-[#3E352B] block mb-1">
              Pilih Produk Flatshoes *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl font-medium text-[#2D2A26]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Total Stok: {p.totalStock} psg)
                </option>
              ))}
            </select>
          </div>

          {/* Size Select & Current Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#3E352B] block mb-1">
                Ukuran Sepatu *
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl font-bold text-[#2D2A26]"
              >
                {(currentProduct?.sizes || [
                  { size: 36, stock: 0 },
                  { size: 37, stock: 0 },
                  { size: 38, stock: 0 },
                  { size: 39, stock: 0 },
                  { size: 40, stock: 0 },
                  { size: 41, stock: 0 }
                ]).map((s) => (
                  <option key={s.size} value={s.size}>
                    Size {s.size} (Stok saat ini: {s.stock} psg)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-[#3E352B] block mb-1">
                Stok Fisik Saat Ini:
              </label>
              <div className="px-3 py-2 bg-[#F5EFEB] rounded-xl border border-[#E5DACD] font-bold text-sm text-[#2D2A26] tabular-nums flex items-center justify-between">
                <span>Size {selectedSize}:</span>
                <span className="text-[#B36B73]">{prevStock} Pasang</span>
              </div>
            </div>
          </div>

          {/* Mutation Type */}
          <div>
            <label className="font-bold text-[#3E352B] block mb-1">
              Jenis Mutasi / Transaksi *
            </label>
            <select
              value={mutationType}
              onChange={(e) => {
                const val = e.target.value as StockMutationType;
                setMutationType(val);
                if (val === 'MASUK_RESTOCK') {
                  setReason('Penerimaan batch restock dari Workshop');
                } else if (val === 'PENYESUAIAN_RUSAK') {
                  setReason('Sampel display atau barang minor defect');
                } else if (val === 'KELUAR_POS') {
                  setReason('Penjualan offline toko Mochi Steps Solo');
                } else if (val === 'RETUR_BATAL') {
                  setReason('Retur tukar size dari pembeli');
                } else {
                  setReason('Penyesuaian selisih stok opname fisik gudang');
                }
              }}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl font-medium text-[#2D2A26]"
            >
              <option value="MASUK_RESTOCK">Stok Masuk (+ Restock Gudang / Workshop)</option>
              <option value="KELUAR_POS">Stok Keluar (- Event / Penjualan Offline)</option>
              <option value="PENYESUAIAN_RUSAK">Penyesuaian (- Sampel Display / Rusak)</option>
              <option value="RETUR_BATAL">Retur (+ Barang Kembali / Batal Order)</option>
              <option value="KOREKSI_STOK">Koreksi Opname Fisik (Koreksi Pembukuan)</option>
            </select>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="font-bold text-[#3E352B] block mb-1">
              Jumlah Pasang *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-32 px-3 py-2 bg-white border border-[#DDD3C7] rounded-xl font-bold text-sm text-[#2D2A26] tabular-nums"
              />
              <span className="text-[#6D6153] font-medium">Pasang Sepatu</span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="p-3.5 bg-gradient-to-r from-[#FAF8F5] to-[#F5EFEB] rounded-2xl border border-[#E5DACD] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6E6051]">Perhitungan Stok:</span>
              <span className="font-bold text-[#2D2A26]">
                {prevStock} {delta > 0 ? `+ ${Math.abs(delta)}` : `- ${Math.abs(delta)}`} = {targetStock} Pasang
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-[#EAE1D4]">
              {delta > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="text-[11px] text-[#4E4437]">
                Stok baru Size {selectedSize} akan berubah menjadi <strong className="text-[#2D2A26]">{targetStock} pasang</strong>.
              </span>
            </div>
          </div>

          {/* Reason & Reference */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-[#3E352B] block mb-1">
                Alasan / Keterangan Mutasi *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Penerimaan 20 pasang dari pengrajin Solo"
                className="w-full px-3 py-2 bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] text-[#2D2A26]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#3E352B] block mb-1">
                  Nomor Referensi / Surat Jalan
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="PO-SOLO-2026..."
                  className="w-full px-3 py-2 bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] font-mono text-xs text-[#2D2A26]"
                />
              </div>

              <div>
                <label className="font-bold text-[#3E352B] block mb-1">
                  Petugas Penanggung Jawab
                </label>
                <input
                  type="text"
                  required
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#DDD3C7] rounded-xl text-[#2D2A26]"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
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
                  <span>Simpan Mutasi ke Database</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
