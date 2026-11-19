import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiMessageCircle, FiX, FiSend, FiColumns, FiSearch } from "react-icons/fi";
import { PRODUCTS, onProductsChanged } from "../data/catalog";
import { findProducts, findBestProduct, parseComparison, productIsOrderable } from "../utils/productAssistant";
import { isProductVisible } from "../data/imageVisibility";
import "./ProductChatbot.css";

const rupees = (amount) => "₹" + Number(amount || 0).toLocaleString("en-IN");
const examples = ["Groceries", "Cars", "Tools", "Fashion", "Floor cleaners", "Stationery", "Personal care", "Electronics"];

function SummaryProduct({ item, addCompare, close }) {
  return (
    <div className="bot-result" key={item.id}>
      <div className="bot-result-info">
        <Link to={`/products/${item.id}`} onClick={close}>{item.name}</Link>
        <span>{rupees(item.price)} · {productIsOrderable(item) ? "Available" : "Preview / unavailable"}</span>
      </div>
      <button type="button" onClick={() => addCompare(item)} aria-label={`Select ${item.name} for comparison`}>
        <FiColumns aria-hidden="true" /> Compare
      </button>
    </div>
  );
}

function Comparison({ products, close }) {
  const [first, second] = products;
  if (!first || !second) return null;
  const fields = [
    ["Price", rupees(first.price), rupees(second.price)],
    ["Category", String(first.category || "—").replace(/-/g, " "), String(second.category || "—").replace(/-/g, " ")],
    ["Stock", productIsOrderable(first) ? String(first.stock) : "Unavailable", productIsOrderable(second) ? String(second.stock) : "Unavailable"],
    ["Rating", first.rating ? `${first.rating}/5` : "Not rated", second.rating ? `${second.rating}/5` : "Not rated"],
  ];
  return (
    <div className="bot-comparison">
      <div className="bot-comparison-title">Side-by-side catalogue comparison</div>
      <div className="bot-compare-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th><Link onClick={close} to={`/products/${first.id}`}>{first.name}</Link></th>
              <th><Link onClick={close} to={`/products/${second.id}`}>{second.name}</Link></th>
            </tr>
          </thead>
          <tbody>
            {fields.map(([label, left, right]) => (
              <tr key={label}><th>{label}</th><td>{left}</td><td>{right}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Prices, ratings and stock come from the current BSP CART catalogue. Preview listings cannot be ordered.</p>
    </div>
  );
}

// Local product-search chatbot. No external AI key or customer data is sent away.
export default function ProductChatbot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState(0);
  const [selected, setSelected] = useState([]);
  const [messages, setMessages] = useState([
    { kind: "bot", text: "Hello! Search products by name or category, or ask me to compare two products. Try “cars”, “tools”, or “compare basmati rice vs brown rice”." },
  ]);
  const logRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => onProductsChanged(() => setVersion((old) => old + 1)), []);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (open && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open, selected]);

  const close = () => setOpen(false);
  const addCompare = (product) => {
    setSelected((items) => {
      if (items.some((p) => p.id === product.id)) return items;
      return [...items.slice(-1), product];
    });
  };

  const ask = (input) => {
    const text = String(input || "").trim();
    if (!text) return;
    const catalog = PRODUCTS.filter(isProductVisible);
    const comparison = parseComparison(text);
    let answer;
    if (comparison) {
      const first = findBestProduct(comparison[0], catalog);
      const second = findBestProduct(comparison[1], catalog);
      if (first && second && first.id !== second.id) {
        answer = { kind: "bot", text: "Here is a comparison from the current catalogue:", pair: [first, second] };
        setSelected([first, second]);
      } else {
        answer = { kind: "bot", text: "I could not identify two different products. Search for each item and use its Compare button, or type “compare tomato vs potato”." };
      }
    } else if (/^\s*(compare|comparison)\b/i.test(text)) {
      answer = { kind: "bot", text: "To compare, enter two product names, for example “compare basmati rice vs brown rice”. Or search for products and select Compare beside each one." };
    } else {
      const items = findProducts(text, catalog, 5);
      answer = items.length
        ? { kind: "bot", text: `Found ${items.length} matching catalogue products. Open a product or select two to compare:`, items }
        : { kind: "bot", text: "No catalogue matches found. Try a product name or category such as grocery, tools, cars, fashion, stationery, personal care, electronics, or accessories." };
    }
    setMessages((old) => [...old.slice(-18), { kind: "user", text }, answer]);
    setQuery("");
  };

  const submit = (event) => {
    event.preventDefault();
    ask(query);
  };
  // Read the catalogue version so new seller products become available on rerender.
  void version;

  return (
    <div className="bsp-bot-root">
      {!open && (
        <button className="bsp-bot-fab" type="button" onClick={() => setOpen(true)} aria-label="Open product search and comparison chatbot">
          <FiMessageCircle size={23} aria-hidden="true" />
          <span>Ask BSP</span>
        </button>
      )}
      {open && (
        <section className="bsp-bot-panel" role="dialog" aria-modal="false" aria-label="BSP CART product chatbot">
          <header className="bsp-bot-header">
            <div><FiMessageCircle aria-hidden="true" /> <strong>BSP Product Assistant</strong><small>Search and compare products</small></div>
            <button type="button" onClick={close} aria-label="Close product chatbot"><FiX aria-hidden="true" /></button>
          </header>
          <div className="bsp-bot-messages" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message, index) => (
              <div key={index} className={`bsp-bot-message ${message.kind === "user" ? "is-user" : "is-bot"}`}>
                <p>{message.text}</p>
                {message.items?.map((item) => (
                  <SummaryProduct key={item.id} item={item} addCompare={addCompare} close={close} />
                ))}
                {message.pair && <Comparison products={message.pair} close={close} />}
              </div>
            ))}
            {selected.length > 0 && (
              <div className="bsp-bot-selected">
                <strong>Compare selected ({selected.length}/2)</strong>
                <div>{selected.map((p) => <span key={p.id}>{p.name}</span>)}</div>
                {selected.length === 2 && <Comparison products={selected} close={close} />}
                <button type="button" onClick={() => setSelected([])}>Clear selection</button>
              </div>
            )}
          </div>
          <div className="bsp-bot-suggestions" aria-label="Popular searches">
            {examples.map((name) => (
              <button type="button" key={name} onClick={() => ask(name)}>{name}</button>
            ))}
          </div>
          <form className="bsp-bot-form" onSubmit={submit}>
            <FiSearch aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find rice, compare phones..."
              aria-label="Search or compare products"
              maxLength={120}
            />
            <button type="submit" disabled={!query.trim()} aria-label="Send product question">
              <FiSend aria-hidden="true" />
            </button>
          </form>
          <div className="bsp-bot-disclaimer">Catalogue-powered assistant · No AI-generated recommendations or live payment data</div>
        </section>
      )}
    </div>
  );
}
