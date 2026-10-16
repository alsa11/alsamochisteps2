import React, { useState } from 'react';
import { 
  X, CheckCircle2, Copy, ArrowRight, CreditCard, Building2, 
  QrCode, ExternalLink, Check, AlertCircle, Phone, 
  Truck, ShieldCheck, MapPin, Banknote
} from 'lucide-react';
import { CartItem, Order, PaymentMethod } from '../types';
import { api } from '../api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  discount: number;
  promoCode: string;
  onOrderSuccess: (order: Order) => void;
  onOpenTracking?: (invoice: string) => void;
}

// Daftar Kota & Kabupaten Populer se-Indonesia untuk Datalist
const INDONESIA_CITIES = [
  'Surakarta (Solo)', 'Kota Yogyakarta', 'Kab. Sleman', 'Kab. Bantul', 'Kab. Kulon Progo', 'Kab. Gunungkidul',
  'Kota Semarang', 'Kab. Semarang', 'Kota Salatiga', 'Kota Magelang', 'Kab. Magelang', 
  'Kab. Sukoharjo', 'Kab. Karanganyar', 'Kab. Boyolali', 'Kab. Klaten', 'Kab. Sragen', 'Kab. Wonogiri',
  'Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Utara',
  'Kota Surabaya', 'Kota Malang', 'Kab. Sidoarjo', 'Kab. Gresik', 'Kota Bandung', 'Kab. Bandung',
  'Kota Depok', 'Kota Bekasi', 'Kab. Bekasi', 'Kota Tangerang', 'Kota Tangerang Selatan', 'Kab. Tangerang',
  'Kota Bogor', 'Kab. Bogor', 'Kota Serang', 'Kota Cirebon', 'Kota Tasikmalaya', 'Kota Sukabumi',
  'Kota Medan', 'Kota Padang', 'Kota Pekanbaru', 'Kota Palembang', 'Kota Bandar Lampung', 'Kota Batam',
  'Kota Denpasar (Bali)', 'Kab. Badung (Bali)', 'Kab. Gianyar (Bali)', 'Kab. Tabanan (Bali)',
  'Kota Mataram (Lombok)', 'Kota Makassar', 'Kota Manado', 'Kota Pontianak', 'Kota Banjarmasin',
  'Kota Balikpapan', 'Kota Samarinda', 'Kota Kupang', 'Kota Ambon', 'Kota Jayapura', 'Kota Kendari'
];

