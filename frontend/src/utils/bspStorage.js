/*
|--------------------------------------------------------------------------
| BSP CART — Local Personalization Storage
|--------------------------------------------------------------------------
|
| Lightweight localStorage helpers that power the Amazon-style
| personalization features (Recommended for You, Buy It Again, Wishlist)
| while the app is still running on mock data. Every function is
| defensive about malformed/missing data so pages never crash on a
| fresh browser with empty storage.
|
*/

const KEYS = {
  RECENTLY_VIEWED: "bsp_recently_viewed",
  WISHLIST: "bsp_wishlist",
  ORDERS: "bsp_orders",
};

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* ---------------------------- Recently viewed --------------------------- */

export function addRecentlyViewed(productId) {
  const list = safeParse(KEYS.RECENTLY_VIEWED, []);
  const next = [productId, ...list.filter((id) => id !== productId)].slice(0, 20);
  localStorage.setItem(KEYS.RECENTLY_VIEWED, JSON.stringify(next));
}

export function getRecentlyViewed() {
  return safeParse(KEYS.RECENTLY_VIEWED, []);
}

/* ---------------------------------- Wishlist ----------------------------------- */

export function getWishlist() {
  return safeParse(KEYS.WISHLIST, []);
}

export function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

export function toggleWishlist(productId) {
  const list = getWishlist();
  const next = list.includes(productId)
    ? list.filter((id) => id !== productId)
    : [...list, productId];
  localStorage.setItem(KEYS.WISHLIST, JSON.stringify(next));
  return next.includes(productId);
}

/* ----------------------------------- Orders ------------------------------------ */
// Order history is optional mock data; BuyItAgain simply hides itself if
// nothing is found. Shape: [{ id, date, items: [{ productId, qty }] }]

export function getOrderHistory() {
  return safeParse(KEYS.ORDERS, []);
}

export function getBuyAgainProductIds(limit = 8) {
  const orders = getOrderHistory();
  const seen = new Set();
  const ids = [];
  // Most recent orders first
  [...orders]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        if (!seen.has(item.productId)) {
          seen.add(item.productId);
          ids.push(item.productId);
        }
      });
    });
  return ids.slice(0, limit);
}
