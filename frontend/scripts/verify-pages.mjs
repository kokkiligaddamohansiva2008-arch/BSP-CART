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

// Regression guards for the production bugs reported in Admin / Checkout / Footer.
for (const page of ["AdminDashboard", "AdminUsers", "AdminProducts"]) {
  const body = read(`src/pages/${page}.jsx`);
  assert(body.includes("<AdminMenu />"), page + " uses the three-dot admin menu");
  assert(!body.includes("<Sidebar />"), page + " cannot overlap fixed sidebar");
}
assert(read("src/styles/admin.css").includes(".dashboard-layout.admin-page"),
  "Admin pages span full width without a fixed sidebar column");
assert(read("src/services/adminService.js").includes("total_amount"),
  "Admin order totals use actual database column");
assert(read("src/services/adminService.js").includes('.from("products")'),
  "Admin product and inventory metrics use database records only");
assert(read("src/components/layout/Footer.jsx").includes('functions.invoke("newsletter"'),
  "Footer subscribe calls the secure newsletter Edge Function");
assert(!read("src/components/layout/Footer.jsx").includes('.from("newsletter_subscribers")'),
  "Footer does not write into the RLS-protected newsletter table");
assert(read("src/components/layout/Footer.jsx").includes('from "../../utils/centeredSwal"'),
  "Footer alerts use centered popups above the navbar");
assert(read("src/pages/Products.jsx").includes('searchParams.get("deals")'),
  "Footer Deals link has a functioning product filter");
assert(read("src/utils/cartStore.js").includes('reason: "demo"'),
  "Demo listings never enter live checkout");
assert(read("src/pages/Cart.jsx").includes("Checkout unavailable"),
  "Unavailable carts cannot proceed to checkout");
assert(read("src/pages/Checkout.jsx").includes("blockedLines"),
  "Checkout warns about preview items before collecting details");

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


// Footer link navigation and floating shopping assistant regression checks.
assert(read("src/App.jsx").includes("<ScrollToTop />"),
  "Internal routes automatically scroll to the top");
assert(read("src/components/layout/Footer.jsx").includes("onClickCapture"),
  "Same-page footer links also move up to the page header");
assert(read("src/App.jsx").includes("<ProductChatbot />"),
  "Product chatbot is available across BSP CART pages");
assert(read("src/components/ProductPhoto.jsx").includes("No AI key") === false,
  "Product images are handled locally without unrelated AI lookups");
assert(!read("src/components/ProductPhoto.jsx").includes("commons.wikimedia.org/w/api.php"),
  "Product photos are not fetched using unreliable fuzzy image searches");

// Validate all actual sample catalogue category slugs and deep-link targets.
const { ADDITIONAL_CATEGORIES } = await import("../src/data/additionalProducts.js");
const { matchesCategory, CATEGORY_GROUPS } = await import("../src/data/categoryUtils.js");
const { findProducts, parseComparison, findBestProduct } =
  await import("../src/utils/productAssistant.js");
const leaves = new Set(ADDITIONAL_CATEGORIES.map((c) => c.id));
assert(leaves.size === 18, "18 unique product subcategories");
assert(ADDITIONAL_PRODUCTS.every((p) => leaves.has(p.category)),
  "Every catalogue product belongs to a linked subcategory");
let incorrectMatches = 0;
for (const product of ADDITIONAL_PRODUCTS) {
  for (const id of leaves) {
    if (id !== product.category && matchesCategory(product, id)) incorrectMatches++;
  }
}
assert(incorrectMatches === 0, "Product category links do not show unrelated products");
const searchSamples = [
  ["Cars", "auto-and-travel"], ["Tools", "tools-and-hardware"],
  ["Fashion", "fashion"], ["Groceries", "grocery"],
  ["Floor cleaners", "household-and-cleaning"],
  ["Stationery", "stationery-and-office"],
  ["Personal care", "personal-care"],
  ["Electronics", "electronics"], ["Accessories", "electronics-and-accessories"],
];
for (const [question, selected] of searchSamples) {
  const results = findProducts(question, ADDITIONAL_PRODUCTS, 5);
  assert(results.length > 0, "Chatbot finds " + question);
  assert(results.every((p) => matchesCategory(p, selected)),
    "Chatbot finds matching " + question + " category products");
}
assert(Boolean(parseComparison("compare basmati rice vs brown rice")),
  "Chatbot understands product comparison questions");
assert(findBestProduct("basmati rice", ADDITIONAL_PRODUCTS)?.name === "Basmati Rice",
  "Chatbot comparison resolves an exact matching product name");

console.log("\nBSP CART route and UI static checks completed.");
