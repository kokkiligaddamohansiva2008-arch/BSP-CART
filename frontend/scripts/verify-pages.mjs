import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");
const assert = (value, description) => {
  if (!value) throw new Error("FAIL: " + description);
  process.stdout.write("PASS: " + description + "\n");
};

const router = read("src/routes/AppRoutes.jsx");
const expected = [
  "/", "/login", "/register", "/products", "/products/:id",
  "/help-center", "/privacy-policy", "/terms", "/return-policy", "/faqs",
  "/cart", "/checkout", "/orders", "/profile", "/buyer/dashboard",
  "/seller/dashboard", "/admin/dashboard", "/admin/users", "/admin/products", "*",
];
const routes = [...router.matchAll(/<Route\b[^>]*?path="([^"]+)"/g)].map((m) => m[1]);
for (const route of expected) assert(routes.includes(route), "Route exists: " + route);

const pageImports = [...router.matchAll(/["'](\.\.\/pages\/[^"']+)["']/g)];
const targets = [...new Set(pageImports.map((m) => m[1]))];
for (const relative of targets) {
  const src = path.resolve(root, "src/routes", relative);
  assert(existsSync(src + ".jsx") || existsSync(src + ".js"), "Route target exists: " + relative);
}

const checkPages = (dir) => {
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) { checkPages(relative); continue; }
    if (!/\.jsx?$/.test(entry.name)) continue;
    const contents = read(relative);
    assert(!/from\s*["']sweetalert2["']/.test(contents),
      "Popup on " + relative + " uses centered wrapper or no popup");
  }
};
checkPages("src/pages");
assert(read("src/utils/centeredSwal.js").includes('position: "center"'), "Shared popups centered");
assert(!/position:\s*fixed\s*;/.test(read("src/styles/sidebar.css")), "Sidebar is not fixed above page content");
assert(read("src/styles/dashboard.css").includes("grid-template-columns"), "Dashboard reserves navigation column");
assert(read("src/styles/theme.css").includes("body .swal2-container"), "Popups appear above navbar");
assert(read("src/pages/Products.jsx").includes("matchesCategory(product, category)"), "Product category filtering");
assert(read("src/pages/Home.jsx").includes('params.set("category", category)'), "Homepage category routing");

// The sample catalogue must never map two different product names to the
// same category banner or fallback image. Verified uploaded images still win.
const { ADDITIONAL_PRODUCTS } = await import("../src/data/additionalProducts.js");
const { matchingProductVisual } = await import("../src/data/productVisuals.js");
const uniqueUrls = new Map();
for (const product of ADDITIONAL_PRODUCTS) {
  const url = matchingProductVisual(product.name, product.category, product.id);
  const key = String(product.category) + "/" + String(product.name);
  const previous = uniqueUrls.get(url);
  assert(!previous || previous === key, "Unique catalogue image: " + key);
  uniqueUrls.set(url, key);
}
assert(ADDITIONAL_PRODUCTS.length === 360, "360 sample products have image mappings");
assert(!read("src/components/ProductPhoto.jsx").includes("genericPhoto("),
  "Product photos never fall back to reused category banners");

console.log("\nBSP CART route and UI static checks completed.");
