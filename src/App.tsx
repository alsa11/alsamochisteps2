import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { InsoleGuideModal } from './components/InsoleGuideModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { DatabaseInspectorModal } from './components/DatabaseInspectorModal';
import { Product, CartItem, Order, POSTransaction } from './types';
import { api } from './api';
import { Sparkles, Shield, HeartHandshake, ArrowUpDown, ShieldCheck, Ruler, Database, Search } from 'lucide-react';

export default function App() {
  // Products & Categories
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingInitialInvoice, setTrackingInitialInvoice] = useState<string>('');
  const [isInsoleGuideOpen, setIsInsoleGuideOpen] = useState(false);
  const [isDbInspectorOpen, setIsDbInspectorOpen] = useState(false);
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>([]);
  const [dbStats, setDbStats] = useState<{ ordersCount: number; customersCount: number }>({
    ordersCount: 6,
    customersCount: 5
  });
  
  // Admin Portal State (No visible labels per user request, opened via Ctrl+Shift+A or secret trigger)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mochisteps_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('mochisteps_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    loadProducts();

    // Check for admin session in sessionStorage
    const savedUser = sessionStorage.getItem('mochisteps_admin');
    if (savedUser) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }

    // Check URL query param or hash to open admin (?admin=true or #admin)
    if (window.location.search.includes('admin') || window.location.hash.includes('admin')) {
      triggerAdminPortal();
    }

    // Keyboard shortcut for staff/admin portal (Ctrl+Shift+A or Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        triggerAdminPortal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Custom event listener for tracking modal from checkout
    const handleOpenTracking = (e: any) => {
      if (e.detail?.invoice) {
        setTrackingInitialInvoice(e.detail.invoice);
      }
      setIsTrackingOpen(true);
    };
    window.addEventListener('open-tracking-modal', handleOpenTracking);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-tracking-modal', handleOpenTracking);
    };
  }, []);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const [list, health, txs] = await Promise.all([
        api.getProducts(),
        api.getHealth().catch(() => null),
        api.getPOSTransactions().catch(() => [])
      ]);
      setProducts(list);
      setPosTransactions(txs || []);
      if (health) {
        setDbStats({
          ordersCount: health.ordersCount || 6,
          customersCount: health.customersCount || 5
        });
      }
    } catch (err) {
      console.error('Failed to load products from server:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    size: number,
    color: string,
    quantity: number,
    buyNow = false
  ) => {
    const cartItemId = `${product.id}-${size}-${color}`;
    const sizeObj = product.sizes.find((s) => s.size === size);
    const maxStock = sizeObj?.stock || product.totalStock;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIdx > -1) {
        const next = [...prev];
        const updatedQty = Math.min(maxStock, next[existingIdx].quantity + quantity);
        next[existingIdx] = { ...next[existingIdx], quantity: updatedQty };
        return next;
      } else {
        const newItem: CartItem = {
          cartItemId,
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          selectedColor: color,
          selectedSize: size,
          quantity: Math.min(maxStock, quantity),
          maxStock
        };
        return [...prev, newItem];
      }
    });

    if (buyNow) {
      setIsCheckoutOpen(true);
    } else {
      showToast(`+${quantity} "${product.name}" (Size ${size}) ditambahkan ke keranjang`);
      setIsCartOpen(true);
    }
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleOpenCheckout = (discountAmount: number, promoCode: string) => {
    setCheckoutDiscount(discountAmount);
    setAppliedPromoCode(promoCode);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (order: Order) => {
    setCartItems([]);
    localStorage.removeItem('mochisteps_cart');
    loadProducts();
  };

  // Admin Portal Trigger
  const triggerAdminPortal = () => {
    if (adminUser) {
      setIsAdminPanelOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleLoginSuccess = (user: any) => {
    setAdminUser(user);
    sessionStorage.setItem('mochisteps_admin', JSON.stringify(user));
    setIsAdminPanelOpen(true);
  };

  const handleLogout = () => {
    setAdminUser(null);
    sessionStorage.removeItem('mochisteps_admin');
    setIsAdminPanelOpen(false);
  };

  // Filter and Sort Products
  const filteredProducts = products.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchColor = p.colors.some((c) => c.name.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchColor) return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'stock') return b.totalStock - a.totalStock;
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2D2A26]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2D2A26] text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-white/20 animate-in slide-in-from-bottom duration-300">
          <Sparkles className="w-4 h-4 text-[#D9A373]" />
          <span>{toastMessage}</span>
        </div>
      )}



      {/* Navigation with Brand Logo, DB Store Inspector, and Admin Toko */}
      <Navbar
        cartCount={cartTotalItems}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenTracking={() => {
          setTrackingInitialInvoice('');
          setIsTrackingOpen(true);
        }}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('collection-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        activeCategory={activeCategory}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        onOpenAdmin={triggerAdminPortal}
        isAdminLoggedIn={!!adminUser}
        onOpenDbInspector={() => setIsDbInspectorOpen(true)}
      />

      {/* Hero Section */}
      <Hero
        onExploreClick={() => {
          const el = document.getElementById('collection-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onCategoryClick={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('collection-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenInsoleGuide={() => setIsInsoleGuideOpen(true)}
      />

      {/* Main Catalog Section */}
      <main id="collection-section" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Section Header: Kategori (Semua Sepatu | Klasik | Pointed | Loafers), Search Bar, and Panduan Insole on right */}
        <div className="space-y-4 pb-6 border-b border-[#EAE3DA]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#8C7E70] font-semibold uppercase tracking-wider mb-1">
                <span>Katalog Resmi</span>
                <span>·</span>
                <span className="text-[#B36B73] tabular-nums font-bold">12 Koleksi Flatshoes Solo</span>
              </div>
              <h2 className="font-brand font-bold text-2xl sm:text-3xl text-[#24211D]">
                Koleksi Sepatu Mochi Steps
              </h2>
              <p className="text-xs text-[#6B6154] mt-1 max-w-xl">
                Busa insole empuk cloud-cushion 8mm, kulit ultra-soft anti-lecet, dan sol karet anti-slip.
              </p>
            </div>

            {/* Tombol Panduan Insole di sisi kanan */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsInsoleGuideOpen(true)}
                className="px-4 py-2 bg-white hover:bg-[#FAF7F2] text-[#5A4E42] border border-[#DDD3C7] rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer hover:border-[#B36B73]"
              >
                <Ruler className="w-4 h-4 text-[#B36B73]" />
                <span>Panduan Insole</span>
              </button>
            </div>
          </div>

          {/* Baris Kategori + Search Bar “Cari flatshoes...” + Sort */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2">
            {/* Kategori: Semua Sepatu | Klasik | Pointed | Loafers */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: 'all', label: 'Semua Sepatu' },
                { id: 'ballet-maryjane', label: 'Klasik' },
                { id: 'pointed-mules', label: 'Pointed' },
                { id: 'casual-slipons', label: 'Loafers' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#2D2A26] text-white shadow-xs'
                      : 'bg-white text-[#63574A] hover:bg-[#FAF7F2] border border-[#DDD3C7]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Bar “Cari flatshoes...” & Sort Dropdown */}
            <div className="flex items-center gap-2.5 flex-1 max-w-md lg:ml-auto">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C8072] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari flatshoes..."
                  className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-[#DDD3C7] rounded-xl focus:outline-none focus:border-[#B36B73] shadow-2xs text-[#2D2A26]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8C8072] hover:text-[#2D2A26] px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-white border border-[#DDD3C7] rounded-xl px-3 py-2 text-xs shadow-2xs shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#B36B73]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[#2D2A26] font-medium focus:outline-none cursor-pointer"
                >
                  <option value="recommended">Rekomendasi</option>
                  <option value="price_asc">Harga Terendah</option>
                  <option value="price_desc">Harga Tertinggi</option>
                  <option value="rating">Rating</option>
                  <option value="stock">Stok Terbanyak</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {isLoadingProducts ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#B36B73] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#7F7466]">Memuat 12 koleksi flatshoes mochi steps dari database...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-[#EAE3DA] my-8">
            <div className="text-3xl">🥿</div>
            <h3 className="font-brand font-bold text-base text-[#24211D]">
              Tidak Ada Flatshoes yang Sesuai
            </h3>
            <p className="text-xs text-[#7F7466] max-w-sm mx-auto">
              Coba ganti kata kunci pencarian atau pilih kategori lain.
            </p>
            <button
              onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
              className="mt-2 px-4 py-2 bg-[#2D2A26] text-white rounded-xl text-xs font-semibold hover:bg-[#433E37]"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-8">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
                onQuickAdd={(prod) => {
                  const defaultSize = prod.sizes.find((s) => s.stock > 0)?.size || 38;
                  const defaultColor = prod.colors[0]?.name || 'Standard';
                  handleAddToCart(prod, defaultSize, defaultColor, 1, false);
                }}
              />
            ))}
          </div>
        )}

        {/* Brand Story Banner */}
        <section className="mt-20 rounded-2xl bg-gradient-to-r from-[#FCEAE9] via-[#FAF3EE] to-[#F7F3EE] p-8 sm:p-12 border border-[#E8D4C8] grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#B36B73]">
              Filosofi Kenyamanan mochi steps
            </div>
            <h3 className="font-brand font-bold text-2xl text-[#24211D] leading-snug">
              Sepatu flat yang mengerti lekuk kaki wanita Indonesia.
            </h3>
            <p className="text-xs text-[#61574B] leading-relaxed max-w-2xl">
              Kami percaya keanggunan tidak harus mengorbankan kenyamanan. Setiap pasang flatshoes di mochi steps dibuat menggunakan teknik jahit presisi, busa insole cloud-cushion 8mm, dan bahan kulit lembut yang tahan lama tanpa membuat tumit lecet.
            </p>
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-[#4F4539] font-medium">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#B36B73]" />
                <span>100% Produk Berkualitas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-[#B36B73]" />
                <span>Garansi Tukar Size 7 Hari</span>
              </div>
              <button
                onClick={() => setIsInsoleGuideOpen(true)}
                className="flex items-center gap-1.5 text-[#B36B73] hover:underline font-bold"
              >
                <Ruler className="w-4 h-4 text-[#B36B73]" />
                <span>Panduan Insole Sepatu</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-4 flex justify-center">
            <div className="bg-white/85 backdrop-blur-xs p-6 rounded-2xl border border-white/60 shadow-lg text-center space-y-2">
              <div className="text-3xl font-extrabold text-[#24211D] tabular-nums">4.9 / 5.0</div>
              <div className="text-xs font-semibold text-[#B36B73]">Rating Kepuasan Pelanggan</div>
              <p className="text-[11px] text-[#7F7466]">
                Dipercaya ribuan wanita aktif untuk kerja, daily commuting, dan acara spesial.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <Footer
        onOpenAdmin={triggerAdminPortal}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('collection-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenTracking={() => {
          setTrackingInitialInvoice('');
          setIsTrackingOpen(true);
        }}
        onOpenInsoleGuide={() => setIsInsoleGuideOpen(true)}
        onOpenDbInspector={() => setIsDbInspectorOpen(true)}
        isAdminLoggedIn={!!adminUser}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={handleOpenCheckout}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        discount={checkoutDiscount}
        promoCode={appliedPromoCode}
        onOrderSuccess={handleOrderSuccess}
        onOpenTracking={(inv) => {
          setIsCheckoutOpen(false);
          setTrackingInitialInvoice(inv);
          setIsTrackingOpen(true);
        }}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        initialInvoice={trackingInitialInvoice}
      />

      {/* Insole Guide Modal */}
      <InsoleGuideModal
        isOpen={isInsoleGuideOpen}
        onClose={() => setIsInsoleGuideOpen(false)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Admin Panel (Full Management) */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        onLogout={handleLogout}
        currentUser={adminUser}
        onRefreshProducts={loadProducts}
      />

      {/* Database Store Inspector Modal (Real DB Explorer) */}
      <DatabaseInspectorModal
        isOpen={isDbInspectorOpen}
        onClose={() => setIsDbInspectorOpen(false)}
        onRefreshData={loadProducts}
      />

    </div>
  );
}
