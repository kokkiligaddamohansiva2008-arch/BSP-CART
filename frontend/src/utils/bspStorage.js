/*
|--------------------------------------------------------------------------
| BSP CART — personalization storage
|--------------------------------------------------------------------------
| Wishlist and order history are stored in Supabase (`wishlist_items`,
| `orders` + `order_items`) and mirrored in memory/localStorage so the
| existing synchronous helpers keep working. "Recently viewed" is a
| per-device convenience and stays in localStorage.
*/
import { supabase } from "../lib/supabase";
import { getSession } from "./session";

const KEYS = {
  RECENTLY_VIEWED: "bsp_recently_viewed",
  WISHLIST: "bsp_wishlist",
  WISHLIST_OWNER: "bsp_wishlist_owner",
};

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const uid = () => (getSession().token ? getSession().userId : null);

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
  const adding = !list.includes(productId);
  const next = adding ? [...list, productId] : list.filter((id) => id !== productId);
  localStorage.setItem(KEYS.WISHLIST, JSON.stringify(next));

  const userId = uid();
  if (userId) {
    const q = adding
      ? supabase.from("wishlist_items").upsert({ user_id: userId, product_id: productId })
      : supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId);
    q.then(({ error }) => error && console.error("Wishlist sync failed", error.message));
  }
  return adding;
}

/* ----------------------------------- Orders ------------------------------------ */
// Shape: [{ id, date, total, status, paymentMethod, address, items: [{ productId, name, image, qty, price }] }]

let ordersCache = [];
let wishlistFor = null;
let ordersFor = null;

function mapOrder(o) {
  return {
    id: o.id,
    date: o.created_at,
    total: Number(o.total),
    status: o.status,
    paymentMethod: o.payment_method,
    address: `${o.full_name}, ${o.address}, ${o.city}, ${o.state} - ${o.pincode}`,
    items: (o.order_items || []).map((i) => ({
      productId: i.product_id,
      name: i.name,
      image: i.image,
      qty: i.quantity,
      price: Number(i.price),
    })),
  };
}

/** Fetch the signed-in user's orders from Supabase (newest first). */
export async function refreshOrders() {
  const userId = uid();
  if (!userId) {
    ordersCache = [];
    return ordersCache;
  }
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  ordersCache = data.map(mapOrder);
  window.dispatchEvent(new Event("bsp-orders-changed"));
  return ordersCache;
}

export function getOrderHistory() {
  return ordersCache;
}

export function getBuyAgainProductIds(limit = 8) {
  const seen = new Set();
  const ids = [];
  [...ordersCache]
    .filter((o) => o.status !== "Cancelled")
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((order) => {
      (order.items || []).forEach((item) => {
        if (item.productId != null && !seen.has(item.productId)) {
          seen.add(item.productId);
          ids.push(item.productId);
        }
      });
    });
  return ids.slice(0, limit);
}

/* ------------------------------ login / logout sync ------------------------------ */

async function syncAccountData() {
  const userId = uid();

  if (!userId) {                       // logged out → forget private data
    wishlistFor = ordersFor = null;
    ordersCache = [];
    localStorage.removeItem(KEYS.WISHLIST);
    localStorage.removeItem(KEYS.WISHLIST_OWNER);
    window.dispatchEvent(new Event("bsp-orders-changed"));
    return;
  }

  if (wishlistFor !== userId) {
    const guest = localStorage.getItem(KEYS.WISHLIST_OWNER) ? [] : getWishlist();
    wishlistFor = userId;
    localStorage.setItem(KEYS.WISHLIST_OWNER, userId);
    const { data, error } = await supabase.from("wishlist_items").select("product_id");
    if (!error) {
      const merged = [...new Set([...data.map((r) => Number(r.product_id)), ...guest])];
      localStorage.setItem(KEYS.WISHLIST, JSON.stringify(merged));
      if (guest.length) {
        supabase
          .from("wishlist_items")
          .upsert(merged.map((id) => ({ user_id: userId, product_id: id })))
          .then(() => {});
      }
    }
  }

  if (ordersFor !== userId) {
    ordersFor = userId;
    refreshOrders().catch((e) => console.error("Order load failed", e.message));
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("bsp-session-changed", syncAccountData);
  syncAccountData();
}
