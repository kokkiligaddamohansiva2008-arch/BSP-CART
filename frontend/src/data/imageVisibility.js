/**
 * Browser-only visibility quarantine for product images that actually fail.
 * Do not delete seller/database records because of a transient browser error.
 * Unavailable listings are excluded from the public catalogue for this session.
 */
const KEY = "bsp-unavailable-product-images-v1";
const EVENT = "bsp-image-visibility-changed";
const failed = new Set();

if (typeof sessionStorage !== "undefined") {
  try {
    const stored = JSON.parse(sessionStorage.getItem(KEY) || "[]");
    if (Array.isArray(stored)) stored.slice(-200).forEach((key) => failed.add(String(key)));
  } catch { /* Storage can be blocked by browser privacy settings. */ }
}

export const isProductVisible = (product) =>
  product?.id != null && !failed.has(String(product.id));

export const reportUnavailableProductImage = (product, url) => {
  if (product?.id == null || !url) return;
  const src = String(url);
  // Only hide listings with genuine remote/local image-load failures.
  // Locally generated product-specific SVG illustrations never go offline.
  if (/^data:/i.test(src)) return;
  const key = String(product.id);
  if (failed.has(key)) return;
  failed.add(key);
  try { sessionStorage.setItem(KEY, JSON.stringify([...failed].slice(-200))); } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
};

export const onImageVisibilityChanged = (listener) => {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
