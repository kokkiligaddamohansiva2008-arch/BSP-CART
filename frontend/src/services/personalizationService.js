
/*
|--------------------------------------------------------------------------
| BSP CART — personalization storage
|--------------------------------------------------------------------------
| Wishlist and order history are stored in Supabase (`wishlist`,
| `orders` + `order_items`) and mirrored in localStorage/in-memory caches
| so existing synchronous helpers keep working.
|
| Recently viewed is a per-device convenience stored in localStorage.
|--------------------------------------------------------------------------
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

const uid = () => {
  const session = getSession();
  return session?.token ? session.userId : null;
};

/* ---------------------------- Recently viewed --------------------------- */

export function addRecentlyViewed(productId) {
  const list = safeParse(KEYS.RECENTLY_VIEWED, []);
  const next = [
    productId,
    ...list.filter((id) => id !== productId),
  ].slice(0, 20);

  localStorage.setItem(KEYS.RECENTLY_VIEWED, JSON.stringify(next));
}

export function getRecentlyViewed() {
  return safeParse(KEYS.RECENTLY_VIEWED, []);
}

/* -------------------------------- Wishlist ------------------------------ */

export function getWishlist() {
  return safeParse(KEYS.WISHLIST, []);
}

export function isWishlisted(productId) {
  return getWishlist().includes(productId);
}

export function toggleWishlist(productId) {
  const list = getWishlist();
  const adding = !list.includes(productId);

  const next = adding
    ? [...list, productId]
    : list.filter((id) => id !== productId);

  localStorage.setItem(KEYS.WISHLIST, JSON.stringify(next));

  const userId = uid();

  if (userId && supabase) {
    const query = adding
      ? supabase
          .from("wishlist")
          .upsert(
            { user_id: userId, product_id: productId },
            { onConflict: "user_id,product_id" }
          )
      : supabase
          .from("wishlist")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", productId);

    query.then(({ error }) => {
      if (error) {
        console.error("Wishlist sync failed:", error.message);
      }
    });
  }

  return adding;
}

/* --------------------------------- Orders ------------------------------- */

// Expected order shape:
// {
//   id, date, total, status, paymentMethod, address,
//   items: [{ productId, name, image, qty, price }]
// }

let ordersCache = [];
let wishlistFor = null;
let ordersFor = null;

function mapOrder(order) {
  return {
    id: order.id,
    date: order.created_at,
    total: Number(order.total),
    status: order.status,
    paymentMethod: order.payment_method,
    address: [
      order.full_name,
      order.address,
      order.city,
      order.state
        ? `${order.state}${order.pincode ? ` - ${order.pincode}` : ""}`
        : order.pincode,
    ]
      .filter(Boolean)
      .join(", "),
    items: (order.order_items || []).map((item) => ({
      productId: item.product_id,
      name: item.name,
      image: item.image,
      qty: item.quantity,
      price: Number(item.price),
    })),
  };
}

/** Fetch the signed-in user's orders, newest first. */
export async function refreshOrders() {
  const userId = uid();

  if (!userId || !supabase) {
    ordersCache = [];
    return ordersCache;
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  ordersCache = (data || []).map(mapOrder);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bsp-orders-changed"));
  }

  return ordersCache;
}

export function getOrderHistory() {
  return ordersCache;
}

export function getBuyAgainProductIds(limit = 8) {
  const seen = new Set();
  const ids = [];

  [...ordersCache]
    .filter(
      (order) =>
        String(order.status || "").toLowerCase() !== "cancelled"
    )
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

/* -------------------------- Login / logout sync ------------------------- */

async function syncAccountData() {
  const userId = uid();

  if (!userId || !supabase) {
    // Logged out: clear private account data from memory and local storage.
    wishlistFor = null;
    ordersFor = null;
    ordersCache = [];

    localStorage.removeItem(KEYS.WISHLIST);
    localStorage.removeItem(KEYS.WISHLIST_OWNER);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bsp-orders-changed"));
    }

    return;
  }

  /* ---------------------------- Wishlist sync --------------------------- */

  if (wishlistFor !== userId) {
    const previousOwner = localStorage.getItem(KEYS.WISHLIST_OWNER);

    // Only import local wishlist items when they belong to a guest session,
    // not when the browser was previously used by a different account.
    const guestWishlist = previousOwner
      ? []
      : getWishlist();

    wishlistFor = userId;

    const { data, error } = await supabase
      .from("wishlist")
      .select("product_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Wishlist load failed:", error.message);
    } else {
      const remoteIds = (data || []).map((row) => Number(row.product_id));

      const merged = [
        ...new Set([...remoteIds, ...guestWishlist]),
      ];

      localStorage.setItem(KEYS.WISHLIST, JSON.stringify(merged));
      localStorage.setItem(KEYS.WISHLIST_OWNER, userId);

      // Import guest items into the signed-in user's wishlist.
      if (guestWishlist.length) {
        const rows = guestWishlist.map((id) => ({
          user_id: userId,
          product_id: id,
        }));

        const { error: mergeError } = await supabase
          .from("wishlist")
          .upsert(rows, {
            onConflict: "user_id,product_id",
          });

        if (mergeError) {
          console.error(
            "Guest wishlist merge failed:",
            mergeError.message
          );
        }
      }
    }
  }

  /* ----------------------------- Orders sync ---------------------------- */

  if (ordersFor !== userId) {
    ordersFor = userId;

    try {
      await refreshOrders();
    } catch (error) {
      console.error("Order load failed:", error.message);
    }
  }
}

/* ----------------------------- Event wiring ----------------------------- */

if (typeof window !== "undefined") {
  window.addEventListener("bsp-session-changed", () => {
    syncAccountData().catch((error) => {
      console.error("Account data sync failed:", error.message);
    });
  });

  syncAccountData().catch((error) => {
    console.error("Initial account data sync failed:", error.message);
  });
}
