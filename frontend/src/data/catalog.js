/*
|--------------------------------------------------------------------------
| BSP CART — Shared Mock Catalog
|--------------------------------------------------------------------------
|
| Single source of truth for product data used by Home, Products, and
| ProductDetails so IDs, prices, and images line up across pages.
|
| Swap this file for real productService.getAllProducts() calls once the
| Spring Boot backend is wired in — every consumer just needs an array of
| objects shaped like PRODUCTS below.
|
*/

export const CATEGORIES = [
  { id: "all", label: "All Stalls" },
  { id: "grocery", label: "Grocery" },
  { id: "electronics", label: "Electronics" },
  { id: "fashion", label: "Fashion" },
  { id: "home", label: "Home & Kitchen" },
];

// picsum.photos/seed/<name> returns a random unrelated stock photo for
// every seed — it has no idea what "bsp-rice" means, so the picture never
// actually matched the product name it labeled. Each product below points
// at a specific, real photo of that product category instead.
const PRODUCT_PHOTOS = {
  rice: "https://images.unsplash.com/photo-1723475158232-819e29803f4d",
  groundnutOil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5",
  earbuds: "https://images.unsplash.com/photo-1525825691042-e14d9042fc70",
  charger: "https://images.unsplash.com/photo-1544894485-42c6e60e37a0",
  saree: "https://images.unsplash.com/photo-1679849922748-f59ba2e10c10",
  kurta: "https://images.unsplash.com/photo-1758913340758-88d5719d37f3",
  tawa: "https://images.unsplash.com/photo-1581622558638-818128465982",
  bottle: "https://images.unsplash.com/photo-1544003484-3cd181d17917",
};

const img = (url) => `${url}?w=600&h=450&fit=crop&auto=format&q=80`;