// Daftar Kecamatan Populer se-Indonesia untuk Datalist
const INDONESIA_SUBDISTRICTS = [
  'Banjarsari', 'Laweyan', 'Pasar Kliwon', 'Jebres', 'Serengan', 'Kartasura', 'Colomadu', 'Grogol', 'Baki',
  'Menteng', 'Kebayoran Baru', 'Kebayoran Lama', 'Cilandak', 'Pasar Minggu', 'Setiabudi', 'Tebet', 'Mampang Prapatan',
  'Gambir', 'Tanah Abang', 'Kelapa Gading', 'Tanjung Duren', 'Kembangan', 'Palmerah', 'Kemayoran',
  'Gondokusuman', 'Umbulharjo', 'Danurejan', 'Depok (Sleman)', 'Mlati', 'Ngaglik', 'Kasihan', 'Sewon',
  'Semarang Tengah', 'Semarang Selatan', 'Banyumanik', 'Candisari', 'Pedurungan',
  'Tegalsari', 'Gubeng', 'Wonokromo', 'Rungkut', 'Sukolilo', 'Genteng', 'Sawahan',
  'Coblong', 'Sukasari', 'Lengkong', 'Cicendo', 'Sumur Bandung', 'Andir',
  'Kuta', 'Kuta Selatan', 'Kuta Utara', 'Ubud', 'Denpasar Selatan', 'Denpasar Barat', 'Denpasar Timur',
  'Medan Barat', 'Medan Petisah', 'Medan Baru', 'Panakkukang', 'Ujung Pandang', 'Rappocini'
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  discount,
  promoCode,
  onOrderSuccess,
  onOpenTracking
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    streetAddress: '',
    subdistrict: '', // Kecamatan
    city: 'Surakarta (Solo)', // Kota / Kabupaten
    postalCode: '',
    courier: 'JNE Reguler',
    paymentCategory: 'QRIS' as 'COD' | 'QRIS' | 'TRANSFER_BANK' | 'VIRTUAL_ACCOUNT',
    selectedBank: 'BCA' as 'BCA' | 'MANDIRI' | 'BRI' | 'BNI' | 'BSI' | 'CIMB' | 'PERMATA',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  // Courier Pricing (Domestik Indonesia)
  const couriers = [
    { id: 'JNE Reguler', label: 'JNE Reguler (2-3 hari)', cost: 18000 },
    { id: 'SiCepat Best', label: 'SiCepat Best (1-2 hari)', cost: 20000 },
    { id: 'J&T Express', label: 'J&T Express (2-3 hari)', cost: 19000 },
    { id: 'GoSend Instant (Area Solo)', label: 'GoSend Instant (Khusus Area Solo - Hari Ini)', cost: 25000 }
  ];

  const selectedCourierObj = couriers.find((c) => c.id === formData.courier) || couriers[0];
  const courierCost = selectedCourierObj.cost;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discount + courierCost);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Bank Directory: Rekening Resmi Toko & Virtual Account
  const bankDirectory: Record<string, { bank: string; accountNumber: string; accountHolder: string; vaNumber: string; bankShort: string }> = {
    BCA: {
      bank: 'Bank Central Asia (BCA)',
      bankShort: 'BCA',
      accountNumber: '88301928371',
      accountHolder: 'PT MOCHI STEPS INDONESIA',
      vaNumber: '8001188301928371'
    },
    MANDIRI: {
      bank: 'Bank Mandiri',
      bankShort: 'Mandiri',
      accountNumber: '138001928371',
      accountHolder: 'PT MOCHI STEPS INDONESIA',
      vaNumber: '8960813800192837'
    },
    BRI: {
      bank: 'Bank Rakyat Indonesia (BRI)',
      bankShort: 'BRI',
      accountNumber: '034101002948501',
      accountHolder: 'PT MOCHI STEPS INDONESIA',
      vaNumber: '1280003410100294'
    },
    BNI: {
      bank: 'Bank Negara Indonesia (BNI)',
      bankShort: 'BNI',
      accountNumber: '1829401928',
      accountHolder: 'PT MOCHI STEPS INDONESIA',
      vaNumber: '9881829401928001'
    },
    BSI: {
      bank: 'Bank Syariah Indonesia (BSI)',
      bankShort: 'BSI (Syariah)',
      accountNumber: '7182930411',
      accountHolder: 'PT MOCHI STEPS INDONESIA',
      vaNumber: '9007182930411002'
    },
    CIMB: {
      bank: 'CIMB Niaga',
      bankShort: 'CIMB Niaga',
      accountNumber: '800172635400',
      accountHolder: 'PT MOCHI STEPS INDONESIA',
      vaNumber: '1122800172635400'
    },
    PERMATA: {
      bank: 'Bank Permata',
      bankShort: 'Permata',
      accountNumber: '4109827361',
      accountHolder: 'PT MOCHI STEPS INDONESIA',
      vaNumber: '8528410982736100'
    }
  };

  const currentBank = bankDirectory[formData.selectedBank] || bankDirectory.BCA;

  // Resolve Order PaymentMethod
  const resolvePaymentMethod = (): PaymentMethod => {
    if (formData.paymentCategory === 'COD') return 'COD';
    if (formData.paymentCategory === 'QRIS') return 'QRIS';
    if (formData.paymentCategory === 'VIRTUAL_ACCOUNT') {
      const vaMap: Record<string, PaymentMethod> = {
        BCA: 'VA_BCA',
        MANDIRI: 'VA_MANDIRI',
        BRI: 'VA_BRI',
        BNI: 'VA_BNI',
        BSI: 'VA_BSI',
        CIMB: 'VA_CIMB',
        PERMATA: 'VA_PERMATA'
      };
      return vaMap[formData.selectedBank] || 'VA_BCA';
    }
    return formData.selectedBank as PaymentMethod;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || !formData.phone.trim() || !formData.streetAddress.trim()) {
      setError('Mohon lengkapi Nama Lengkap, Nomor WhatsApp/HP, dan Alamat Pengiriman.');
      return;
    }

    if (!formData.subdistrict.trim() || !formData.city.trim()) {
      setError('Mohon isi Kecamatan dan Kota/Kabupaten pengiriman.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullShippingAddress = `${formData.streetAddress.trim()}, Kec. ${formData.subdistrict.trim()}, ${formData.city.trim()}, Kode Pos ${formData.postalCode.trim() || '-'}`;

      const finalMethod = resolvePaymentMethod();

      const orderPayload = {
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        destinationType: 'DOMESTIC',
        country: 'Indonesia',
        streetAddress: formData.streetAddress.trim(),
        subdistrict: formData.subdistrict.trim() || '-',
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim() || '-',
        shippingAddress: fullShippingAddress,
        courier: selectedCourierObj.id,
        courierCost,
        items,
        subtotal,
        discount,
        grandTotal,
        paymentMethod: finalMethod,
        paymentStatus: (finalMethod === 'COD' || finalMethod === 'QRIS') ? 'MENUNGGU_VERIFIKASI' : 'MENUNGGU_PEMBAYARAN',
        orderStatus: (finalMethod === 'COD' || finalMethod === 'QRIS') ? 'MENUNGGU_VERIFIKASI' : 'MENUNGGU_PEMBAYARAN',
        notes: formData.notes.trim()
      };

      const order = await api.createOrder(orderPayload);
      setCreatedOrder(order);
      onOrderSuccess(order);

      // Save order to device localStorage for 1-click effortless tracking
      try {
        const raw = localStorage.getItem('mochisteps_my_orders');
        const prev = raw ? JSON.parse(raw) : [];
        const next = [
          {
            id: order.id,
            invoiceNumber: order.invoiceNumber,
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            grandTotal: order.grandTotal,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt || new Date().toISOString()
          },
          ...prev.filter((p: any) => p.invoiceNumber !== order.invoiceNumber)
        ].slice(0, 8);
        localStorage.setItem('mochisteps_my_orders', JSON.stringify(next));
      } catch (err) {
        console.warn('LocalStorage save error:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses pesanan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const qrisSvgUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23ffffff"/><rect x="15" y="15" width="270" height="270" rx="12" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="150" y="45" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="%23b36b73">QRIS · GPN RESMI</text><rect x="40" y="60" width="60" height="60" fill="%230f172a"/><rect x="50" y="70" width="40" height="40" fill="%23ffffff"/><rect x="60" y="80" width="20" height="20" fill="%230f172a"/><rect x="200" y="60" width="60" height="60" fill="%230f172a"/><rect x="210" y="70" width="40" height="40" fill="%23ffffff"/><rect x="220" y="80" width="20" height="20" fill="%230f172a"/><rect x="40" y="180" width="60" height="60" fill="%230f172a"/><rect x="50" y="190" width="40" height="40" fill="%23ffffff"/><rect x="60" y="200" width="20" height="20" fill="%230f172a"/><rect x="120" y="80" width="30" height="30" fill="%230f172a"/><rect x="160" y="120" width="40" height="40" fill="%230f172a"/><rect x="110" y="150" width="40" height="40" fill="%230f172a"/><rect x="170" y="190" width="40" height="40" fill="%230f172a"/><rect x="220" y="160" width="40" height="40" fill="%230f172a"/><text x="150" y="265" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle" fill="%23475569">MOCHI STEPS INDONESIA</text><text x="150" y="282" font-family="sans-serif" font-size="10" text-anchor="middle" fill="%2394a3b8">NMID: ID1029482910481</text></svg>`;

  // Direct WhatsApp message generator for customer confirmation
  const getWhatsAppConfirmationUrl = () => {
    if (!createdOrder) return '';
    const text = `Halo Mochi Steps Solo, saya sudah membuat pesanan dengan detail:\n\n*Invoice:* ${createdOrder.invoiceNumber}\n*Nama:* ${createdOrder.customerName}\n*No. HP/WA:* ${createdOrder.customerPhone}\n*Alamat Pengiriman:* ${createdOrder.shippingAddress}\n*Kurir:* ${createdOrder.courier}\n*Metode Pembayaran:* ${createdOrder.paymentMethod}\n*Grand Total:* ${formatIDR(createdOrder.grandTotal)}\n\nMohon konfirmasi alamat dan cek pesanan saya ya Kak. Terima kasih!`;
    return `https://wa.me/6281934424901?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      
      {/* Datalists for Indonesian Cities and Subdistricts */}
      <datalist id="indonesia-cities-list">
        {INDONESIA_CITIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <datalist id="indonesia-subdistricts-list">
        {INDONESIA_SUBDISTRICTS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header with Logo */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#EAE3DA] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <img 
              src="/src/assets/images/mochisteps_brand_logo_1791899999020.jpg" 
              alt="Mochi Steps Logo" 
              className="w-10 h-10 rounded-lg object-cover border border-[#E8DACB]"
            />
            <div>
              <h2 className="font-brand font-bold text-base text-[#24211D]">
                {createdOrder ? 'Pesanan Berhasil Disimpan!' : 'Checkout & Alamat Pengiriman'}
              </h2>
              <p className="text-[11px] text-[#7F7466]">
                Mochi Steps · Koleksi Flatshoes & Loafers Solo
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

        {/* VIEW 1: SUCCESS / PAYMENT INSTRUCTIONS */}
        {createdOrder ? (
          <div className="p-5 sm:p-7 space-y-6 max-h-[82vh] overflow-y-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-brand font-bold text-xl text-[#24211D]">
                Pesanan Berhasil Disimpan!
              </h3>
              <p className="text-xs text-[#6B6154] max-w-md mx-auto">
                Terima kasih, <strong>{createdOrder.customerName}</strong>. Pesanan Anda telah tersimpan secara permanen di database Mochi Steps.
              </p>
            </div>

            {/* Invoice & Total Tag */}
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5DDD2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-[#8C8072] uppercase font-bold tracking-wider">No. Invoice Resmi</div>
                <div className="font-mono text-base font-bold text-[#2D2A26] flex items-center gap-2">
                  <span>{createdOrder.invoiceNumber}</span>
                  <button
                    onClick={() => handleCopy(createdOrder.invoiceNumber, 'invoice')}
                    className="text-xs text-[#8C6D52] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedField === 'invoice' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'invoice' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-[10px] text-[#8C8072] uppercase font-bold tracking-wider">
                  {createdOrder.paymentMethod === 'COD' ? 'Total Bayar ke Kurir (COD)' : 'Total yang Harus Dibayar'}
                </div>
                <div className="text-lg font-extrabold text-[#B36B73] tabular-nums flex sm:justify-end items-center gap-2">
                  <span>{formatIDR(createdOrder.grandTotal)}</span>
                  <button
                    onClick={() => handleCopy(createdOrder.grandTotal.toString(), 'amount')}
                    className="text-xs text-[#8C6D52] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    {copiedField === 'amount' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'amount' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery & Address Summary Card */}
            <div className="p-4 bg-[#F8F6F2] rounded-xl border border-[#E8DACB] text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-[#352D24]">
                <MapPin className="w-4 h-4 text-[#B36B73]" />
                <span>Alamat Pengiriman (Indonesia):</span>
              </div>
              <p className="text-[#5F5547] leading-relaxed pl-6">
                {createdOrder.shippingAddress}
              </p>
              <div className="pl-6 text-[11px] text-[#8C8072] flex items-center gap-3 pt-1">
                <span>Penerima: <strong>{createdOrder.customerName}</strong> ({createdOrder.customerPhone})</span>
                <span>·</span>
                <span>Kurir: <strong>{createdOrder.courier}</strong></span>
              </div>
            </div>

            {/* PAYMENT INSTRUCTIONS PER METHOD */}
            <div className="border border-[#E2D8CC] rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="bg-[#FAF7F2] px-4 py-3 border-b border-[#E2D8CC] flex items-center justify-between">
                <span className="font-bold text-xs text-[#2D2A26] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#B36B73]" />
                  Metode: {createdOrder.paymentMethod}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  createdOrder.paymentMethod === 'COD' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {createdOrder.paymentMethod === 'COD' ? 'COD - Bayar Saat Diterima' : 'Menunggu Verifikasi Admin'}
                </span>
              </div>

              <div className="p-5 space-y-4">
                
                {/* 1. COD Instruction */}
                {createdOrder.paymentMethod === 'COD' && (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                      <Banknote className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong>Pembayaran Cash On Delivery (COD):</strong>
                        <p className="mt-1">
                          Anda tidak perlu membayar sekarang. Siapkan uang tunai pas sebesar <strong>{formatIDR(createdOrder.grandTotal)}</strong> untuk diserahkan ke kurir saat paket flatshoes tiba di alamat Anda.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. QRIS View */}
                {createdOrder.paymentMethod === 'QRIS' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="bg-white p-3 rounded-xl border border-[#DDD3C7] shadow-xs text-center shrink-0">
                        <img 
                          src={qrisSvgUrl} 
                          alt="QRIS Barcode Mochi Steps" 
                          className="w-44 h-44 object-contain mx-auto"
                        />
                        <span className="text-[10px] text-[#7F7466] font-mono mt-1 block">Scan via BCA / Dana / ShopeePay / OVO</span>
                      </div>

                      <div className="space-y-3 text-xs text-[#52493E]">
                        <h4 className="font-bold text-[#24211D]">Cara Membayar via QRIS:</h4>
                        <ol className="list-decimal pl-4 space-y-1.5">
                          <li>Buka aplikasi m-Banking atau e-wallet Anda (BCA, Mandiri, BRI, DANA, ShopeePay, GoPay, OVO).</li>
                          <li>Pilih menu <strong>Scan / Bayar QRIS</strong>.</li>
                          <li>Arahkan kamera ke barcode di samping.</li>
                          <li>Masukkan nominal persis: <strong>{formatIDR(createdOrder.grandTotal)}</strong>.</li>
                          <li>Setelah bayar, klik tombol konfirmasi di bawah atau unggah bukti transfer.</li>
                        </ol>
                      </div>
                    </div>

                    {/* QRIS Immediate Confirmation / Proof Action */}
                    <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DACB] flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="text-xs text-[#5F5245]">
                        <strong>Konfirmasi Pembayaran QRIS:</strong>
                        <p className="text-[11px] text-[#8C7E70] mt-0.5">
                          Pesanan Anda sudah tersimpan di database dan masuk ke antrean verifikasi admin toko.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="flex-1 sm:flex-none px-3 py-2 bg-white hover:bg-[#FAF8F5] border border-[#DDD3C7] text-[#4A3E31] rounded-xl text-xs font-semibold cursor-pointer text-center transition-colors shadow-2xs">
                          <span>Unggah Bukti</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && createdOrder) {
                                const reader = new FileReader();
                                reader.onload = async (evt) => {
                                  const url = evt.target?.result as string;
                                  try {
                                    await api.uploadPaymentProof(createdOrder.id, url);
                                    alert('✓ Bukti pembayaran QRIS berhasil diunggah! Admin toko akan segera memverifikasi pesanan Anda.');
                                  } catch (err: any) {
                                    alert(err.message || 'Gagal mengunggah bukti');
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            if (createdOrder) {
                              try {
                                await api.uploadPaymentProof(createdOrder.id, qrisSvgUrl);
                                alert('✓ Konfirmasi pembayaran QRIS terkirim! Admin toko akan segera memverifikasi pesanan Anda.');
                              } catch (err: any) {
                                alert('Pesanan Anda sudah dalam antrean verifikasi admin.');
                              }
                            }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Saya Sudah Bayar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Direct Bank Transfer or Virtual Account */}
                {createdOrder.paymentMethod !== 'QRIS' && createdOrder.paymentMethod !== 'COD' && (
                  <div className="space-y-4">
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DACB] space-y-3">
                      
                      {/* Check if VA or Rekening */}
                      {createdOrder.paymentMethod.startsWith('VA_') ? (
                        <div>
                          <div className="text-[11px] text-[#8C7E70] uppercase font-bold tracking-wider">
                            Nomor Virtual Account ({createdOrder.paymentMethod.replace('VA_', '')})
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-xl font-extrabold text-[#24211D] tracking-wide">
                              {currentBank?.vaNumber || '8001188301928371'}
                            </span>
                            <button
                              onClick={() => handleCopy(currentBank?.vaNumber || '8001188301928371', 'va')}
                              className="px-3 py-1 bg-[#24211D] text-white text-xs font-semibold rounded-lg hover:bg-[#3D3730] flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'va' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === 'va' ? 'Tersalin' : 'Salin VA'}</span>
                            </button>
                          </div>
                          <div className="text-[11px] text-[#7F7466] mt-1">
                            Nama Akun VA: <strong>MOCHI STEPS - {createdOrder.customerName}</strong>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[11px] text-[#8C7E70] uppercase font-bold tracking-wider">
                            Nomor Rekening Resmi Toko ({currentBank?.bank || createdOrder.paymentMethod})
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-mono text-xl font-extrabold text-[#24211D] tracking-wide">
                              {currentBank?.accountNumber || '88301928371'}
                            </span>
                            <button
                              onClick={() => handleCopy(currentBank?.accountNumber || '88301928371', 'acc')}
                              className="px-3 py-1 bg-[#24211D] text-white text-xs font-semibold rounded-lg hover:bg-[#3D3730] flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === 'acc' ? 'Tersalin' : 'Salin Norek'}</span>
                            </button>
                          </div>
                          <div className="text-[11px] text-[#7F7466] mt-1">
                            Atas Nama: <strong>{currentBank?.accountHolder || 'PT MOCHI STEPS INDONESIA'}</strong>
                          </div>
                        </div>
                      )}

                    </div>

                    <p className="text-xs text-[#7F7466]">
                      Transfer persis sebesar <strong>{formatIDR(createdOrder.grandTotal)}</strong> dari ATM, Mobile Banking, atau Internet Banking.
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Direct WhatsApp Confirmation Button */}
            <div className="bg-[#F0FDF4] p-4 rounded-xl border border-[#BBF7D0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Phone className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <strong>Konfirmasi Alamat & Pesanan via WhatsApp:</strong>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Kirim konfirmasi ke WhatsApp Mochi Steps (+62 81934424901) agar pesanan Anda segera diproses kurir.
                  </p>
                </div>
              </div>
              <a
                href={getWhatsAppConfirmationUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold whitespace-nowrap shadow-xs transition-all"
              >
                <span>Konfirmasi ke WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Lacak Pesanan Langsung Tanpa Harus Ingat Nomor */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DACB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-[#2D2A26] flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#B36B73]" />
                  <span>Pantau Pesanan Anda Tanpa Ribet</span>
                </div>
                <p className="text-[11px] text-[#7A6E60]">
                  Pesanan telah tersimpan di browser ini. Anda bisa mengecek status pesanan kapan saja tanpa harus mengingat nomor pesanan.
                </p>
              </div>

              {onOpenTracking && (
                <button
                  type="button"
                  onClick={() => {
                    if (createdOrder) {
                      onOpenTracking(createdOrder.invoiceNumber);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] hover:bg-[#1A1816] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
                >
                  <Truck className="w-3.5 h-3.5 text-[#E3B890]" />
                  <span>Lacak Pesanan Ini Sekarang</span>
                </button>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#24211D] hover:bg-[#3D3730] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Selesai &amp; Tutup
              </button>
            </div>
          </div>
        ) : (

          /* VIEW 2: FORM CHECKOUT (DOMESTIK INDONESIA) */
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 max-h-[82vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Data Pelanggan & Alamat */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3D352B] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B36B73]" />
                  <span>1. Data Penerima & Alamat Pengiriman</span>
                </label>
                <span className="text-[11px] text-[#8C7E70] font-medium">Pengiriman Se-Indonesia</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                    Nama Lengkap Penerima *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Sinta Cantika Putri"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                    Nomor WhatsApp / HP Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 081934424901"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                  Email (Opsional untuk invoice digital)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sinta@gmail.com"
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                />
              </div>

              {/* Kota, Kecamatan, Kode Pos Datalist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                    Kota / Kabupaten *
                  </label>
                  <input
                    type="text"
                    required
                    list="indonesia-cities-list"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Ketik atau pilih kota..."
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                    Kecamatan *
                  </label>
                  <input
                    type="text"
                    required
                    list="indonesia-subdistricts-list"
                    value={formData.subdistrict}
                    onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                    placeholder="Ketik kecamatan..."
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="Contoh: 57139"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                  Alamat Jalan Lengkap, No. Rumah, RT/RW, Patokan *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="Jl. Slamet Riyadi No. 128, RT 02 / RW 04, Seberang Taman..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#52483D] mb-1">
                  Catatan untuk Kurir (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Titipkan ke satpam jika sedang keluar..."
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                />
              </div>
            </div>

            {/* Step 2: Pilihan Kurir */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#3D352B] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#B36B73]" />
                <span>2. Pilihan Ekspedisi Kurir</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {couriers.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.courier === c.id
                        ? 'border-[#B36B73] bg-[#FAF2EB] text-[#24211D] font-bold shadow-2xs ring-1 ring-[#B36B73]'
                        : 'border-[#E0D7CC] bg-[#FAF8F5] text-[#594F43] hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="courier"
                        checked={formData.courier === c.id}
                        onChange={() => setFormData({ ...formData, courier: c.id })}
                        className="text-[#B36B73] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[11px]">{c.label}</span>
                    </div>
                    <span className="font-mono text-xs text-[#B36B73]">{formatIDR(c.cost)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 3: Metode Pembayaran (COD, QRIS, Transfer Bank, Virtual Account) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#3D352B] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#B36B73]" />
                  <span>3. Metode Pembayaran</span>
                </label>
                <span className="text-[11px] text-[#8C7E70]">COD · QRIS · Transfer Bank · VA</span>
              </div>

              {/* 4 Metode Utama */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                
                {/* Opsi 1: COD */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentCategory: 'COD' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.paymentCategory === 'COD'
                      ? 'border-[#B36B73] bg-[#FAF2EB] text-[#7A4B3A] font-bold shadow-xs ring-1 ring-[#B36B73]'
                      : 'border-[#E0D7CC] bg-[#FAF8F5] text-[#594F43] hover:bg-white'
                  }`}
                >
                  <Banknote className="w-4 h-4 mx-auto mb-1 text-[#B36B73]" />
                  <span>COD</span>
                  <span className="block text-[10px] text-[#8C7E70] font-normal">Bayar di Tempat</span>
                </button>

                {/* Opsi 2: QRIS */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentCategory: 'QRIS' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.paymentCategory === 'QRIS'
                      ? 'border-[#B36B73] bg-[#FAF2EB] text-[#7A4B3A] font-bold shadow-xs ring-1 ring-[#B36B73]'
                      : 'border-[#E0D7CC] bg-[#FAF8F5] text-[#594F43] hover:bg-white'
                  }`}
                >
                  <QrCode className="w-4 h-4 mx-auto mb-1 text-[#B36B73]" />
                  <span>QRIS</span>
                  <span className="block text-[10px] text-[#8C7E70] font-normal">Dana / Shopee / OVO</span>
                </button>

                {/* Opsi 3: Transfer Bank (Norek Resmi Toko) */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentCategory: 'TRANSFER_BANK' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.paymentCategory === 'TRANSFER_BANK'
                      ? 'border-[#B36B73] bg-[#FAF2EB] text-[#7A4B3A] font-bold shadow-xs ring-1 ring-[#B36B73]'
                      : 'border-[#E0D7CC] bg-[#FAF8F5] text-[#594F43] hover:bg-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1 text-[#B36B73]" />
                  <span>Transfer Bank</span>
                  <span className="block text-[10px] text-[#8C7E70] font-normal">Norek Resmi Toko</span>
                </button>

                {/* Opsi 4: Virtual Account */}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentCategory: 'VIRTUAL_ACCOUNT' })}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    formData.paymentCategory === 'VIRTUAL_ACCOUNT'
                      ? 'border-[#B36B73] bg-[#FAF2EB] text-[#7A4B3A] font-bold shadow-xs ring-1 ring-[#B36B73]'
                      : 'border-[#E0D7CC] bg-[#FAF8F5] text-[#594F43] hover:bg-white'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mx-auto mb-1 text-[#B36B73]" />
                  <span>Virtual Account</span>
                  <span className="block text-[10px] text-[#8C7E70] font-normal">VA Otomatis Bank</span>
                </button>
              </div>

              {/* Sub-selector Bank jika pilih Transfer Bank atau Virtual Account */}
              {(formData.paymentCategory === 'TRANSFER_BANK' || formData.paymentCategory === 'VIRTUAL_ACCOUNT') && (
                <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DACB] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#453B2F]">
                      Pilih Bank ({formData.paymentCategory === 'TRANSFER_BANK' ? 'Transfer ke Rekening Toko' : 'Virtual Account Otomatis'}):
                    </span>
                    <span className="text-[10px] text-[#B36B73] font-semibold">Tersedia 7 Bank</span>
                  </div>

                  {/* Grid 7 Bank */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'BCA', label: 'BCA' },
                      { id: 'MANDIRI', label: 'Mandiri' },
                      { id: 'BRI', label: 'BRI' },
                      { id: 'BNI', label: 'BNI' },
                      { id: 'BSI', label: 'BSI (Syariah)' },
                      { id: 'CIMB', label: 'CIMB Niaga' },
                      { id: 'PERMATA', label: 'Permata' }
                    ].map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, selectedBank: b.id as any })}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formData.selectedBank === b.id
                            ? 'bg-[#24211D] text-white border-[#24211D] shadow-xs'
                            : 'bg-white text-[#52483C] border-[#DDD3C7] hover:bg-[#F3ECE4]'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>

                  {/* Live Card Preview Nomor Rekening / Virtual Account */}
                  <div className="p-3 bg-white rounded-lg border border-[#E0D7CC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      {formData.paymentCategory === 'TRANSFER_BANK' ? (
                        <>
                          <div className="text-[10px] text-[#8C8072] uppercase font-bold tracking-wider">
                            Rekening Resmi Mochi Steps ({currentBank.bank})
                          </div>
                          <div className="font-mono text-sm font-extrabold text-[#24211D] flex items-center gap-2 mt-0.5">
                            <span>{currentBank.accountNumber}</span>
                            <span className="text-xs text-[#8C8072] font-normal font-sans">a.n {currentBank.accountHolder}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] text-[#8C8072] uppercase font-bold tracking-wider">
                            Virtual Account {currentBank.bank}
                          </div>
                          <div className="font-mono text-sm font-extrabold text-[#24211D] flex items-center gap-2 mt-0.5">
                            <span>{currentBank.vaNumber}</span>
                            <span className="text-xs text-[#8C8072] font-normal font-sans">(Verifikasi Otomatis)</span>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(
                        formData.paymentCategory === 'TRANSFER_BANK' ? currentBank.accountNumber : currentBank.vaNumber,
                        'preview'
                      )}
                      className="inline-flex items-center gap-1 self-start sm:self-auto px-2.5 py-1 text-xs font-semibold bg-[#FAF4ED] text-[#7A4B3A] border border-[#E8DACB] rounded-md hover:bg-[#F3E6D8] transition-colors cursor-pointer"
                    >
                      {copiedField === 'preview' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'preview' ? 'Tersalin' : 'Salin Nomor'}</span>
                    </button>
                  </div>

                </div>
              )}

              {/* QRIS Info Callout */}
              {formData.paymentCategory === 'QRIS' && (
                <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0] flex items-start gap-2.5 text-xs text-emerald-950">
                  <QrCode className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pembayaran Instan QRIS:</strong>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      QR Code resmi GPN Mochi Steps akan langsung tampil setelah Anda klik tombol konfirmasi. Bisa discan via DANA, ShopeePay, GoPay, OVO, LinkAja, BCA, dan semua m-Banking.
                    </p>
                  </div>
                </div>
              )}

              {/* COD Info Callout */}
              {formData.paymentCategory === 'COD' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950">
                  <Banknote className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Bayar Tunai di Tempat (COD):</strong>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Anda cukup membayar tunai ke kurir saat paket flatshoes sampai di alamat Anda. Tanpa biaya admin tambahan.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Total Ringkasan Biaya */}
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5DDD2] space-y-2 text-xs">
              <div className="flex justify-between text-[#6B6154]">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} produk flatshoes):</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Diskon Promo ({promoCode}):</span>
                  <span>- {formatIDR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#6B6154]">
                <span>Ongkir ({selectedCourierObj.id}):</span>
                <span>{formatIDR(courierCost)}</span>
              </div>
              <div className="border-t border-[#E5DDD2] pt-2 flex justify-between items-center text-sm font-bold text-[#24211D]">
                <span>Grand Total:</span>
                <span className="text-base text-[#B36B73]">{formatIDR(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 border border-[#DDD3C7] rounded-xl text-xs font-semibold text-[#5F5850] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 bg-[#24211D] hover:bg-[#3D3730] text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Menyimpan Pesanan ke Database...</span>
                ) : (
                  <>
                    <span>Simpan & Lanjutkan Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
