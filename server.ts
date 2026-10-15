import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './server/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // --- API Routes ---

  // Health / DB Status
  app.get('/api/db/health', (_req: Request, res: Response) => {
    res.json(db.getDatabaseHealth());
  });

  // Raw Database Store JSON
  app.get('/api/db/raw', (_req: Request, res: Response) => {
    res.json(db.getRawData());
  });

  // Auth (Admin Login)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    // Authorized credentials
    if (
      password === 'mochi123' ||
      (email === 'admin@mochisteps.com' && password === 'mochi123') ||
      (email === 'admin' && password === 'admin')
    ) {
      const displayName = email && email.includes('@')
        ? (email.split('@')[0].toUpperCase() + ' · Tim Mochi Steps')
        : 'Administrator Mochi Steps';
      res.json({
        success: true,
        user: {
          name: displayName,
          email: email || 'admin@mochisteps.com',
          role: 'ADMIN',
          token: 'ms_session_' + Date.now()
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Email atau password admin tidak valid' });
    }
  });

  // Products
  app.get('/api/products', (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const query = req.query.q as string | undefined;
    const products = db.getProducts(category, query);
    res.json(products);
  });

  app.get('/api/products/:id', (req: Request, res: Response) => {
    const product = db.getProductById(req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }
    res.json(product);
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const created = db.createProduct(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal menambahkan produk' });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updateProduct(req.params.id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Produk tidak ditemukan' });
        return;
      }
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal mengupdate produk' });
    }
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const deleted = db.deleteProduct(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Produk tidak ditemukan' });
      return;
    }
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  });

  // Orders
  app.get('/api/orders', (_req: Request, res: Response) => {
    const orders = db.getOrders();
    res.json(orders);
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }
    res.json(order);
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const newOrder = db.createOrder(req.body);
      res.status(201).json(newOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Gagal membuat pesanan' });
    }
  });

  app.post('/api/orders/:id/payment-proof', (req: Request, res: Response) => {
    const { proofUrl } = req.body;
    if (!proofUrl) {
      res.status(400).json({ error: 'Bukti pembayaran wajib diunggah' });
      return;
    }
    const updated = db.uploadPaymentProof(req.params.id, proofUrl);
    if (!updated) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }
    res.json(updated);
  });

  app.post('/api/orders/:id/approve-payment', (req: Request, res: Response) => {
    const updated = db.approvePayment(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }
    res.json(updated);
  });

  app.post('/api/orders/:id/reject-payment', (req: Request, res: Response) => {
    const { reason } = req.body;
    const updated = db.rejectPayment(req.params.id, reason || 'Bukti transfer tidak terbaca / nominal tidak sesuai');
    if (!updated) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }
    res.json(updated);
  });

  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    const { status, trackingNumber } = req.body;
    const updated = db.updateOrderStatus(req.params.id, status, trackingNumber);
    if (!updated) {
      res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      return;
    }
    res.json(updated);
  });

  // Customers
  app.get('/api/customers', (_req: Request, res: Response) => {
    const customers = db.getCustomers();
    res.json(customers);
  });

  // Sales Reports
  app.get('/api/reports/sales', (_req: Request, res: Response) => {
    const report = db.getSalesReport();
    res.json(report);
  });

  // --- Vite Dev Server Middleware or Static Production ---
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[mochi steps] Server running at http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
