import { Product, Order, Customer, SalesReport, StockMutation, POSTransaction } from './types';
import { firestoreService } from './services/firestoreService';

export const api = {
  async getHealth() {
    try {
      const health = await firestoreService.getDatabaseHealth();
      const prods = await firestoreService.getProducts();
      const ords = await firestoreService.getOrders();
      const custs = await firestoreService.getCustomers();
      return {
        ...health,
        engine: 'Google Cloud Firestore',
        filePath: 'Cloud Firestore (ai-studio-mochistepsluxury-e19c6595-3598-41da-b21b-80d5a285892b)',
        productsCount: prods.length,
        ordersCount: ords.length,
        customersCount: custs.length
      };
    } catch {
      const res = await fetch('/api/db/health');
      return res.json();
    }
  },

  async getRawDb() {
    try {
      const prods = await firestoreService.getProducts();
      const ords = await firestoreService.getOrders();
      const custs = await firestoreService.getCustomers();
      return {
        meta: {
          engine: 'Google Cloud Firestore',
          databaseId: 'ai-studio-mochistepsluxury-e19c6595-3598-41da-b21b-80d5a285892b',
          provider: 'Google Firebase Cloud Firestore',
          isRealCloudDatabase: true
        },
        products: prods,
        orders: ords,
        customers: custs
      };
    } catch {
      const res = await fetch('/api/db/raw');
      return res.json();
    }
  },

  async getProducts(category?: string, query?: string): Promise<Product[]> {
    try {
      return await firestoreService.getProducts(category, query);
    } catch (err) {
      console.warn('Firestore fallback to API:', err);
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (query) params.append('q', query);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil daftar produk');
      return res.json();
    }
  },

  async getProduct(id: string): Promise<Product> {
    try {
      const prod = await firestoreService.getProduct(id);
      if (prod) return prod;
    } catch (err) {
      console.warn('Firestore getProduct fallback:', err);
    }
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Produk tidak ditemukan');
    return res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      return await firestoreService.updateProduct(id, updates);
    } catch (err) {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Gagal mengupdate produk');
      return res.json();
    }
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    try {
      return await firestoreService.createProduct(product);
    } catch (err) {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (!res.ok) throw new Error('Gagal menambahkan produk');
      return res.json();
    }
  },

  async toggleProductStatus(id: string, isActive: boolean): Promise<Product> {
    try {
      return await firestoreService.toggleProductStatus(id, isActive);
    } catch {
      return await this.updateProduct(id, { isActive });
    }
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    // Soft delete / archive to protect audit history
    try {
      return await firestoreService.deleteProduct(id);
    } catch (err) {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menonaktifkan produk');
      return res.json();
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      return await firestoreService.getOrders();
    } catch (err) {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Gagal mengambil daftar pesanan');
      return res.json();
    }
  },

  async getOrder(id: string): Promise<Order> {
    try {
      const ord = await firestoreService.getOrder(id);
      if (ord) return ord;
    } catch (err) {
      console.warn('Firestore getOrder fallback:', err);
    }
    const res = await fetch(`/api/orders/${id}`);
    if (!res.ok) throw new Error('Pesanan tidak ditemukan');
    return res.json();
  },

  async createOrder(orderPayload: any): Promise<Order> {
    try {
      return await firestoreService.createOrder(orderPayload);
    } catch (err) {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (!res.ok) throw new Error('Gagal membuat pesanan');
      return res.json();
    }
  },

  async uploadPaymentProof(orderId: string, proofUrl: string): Promise<Order> {
    try {
      return await firestoreService.uploadPaymentProof(orderId, proofUrl);
    } catch (err) {
      const res = await fetch(`/api/orders/${orderId}/payment-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl })
      });
      if (!res.ok) throw new Error('Gagal mengunggah bukti pembayaran');
      return res.json();
    }
  },

  async approvePayment(orderId: string): Promise<Order> {
    try {
      return await firestoreService.approvePayment(orderId);
    } catch (err) {
      const res = await fetch(`/api/orders/${orderId}/approve-payment`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Gagal menyetujui pembayaran');
      return res.json();
    }
  },

  async rejectPayment(orderId: string, reason: string): Promise<Order> {
    try {
      return await firestoreService.rejectPayment(orderId, reason);
    } catch (err) {
      const res = await fetch(`/api/orders/${orderId}/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Gagal menolak bukti pembayaran');
      return res.json();
    }
  },

  async updateOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<Order> {
    try {
      return await firestoreService.updateOrderStatus(orderId, status as any, trackingNumber);
    } catch (err) {
      console.warn('Firestore update status fallback:', err);
    }
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingNumber })
    });
    if (!res.ok) throw new Error('Gagal memperbarui status pesanan');
    return res.json();
  },

  async cancelOrder(orderId: string, reason: string, operator?: string): Promise<Order> {
    try {
      return await firestoreService.cancelOrder(orderId, reason, operator);
    } catch (err: any) {
      throw new Error(err.message || 'Gagal membatalkan pesanan');
    }
  },

  async toggleCustomerStatus(id: string, isActive: boolean): Promise<Customer> {
    try {
      return await firestoreService.toggleCustomerStatus(id, isActive);
    } catch {
      throw new Error('Gagal mengubah status pelanggan');
    }
  },

  // POS Kasir methods
  async getPOSTransactions(): Promise<POSTransaction[]> {
    try {
      return await firestoreService.getPOSTransactions();
    } catch (err) {
      console.warn('POS transactions fallback:', err);
      return [];
    }
  },

  async createPOSTransaction(payload: Omit<POSTransaction, 'id' | 'createdAt' | 'transactionNumber'>): Promise<POSTransaction> {
    try {
      return await firestoreService.createPOSTransaction(payload);
    } catch (err: any) {
      throw new Error(err.message || 'Gagal menyimpan transaksi POS');
    }
  },

  async cancelPOSTransaction(id: string, reason: string, operator?: string): Promise<POSTransaction> {
    try {
      return await firestoreService.cancelPOSTransaction(id, reason, operator);
    } catch (err: any) {
      throw new Error(err.message || 'Gagal membatalkan transaksi POS');
    }
  },

  // Stock Mutations methods
  async getStockMutations(): Promise<StockMutation[]> {
    try {
      return await firestoreService.getStockMutations();
    } catch (err) {
      console.warn('Stock mutations fallback:', err);
      return [];
    }
  },

  async recordStockMutation(mutationPayload: Omit<StockMutation, 'id' | 'createdAt'>): Promise<StockMutation> {
    try {
      return await firestoreService.recordStockMutation(mutationPayload);
    } catch (err: any) {
      throw new Error(err.message || 'Gagal mencatat mutasi stok');
    }
  },

  async getCustomers(): Promise<Customer[]> {
    try {
      return await firestoreService.getCustomers();
    } catch (err) {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Gagal mengambil data pelanggan');
      return res.json();
    }
  },

  async getSalesReport(): Promise<SalesReport> {
    try {
      return await firestoreService.getSalesReport();
    } catch (err) {
      const res = await fetch('/api/reports/sales');
      if (!res.ok) throw new Error('Gagal mengambil laporan penjualan');
      return res.json();
    }
  },

  async login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login gagal');
    }
    return res.json();
  }
};
