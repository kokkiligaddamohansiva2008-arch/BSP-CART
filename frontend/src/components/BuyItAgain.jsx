import { useMemo } from "react";
import { Link } from "react-router-dom";
import { getProductById, formatINR } from "../data/catalog";
import { getBuyAgainProductIds } from "../utils/bspStorage";
import "./Personalization.css";

/*
|--------------------------------------------------------------------------
| BuyItAgain — Amazon-style reorder shelf
|--------------------------------------------------------------------------
| Reads mock order history from localStorage ("bsp_orders"). If a shopper
| has never ordered anything yet (fresh browser, no mock orders seeded),
| the section renders nothing rather than an awkward empty state — this
| is a "returning customer" feature, not something new users need to see.
*/

export default function BuyItAgain({ limit = 6 }) {
  const products = useMemo(() => {
    return getBuyAgainProductIds(limit)
      .map(getProductById)
      .filter(Boolean);
  }, [limit]);

  if (products.length === 0) return null;

  return (
    <section className="bsp-section">
      <div className="bsp-section-head">
        <h2>Buy it again</h2>
        <span className="bsp-section-sub">From your past orders</span>
      </div>
      <div className="bsp-scroll-row">
        {products.map((p) => (
          <Link className="bsp-mini-card" to={`/products/${p.id}`} key={p.id}>
            <img src={p.image} alt={p.name} loading="lazy" />
            <p className="bsp-mini-name">{p.name}</p>
            <div className="bsp-mini-price-row">
              <span className="bsp-mini-price">{formatINR(p.price)}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
