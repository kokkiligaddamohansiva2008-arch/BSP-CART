/*
| BSP CART — cart store
| Fast local copy (localStorage) that the UI reads synchronously, kept in
| sync with the Supabase `cart_items` table for signed-in users:
|   • guests can add to cart; the items are merged into their account on login
|   • every change is written through to Supabase (cart follows you across devices)
|   • on logout the local copy is cleared
| Only { id, qty } is stored; name/price/image are resolved from the catalog at
| read time so prices never go stale.
*/
import { useEffect, useState } from "react";
import { getProductById } from "../data/catalog";
import { supabase } from "../lib/supabase";
import { getSession } from "./session";

const KEY = "bsp_cart";
const EVENT = "bsp-cart-changed";
const OWNER_KEY = "bsp_cart_owner";

function read() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked — ignore */
  }
  window.dispatchEvent(new Event(EVENT));
}

/* ----------------------------- Supabase sync ----------------------------- */

const uid = () => (getSession().token ? getSession().userId : null);
const logErr = (what) => ({ error }) => error && console.error(`Cart sync failed (${what})`, error.message);

function pushLine(productId, qty) {
  const userId = uid();
  if (!userId) return;
  supabase
    .from("cart_items")
    .upsert({ user_id: userId, product_id: productId, quantity: qty, updated_at: new Date().toISOString() })
    .then(logErr("save"));
}
function pushRemove(productId) {
  const userId = uid();
  if (!userId) return;
  supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId).then(logErr("remove"));
}
function pushClear() {
  const userId = uid();
  if (!userId) return;
  supabase.from("cart_items").delete().eq("user_id", userId).then(logErr("clear"));
}

let syncedFor = null; // which user the local copy currently belongs to

async function syncFromServer() {
  const userId = uid();
  if (!userId) {
    // logged out → drop the private copy
    if (syncedFor || localStorage.getItem(OWNER_KEY)) {
      syncedFor = null;
      localStorage.removeItem(OWNER_KEY);
      write([]);
    }
    return;
  }
  if (syncedFor === userId) return;
  // Local items are "guest" items only if no account owned this local copy yet.
  const guestLines = localStorage.getItem(OWNER_KEY) ? [] : read();
  syncedFor = userId;
  localStorage.setItem(OWNER_KEY, userId);

  const { data, error } = await supabase.from("cart_items").select("product_id, quantity");
  if (error) return console.error("Cart load failed", error.message);

  const merged = new Map(data.map((r) => [Number(r.product_id), r.quantity]));
  guestLines.forEach(({ id, qty }) => merged.set(id, Math.max(merged.get(id) || 0, qty)));

  const list = [...merged].map(([id, qty]) => ({ id, qty }));
  write(list);
  if (guestLines.length) {
    supabase
      .from("cart_items")
      .upsert(list.map((l) => ({ user_id: userId, product_id: l.id, quantity: l.qty })))
      .then(logErr("merge"));
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("bsp-session-changed", syncFromServer);
  syncFromServer();
}

export function unitPrice(product) {
  return Number(product?.deal?.price ?? product?.price ?? 0);
}

export function getCartLines() {
  return read()
    .map(({ id, qty }) => {
      const product = getProductById(id);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        image: product.images?.[0] || product.image || product.imageUrl,
        price: unitPrice(product),
        mrp: Number(product.mrp || 0),
        stock: Number(product.stock ?? 99),
        quantity: qty,
      };
    })
    .filter(Boolean);
}

export function addToCart(productId, qty = 1) {
  const product = getProductById(productId);
  if (!product) return { ok: false, reason: "not-found" };
  const max = Number(product.stock ?? 99);
  if (max <= 0) return { ok: false, reason: "out-of-stock" };

  const list = read();
  const line = list.find((l) => l.id === product.id);
  if (line) line.qty = Math.min(max, line.qty + qty);
  else list.push({ id: product.id, qty: Math.min(max, qty) });
  write(list);
  pushLine(product.id, list.find((l) => l.id === product.id).qty);
  return { ok: true, product };
}

export function setQuantity(productId, qty) {
  const product = getProductById(productId);
  const max = Number(product?.stock ?? 99);
  const next = Math.max(1, Math.min(max, qty));
  write(read().map((l) => (l.id === productId ? { ...l, qty: next } : l)));
  pushLine(productId, next);
}

export function removeFromCart(productId) {
  write(read().filter((l) => l.id !== productId));
  pushRemove(productId);
}

export function clearCart() {
  write([]);
  pushClear();
}

/** Clears only the local copy (the server already emptied the cart when the order was placed). */
export function clearLocalCart() {
  write([]);
}

export function cartTotals(lines = getCartLines()) {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const mrpTotal = lines.reduce((s, l) => s + (l.mrp || l.price) * l.quantity, 0);
  const items = lines.reduce((s, l) => s + l.quantity, 0);
  const shipping = subtotal === 0 || subtotal >= 499 ? 0 : 49;
  return {
    items,
    subtotal,
    savings: Math.max(0, mrpTotal - subtotal),
    shipping,
    total: subtotal + shipping,
  };
}

/* React hook — re-renders whenever the cart changes (any tab or page) */
export function useCartStore() {
  const [lines, setLines] = useState(getCartLines);

  useEffect(() => {
    const sync = () => setLines(getCartLines());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { lines, ...cartTotals(lines) };
}
