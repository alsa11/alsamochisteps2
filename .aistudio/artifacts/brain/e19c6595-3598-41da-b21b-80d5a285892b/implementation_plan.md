# Rencana Implementasi: Sinkronisasi Data Real-Time Firestore (Otomatis Tanpa Refresh)

## Ringkasan Kebutuhan Pengguna
Pengguna menginginkan agar data pesanan masuk, approval pembayaran, serta pengurangan stok di Admin Panel MochiSteps diperbarui secara **real-time** dan **otomatis**, sehingga pengelola/admin tidak perlu menekan tombol refresh saat ada pesanan baru masuk atau saat stok berkurang. Sesuai preferensi pengguna, perubahan data langsung diperbarui di tabel secara otomatis dan hening (tanpa gangguan notifikasi suara/popup).

---

## 1. Arsitektur & Mekanisme Real-Time Firestore
Saat ini data pesanan (`orders`) dan produk (`products`) dimuat melalui pemanggilan manual `getDocs()`. Kami akan mengintegrasikan listener real-time Firestore menggunakan `onSnapshot`:

1. **Service Layer (`src/services/firestoreService.ts` & `src/api.ts`)**:
   - Tambahkan fungsi listener real-time:
     - `subscribeOrders(callback: (orders: Order[]) => void): () => void`
     - `subscribeProducts(callback: (products: Product[]) => void): () => void`
     - `subscribePOSTransactions(callback: (txs: POSTransaction[]) => void): () => void`
   - Listener menggunakan `onSnapshot` dari Firebase Firestore SDK (`firebase/firestore`).
   - Menyediakan fungsi pembersih (`unsubscribe`) agar listener ditutup dengan aman saat komponen unmount atau ditutup, menghindari memory leak.

2. **Admin Panel Integration (`src/components/AdminPanel.tsx`)**:
   - Pasang listener `subscribeOrders` pada `useEffect` utama di `AdminPanel.tsx`.
   - Ketika ada order baru masuk atau status pembayaran berubah di Firestore:
     - State `orders` langsung terbarui secara otomatis.
     - Counter badge pada menu **Data Order & Riwayat** dan tab **Approval Pembayaran** (Menunggu Approval) otomatis bertambah/berkurang tanpa refresh.
     - Tabel di **Data Order**, **Approval Pembayaran**, dan **Dashboard** otomatis menampilkan baris baru seketika.
   - Pasang listener `subscribeProducts`:
     - Ketika stok produk berkurang (baik akibat checkout online maupun transaksi POS), data stok di tabel **Data Produk & Stok** dan **Inventory & Stok** otomatis berubah seketika.
   - Pasang listener `subscribePOSTransactions`:
     - Transaksi POS baru langsung masuk ke laporan dan riwayat kasir.
   - Sesuai permintaan pengguna: Data diperbarui langsung pada tabel dan kartu metrik secara halus tanpa memunculkan popup/suara notifikasi yang mengganggu.

3. **Webstore Storefront Sync (`src/App.tsx`)**:
   - Sinkronisasi listener produk di halaman utama toko agar badge stok pada kartu produk yang dilihat pelanggan juga selalu akurat secara real-time saat stok menipis.

---

## 2. Rencana Eksekusi Langkah demi Langkah

### Langkah 1: Penambahan Real-time Listener di Service
- Memodifikasi `src/services/firestoreService.ts` untuk menambahkan metode `subscribeOrders`, `subscribeProducts`, dan `subscribePOSTransactions`.
- Mengekspos ketiga metode ini di `src/api.ts` agar dapat dipanggil secara konsisten oleh komponen React.

### Langkah 2: Pemasangan Listener di `AdminPanel.tsx`
- Menghubungkan listener real-time ke state `orders`, `products`, `posTransactions`, dan `customers`.
- Memastikan pembersihan listener (`unsub()`) dijalankan dengan benar saat komponen Admin Panel ditutup.
- Mempertahankan tombol refresh manual di header sebagai opsi cadangan (fallback).

### Langkah 3: Verifikasi & Pengujian
- Menjalankan `compile_applet` dan `lint_applet` untuk memastikan tidak ada kesalahan tipe atau regresi kode.
- Menguji skenario simulasi:
  1. Penambahan pesanan baru -> tabel Order & Approval langsung menampilkan pesanan tanpa refresh.
  2. Perubahan status approval -> status langsung terupdate di tabel dan antrean langsung berkurang.
  3. Transaksi kasir POS -> stok produk langsung berkurang seketika di tabel produk dan inventory.
