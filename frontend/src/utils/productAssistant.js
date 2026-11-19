import { matchesCategory } from "../data/categoryUtils.js";

export const normalizeWords = (value) => String(value || "")
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim()
  .replace(/\s+/g, " ");

const STOP_WORDS = new Set(["please", "show", "me", "find", "search", "for", "products",
  "product", "items", "item", "in", "the", "a", "an", "of", "can", "you",
  "give", "list", "all", "want", "need", "looking", "some", "from", "shop"]);

const CATEGORY_HINTS = [
  { words: /\b(cars?|automotive|automobile|vehicles?|bikes?|travel)\b/, id: "auto-and-travel" },
  { words: /\b(tools?|hardware|drills?|hammers?|screwdrivers?)\b/, id: "tools-and-hardware" },
  { words: /\b(stationary|stationery|school supplies|office supplies)\b/, id: "stationery-and-office" },
  { words: /\b(personal care|skin care|shampoo|soap|toothpaste)\b/, id: "personal-care" },
  { words: /\b(floor cleaner|floor items|mops?|brooms?|household cleaning)\b/, id: "household-and-cleaning" },
  { words: /\b(electronics?|mobile accessories|earphones|headphones|chargers?)\b/, id: "electronics" },
  { words: /\b(fashion|clothes|clothing|dresses?|shirts?|sarees?)\b/, id: "fashion" },
  { words: /\b(groceries|grocery|food staples)\b/, id: "grocery" },
  { words: /\b(fruits?|vegetables?)\b/, id: "fruits-and-vegetables" },
  { words: /\b(kitchen|utensils?|cookware)\b/, id: "kitchen-and-dining" },
  { words: /\b(furniture|home decor)\b/, id: "home" },
];

const requestedCategory = (query) => {
  const text = normalizeWords(query);
  return CATEGORY_HINTS.find(({ words }) => words.test(text))?.id || null;
};

export function findProducts(query, products, limit = 5) {
  const text = normalizeWords(query);
  const keywords = text.split(" ").filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  const category = requestedCategory(query);
  const scored = (products || []).map((p) => {
    const name = normalizeWords(p.name);
    const categoryText = normalizeWords(p.category);
    const description = normalizeWords(p.description);
    const corpus = name + " " + categoryText + " " + description;
    const exact = name === text || (keywords.length > 0 && name === keywords.join(" "));
    const count = keywords.filter((word) => corpus.includes(word)).length;
    const nameMatches = keywords.filter((word) => name.includes(word)).length;
    const categoryMatch = category && matchesCategory(p, category);
    let score = (exact ? 100 : 0) + nameMatches * 12 + count * 3;
    if (text && name.includes(text)) score += 24;
    if (categoryMatch) score += 24;
    if (keywords.length > 1 && nameMatches === keywords.length) score += 24;
    if (!keywords.length && categoryMatch) score += 20;
    if (Number(p.id) > 0 && Number(p.stock) > 0) score += 4;
    return { product: p, score };
  }).filter((x) => x.score > 3);
  scored.sort((a, b) => b.score - a.score ||
    Number(b.product.stock > 0) - Number(a.product.stock > 0) ||
    String(a.product.name).localeCompare(String(b.product.name)));
  return scored.slice(0, limit).map((x) => x.product);
}

export function findBestProduct(query, products) {
  const text = normalizeWords(query);
  const exact = products.find((p) => normalizeWords(p.name) === text);
  if (exact) return exact;
  return findProducts(query, products, 1)[0] || null;
}

export function parseComparison(text) {
  const match = String(text).trim().match(
    /^(?:compare|comparison between)\s+(.+?)\s+(?:vs\.?|versus|with|and)\s+(.+?)\s*$/i
  );
  return match ? [match[1].trim(), match[2].trim()] : null;
}

export const productIsOrderable = (p) => Number(p?.id) > 0
  && !p?.isSampleCatalogProduct && Number(p?.stock) > 0;
