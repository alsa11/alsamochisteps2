import React, { useState, useRef } from 'react';
import { 
  Search, ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle, 
  RotateCcw, CreditCard, Banknote, QrCode, ArrowRight, User, Phone,
  Sparkles, Check, AlertCircle, Eye, X, Download, FileText, ArrowLeft,
  Percent, ShieldCheck, Store, Tag
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Product, POSTransaction, POSPaymentMethod, POSTransactionItem } from '../../types';
import { api } from '../../api';

interface POSKasirViewProps {
  products: Product[];
  currentUser: any;
  onRefreshData: () => Promise<void>;
  posTransactions: POSTransaction[];
  onClose?: () => void;
}

export const POSKasirView: React.FC<POSKasirViewProps> = ({
  products,
  currentUser,
  onRefreshData,
  posTransactions,
  onClose
}) => {
  // Navigation between POS Register and History
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Mobile View Toggle: 'catalog' | 'cart' (for screens < 768px)
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Catalog search & category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // POS Cart State
  const [posCart, setPosCart] = useState<{
    product: Product;
    selectedSize: number;
    quantity: number;
  }[]>([]);

  // Customer info & adjustments
  const [customerName, setCustomerName] = useState('Pelanggan Walk-in');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('TUNAI');
  const [cashAmountPaid, setCashAmountPaid] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cart add toast indicator
  const [cartToast, setCartToast] = useState<string | null>(null);

  // Digital Receipt Popup State
  const [receiptTx, setReceiptTx] = useState<POSTransaction | null>(null);

  // Transaction Cancellation State
  const [cancellingTx, setCancellingTx] = useState<POSTransaction | null>(null);
  const [cancelReason, setCancelReason] = useState('Pelanggan membatalkan transaksi / salah input kasir');

  // Printable receipt ref
  const receiptRef = useRef<HTMLDivElement>(null);

  // Filter products for active store only
  const availableProducts = products.filter(p => {
    if (p.isActive === false) return false;
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
    }
    return true;
  });

  const showCartFeedback = (msg: string) => {
    setCartToast(msg);
    setTimeout(() => setCartToast(null), 2000);
  };

  // Add product & size to POS Cart
  const handleAddToCart = (product: Product, size: number) => {
    const sizeObj = product.sizes.find(s => s.size === size);
    const maxStock = sizeObj ? sizeObj.stock : 0;
    if (maxStock <= 0) {
      alert(`Stok size ${size} untuk ${product.name} sedang habis!`);
      return;
    }

    setPosCart(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id && item.selectedSize === size);
      if (existingIdx > -1) {
        const next = [...prev];
        const newQty = Math.min(maxStock, next[existingIdx].quantity + 1);
        next[existingIdx] = { ...next[existingIdx], quantity: newQty };
        return next;
      } else {
        return [...prev, { product, selectedSize: size, quantity: 1 }];
      }
    });

    showCartFeedback(`+ 1 ${product.name} (Size ${size})`);
  };

  const handleUpdateQuantity = (idx: number, delta: number) => {
    setPosCart(prev => {
      const next = [...prev];
      const item = next[idx];
      const sizeObj = item.product.sizes.find(s => s.size === item.selectedSize);
      const maxStock = sizeObj ? sizeObj.stock : item.product.totalStock;

      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== idx);
      }
      next[idx] = { ...item, quantity: Math.min(maxStock, newQty) };
      return next;
    });
  };

  const handleRemoveItem = (idx: number) => {
    setPosCart(prev => prev.filter((_, i) => i !== idx));
  };

  // Calculations
  const subtotal = posCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxPercent > 0 ? Math.round(totalAfterDiscount * (taxPercent / 100)) : 0;
  const grandTotal = totalAfterDiscount + taxAmount;
  const change = paymentMethod === 'TUNAI' ? Math.max(0, cashAmountPaid - grandTotal) : 0;
  const totalCartItems = posCart.reduce((sum, item) => sum + item.quantity, 0);

  // Open Payment modal
  const handleOpenPaymentModal = () => {
    if (posCart.length === 0) {
      alert('Pilih minimal 1 produk sepatu ke dalam keranjang kasir.');
      return;
    }
    // Set default cash amount for Tunai
    if (cashAmountPaid === 0 || cashAmountPaid < grandTotal) {
      setCashAmountPaid(grandTotal);
    }
    setIsPaymentModalOpen(true);
  };

  // Process transaction
  const handleProcessTransaction = async () => {
    if (posCart.length === 0) {
      alert('Keranjang kasir kosong.');
      return;
    }

    if (paymentMethod === 'TUNAI' && cashAmountPaid < grandTotal) {
      alert(`Uang tunai yang diterima (${formatIDR(cashAmountPaid)}) kurang dari total tagihan (${formatIDR(grandTotal)}).`);
      return;
    }

    setIsProcessing(true);
    try {
      const items: POSTransactionItem[] = posCart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        size: item.selectedSize,
        color: item.product.colors[0]?.name || 'Cream',
        quantity: item.quantity,
        price: item.product.price,
        costPrice: item.product.costPrice || Math.round(item.product.price * 0.55),
        subtotal: item.product.price * item.quantity
      }));

      const payload = {
        cashierName: currentUser?.name || 'Kasir Mochi Steps Solo',
        items,
        subtotal,
        discount: discountAmount,
        grandTotal,
        paymentMethod,
        amountPaid: paymentMethod === 'TUNAI' ? cashAmountPaid : grandTotal,
        change,
        customerName: customerName.trim() || 'Pelanggan Walk-in',
        customerPhone: customerPhone.trim() || undefined,
        status: 'SELESAI' as const,
        notes: notes.trim() || undefined
      };

      const createdTx = await api.createPOSTransaction(payload);
      await onRefreshData();

      // Close payment modal
      setIsPaymentModalOpen(false);

      // Open receipt automatically
      setReceiptTx(createdTx);
    } catch (err: any) {
      alert(err.message || 'Gagal memproses transaksi kasir');
    } finally {
      setIsProcessing(false);
    }
  };

  // Close receipt & clean cart
  const handleCloseReceipt = () => {
    setReceiptTx(null);
    setPosCart([]);
    setDiscountAmount(0);
    setTaxPercent(0);
    setCashAmountPaid(0);
    setNotes('');
    setCustomerName('Pelanggan Walk-in');
    setCustomerPhone('');
  };

  // Print Receipt: isolated iframe to prevent blank screen print bug
  const handlePrintReceipt = () => {
    if (!receiptTx) return;

    try {
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
      if (!frameDoc) {
        window.print();
        return;
      }

      const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Struk POS - ${receiptTx.transactionNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 76mm;
              margin: 0 auto;
              padding: 10px 4px;
              color: #000;
              background: #fff;
              font-size: 11px;
              line-height: 1.35;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .header-title { font-size: 15px; font-weight: 900; letter-spacing: 1px; }
            .divider { border-top: 1px dashed #444; margin: 8px 0; }
            .flex-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .item-row { margin-bottom: 5px; }
            .total-row { font-size: 12px; font-weight: bold; margin-top: 4px; }
            .footer { font-size: 10px; color: #333; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="header-title">MOCHISTEPS</div>
            <div style="font-size: 10px;">Step Into Your Style</div>
            <div style="font-size: 9px; color: #444;">Jl. Slamet Riyadi No. 45, Solo</div>
            <div style="font-size: 9px; color: #444;">WA: 0812-3456-7890</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="flex-row">
            <span>No. Transaksi :</span>
            <span class="bold">${receiptTx.transactionNumber}</span>
          </div>
          <div class="flex-row">
            <span>Tanggal       :</span>
            <span>${new Date(receiptTx.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="flex-row">
            <span>Kasir         :</span>
            <span>${receiptTx.cashierName}</span>
          </div>
          <div class="flex-row">
            <span>Pelanggan     :</span>
            <span>${receiptTx.customerName || 'Walk-in'}</span>
          </div>

          <div class="divider"></div>

          ${receiptTx.items.map(it => `
            <div class="item-row">
              <div class="bold">${it.name}</div>
              <div class="flex-row" style="font-size: 10px;">
                <span>${it.quantity}x @${formatIDR(it.price)} (Sz ${it.size})</span>
                <span class="bold">${formatIDR(it.subtotal)}</span>
              </div>
            </div>
          `).join('')}

          <div class="divider"></div>

          <div class="flex-row">
            <span>Subtotal:</span>
            <span>${formatIDR(receiptTx.subtotal)}</span>
          </div>
          ${receiptTx.discount > 0 ? `
            <div class="flex-row" style="color: #b00;">
              <span>Diskon:</span>
              <span>-${formatIDR(receiptTx.discount)}</span>
            </div>
          ` : ''}
          
          <div class="divider"></div>

          <div class="flex-row total-row">
            <span>TOTAL:</span>
            <span>${formatIDR(receiptTx.grandTotal)}</span>
          </div>
          <div class="flex-row" style="font-size: 10px; margin-top: 4px;">
            <span>Metode Bayar:</span>
            <span class="bold">${receiptTx.paymentMethod}</span>
          </div>
          ${receiptTx.paymentMethod === 'TUNAI' ? `
            <div class="flex-row" style="font-size: 10px;">
              <span>Uang Diterima:</span>
              <span>${formatIDR(receiptTx.amountPaid)}</span>
            </div>
            <div class="flex-row" style="font-size: 10px; font-weight: bold;">
              <span>Kembalian:</span>
              <span>${formatIDR(receiptTx.change)}</span>
            </div>
          ` : ''}

          <div class="divider"></div>

          <div class="text-center footer">
            <div>Terima kasih telah berbelanja di MochiSteps</div>
            <div>Barang dapat ditukar maks. 3 hari</div>
            <div>dengan menyertakan struk ini.</div>
          </div>
        </body>
        </html>
      `;

      frameDoc.open();
      frameDoc.write(receiptHtml);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1500);
      }, 350);

    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    }
  };

  // Download PDF Struk
  const handleDownloadPDF = () => {
    if (!receiptTx) return;

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 180 + (receiptTx.items.length * 10)]
      });

      let y = 10;
      doc.setFont('courier', 'bold');
      doc.setFontSize(14);
      doc.text('MOCHISTEPS', 40, y, { align: 'center' });

      y += 5;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text('Step Into Your Style', 40, y, { align: 'center' });

      y += 4;
      doc.text('Jl. Slamet Riyadi No. 45, Solo', 40, y, { align: 'center' });
      y += 4;
      doc.text('WA: 0812-3456-7890', 40, y, { align: 'center' });

      y += 4;
      doc.setLineDashPattern([1, 1], 0);
      doc.line(5, y, 75, y);

      y += 5;
      doc.setFontSize(8);
      doc.text(`No. Tx   : ${receiptTx.transactionNumber}`, 5, y);
      y += 4;
      const dateStr = new Date(receiptTx.createdAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Waktu    : ${dateStr}`, 5, y);
      y += 4;
      doc.text(`Kasir    : ${receiptTx.cashierName}`, 5, y);
      y += 4;
      doc.text(`Pelanggan: ${receiptTx.customerName || 'Walk-in'}`, 5, y);

      y += 3;
      doc.line(5, y, 75, y);

      // Items
      y += 5;
      receiptTx.items.forEach(it => {
        doc.setFont('courier', 'bold');
        doc.text(it.name.substring(0, 26), 5, y);
        y += 4;
        doc.setFont('courier', 'normal');
        doc.text(`${it.quantity}x @${formatIDR(it.price)} (Sz ${it.size})`, 5, y);
        doc.text(formatIDR(it.subtotal), 75, y, { align: 'right' });
        y += 5;
      });

      doc.line(5, y, 75, y);

      y += 5;
      doc.text('Subtotal:', 5, y);
      doc.text(formatIDR(receiptTx.subtotal), 75, y, { align: 'right' });

      if (receiptTx.discount > 0) {
        y += 4;
        doc.text('Diskon:', 5, y);
        doc.text(`-${formatIDR(receiptTx.discount)}`, 75, y, { align: 'right' });
      }

      y += 2;
      doc.line(5, y, 75, y);

      y += 5;
      doc.setFont('courier', 'bold');
      doc.setFontSize(10);
      doc.text('TOTAL:', 5, y);
      doc.text(formatIDR(receiptTx.grandTotal), 75, y, { align: 'right' });

      y += 5;
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.text(`Metode: ${receiptTx.paymentMethod}`, 5, y);

      if (receiptTx.paymentMethod === 'TUNAI') {
        y += 4;
        doc.text('Tunai Diterima:', 5, y);
        doc.text(formatIDR(receiptTx.amountPaid), 75, y, { align: 'right' });
        y += 4;
        doc.setFont('courier', 'bold');
        doc.text('Kembalian:', 5, y);
        doc.text(formatIDR(receiptTx.change), 75, y, { align: 'right' });
      }

      y += 4;
      doc.line(5, y, 75, y);

      y += 6;
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text('Terima kasih telah berbelanja di MochiSteps', 40, y, { align: 'center' });
      y += 3.5;
      doc.text('Barang dapat ditukar maks. 3 hari', 40, y, { align: 'center' });
      y += 3.5;
      doc.text('dengan menyertakan struk ini.', 40, y, { align: 'center' });

      doc.save(`Struk_MochiSteps_${receiptTx.transactionNumber}.pdf`);
    } catch (err) {
      console.error('Failed generating PDF:', err);
      alert('Gagal membuat PDF struk, gunakan tombol Cetak Struk.');
    }
  };

  const handleConfirmCancelTransaction = async () => {
    if (!cancellingTx) return;
    try {
      await api.cancelPOSTransaction(cancellingTx.id, cancelReason, currentUser?.name || 'Admin');
      await onRefreshData();
      setCancellingTx(null);
      setCancelReason('Pelanggan membatalkan transaksi / salah input kasir');
      alert(`Transaksi ${cancellingTx.transactionNumber} berhasil dibatalkan dan stok dikembalikan ke database.`);
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan transaksi');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAF8F5]">
      {/* Toast Feedback Notification */}
      {cartToast && (
        <div className="fixed top-4 right-4 z-[120] bg-[#24211D] text-white px-4 py-2.5 rounded-xl shadow-xl border border-white/20 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{cartToast}</span>
        </div>
      )}

      {/* Top POS Header Bar */}
      <div className="px-4 sm:px-6 py-3 bg-white border-b border-[#EAE3DA] flex items-center justify-between shrink-0 shadow-2xs gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex rounded-xl overflow-hidden border border-[#DDD3C7] p-0.5 bg-[#FAF7F2] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pos' ? 'bg-[#2D2A26] text-white shadow-xs' : 'text-[#6E5C49] hover:bg-[#F2ECE4]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Kasir POS Aktif</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 sm:px-4 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'history' ? 'bg-[#2D2A26] text-white shadow-xs' : 'text-[#6E5C49] hover:bg-[#F2ECE4]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Riwayat ({posTransactions.length})</span>
            </button>
          </div>

          {/* Mobile Switcher (visible only on < md screens when in 'pos' tab) */}
          {activeTab === 'pos' && (
            <div className="md:hidden flex rounded-lg border border-[#DDD3C7] overflow-hidden text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className={`px-2.5 py-1 ${mobileTab === 'catalog' ? 'bg-[#B36B73] text-white' : 'bg-white text-[#524638]'}`}
              >
                Katalog ({availableProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setMobileTab('cart')}
                className={`px-2.5 py-1 flex items-center gap-1 ${mobileTab === 'cart' ? 'bg-[#B36B73] text-white' : 'bg-white text-[#524638]'}`}
              >
                <span>Keranjang</span>
                {totalCartItems > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white text-[#B36B73] text-[10px] flex items-center justify-center">
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-[#7A6E60]">
            <User className="w-3.5 h-3.5 text-[#B36B73]" />
            <span>Kasir: <strong className="text-[#2D2A26]">{currentUser?.name || 'Kasir Mochi Steps'}</strong></span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#8C8072] hover:text-[#2D2A26] hover:bg-[#F2ECE4] rounded-lg transition-colors cursor-pointer"
              title="Tutup POS Kasir"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">
          
          {/* LEFT: PRODUCT CATALOG & SELECTION */}
          <div className={`flex-1 flex flex-col overflow-hidden min-h-0 border-r border-[#EAE3DA] p-3 sm:p-5 space-y-3.5 ${
            mobileTab === 'cart' ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Search and Category Filter Bar */}
            <div className="flex flex-col gap-2.5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C8072] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari flatshoes (nama, kategori, insole)..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] text-[#2D2A26]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8C8072] hover:text-[#2D2A26] px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {[
                  { id: 'all', label: `Semua (${products.length})` },
                  { id: 'ballet-maryjane', label: 'Ballet & Mary Jane' },
                  { id: 'pointed-mules', label: 'Pointed Mules' },
                  { id: 'casual-slipons', label: 'Casual Slip-Ons' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#2D2A26] text-white shadow-xs'
                        : 'bg-white text-[#6E5C49] border border-[#DDD3C7] hover:bg-[#FAF7F2]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid with Proper Scroll */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableProducts.length === 0 ? (
                <div className="col-span-full py-16 text-center text-xs text-[#8C8072] bg-white rounded-2xl border border-dashed border-[#DDD3C7]">
                  <Search className="w-8 h-8 text-[#DDD3C7] mx-auto mb-2" />
                  <div className="font-semibold text-[#2D2A26]">Produk tidak ditemukan</div>
                  <p className="text-[#8C8072] mt-0.5">Coba ganti kata kunci pencarian atau kategori.</p>
                </div>
              ) : (
                availableProducts.map(product => {
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl border border-[#EAE3DA] overflow-hidden shadow-2xs hover:border-[#B36B73] transition-all flex flex-col justify-between"
                    >
                      <div className="p-3">
                        <div className="relative aspect-4/3 rounded-lg overflow-hidden bg-[#FAF7F2] mb-2">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-[#4A3E31] border border-[#DDD3C7] shadow-2xs">
                            Stok: {product.totalStock}
                          </span>
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#24211D]/80 text-[#FAF7F2] backdrop-blur-xs">
                            {product.categoryName}
                          </span>
                        </div>

                        <h4 className="font-brand font-bold text-xs text-[#2D2A26] line-clamp-1">
                          {product.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="font-bold text-xs text-[#B36B73] tabular-nums">
                            {formatIDR(product.price)}
                          </span>
                          <span className="text-[10px] text-[#8C8072]">
                            Busa Insole 8mm
                          </span>
                        </div>
                      </div>

                      {/* Size Selector Buttons for Instant Cart Add */}
                      <div className="p-2.5 bg-[#FAF8F5] border-t border-[#F2EDE6]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-[#6D5D4E]">
                            Pilih Ukuran Kasir:
                          </span>
                          <span className="text-[9px] text-[#8C8072]">Klik size untuk tambah</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {product.sizes.map(s => {
                            const isAvailable = s.stock > 0;
                            // Check if this size is already in cart
                            const inCartItem = posCart.find(
                              item => item.product.id === product.id && item.selectedSize === s.size
                            );

                            return (
                              <button
                                key={s.size}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => handleAddToCart(product, s.size)}
                                className={`py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                                  inCartItem
                                    ? 'bg-[#2D2A26] border-[#2D2A26] text-white shadow-xs'
                                    : isAvailable
                                      ? 'bg-white border-[#DDD3C7] text-[#2D2A26] hover:bg-[#FAF7F2] hover:border-[#B36B73] active:scale-95 shadow-2xs'
                                      : 'bg-[#F2EDE6] border-transparent text-[#B5A99B] cursor-not-allowed opacity-50'
                                }`}
                                title={`Size ${s.size} (Stok: ${s.stock}${inCartItem ? ` | Di keranjang: ${inCartItem.quantity}` : ''})`}
                              >
                                <span>{s.size}</span>
                                {inCartItem && (
                                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#B36B73] text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-xs">
                                    {inCartItem.quantity}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Mobile Bottom Bar when viewing Catalog (Quick View Cart) */}
            {totalCartItems > 0 && (
              <div className="md:hidden shrink-0 pt-2 border-t border-[#EAE3DA]">
                <button
                  type="button"
                  onClick={() => setMobileTab('cart')}
                  className="w-full py-3 px-4 bg-[#2D2A26] text-white rounded-xl font-bold text-xs flex items-center justify-between shadow-md active:scale-98"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#E3B890]" />
                    <span>{totalCartItems} Item di Keranjang</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#E3B890]">
                    <span>{formatIDR(grandTotal)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>
            )}

          </div>

          {/* RIGHT: POS CART & CHECKOUT PANEL */}
          <div className={`w-full md:w-80 lg:w-96 shrink-0 flex flex-col h-full bg-white border-t md:border-t-0 md:border-l border-[#EAE3DA] overflow-hidden ${
            mobileTab === 'catalog' ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Cart Header */}
            <div className="p-3.5 border-b border-[#EAE3DA] bg-[#FAF8F5] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('catalog')}
                  className="md:hidden p-1 text-[#6E5C49] hover:bg-[#F2ECE4] rounded"
                  title="Kembali ke Katalog"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <ShoppingCart className="w-4 h-4 text-[#B36B73]" />
                <h3 className="font-brand font-bold text-xs text-[#2D2A26]">
                  Keranjang Kasir ({totalCartItems})
                </h3>
              </div>
              {posCart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPosCart([])}
                  className="text-[11px] text-rose-700 hover:text-rose-900 font-semibold cursor-pointer"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List: flex-1 overflow-y-auto min-h-0 */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-0">
              {posCart.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#8C8072]">
                  <ShoppingCart className="w-8 h-8 text-[#DDD3C7] mx-auto mb-2 stroke-1" />
                  <div className="font-semibold text-[#2D2A26]">Keranjang kasir masih kosong</div>
                  <p className="text-[11px] text-[#8C8072] mt-1">
                    Pilih ukuran sepatu di katalog untuk memasukkan pesanan pelanggan.
                  </p>
                </div>
              ) : (
                posCart.map((item, idx) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}`}
                    className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] flex items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-lg shrink-0 border border-[#DDD3C7]"
                      />
                      <div className="min-w-0">
                        <h5 className="font-bold text-[#2D2A26] truncate">
                          {item.product.name}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-[#6E5C49] mt-0.5">
                          <span className="font-semibold bg-white px-1.5 py-0.5 rounded border border-[#DDD3C7]">
                            Size {item.selectedSize}
                          </span>
                          <span className="font-medium text-[#B36B73]">
                            {formatIDR(item.product.price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center rounded-lg border border-[#DDD3C7] bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="p-1 hover:bg-[#FAF7F2] text-[#55493C] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold text-xs text-[#2D2A26] tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="p-1 hover:bg-[#FAF7F2] text-[#55493C] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-[#8C8072] hover:text-rose-700 rounded transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Data Pelanggan Walk-In */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] space-y-2 text-xs">
                <span className="font-bold text-[#453D34] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-[#B36B73]" />
                  Informasi Pelanggan
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#6D5D4E] block mb-0.5">Nama Pembeli:</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Pelanggan Walk-in"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DDD3C7] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-[#B36B73]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6D5D4E] block mb-0.5">No. WhatsApp:</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0812..."
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DDD3C7] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-[#B36B73]"
                    />
                  </div>
                </div>
              </div>

              {/* Diskon & Pajak Inputs */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] space-y-2 text-xs">
                <span className="font-bold text-[#453D34] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                  <Percent className="w-3.5 h-3.5 text-[#B36B73]" />
                  Diskon &amp; Pajak
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#6D5D4E] block mb-0.5">Diskon (Rp):</label>
                    <input
                      type="number"
                      step={5000}
                      min={0}
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DDD3C7] rounded-lg text-xs text-[#2D2A26] tabular-nums focus:outline-none focus:border-[#B36B73]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6D5D4E] block mb-0.5">Pajak:</label>
                    <select
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#DDD3C7] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-[#B36B73]"
                    >
                      <option value="0">0% (Bebas)</option>
                      <option value="11">PPN 11%</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM CHECKOUT SUMMARY */}
            <div className="p-3.5 border-t border-[#EAE3DA] bg-white space-y-2.5 shrink-0 shadow-lg">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#6E6051]">
                  <span>Subtotal ({totalCartItems} item):</span>
                  <span className="tabular-nums font-semibold">{formatIDR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Diskon:</span>
                    <span className="tabular-nums font-semibold">-{formatIDR(discountAmount)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-[#7A6E60]">
                    <span>Pajak ({taxPercent}%):</span>
                    <span className="tabular-nums font-semibold">+{formatIDR(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-[#2D2A26] pt-1.5 border-t border-[#EAE3DA]">
                  <span>Total Tagihan:</span>
                  <span className="text-[#B36B73] tabular-nums text-base font-black">{formatIDR(grandTotal)}</span>
                </div>
              </div>

              {/* Action Button: Buka Modal Pembayaran */}
              <button
                type="button"
                disabled={posCart.length === 0}
                onClick={handleOpenPaymentModal}
                className="w-full py-3 px-4 bg-[#2D2A26] hover:bg-[#1A1816] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                <CreditCard className="w-4 h-4 text-[#E3B890]" />
                <span>Bayar Transaksi ({formatIDR(grandTotal)})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* POS TRANSACTION HISTORY VIEW */
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 min-h-0">
          <div className="bg-white p-4 rounded-xl border border-[#EAE3DA] flex items-center justify-between shadow-2xs">
            <div>
              <h3 className="font-brand font-bold text-sm text-[#2D2A26]">
                Riwayat Transaksi POS Kasir Mochi Steps
              </h3>
              <p className="text-xs text-[#7A6E60]">
                Seluruh transaksi tersimpan di database Firestore dan tercatat pada mutasi stok otomatis.
              </p>
            </div>
            <div className="text-xs font-bold text-[#2D2A26]">
              Total Transaksi POS: {posTransactions.length}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#EAE3DA] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4">Pelanggan</th>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Metode</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE6]">
                  {posTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#7F7466]">
                        Belum ada riwayat transaksi kasir offline.
                      </td>
                    </tr>
                  ) : (
                    posTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#2D2A26]">
                          {tx.transactionNumber}
                        </td>
                        <td className="py-3 px-4 text-[#63574A]">
                          {new Date(tx.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 text-[#2D2A26] font-medium">
                          {tx.cashierName}
                        </td>
                        <td className="py-3 px-4 text-[#63574A]">
                          {tx.customerName || 'Walk-in'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#2D2A26]">
                            {tx.items.reduce((s, it) => s + it.quantity, 0)} psg
                          </span>
                          <span className="text-[10px] text-[#7A6E60] block truncate max-w-xs">
                            {tx.items.map(it => `${it.quantity}x ${it.name} (${it.size})`).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF7F2] text-[#4A3E31] border border-[#DDD3C7]">
                            {tx.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-[#2D2A26] tabular-nums">
                          {formatIDR(tx.grandTotal)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {tx.status === 'SELESAI' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Selesai
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              Dibatalkan
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setReceiptTx(tx)}
                              className="px-2.5 py-1 bg-white border border-[#DDD3C7] hover:bg-[#FAF8F5] text-[#4A3E31] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Cetak Ulang Struk"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Struk</span>
                            </button>
                            {tx.status !== 'BATAL' && (
                              <button
                                type="button"
                                onClick={() => setCancellingTx(tx)}
                                className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="Batalkan Transaksi & Kembalikan Stok"
                              >
                                Batalkan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN KASIR (FIT 85-90VH, SCROLLABLE BODY, FIXED FOOTER) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header: shrink-0 */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-[#2D2A26] to-[#453D35] text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <CreditCard className="w-4 h-4 text-[#E3B890]" />
                </div>
                <div>
                  <h3 className="font-brand font-bold text-sm text-white">Pembayaran Kasir Mochi Steps</h3>
                  <p className="text-[11px] text-[#D6CBC0]">Pilih metode dan konfirmasi pembayaran pelanggan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: flex-1 overflow-y-auto min-h-0 */}
            <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
              {/* Total Tagihan Box */}
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5DACD] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#7A6E60] font-semibold block">Total yang Harus Dibayar:</span>
                  <div className="text-2xl font-black text-[#B36B73] tabular-nums mt-0.5">
                    {formatIDR(grandTotal)}
                  </div>
                  <span className="text-[11px] text-[#9A8D7E]">
                    {totalCartItems} pasang sepatu · {customerName}
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DDD3C7] shadow-2xs">
                  <ShoppingCart className="w-6 h-6 text-[#B36B73]" />
                </div>
              </div>

              {/* Pilihan Metode Pembayaran: Tunai / QRIS / Transfer */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#3D352E] block">
                  Pilih Metode Pembayaran:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('TUNAI');
                      if (cashAmountPaid < grandTotal) setCashAmountPaid(grandTotal);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'TUNAI'
                        ? 'border-[#2D2A26] bg-[#2D2A26] text-white shadow-xs'
                        : 'border-[#DDD3C7] bg-[#FAF8F5] text-[#4A3E31] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mb-1.5 text-[#E3B890]" />
                    <span className="font-bold text-xs block">Tunai</span>
                    <span className="text-[10px] opacity-80">Uang cash / fisik</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'QRIS'
                        ? 'border-[#2D2A26] bg-[#2D2A26] text-white shadow-xs'
                        : 'border-[#DDD3C7] bg-[#FAF8F5] text-[#4A3E31] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mb-1.5 text-[#E3B890]" />
                    <span className="font-bold text-xs block">QRIS</span>
                    <span className="text-[10px] opacity-80">Scan QRIS Kasir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-[#2D2A26] bg-[#2D2A26] text-white shadow-xs'
                        : 'border-[#DDD3C7] bg-[#FAF8F5] text-[#4A3E31] hover:bg-[#F2ECE4]'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mb-1.5 text-[#E3B890]" />
                    <span className="font-bold text-xs block">Transfer</span>
                    <span className="text-[10px] opacity-80">BCA / Mandiri</span>
                  </button>
                </div>
              </div>

              {/* Rincian Metode Tunai (Uang Diterima & Kembalian) */}
              {paymentMethod === 'TUNAI' ? (
                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#4A3E31]">Uang Diterima dari Pembeli:</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6E60]">Rp</span>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={cashAmountPaid || ''}
                        onChange={(e) => setCashAmountPaid(parseInt(e.target.value, 10) || 0)}
                        className="w-40 pl-8 pr-3 py-2 text-right font-bold text-sm bg-white border border-[#DDD3C7] rounded-xl tabular-nums focus:outline-none focus:border-[#B36B73]"
                      />
                    </div>
                  </div>

                  {/* Tombol Uang Cepat */}
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setCashAmountPaid(grandTotal)}
                      className="px-2.5 py-1 bg-white border border-[#DDD3C7] hover:bg-[#FAF7F2] rounded-lg text-xs font-bold text-[#5A4F42] cursor-pointer"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashAmountPaid(Math.ceil(grandTotal / 50000) * 50000)}
                      className="px-2.5 py-1 bg-white border border-[#DDD3C7] hover:bg-[#FAF7F2] rounded-lg text-xs font-bold text-[#5A4F42] cursor-pointer"
                    >
                      {formatIDR(Math.ceil(grandTotal / 50000) * 50000)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashAmountPaid(Math.ceil(grandTotal / 100000) * 100000)}
                      className="px-2.5 py-1 bg-white border border-[#DDD3C7] hover:bg-[#FAF7F2] rounded-lg text-xs font-bold text-[#5A4F42] cursor-pointer"
                    >
                      {formatIDR(Math.ceil(grandTotal / 100000) * 100000)}
                    </button>
                  </div>

                  {/* Kembalian Box */}
                  <div className="pt-2 border-t border-[#EAE0D3] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#5A4F42]">Uang Kembalian:</span>
                    <span className={`text-base font-black tabular-nums ${
                      cashAmountPaid < grandTotal ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {cashAmountPaid < grandTotal 
                        ? `Kurang ${formatIDR(grandTotal - cashAmountPaid)}` 
                        : formatIDR(change)}
                    </span>
                  </div>
                </div>
              ) : paymentMethod === 'QRIS' ? (
                /* Detail QRIS */
                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] text-center space-y-2">
                  <div className="inline-block p-2 bg-white rounded-xl border border-[#DDD3C7] shadow-2xs">
                    <QrCode className="w-24 h-24 text-[#2D2A26] mx-auto" />
                  </div>
                  <div className="text-xs font-bold text-[#2D2A26]">QRIS Mochi Steps Solo</div>
                  <p className="text-[11px] text-[#7A6E60]">
                    Arahkan smartphone pelanggan ke barcode QRIS di meja kasir. Transaksi terverifikasi otomatis.
                  </p>
                </div>
              ) : (
                /* Detail Transfer */
                <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] space-y-2 text-xs">
                  <div className="font-bold text-[#2D2A26]">Rekening Resmi Mochi Steps:</div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#DDD3C7] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#6D5D4E]">Bank:</span>
                      <strong className="text-[#2D2A26]">BCA - 0158-992-881</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6D5D4E]">Atas Nama:</span>
                      <strong className="text-[#2D2A26]">Mochi Steps Solo</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: ALWAYS VISIBLE AND CLICKABLE */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#EAE3DA] flex items-center gap-2.5 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="py-2.5 px-4 text-xs font-bold border border-[#DDD3C7] bg-white rounded-xl hover:bg-[#FAF7F2] text-[#524638] transition-colors cursor-pointer shadow-2xs"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing || (paymentMethod === 'TUNAI' && cashAmountPaid < grandTotal)}
                onClick={handleProcessTransaction}
                className="flex-1 py-2.5 px-4 bg-[#2D2A26] hover:bg-[#1A1816] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Menyimpan Transaksi...</span>
                  </span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-[#E3B890]" />
                    <span>Konfirmasi Bayar &amp; Terbitkan Struk</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STRUK DIGITAL KASIR RESMI (POPUP STRUK DIGITAL PROFESIONAL, FIT VIEWPORT, TIDAK BLANK) */}
      {receiptTx && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header Popup: shrink-0 */}
            <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#EAE3DA] flex items-center justify-between shrink-0">
              <span className="font-bold text-xs text-[#2D2A26] flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-[#B36B73]" />
                <span>Struk Transaksi Selesai</span>
              </span>
              <button
                type="button"
                onClick={handleCloseReceipt}
                className="p-1 text-[#8C8072] hover:text-[#2D2A26] rounded-full hover:bg-[#F2ECE4] cursor-pointer"
                title="Tutup Struk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Struk Area (Kompak, Rapi, Identitas Mochi Steps): flex-1 overflow-y-auto */}
            <div 
              ref={receiptRef}
              className="flex-1 overflow-y-auto min-h-0 p-5 bg-white font-mono text-[11px] text-[#24211D] space-y-3" 
              id="thermal-receipt-printable"
            >
              {/* Logo & Nama Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-[#888] pb-3">
                <div className="font-black text-sm tracking-wider text-[#2D2A26]">MOCHISTEPS</div>
                <div className="text-[10px] text-[#555] font-sans font-medium">Step Into Your Style</div>
                <div className="text-[10px] text-[#666]">Jl. Slamet Riyadi No. 45, Solo</div>
                <div className="text-[10px] text-[#666]">WhatsApp: 0812-3456-7890</div>
              </div>

              {/* Info Transaksi */}
              <div className="space-y-0.5 text-[10px] text-[#444] border-b border-dashed border-[#888] pb-2">
                <div className="flex justify-between">
                  <span>No. Transaksi :</span>
                  <span className="font-bold">{receiptTx.transactionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal/Waktu :</span>
                  <span>{new Date(receiptTx.createdAt).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir         :</span>
                  <span>{receiptTx.cashierName}</span>
                </div>
                {receiptTx.customerName && (
                  <div className="flex justify-between">
                    <span>Pelanggan     :</span>
                    <span>{receiptTx.customerName}</span>
                  </div>
                )}
              </div>

              {/* Daftar Produk */}
              <div className="space-y-2 border-b border-dashed border-[#888] pb-2">
                {receiptTx.items.map((it, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold text-[#2D2A26]">{it.name}</div>
                    <div className="flex justify-between text-[10px] text-[#555]">
                      <span>{it.quantity} x {formatIDR(it.price)} (Size {it.size})</span>
                      <span className="font-bold tabular-nums text-[#2D2A26]">{formatIDR(it.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rincian Total */}
              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between text-[#555]">
                  <span>Subtotal:</span>
                  <span className="tabular-nums font-semibold">{formatIDR(receiptTx.subtotal)}</span>
                </div>
                {receiptTx.discount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Diskon:</span>
                    <span className="tabular-nums font-semibold">-{formatIDR(receiptTx.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-[#888] text-[#2D2A26]">
                  <span>TOTAL PEMBAYARAN:</span>
                  <span className="tabular-nums">{formatIDR(receiptTx.grandTotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-[#555]">
                  <span>Metode Pembayaran:</span>
                  <span className="font-bold text-[#2D2A26]">{receiptTx.paymentMethod}</span>
                </div>
                {receiptTx.paymentMethod === 'TUNAI' && (
                  <>
                    <div className="flex justify-between text-[10px] text-[#555]">
                      <span>Tunai Diterima:</span>
                      <span className="tabular-nums font-semibold">{formatIDR(receiptTx.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-emerald-800">
                      <span>Kembalian:</span>
                      <span className="tabular-nums">{formatIDR(receiptTx.change)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Footer Struk */}
              <div className="text-center pt-3 border-t border-dashed border-[#888] text-[10px] text-[#666] space-y-0.5">
                <div className="font-medium">Terima kasih telah berbelanja di MochiSteps</div>
                <div>Barang yang sudah dibeli dapat ditukar</div>
                <div>maksimal 3 hari dengan menyertakan struk ini.</div>
              </div>
            </div>

            {/* Tombol Aksi: Cetak Struk | Download PDF | Tutup */}
            <div className="p-3.5 bg-[#FAF8F5] border-t border-[#EAE3DA] flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2 px-3 text-xs font-bold bg-[#2D2A26] text-white rounded-xl hover:bg-[#1A1816] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Cetak Struk Thermal"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>🖨 Cetak Struk</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-1 py-2 px-3 text-xs font-bold bg-white border border-[#DDD3C7] text-[#4A3E31] rounded-xl hover:bg-[#FAF7F2] flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  title="Download File PDF Struk"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>📄 Download PDF</span>
                </button>
              </div>
              <button
                type="button"
                onClick={handleCloseReceipt}
                className="w-full py-2 text-xs font-semibold text-[#6E5C49] hover:bg-[#F2ECE4] rounded-xl border border-transparent transition-colors cursor-pointer text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL TRANSACTION MODAL */}
      {cancellingTx && (
        <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] p-6 space-y-4">
            <h3 className="font-brand font-bold text-base text-[#24211D]">
              Batalkan Transaksi Kasir: {cancellingTx.transactionNumber}
            </h3>
            <p className="text-xs text-[#6B6154]">
              Pembatalan transaksi akan mengembalikan seluruh stok produk ke gudang secara otomatis dan mencatat mutasi pengembalian.
            </p>
            <div>
              <label className="text-xs font-bold text-[#453D34] block mb-1">
                Alasan Pembatalan Transaksi *
              </label>
              <input
                type="text"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl text-xs font-medium text-[#2D2A26]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingTx(null)}
                className="flex-1 py-2 px-3 border border-[#DDD3C7] rounded-xl text-xs font-semibold text-[#524638]"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelTransaction}
                className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold"
              >
                Konfirmasi Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper IDR Formatter
function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}
