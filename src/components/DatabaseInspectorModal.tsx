import React, { useState, useEffect } from 'react';
import { 
  X, Database, HardDrive, RefreshCw, CheckCircle2, 
  Layers, Package, ShoppingCart, Users, Copy, Check, FileCode,
  ArrowRight, ShieldCheck, Activity
} from 'lucide-react';
import { api } from '../api';
import { Product, Order, Customer } from '../types';

interface DatabaseInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const DatabaseInspectorModal: React.FC<DatabaseInspectorModalProps> = ({
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'customers' | 'raw'>('overview');
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [rawJson, setRawJson] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState<number>(14);

  useEffect(() => {
    if (isOpen) {
      loadAllDbData();
    }
  }, [isOpen]);

  const loadAllDbData = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const [healthRes, rawRes, prodsRes, ordersRes, custsRes] = await Promise.all([
        api.getHealth(),
        api.getRawDb(),
        api.getProducts(),
        api.getOrders(),
        api.getCustomers()
      ]);
      const end = performance.now();
      setLatency(Math.round(end - start));
      setDbHealth(healthRes);
      setRawJson(JSON.stringify(rawRes, null, 2));
      setProducts(prodsRes);
      setOrders(ordersRes);
      setCustomers(custsRes);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to load database inspector data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(rawJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#FAF8F5] w-full max-w-5xl rounded-2xl shadow-2xl border border-[#E0D5C7] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#24211E] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#3A3530]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#342D26] border border-[#52473D] flex items-center justify-center text-[#E8BA93]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-brand font-bold text-base text-[#FAF7F2]">
                  Database Store Inspector
                </h3>
                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Connected ({latency}ms)
                </span>
              </div>
              <p className="text-xs text-[#ABA092] flex items-center gap-2 mt-0.5">
                <span>File: <strong className="text-[#E8D4C0] font-mono">/data/mochisteps_db.json</strong></span>
                <span>·</span>
                <span className="text-[#968979]">Single Source of Truth (Node.js/Express)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllDbData}
              disabled={isLoading}
              className="p-2 bg-[#312C27] hover:bg-[#433B34] text-[#D8CFBF] rounded-lg border border-[#483F37] transition-colors"
              title="Refresh Database Store"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#E8BA93]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#A69988] hover:text-white hover:bg-[#342D26] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#EFE9DF] border-b border-[#DFD6C9] px-5 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white text-[#24211D] shadow-xs border border-[#D5C9B8]'
                : 'text-[#6B6154] hover:text-[#24211D] hover:bg-white/50'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-[#B36B73]" />
            <span>Overview & Info Store</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-white text-[#24211D] shadow-xs border border-[#D5C9B8]'
                : 'text-[#6B6154] hover:text-[#24211D] hover:bg-white/50'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-[#B36B73]" />
            <span>Tabel Produk ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-white text-[#24211D] shadow-xs border border-[#D5C9B8]'
                : 'text-[#6B6154] hover:text-[#24211D] hover:bg-white/50'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5 text-[#B36B73]" />
            <span>Tabel Pesanan ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-white text-[#24211D] shadow-xs border border-[#D5C9B8]'
                : 'text-[#6B6154] hover:text-[#24211D] hover:bg-white/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#B36B73]" />
            <span>Tabel Pelanggan ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'bg-white text-[#24211D] shadow-xs border border-[#D5C9B8]'
                : 'text-[#6B6154] hover:text-[#24211D] hover:bg-white/50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-[#B36B73]" />
            <span>Raw JSON Database File</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-[#24211D]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Highlight Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#E3D9CC] shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Status: Active Real Database (Single Source of Truth)
                    </div>
                    <h4 className="font-brand font-bold text-lg text-[#24211D]">
                      Penyimpanan Data Toko Mochi Steps
                    </h4>
                    <p className="text-xs text-[#6E6354] leading-relaxed max-w-2xl">
                      Semua data produk (12 produk), keranjang, order baru, unggahan bukti pembayaran, approval admin, dan data pelanggan disimpan dan disinkronkan langsung ke file database backend secara permanen.
                    </p>
                  </div>
                  
                  <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#EADFCF] min-w-[240px]">
                    <div className="text-[11px] text-[#857867] font-semibold uppercase tracking-wider">Lokasi Fisik DB</div>
                    <div className="font-mono text-xs font-bold text-[#8C4F56] break-all mt-0.5">
                      {dbHealth?.filePath || '/data/mochisteps_db.json'}
                    </div>
                    <div className="text-[10px] text-[#9E9080] mt-1">
                      Engine: {dbHealth?.engine || 'Persistent JSON Database'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-xl border border-[#E5DBCE] shadow-2xs">
                  <div className="text-xs text-[#7F7363] font-medium flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-[#B36B73]" />
                    Total Produk
                  </div>
                  <div className="text-2xl font-bold text-[#24211D] mt-1 tabular-nums">
                    {products.length}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    3 Kategori Flatshoes
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5DBCE] shadow-2xs">
                  <div className="text-xs text-[#7F7363] font-medium flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-[#B36B73]" />
                    Total Pesanan
                  </div>
                  <div className="text-2xl font-bold text-[#24211D] mt-1 tabular-nums">
                    {orders.length}
                  </div>
                  <div className="text-[11px] text-[#7F7363] mt-0.5">
                    Tersimpan di DB
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5DBCE] shadow-2xs">
                  <div className="text-xs text-[#7F7363] font-medium flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#B36B73]" />
                    Total Pelanggan
                  </div>
                  <div className="text-2xl font-bold text-[#24211D] mt-1 tabular-nums">
                    {customers.length}
                  </div>
                  <div className="text-[11px] text-[#7F7363] mt-0.5">
                    Direktori Kontak
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5DBCE] shadow-2xs">
                  <div className="text-xs text-[#7F7363] font-medium flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#B36B73]" />
                    Server Status
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    200 OK
                  </div>
                  <div className="text-[11px] text-[#7F7363] mt-0.5">
                    Express & Vite Fullstack
                  </div>
                </div>
              </div>

              {/* REST API Endpoints Specification */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5DBCE] shadow-xs space-y-3">
                <h5 className="font-brand font-bold text-sm text-[#24211D]">
                  Daftar Endpoint API Database Backend (Server-Side)
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D4] flex items-center justify-between">
                    <span className="text-emerald-700 font-bold">GET /api/products</span>
                    <span className="text-[#7F7363] text-[11px]">12 Flatshoes + Kategori</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D4] flex items-center justify-between">
                    <span className="text-blue-700 font-bold">POST /api/orders</span>
                    <span className="text-[#7F7363] text-[11px]">Simpan Checkout ke DB</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D4] flex items-center justify-between">
                    <span className="text-purple-700 font-bold">POST /api/orders/:id/payment-proof</span>
                    <span className="text-[#7F7363] text-[11px]">Upload Bukti Bayar</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D4] flex items-center justify-between">
                    <span className="text-emerald-700 font-bold">POST /api/orders/:id/approve-payment</span>
                    <span className="text-[#7F7363] text-[11px]">Approval Admin</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D4] flex items-center justify-between">
                    <span className="text-emerald-700 font-bold">GET /api/reports/sales</span>
                    <span className="text-[#7F7363] text-[11px]">Laporan Sales Real-time</span>
                  </div>
                  <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#EDE2D4] flex items-center justify-between">
                    <span className="text-amber-700 font-bold">GET /api/db/raw</span>
                    <span className="text-[#7F7363] text-[11px]">Dump JSON Database</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCTS TABLE */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#7F7363]">
                <span>Menampilkan 12 Produk Flatshoes dalam Database</span>
                <span className="font-mono bg-[#EAE2D5] px-2 py-0.5 rounded text-[11px] font-semibold text-[#3D352B]">
                  Table: products
                </span>
              </div>
              <div className="overflow-x-auto border border-[#E0D5C7] rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5EFE6] text-[#4A4237] font-semibold border-b border-[#E0D5C7]">
                    <tr>
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Foto</th>
                      <th className="py-2.5 px-3">Nama Produk</th>
                      <th className="py-2.5 px-3">Kategori</th>
                      <th className="py-2.5 px-3">Harga</th>
                      <th className="py-2.5 px-3">Stok Per Ukuran</th>
                      <th className="py-2.5 px-3">Total Stok</th>
                      <th className="py-2.5 px-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE7DC]">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#8C4F56] font-semibold">{p.id}</td>
                        <td className="py-2.5 px-3">
                          <img src={p.image} alt={p.name} className="w-9 h-9 rounded-md object-cover border border-[#DFD4C5]" />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#24211D] max-w-[200px] truncate">{p.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-[#EFE9DF] text-[#615647] px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap">
                            {p.categoryName}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#24211D] whitespace-nowrap">
                          Rp {p.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {p.sizes.map((s) => (
                              <span key={s.size} className="text-[10px] bg-[#F5EFE6] px-1.5 py-0.2 rounded border border-[#DFD4C5]">
                                {s.size}:{s.stock}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-[#B36B73]">{p.totalStock} pcs</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-700">★ {p.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS TABLE */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#7F7363]">
                <span>Menampilkan Riwayat Pesanan dalam Database</span>
                <span className="font-mono bg-[#EAE2D5] px-2 py-0.5 rounded text-[11px] font-semibold text-[#3D352B]">
                  Table: orders
                </span>
              </div>
              <div className="overflow-x-auto border border-[#E0D5C7] rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5EFE6] text-[#4A4237] font-semibold border-b border-[#E0D5C7]">
                    <tr>
                      <th className="py-2.5 px-3">Invoice</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Alamat / Kota</th>
                      <th className="py-2.5 px-3">Total Belanja</th>
                      <th className="py-2.5 px-3">Metode Bayar</th>
                      <th className="py-2.5 px-3">Status Bayar</th>
                      <th className="py-2.5 px-3">Bukti Transfer</th>
                      <th className="py-2.5 px-3">Status Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE7DC]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#8C4F56] whitespace-nowrap">
                          {o.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-[#24211D]">{o.customerName}</div>
                          <div className="text-[11px] text-[#7F7363] font-mono">{o.customerPhone}</div>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[#615647] max-w-[160px] truncate">
                          {o.city ? `${o.city} (${o.subdistrict || ''})` : o.shippingAddress}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#24211D] whitespace-nowrap">
                          Rp {o.grandTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-semibold">
                          {o.paymentMethod}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.paymentStatus === 'DISETUJUI'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.paymentStatus === 'MENUNGGU_VERIFIKASI'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {o.paymentProofUrl ? (
                            <span className="text-emerald-700 font-semibold text-[11px]">Ada Bukti</span>
                          ) : (
                            <span className="text-[#9E9080] text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="bg-[#EFE9DF] text-[#52473A] px-2 py-0.5 rounded text-[10px] font-semibold">
                            {o.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOMERS TABLE */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#7F7363]">
                <span>Menampilkan Data Pelanggan Terdaftar di Database</span>
                <span className="font-mono bg-[#EAE2D5] px-2 py-0.5 rounded text-[11px] font-semibold text-[#3D352B]">
                  Table: customers
                </span>
              </div>
              <div className="overflow-x-auto border border-[#E0D5C7] rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5EFE6] text-[#4A4237] font-semibold border-b border-[#E0D5C7]">
                    <tr>
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">WhatsApp / HP</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Kota & Alamat</th>
                      <th className="py-2.5 px-3">Total Pesanan</th>
                      <th className="py-2.5 px-3">Total Belanja (LTV)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE7DC]">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF7F2] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#8C4F56]">{c.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#24211D]">{c.name}</td>
                        <td className="py-2.5 px-3 font-mono text-[#24211D]">{c.phone}</td>
                        <td className="py-2.5 px-3 text-[#7F7363] font-mono text-[11px]">{c.email || '-'}</td>
                        <td className="py-2.5 px-3 text-[11px] text-[#615647] max-w-[200px] truncate">
                          {c.city ? `${c.city} - ` : ''}{c.address}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-center">{c.totalOrders}x</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">
                          Rp {c.totalSpent.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: RAW JSON */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6E6354]">
                  Isi file fisik <strong className="font-mono text-[#8C4F56]">/data/mochisteps_db.json</strong> di server backend:
                </span>
                <button
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#24211E] hover:bg-[#3E3832] text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#E0D5C7]" />
                      <span>Salin JSON DB</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#1C1A18] text-[#E0D5C7] p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[500px] border border-[#3A3530] shadow-inner select-all">
                <pre>{rawJson || 'Memuat data JSON...'}</pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-[#EFE9DF] border-t border-[#DFD6C9] px-5 sm:px-6 py-3 flex items-center justify-between text-xs text-[#7F7363]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Database Status: <strong className="text-[#24211D]">Aktif & Real-time Persistence</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#24211D] hover:bg-[#3A3530] text-white font-semibold rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
