/**
 * Verified catalogue imagery only. If a mapped local JPG was not actually
 * committed to the repository, never request the broken /images/products/ URL.
 * Fall back to an exact-name Wikimedia image or an original named illustration.
 */
import { PRODUCT_PHOTOS } from "./productImages.js";
import { UPLOADED_PRODUCT_PHOTOS } from "./uploadedProductImages.js";
import { LOCAL_PRODUCT_IMAGES } from "./localImageInventory.js";
import { productIllustration } from "./imageFallback.js";

export const NO_PRODUCT_PHOTO = "/images/products/product-fallback.svg";
const slug = (value) => String(value ?? "").toLowerCase().replace(/&/g, "and")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function matchingProductVisual(name, category, id) {
  const key = `name:${slug(name)}`;
  const local = UPLOADED_PRODUCT_PHOTOS[String(id)] || UPLOADED_PRODUCT_PHOTOS[key];
  if (local && LOCAL_PRODUCT_IMAGES.has(local)) {
    return `/images/products/${local}`;
  }
  const known = PRODUCT_PHOTOS[String(id)] || PRODUCT_PHOTOS[key];
  if (known && /^https?:\/\//i.test(known)) return known;
  if (known && LOCAL_PRODUCT_IMAGES.has(known)) return `/images/products/${known}`;
  return productIllustration(name, category);
}

export function backupProductVisual(name, category, id) {
  // Used after a remote URL fails: a unique, browser-independent asset
  // with the real name of the product, never another product's photograph.
  return productIllustration(name, category);
}
