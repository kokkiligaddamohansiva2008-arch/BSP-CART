/**
 * A product remains visible when its photograph fails to load.
 * Images are presentation assets, not proof that a product can be sold.
 * ProductPhoto displays an accessible, product-labelled fallback independently.
 *
 * Older versions persisted failed product IDs in sessionStorage and hid them
 * across catalogue and home pages. Never reuse that blacklist.
 */
export const isProductVisible = (product) => product?.id != null;

// Keep the existing API for components importing this module.
// Image errors must NOT change product visibility, inventory, or purchase state.
export const reportUnavailableProductImage = (product, url) => {
  if (product?.id == null || !url) return;
  if (typeof console !== "undefined") {
    console.warn("[BSP CART] Product image unavailable; keeping listing visible", {
      productId: product.id,
      imageUrl: String(url).slice(0, 250),
    });
  }
};

// The catalogue no longer needs to re-filter products on image errors.
export const onImageVisibilityChanged = () => () => {};
