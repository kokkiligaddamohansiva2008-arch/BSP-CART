// Deterministic, catalogue-grounded shopping suggestions. No model or external service.
const lower = value => String(value || "").toLowerCase();
const cost = value => Number(value) || 0;
const STOP = new Set(["show", "me", "find", "search", "buy", "shop", "please", "want", "need", "for", "a", "an", "the", "products", "product", "items", "item", "under", "below", "less", "than", "over", "above", "more", "best", "rated", "top", "good", "cheapest", "affordable", "between", "rupees", "rs", "in", "stock", "available", "price"]);
export function recommendCatalogueProducts(request, catalogue = []) {
  const text = lower(request);
  const normalized = text.replace(/[,₹]/g, "");
  const numbers = [...normalized.matchAll(/(?:rs\.?\s*|inr\s*|₹\s*)?(\d+(?:\.\d+)?)/gi)].map(m => Number(m[1]));
  const maxMatch = normalized.match(/(?:under|below|less than|up to|upto|budget of|within)\s*(?:rs\.?\s*|inr\s*)?(\d+(?:\.\d+)?)/);
  const minMatch = normalized.match(/(?:over|above|more than)\s*(?:rs\.?\s*|inr\s*)?(\d+(?:\.\d+)?)/);
  const between = normalized.match(/between\s*(?:rs\.?\s*|inr\s*)?(\d+)\s*(?:and|to|-)\s*(?:rs\.?\s*|inr\s*)?(\d+)/);
  const max = between ? Number(between[2]) : maxMatch ? Number(maxMatch[1]) : null;
  const min = between ? Number(between[1]) : minMatch ? Number(minMatch[1]) : null;
  const needsStock = /in.stock|available|buy now|ready to ship/i.test(text);
  const budgetOnly = numbers.length > 0 && normalized.split(/\s+/).filter(t => !STOP.has(t) && !/^\d+$/.test(t)).length === 0;
  const terms = normalized.split(/[^a-z0-9]+/g).filter(t => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t)).map(t => t === "grocery" ? "grocer" : t);
  const ranked = catalogue.filter(p => {
    const price = cost(p.price);
    if (max != null && price > max) return false;
    if (min != null && price < min) return false;
    if (needsStock && cost(p.stock) <= 0) return false;
    if (!terms.length || budgetOnly) return true;
    const haystack = lower([p.name, p.category, p.description, p.brand].filter(Boolean).join(" "));
    return terms.every(t => haystack.includes(t)) || terms.some(t => lower(p.name).includes(t));
  }).map(p => {
    const name = lower(p.name);
    return { product: p, rank: terms.reduce((score, term) => score + (name.includes(term) ? 4 : lower(p.category).includes(term) ? 2 : 0), 0) };
  });
  if (/cheapest|low price|lowest/i.test(text)) ranked.sort((a, b) => cost(a.product.price) - cost(b.product.price));
  else ranked.sort((a, b) => b.rank - a.rank || cost(b.product.rating) - cost(a.product.rating) || cost(a.product.price) - cost(b.product.price));
  return ranked.slice(0, 5).map(x => x.product);
}
export function assistantAnswer(input, catalogue = []) {
  const text = lower(input);
  if (/^(hello|hi|hey|help)$/.test(text.trim())) return { text: "Hi! I can help you find products by name, budget, and rating.", matches: [] };
  if (/delivery|shipping|track my order/.test(text)) return { text: "For your order's current status, open My Orders. Carrier GPS tracking is not connected.", matches: [], href: "/orders", link: "View orders" };
  if (/refund|return|exchange/.test(text)) return { text: "You can review BSP CART's return policy here.", matches: [], href: "/return-policy", link: "Read return policy" };
  const matches = recommendCatalogueProducts(input, catalogue);
  if (!matches.length) return { text: "I couldn't find an exact catalogue match. Try a different product name or price range.", matches: [] };
  return { text: "Here are catalogue matches. Prices, ratings and stock are based on the currently loaded listings.", matches };
}
