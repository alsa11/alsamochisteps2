import fs from 'fs';
import path from 'path';
import { Product, Order, Customer, SalesReport } from '../src/types.js';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'mochisteps_db.json');

export interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  customers: Customer[];
  meta: {
    storeName: string;
    tagline: string;
    contactAddress: string;
    contactPhone: string;
    contactEmail: string;
    logoUrl: string;
    lastUpdated: string;
    version: string;
  };
}

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Mochi Ribbon Ballet Flats',
    category: 'ballet-maryjane',
    categoryName: 'Ballet & Mary Jane',
    price: 349000,
    originalPrice: 429000,
    image: '/src/assets/images/flatshoes_ballet_maryjane_1791897850132.jpg',
    description: 'Sepatu ballet flats ikonik mochi steps dengan detail pita manis dan bantalan insole cloud-cushion 8mm yang ultra-empuk. Didesain untuk kenyamanan melangkah seharian tanpa lecet.',
    features: ['Insole Cloud-Cushion 8mm', 'Bahan Vegan Lambskin Halus', 'Outsole Karet Anti-Slip', 'Ujung Sepatu Round-Toe Lembut'],
    colors: [
      { name: 'Cream Ivory', hex: '#F5F2EB' },
      { name: 'Soft Blush', hex: '#E8CFCB' },
      { name: 'Onyx Black', hex: '#1F1F1F' }
    ],
    sizes: [
      { size: 36, stock: 6 },
      { size: 37, stock: 10 },
      { size: 38, stock: 14 },
      { size: 39, stock: 9 },
      { size: 40, stock: 7 },
      { size: 41, stock: 4 }
    ],
    totalStock: 50,
    rating: 4.9,
    reviewCount: 148,
    isFeatured: true,
    createdAt: '2026-03-01T08:00:00.000Z'
  },
  {
    id: 'prod-2',
    name: 'Aurelia Quilted Ballerina',
    category: 'ballet-maryjane',
    categoryName: 'Ballet & Mary Jane',
    price: 389000,
    originalPrice: 499000,
    image: '/src/assets/images/flatshoes_quilted_leather_1791897886963.jpg',
    description: 'Ballerina flats motif quilted mewah bertekstur kulit domba ultra-lembut, dilengkapi pelindung tumit busa ganda untuk mobilitas kerja dan pesta tanpa pegal.',
    features: ['Motif Diamond Quilted Elegan', 'Double-Layer Heel Foam', 'Sol Fleksibel 180 Derajat', 'Gold Tip Aglet pada Pita'],
    colors: [
      { name: 'Dusty Rose', hex: '#DCB4B4' },
      { name: 'Pearl Beige', hex: '#EDE6DD' },
      { name: 'Noir Black', hex: '#1A1A1A' }
    ],
    sizes: [
      { size: 36, stock: 5 },
      { size: 37, stock: 8 },
      { size: 38, stock: 12 },
      { size: 39, stock: 8 },
      { size: 40, stock: 5 },
      { size: 41, stock: 3 }
    ],
    totalStock: 41,
    rating: 4.9,
    reviewCount: 92,
    isFeatured: true,
    createdAt: '2026-03-05T09:00:00.000Z'
  },
  {
    id: 'prod-3',
    name: 'Crimson Velvet Mary Jane',
    category: 'ballet-maryjane',
    categoryName: 'Ballet & Mary Jane',
    price: 379000,
    originalPrice: 459000,
    image: '/src/assets/images/flatshoes_red_maryjane_1791897885164.jpg',
    description: 'Mary Jane klasik dengan sentuhan bahan beludru premium warna burgundy, strap buckle emas adjustable, dan sol anti-slip elastis.',
    features: ['Bahan Royal Velvet Lembut', 'Gold Adjustable Buckle', 'Busa Memori Anatomi', 'Ringan Hanya 190 Gram'],
    colors: [
      { name: 'Burgundy Red', hex: '#6E1A24' },
      { name: 'Midnight Black', hex: '#18181A' },
      { name: 'Champagne Gold', hex: '#D6C3A5' }
    ],
    sizes: [
      { size: 36, stock: 4 },
      { size: 37, stock: 7 },
      { size: 38, stock: 10 },
      { size: 39, stock: 6 },
      { size: 40, stock: 4 },
      { size: 41, stock: 2 }
    ],
    totalStock: 33,
    rating: 4.8,
    reviewCount: 76,
    isFeatured: false,
    createdAt: '2026-03-10T10:00:00.000Z'
  },
  {
    id: 'prod-4',
    name: 'Parisienne Two-Tone Cap-Toe',
    category: 'ballet-maryjane',
    categoryName: 'Ballet & Mary Jane',
    price: 399000,
    originalPrice: 519000,
    image: '/src/assets/images/flatshoes_black_captoe_1791897884831.jpg',
    description: 'Gaya Parisian chic abadi dengan perpaduan nude beige dan glossy black cap toe yang ikonik. Sangat pas untuk gaya profesional kantor hingga santai di kafe.',
    features: ['Patent Leather Cap Toe', 'Insole Arch Support', 'Anti-Slip Ribbed Rubber Sole', 'Lining Kulit Vegan Breathable'],
    colors: [
      { name: 'Nude Two-Tone', hex: '#DFC3A7' },
      { name: 'Monokrom Beige', hex: '#ECE5DB' }
    ],
    sizes: [
      { size: 36, stock: 8 },
      { size: 37, stock: 14 },
      { size: 38, stock: 16 },
      { size: 39, stock: 11 },
      { size: 40, stock: 7 },
      { size: 41, stock: 5 }
    ],
    totalStock: 61,
    rating: 5.0,
    reviewCount: 215,
    isFeatured: true,
    createdAt: '2026-03-12T11:00:00.000Z'
  },
  {
    id: 'prod-5',
    name: 'Grace Horsebit Pointed Mules',
    category: 'pointed-mules',
    categoryName: 'Pointed Mules & Loafers',
    price: 369000,
    originalPrice: 479000,
    image: '/src/assets/images/flatshoes_pointed_mules_1791897851105.jpg',
    description: 'Pointed backless mule dengan siluet runcing elegan dan ornamen horsebit emas berkelas. Praktis langsung pakai tanpa repot membungkuk.',
    features: ['Aksen Horsebit Gold Electroplated', 'Pointed Toe Siluet Jenjang', 'Backless Slip-On Praktis', 'Low 1cm Block Heel'],
    colors: [
      { name: 'Tan Caramel', hex: '#B06D3B' },
      { name: 'Oat White', hex: '#F0EBE1' },
      { name: 'Espresso Dark', hex: '#2C1E18' }
    ],
    sizes: [
      { size: 36, stock: 6 },
      { size: 37, stock: 9 },
      { size: 38, stock: 12 },
      { size: 39, stock: 8 },
      { size: 40, stock: 5 },
      { size: 41, stock: 3 }
    ],
    totalStock: 43,
    rating: 4.9,
    reviewCount: 162,
    isFeatured: true,
    createdAt: '2026-03-15T09:30:00.000Z'
  },
  {
    id: 'prod-6',
    name: 'Almond Cream Soft Loafers',
    category: 'pointed-mules',
    categoryName: 'Pointed Mules & Loafers',
    price: 359000,
    originalPrice: 439000,
    image: '/src/assets/images/flatshoes_beige_loafers_1791897885803.jpg',
    description: 'Loafer minimalis flatshoes tanpa hak dengan jahitan handmade kokoh dan lining lembut yang adem. Cocok untuk meeting dan daily commuting.',
    features: ['Almond Toe Ergonomis', 'Lining Microfiber Lembut', 'Sol Karet Fleksibel', 'Busa Tumit Peredam Getaran'],
    colors: [
      { name: 'Cream Milk', hex: '#EFEADE' },
      { name: 'Toffee Tan', hex: '#9E7250' },
      { name: 'Charcoal Grey', hex: '#2A2A2A' }
    ],
    sizes: [
      { size: 36, stock: 7 },
      { size: 37, stock: 11 },
      { size: 38, stock: 14 },
      { size: 39, stock: 10 },
      { size: 40, stock: 6 },
      { size: 41, stock: 4 }
    ],
    totalStock: 52,
    rating: 4.8,
    reviewCount: 118,
    isFeatured: false,
    createdAt: '2026-03-18T10:15:00.000Z'
  },
  {
    id: 'prod-7',
    name: 'Sleek V-Cut Pointed Flat',
    category: 'pointed-mules',
    categoryName: 'Pointed Mules & Loafers',
    price: 345000,
    originalPrice: 429000,
    image: '/src/assets/images/flatshoes_pointed_mules_1791897851105.jpg',
    description: 'Potongan V-cut vamp yang menawan menciptakan ilusi tungkai kaki lebih jenjang dan anggun. Kulit sintetis buttery-soft tidak menekan jari kaki.',
    features: ['V-Cut Vamp Modern', 'Bantal Tumit Anti-Blister', 'Sol Ultra-Lightweight', 'Bahan Lentur Mengikuti Kaki'],
    colors: [
      { name: 'Camel Honey', hex: '#C88E57' },
      { name: 'Pure White', hex: '#F7F6F2' },
      { name: 'Jet Black', hex: '#141414' }
    ],
    sizes: [
      { size: 36, stock: 5 },
      { size: 37, stock: 8 },
      { size: 38, stock: 10 },
      { size: 39, stock: 7 },
      { size: 40, stock: 4 },
      { size: 41, stock: 2 }
    ],
    totalStock: 36,
    rating: 4.7,
    reviewCount: 84,
    isFeatured: false,
    createdAt: '2026-03-20T14:00:00.000Z'
  },
  {
    id: 'prod-8',
    name: 'Seraphina Backless Chain Loafer',
    category: 'pointed-mules',
    categoryName: 'Pointed Mules & Loafers',
    price: 395000,
    originalPrice: 499000,
    image: '/src/assets/images/hero_flatshoes_lifestyle_1791897849729.jpg',
    description: 'Loafer mule semi-formal dengan sentuhan rantai metalik gold minimalis, bagian tumit terbuka memberikan ventilasi maksimal sepanjang hari.',
    features: ['Aksen Rantai Emas Halus', 'Open Back Slip On', 'Padded Arch Insole', 'Finishing Kulit Halus'],
    colors: [
      { name: 'Classic Nude', hex: '#D2BBA0' },
      { name: 'Vintage Ivory', hex: '#EAE5DC' },
      { name: 'Noir Gold', hex: '#1B1A1A' }
    ],
    sizes: [
      { size: 36, stock: 4 },
      { size: 37, stock: 6 },
      { size: 38, stock: 9 },
      { size: 39, stock: 7 },
      { size: 40, stock: 3 },
      { size: 41, stock: 2 }
    ],
    totalStock: 31,
    rating: 4.8,
    reviewCount: 95,
    isFeatured: false,
    createdAt: '2026-03-22T08:30:00.000Z'
  },
  {
    id: 'prod-9',
    name: 'CloudWalk Flexible Sage Slip-On',
    category: 'casual-slipons',
    categoryName: 'Casual Soft Leather Slip-Ons',
    price: 329000,
    originalPrice: 419000,
    image: '/src/assets/images/flatshoes_casual_slipons_1791897850899.jpg',
    description: 'Flatshoes paling fleksibel yang dapat ditekuk tanpa patah atau meninggalkan kerutan. Menggunakan sol karet alami crepe yang empuk dan lentur sempurna.',
    features: ['Bisa Ditekuk 360 Derajat', 'Sol Karet Crepe Alami', 'Ringan Seperti Tidak Memakai Sepatu', 'Elastis & Nyaman'],
    colors: [
      { name: 'Sage Green', hex: '#98A58D' },
      { name: 'Warm Almond', hex: '#DFD2C2' },
      { name: 'Terracotta', hex: '#BF7663' }
    ],
    sizes: [
      { size: 36, stock: 10 },
      { size: 37, stock: 15 },
      { size: 38, stock: 18 },
      { size: 39, stock: 12 },
      { size: 40, stock: 8 },
      { size: 41, stock: 5 }
    ],
    totalStock: 68,
    rating: 4.9,
    reviewCount: 198,
    isFeatured: true,
    createdAt: '2026-03-24T13:20:00.000Z'
  },
  {
    id: 'prod-10',
    name: 'Everyday Arch-Support Soft Flats',
    category: 'casual-slipons',
    categoryName: 'Casual Soft Leather Slip-Ons',
    price: 339000,
    originalPrice: 429000,
    image: '/src/assets/images/flatshoes_ballet_maryjane_1791897850132.jpg',
    description: 'Khusus dirancang bagi yang sering berdiri atau berjalan seharian. Penopang lengkungan kaki ortopedik ringan menjaga postur tetap nyaman tanpa rasa pegal.',
    features: ['Anatomical Arch Support Insole', 'Kulit Lentur Bernapas', 'Bantalan Tumit Tebal', 'Anti-Bau Antibakteri'],
    colors: [
      { name: 'Muted Taupe', hex: '#A69483' },
      { name: 'Soft Rose', hex: '#DDBBB2' },
      { name: 'Creamy Beige', hex: '#EBE3D5' }
    ],
    sizes: [
      { size: 36, stock: 7 },
      { size: 37, stock: 12 },
      { size: 38, stock: 15 },
      { size: 39, stock: 9 },
      { size: 40, stock: 6 },
      { size: 41, stock: 4 }
    ],
    totalStock: 53,
    rating: 4.9,
    reviewCount: 142,
    isFeatured: false,
    createdAt: '2026-03-26T15:00:00.000Z'
  },
  {
    id: 'prod-11',
    name: 'Minimalist Round-Toe Comfort Flat',
    category: 'casual-slipons',
    categoryName: 'Casual Soft Leather Slip-Ons',
    price: 319000,
    originalPrice: 399000,
    image: '/src/assets/images/flatshoes_beige_loafers_1791897885803.jpg',
    description: 'Sepatu slip-on santai dengan ruang jari lebar yang tidak sempit atau membuat kaki terjepit. Bobot ekstra ringan ideal untuk bepergian dan santai.',
    features: ['Ruang Jari Wide-Toe Box', 'Bobot Ringan 180 Gram', 'Sol Cengkeram Anti-Slip', 'Mudah Dibersihkan'],
    colors: [
      { name: 'Light Sand', hex: '#E8DFD5' },
      { name: 'Coffee Latte', hex: '#876953' },
      { name: 'Olive Dusk', hex: '#636B59' }
    ],
    sizes: [
      { size: 36, stock: 8 },
      { size: 37, stock: 11 },
      { size: 38, stock: 14 },
      { size: 39, stock: 10 },
      { size: 40, stock: 6 },
      { size: 41, stock: 3 }
    ],
    totalStock: 52,
    rating: 4.8,
    reviewCount: 110,
    isFeatured: false,
    createdAt: '2026-03-28T09:40:00.000Z'
  },
  {
    id: 'prod-12',
    name: 'Cozy Elastic Collar Cloud Slip-On',
    category: 'casual-slipons',
    categoryName: 'Casual Soft Leather Slip-Ons',
    price: 335000,
    originalPrice: 425000,
    image: '/src/assets/images/flatshoes_casual_slipons_1791897850899.jpg',
    description: 'Didesain dengan kerah elastis yang memeluk tumit dengan lembut tanpa meninggalkan bekas merah atau lecet. Menempel mantap saat melangkah cepat.',
    features: ['Kerah Tumit Elastis Lembut', 'Insole Memory Foam', 'Outsole Karet Beralur Kuat', 'Tekstur Kulit Halus'],
    colors: [
      { name: 'Pastel Mint', hex: '#BAC7BC' },
      { name: 'Butter Cream', hex: '#F3EDDD' },
      { name: 'Deep Espresso', hex: '#261E1A' }
    ],
    sizes: [
      { size: 36, stock: 6 },
      { size: 37, stock: 10 },
      { size: 38, stock: 13 },
      { size: 39, stock: 8 },
      { size: 40, stock: 5 },
      { size: 41, stock: 3 }
    ],
    totalStock: 45,
    rating: 4.8,
    reviewCount: 88,
    isFeatured: false,
    createdAt: '2026-03-30T16:00:00.000Z'
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Sinta Larasati',
    phone: '081234567890',
    email: 'sinta.larasati@gmail.com',
    streetAddress: 'Jl. Slamet Riyadi No. 45, RT 02 / RW 04',
    subdistrict: 'Banjarsari',
    city: 'Surakarta (Solo)',
    postalCode: '57139',
    address: 'Jl. Slamet Riyadi No. 45, RT 02 / RW 04, Banjarsari, Surakarta (Solo), 57139',
    totalOrders: 3,
    totalSpent: 1107000,
    lastOrderDate: '2026-10-12T10:15:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z'
  },
  {
    id: 'cust-2',
    name: 'Dinda Maharani',
    phone: '081399887766',
    email: 'dinda.m@yahoo.com',
    streetAddress: 'Jl. Malioboro No. 12, Kel. Sosrowijayan',
    subdistrict: 'Gedongtengen',
    city: 'Yogyakarta',
    postalCode: '55271',
    address: 'Jl. Malioboro No. 12, Kel. Sosrowijayan, Gedongtengen, Yogyakarta, 55271',
    totalOrders: 2,
    totalSpent: 738000,
    lastOrderDate: '2026-10-11T14:20:00.000Z',
    createdAt: '2026-02-10T00:00:00.000Z'
  },
  {
    id: 'cust-3',
    name: 'Nadia Putri Utami',
    phone: '081987654321',
    email: 'nadiaputri@gmail.com',
    streetAddress: 'Apartemen Sudirman Tower Lt. 14 Unit B',
    subdistrict: 'Setiabudi',
    city: 'Jakarta Selatan',
    postalCode: '12910',
    address: 'Apartemen Sudirman Tower Lt. 14 Unit B, Setiabudi, Jakarta Selatan, 12910',
    totalOrders: 2,
    totalSpent: 768000,
    lastOrderDate: '2026-10-13T04:30:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 'cust-4',
    name: 'Anisa Rahmawati',
    phone: '085712349876',
    email: 'anisa.rahma@gmail.com',
    streetAddress: 'Jl. Pemuda No. 101, Kompleks Pandanaran',
    subdistrict: 'Semarang Tengah',
    city: 'Kota Semarang',
    postalCode: '50132',
    address: 'Jl. Pemuda No. 101, Kompleks Pandanaran, Semarang Tengah, Kota Semarang, 50132',
    totalOrders: 1,
    totalSpent: 344000,
    lastOrderDate: '2026-10-13T06:10:00.000Z',
    createdAt: '2026-03-20T00:00:00.000Z'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    invoiceNumber: 'MS-20261011-001',
    customerName: 'Dinda Maharani',
    customerPhone: '081399887766',
    customerEmail: 'dinda.m@yahoo.com',
    streetAddress: 'Jl. Malioboro No. 12',
    subdistrict: 'Gedongtengen',
    city: 'Yogyakarta',
    postalCode: '55271',
    shippingAddress: 'Jl. Malioboro No. 12, Gedongtengen, Yogyakarta, 55271',
    courier: 'JNE Reguler',
    courierCost: 18000,
    items: [
      {
        cartItemId: 'item-1',
        productId: 'prod-5',
        name: 'Grace Horsebit Pointed Mules',
        price: 369000,
        image: '/src/assets/images/flatshoes_pointed_mules_1791897851105.jpg',
        selectedColor: 'Tan Caramel',
        selectedSize: 38,
        quantity: 1,
        maxStock: 12
      }
    ],
    subtotal: 369000,
    discount: 0,
    grandTotal: 387000,
    paymentMethod: 'BCA',
    paymentStatus: 'DISETUJUI',
    orderStatus: 'SELESAI',
    paymentProofUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="560" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">BUKTI TRANSFER BCA</text><text x="40" y="110" font-family="sans-serif" font-size="14" fill="%2364748b">Tanggal: 11 Okt 2026 14:25 WIB</text><line x1="40" y1="130" x2="360" y2="130" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="170" font-family="sans-serif" font-size="14" fill="%2364748b">Rekening Penerima:</text><text x="40" y="195" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">8831092817 a/n Mochi Steps</text><text x="40" y="240" font-family="sans-serif" font-size="14" fill="%2364748b">Jumlah Transfer:</text><text x="40" y="275" font-family="sans-serif" font-size="24" font-weight="bold" fill="%2316a34a">Rp 387.000</text><rect x="40" y="310" width="160" height="34" rx="8" fill="%23dcfce7"/><text x="56" y="332" font-family="sans-serif" font-size="13" font-weight="bold" fill="%2315803d">BERHASIL / SUKSES</text><text x="40" y="380" font-family="sans-serif" font-size="13" fill="%2364748b">Berita: MS-20261011-001 Dinda</text><text x="40" y="420" font-family="sans-serif" font-size="12" fill="%2394a3b8">No. Ref: TRF-BCA-98127391</text></svg>',
    paymentProofUploadedAt: '2026-10-11T14:25:00.000Z',
    paymentApprovedAt: '2026-10-11T14:40:00.000Z',
    trackingNumber: 'JNE98172918820',
    notes: 'Packing bubble wrap dobel ya',
    createdAt: '2026-10-11T14:20:00.000Z'
  },
  {
    id: 'ord-1002',
    invoiceNumber: 'MS-20261012-002',
    customerName: 'Sinta Larasati',
    customerPhone: '081234567890',
    customerEmail: 'sinta.larasati@gmail.com',
    streetAddress: 'Jl. Slamet Riyadi No. 45',
    subdistrict: 'Banjarsari',
    city: 'Surakarta (Solo)',
    postalCode: '57139',
    shippingAddress: 'Jl. Slamet Riyadi No. 45, Banjarsari, Surakarta (Solo), 57139',
    courier: 'SiCepat Best',
    courierCost: 20000,
    items: [
      {
        cartItemId: 'item-2',
        productId: 'prod-1',
        name: 'Mochi Ribbon Ballet Flats',
        price: 349000,
        image: '/src/assets/images/flatshoes_ballet_maryjane_1791897850132.jpg',
        selectedColor: 'Cream Ivory',
        selectedSize: 37,
        quantity: 1,
        maxStock: 10
      },
      {
        cartItemId: 'item-3',
        productId: 'prod-4',
        name: 'Parisienne Two-Tone Cap-Toe',
        price: 399000,
        image: '/src/assets/images/flatshoes_black_captoe_1791897884831.jpg',
        selectedColor: 'Nude Two-Tone',
        selectedSize: 37,
        quantity: 1,
        maxStock: 14
      }
    ],
    subtotal: 748000,
    discount: 20000,
    grandTotal: 748000,
    paymentMethod: 'QRIS',
    paymentStatus: 'DISETUJUI',
    orderStatus: 'DIKIRIM',
    paymentProofUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="560" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">BUKTI QRIS PEMBAYARAN</text><text x="40" y="110" font-family="sans-serif" font-size="14" fill="%2364748b">Merchant: MOCHI STEPS SOLO</text><line x1="40" y1="130" x2="360" y2="130" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="170" font-family="sans-serif" font-size="14" fill="%2364748b">Waktu: 12 Okt 2026 10:20 WIB</text><text x="40" y="210" font-family="sans-serif" font-size="14" fill="%2364748b">Total Dibayar:</text><text x="40" y="250" font-family="sans-serif" font-size="26" font-weight="bold" fill="%2316a34a">Rp 748.000</text><rect x="40" y="280" width="170" height="34" rx="8" fill="%23dcfce7"/><text x="56" y="302" font-family="sans-serif" font-size="13" font-weight="bold" fill="%2315803d">TRANSAKSI SUKSES</text><text x="40" y="350" font-family="sans-serif" font-size="13" fill="%2364748b">Issuer: GoPay / ShopeePay</text><text x="40" y="380" font-family="sans-serif" font-size="12" fill="%2394a3b8">NMID: ID1029482910481</text></svg>',
    paymentProofUploadedAt: '2026-10-12T10:20:00.000Z',
    paymentApprovedAt: '2026-10-12T10:35:00.000Z',
    trackingNumber: 'SCP90281902831',
    notes: 'Kirim pagi ya kak',
    createdAt: '2026-10-12T10:15:00.000Z'
  },
  {
    id: 'ord-1003',
    invoiceNumber: 'MS-20261013-003',
    customerName: 'Nadia Putri Utami',
    customerPhone: '081987654321',
    customerEmail: 'nadiaputri@gmail.com',
    streetAddress: 'Apartemen Sudirman Tower Lt. 14 Unit B',
    subdistrict: 'Setiabudi',
    city: 'Jakarta Selatan',
    postalCode: '12910',
    shippingAddress: 'Apartemen Sudirman Tower Lt. 14 Unit B, Setiabudi, Jakarta Selatan, 12910',
    courier: 'JNE Reguler',
    courierCost: 19000,
    items: [
      {
        cartItemId: 'item-4',
        productId: 'prod-2',
        name: 'Aurelia Quilted Ballerina',
        price: 389000,
        image: '/src/assets/images/flatshoes_quilted_leather_1791897886963.jpg',
        selectedColor: 'Dusty Rose',
        selectedSize: 38,
        quantity: 1,
        maxStock: 12
      },
      {
        cartItemId: 'item-5',
        productId: 'prod-3',
        name: 'Crimson Velvet Mary Jane',
        price: 379000,
        image: '/src/assets/images/flatshoes_red_maryjane_1791897885164.jpg',
        selectedColor: 'Burgundy Red',
        selectedSize: 38,
        quantity: 1,
        maxStock: 10
      }
    ],
    subtotal: 768000,
    discount: 0,
    grandTotal: 787000,
    paymentMethod: 'BCA',
    paymentStatus: 'MENUNGGU_VERIFIKASI',
    orderStatus: 'MENUNGGU_PEMBAYARAN',
    paymentProofUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="560" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">M-BANKING BCA RECEIPT</text><text x="40" y="110" font-family="sans-serif" font-size="14" fill="%2364748b">13 Okt 2026 - 04:35:12 WIB</text><line x1="40" y1="130" x2="360" y2="130" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="170" font-family="sans-serif" font-size="14" fill="%2364748b">Transfer ke Rekening Toko:</text><text x="40" y="195" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">BCA 8831092817 Mochi Steps</text><text x="40" y="240" font-family="sans-serif" font-size="14" fill="%2364748b">Jumlah Transfer:</text><text x="40" y="275" font-family="sans-serif" font-size="26" font-weight="bold" fill="%232563eb">Rp 787.000</text><rect x="40" y="310" width="180" height="34" rx="8" fill="%23eff6ff"/><text x="56" y="332" font-family="sans-serif" font-size="13" font-weight="bold" fill="%231d4ed8">MENUNGGU VERIFIKASI</text><text x="40" y="380" font-family="sans-serif" font-size="13" fill="%2364748b">Dari Rekening: 521098231 a/n Nadia Putri</text><text x="40" y="420" font-family="sans-serif" font-size="12" fill="%2394a3b8">Ref: 20261013000492</text></svg>',
    paymentProofUploadedAt: '2026-10-13T04:35:00.000Z',
    notes: 'Mohon dicek ya kak bukti bayarnya',
    createdAt: '2026-10-13T04:30:00.000Z'
  },
  {
    id: 'ord-1004',
    invoiceNumber: 'MS-20261013-004',
    customerName: 'Anisa Rahmawati',
    customerPhone: '085712349876',
    customerEmail: 'anisa.rahma@gmail.com',
    streetAddress: 'Jl. Pemuda No. 101, Kompleks Pandanaran',
    subdistrict: 'Semarang Tengah',
    city: 'Kota Semarang',
    postalCode: '50132',
    shippingAddress: 'Jl. Pemuda No. 101, Semarang Tengah, Kota Semarang, 50132',
    courier: 'JNE Reguler',
    courierCost: 15000,
    items: [
      {
        cartItemId: 'item-6',
        productId: 'prod-9',
        name: 'CloudWalk Flexible Sage Slip-On',
        price: 329000,
        image: '/src/assets/images/flatshoes_casual_slipons_1791897850899.jpg',
        selectedColor: 'Sage Green',
        selectedSize: 38,
        quantity: 1,
        maxStock: 18
      }
    ],
    subtotal: 329000,
    discount: 0,
    grandTotal: 344000,
    paymentMethod: 'MANDIRI',
    paymentStatus: 'MENUNGGU_VERIFIKASI',
    orderStatus: 'MENUNGGU_PEMBAYARAN',
    paymentProofUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="%23f8fafc"/><rect x="20" y="20" width="360" height="560" rx="16" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/><text x="40" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">LIVIN BY MANDIRI</text><text x="40" y="110" font-family="sans-serif" font-size="14" fill="%2364748b">13 Okt 2026 - 06:15 WIB</text><line x1="40" y1="130" x2="360" y2="130" stroke="%23e2e8f0" stroke-width="1.5"/><text x="40" y="170" font-family="sans-serif" font-size="14" fill="%2364748b">Tujuan Transfer:</text><text x="40" y="195" font-family="sans-serif" font-size="16" font-weight="bold" fill="%230f172a">Mandiri 138001928371 a/n Mochi Steps</text><text x="40" y="240" font-family="sans-serif" font-size="14" fill="%2364748b">Nominal:</text><text x="40" y="275" font-family="sans-serif" font-size="26" font-weight="bold" fill="%232563eb">Rp 344.000</text><rect x="40" y="310" width="180" height="34" rx="8" fill="%23eff6ff"/><text x="56" y="332" font-family="sans-serif" font-size="13" font-weight="bold" fill="%231d4ed8">MENUNGGU VERIFIKASI</text><text x="40" y="380" font-family="sans-serif" font-size="13" fill="%2364748b">Pengirim: Anisa Rahmawati</text></svg>',
    paymentProofUploadedAt: '2026-10-13T06:15:00.000Z',
    notes: 'Ukuran 38 jangan salah ya',
    createdAt: '2026-10-13T06:10:00.000Z'
  }
];

