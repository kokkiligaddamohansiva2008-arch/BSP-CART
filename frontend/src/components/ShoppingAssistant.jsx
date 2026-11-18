import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PRODUCTS } from "../data/catalog";

/*
 * Catalogue-grounded shopping assistant.
 * No unconfigured paid AI service, external prompts, or invented products.
 * Product availability and prices come from the loaded BSP CART catalogue.
 */
const starters = ["Show headphones", "Grocery under ₹200", "Best rated in-stock products"];
const INITIAL = { role: "assistant", text: "Hi! I can help you find BSP CART products by name, category, budget and rating. What are you shopping for?", matches: [] };
const lower = value => String(value || "").toLowerCase();
const cost = value => Number(value) || 0;
const STOP = new Set(["show", "me", "find", "search", "buy", "shop", "please", "want", "need", "for", "a", "an", "the", "products", "product", "items", "item", "under", "below", "less", "than", "over", "above", "more", "best", "rated", "top", "good", "cheapest", "affordable", "between", "rupees", "rs", "in", "stock", "available", "price"]);
export function recommendCatalogueProducts(request, catalogue = PRODUCTS) {
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
  const terms = normalized.split(/[^a-z0-9]+/g).filter(t => t.length > 1 && !STOP.has(t) && !/^\d+$/.test(t));
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
function assistantAnswer(input) {
  const text = lower(input);
  if (/^(hello|hi|hey|help)$/.test(text.trim())) return { text: INITIAL.text, matches: [] };
  if (/delivery|shipping|track my order/.test(text)) return { text: "For your order's current status, open My Orders. Carrier GPS tracking is not connected.", matches: [], href: "/orders", link: "View orders" };
  if (/refund|return|exchange/.test(text)) return { text: "You can review BSP CART's return policy here.", matches: [], href: "/return-policy", link: "Read return policy" };
  const matches = recommendCatalogueProducts(input);
  if (!matches.length) return { text: "I couldn't find an exact catalogue match. Try a different product name or price range.", matches: [] };
  return { text: "Here are catalogue matches. Prices, ratings and stock are based on the currently loaded listings.", matches };
}
export default function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([INITIAL]);
  const logRef = useRef(null);
  useEffect(() => {
    if (open && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open]);
  const send = (text) => {
    const query = String(text || "").trim().slice(0, 250);
    if (!query) return;
    setMessages(prev => [...prev.slice(-11), { role: "user", text: query }, { role: "assistant", ...assistantAnswer(query) }]);
    setInput("");
    setOpen(true);
  };
  return (
    <aside aria-label="BSP CART shopping assistant" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 1200, maxWidth: "calc(100vw - 32px)", fontFamily: "inherit" }}>
      {open && (
        <div style={{ width: 355, maxWidth: "100%", height: "min(560px, calc(100vh - 110px))", background: "#fff", display: "flex", flexDirection: "column", borderRadius: 14, overflow: "hidden", border: "1px solid #d7d0c5", boxShadow: "0 10px 38px #202a4430", marginBottom: 8 }}>
          <header style={{ background: "#202a44", color: "white", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><strong>BSP CART Shopping Assistant</strong><div style={{ fontSize: 11, opacity: .85 }}>Catalogue-powered • no external AI model</div></div>
            <button type="button" onClick={() => setOpen(false)} style={{ color: "white", border: "none", background: "transparent", fontSize: 23 }} aria-label="Close assistant">×</button>
          </header>
          <div ref={logRef} role="log" aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: 12, background: "#faf8f4" }}>
            {messages.map((message, i) => (
              <div key={i} style={{ marginBottom: 12, textAlign: message.role === "user" ? "right" : "left" }}>
                <div style={{ display: "inline-block", maxWidth: "95%", borderRadius: 10, padding: "9px 11px", background: message.role === "user" ? "#202a44" : "#fff", color: message.role === "user" ? "#fff" : "#243047", fontSize: 13, textAlign: "left" }}>
                  {message.text}
                  {message.href && <div style={{ marginTop: 7 }}><Link to={message.href} onClick={() => setOpen(false)}>{message.link}</Link></div>}
                  {!!message.matches?.length && (
                    <div style={{ marginTop: 9, display: "grid", gap: 7 }}>
                      {message.matches.map(product => (
                        <Link key={product.id} to={"/products/" + product.id} onClick={() => setOpen(false)}
                          style={{ textDecoration: "none", display: "flex", gap: 8, alignItems: "center", border: "1px solid #eee", padding: 6, borderRadius: 8, color: "#202a44" }}>
                          <img src={product.image || "/images/products/product-fallback.svg"} alt="" width="44" height="44" loading="lazy"
                            style={{ objectFit: "cover", borderRadius: 6 }} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = "/images/products/product-fallback.svg"; }} />
                          <span><strong style={{ fontSize: 12 }}>{product.name}</strong><br/><span style={{ fontSize: 12 }}>₹{Number(product.price).toLocaleString("en-IN")} • {product.stock > 0 ? "In stock" : "Out of stock"}</span></span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 1 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{starters.map(q => <button type="button" key={q} onClick={() => send(q)} style={{ border: "1px solid #c9baab", background: "#fff", borderRadius: 16, padding: "6px 9px", fontSize: 12 }}>{q}</button>)}</div>}
          </div>
          <form onSubmit={e => { e.preventDefault(); send(input); }} style={{ display: "flex", gap: 6, padding: 9, borderTop: "1px solid #e7e1d8" }}>
            <input aria-label="Ask shopping assistant" value={input} onChange={e => setInput(e.target.value)} maxLength={250} placeholder="Find products or set a budget…" style={{ minWidth: 0, flex: 1, border: "1px solid #d0c8bd", borderRadius: 7, padding: 8, fontSize: 13 }}/>
            <button type="submit" disabled={!input.trim()} style={{ border: 0, color: "#fff", background: "#202a44", padding: "7px 12px", borderRadius: 7 }}>Send</button>
          </form>
        </div>
      )}
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="shopping-assistant-panel"
        style={{ float: "right", background: "#202a44", color: "#fff", border: "none", borderRadius: 28, padding: "12px 18px", boxShadow: "0 4px 15px #202a4455", fontWeight: 600 }}>
        {open ? "Close assistant" : "Ask BSP CART"}
      </button>
    </aside>
  );
}
