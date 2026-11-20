/**
 * BSP CART product-photo availability gate.
 *
 * Listings without a genuine image are excluded from the storefront.
 * Remote image failures are confirmed by the browser's <img> onError event,
 * and quarantined for the current page session only.
 *
 * Never mutate Supabase inventory because an external image host is offline.
 */
const EVENT = "bsp-image-visibility-changed";
const failedImageIds = new Set();

const isRealImage = (value) => {
  const url = String(value || "").trim();
  if (!url || /^data:image\/svg\+xml/i.test(url)) return false;
  if (/product-fallback\.svg|placehold\.co|via\.placeholder\.com/i.test(url)) return false;
  // Accept browser-readable local or remote image URLs, or genuine uploaded data URLs.
  return /^(https?:\/\/|\/images\/products\/|data:image\/(?:png|jpe?g|webp|gif);)/i.test(url);
};

export const isProductVisible = (product) => {
  if (product?.id == null || failedImageIds.has(String(product.id))) return false;
  const images = [
    ...(Array.isArray(product.images) ? product.images : []),
    product.image,
    product.imageUrl,
  ];
  return images.some(isRealImage);
};

export const reportUnavailableProductImage = (product, url) => {
  if (product?.id == null || !url) return;
  const src = String(url);
  if (/^data:/i.test(src)) return;
  const key = String(product.id);
  if (failedImageIds.has(key)) return;
  failedImageIds.add(key);
  console.warn("[BSP CART] Hiding product with failed photo URL", {
    productId: key,
    url: src.slice(0, 250),
  });
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
};

export const onImageVisibilityChanged = (listener) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
};
