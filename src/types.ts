export type ProductCategory = 'ballet-maryjane' | 'pointed-mules' | 'casual-slipons';

export interface ProductColor {
  name: string;
  hex: string;
}

export interface SizeStock {
  size: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryName: string;
  price: number;
  originalPrice?: number;
  costPrice?: number; // Harga Beli / HPP Modal
  isActive?: boolean; // Status aktif toko (tidak dihapus permanen)
  image: string;
  description: string;
  features: string[];
  colors: ProductColor[];
  sizes: SizeStock[];
  totalStock: number;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  createdAt: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  costPrice?: number; // Snapshot HPP saat checkout
  image: string;
  selectedColor: string;
  selectedSize: number;
  quantity: number;
  maxStock: number;
}

export type PaymentStatus = 
  | 'MENUNGGU_PEMBAYARAN' 
  | 'MENUNGGU_VERIFIKASI' 
  | 'DISETUJUI' 
  | 'DITOLAK';

export type OrderStatus = 
  | 'MENUNGGU_PEMBAYARAN'
  | 'DIPROSES' 
  | 'DIKIRIM' 
  | 'SELESAI' 
  | 'DIBATALKAN';

export type PaymentMethod = 
  | 'COD' 
  | 'QRIS' 
  | 'BCA' 
  | 'MANDIRI' 
  | 'BRI' 
  | 'BNI' 
  | 'BSI' 
  | 'CIMB' 
  | 'PERMATA'
  | 'VA_BCA'
  | 'VA_MANDIRI'
  | 'VA_BRI'
  | 'VA_BNI'
  | 'VA_BSI'
  | 'VA_CIMB'
  | 'VA_PERMATA'
  | 'BANK_LAIN';

export interface Order {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  destinationType?: 'DOMESTIC' | 'INTERNATIONAL';
  country?: string;
  streetAddress: string;
  subdistrict: string; // Kecamatan
  city: string;        // Kota / Kabupaten
  postalCode: string;  // Kode Pos
  shippingAddress: string; // Combined full address
  courier: string;
  courierCost: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentProofUrl?: string;
  paymentProofUploadedAt?: string;
  paymentApprovedAt?: string;
  paymentRejectionReason?: string;
  trackingNumber?: string;
  notes?: string;
  stockDeducted?: boolean; // Mencegah double deduction
  statusHistory?: {
    status: string;
    changedAt: string;
    note: string;
    operator?: string;
  }[];
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  streetAddress: string;
  subdistrict: string;
  city: string;
  postalCode: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  isActive?: boolean; // Soft status (tidak dihapus permanen)
  createdAt: string;
}

export type StockMutationType = 
  | 'MASUK_RESTOCK' 
  | 'KELUAR_POS' 
  | 'KELUAR_ONLINE' 
  | 'PENYESUAIAN_RUSAK' 
  | 'RETUR_BATAL' 
  | 'KOREKSI_STOK';

export interface StockMutation {
  id: string;
  mutationNumber: string; // MUT-YYYYMMDD-XXXX
  productId: string;
  productName: string;
  size: number;
  type: StockMutationType;
  quantity: number; // Positif untuk masuk/retur, negatif untuk keluar
  previousStock: number;
  newStock: number;
  reason: string;
  referenceNumber?: string; // No Invoice atau No Transaksi POS
  operator: string;
  createdAt: string;
}

export interface POSTransactionItem {
  productId: string;
  name: string;
  size: number;
  color: string;
  quantity: number;
  price: number;
  costPrice: number;
  subtotal: number;
}

export type POSPaymentMethod = 'TUNAI' | 'QRIS' | 'DEBIT_BCA' | 'TRANSFER';

export interface POSTransaction {
  id: string;
  transactionNumber: string; // POS-YYYYMMDD-XXXX
  cashierName: string;
  items: POSTransactionItem[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paymentMethod: POSPaymentMethod;
  amountPaid: number;
  change: number;
  customerName?: string;
  customerPhone?: string;
  status: 'SELESAI' | 'BATAL';
  cancellationReason?: string;
  notes?: string;
  createdAt: string;
}

export interface SalesReport {
  totalRevenue: number;
  totalCOGS: number; // Total Harga Pokok Penjualan (HPP)
  grossProfit: number; // Laba Kotor = totalRevenue - totalCOGS
  grossMarginPercent: number; // (grossProfit / totalRevenue) * 100
  totalOrders: number;
  totalPOS: number;
  totalOnline: number;
  onlineRevenue: number;
  posRevenue: number;
  totalUnitsSold: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingPaymentOrders: number;
  pendingVerificationOrders: number;
  averageOrderValue: number;
  topProducts: {
    productId: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
    grossProfit: number;
  }[];
  dailyRevenue: {
    date: string;
    revenue: number;
    ordersCount: number;
    grossProfit: number;
  }[];
  categoryBreakdown: {
    categoryName: string;
    unitsSold: number;
    revenue: number;
    grossProfit: number;
  }[];
}
