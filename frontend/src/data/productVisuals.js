/** Only verified product photos or a neutral, non-AI fallback are shown. */
import { PRODUCT_PHOTOS } from "./productImages.js";
import { UPLOADED_PRODUCT_PHOTOS } from "./uploadedProductImages.js";
import { productIllustration } from "./imageFallback.js";

export const NO_PRODUCT_PHOTO = "/images/products/product-fallback.svg";
const slug = (value) => String(value ?? "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// The lookup is exact by product name or explicit product ID. No fuzzy photo
// searches that can put the wrong product or an unlicensed image on a listing.
export function matchingProductVisual(name, category, id) {
  const key = `name:${slug(name)}`;
  const photo = UPLOADED_PRODUCT_PHOTOS[String(id)] || UPLOADED_PRODUCT_PHOTOS[key] || PRODUCT_PHOTOS[String(id)] || PRODUCT_PHOTOS[key];
  // A shared category placeholder made unrelated products look identical.
  // Every unmapped product now gets its own named, locally rendered visual.
  if (!photo) return productIllustration(name, category);
  return /^https?:\/\//i.test(photo) ? photo : `/images/products/${photo}`;
}