export const PRODUCTS = [
  {
    id: 1,
    name: "Basmati Rice 5kg",
    category: "grocery",
    price: 420,
    mrp: 480,
    stock: 18,
    seller: "Sri Lakshmi Traders",
    rating: 4.3,
    ratingCount: 214,
    bestseller: true,
    image: img(PRODUCT_PHOTOS.rice),
    images: [img(PRODUCT_PHOTOS.rice)],
    description:
      "Premium long-grain basmati rice, aged for extra aroma. Sourced directly from Godavari-belt farms and packed for freshness.",
    highlights: ["Aged basmati, extra-long grain", "5kg resealable pack", "No polish, low starch"],
    priceHistory: [460, 455, 450, 440, 430, 425, 420],
  },
  {
    id: 2,
    name: "Cold-Pressed Groundnut Oil 1L",
    category: "grocery",
    price: 260,
    mrp: 300,
    stock: 32,
    seller: "Godavari Oils",
    rating: 4.5,
    ratingCount: 189,
    image: img(PRODUCT_PHOTOS.groundnutOil),
    images: [img(PRODUCT_PHOTOS.groundnutOil)],
    description:
      "Traditional wood-pressed groundnut oil with no chemical refining, retaining natural nutrients and aroma.",
    highlights: ["Wood cold-pressed", "No preservatives", "Glass-safe recyclable bottle"],
    priceHistory: [300, 295, 285, 280, 270, 265, 260],
    deal: { price: 219, endsInMinutes: 180 },
  },
  {
    id: 3,
    name: "Wireless Earbuds",
    category: "electronics",
    price: 1499,
    mrp: 2499,
    stock: 7,
    seller: "TechBazaar",
    rating: 4.1,
    ratingCount: 862,
    bestseller: true,
    image: img(PRODUCT_PHOTOS.earbuds),
    images: [img(PRODUCT_PHOTOS.earbuds)],
    description:
      "True wireless earbuds with active noise cancellation, 30-hour case battery life, and touch controls.",
    highlights: ["Active noise cancellation", "30hr total battery (case + buds)", "IPX5 sweat resistant"],
    priceHistory: [2499, 2299, 1999, 1799, 1699, 1599, 1499],
    deal: { price: 1249, endsInMinutes: 45 },
  },
  {
    id: 4,
    name: "USB-C Fast Charger 33W",
    category: "electronics",
    price: 899,
    mrp: 1199,
    stock: 21,
    seller: "TechBazaar",
    rating: 4.4,
    ratingCount: 340,
    image: img(PRODUCT_PHOTOS.charger),
    images: [img(PRODUCT_PHOTOS.charger)],
    description:
      "Compact 33W GaN fast charger, compatible with most phones, tablets, and laptops via USB-C PD.",
    highlights: ["GaN tech, compact form factor", "33W USB-C Power Delivery", "Overcharge protection"],
    priceHistory: [1199, 1150, 1050, 999, 950, 920, 899],
  },
  {
    id: 5,
    name: "Cotton Handloom Saree",
    category: "fashion",
    price: 1850,
    mrp: 2600,
    stock: 5,
    seller: "Pochampally Weaves",
    rating: 4.7,
    ratingCount: 96,
    image: img(PRODUCT_PHOTOS.saree),
    images: [img(PRODUCT_PHOTOS.saree)],
    description:
      "Handwoven Pochampally ikat cotton saree with traditional geometric motifs, made by local weaving cooperatives.",
    highlights: ["100% handloom cotton", "Traditional ikat weave", "Includes matching blouse piece"],
    priceHistory: [2600, 2500, 2350, 2200, 2050, 1950, 1850],
  },
  {
    id: 6,
    name: "Men's Kurta Set",
    category: "fashion",
    price: 999,
    mrp: 1399,
    stock: 14,
    seller: "Style Junction",
    rating: 4.0,
    ratingCount: 158,
    image: img(PRODUCT_PHOTOS.kurta),
    images: [img(PRODUCT_PHOTOS.kurta)],
    description:
      "Festive-ready cotton-blend kurta and pyjama set, breathable fabric with subtle woven texture.",
    highlights: ["Cotton-blend fabric", "Machine washable", "Available S–XXL"],
    priceHistory: [1399, 1350, 1300, 1250, 1150, 1050, 999],
  },
  {
    id: 7,
    name: "Non-Stick Tawa 28cm",
    category: "home",
    price: 550,
    mrp: 750,
    stock: 26,
    seller: "Ghar Kitchenware",
    rating: 4.2,
    ratingCount: 271,
    image: img(PRODUCT_PHOTOS.tawa),
    images: [img(PRODUCT_PHOTOS.tawa)],
    description:
      "Heavy-gauge non-stick tawa with induction-compatible base, ideal for dosa, roti, and parathas.",
    highlights: ["Induction compatible", "PFOA-free coating", "Ergonomic bakelite handle"],
    priceHistory: [750, 720, 690, 650, 610, 580, 550],
  },
  {
    id: 8,
    name: "Steel Water Bottle 1L",
    category: "home",
    price: 349,
    mrp: 499,
    stock: 40,
    seller: "Ghar Kitchenware",
    rating: 4.6,
    ratingCount: 503,
    bestseller: true,
    image: img(PRODUCT_PHOTOS.bottle),
    images: [img(PRODUCT_PHOTOS.bottle)],
    description:
      "Double-wall vacuum insulated stainless steel bottle, keeps water cold for 24 hours and hot for 12.",
    highlights: ["24hr cold / 12hr hot insulation", "Leak-proof lid", "Food-grade 304 steel"],
    priceHistory: [499, 480, 460, 430, 400, 370, 349],
  },
];

/*
|--------------------------------------------------------------------------
| Seller-added products (persisted to localStorage)
|--------------------------------------------------------------------------
|
| Sellers can add/edit/delete their own products from the Seller Dashboard.
| There's still no backend, so these are layered on top of the static
| PRODUCTS array above and saved to localStorage under SELLER_PRODUCTS_KEY.
| Every consumer of PRODUCTS (Home, Products, ProductDetails, ProductCard)
| keeps working unchanged because we mutate PRODUCTS in place.
|
*/

const SELLER_PRODUCTS_KEY = "bsp_seller_products";

// Inline placeholder so a product with no photo never shows a broken image
// (the old via.placeholder.com link fails offline / when blocked).
const DEFAULT_PRODUCT_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#FAF6EF"/><text x="50%" y="50%" fill="#202A44" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'
  );