class DatabaseManager {
  private data: DatabaseSchema;
  private isSaving = false;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products) && parsed.products.length >= 12) {
          // ensure logoUrl is updated to the user's logo
          parsed.meta.logoUrl = '/src/assets/images/mochisteps_brand_logo_1791899999020.jpg';
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading database file, re-initializing fresh database:', e);
    }

    const initialDb: DatabaseSchema = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      customers: INITIAL_CUSTOMERS,
      meta: {
        storeName: 'mochi steps',
        tagline: 'Step into your style',
        contactAddress: 'Jl. solo',
        contactPhone: '+62 81934424901',
        contactEmail: 'admin@mochisteps.com',
        logoUrl: '/src/assets/images/mochisteps_brand_logo_1791899999020.jpg',
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    this.saveToFile(initialDb);
    return initialDb;
  }

  private saveToFile(dbData: DatabaseSchema) {
    if (this.isSaving) return;
    this.isSaving = true;
    try {
      this.ensureDirectory();
      dbData.meta.lastUpdated = new Date().toISOString();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(dbData, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    } finally {
      this.isSaving = false;
    }
  }

  public getProducts(category?: string, query?: string): Product[] {
    let list = this.data.products;
    if (category && category !== 'all') {
      list = list.filter((p) => p.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id);
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const current = this.data.products[idx];
    const updated: Product = { ...current, ...updates };
    
    if (updates.sizes) {
      updated.totalStock = updates.sizes.reduce((sum, s) => sum + s.stock, 0);
    }

    this.data.products[idx] = updated;
    this.saveToFile(this.data);
    return updated;
  }

  public createProduct(productData: Omit<Product, 'id' | 'createdAt'>): Product {
    const id = `prod-${Date.now()}`;
    const totalStock = productData.sizes.reduce((sum, s) => sum + s.stock, 0);
    const newProduct: Product = {
      ...productData,
      id,
      totalStock,
      createdAt: new Date().toISOString()
    };
    this.data.products.unshift(newProduct);
    this.saveToFile(this.data);
    return newProduct;
  }

  public deleteProduct(id: string): boolean {
    const prod = this.data.products.find((p) => p.id === id);
    if (prod) {
      prod.isActive = false;
      this.saveToFile(this.data);
      return true;
    }
    return false;
  }

  public getOrders(): Order[] {
    return [...this.data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id || o.invoiceNumber === id);
  }

  public createOrder(orderPayload: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>): Order {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `MS-${dateStr}-${randSuffix}`;
    const id = `ord-${Date.now()}`;

    // Atomically decrement stock
    orderPayload.items.forEach((item) => {
      const prod = this.data.products.find((p) => p.id === item.productId);
      if (prod) {
        const sizeObj = prod.sizes.find((s) => s.size === item.selectedSize);
        if (sizeObj) {
          sizeObj.stock = Math.max(0, sizeObj.stock - item.quantity);
        }
        prod.totalStock = prod.sizes.reduce((acc, s) => acc + s.stock, 0);
      }
    });

    const newOrder: Order = {
      ...orderPayload,
      id,
      invoiceNumber,
      createdAt: new Date().toISOString()
    };

    this.data.orders.unshift(newOrder);

    // Update customer records or create customer
    let cust = this.data.customers.find((c) => c.phone === newOrder.customerPhone);
    if (cust) {
      cust.totalOrders += 1;
      cust.totalSpent += newOrder.grandTotal;
      cust.lastOrderDate = newOrder.createdAt;
      cust.streetAddress = newOrder.streetAddress || cust.streetAddress;
      cust.subdistrict = newOrder.subdistrict || cust.subdistrict;
      cust.city = newOrder.city || cust.city;
      cust.postalCode = newOrder.postalCode || cust.postalCode;
      cust.address = newOrder.shippingAddress;
      cust.name = newOrder.customerName;
    } else {
      cust = {
        id: `cust-${Date.now()}`,
        name: newOrder.customerName,
        phone: newOrder.customerPhone,
        email: newOrder.customerEmail,
        streetAddress: newOrder.streetAddress || '',
        subdistrict: newOrder.subdistrict || '',
        city: newOrder.city || '',
        postalCode: newOrder.postalCode || '',
        address: newOrder.shippingAddress,
        totalOrders: 1,
        totalSpent: newOrder.grandTotal,
        lastOrderDate: newOrder.createdAt,
        createdAt: newOrder.createdAt
      };
      this.data.customers.push(cust);
    }

    this.saveToFile(this.data);
    return newOrder;
  }

  public uploadPaymentProof(orderId: string, proofUrl: string): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId || o.invoiceNumber === orderId);
    if (!order) return null;

    order.paymentProofUrl = proofUrl;
    order.paymentProofUploadedAt = new Date().toISOString();
    order.paymentStatus = 'MENUNGGU_VERIFIKASI';
    this.saveToFile(this.data);
    return order;
  }

  public approvePayment(orderId: string): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId || o.invoiceNumber === orderId);
    if (!order) return null;

    order.paymentStatus = 'DISETUJUI';
    order.orderStatus = 'DIPROSES';
    order.paymentApprovedAt = new Date().toISOString();
    this.saveToFile(this.data);
    return order;
  }

  public rejectPayment(orderId: string, reason: string): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId || o.invoiceNumber === orderId);
    if (!order) return null;

    order.paymentStatus = 'DITOLAK';
    order.paymentRejectionReason = reason;
    this.saveToFile(this.data);
    return order;
  }

  public updateOrderStatus(orderId: string, status: Order['orderStatus'], trackingNumber?: string): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId || o.invoiceNumber === orderId);
    if (!order) return null;

    order.orderStatus = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    this.saveToFile(this.data);
    return order;
  }

  public getCustomers(): Customer[] {
    return [...this.data.customers].sort(
      (a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );
  }

  public getSalesReport(): SalesReport {
    const orders = this.data.orders;
    const completedOrApproved = orders.filter(
      (o) => o.paymentStatus === 'DISETUJUI' || o.orderStatus === 'SELESAI' || o.orderStatus === 'DIKIRIM' || o.orderStatus === 'DIPROSES'
    );

    const totalRevenue = completedOrApproved.reduce((sum, o) => sum + o.grandTotal, 0);
    const totalOrders = orders.length;
    const completedOrders = completedOrApproved.length;
    const cancelledOrders = orders.filter((o) => o.orderStatus === 'DIBATALKAN').length;
    const pendingPaymentOrders = orders.filter((o) => o.paymentStatus === 'MENUNGGU_PEMBAYARAN').length;
    const pendingVerificationOrders = orders.filter((o) => o.paymentStatus === 'MENUNGGU_VERIFIKASI').length;
    const averageOrderValue = completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0;

    let totalCOGS = 0;
    let totalUnitsSold = 0;

    const productSalesMap = new Map<string, { name: string; image: string; unitsSold: number; revenue: number; grossProfit: number }>();
    completedOrApproved.forEach((order) => {
      order.items.forEach((item) => {
        const itemCost = item.costPrice || Math.round(item.price * 0.55);
        const itemRev = item.price * item.quantity;
        const itemProfit = Math.max(0, itemRev - (itemCost * item.quantity));
        totalCOGS += itemCost * item.quantity;
        totalUnitsSold += item.quantity;

        const existing = productSalesMap.get(item.productId) || {
          name: item.name,
          image: item.image,
          unitsSold: 0,
          revenue: 0,
          grossProfit: 0
        };
        existing.unitsSold += item.quantity;
        existing.revenue += itemRev;
        existing.grossProfit += itemProfit;
        productSalesMap.set(item.productId, existing);
      });
    });

    const topProducts = Array.from(productSalesMap.entries())
      .map(([productId, data]) => ({
        productId,
        ...data
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);

    const grossProfit = Math.max(0, totalRevenue - totalCOGS);
    const grossMarginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

    const dailyMap = new Map<string, { revenue: number; ordersCount: number; grossProfit: number }>();
    completedOrApproved.forEach((order) => {
      const day = order.createdAt.slice(0, 10);
      const curr = dailyMap.get(day) || { revenue: 0, ordersCount: 0, grossProfit: 0 };
      curr.revenue += order.grandTotal;
      curr.ordersCount += 1;
      curr.grossProfit += Math.round(order.grandTotal * 0.45);
      dailyMap.set(day, curr);
    });

    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const catMap = new Map<string, { unitsSold: number; revenue: number; grossProfit: number }>();
    completedOrApproved.forEach((order) => {
      order.items.forEach((item) => {
        const prod = this.data.products.find((p) => p.id === item.productId);
        const catName = prod?.categoryName || 'Lainnya';
        const curr = catMap.get(catName) || { unitsSold: 0, revenue: 0, grossProfit: 0 };
        curr.unitsSold += item.quantity;
        curr.revenue += item.price * item.quantity;
        curr.grossProfit += Math.round(item.price * item.quantity * 0.45);
        catMap.set(catName, curr);
      });
    });

    const categoryBreakdown = Array.from(catMap.entries()).map(([categoryName, data]) => ({
      categoryName,
      ...data
    }));

    return {
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossMarginPercent,
      totalOrders,
      totalPOS: 0,
      totalOnline: totalOrders,
      onlineRevenue: totalRevenue,
      posRevenue: 0,
      totalUnitsSold,
      completedOrders,
      cancelledOrders,
      pendingPaymentOrders,
      pendingVerificationOrders,
      averageOrderValue,
      topProducts,
      dailyRevenue,
      categoryBreakdown
    };
  }

  public getDatabaseHealth() {
    return {
      status: 'healthy',
      engine: 'Persistent Single-Source-Of-Truth JSON DB Engine',
      filePath: DB_FILE,
      fileName: 'mochisteps_db.json',
      directory: DB_DIR,
      productsCount: this.data.products.length,
      ordersCount: this.data.orders.length,
      customersCount: this.data.customers.length,
      lastUpdated: this.data.meta.lastUpdated,
      store: this.data.meta,
      summary: {
        totalProducts: this.data.products.length,
        totalOrders: this.data.orders.length,
        totalCustomers: this.data.customers.length,
        totalStock: this.data.products.reduce((acc, p) => acc + p.totalStock, 0),
        categories: ['ballet-maryjane', 'pointed-mules', 'casual-slipons']
      }
    };
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }
}

export const db = new DatabaseManager();
