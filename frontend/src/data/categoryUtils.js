/**
 * Shared category classification for Home and the Products page.
 * Parent categories include their subcategories, without assigning products
 * to unrelated groups. Individual category filters always match exactly.
 */
export const CATEGORY_GROUPS = {
  grocery: [
    "groceries-and-staples",
    "snacks-and-beverages",
    "dairy-and-bakery",
    "fruits-and-vegetables",
  ],
  electronics: ["electronics-and-accessories"],
  fashion: ["men-s-fashion", "women-s-fashion"],
  home: [
    "home-decor-and-furnishing",
    "kitchen-and-dining",
    "household-and-cleaning",
  ],
};

export const normalizeCategory = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function matchesCategory(product, selectedCategory) {
  const selected = normalizeCategory(selectedCategory) || "all";
  if (selected === "all") return true;

  const current = normalizeCategory(product?.category);
  return current === selected || (CATEGORY_GROUPS[selected] || []).includes(current);
}

export function countProductsInCategory(products, selectedCategory) {
  return products.filter((product) => matchesCategory(product, selectedCategory)).length;
}
