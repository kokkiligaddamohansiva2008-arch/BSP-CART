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
const CATEGORY_IMAGES = {
  "groceries-and-staples": "photo-1542838132-92c53300491e",
  "snacks-and-beverages": "photo-1621939514649-280e2aa7f1f9",
  "dairy-and-bakery": "photo-1509440159596-0249088772ff",
  "fruits-and-vegetables": "photo-1540420773420-3366772f4999",
  "household-and-cleaning": "photo-1563453392212-326f5e854473",
  "kitchen-and-dining": "photo-1556911220-bff31c812dba",
  "personal-care": "photo-1608248543803-ba4f8c70ae0b",
  "electronics-and-accessories": "photo-1498049794561-7780e7231661",
  "men-s-fashion": "photo-1521572163474-6864f9cf17ab",
  "women-s-fashion": "photo-1483985988355-763728e1935b",
  "kids-and-baby": "photo-1519238263530-99bdd11df2ea",
  "stationery-and-office": "photo-1455390582262-044cdead277a",
  "home-decor-and-furnishing": "photo-1618221195710-dd6b41faaea6",
  "health-and-wellness": "photo-1505751172876-fa1923c5c528",
  "pet-and-garden": "photo-1450778869180-41d0601e046e",
  "tools-and-hardware": "photo-1581147036324-c1c89c2c8a7d",
  "auto-and-travel": "photo-1503376780353-7e6692767b70",
  "gifts-and-festival": "photo-1513201099705-a9746e1e201f",
  grocery: "photo-1542838132-92c53300491e",
  electronics: "photo-1498049794561-7780e7231661",
  fashion: "photo-1521572163474-6864f9cf17ab",
  home: "photo-1600210492486-724fe5c67fb0",
};
const genericPhoto = (category) =>
  "https://images.unsplash.com/" +
  (CATEGORY_IMAGES[String(category).toLowerCase()] || CATEGORY_IMAGES.grocery) +
  "?auto=format&fit=crop&w=640&h=640&q=75";

const isMissing = (url) => !url || url === NO_PRODUCT_PHOTO || /product-fallback\.svg(?:\?|$)/.test(url);
const normalized = (str) => String(str || "").toLowerCase()
  .replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, " ").trim();
const licenseIsUsable = (value) =>
  /^(CC0|Public domain|CC BY(?:-SA)?(?: |$|-))/i.test(String(value || ""));
const getKey = (product) => String(product.name || "").trim().toLowerCase();

async function searchCommons(product) {
  const key = getKey(product);
  if (imageCache.has(key)) return imageCache.get(key);
  try {
    const stored = JSON.parse(sessionStorage.getItem("bsp-photo:" + key) || "null");
    if (stored?.url) {
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
        && p.score >= Math.max(1, Math.ceil(words.length * 0.6)))
      .sort((a, b) => b.score - a.score);
    const found = photos[0] || null;
    imageCache.set(key, found);
    if (found) {
      try { sessionStorage.setItem("bsp-photo:" + key, JSON.stringify(found)); }
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
  const explicit = src || product?.image || product?.images?.[0] || product?.imageUrl;
  const initial = isMissing(explicit)
    ? matchingProductVisual(product?.name, product?.category, product?.id)
    : explicit;
  const [photo, setPhoto] = useState(isMissing(initial) ? genericPhoto(product?.category) : initial);
  const [credit, setCredit] = useState(null);

  useEffect(() => {
    let alive = true;
    setPhoto(isMissing(initial) ? genericPhoto(product?.category) : initial);
    setCredit(null);
    // Never overwrite uploaded seller images.
    if (!product?.isSampleCatalogProduct && !isMissing(initial)) return;
    if (!isMissing(initial)) return;

    const el = ref.current;
    if (!el) return;
    const load = () => requestPhoto(product).then((result) => {
      if (!alive) return;
      if (result?.url) {
        setPhoto(result.url);
        setCredit(result);
      } else {
        setPhoto(genericPhoto(product.category));
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
  }, [product?.name, product?.category, product?.id, initial, product?.isSampleCatalogProduct]);

  const failed = useRef(new Set());
  useEffect(() => { failed.current.clear(); }, [product?.id]);

  const handleError = (event) => {
    const url = event.currentTarget.currentSrc || event.currentTarget.src;
    failed.current.add(url);
    const generic = genericPhoto(product?.category);
    const localIllustration = productIllustration(product?.name, product?.category);

    // Never use the old "Photo unavailable" asset: when an external image
    // fails, try a category photo and finally an always-available local SVG.
    if (!failed.current.has(generic)) {
      setPhoto(generic);
    } else if (photo !== localIllustration) {
      setCredit(null);
      setPhoto(localIllustration);
    } else {
      event.currentTarget.onerror = null;
    }
    onError?.(event);
  };

  return <img
    ref={ref}
    src={photo || productIllustration(product?.name, product?.category)}
    alt={alt || product?.name || "Product"}
    title={credit ? `Photo source: ${credit.source} · ${credit.license}` : undefined}
    onError={handleError}
    {...props}
  />;
}
