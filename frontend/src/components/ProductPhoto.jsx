import { useMemo, useState, useEffect } from "react";
import { matchingProductVisual, backupProductVisual, NO_PRODUCT_PHOTO } from "../data/productVisuals";
import { productIllustration } from "../data/imageFallback";

// One shared photograph must not be used to misrepresent different products.
// Preserve authenticated seller uploads and curated exact-name photo matches.
const imageOwners = new Map();
const DEFAULT_BANNERS = new Set([
  "photo-1542838132-92c53300491e", "photo-1621939514649-280e2aa7f1f9",
  "photo-1509440159596-0249088772ff", "photo-1540420773420-3366772f4999",
  "photo-1563453392212-326f5e854473", "photo-1556911220-bff31c812dba",
  "photo-1608248543803-ba4f8c70ae0b", "photo-1498049794561-7780e7231661",
  "photo-1521572163474-6864f9cf17ab", "photo-1483985988355-763728e1935b",
  "photo-1519238263530-99bdd11df2ea", "photo-1455390582262-044cdead277a",
  "photo-1618221195710-dd6b41faaea6", "photo-1505751172876-fa1923c5c528",
  "photo-1450778869180-41d0601e046e", "photo-1581147036324-c1c89c2c8a7d",
  "photo-1503376780353-7e6692767b70", "photo-1513201099705-a9746e1e201f",
  "photo-1600210492486-724fe5c67fb0", "photo-1604719312566-8912e9c8a213",
  "photo-1526738549149-8e07eca6c147", "photo-1515886657613-9f3515b0c78f",
  "photo-1441986300917-64674bd600d8",
]);

const isGeneric = (url) => {
  const value = String(url || "");
  if (!value || value === NO_PRODUCT_PHOTO ||
      /product-fallback\.svg(?:\?|$)/i.test(value) ||
      /placehold\.co|via\.placeholder\.com/i.test(value)) return true;
  const match = value.match(/images\.unsplash\.com\/(photo-[a-z0-9-]+)/i);
  return Boolean(match && DEFAULT_BANNERS.has(match[1]));
};
const isIllustration = (url) => String(url || "").startsWith("data:image/svg+xml");

// Images are never chosen from a vague internet search by a single keyword:
// that could show a phone for an apple, or one product's image for another.
export default function ProductPhoto({ product, src, alt, onError, ...props }) {
  const label = String(product?.name || "Product");
  const category = String(product?.category || "");
  const key = category + "/" + label.trim().toLowerCase();
  const illustration = useMemo(() => productIllustration(label, category), [label, category]);

  const chosen = useMemo(() => {
    const explicit = src || product?.image || product?.images?.[0] || product?.imageUrl;
    const curated = matchingProductVisual(label, category, product?.id);
    const sellerUploaded = Boolean(product?.isSellerAdded || product?.ownerId || product?.ownerUsername);
    let candidate = illustration;
    if (sellerUploaded && !isGeneric(explicit)) candidate = explicit;
    else if (!isIllustration(curated) && !isGeneric(curated)) candidate = curated;
    else if (!isGeneric(explicit) && !isIllustration(explicit)) candidate = explicit;

    if (candidate !== illustration && !sellerUploaded) {
      const owner = imageOwners.get(candidate);
      if (owner && owner !== key) return illustration;
      imageOwners.set(candidate, key);
    }
    return candidate;
  }, [src, product?.image, product?.images, product?.imageUrl, product?.id,
      product?.ownerId, product?.ownerUsername, product?.isSellerAdded, label, category, illustration, key]);

  const sellerUploaded = Boolean(product?.isSellerAdded || product?.ownerId || product?.ownerUsername);
  const backup = sellerUploaded ? illustration : backupProductVisual(label, category, product?.id);
  const [photo, setPhoto] = useState(chosen);
  useEffect(() => setPhoto(chosen), [chosen]);

  const handleError = (event) => {
    if (photo !== backup && backup !== illustration) {
      // If the user's new JPG is not committed yet, use an existing
      // hand-reviewed matching photo rather than a wrong shared banner.
      setPhoto(backup);
    } else if (photo !== illustration) {
      setPhoto(illustration);
    } else {
      event.currentTarget.onerror = null;
    }
    onError?.(event);
  };

  return (
    <img
      {...props}
      src={photo || illustration}
      alt={alt || label}
      title={isIllustration(photo) ? `Illustration labelled ${label} — original product photo not yet available` : label}
      onError={handleError}
    />
  );
}
