import { useEffect, useRef, useState } from "react";
import { matchingProductVisual, NO_PRODUCT_PHOTO } from "../data/productVisuals";
import { productIllustration } from "../data/imageFallback";

// Browse openly licensed Wikimedia Commons photographs without requiring sellers
// to upload photos. Results are cached and requested only as cards enter view.
const imageCache = new Map();
const pending = new Map();
const queued = [];
let active = 0;
const MAX_PARALLEL = 3;
// Known category banners are NOT product photos. Never reuse them on listings.
const SHARED_CATEGORY_PHOTOS = new Set([
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
const isSharedCategoryImage = (url) => {
  const match = String(url || "").match(/images\.unsplash\.com\/(photo-[a-z0-9-]+)/i);
  return Boolean(match && SHARED_CATEGORY_PHOTOS.has(match[1]));
};
const isMissing = (url) =>
  !url ||
  url === NO_PRODUCT_PHOTO ||
  /product-fallback\.svg(?:\?|$)/i.test(String(url)) ||
  /^data:image\/svg\+xml/i.test(String(url)) ||
  /via\.placeholder\.com|placehold\.co|\/placeholder(?:\.|\/)/i.test(String(url));

// Do not choose the same searched photo for different catalogue products.
const claimedPhotoUrls = new Map();
const normalized = (str) => String(str || "").toLowerCase()
  .replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, " ").trim();
const licenseIsUsable = (value) =>
  /^(CC0|Public domain|CC BY(?:-SA)?(?: |$|-))/i.test(String(value || ""));
const getKey = (product) =>
  String(product?.category || "") + ":" + String(product?.name || "").trim().toLowerCase();

async function searchCommons(product) {
  const key = getKey(product);
  if (imageCache.has(key)) return imageCache.get(key);
  try {
    const stored = JSON.parse(sessionStorage.getItem("bsp-photo-unique:" + key) || "null");
    if (stored?.url && (!claimedPhotoUrls.has(stored.url) || claimedPhotoUrls.get(stored.url) === key)) {
      claimedPhotoUrls.set(stored.url, key);
      imageCache.set(key, stored);
      return stored;
    }
  } catch { /* Storage disabled */ }

  const words = normalized(product.name).split(" ").filter((w) => w.length > 2);
  const query = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrlimit: "10",
    gsrsearch: String(product.name),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "640",
    iiextmetadatafilter: "LicenseShortName|Artist",
  });

  try {
    const response = await fetch("https://commons.wikimedia.org/w/api.php?" + query);
    if (!response.ok) throw new Error("Image lookup failed");
    const data = await response.json();
    const photos = Object.values(data.query?.pages || [])
      .map((page) => {
        const info = page.imageinfo?.[0];
        const name = normalized(page.title.replace(/^File:/, ""));
        const license = info?.extmetadata?.LicenseShortName?.value || "";
        const score = words.filter((word) => name.split(" ").includes(word)).length;
        return {
          url: info?.thumburl || info?.url,
          source: info?.descriptionurl,
          license,
          score,
          title: page.title,
        };
      })
      .filter((p) => p.url && /\.(jpe?g|png|webp)(?:$|\?)/i.test(p.url.split("?")[0])
        && licenseIsUsable(p.license)
        && p.score >= Math.max(1, Math.ceil(words.length * 0.75)))
      .filter((p) => !claimedPhotoUrls.has(p.url) || claimedPhotoUrls.get(p.url) === key)
      .sort((a, b) => b.score - a.score);
    const found = photos[0] || null;
    imageCache.set(key, found);
    if (found) {
      claimedPhotoUrls.set(found.url, key);
      try { sessionStorage.setItem("bsp-photo-unique:" + key, JSON.stringify(found)); }
      catch { /* Quota or private mode */ }
    }
    return found;
  } catch {
    imageCache.set(key, null);
    return null;
  }
}

function pump() {
  while (active < MAX_PARALLEL && queued.length) {
    const item = queued.shift();
    active += 1;
    searchCommons(item.product).then(item.resolve, () => item.resolve(null))
      .finally(() => {
        pending.delete(item.key);
        active -= 1;
        pump();
      });
  }
}

function requestPhoto(product) {
  const key = getKey(product);
  if (imageCache.has(key)) return Promise.resolve(imageCache.get(key));
  if (pending.has(key)) return pending.get(key);
  const promise = new Promise((resolve) => {
    queued.push({ product, key, resolve });
    pump();
  });
  pending.set(key, promise);
  return promise;
}

export default function ProductPhoto({ product, src, alt, onError, ...props }) {
  const ref = useRef(null);
  const illustration = productIllustration(product?.name, product?.category);
  const explicit = src || product?.image || product?.images?.[0] || product?.imageUrl;
  const mapped = matchingProductVisual(product?.name, product?.category, product?.id);
  const sellerOwned = Boolean(product?.isSellerAdded || product?.ownerId || product?.ownerUsername);
  // Uploaded seller photos are preserved. Catalogue images must be product-specific,
  // never reused category banners.
  const initial = sellerOwned
    ? (isMissing(explicit) ? illustration : explicit)
    : !isMissing(mapped)
      ? mapped
      : (isMissing(explicit) || isSharedCategoryImage(explicit) ? illustration : explicit);
  const [photo, setPhoto] = useState(initial);
  const [credit, setCredit] = useState(null);

  useEffect(() => {
    let alive = true;
    setPhoto(initial);
    setCredit(null);
    // Search for a uniquely matched, openly licensed photo only when no
    // genuine image is present. Never replace seller-uploaded photographs.
    if (sellerOwned || !isMissing(initial)) return;

    const el = ref.current;
    if (!el) return;
    const load = () => requestPhoto(product).then((result) => {
      if (!alive) return;
      if (result?.url) {
        setPhoto(result.url);
        setCredit(result);
      } else {
        setPhoto(illustration);
      }
    });
    if (typeof IntersectionObserver === "undefined") {
      load();
    } else {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      }, { rootMargin: "250px" });
      observer.observe(el);
      return () => { alive = false; observer.disconnect(); };
    }
    return () => { alive = false; };
  }, [product?.name, product?.category, product?.id, initial, sellerOwned]);

  const failed = useRef(new Set());
  useEffect(() => { failed.current.clear(); }, [product?.id]);

  const handleError = (event) => {
    const url = event.currentTarget.currentSrc || event.currentTarget.src;
    failed.current.add(url);
    // Broken external/local URLs fall back to this specific product's labelled
    // illustration, not a different product or a shared category photograph.
    if (photo !== illustration) {
      setPhoto(illustration);
      setCredit(null);
    } else {
      event.currentTarget.onerror = null;
    }
    onError?.(event);
  };

  return <img
    ref={ref}
    src={photo || illustration}
    alt={alt || product?.name || "Product"}
    title={credit ? `Photo source: ${credit.source} · ${credit.license}` : undefined}
    onError={handleError}
    {...props}
  />;
}