function loadSellerProducts() {
  try {
    const raw = localStorage.getItem(SELLER_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSellerProducts() {
  const sellerProducts = PRODUCTS.filter((p) => p.isSellerAdded);
  try {
    localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(sellerProducts));
  } catch (err) {
    // Most commonly a QuotaExceededError — localStorage only has a few MB,
    // and full-size photos add up fast. Let the caller roll back and show
    // a clear message instead of the product silently failing to save.
    throw new Error(
      "Not enough browser storage left to save this product. Try removing an image or using a smaller photo."
    );
  }
}

// Hydrate PRODUCTS with anything previously added by sellers, once, at load.
loadSellerProducts().forEach((p) => PRODUCTS.push(p));

/**
 * Products belonging to a given seller (matched by ownerUsername, the
 * localStorage "username" set at login). Falls back to all seller-added
 * products if no owner is given.
 */
export function getSellerProducts(ownerUsername) {
  return PRODUCTS.filter(
    (p) => p.isSellerAdded && (!ownerUsername || p.ownerUsername === ownerUsername)
  );
}

let lastId = 0;

// Date.now() alone repeats when several products are created in the same
// millisecond (bulk upload), which made products overwrite/duplicate each
// other. This always returns a strictly increasing id.
function nextProductId() {
  lastId = Math.max(Date.now(), lastId + 1);
  return lastId;
}

function buildSellerProduct(ownerUsername, ownerName, data) {
  const images = (data.images && data.images.length ? data.images : [data.image]).filter(Boolean);

  return {
    id: nextProductId(),
    name: data.name,
    category: data.category || "grocery",
    price: Number(data.price) || 0,
    mrp: Number(data.mrp) || Number(data.price) || 0,
    stock: Number(data.stock) || 0,
    seller: ownerName || "You",
    rating: 0,
    ratingCount: 0,
    image: images[0] || DEFAULT_PRODUCT_IMAGE,
    images: images.length ? images : undefined,
    description: data.description || "",
    highlights: [],
    priceHistory: [Number(data.price) || 0],
    isSellerAdded: true,
    ownerUsername,
  };
}

/**
 * Add a new product on behalf of a seller. `data` may include name,
 * category, price, mrp, stock, description, image (data URL or link),
 * images (array of data URLs/links). Returns the created product.
 */
export function addSellerProduct(ownerUsername, ownerName, data) {
  return addSellerProducts(ownerUsername, ownerName, [data])[0];
}

/**
 * Add several products in one go (bulk upload). All-or-nothing: if the
 * browser storage quota is exceeded, none of them are kept.
 * Returns the array of created products.
 */
export function addSellerProducts(ownerUsername, ownerName, list) {
  const created = list.map((data) => {
    const product = buildSellerProduct(ownerUsername, ownerName, data);
    PRODUCTS.push(product);
    return product;
  });

  try {
    persistSellerProducts();
  } catch (err) {
    created.forEach((product) => {
      const i = PRODUCTS.indexOf(product);
      if (i !== -1) PRODUCTS.splice(i, 1);
    });
    throw err;
  }

  return created;
}

/**
 * Update an existing seller-added product by id. Ignored (returns null)
 * for products that weren't added by a seller (i.e. the static catalog).
 */
export function updateSellerProduct(id, data) {
  const numId = Number(id);
  const product = PRODUCTS.find((p) => p.id === numId && p.isSellerAdded);
  if (!product) return null;

  const snapshot = { ...product };
  const images = (data.images && data.images.length ? data.images : [data.image]).filter(Boolean);

  product.name = data.name ?? product.name;
  product.category = data.category ?? product.category;
  product.price = data.price !== undefined ? Number(data.price) : product.price;
  product.mrp = data.mrp !== undefined ? Number(data.mrp) : product.mrp;
  product.stock = data.stock !== undefined ? Number(data.stock) : product.stock;
  product.description = data.description ?? product.description;

  if (images.length) {
    product.image = images[0];
    product.images = images;
  }

  try {
    persistSellerProducts();
  } catch (err) {
    Object.assign(product, snapshot); // roll back to the last saved version
    throw err;
  }

  return product;
}

/**
 * Remove a seller-added product by id. No-ops for static catalog products.
 */
export function deleteSellerProduct(id) {
  const numId = Number(id);
  const index = PRODUCTS.findIndex((p) => p.id === numId && p.isSellerAdded);
  if (index === -1) return false;

  PRODUCTS.splice(index, 1);
  persistSellerProducts();

  return true;
}

export function getProductById(id) {
  const numId = Number(id);
  return PRODUCTS.find((p) => p.id === numId) || null;
}

export function getRelatedProducts(product, limit = 4) {
  if (!product) return [];
  return PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, limit);
}

export function getDealProducts() {
  return PRODUCTS.filter((p) => p.deal);
}

export function formatINR(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN");
}

export function discountPercent(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}
