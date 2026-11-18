#!/usr/bin/env node
/**
 * BSP CART photo integrity report.
 * Usage:
 *   npm run images:audit                (quick offline report)
 *   npm run images:audit -- --remote    (check Commons URLs; network required)
 *   npm run images:audit -- --strict    (fail if any product has no real photo)
 *
 * This audits all owner-supplied sample listings; imported Supabase rows
 * and seller-uploaded assets require a separate authenticated catalogue audit.
 * An image that loads is NOT necessarily a name/variant match: review visually.
 */
import { ADDITIONAL_PRODUCTS } from "../src/data/additionalProducts.js";
import { PRODUCT_PHOTOS } from "../src/data/productImages.js";

const args = new Set(process.argv.slice(2));
const expected = new Set();
const missing = [];
const urls = new Map();
const badMappings = [];
const localAssets = [];
const slug = value => String(value || "").toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const { existsSync } = await import("node:fs");
const { join, dirname } = await import("node:path");
const { fileURLToPath } = await import("node:url");
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const item of ADDITIONAL_PRODUCTS) {
  const candidates = [String(item.id), "name:" + slug(item.name)];
  candidates.forEach(key => expected.add(key));
  const photo = candidates.map(key => PRODUCT_PHOTOS[key]).find(Boolean);
  if (!photo) { missing.push(item.name + " (" + item.category + ")"); continue; }
  if (/^https?:\/\//i.test(photo)) {
    if (!urls.has(photo)) urls.set(photo, []);
    urls.get(photo).push(item.name);
  } else {
    const path = join(root, "public", "images", "products", photo);
    localAssets.push(photo);
    if (!existsSync(path)) badMappings.push(item.name + ": missing local file " + photo);
  }
}
for (const key of Object.keys(PRODUCT_PHOTOS)) {
  if (!expected.has(key) && !/^-?\d+$/.test(key)) badMappings.push("Unused manifest key: " + key);
}
const reusedUrls = [...urls].filter(([,products]) => products.length > 1);
console.log("BSP CART product photo audit");
console.log("Sample catalogue listings:", ADDITIONAL_PRODUCTS.length);
console.log("Mappings to photographs:", ADDITIONAL_PRODUCTS.length - missing.length);
console.log("Missing real photographs:", missing.length);
console.log("Broken/local/unused manifest entries:", badMappings.length);
console.log("Shared remote URLs:", reusedUrls.length);
for (const issue of badMappings) console.error("ERROR", issue);
for (const [url, names] of reusedUrls) console.warn("REVIEW: one photo represents", names.join(", "), url);
if (missing.length) {
  console.log("\nFirst 30 products awaiting real photos:");
  missing.slice(0,30).forEach(s => console.log(" -", s));
}
let remoteFailures = 0;
if (args.has("--remote")) {
  console.log("\nChecking remote URLs. This does not verify visual matches or licenses.");
  for (const [url] of urls) {
    try {
      const response = await fetch(url, { method: "GET", headers: { "Range": "bytes=0-1023" }, signal: AbortSignal.timeout(12000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
        remoteFailures++;
        console.error("NOT IMAGE / UNAVAILABLE", response.status, url);
      }
      await response.body?.cancel();
    } catch(e) { remoteFailures++; console.error("REMOTE ERROR", e.message, url); }
  }
}
if (badMappings.length || remoteFailures || (args.has("--strict") && missing.length)) process.exitCode = 1;
