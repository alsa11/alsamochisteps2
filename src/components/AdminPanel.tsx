import React, { useState, useEffect } from 'react';
import { 
  X, LogOut, Package, ShoppingCart, Users, CheckCircle, 
  BarChart3, RefreshCw, Eye, Check, XCircle, Search, Edit3, 
  Plus, Printer, AlertTriangle, Layers, Phone, MapPin, Truck, 
  Database, MessageCircle, ExternalLink, Calendar, Shield, UserCheck,
  Copy, ArrowUpDown, Filter, ShoppingBag, User, Store, CreditCard,
  Sparkles, AlertCircle, Ban, TrendingUp, DollarSign, LayoutDashboard,
  Tag, Calculator, ArrowUpRight, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Product, Order, Customer, SalesReport, StockMutation, POSTransaction } from '../types';
import { api } from '../api';
import { POSKasirView } from './admin/POSKasirView';
import { InventoryMutationsView } from './admin/InventoryMutationsView';
import { ProductFormModal } from './admin/ProductFormModal';
import { RecordMutationModal } from './admin/RecordMutationModal';
import { PricingProfitView } from './admin/PricingProfitView';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  currentUser: any;
  onRefreshProducts: () => void;
}

export type AdminTab = 
  | 'dashboard' 
  | 'products' 
  | 'orders' 
  | 'customers' 
  | 'approvals' 
  | 'sales' 
  | 'inventory' 
  | 'pricing' 
  | 'pos';

export interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
}

