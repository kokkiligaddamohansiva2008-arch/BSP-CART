/*
| BSP CART — local cart store (localStorage)
| Single source of truth for the cart while the app runs on mock data.
| Only { id, qty } is stored; name/price/image are resolved from the
| catalog at read time so prices never go stale.
*/
import { useEffect, useState } from "react";
import { getProductById } from "../data/catalog";

const KEY = "bsp_cart";
const EVENT = "bsp-cart-changed";

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
  return { ok: true, product };
}

export function setQuantity(productId, qty) {
  const product = getProductById(productId);
  const max = Number(product?.stock ?? 99);
  const next = Math.max(1, Math.min(max, qty));
  write(read().map((l) => (l.id === productId ? { ...l, qty: next } : l)));
}

export function removeFromCart(productId) {
  write(read().filter((l) => l.id !== productId));
}

export function clearCart() {
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
