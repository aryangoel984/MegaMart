// Per-product specifications, supplier info and reviews for the product
// detail page. Previously this was generated per *category* in
// productController.ts, so every "Clothing" item (a jacket, a t-shirt, a
// pair of jeans) got identical denim specs and every "Footwear" item got
// identical Adidas Boost/Primeknit specs — wrong for anything that wasn't
// literally jeans or literally the Ultraboost. Keyed by product name so a
// renamed/removed product falls back to the generic template below instead
// of silently reusing another product's specs.

export interface ProductReview {
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductSupplier {
  name: string;
  origin: string;
  dispatchSpeed: string;
  rating: number;
}

export interface ProductDetailEntry {
  specifications: Record<string, string>;
  supplier: ProductSupplier;
  reviews: ProductReview[];
}

const avgRating = (reviews: ProductReview[]) =>
  Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;

const entries: Record<string, Omit<ProductDetailEntry, 'reviews'> & { reviews: ProductReview[] }> = {
  'MacBook Pro 14"': {
    specifications: {
      Brand: 'Apple',
      Processor: 'Apple M3 Pro (11-core CPU, 14-core GPU)',
      Memory: '18GB Unified Memory',
      Storage: '512GB SSD',
      Display: '14.2" Liquid Retina XDR, 120Hz ProMotion',
      'Battery Life': 'Up to 18 hours video playback',
      Ports: '3x Thunderbolt 4, HDMI, SDXC, MagSafe 3',
      Warranty: '1 Year Limited Apple Warranty',
    },
    supplier: { name: 'Silicon Valley Wholesale Tech', origin: 'San Francisco, California', dispatchSpeed: 'Ships within 24 Hours', rating: 4.8 },
    reviews: [
      { reviewer: 'Alex Mercer', rating: 5, comment: 'Compiles my codebase in seconds and the battery genuinely lasts a full day of development work.', date: '2026-05-12' },
      { reviewer: 'Priya N.', rating: 4, comment: 'Gorgeous screen, very premium build. Pricey, but it has replaced my desktop for video editing.', date: '2026-05-20' },
    ],
  },
  'iPhone 15 Pro': {
    specifications: {
      Brand: 'Apple',
      Chip: 'A17 Pro Bionic',
      Display: '6.1" Super Retina XDR, 120Hz ProMotion',
      Storage: '256GB',
      Material: 'Aerospace-grade Titanium',
      Camera: '48MP Main + 12MP Ultra Wide + 12MP Telephoto',
      Connectivity: '5G, Wi-Fi 6E, USB-C',
      Warranty: '1 Year Limited Apple Warranty',
    },
    supplier: { name: 'Silicon Valley Wholesale Tech', origin: 'San Francisco, California', dispatchSpeed: 'Ships within 24 Hours', rating: 4.8 },
    reviews: [
      { reviewer: 'Dave K.', rating: 5, comment: 'The titanium frame feels so much lighter than my old 14 Pro. Camera is a big step up too.', date: '2026-05-28' },
      { reviewer: 'Maria T.', rating: 4, comment: 'Great phone, but battery life is just okay with heavy camera use.', date: '2026-06-02' },
    ],
  },
  'Sony WH-1000XM6': {
    specifications: {
      Brand: 'Sony',
      Type: 'Over-Ear, Active Noise Cancelling',
      'Battery Life': 'Up to 30 hours (ANC on)',
      Charging: 'USB-C, 3 min charge = 3 hours playback',
      Connectivity: 'Bluetooth 5.3, Multipoint pairing',
      'Driver Size': '30mm',
      Weight: '250g',
      Warranty: '1 Year Manufacturer Warranty',
    },
    supplier: { name: 'The Audio Store', origin: 'Mumbai, India', dispatchSpeed: 'Ships within 24 Hours', rating: 4.7 },
    reviews: [
      { reviewer: 'Karan M.', rating: 5, comment: 'Noise cancellation is noticeably better than the XM5 on flights. Worth the upgrade.', date: '2026-06-01' },
      { reviewer: 'Lena O.', rating: 4, comment: 'Excellent sound, though the case is a bit bulkier than I expected.', date: '2026-06-10' },
    ],
  },
  'Sony WH-1000XM5': {
    specifications: {
      Brand: 'Sony',
      Type: 'Over-Ear, Active Noise Cancelling',
      'Battery Life': 'Up to 30 hours (ANC on)',
      Charging: 'USB-C, 3 min charge = 3 hours playback',
      Connectivity: 'Bluetooth 5.2, Multipoint pairing',
      'Driver Size': '30mm',
      Weight: '250g',
      Warranty: '1 Year Manufacturer Warranty',
    },
    supplier: { name: 'The Audio Store', origin: 'Mumbai, India', dispatchSpeed: 'Ships within 24 Hours', rating: 4.7 },
    reviews: [
      { reviewer: 'Sarah Chen', rating: 5, comment: 'Still one of the best ANC headphones you can buy, even next to newer models. Very comfortable for long flights.', date: '2026-05-20' },
      { reviewer: 'Omar F.', rating: 4, comment: 'Great sound and call quality. Touch controls are occasionally finicky.', date: '2026-05-30' },
    ],
  },
  'Logitech MX Master 3S': {
    specifications: {
      Brand: 'Logitech',
      Sensor: '8000 DPI Darkfield High Precision',
      Buttons: '7 programmable buttons',
      Scroll: 'MagSpeed electromagnetic scroll wheel',
      Connectivity: 'Bluetooth Low Energy or Logi Bolt USB receiver',
      'Battery Life': 'Up to 70 days on a full charge',
      Compatibility: 'Windows, macOS, Linux, iPadOS',
      Warranty: '1 Year Manufacturer Warranty',
    },
    supplier: { name: 'Logitech Authorized Distributor', origin: 'Lausanne, Switzerland', dispatchSpeed: 'Ships within 24 Hours', rating: 4.8 },
    reviews: [
      { reviewer: 'Ben R.', rating: 5, comment: 'The scroll wheel alone makes this worth it for spreadsheet work. Silent clicks are a nice touch.', date: '2026-04-18' },
      { reviewer: 'Ananya S.', rating: 5, comment: 'Pairs instantly across three computers with the Flow feature. Battery easily lasts weeks.', date: '2026-04-25' },
    ],
  },
  'Levis 501 Original Jeans': {
    specifications: {
      Material: '100% Premium Cotton Denim',
      Fit: 'Original Straight Fit',
      'Care Instructions': 'Machine wash cold, air dry recommended',
      Weave: '14oz Durable Heavyweight Cotton',
      Closure: 'Classic Button Fly',
      Pockets: '5-Pocket Design',
    },
    supplier: { name: 'Vanguard Denim Distributors', origin: 'Austin, Texas', dispatchSpeed: 'Ships within 2-3 Days', rating: 4.5 },
    reviews: [
      { reviewer: 'Jordan K.', rating: 5, comment: 'Durable heavyweight cotton, fits exactly as advertised. Very pleased with the classic indigo wash.', date: '2026-05-18' },
      { reviewer: 'Chris B.', rating: 4, comment: 'Slightly stiff initially, but softened beautifully after the first wash. Highly durable.', date: '2026-05-24' },
    ],
  },
  'Nike Dri-Fit T-Shirt': {
    specifications: {
      Material: '100% Recycled Polyester, Dri-FIT Technology',
      Fit: 'Standard Athletic Fit',
      'Care Instructions': 'Machine wash cold, tumble dry low',
      Features: 'Moisture-wicking, breathable mesh panels',
      Neckline: 'Crew Neck',
    },
    supplier: { name: 'Nike Apparel Distribution', origin: 'Beaverton, Oregon', dispatchSpeed: 'Ships within 2-3 Days', rating: 4.6 },
    reviews: [
      { reviewer: 'Marcus A.', rating: 5, comment: 'Keeps me dry through long runs and washes well without losing shape.', date: '2026-05-22' },
      { reviewer: 'Hana Y.', rating: 4, comment: 'Lightweight and comfortable, true to size.', date: '2026-05-27' },
    ],
  },
  'North Face Puffer Jacket': {
    specifications: {
      Insulation: '600-fill Recycled Down',
      Shell: 'Water-repellent Nylon Ripstop',
      Closure: 'Full-zip with storm flap and chin guard',
      Pockets: '2 Hand Pockets, 1 Interior Pocket',
      'Care Instructions': 'Machine wash cold, tumble dry low',
      'Best For': 'Temperatures down to 20°F (-6°C)',
    },
    supplier: { name: 'Summit Outerwear Distributors', origin: 'Denver, Colorado', dispatchSpeed: 'Ships within 2-3 Days', rating: 4.6 },
    reviews: [
      { reviewer: 'Noah P.', rating: 5, comment: 'Kept me warm through a whole Chicago winter. Packs down small for travel too.', date: '2026-01-14' },
      { reviewer: 'Ingrid S.', rating: 4, comment: 'Great warmth-to-weight ratio, though the hood isn’t removable.', date: '2026-01-22' },
    ],
  },
  'Adidas Ultraboost': {
    specifications: {
      Brand: 'Adidas',
      Cushioning: 'Responsive Boost Midsole',
      'Upper Material': 'Primeknit Fiber Mesh',
      Closure: 'Secure Lace-up Structure',
      Outsole: 'Continental Rubber Grip Outsole',
      Weight: '310g (Size 9)',
    },
    supplier: { name: 'Apex Activewear & Sports', origin: 'Portland, Oregon', dispatchSpeed: 'Ships within 24 Hours', rating: 4.9 },
    reviews: [
      { reviewer: 'Liam N.', rating: 5, comment: 'Extremely comfortable for daily runs. Excellent energy return on longer distances.', date: '2026-05-27' },
      { reviewer: 'Sofia R.', rating: 5, comment: 'Best cushioning I’ve felt in a running shoe. True to size.', date: '2026-06-01' },
    ],
  },
  'Nike Air Jordan 1': {
    specifications: {
      Brand: 'Nike',
      'Upper Material': 'Full-grain Leather',
      Cushioning: 'Encapsulated Air-Sole Unit',
      Closure: 'Lace-up with padded collar',
      Outsole: 'Rubber Outsole with Herringbone Traction',
      Silhouette: 'High-Top',
    },
    supplier: { name: 'Apex Activewear & Sports', origin: 'Portland, Oregon', dispatchSpeed: 'Ships within 24 Hours', rating: 4.9 },
    reviews: [
      { reviewer: 'Tyrell J.', rating: 5, comment: 'Iconic silhouette and the leather quality is excellent on this release.', date: '2026-04-10' },
      { reviewer: 'Grace L.', rating: 4, comment: 'Runs slightly narrow, go half a size up. Looks amazing though.', date: '2026-04-19' },
    ],
  },
  'Herman Miller Aeron Chair': {
    specifications: {
      Brand: 'Herman Miller',
      Material: '8Z Pellicle Suspension Mesh',
      Support: 'PostureFit SL Lumbar Support',
      Adjustability: 'Tilt limiter, seat angle, adjustable arms',
      'Weight Capacity': 'Up to 350 lbs',
      Warranty: '12 Year Manufacturer Warranty',
    },
    supplier: { name: 'Herman Miller Direct', origin: 'Zeeland, Michigan', dispatchSpeed: 'Ships within 5-7 Days', rating: 4.9 },
    reviews: [
      { reviewer: 'Victor H.', rating: 5, comment: 'My back pain is basically gone after switching to this chair for WFH.', date: '2026-03-02' },
      { reviewer: 'Nadia F.', rating: 5, comment: 'Expensive but worth it — breathable mesh is great for long days.', date: '2026-03-15' },
    ],
  },
  'Nespresso Coffee Machine': {
    specifications: {
      Brand: 'Nespresso',
      'Capsule System': 'Original Line',
      Pressure: '19 Bar Pump Pressure',
      'Water Tank': '0.7L Removable Tank',
      'Heat-up Time': '25 Seconds',
      'Auto Shut-off': 'After 9 minutes of inactivity',
    },
    supplier: { name: 'MegaMart Global Fulfillment', origin: 'Chicago, Illinois', dispatchSpeed: 'Ships within 48 Hours', rating: 4.4 },
    reviews: [
      { reviewer: 'Oliver D.', rating: 4, comment: 'Quick and consistent espresso every morning. Compact enough for a small kitchen.', date: '2026-02-11' },
      { reviewer: 'Fatima Z.', rating: 4, comment: 'Great value machine, though the water tank could be a bit larger.', date: '2026-02-20' },
    ],
  },
};

export const genericFallback: Omit<ProductDetailEntry, 'reviews'> & { reviews: ProductReview[] } = {
  specifications: {
    Condition: 'New in Box',
    Availability: 'In Stock',
    Warranty: '30-Day Money-Back Guarantee',
  },
  supplier: { name: 'MegaMart Global Fulfillment', origin: 'Chicago, Illinois', dispatchSpeed: 'Ships within 48 Hours', rating: 4.4 },
  reviews: [{ reviewer: 'Verified Buyer', rating: 4, comment: 'Great product, matches the description.', date: '2026-05-10' }],
};

export const getProductDetail = (productName: string): ProductDetailEntry & { rating: number } => {
  const entry = entries[productName] ?? genericFallback;
  return { ...entry, rating: avgRating(entry.reviews) };
};