const DEFAULT_ADMINS: AdminMember[] = [
  { id: 'adm-1', name: 'Owner MochiSteps Solo', email: 'owner@mochisteps.com', role: 'Pemilik (Owner)', status: 'active' },
  { id: 'adm-2', name: 'Admin Kasir & Operasional', email: 'admin@mochisteps.com', role: 'Admin Kasir & Penjualan', status: 'active' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  onLogout,
  currentUser,
  onRefreshProducts
}) => {
  // Navigation Tabs: 8 Standard Modules + POS Kasir
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  
  // Data states from Google Cloud Firestore
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>([]);
  const [stockMutations, setStockMutations] = useState<StockMutation[]>([]);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Toast Feedback State
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Sales Period Filter State
  const [salesPeriod, setSalesPeriod] = useState<'harian' | 'bulanan' | 'tahunan' | 'semua'>('semua');

  // Modals & Sub-states
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [inspectProofOrder, setInspectProofOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');

  // Cancel order modal
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelOrderReason, setCancelOrderReason] = useState('Permintaan pembeli / stok tidak mencukupi');

  // Customer search & filter state
  const [searchCustomerQuery, setSearchCustomerQuery] = useState('');
  const [customerSortBy, setCustomerSortBy] = useState<'newest' | 'spent' | 'orders' | 'name'>('newest');
  const [customerLocationFilter, setCustomerLocationFilter] = useState<'all' | 'solo' | 'outside'>('all');
  const [viewingCustomerOrders, setViewingCustomerOrders] = useState<Customer | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Stock edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockEditSizes, setStockEditSizes] = useState<{ size: number; stock: number }[]>([]);

  // Add / Edit Product Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalTarget, setProductModalTarget] = useState<Product | null>(null);

  // Record Mutation Modal state
  const [isRecordMutationOpen, setIsRecordMutationOpen] = useState(false);
  const [recordMutationTargetProductId, setRecordMutationTargetProductId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [ords, custs, rep, prods, health, pos, muts] = await Promise.all([
        api.getOrders().catch(e => { console.warn('orders error:', e); return []; }),
        api.getCustomers().catch(e => { console.warn('custs error:', e); return []; }),
        api.getSalesReport().catch(e => { console.warn('report error:', e); return null; }),
        api.getProducts('all', undefined).catch(e => { console.warn('prods error:', e); return []; }),
        api.getHealth().catch(e => null),
        api.getPOSTransactions().catch(e => { console.warn('pos error:', e); return []; }),
        api.getStockMutations().catch(e => { console.warn('muts error:', e); return []; })
      ]);
      setOrders(ords);
      setCustomers(custs);
      setSalesReport(rep);
      setProducts(prods);
      setDbHealth(health);
      setPosTransactions(pos);
      setStockMutations(muts);
    } catch (err) {
      console.error('Error fetching admin data from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const getCleanPhoneForWhatsApp = (phone: string): string => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }
    return clean;
  };

  const getWhatsAppLink = (order: Order): string => {
    const clean = getCleanPhoneForWhatsApp(order.customerPhone);
    const msg = `Halo Kak ${order.customerName}, terima kasih sudah berbelanja di Mochi Steps Solo! Mengenai pesanan No. Invoice ${order.invoiceNumber} (Total: ${formatIDR(order.grandTotal)}), status pesanan saat ini: ${order.orderStatus}. Ada yang bisa kami bantu?`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  const getCustomerWhatsAppLink = (customer: Customer): string => {
    const clean = getCleanPhoneForWhatsApp(customer.phone);
    const msg = `Halo Kak ${customer.name}, salam hangat dari Mochi Steps Solo! Terima kasih telah menjadi pelanggan setia kami.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  // Payment Approval actions (DOES NOT DEDUCT STOCK AGAIN)
  const handleApprovePayment = async (orderId: string) => {
    try {
      const updated = await api.approvePayment(orderId);
      await loadAllData();
      setInspectProofOrder(null);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      showToast(`✓ Pembayaran pesanan ${updated.invoiceNumber} berhasil disetujui! Status kini LUNAS.`);
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui pembayaran');
    }
  };

  const handleRejectPayment = async () => {
    if (!inspectProofOrder) return;
    try {
      const updated = await api.rejectPayment(inspectProofOrder.id, rejectReason || 'Bukti transfer tidak valid');
      await loadAllData();
      setShowRejectModal(false);
      setInspectProofOrder(null);
      setRejectReason('');
      if (selectedOrder?.id === updated.id) {
        setSelectedOrder(updated);
      }
      showToast(`Pembayaran pesanan ${updated.invoiceNumber} ditolak.`);
    } catch (err: any) {
      alert(err.message || 'Gagal menolak pembayaran');
    }
  };

  const handleStartReject = (ord: Order) => {
    setInspectProofOrder(ord);
    setRejectReason('');
    setShowRejectModal(true);
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, status: Order['orderStatus'], tracking?: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status, tracking);
      await loadAllData();
      if (selectedOrder) {
        setSelectedOrder(updated);
      }
      showToast(`✓ Status pesanan ${updated.invoiceNumber} diperbarui menjadi ${status}.`);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status');
    }
  };

  // Cancel order: restores stock safely & creates reversal mutation
  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    try {
      await api.cancelOrder(cancellingOrder.id, cancelOrderReason, currentUser?.name || 'Admin');
      await loadAllData();
      onRefreshProducts();
      setCancellingOrder(null);
      setSelectedOrder(null);
      showToast(`Pesanan ${cancellingOrder.invoiceNumber} dibatalkan & stok dikembalikan ke database.`);
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pesanan');
    }
  };

  // Stock edit handlers
  const handleOpenStockEdit = (product: Product) => {
    setEditingProduct(product);
    setStockEditSizes(product.sizes.map(s => ({ size: s.size, stock: s.stock })));
  };

  const handleSaveStockEdit = async () => {
    if (!editingProduct) return;
    try {
      const prevTotal = editingProduct.totalStock;
      const newTotal = stockEditSizes.reduce((sum, s) => sum + s.stock, 0);
      const diff = newTotal - prevTotal;

      await api.updateProduct(editingProduct.id, {
        sizes: stockEditSizes,
        totalStock: newTotal
      });

      // Record audit mutation
      if (diff !== 0) {
        await api.recordStockMutation({
          mutationNumber: 'MUT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000),
          productId: editingProduct.id,
          productName: editingProduct.name,
          size: stockEditSizes[0]?.size || 38,
          type: diff > 0 ? 'MASUK_RESTOCK' : 'KOREKSI_STOK',
          quantity: diff,
          previousStock: prevTotal,
          newStock: newTotal,
          reason: 'Penyesuaian stok manual / opname fisik oleh admin',
          operator: currentUser?.name || 'Admin Toko'
        });
      }

      await loadAllData();
      onRefreshProducts();
      setEditingProduct(null);
      showToast(`✓ Stok ${editingProduct.name} berhasil diperbarui di Firestore.`);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan perubahan stok');
    }
  };

  // Toggle product active status (SOFT DELETE / ARSIPKAN)
  const handleToggleProductStatus = async (id: string, isActive: boolean) => {
    try {
      await api.toggleProductStatus(id, isActive);
      await loadAllData();
      onRefreshProducts();
      showToast(`Status produk berhasil diubah menjadi ${isActive ? 'Aktif' : 'Nonaktif (Arsip)'}.`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status produk');
    }
  };

  // Toggle customer active status (NO DELETE)
  const handleToggleCustomerStatus = async (id: string, isActive: boolean) => {
    try {
      await api.toggleCustomerStatus(id, isActive);
      await loadAllData();
      showToast(`Status pelanggan berhasil diubah.`);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status pelanggan');
    }
  };

  // Save or Update Product from ProductFormModal
  const handleSaveProductForm = async (productData: any) => {
    if (productModalTarget) {
      await api.updateProduct(productModalTarget.id, productData);
      showToast('✓ Data produk berhasil diperbarui di Firestore.');
    } else {
      await api.createProduct(productData);
      showToast('✓ Produk baru berhasil ditambahkan ke database.');
    }
    await loadAllData();
    onRefreshProducts();
  };

  // Save mutation from RecordMutationModal
  const handleSaveStockMutation = async (mutationData: any) => {
    await api.recordStockMutation(mutationData);
    await loadAllData();
    onRefreshProducts();
    showToast('✓ Mutasi stok berhasil dicatat ke audit log Firestore.');
  };

  // All pending payment approvals (including QRIS and bank transfers)
  const isAwaitingApproval = (o: Order) => {
    if (o.orderStatus === 'DIBATALKAN') return false;
    if (o.paymentStatus === 'DISETUJUI') return false;
    if (o.paymentStatus === 'DITOLAK') return false;
    if (o.paymentStatus === 'MENUNGGU_VERIFIKASI') return true;
    if (o.paymentStatus === 'MENUNGGU_PEMBAYARAN') return true;
    const method = (o.paymentMethod || '').toLowerCase();
    if (method.includes('qris') || method.includes('transfer') || method.includes('bca') || method.includes('mandiri')) return true;
    return !!o.paymentProofUrl;
  };

  const pendingApprovals = orders.filter(isAwaitingApproval);

  // Filtered orders for Orders Tab
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'pending_approval' && !isAwaitingApproval(o)) return false;
    if (orderFilter === 'processing' && o.orderStatus !== 'DIPROSES') return false;
    if (orderFilter === 'shipped' && o.orderStatus !== 'DIKIRIM') return false;
    if (orderFilter === 'completed' && o.orderStatus !== 'SELESAI') return false;
    if (orderFilter === 'cancelled' && o.orderStatus !== 'DIBATALKAN') return false;

    if (searchOrderQuery) {
      const q = searchOrderQuery.toLowerCase();
      return (
        o.invoiceNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.city && o.city.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered and sorted customers
  const filteredCustomers = customers
    .filter((c) => {
      if (customerLocationFilter === 'solo') {
        const loc = `${c.city || ''} ${c.subdistrict || ''} ${c.address || ''} ${c.streetAddress || ''}`.toLowerCase();
        if (!loc.includes('solo') && !loc.includes('surakarta') && !loc.includes('sukoharjo') && !loc.includes('karanganyar')) {
          return false;
        }
      } else if (customerLocationFilter === 'outside') {
        const loc = `${c.city || ''} ${c.subdistrict || ''} ${c.address || ''} ${c.streetAddress || ''}`.toLowerCase();
        if (loc.includes('solo') || loc.includes('surakarta') || loc.includes('sukoharjo') || loc.includes('karanganyar')) {
          return false;
        }
      }

      if (searchCustomerQuery.trim()) {
        const q = searchCustomerQuery.toLowerCase().trim();
        const rawDigits = q.replace(/[^0-9]/g, '');
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q) || (rawDigits.length > 2 && (c.phone || '').replace(/[^0-9]/g, '').includes(rawDigits));
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchCity = (c.city || '').toLowerCase().includes(q);
        const matchSubdistrict = (c.subdistrict || '').toLowerCase().includes(q);
        const matchAddress = (c.address || '').toLowerCase().includes(q) || (c.streetAddress || '').toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail || matchCity || matchSubdistrict || matchAddress;
      }
      return true;
    })
    .sort((a, b) => {
      if (customerSortBy === 'spent') {
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      }
      if (customerSortBy === 'orders') {
        return (b.totalOrders || 0) - (a.totalOrders || 0);
      }
      if (customerSortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      return new Date(b.createdAt || b.lastOrderDate || 0).getTime() - new Date(a.createdAt || a.lastOrderDate || 0).getTime();
    });

  // Period sales calculation for Laporan Sales
  const todayStr = new Date().toISOString().slice(0, 10);
  const thisMonthStr = new Date().toISOString().slice(0, 7);
  const thisYearStr = new Date().toISOString().slice(0, 4);

  const realizedOrders = orders.filter(o => 
    o.orderStatus !== 'DIBATALKAN' &&
    (o.paymentStatus === 'DISETUJUI' || o.orderStatus === 'SELESAI' || (o.paymentMethod === 'COD' && o.orderStatus === 'DIKIRIM'))
  );
  const realizedPOS = posTransactions.filter(p => p.status === 'SELESAI');

  const periodOrders = realizedOrders.filter(o => {
    if (salesPeriod === 'harian') return o.createdAt.startsWith(todayStr);
    if (salesPeriod === 'bulanan') return o.createdAt.startsWith(thisMonthStr);
    if (salesPeriod === 'tahunan') return o.createdAt.startsWith(thisYearStr);
    return true;
  });

  const periodPOS = realizedPOS.filter(p => {
    if (salesPeriod === 'harian') return p.createdAt.startsWith(todayStr);
    if (salesPeriod === 'bulanan') return p.createdAt.startsWith(thisMonthStr);
    if (salesPeriod === 'tahunan') return p.createdAt.startsWith(thisYearStr);
    return true;
  });

  const periodOnlineRevenue = periodOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const periodPosRevenue = periodPOS.reduce((sum, p) => sum + p.grandTotal, 0);
  const periodTotalRevenue = periodOnlineRevenue + periodPosRevenue;

  let periodTotalCOGS = 0;
  let periodTotalUnits = 0;
  for (const o of periodOrders) {
    for (const it of (o.items || [])) {
      const c = it.costPrice || Math.round(it.price * 0.55);
      periodTotalCOGS += c * it.quantity;
      periodTotalUnits += it.quantity;
    }
  }
  for (const p of periodPOS) {
    for (const it of p.items) {
      const c = it.costPrice || Math.round(it.price * 0.55);
      periodTotalCOGS += c * it.quantity;
      periodTotalUnits += it.quantity;
    }
  }

  const periodGrossProfit = Math.max(0, periodTotalRevenue - periodTotalCOGS);
  const periodMarginPercent = periodTotalRevenue > 0 ? Math.round((periodGrossProfit / periodTotalRevenue) * 100) : 0;
  const periodTransactionsCount = periodOrders.length + periodPOS.length;

  const totalStockCount = products.reduce((sum, p) => sum + p.totalStock, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#2D2A26]/80 backdrop-blur-xs flex flex-col">
      <div 
        className="w-full h-full bg-[#FAF8F5] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* TOP MERCHANT HEADER (ECOMMERCE STYLE) */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-[#2D2A26] via-[#24211D] to-[#1A1816] text-white flex items-center justify-between shrink-0 shadow-md">
          {/* Brand & Store Info */}
          <div className="flex items-center gap-3.5">
            <img 
              src="/src/assets/images/mochisteps_brand_logo_1791899999020.jpg" 
              alt="MochiSteps" 
              className="w-10 h-10 rounded-xl object-cover border border-white/20 bg-white shrink-0 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brand font-black text-base tracking-wide text-white">
                  MOCHI STEPS
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B36B73]/30 text-[#F6C2C9] border border-[#B36B73]/40 tracking-wider uppercase">
                  Merchant Center
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Firebase Cloud Firestore
                </span>
              </div>
              <p className="text-[11px] text-[#C2B7AA]">
                Panel Manajemen &amp; Operasional Mochi Steps Solo · Petugas: <strong>{currentUser?.name || 'Administrator'}</strong>
              </p>
            </div>
          </div>

          {/* Right Action Buttons: Dedicated POS Kasir, Kembali ke Webstore, Refresh, Logout */}
          <div className="flex items-center gap-2.5">
            {/* DEDICATED POS KASIR BUTTON */}
            <button
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 ${
                activeTab === 'pos'
                  ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Buka Kasir POS MochiSteps"
            >
              <CreditCard className="w-4 h-4 text-white" />
              <span>POS Kasir</span>
            </button>

            {/* KEMBALI KE WEBSTORE BUTTON */}
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#FAF8F5] border border-white/20 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer group active:scale-95"
              title="Tutup Panel Admin dan Kembali ke Webstore"
            >
              <Store className="w-4 h-4 text-[#F6A5B2] group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Kembali ke Webstore</span>
            </button>

            {/* Refresh Data Button */}
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="p-2 text-[#D6CBC0] hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              title="Segarkan Data Real-Time"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Keluar dari Panel Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST NOTIFICATION */}
        {feedbackToast && (
          <div className="bg-[#2D2A26] text-white px-5 py-2.5 text-xs font-semibold flex items-center justify-between border-b border-white/10 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E3B890]" />
              <span>{feedbackToast}</span>
            </div>
            <button onClick={() => setFeedbackToast(null)} className="text-white/60 hover:text-white">✕</button>
          </div>
        )}

        {/* TAB BESAR: 8 MENU RESMI SESUAI INSTRUKSI */}
        <div className="px-6 py-2.5 bg-white border-b border-[#EAE3DA] flex items-center gap-2 overflow-x-auto shrink-0 shadow-2xs">
          
          {/* Menu 1: Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#E3B890]" />
            <span>Dashboard</span>
          </button>

          {/* Menu POS Kasir Toko */}
          <button
            onClick={() => setActiveTab('pos')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>POS Kasir</span>
          </button>

          {/* Menu 2: Data Produk & Stok */}
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <Package className="w-4 h-4 text-[#B36B73]" />
            <span>Data Produk &amp; Stok</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-[#EAE2D7] text-[#5D4E3E]'
            }`}>
              {products.length} Model
            </span>
          </button>

          {/* Menu 3: Data Order & Riwayat */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-[#B36B73]" />
            <span>Data Order &amp; Riwayat</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-[#EAE2D7] text-[#5D4E3E]'
            }`}>
              {orders.length}
            </span>
          </button>

          {/* Menu 4: Data Pelanggan */}
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <Users className="w-4 h-4 text-[#B36B73]" />
            <span>Data Pelanggan</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'customers' ? 'bg-white/20 text-white' : 'bg-[#EAE2D7] text-[#5D4E3E]'
            }`}>
              {customers.length}
            </span>
          </button>

          {/* Menu 5: Approval Pembayaran */}
          <button
            onClick={() => setActiveTab('approvals')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer relative ${
              activeTab === 'approvals'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Approval Pembayaran</span>
            {pendingApprovals.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums animate-pulse">
                {pendingApprovals.length}
              </span>
            )}
          </button>

          {/* Menu 6: Laporan Sales */}
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-[#E3B890]" />
            <span>Laporan Sales</span>
          </button>

          {/* Menu 7: Inventory & Stok */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#B36B73]" />
            <span>Inventory &amp; Stok</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-[#EAE2D7] text-[#5D4E3E]'
            }`}>
              {totalStockCount} psg
            </span>
          </button>

          {/* Menu 8: Pengaturan Harga & Profit */}
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-[#2D2A26] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#6E5C49] hover:bg-[#F2ECE4] border border-[#DDD3C7]'
            }`}
          >
            <Calculator className="w-4 h-4 text-[#B36B73]" />
            <span>Pengaturan Harga &amp; Profit</span>
          </button>

        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* TAB 0: POS KASIR TOKO (DEDICATED FULL SCREEN CASHIER) */}
          {activeTab === 'pos' && (
            <POSKasirView
              products={products}
              currentUser={currentUser}
              onRefreshData={loadAllData}
              posTransactions={posTransactions}
            />
          )}

          {/* TAB 1: DASHBOARD RINGKASAN TOKO */}
          {activeTab === 'dashboard' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#FAF8F5]">
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-[#2D2A26] to-[#453D35] p-6 rounded-2xl text-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#E3B890] font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>Selamat Datang di Merchant Center Mochi Steps Solo</span>
                  </div>
                  <h3 className="font-brand font-bold text-xl text-white mt-1">
                    Ringkasan Toko &amp; Status Operasional
                  </h3>
                  <p className="text-xs text-[#D6CBC0] mt-1">
                    Database aktif: Google Cloud Firestore · Data terisolasi dan sinkron real-time dengan toko online &amp; POS kasir.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveTab('pos')}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Buka POS Kasir</span>
                  </button>
                  <button
                    onClick={() => {
                      setProductModalTarget(null);
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#F6A5B2]" />
                    <span>+ Tambah Produk</span>
                  </button>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Total Fisik Stok */}
                <div 
                  onClick={() => setActiveTab('products')}
                  className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1.5 cursor-pointer hover:border-[#B36B73] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-[#7A6E60]">
                    <span>Total Produk &amp; Stok Fisik</span>
                    <Package className="w-4 h-4 text-[#B36B73]" />
                  </div>
                  <div className="text-2xl font-bold text-[#2D2A26] tabular-nums">
                    {totalStockCount} <span className="text-xs font-normal text-[#7A6E60]">Pasang</span>
                  </div>
                  <p className="text-[11px] text-[#7A6E60]">
                    Dari <strong>{products.length}</strong> model flatshoes terdaftar
                  </p>
                </div>

                {/* Stat 2: Pesanan Masuk */}
                <div 
                  onClick={() => setActiveTab('orders')}
                  className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1.5 cursor-pointer hover:border-[#B36B73] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-[#7A6E60]">
                    <span>Total Pesanan Webstore</span>
                    <ShoppingCart className="w-4 h-4 text-[#B36B73]" />
                  </div>
                  <div className="text-2xl font-bold text-[#2D2A26] tabular-nums">
                    {orders.length} <span className="text-xs font-normal text-[#7A6E60]">Order</span>
                  </div>
                  <p className="text-[11px] text-[#7A6E60]">
                    {orders.filter(o => o.orderStatus === 'SELESAI').length} selesai · {orders.filter(o => o.orderStatus === 'DIPROSES' || o.orderStatus === 'DIKIRIM').length} berjalan
                  </p>
                </div>

                {/* Stat 3: Total Omzet */}
                <div 
                  onClick={() => setActiveTab('sales')}
                  className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1.5 cursor-pointer hover:border-[#B36B73] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-[#7A6E60]">
                    <span>Total Omzet Penjualan</span>
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                    {formatIDR(salesReport?.totalRevenue || 0)}
                  </div>
                  <p className="text-[11px] text-[#7A6E60]">
                    Online: {formatIDR(salesReport?.onlineRevenue || 0)} · POS: {formatIDR(salesReport?.posRevenue || 0)}
                  </p>
                </div>

                {/* Stat 4: Perlu Approval Bukti */}
                <div 
                  onClick={() => setActiveTab('approvals')}
                  className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1.5 cursor-pointer hover:border-[#B36B73] transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-[#7A6E60]">
                    <span>Perlu Approval Pembayaran</span>
                    <CheckCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl font-bold text-[#B36B73] tabular-nums flex items-center gap-2">
                    <span>{pendingApprovals.length}</span>
                    {pendingApprovals.length > 0 && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Perlu Tindakan
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#7A6E60]">
                    QRIS &amp; Transfer bank menunggu verifikasi
                  </p>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setActiveTab('pricing')}
                  className="p-5 bg-white rounded-2xl border border-[#EAE3DA] hover:border-[#B36B73] transition-all cursor-pointer shadow-2xs flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FAF2EB] border border-[#E8DACB] flex items-center justify-center text-[#B36B73] group-hover:scale-105 transition-transform">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-1.5">
                      <span>Pengaturan Harga &amp; Profit</span>
                      <ChevronRight className="w-4 h-4 text-[#8C8072]" />
                    </h4>
                    <p className="text-xs text-[#7A6E60] mt-0.5">
                      Atur modal beli, rumus markup massal, dan margin keuntungan per produk.
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('inventory')}
                  className="p-5 bg-white rounded-2xl border border-[#EAE3DA] hover:border-[#B36B73] transition-all cursor-pointer shadow-2xs flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FAF2EB] border border-[#E8DACB] flex items-center justify-center text-[#B36B73] group-hover:scale-105 transition-transform">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-1.5">
                      <span>Inventory, Opname &amp; Mutasi</span>
                      <ChevronRight className="w-4 h-4 text-[#8C8072]" />
                    </h4>
                    <p className="text-xs text-[#7A6E60] mt-0.5">
                      Kelola ketersediaan stok fisik per size (36-41) dan riwayat mutasi audit.
                    </p>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveTab('customers')}
                  className="p-5 bg-white rounded-2xl border border-[#EAE3DA] hover:border-[#B36B73] transition-all cursor-pointer shadow-2xs flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FAF2EB] border border-[#E8DACB] flex items-center justify-center text-[#B36B73] group-hover:scale-105 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-1.5">
                      <span>Database Pelanggan Toko</span>
                      <ChevronRight className="w-4 h-4 text-[#8C8072]" />
                    </h4>
                    <p className="text-xs text-[#7A6E60] mt-0.5">
                      Lihat {customers.length} data pelanggan, kontak WA, riwayat belanja &amp; LTV.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Orders Preview */}
              <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#B36B73]" />
                    <span>Pesanan Terbaru Masuk</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-bold text-[#B36B73] hover:underline cursor-pointer"
                  >
                    Lihat Semua Pesanan ({orders.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Invoice</th>
                        <th className="py-2.5 px-3">Pelanggan</th>
                        <th className="py-2.5 px-3">Metode Bayar</th>
                        <th className="py-2.5 px-3">Total Tagihan</th>
                        <th className="py-2.5 px-3">Status Bayar</th>
                        <th className="py-2.5 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EDE6]">
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id} className="hover:bg-[#FAF8F5]">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#2D2A26]">{o.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-[#2D2A26]">{o.customerName}</td>
                          <td className="py-2.5 px-3 text-[#7A6E60]">{o.paymentMethod}</td>
                          <td className="py-2.5 px-3 font-bold text-[#B36B73] tabular-nums">{formatIDR(o.grandTotal)}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.paymentStatus === 'DISETUJUI' ? 'bg-emerald-100 text-emerald-800' :
                              o.paymentStatus === 'MENUNGGU_VERIFIKASI' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                              o.paymentStatus === 'DITOLAK' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-2.5 py-1 bg-[#FAF8F5] border border-[#DDD3C7] hover:bg-white rounded text-[11px] font-bold text-[#2D2A26] cursor-pointer"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA PRODUK & STOK */}
          {activeTab === 'products' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF8F5]">
              {/* Header Box */}
              <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-brand font-bold text-base text-[#2D2A26] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#B36B73]" />
                    <span>Data Produk &amp; Stok Sepatu Mochi Steps</span>
                  </h3>
                  <p className="text-xs text-[#7A6E60] mt-1">
                    Master data 12 flatshoes terdaftar di Google Cloud Firestore. Stok tersinkronisasi otomatis dengan toko online dan POS kasir.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setProductModalTarget(null);
                      setIsProductModalOpen(true);
                    }}
                    className="px-4 py-2 bg-[#2D2A26] hover:bg-[#1A1816] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#E3B890]" />
                    <span>+ Tambah Produk Baru</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
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
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EDE6]">
                      {products.map((p) => {
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
                                    {p.colors?.map(c => c.name).join(', ') || 'Standard'}
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
                                  Nonaktif
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenStockEdit(p)}
                                  className="px-2.5 py-1 bg-white hover:bg-[#FAF8F5] border border-[#DDD3C7] text-[#4A3E31] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                  title="Edit Stok per Ukuran"
                                >
                                  Edit Stok
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductModalTarget(p);
                                    setIsProductModalOpen(true);
                                  }}
                                  className="p-1.5 bg-white hover:bg-[#FAF8F5] border border-[#DDD3C7] text-[#4A3E31] rounded-lg text-xs shadow-2xs transition-colors cursor-pointer"
                                  title="Edit Informasi Produk"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductStatus(p.id, !p.isActive)}
                                  className={`p-1.5 border rounded-lg text-xs transition-colors cursor-pointer ${
                                    p.isActive !== false
                                      ? 'text-gray-500 hover:bg-gray-100 border-gray-300'
                                      : 'text-emerald-700 hover:bg-emerald-50 border-emerald-300'
                                  }`}
                                  title={p.isActive !== false ? 'Nonaktifkan / Arsipkan' : 'Aktifkan Kembali'}
                                >
                                  {p.isActive !== false ? <Ban className="w-3.5 h-3.5 text-rose-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
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
            </div>
          )}

          {/* TAB 3: DATA ORDER & RIWAYAT */}
          {activeTab === 'orders' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF8F5]">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'pending_approval', label: 'Perlu Approval' },
                    { id: 'processing', label: 'Diproses' },
                    { id: 'shipped', label: 'Dikirim' },
                    { id: 'completed', label: 'Selesai' },
                    { id: 'cancelled', label: 'Dibatalkan' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setOrderFilter(f.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        orderFilter === f.id
                          ? 'bg-[#2D2A26] text-white shadow-2xs'
                          : 'bg-white text-[#6B6154] hover:bg-[#F3ECE4] border border-[#DDD3C7]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    placeholder="Cari invoice / pelanggan / kota..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#9E9385] absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl border border-[#EAE3DA] overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Invoice</th>
                        <th className="py-3 px-4">Pelanggan</th>
                        <th className="py-3 px-4">Alamat &amp; Kota</th>
                        <th className="py-3 px-4">Total</th>
                        <th className="py-3 px-4">Metode Bayar</th>
                        <th className="py-3 px-4">Status Bayar</th>
                        <th className="py-3 px-4">Status Kirim</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EDE6]">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-[#8C8072]">
                            Tidak ada pesanan yang sesuai dengan filter.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#FAF8F5] transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-[#2D2A26]">
                              {ord.invoiceNumber}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-[#2D2A26]">{ord.customerName}</div>
                              <div className="text-[11px] text-[#7A6E60] flex items-center gap-1.5 mt-0.5">
                                <span>{ord.customerPhone}</span>
                                <a
                                  href={getWhatsAppLink(ord)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-semibold transition-colors"
                                  title="Chat WhatsApp Pembeli"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                                  <span>WA</span>
                                </a>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[#5F554A]">
                              <div className="font-medium text-[#2D2A26]">{ord.city || 'Solo'}</div>
                              <div className="text-[11px] text-[#8C8072] truncate max-w-xs">{ord.shippingAddress}</div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#2D2A26] tabular-nums">
                              {formatIDR(ord.grandTotal)}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[#5A4E42]">
                              {ord.paymentMethod}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.paymentStatus === 'DISETUJUI'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : ord.paymentStatus === 'MENUNGGU_VERIFIKASI'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                                  : ord.paymentStatus === 'DITOLAK'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                ord.orderStatus === 'SELESAI'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : ord.orderStatus === 'DIKIRIM'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : ord.orderStatus === 'DIPROSES'
                                  ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                  : ord.orderStatus === 'DIBATALKAN'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {ord.orderStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Approve Button if awaiting verification */}
                                {(ord.paymentStatus === 'MENUNGGU_VERIFIKASI' || (ord.paymentStatus === 'MENUNGGU_PEMBAYARAN' && ord.paymentMethod === 'QRIS')) && (
                                  <button
                                    onClick={() => handleApprovePayment(ord.id)}
                                    className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                    title="Setujui Pembayaran Langsung"
                                  >
                                    ✓ Setujui
                                  </button>
                                )}
                                <button
                                  onClick={() => setSelectedOrder(ord)}
                                  className="px-2.5 py-1 bg-white hover:bg-[#FAF8F5] border border-[#DDD3C7] text-[#4A3E31] rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Detail</span>
                                </button>
                                {ord.orderStatus !== 'DIBATALKAN' && ord.orderStatus !== 'SELESAI' && (
                                  <button
                                    onClick={() => setCancellingOrder(ord)}
                                    className="px-2 py-1 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                    title="Batalkan Pesanan & Kembalikan Stok"
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

          {/* TAB 4: DATA PELANGGAN */}
          {activeTab === 'customers' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF8F5]">
              {/* Header & Search */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#B36B73]" />
                      <span>Data Pelanggan Toko &amp; Riwayat Belanja (Master Data Aman)</span>
                    </h3>
                    <p className="text-xs text-[#7A6E60] mt-0.5">
                      Pelanggan tidak dapat dihapus permanen agar seluruh riwayat pembukuan dan LTV tetap akurat.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-[#2D2A26]">
                    Total {filteredCustomers.length} Pelanggan
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#8C8072] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchCustomerQuery}
                      onChange={(e) => setSearchCustomerQuery(e.target.value)}
                      placeholder="Cari nama, nomor HP / WhatsApp, kota, atau alamat jalan..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={customerLocationFilter}
                      onChange={(e) => setCustomerLocationFilter(e.target.value as any)}
                      className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl font-medium"
                    >
                      <option value="all">Semua Wilayah</option>
                      <option value="solo">Solo Raya (Surakarta/Sukoharjo)</option>
                      <option value="outside">Luar Solo Raya</option>
                    </select>

                    <select
                      value={customerSortBy}
                      onChange={(e) => setCustomerSortBy(e.target.value as any)}
                      className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#DDD3C7] rounded-xl font-medium"
                    >
                      <option value="newest">Terbaru</option>
                      <option value="spent">Total Belanja (LTV)</option>
                      <option value="orders">Jumlah Order</option>
                      <option value="name">Nama A-Z</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customers Table */}
              <div className="bg-white rounded-2xl border border-[#EAE3DA] overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Nama Pelanggan</th>
                        <th className="py-3 px-4">Kontak WhatsApp</th>
                        <th className="py-3 px-4">Kota / Alamat</th>
                        <th className="py-3 px-4 text-center">Frekuensi Belanja</th>
                        <th className="py-3 px-4 text-right">Total Belanja (LTV)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EDE6]">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#8C8072]">
                            Tidak ada data pelanggan yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-[#FAF8F5] transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#FAF3EC] text-[#8C6D52] border border-[#ECD9C8] flex items-center justify-center font-bold text-xs shrink-0">
                                  {(c.name || 'P').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-[#2D2A26]">{c.name}</div>
                                  <div className="text-[10px] text-[#8C8072]">ID: {c.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono">
                              <div className="flex items-center gap-1.5">
                                <span>{c.phone}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(c.phone);
                                    setCopiedPhone(c.phone);
                                    setTimeout(() => setCopiedPhone(null), 2000);
                                  }}
                                  className="p-0.5 text-[#8C8072] hover:text-[#2D2A26] cursor-pointer"
                                  title="Salin No HP"
                                >
                                  {copiedPhone === c.phone ? <span className="text-[10px] text-emerald-700 font-bold">OK!</span> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-[#5A4F42] max-w-xs truncate">
                              {c.city || 'Solo'} · {c.streetAddress || c.address}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={() => setViewingCustomerOrders(c)}
                                className="px-2 py-0.5 rounded-full bg-[#FAF7F2] text-[#2D2A26] border border-[#DDD3C7] font-bold text-xs hover:bg-[#F2ECE4] cursor-pointer"
                              >
                                {c.totalOrders}x order
                              </button>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-[#B36B73] tabular-nums">
                              {formatIDR(c.totalSpent)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {c.isActive !== false ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  Aktif
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                  Nonaktif
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setViewingCustomerOrders(c)}
                                  className="p-1.5 bg-white hover:bg-[#FAF8F5] border border-[#DDD3C7] text-[#4A3E31] rounded-lg text-xs cursor-pointer"
                                  title="Lihat Riwayat Belanja"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                </button>
                                <a
                                  href={getCustomerWhatsAppLink(c)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs cursor-pointer"
                                  title="Chat WhatsApp"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
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

          {/* TAB 5: APPROVAL PEMBAYARAN */}
          {activeTab === 'approvals' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF8F5]">
              <div className="p-4.5 bg-white rounded-2xl border border-[#EAE3DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h3 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Approval Pembayaran (QRIS &amp; Transfer Bank)</span>
                  </h3>
                  <p className="text-xs text-[#7A6E60] mt-0.5">
                    Validasi bukti pembayaran sebelum pesanan dipacking. Approval pesanan hanya memotong stok satu kali.
                  </p>
                </div>
                <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                  {pendingApprovals.length} Pembayaran Menunggu
                </div>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="py-16 text-center text-xs text-[#8C8072] bg-white rounded-2xl border border-dashed border-[#DDD3C7]">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 stroke-1" />
                  <div className="font-bold text-sm text-[#2D2A26]">Semua Bukti Telah Terverifikasi!</div>
                  <p className="text-[#7A6E60] mt-1">Tidak ada bukti pembayaran baru yang memerlukan tindakan saat ini.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#EAE3DA] overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] border-b border-[#EAE3DA] text-[#6E6458] font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="py-3 px-4">Order / Invoice</th>
                          <th className="py-3 px-4">Pelanggan</th>
                          <th className="py-3 px-4 text-right">Total Tagihan</th>
                          <th className="py-3 px-4">Metode Bayar</th>
                          <th className="py-3 px-4 text-center">Bukti Pembayaran</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-right">Aksi (Approve / Tolak)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2EDE6]">
                        {pendingApprovals.map((ord) => (
                          <tr key={ord.id} className="hover:bg-[#FAF8F5] transition-colors">
                            {/* Order */}
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-[#2D2A26]">{ord.invoiceNumber}</div>
                              <div className="text-[10px] text-[#7A6E60]">
                                {new Date(ord.createdAt).toLocaleString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-[10px] text-[#8C8072] mt-0.5">
                                Kurir: {ord.courier}
                              </div>
                            </td>

                            {/* Pelanggan */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#2D2A26]">{ord.customerName}</div>
                              <div className="text-[11px] font-mono text-[#5C5042] flex items-center gap-1.5 mt-0.5">
                                <span>{ord.customerPhone}</span>
                                <a
                                  href={getWhatsAppLink(ord)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#25D366] hover:text-emerald-700 font-bold"
                                  title="Chat WhatsApp Pembeli"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 inline" />
                                </a>
                              </div>
                              <div className="text-[10px] text-[#8C8072] truncate max-w-xs">{ord.city || 'Solo'}</div>
                            </td>

                            {/* Total */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="font-bold text-sm text-[#B36B73] tabular-nums">
                                {formatIDR(ord.grandTotal)}
                              </div>
                              <div className="text-[10px] text-[#7A6E60]">
                                {ord.items.reduce((s, it) => s + it.quantity, 0)} pasang sepatu
                              </div>
                            </td>

                            {/* Metode Pembayaran */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF2EB] text-[#B36B73] border border-[#E8DACB]">
                                {ord.paymentMethod}
                              </span>
                            </td>

                            {/* Bukti Pembayaran */}
                            <td className="py-3.5 px-4 text-center">
                              {ord.paymentProofUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setInspectProofOrder(ord)}
                                  className="group relative inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[#DDD3C7] bg-[#FAF7F2] hover:bg-white hover:border-[#B36B73] transition-colors cursor-pointer shadow-2xs"
                                  title="Klik untuk memperbesar bukti transfer"
                                >
                                  <img
                                    src={ord.paymentProofUrl}
                                    alt="Bukti Transfer"
                                    className="w-7 h-7 object-cover rounded"
                                  />
                                  <span className="text-[11px] font-semibold text-[#4A3E31] group-hover:text-[#B36B73]">
                                    Lihat Bukti
                                  </span>
                                </button>
                              ) : (
                                <span className="inline-block px-2 py-1 rounded text-[10px] text-[#8C8072] bg-[#FAF7F2] border border-dashed border-[#DDD3C7]">
                                  Menunggu upload
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                ord.paymentStatus === 'MENUNGGU_VERIFIKASI'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200 animate-pulse'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {ord.paymentStatus}
                              </span>
                            </td>

                            {/* Aksi (Approve / Tolak) */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApprovePayment(ord.id)}
                                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                  title="Approve / Setujui Pembayaran"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartReject(ord)}
                                  className="px-2.5 py-1.5 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Tolak Pembayaran"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(ord)}
                                  className="p-1.5 bg-white hover:bg-[#FAF8F5] border border-[#DDD3C7] text-[#4A3E31] rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                  title="Lihat Detail Pesanan"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: LAPORAN SALES DENGAN FILTER PERIODE */}
          {activeTab === 'sales' && (
            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#FAF8F5]">
              {/* Filter Periode Box */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#EAE3DA] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-brand font-bold text-sm text-[#2D2A26] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#B36B73]" />
                    <span>Laporan Penjualan &amp; Keuntungan Kotor Real-Time</span>
                  </h3>
                  <p className="text-xs text-[#7A6E60] mt-0.5">
                    Dihitung dari transaksi nyata di Firestore berdasarkan harga beli snapshot saat transaksi (bukan harga saat ini).
                  </p>
                </div>

                {/* Period Selector: Harian | Bulanan | Tahunan | Semua */}
                <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#DDD3C7]">
                  {[
                    { id: 'harian', label: 'Harian' },
                    { id: 'bulanan', label: 'Bulanan' },
                    { id: 'tahunan', label: 'Tahunan' },
                    { id: 'semua', label: 'Semua Periode' }
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSalesPeriod(p.id as any)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        salesPeriod === p.id
                          ? 'bg-[#2D2A26] text-white shadow-xs'
                          : 'text-[#6E5C49] hover:bg-[#F2ECE4]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Stat Cards Berdasarkan Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Omzet */}
                <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
                  <div className="text-[11px] text-[#7A6E60] uppercase font-bold tracking-wider">
                    Total Penjualan / Omzet
                  </div>
                  <div className="text-2xl font-bold text-[#24211D] tabular-nums">
                    {formatIDR(periodTotalRevenue)}
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Online: {formatIDR(periodOnlineRevenue)} · POS: {formatIDR(periodPosRevenue)}
                  </p>
                </div>

                {/* Total HPP Modal */}
                <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
                  <div className="text-[11px] text-[#7A6E60] uppercase font-bold tracking-wider">
                    Total Modal Sepatu (HPP)
                  </div>
                  <div className="text-2xl font-bold text-[#7A6E60] tabular-nums">
                    {formatIDR(periodTotalCOGS)}
                  </div>
                  <p className="text-[11px] text-[#7A6E60]">
                    Berdasarkan modal saat transaksi
                  </p>
                </div>

                {/* Keuntungan Kotor (Gross Profit) */}
                <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
                  <div className="text-[11px] text-[#7A6E60] uppercase font-bold tracking-wider flex items-center justify-between">
                    <span>Keuntungan Kotor</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {periodMarginPercent}% Margin
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#B36B73] tabular-nums">
                    {formatIDR(periodGrossProfit)}
                  </div>
                  <p className="text-[11px] text-[#7A6E60]">
                    Keuntungan kotor = Omzet − Total Modal
                  </p>
                </div>

                {/* Jumlah Transaksi & Unit */}
                <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-1">
                  <div className="text-[11px] text-[#7A6E60] uppercase font-bold tracking-wider">
                    Jumlah Transaksi &amp; Unit
                  </div>
                  <div className="text-2xl font-bold text-[#2D2A26] tabular-nums">
                    {periodTransactionsCount} <span className="text-sm font-normal text-[#7A6E60]">Trx ({periodTotalUnits} Psg)</span>
                  </div>
                  <p className="text-[11px] text-[#7A6E60]">
                    {periodOrders.length} Order Online · {periodPOS.length} Kasir POS
                  </p>
                </div>
              </div>

              {/* Best Selling Products */}
              {salesReport && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-4">
                    <h4 className="font-brand font-bold text-sm text-[#2D2A26]">
                      Flatshoes Paling Laris &amp; Kontribusi Keuntungan Kotor
                    </h4>
                    <div className="divide-y divide-[#F2EDE6]">
                      {salesReport.topProducts.map((p, idx) => (
                        <div key={p.productId} className="py-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-[#8C8072] w-4">{idx + 1}.</span>
                            <img src={p.image} alt={p.name} className="w-11 h-11 object-cover rounded-xl border border-[#E5DDD2]" />
                            <div>
                              <div className="font-bold text-[#2D2A26]">{p.name}</div>
                              <div className="text-[11px] text-[#7A6E60]">{p.unitsSold} pasang terjual</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[#2D2A26] tabular-nums">{formatIDR(p.revenue)}</div>
                            <div className="text-[10px] text-emerald-800 font-semibold tabular-nums">
                              Keuntungan Kotor: {formatIDR(p.grossProfit)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#EAE3DA] shadow-2xs space-y-4">
                    <h4 className="font-brand font-bold text-sm text-[#2D2A26]">
                      Kontribusi Penjualan per Kategori
                    </h4>
                    <div className="space-y-4">
                      {salesReport.categoryBreakdown.map((c) => {
                        const pct = salesReport.totalRevenue > 0 ? Math.round((c.revenue / salesReport.totalRevenue) * 100) : 0;
                        return (
                          <div key={c.categoryName} className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="font-bold text-[#2D2A26]">{c.categoryName}</span>
                              <span className="font-bold text-[#B36B73] tabular-nums">
                                {formatIDR(c.revenue)} ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-[#EFE8DF] h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#B36B73] h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[11px] text-[#7A6E60]">
                              <span>{c.unitsSold} pasang terjual</span>
                              <span className="text-emerald-800 font-semibold">Keuntungan Kotor: {formatIDR(c.grossProfit)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Print Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 bg-white border border-[#DDD3C7] hover:bg-[#FAF7F2] text-xs font-bold text-[#4A3F33] rounded-xl flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#B36B73]" />
                  <span>Cetak / Ekspor Laporan Penjualan &amp; Keuntungan Kotor</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: INVENTORY & STOK */}
          {activeTab === 'inventory' && (
            <InventoryMutationsView
              products={products}
              mutations={stockMutations}
              onOpenStockEdit={handleOpenStockEdit}
              onOpenRecordMutation={(pid) => {
                setRecordMutationTargetProductId(pid);
                setIsRecordMutationOpen(true);
              }}
              onOpenAddProduct={() => {
                setProductModalTarget(null);
                setIsProductModalOpen(true);
              }}
              onToggleProductStatus={handleToggleProductStatus}
            />
          )}

          {/* TAB 8: PENGATURAN HARGA & PROFIT */}
          {activeTab === 'pricing' && (
            <PricingProfitView
              products={products}
              onRefreshProducts={async () => {
                await loadAllData();
                onRefreshProducts();
              }}
            />
          )}

        </div>

        {/* ORDER DETAIL MODAL */}
        {selectedOrder && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6 max-h-[85vh] flex flex-col">
              <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#EAE3DA] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-brand font-bold text-sm text-[#24211D]">
                    Detail Pesanan: {selectedOrder.invoiceNumber}
                  </h3>
                  <p className="text-[11px] text-[#7A6E60]">
                    Waktu Pesan: {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-[#8C8072] hover:text-[#2D2A26] rounded-full hover:bg-[#EFE7DE] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Approval Action Bar in Detail Modal */}
                {selectedOrder.paymentStatus !== 'DISETUJUI' && selectedOrder.orderStatus !== 'DIBATALKAN' && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                    <div className="text-xs text-amber-900">
                      <strong>Menunggu Verifikasi Pembayaran:</strong>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Metode: {selectedOrder.paymentMethod} · Total: {formatIDR(selectedOrder.grandTotal)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprovePayment(selectedOrder.id)}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                      >
                        ✓ Setujui Pembayaran
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer & Shipping Summary */}
                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EAE2D7] text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-sm text-[#2D2A26]">{selectedOrder.customerName}</strong>
                      <div className="text-[#6D6153]">{selectedOrder.customerPhone}</div>
                    </div>
                    <a
                      href={getWhatsAppLink(selectedOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WhatsApp</span>
                    </a>
                  </div>
                  <div className="pt-2 border-t border-[#E5DACD] text-[#5A4E42]">
                    <div><strong>Alamat:</strong> {selectedOrder.shippingAddress}</div>
                    <div><strong>Kurir:</strong> {selectedOrder.courier} ({formatIDR(selectedOrder.courierCost)})</div>
                    <div><strong>Metode Bayar:</strong> {selectedOrder.paymentMethod}</div>
                    {selectedOrder.notes && <div><strong>Catatan:</strong> {selectedOrder.notes}</div>}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-[#7A6E60]">Produk yang Dipesan:</h4>
                  <div className="border border-[#EAE2D7] rounded-xl overflow-hidden divide-y divide-[#F2EDE6]">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-[#DDD3C7]" />
                          <div>
                            <div className="font-bold text-[#2D2A26]">{item.name}</div>
                            <div className="text-[11px] text-[#7A6E60]">Size: {item.selectedSize} · Warna: {item.selectedColor} · Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="font-bold text-[#2D2A26] tabular-nums">
                          {formatIDR(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold pt-1 px-1">
                    <span>Grand Total:</span>
                    <span className="text-[#B36B73] tabular-nums text-sm">{formatIDR(selectedOrder.grandTotal)}</span>
                  </div>
                </div>

                {/* Update Delivery Status */}
                <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#EAE2D7] space-y-2 text-xs">
                  <div className="font-bold text-[#2D2A26]">Ubah Status Pengiriman:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'DIPROSES')}
                      className={`py-2 px-3 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                        selectedOrder.orderStatus === 'DIPROSES' ? 'bg-[#2D2A26] text-white' : 'bg-white border border-[#DDD3C7] text-[#4A3E31]'
                      }`}
                    >
                      Diproses
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'DIKIRIM', selectedOrder.trackingNumber || 'MS-RESI-' + Math.floor(100000 + Math.random() * 900000))}
                      className={`py-2 px-3 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                        selectedOrder.orderStatus === 'DIKIRIM' ? 'bg-[#2D2A26] text-white' : 'bg-white border border-[#DDD3C7] text-[#4A3E31]'
                      }`}
                    >
                      Dikirim + Resi
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'SELESAI')}
                      className={`py-2 px-3 rounded-lg font-bold text-center transition-colors cursor-pointer ${
                        selectedOrder.orderStatus === 'SELESAI' ? 'bg-emerald-700 text-white' : 'bg-white border border-[#DDD3C7] text-[#4A3E31]'
                      }`}
                    >
                      Selesai
                    </button>
                  </div>
                </div>

                {/* Cancel Action */}
                {selectedOrder.orderStatus !== 'DIBATALKAN' && selectedOrder.orderStatus !== 'SELESAI' && (
                  <div className="pt-1">
                    <button
                      onClick={() => setCancellingOrder(selectedOrder)}
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200 cursor-pointer"
                    >
                      Batalkan Pesanan &amp; Kembalikan Stok ke Database
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CANCEL ORDER MODAL */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] p-6 space-y-4">
              <h3 className="font-brand font-bold text-base text-[#24211D]">
                Batalkan Pesanan: {cancellingOrder.invoiceNumber}
              </h3>
              <p className="text-xs text-[#7A6E60]">
                Membatalkan pesanan akan secara otomatis mengembalikan stok fisik seluruh varian sepatu ke Google Cloud Firestore dan mencatat mutasi pembalik.
              </p>
              <textarea
                rows={3}
                value={cancelOrderReason}
                onChange={(e) => setCancelOrderReason(e.target.value)}
                placeholder="Alasan pembatalan..."
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setCancellingOrder(null)}
                  className="flex-1 py-2 px-3 border border-[#DDD3C7] rounded-xl text-xs font-semibold text-[#524638] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmCancelOrder}
                  className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Konfirmasi Batalkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROOF INSPECT MODAL */}
        {inspectProofOrder && !showRejectModal && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6">
              <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#EAE3DA] flex items-center justify-between">
                <h3 className="font-brand font-bold text-sm text-[#24211D]">
                  Bukti Pembayaran: {inspectProofOrder.invoiceNumber}
                </h3>
                <button
                  onClick={() => setInspectProofOrder(null)}
                  className="p-1 text-[#8C8072] hover:text-[#2D2A26] rounded-full hover:bg-[#EFE7DE] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-xs text-[#5C5245] space-y-1">
                  <div className="flex items-center justify-between">
                    <span><strong>Pelanggan:</strong> {inspectProofOrder.customerName}</span>
                    <a
                      href={getWhatsAppLink(inspectProofOrder)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat WA</span>
                    </a>
                  </div>
                  <div><strong>Nominal yang harus dibayar:</strong> <span className="font-bold text-[#B36B73] tabular-nums">{formatIDR(inspectProofOrder.grandTotal)}</span></div>
                  <div><strong>Metode:</strong> {inspectProofOrder.paymentMethod}</div>
                </div>

                <div className="max-h-80 overflow-y-auto rounded-xl border border-[#DDD3C7] bg-[#FAF8F5] p-2 flex items-center justify-center">
                  {inspectProofOrder.paymentProofUrl ? (
                    <img
                      src={inspectProofOrder.paymentProofUrl}
                      alt="Struk Pembayaran"
                      className="max-h-72 object-contain rounded"
                    />
                  ) : (
                    <div className="p-8 text-center text-xs text-[#8C8072]">
                      Bukti transfer belum diunggah pelanggan (Verifikasi konfirmasi WhatsApp atau m-Banking).
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 py-2.5 px-4 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Tolak Bukti
                  </button>
                  <button
                    onClick={() => handleApprovePayment(inspectProofOrder.id)}
                    className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Setujui Pembayaran
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REJECT MODAL */}
        {showRejectModal && inspectProofOrder && (
          <div className="fixed inset-0 z-70 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] p-6 space-y-4">
              <h3 className="font-brand font-bold text-base text-[#24211D]">
                Alasan Penolakan Bukti Pembayaran
              </h3>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Nominal transfer kurang / Nama rekening tidak sesuai"
                className="w-full px-3 py-2 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 px-3 border border-[#DDD3C7] rounded-xl text-xs font-semibold text-[#524638] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleRejectPayment}
                  className="flex-1 py-2 px-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Konfirmasi Tolak
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STOCK EDIT MODAL */}
        {editingProduct && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DA]">
                <div>
                  <h3 className="font-brand font-bold text-base text-[#24211D]">
                    Edit Stok Fisik: {editingProduct.name}
                  </h3>
                  <p className="text-xs text-[#7A6E60]">
                    Perubahan akan disimpan langsung ke Firestore &amp; dicatat di mutasi audit.
                  </p>
                </div>
                <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-500 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {stockEditSizes.map((s, idx) => (
                  <div key={s.size} className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#DDD3C7] text-center">
                    <span className="text-[11px] font-bold text-[#7A6E60] block">Size {s.size}</span>
                    <input
                      type="number"
                      min="0"
                      value={s.stock}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value) || 0);
                        setStockEditSizes(prev => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], stock: val };
                          return next;
                        });
                      }}
                      className="w-full mt-1 py-1 text-center font-bold text-sm bg-white border border-[#DDD3C7] rounded-lg focus:outline-none focus:border-[#B36B73]"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 px-3 border border-[#DDD3C7] rounded-xl text-xs font-semibold text-[#524638] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveStockEdit}
                  className="flex-1 py-2 px-3 bg-[#2D2A26] hover:bg-[#1A1816] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Stok ke Database
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER ORDERS MODAL */}
        {viewingCustomerOrders && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DDD3C7] overflow-hidden my-6 max-h-[85vh] flex flex-col">
              <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#EAE3DA] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-brand font-bold text-sm text-[#24211D]">
                    Riwayat Belanja: {viewingCustomerOrders.name}
                  </h3>
                  <p className="text-[11px] text-[#7A6E60]">
                    Total Belanja (LTV): <strong>{formatIDR(viewingCustomerOrders.totalSpent)}</strong> ({viewingCustomerOrders.totalOrders} pesanan)
                  </p>
                </div>
                <button
                  onClick={() => setViewingCustomerOrders(null)}
                  className="p-1 text-[#8C8072] hover:text-[#2D2A26] rounded-full hover:bg-[#EFE7DE] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-3 overflow-y-auto flex-1">
                {orders.filter(o => 
                  (o.customerPhone && viewingCustomerOrders.phone && o.customerPhone.includes(viewingCustomerOrders.phone.slice(-6))) ||
                  (o.customerEmail && viewingCustomerOrders.email && o.customerEmail.toLowerCase() === viewingCustomerOrders.email.toLowerCase())
                ).map(o => (
                  <div key={o.id} className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE2D7] text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#2D2A26]">{o.invoiceNumber}</span>
                      <span className="text-[11px] text-[#7A6E60]">{new Date(o.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6D6153]">{o.items.length} item · {o.paymentMethod}</span>
                      <span className="font-bold text-[#B36B73] tabular-nums">{formatIDR(o.grandTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH / EDIT PRODUK */}
        <ProductFormModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          initialProduct={productModalTarget}
          onSave={handleSaveProductForm}
        />

        {/* MODAL CATAT MUTASI STOK */}
        <RecordMutationModal
          isOpen={isRecordMutationOpen}
          onClose={() => setIsRecordMutationOpen(false)}
          products={products}
          defaultProductId={recordMutationTargetProductId}
          currentUser={currentUser}
          onSaveMutation={handleSaveStockMutation}
        />

      </div>
    </div>
  );
};
