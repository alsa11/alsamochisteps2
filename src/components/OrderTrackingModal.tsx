import React, { useState, useEffect } from 'react';
import { 
  X, Search, Upload, CheckCircle2, Clock, AlertCircle, FileText, 
  Check, Truck, ShieldCheck, MapPin, CreditCard, RefreshCw, Phone,
  ArrowLeft, Trash2, History, Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../api';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialInvoice?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialInvoice
}) => {
  const [invoiceQuery, setInvoiceQuery] = useState(initialInvoice || '');
  const [phoneQuery, setPhoneQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [phoneMatchOrders, setPhoneMatchOrders] = useState<Order[]>([]);
  const [savedLocalOrders, setSavedLocalOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Load saved orders from device localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const raw = localStorage.getItem('mochisteps_my_orders');
        if (raw) {
          setSavedLocalOrders(JSON.parse(raw));
        }
      } catch (err) {
        console.warn('Error reading stored orders:', err);
      }

      if (initialInvoice) {
        setInvoiceQuery(initialInvoice);
        lookupOrder(initialInvoice, '');
      }
    }
  }, [initialInvoice, isOpen]);

  if (!isOpen) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const normalizePhone = (p: string) => {
    return p.replace(/[^0-9]/g, '');
  };

  const lookupOrder = async (targetInvoice: string, targetPhone: string) => {
    setIsLoading(true);
    setError(null);
    setUploadSuccess(false);
    setPhoneMatchOrders([]);

    try {
      const allOrders = await api.getOrders();
      const invClean = targetInvoice.trim().toLowerCase();
      const phClean = normalizePhone(targetPhone);

      if (invClean) {
        const matched = allOrders.find(
          (o) => o.invoiceNumber.toLowerCase() === invClean ||
                 o.id.toLowerCase() === invClean
        );

        if (!matched) {
          setError(`Pesanan dengan nomor invoice "${targetInvoice}" tidak ditemukan.`);
          setOrder(null);
          return;
        }

        // Optional phone check
        if (phClean.length > 0) {
          const orderPhoneClean = normalizePhone(matched.customerPhone || '');
          if (orderPhoneClean && !orderPhoneClean.includes(phClean) && !phClean.includes(orderPhoneClean.slice(-4))) {
            setError('Nomor HP tidak sesuai dengan data pemesan pada invoice ini.');
            setOrder(null);
            return;
          }
        }

        const freshOrder = await api.getOrder(matched.id).catch(() => matched);
        setOrder(freshOrder || matched);
      } else if (phClean.length > 0) {
        // User searched ONLY by phone number
        const matched = allOrders.filter((o) => {
          const ordPhone = normalizePhone(o.customerPhone || '');
          return ordPhone && (ordPhone.includes(phClean) || phClean.includes(ordPhone.slice(-4)));
        });

        if (matched.length === 0) {
          setError(`Tidak ditemukan pesanan dengan nomor HP "${targetPhone}". Pastikan nomor HP sesuai dengan yang diisi saat checkout.`);
          setOrder(null);
          return;
        }

        if (matched.length === 1) {
          const freshOrder = await api.getOrder(matched[0].id).catch(() => matched[0]);
          setOrder(freshOrder || matched[0]);
        } else {
          setPhoneMatchOrders(matched);
          setOrder(null);
        }
      } else {
        setError('Mohon masukkan Nomor Invoice ATAU Nomor HP WhatsApp yang digunakan saat checkout.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mencari pesanan dari database');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await lookupOrder(invoiceQuery, phoneQuery);
  };

  const handleSelectRecent = (inv: string) => {
    setInvoiceQuery(inv);
    lookupOrder(inv, '');
  };

  const handleClearHistory = () => {
    localStorage.removeItem('mochisteps_my_orders');
    setSavedLocalOrders([]);
  };

  // Upload proof of payment
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const proofUrl = event.target?.result as string;
      await submitProof(proofUrl);
    };
    reader.readAsDataURL(file);
  };

  const submitProof = async (proofUrl: string) => {
    if (!order) return;
    setIsUploading(true);
    try {
      const updated = await api.uploadPaymentProof(order.id, proofUrl);
      setOrder(updated);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengunggah bukti pembayaran');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE3DA] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FCEAE9] border border-[#E8DACB] flex items-center justify-center text-[#B36B73]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-brand text-base sm:text-lg font-bold text-[#24211D]">
                Lacak Pesanan &amp; Status Pengiriman
              </h2>
              <p className="text-[11px] text-[#7F7466]">
                Pelanggan tidak perlu login · Cek status real-time langsung dari Firestore
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8C8072] hover:text-[#2D2A26] rounded-full hover:bg-[#EFE7DE] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Back button if an order is currently active */}
          {order && (
            <div className="flex items-center justify-between pb-1 border-b border-[#EAE3DA]">
              <button
                type="button"
                onClick={() => {
                  setOrder(null);
                  setError(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B36B73] hover:text-[#8F4850] transition-colors cursor-pointer py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Kembali Cari / Lacak Pesanan Lain</span>
              </button>
              <span className="text-[11px] text-[#7A6E60]">Menampilkan status pesanan saat ini</span>
            </div>
          )}

          {/* Form Pencarian Fleksibel (Nomor Invoice ATAU Nomor HP/WA) */}
          {!order && (
            <form onSubmit={handleSearch} className="space-y-3 bg-[#FAF8F5] p-4 rounded-xl border border-[#EAE2D7]">
              <div>
                <div className="text-xs font-bold text-[#2D2A26] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#B36B73]" />
                  <span>Cari Pesanan (Bisa dengan Nomor HP Saja):</span>
                </div>
                <p className="text-[11px] text-[#7A6E60] mt-0.5">
                  Tidak hafal nomor pesanan? Cukup isi nomor HP / WhatsApp yang Anda gunakan saat checkout!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-[#7A6E60] font-medium block mb-1">
                    Nomor Invoice / Pesanan (Opsional):
                  </label>
                  <input
                    type="text"
                    value={invoiceQuery}
                    onChange={(e) => setInvoiceQuery(e.target.value)}
                    placeholder="Contoh: MS-20261014-5680"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#7A6E60] font-medium block mb-1">
                    Nomor HP / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={phoneQuery}
                    onChange={(e) => setPhoneQuery(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] font-mono font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#2D2A26] hover:bg-[#1A1816] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#E3B890]" />
                    <span>Memeriksa Database...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-[#E3B890]" />
                    <span>Lacak Pesanan Sekarang</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-2xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>✓ Bukti pembayaran berhasil diunggah! Admin toko akan segera memverifikasi pesanan Anda.</span>
            </div>
          )}

          {/* Multiple Orders Found by Phone Number */}
          {!order && phoneMatchOrders.length > 0 && (
            <div className="space-y-2.5 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DACB]">
              <div className="font-bold text-xs text-[#2D2A26] flex items-center justify-between">
                <span>Ditemukan {phoneMatchOrders.length} Pesanan untuk Nomor {phoneQuery}:</span>
                <span className="text-[11px] text-[#7A6E60]">Klik pesanan untuk melihat detail</span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {phoneMatchOrders.map((po) => (
                  <div
                    key={po.id}
                    onClick={() => setOrder(po)}
                    className="p-3 bg-white rounded-xl border border-[#DDD3C7] hover:border-[#B36B73] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-[#2D2A26]">{po.invoiceNumber}</div>
                      <div className="text-[10px] text-[#7A6E60]">
                        {new Date(po.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {po.customerName}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                      <div>
                        <div className="font-bold text-xs text-[#B36B73] tabular-nums">{formatIDR(po.grandTotal)}</div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          po.paymentStatus === 'DISETUJUI' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {po.paymentStatus}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrder(po);
                        }}
                        className="px-2.5 py-1 bg-[#2D2A26] hover:bg-[#1A1816] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Lihat Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Orders on this Device (Automatic 1-Click Tracking) */}
          {!order && phoneMatchOrders.length === 0 && savedLocalOrders.length > 0 && (
            <div className="space-y-2.5 bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DACB]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E3B890]" />
                  <span className="font-bold text-xs text-[#2D2A26]">Pesanan Tersimpan di Perangkat Ini</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[10px] text-[#8C8072] hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Hapus riwayat lokal di browser ini"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Bersihkan Riwayat</span>
                </button>
              </div>
              <p className="text-[11px] text-[#7A6E60]">
                Klik langsung pesanan di bawah ini untuk melihat status pengiriman tanpa perlu mengetik ulang nomor invoice:
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {savedLocalOrders.map((so: any) => (
                  <div
                    key={so.invoiceNumber}
                    onClick={() => handleSelectRecent(so.invoiceNumber)}
                    className="p-3 bg-white rounded-xl border border-[#DDD3C7] hover:border-[#B36B73] transition-all cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-[#2D2A26] group-hover:text-[#B36B73] transition-colors">
                        {so.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-[#7A6E60]">
                        {new Date(so.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} · {so.customerName || 'Pelanggan'}
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2.5">
                      <div className="font-bold text-xs text-[#B36B73] tabular-nums">
                        {formatIDR(so.grandTotal)}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRecent(so.invoiceNumber);
                        }}
                        className="px-3 py-1 bg-[#2D2A26] group-hover:bg-[#B36B73] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Lacak Sekarang
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Order Details */}
          {order && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Box: Invoice & Dua Status Terpisah */}
              <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DACB] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2D5C5]">
                  <div>
                    <span className="text-[10px] text-[#8C8072] uppercase font-bold tracking-wider">Nomor Invoice</span>
                    <div className="font-mono text-sm font-bold text-[#2D2A26] flex items-center gap-2">
                      <span>{order.invoiceNumber}</span>
                      <span className="text-[11px] text-[#7A6E60] font-sans font-normal">
                        ({new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                      </span>
                    </div>
                  </div>

                  {/* Dua Status Terpisah: Pembayaran & Pengiriman */}
                  <div className="flex items-center gap-2">
                    {/* Status Pembayaran */}
                    <div className="text-right">
                      <span className="text-[9px] text-[#8C8072] block uppercase font-bold">Status Bayar</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        order.paymentStatus === 'DISETUJUI'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : order.paymentStatus === 'MENUNGGU_VERIFIKASI'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : order.paymentStatus === 'DITOLAK'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {order.paymentStatus === 'DISETUJUI' && 'LUNAS (Terverifikasi)'}
                        {order.paymentStatus === 'MENUNGGU_VERIFIKASI' && 'Menunggu Verifikasi'}
                        {order.paymentStatus === 'DITOLAK' && 'Pembayaran Ditolak'}
                        {order.paymentStatus === 'MENUNGGU_PEMBAYARAN' && 'Menunggu Bayar'}
                      </span>
                    </div>

                    {/* Status Pengiriman */}
                    <div className="text-right pl-2 border-l border-[#DDD3C7]">
                      <span className="text-[9px] text-[#8C8072] block uppercase font-bold">Status Kirim</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        order.orderStatus === 'SELESAI'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.orderStatus === 'DIKIRIM'
                          ? 'bg-purple-100 text-purple-800'
                          : order.orderStatus === 'DIPROSES'
                          ? 'bg-amber-100 text-amber-800'
                          : order.orderStatus === 'DIBATALKAN'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.orderStatus === 'SELESAI' && 'Terkirim Selesai'}
                        {order.orderStatus === 'DIKIRIM' && 'Dalam Pengiriman'}
                        {order.orderStatus === 'DIPROSES' && 'Sedang Diproses Packing'}
                        {order.orderStatus === 'DIBATALKAN' && 'Dibatalkan'}
                        {order.orderStatus === 'MENUNGGU_PEMBAYARAN' && 'Menunggu Bayar'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Steps Timeline */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="flex flex-col items-center text-[#2D2A26]">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold mb-1">
                      ✓
                    </div>
                    <span className="text-[10px] font-semibold">Checkout</span>
                  </div>

                  <div className={`flex flex-col items-center ${
                    order.paymentStatus === 'DISETUJUI' ? 'text-[#2D2A26]' : 'text-[#8C8072]'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                      order.paymentStatus === 'DISETUJUI'
                        ? 'bg-emerald-600 text-white'
                        : order.paymentStatus === 'MENUNGGU_VERIFIKASI'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-[#DDD3C7] text-white'
                    }`}>
                      {order.paymentStatus === 'DISETUJUI' ? '✓' : '2'}
                    </div>
                    <span className="text-[10px] font-semibold">Verifikasi Bayar</span>
                  </div>

                  <div className={`flex flex-col items-center ${
                    order.orderStatus === 'DIPROSES' || order.orderStatus === 'DIKIRIM' || order.orderStatus === 'SELESAI'
                      ? 'text-[#2D2A26]'
                      : 'text-[#8C8072]'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                      order.orderStatus === 'DIKIRIM' || order.orderStatus === 'SELESAI'
                        ? 'bg-emerald-600 text-white'
                        : order.orderStatus === 'DIPROSES'
                        ? 'bg-amber-600 text-white'
                        : 'bg-[#DDD3C7] text-white'
                    }`}>
                      {order.orderStatus === 'DIKIRIM' || order.orderStatus === 'SELESAI' ? '✓' : '3'}
                    </div>
                    <span className="text-[10px] font-semibold">Dipacking</span>
                  </div>

                  <div className={`flex flex-col items-center ${
                    order.orderStatus === 'DIKIRIM' || order.orderStatus === 'SELESAI'
                      ? 'text-[#2D2A26]'
                      : 'text-[#8C8072]'
                  }`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 ${
                      order.orderStatus === 'SELESAI'
                        ? 'bg-emerald-600 text-white'
                        : order.orderStatus === 'DIKIRIM'
                        ? 'bg-purple-600 text-white'
                        : 'bg-[#DDD3C7] text-white'
                    }`}>
                      {order.orderStatus === 'SELESAI' ? '✓' : '4'}
                    </div>
                    <span className="text-[10px] font-semibold">
                      {order.orderStatus === 'SELESAI' ? 'Selesai' : 'Pengiriman'}
                    </span>
                  </div>
                </div>

                {/* Resi Box */}
                {order.trackingNumber && (
                  <div className="mt-3 p-3 bg-white rounded-xl border border-[#DDD3C7] flex items-center justify-between text-xs">
                    <span className="text-[#6D6254] flex items-center gap-1.5 font-medium">
                      <Truck className="w-4 h-4 text-[#B36B73]" />
                      Nomor Resi Pengiriman ({order.courier}):
                    </span>
                    <span className="font-mono font-extrabold text-[#2D2A26] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E5DDD2]">
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
              </div>

              {/* Detail Pembeli & Pengiriman */}
              <div className="p-4 bg-white rounded-xl border border-[#EAE3DA] space-y-2 text-xs">
                <div className="font-bold text-[#2D2A26] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B36B73]" />
                  <span>Alamat Pengiriman:</span>
                </div>
                <p className="text-[#5F5547] pl-6 leading-relaxed">
                  {order.shippingAddress}
                </p>
                <div className="pl-6 text-[11px] text-[#7A6E60] flex flex-wrap gap-4 pt-1 border-t border-[#F5EFEB]">
                  <span>Penerima: <strong>{order.customerName}</strong> ({order.customerPhone})</span>
                  <span>Metode Bayar: <strong>{order.paymentMethod}</strong></span>
                  <span>Total Tagihan: <strong className="text-[#B36B73]">{formatIDR(order.grandTotal)}</strong></span>
                </div>
              </div>

              {/* Rincian Produk yang Dipesan */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#73685B]">
                  Rincian Sepatu yang Dipesan ({order.items.length} Model):
                </h4>
                <div className="divide-y divide-[#EAE2D7] border border-[#EAE2D7] rounded-xl overflow-hidden bg-white">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-[#FAF8F5]">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-[#E5DDD2] shrink-0" 
                        />
                        <div>
                          <div className="font-bold text-[#2D2A26]">{item.name}</div>
                          <div className="text-[11px] text-[#8C8072]">
                            Warna: {item.selectedColor} · Ukuran: <strong>{item.selectedSize}</strong> ({item.quantity} pasang)
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-[#2D2A26] tabular-nums">
                        {formatIDR(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Upload Bukti jika belum lunas */}
              {order.paymentStatus !== 'DISETUJUI' && order.orderStatus !== 'DIBATALKAN' && (
                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DACB] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#2D2A26]">Unggah / Perbarui Bukti Pembayaran</span>
                      <p className="text-[11px] text-[#7A6E60]">
                        Kirimkan struk transfer atau tangkapan layar pembayaran untuk mempercepat verifikasi admin.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#DDD3C7] text-[#4A3E31] rounded-xl text-xs font-semibold cursor-pointer text-center transition-colors shadow-2xs">
                      <span>{isUploading ? 'Mengunggah...' : 'Pilih File Struk Pembayaran'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={isUploading}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
